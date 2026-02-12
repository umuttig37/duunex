'use client';

import type { CategoryRow } from '@/components/features/tasks/booking/category-selection';
import type { TaskerDisplayProfile } from '@/components/features/tasks/booking/tasker-selection';
import TaskerSelection from '@/components/features/tasks/booking/tasker-selection';
import { categoriesWithIcons } from '@/constants/categories-with-icons';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface TaskDetails {
  id: string;
  title: string;
  description: string;
  category: CategoryRow;
  latitude: number;
  longitude: number;
  budget?: number | null;
}

export default function NearbyTaskersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null);
  const [selectedTasker, setSelectedTasker] = useState<TaskerDisplayProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'warning', message: string} | null>(null);

  const taskId = searchParams.get('taskId');
  const categorySlug = searchParams.get('category');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius');

  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!taskId) {
        setError('Tehtävän ID puuttuu');
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        
        // Fetch task details
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            description,
            budget,
            categories:categories!tasks_category_id_fkey (
              id,
              name_fi,
              slug
            )
          `)
          .eq('id', taskId)
          .single();

        if (taskError) {
          throw new Error('Tehtävän tietojen haku epäonnistui');
        }

        if (task) {
          // Use category from join, or fallback from URL slug when DB category is missing (e.g. prod seed not run)
          let category: CategoryRow | null = (task.categories as CategoryRow) ?? null;
          if (!category && categorySlug) {
            const fromConstants = categoriesWithIcons.find(c => c.slug === categorySlug);
            if (fromConstants) {
              category = {
                id: fromConstants.id,
                name_fi: fromConstants.name_fi,
                slug: fromConstants.slug,
              } as CategoryRow;
            }
          }
          if (category) {
            setTaskDetails({
              id: task.id,
              title: task.title,
              description: task.description,
              category,
              latitude: parseFloat(lat || '0'),
              longitude: parseFloat(lng || '0'),
              budget: task.budget
            });
          }
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
        setError(error instanceof Error ? error.message : 'Virhe tehtävän haussa');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId, categorySlug, lat, lng]);

  const handleSelectTasker = (tasker: TaskerDisplayProfile) => {
    setSelectedTasker(tasker);
  };

  const handleSendRequest = async () => {
    if (!selectedTasker || !taskDetails) return;
    
    setIsSubmitting(true);
    setNotification(null); // Clear any previous notifications

    try {
      const supabase = createClient();
      
      // Check if this is a direct selection based on task posting_type
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('posting_type, status')
        .eq('id', taskDetails.id)
        .single();

      if (taskError) {
        throw new Error('Tehtävän tietojen haku epäonnistui');
      }

      // Validate task is in correct state for selection
      if (task.status !== 'open') {
        throw new Error('Tämä tehtävä ei ole enää saatavilla valintaa varten');
      }

      // Check for existing offer first to prevent 409 conflicts
      const { data: existingOffer, error: offerCheckError } = await supabase
        .from('task_offers')
        .select('id, status')
        .eq('task_id', taskDetails.id)
        .eq('tasker_id', selectedTasker.id)
        .maybeSingle(); // Use maybeSingle to avoid error when no record exists

      if (offerCheckError) {
        console.error('Error checking existing offers:', offerCheckError);
        throw new Error('Tarjousten tarkistaminen epäonnistui');
      }

      // Handle existing offer scenarios
      if (existingOffer) {
        if (existingOffer.status === 'pending') {
          // Already has pending offer, show notification instead of redirect
          setNotification({
            type: 'warning',
            message: 'Olet jo lähettänyt pyynnön tälle tekijälle. Odota vastausta.'
          });
          setIsSubmitting(false);
          return;
        } else if (['accepted', 'declined', 'withdrawn'].includes(existingOffer.status)) {
          // Offer was previously processed, allow new offer
          // This will be handled by the insert below
        }
      }

      if (task.posting_type === 'direct') {
        // Direct selection: Send direct task request to selected tasker
        // Ensure we have a valid budget for direct offers
        const offerPrice = taskDetails.budget && taskDetails.budget > 0 ? taskDetails.budget : null;
        
        if (!offerPrice) {
          throw new Error('Tehtävältä puuttuu budjetti. Palaa takaisin ja aseta budjetti.');
        }
        
        const { error: offerError } = await supabase
          .from('task_offers')
          .insert({
            task_id: taskDetails.id,
            tasker_id: selectedTasker.id,
            status: 'pending',
            message: `Suora tehtäväpyyntö: ${taskDetails.title}`,
            offered_price: offerPrice,
          });

        // Handle specific database errors
        if (offerError) {
          if (offerError.code === '23505') { // Unique constraint violation
            // This should be rare now due to our check above, but handle gracefully
            console.warn('Duplicate offer detected despite check:', offerError);
            setNotification({
              type: 'warning',
              message: 'Olet jo lähettänyt pyynnön tälle tekijälle. Odota vastausta.'
            });
            setIsSubmitting(false);
            return;
          } else {
            console.error('Task offer creation error:', offerError);
            throw new Error('Tehtäväpyynnön lähettäminen epäonnistui');
          }
        }

        // Only update task status if offer creation succeeded
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ 
            status: 'request_sent'
          })
          .eq('id', taskDetails.id);

        if (updateError) {
          console.error('Task status update error:', updateError);
          // Don't fail the whole operation - the offer was created successfully
          console.warn('Task status update failed, but offer was created. Manual intervention may be needed.');
        }

        // Show success notification and redirect
        setNotification({
          type: 'success',
          message: 'Tehtäväpyyntö lähetetty onnistuneesti! Tekijä saa ilmoituksen pyynnöstä.'
        });
        
        // Redirect after a short delay to show the success message
        setTimeout(() => {
          router.push(`/dashboard/tasks/${taskDetails.id}`);
        }, 2000);
      } else {
        // Regular open posting: Send task request
        const { error } = await supabase
          .from('task_offers')
          .insert({
            task_id: taskDetails.id,
            tasker_id: selectedTasker.id,
            status: 'pending',
            message: 'Tehtäväpyyntö',
            offered_price: taskDetails.budget || 0,
          });

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            setNotification({
              type: 'warning',
              message: 'Olet jo lähettänyt pyynnön tälle tekijälle. Odota vastausta.'
            });
            setIsSubmitting(false);
            return;
          } else {
            console.error('Task offer creation error:', error);
            throw new Error('Tehtäväpyynnön lähettäminen epäonnistui');
          }
        }

        // Update task status only if offer creation succeeded
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ status: 'request_sent' })
          .eq('id', taskDetails.id);

        if (updateError) {
          console.warn('Task status update failed for open posting, but offer was created.');
        }

        // Show success notification for open posting
        setNotification({
          type: 'success',
          message: 'Tehtäväpyyntö lähetetty onnistuneesti!'
        });
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push(`/dashboard/tasks/${taskDetails.id}`);
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error processing task request:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Virhe pyynnön käsittelyssä'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestLogin = () => {
    router.push('/login');
  };

  const handleSwitchToOpenPosting = () => {
    // Redirect back to task edit page with open posting mode
    router.push(`/dashboard/tasks/edit/${taskDetails?.id}?mode=open`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Ladataan lähistön tekijöitä...</p>
        </div>
      </div>
    );
  }

  if (error || !taskDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Virhe</h1>
          <p className="text-gray-600 mb-4">{error || 'Tehtävän tietoja ei löytynyt'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
          >
            Takaisin dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-responsive py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-1 mb-2">Valitse tekijä</h1>
              <p className="body-base text-gray-600">
                Tehtävä: {taskDetails.title}
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-outline"
            >
              Peruuta
            </button>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`border-l-4 p-4 mx-4 my-4 rounded-r-md ${
          notification.type === 'success' ? 'bg-green-50 border-green-400 text-green-700' :
          notification.type === 'error' ? 'bg-red-50 border-red-400 text-red-700' :
          'bg-amber-50 border-amber-400 text-amber-700'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {notification.type === 'success' && (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'error' && (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'warning' && (
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setNotification(null)}
                  className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    notification.type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' :
                    notification.type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' :
                    'text-amber-500 hover:bg-amber-100 focus:ring-amber-600'
                  }`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container-responsive py-8">
        <TaskerSelection
          category={taskDetails.category}
          taskLatitude={taskDetails.latitude}
          taskLongitude={taskDetails.longitude}
          searchRadiusKm={radius ? parseInt(radius, 10) : 5}
          budget={taskDetails.budget}
          onSelectTasker={handleSelectTasker}
          selectedTasker={selectedTasker}
          onRequestLogin={handleRequestLogin}
          onSwitchToOpenPosting={handleSwitchToOpenPosting}
        />

        {/* Selected Tasker Actions */}
        {selectedTasker && (
          <div className="mt-8 bg-white p-6 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="heading-3 mb-2">
                  Valittu tekijä: {selectedTasker.first_name} {selectedTasker.last_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Lähetä tehtäväpyyntö valitulle tekijälle
                </p>
              </div>
              <button
                onClick={handleSendRequest}
                disabled={isSubmitting}
                className={`btn-primary flex items-center gap-2 ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? 'Lähetetään...' : 'Lähetä pyyntö'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
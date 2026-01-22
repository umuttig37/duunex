'use client';

import type { CategoryWithIcon } from '@/constants/categories-with-icons';
import { categoriesWithIcons } from '@/constants/categories-with-icons';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ModernTaskBookingFlow from './modern-task-booking-flow';

interface TaskFormData {
  description: string;
  location_text: string;
  latitude?: number | null;
  longitude?: number | null;
  // @deprecated - No longer used for task creation. Service radius is configured by taskers in their profile.
  service_radius_km?: number | null;
  budget: number | null;
  scheduled_date: Date | null;
  scheduled_time_slot: 'morning' | 'afternoon' | 'evening' | 'flexible' | null;
  image_urls: string[];
  image_files?: File[]; // Store actual File objects for upload later
  dynamic_answers: Record<string, any>;
}

type PublishingMode = 'open' | 'direct';

interface TaskCompletionData {
  category: CategoryWithIcon;
  formData: TaskFormData;
  publishingMode: PublishingMode;
  template?: {
    id: string;
    name_fi: string;
    description_fi: string;
    questions?: any[];
  };
}

export default function ModernTaskBookingWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'tasker' | 'admin' | null>(null);
  const supabase = createClient();

  // Check authentication status on mount
  useEffect(() => {
    // Prefill selected category from URL (?categoryId or ?category=slug)
    try {
      const catId = searchParams.get('categoryId');
      const catSlug = searchParams.get('category');
      const templateId = searchParams.get('template');
      
      if (catId || catSlug) {
        const selected = categoriesWithIcons.find(
          (c) => c.id === catId || c.slug === catSlug
        );
        if (selected) {
          const raw = localStorage.getItem('modern-task-booking-data');
          const data = raw ? JSON.parse(raw) : {};
          // Do not overwrite an existing valid currentStep (e.g., 'details')
          const next = {
            ...data,
            selectedCategory: { id: selected.id, slug: selected.slug, name_fi: selected.name_fi },
            currentStep: data?.currentStep ?? 'category',
          };
          localStorage.setItem('modern-task-booking-data', JSON.stringify(next));
        }
      }

      // Handle template parameter
      if (templateId) {
        const fetchAndApplyTemplate = async () => {
          try {
            const { data: template, error } = await supabase
              .from('task_templates')
              .select(`
                id,
                name_fi,
                description_fi,
                questions,
                categories!task_templates_category_id_fkey(
                  id,
                  name_fi,
                  slug
                )
              `)
              .eq('id', templateId)
              .eq('is_active', true)
              .single();

            if (!error && template) {
              const raw = localStorage.getItem('modern-task-booking-data');
              const data = raw ? JSON.parse(raw) : {};
              
              // Find matching category from our constants
              const categorySlug = template.categories?.slug;
              const selectedCategory = categorySlug ? 
                categoriesWithIcons.find(c => c.slug === categorySlug) : null;
              
              const next = {
                ...data,
                selectedTemplate: {
                  id: template.id,
                  name_fi: template.name_fi,
                  description_fi: template.description_fi || '',
                  questions: Array.isArray(template.questions) ? template.questions : [],
                },
                ...(selectedCategory && {
                  selectedCategory: { 
                    id: selectedCategory.id, 
                    slug: selectedCategory.slug, 
                    name_fi: selectedCategory.name_fi 
                  }
                }),
                currentStep: selectedCategory ? 'details' : 'category',
              };
              localStorage.setItem('modern-task-booking-data', JSON.stringify(next));
            }
          } catch (error) {
            console.error('Error fetching template:', error);
          }
        };

        fetchAndApplyTemplate();
      }
    } catch (e) {
      // no-op
    }

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        // Fetch role from profiles table instead of user_metadata
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        const role = profile?.role;
        setUserRole((role === 'tasker' || role === 'admin' || role === 'user') ? (role as any) : 'user');
      } else {
        setUserRole(null);
      }
      
      setIsAuthChecked(true);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session?.user);
      
      if (session?.user) {
        // Fetch role from profiles table instead of user_metadata
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        const role = profile?.role;
        setUserRole((role === 'tasker' || role === 'admin' || role === 'user') ? (role as any) : 'user');
      } else {
        setUserRole(null);
      }
      
      // If user just logged in and we have saved booking data, they can continue
      if (event === 'SIGNED_IN' && localStorage.getItem('modern-task-booking-data')) {
        // User will automatically continue with their saved progress
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleAuthRequired = () => {
    // Save current URL for return after auth
    const currentUrl = window.location.pathname + window.location.search;
    localStorage.setItem('postLoginRedirect', currentUrl);
    
    // Redirect to login with return parameter
    router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
  };

  const handleComplete = async (data: TaskCompletionData) => {
    // Check auth before proceeding
    if (!isAuthenticated) {
      handleAuthRequired();
      return;
    }

    // Prevent taskers from creating tasks
    if (userRole === 'tasker') {
      alert('Tekijä-tilillä ei voi julkaista tehtäviä. Kirjaudu sisään asiakastilillä.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get current user (we know they're authenticated)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setIsSubmitting(false);
        handleAuthRequired();
        return;
      }

      // Normalize date to YYYY-MM-DD or null, accepting Date or string
      const normalizeDate = (value: any): string | null => {
        if (!value) return null;
        const dateObj = value instanceof Date ? value : new Date(value);
        if (isNaN(dateObj.getTime())) return null;
        return dateObj.toISOString().split('T')[0];
      };

      // Resolve real category UUID from slug/name (constants use slug as id)
      let categoryId: string | null = null;
      try {
        const { data: catBySlug } = await supabase
          .from('categories')
          .select('id, slug, name_fi')
          .eq('slug', data.category.slug)
          .single();
        if (catBySlug?.id) categoryId = catBySlug.id as unknown as string;
      } catch (e) {
        // ignore, try by name below
      }
      if (!categoryId) {
        try {
          const { data: catByName } = await supabase
            .from('categories')
            .select('id, slug, name_fi')
            .eq('name_fi', data.category.name_fi)
            .single();
          if (catByName?.id) categoryId = catByName.id as unknown as string;
        } catch (e) {
          // leave null
        }
      }

      // Prepare task data for database (match existing schema)
      // Note: tasks table does not have dynamic_answers/publishing_mode/template_id/latitude/longitude columns.
      // - Map publishing mode -> posting_type
      // - Convert lat/lng -> PostGIS WKT in location_coordinates
      const locationCoordinates =
        data.formData.latitude != null && data.formData.longitude != null
          ? `SRID=4326;POINT(${data.formData.longitude} ${data.formData.latitude})`
          : null;

      const taskData = {
        user_id: user.id,
        category_id: categoryId,
        title: data.formData.description.substring(0, 100), // Use first 100 chars as title
        description: data.formData.description,
        location_text: data.formData.location_text,
        budget: data.formData.budget,
        scheduled_date: normalizeDate((data.formData as any).scheduled_date),
        scheduled_time_slot: data.formData.scheduled_time_slot,
        posting_type: data.publishingMode, // 'open' | 'direct'
        status: data.publishingMode === 'open' ? 'pending_review' : 'open',
        location_coordinates: locationCoordinates,
      } as const;

      // Insert task into database
      const { data: newTask, error: insertError } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating task:', insertError);
        throw new Error('Tehtävän luonnissa tapahtui virhe');
      }

      // Handle image uploads if any File objects
      const imageFiles = data.formData.image_files || [];
      if (imageFiles.length > 0) {
        console.log('Uploading images to Supabase Storage...');
        
        try {
          const uploadedUrls: string[] = [];
          
          for (const file of imageFiles) {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
            const filePath = fileName;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
              .from('task-images')
              .upload(filePath, file);

            if (uploadError) {
              console.error('Upload error:', uploadError);
              throw new Error(`Kuvan ${file.name} lataus epäonnistui`);
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('task-images')
              .getPublicUrl(filePath);

            uploadedUrls.push(publicUrl);
          }
          
          // Insert task attachments into database
          if (uploadedUrls.length > 0) {
            const attachments = uploadedUrls.map(url => ({
              task_id: newTask.id,
              file_url: url,
              file_type: 'image',
            }));
            
            const { error: attachmentError } = await supabase
              .from('task_attachments')
              .insert(attachments);
              
            if (attachmentError) {
              console.error('Error saving task attachments:', attachmentError);
              throw new Error('Kuvien tallentaminen epäonnistui');
            }
            
            console.log(`Successfully saved ${attachments.length} task attachments`);
          }
        } catch (error) {
          console.error('Error handling task images:', error);
          // Don't fail the entire task creation, but log the error
          console.warn('Task created but image upload failed');
        }
      }

      // Persist dynamic answers to task_specific_answers (if any)
      const answers = data.formData.dynamic_answers || {};
      const answerEntries = Object.entries(answers);
      if (answerEntries.length > 0) {
        const isUuid = (value: string) =>
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);

        const rows = answerEntries
          .filter(([questionId, value]) => isUuid(questionId) && value !== undefined && value !== null)
          .map(([questionId, value]) => ({
            task_id: newTask.id,
            question_id: questionId,
            answer_value: value,
          }));

        if (rows.length > 0) {
          const { error: answersError } = await supabase
            .from('task_specific_answers')
            .insert(rows as any);

          if (answersError) {
            console.warn('Failed to save dynamic answers:', answersError);
          }
        } else if (answerEntries.length > 0) {
          console.warn('Skipped saving dynamic answers: no UUID question_ids present in answers');
        }
      }

      // Ensure an approval record exists for admin review when open posting
      if (data.publishingMode === 'open') {
        const { error: approvalError } = await supabase
          .from('task_approvals')
          .insert({ task_id: newTask.id, status: 'pending' });
        if (approvalError) {
          console.warn('Failed to insert task_approval record:', approvalError);
        }
      }

      // Clear saved data on success
      localStorage.removeItem('modern-task-booking-data');

      // Redirect based on publishing mode
      if (data.publishingMode === 'open') {
        // For open posting, redirect to dashboard with admin review message
        router.push(`/dashboard?message=task_submitted_for_review&taskId=${newTask.id}`);
      } else {
        // For direct selection, redirect to tasker selection with task context
        const queryParams = new URLSearchParams({
          taskId: newTask.id,
          category: data.category.slug,
          lat: data.formData.latitude?.toString() || '',
          lng: data.formData.longitude?.toString() || '',
          radius: '20'
        }).toString();
        
        router.push(`/dashboard/taskers/nearby?${queryParams}`);
      }

    } catch (error) {
      console.error('Error in task completion:', error);
      alert(error instanceof Error ? error.message : 'Tehtävän luonnissa tapahtui virhe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  const handleStepChange = (step: string, stepNumber: number) => {
    // Optional: Track analytics or update URL
    console.log(`Step changed: ${step} (${stepNumber})`);
  };

  // Show loading while checking auth
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Tarkistetaan kirjautumista...</p>
        </div>
      </div>
    );
  }

  return (
    <ModernTaskBookingFlow
      onComplete={handleComplete}
      onCancel={handleCancel}
      onStepChange={handleStepChange}
      isAuthenticated={isAuthenticated}
      onAuthRequired={handleAuthRequired}
      isTasker={userRole === 'tasker'}
    />
  );
}
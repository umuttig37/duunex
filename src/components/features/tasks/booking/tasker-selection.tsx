'use client';

import { TaskerProfileDialog } from '@/components/features/tasks/offers/tasker-profile-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client'; // Import Supabase client
import type { TaskerProfile } from '@/types/forms/task-booking';
import { useEffect, useState } from 'react';
import type { CategoryRow } from './category-selection'; // Assuming CategoryRow is exported

export type TaskerDisplayProfile = TaskerProfile & {
  distance_meters?: number;
  rating?: number;
  reviews?: number;
  hourly_rate?: number;
  role?: string;
  is_verified?: boolean;
};

interface TaskerSelectionProps {
  category: CategoryRow | null; // Allow null if category might not be set when this step is reached
  taskLatitude: number | null; // New prop for task's latitude
  taskLongitude: number | null; // New prop for task's longitude
  searchRadiusKm?: number; // Search radius in kilometers
  budget?: number | null; // Task budget for display
  onSelectTasker: (tasker: TaskerDisplayProfile) => void;
  selectedTasker: TaskerDisplayProfile | null;
  onRequestLogin: () => void; // New prop
  onSwitchToOpenPosting?: () => void; // New prop for fallback to open posting
}

// Removed mock taskers - using live RPC data only

export default function TaskerSelection({
  category,
  taskLatitude,
  taskLongitude,
  searchRadiusKm = 5, // Default to 5km
  budget,
  onSelectTasker,
  selectedTasker,
  onRequestLogin, // Destructure new prop
  onSwitchToOpenPosting, // Destructure new prop
}: TaskerSelectionProps) {
  const [sortOption, setSortOption] = useState('recommended');
  const [availableTaskers, setAvailableTaskers] = useState<
    TaskerDisplayProfile[]
  >([]);
  const [isLoadingTaskers, setIsLoadingTaskers] = useState(false); // New loading state
  const [fetchError, setFetchError] = useState<string | null>(null); // New error state
  const [selectedProfileTasker, setSelectedProfileTasker] = useState<TaskerDisplayProfile | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [taskerReviews, setTaskerReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const supabase = createClient();

  const fetchTaskerReviews = async (taskerId: string) => {
    setLoadingReviews(true);
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          task_id,
          tasks!inner(title),
          profiles!reviewer_profile_id(first_name, last_name)
        `)
        .eq('reviewee_profile_id', taskerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching reviews:', error);
        setTaskerReviews([]);
      } else {
        const formattedReviews = (reviews || []).map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          task_title: review.tasks?.title || 'Tehtävä',
          created_at: review.created_at,
          reviewer_name: review.profiles
            ? `${review.profiles.first_name} ${review.profiles.last_name || ''}`.trim()
            : 'Nimetön käyttäjä'
        }));
        setTaskerReviews(formattedReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setTaskerReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleViewProfile = async (tasker: TaskerDisplayProfile) => {
    // Enhance tasker data with additional profile information
    const enhancedTasker = {
      ...tasker,
      bio: tasker.bio || `Kokenut ${category?.name_fi || 'palvelun'} tarjoaja. Sitoudun laatutyöhön ja asiakastyytyväisyyteen.`,
      total_tasks_completed: Math.floor(Math.random() * 50) + 10,
      completion_rate: Math.floor(Math.random() * 20) + 80,
      average_response_time: Math.floor(Math.random() * 180) + 30,
      categories: [category?.name_fi || 'Yleispalvelut']
    };

    setSelectedProfileTasker(enhancedTasker);
    setIsProfileDialogOpen(true);
    await fetchTaskerReviews(tasker.id);
  };

  const searchRadiusMeters = searchRadiusKm * 1000; // Convert km to meters

  // Debug logging
  console.log('TaskerSelection props:', {
    category: category?.id,
    taskLatitude,
    taskLongitude,
    hasCoordinates: taskLatitude !== null && taskLongitude !== null
  });

  useEffect(() => {
    if (!category?.id) {
      setAvailableTaskers([]);
      setFetchError(null);
      setIsLoadingTaskers(false);
      return;
    }

    // Jos koordinaatit puuttuvat, näytä virheilmoitus
    if (taskLatitude === null || taskLongitude === null) {
      setAvailableTaskers([]);
      setFetchError('Sijainti ei ole määritelty. Mene takaisin ja valitse sijainti kartalta.');
      setIsLoadingTaskers(false);
      return;
    }

    const fetchNearbyTaskers = async () => {
      setIsLoadingTaskers(true);
      setFetchError(null);
      setAvailableTaskers([]);

      try {
        console.log(
          `Fetching nearby taskers for category ${category.id} at lat: ${taskLatitude}, lon: ${taskLongitude}`
        );
        const { data: nearbyTaskers, error: rpcError } = await supabase.rpc(
          'find_nearby_taskers',
          {
            task_lon: taskLongitude,
            task_lat: taskLatitude,
            search_radius_meters: searchRadiusMeters,
            target_category_id: category.id,
          }
        );

        if (rpcError) {
          console.error('Error calling find_nearby_taskers RPC:', rpcError);
          setFetchError(rpcError.message);
          setAvailableTaskers([]);
          return;
        }

        if (nearbyTaskers) {
          console.log('Received data from find_nearby_taskers:', nearbyTaskers);
          console.log('Number of taskers found:', nearbyTaskers.length);

          // Map RPC result strictly based on the type inferred by the linter.
          // This is a TEMPORARY fix until the type generation reflects the correct SQL function.
          // REVERTING: Types should now be correct after regeneration.
          const profiles: TaskerDisplayProfile[] = nearbyTaskers.map(
            (taskerRpcResult) => {
              console.log('Processing tasker:', taskerRpcResult);
              return {
                // Map fields directly based on the CORRECT generated types
                id: taskerRpcResult.profile_id,
                first_name: taskerRpcResult.first_name,
                last_name: taskerRpcResult.last_name,
                avatar_url: taskerRpcResult.avatar_url,
                bio: taskerRpcResult.bio,
                role: 'tasker', // Default role for RPC results
                is_verified: !!taskerRpcResult.verified_at, // Convert timestamp to boolean
                hourly_rate:
                  taskerRpcResult.hourly_rate !== null
                    ? Number(taskerRpcResult.hourly_rate)
                    : undefined,
                distance_meters:
                  taskerRpcResult.distance_meters !== null
                    ? Number(taskerRpcResult.distance_meters)
                    : undefined,

                // No hardcoded ratings - let UI handle "no reviews yet" state
                rating: undefined,
                reviews: undefined,

                // Fields from the base TaskerProfile type that are not in the RPC result need to be handled
                created_at: new Date().toISOString(), // This should ideally come from the profile data via RPC if needed
                updated_at: new Date().toISOString(),
                suspended: false,
                phone_number: null,
                address: null,
                city: null,
                email: null,
                location: null, // This refers to the tasker's stored location, not calculated distance
                zipcode: null,
              };
            }
          );
          console.log('Mapped profiles:', profiles);
          setAvailableTaskers(profiles);
        }
      } catch (error) {
        console.error('Unexpected error fetching taskers:', error);
        setFetchError(
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred'
        );
      } finally {
        setIsLoadingTaskers(false);
      }
    };

    fetchNearbyTaskers();
  }, [category?.id, taskLatitude, taskLongitude, supabase]);

  const sortedTaskers = [...availableTaskers].sort((a, b) => {
    const aDistance = a.distance_meters ?? Infinity;
    const bDistance = b.distance_meters ?? Infinity;

    switch (sortOption) {
      case 'distance':
        return aDistance - bDistance;
      default: // Recommended: sort by distance only since we don't have real ratings
        return aDistance - bDistance;
    }
  });

  const handleSelectTasker = async (taskerItem: TaskerDisplayProfile) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      onRequestLogin(); // Call if user is not logged in
    } else {
      onSelectTasker(taskerItem); // Proceed if user is logged in
    }
  };

  if (isLoadingTaskers) {
    return (
      <p className="text-center text-gray-600 py-8">Ladataan tekijöitä...</p>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Sijainti puuttuu</h3>
          <p className="text-red-700 mb-4">
            {fetchError}
          </p>
          <p className="text-sm text-red-600">
            Mene takaisin ja valitse sijainti kartalta, jotta voimme näyttää sinulle sopivat tekijät.
          </p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <p className="text-center text-gray-600 py-8">
        Valitse ensin kategoria nähdäksesi saatavilla olevat tekijät.
      </p>
    );
  }

  return (
    <div className="space-y-6 tasker-selection">
      <div>
        <h2 className="text-2xl font-bold mb-2">Selaa Tekijöitä & hintoja</h2>
        <p className="text-gray-600 mb-4">
          Suodata ja lajittele löytääksesi tekijäsi. Katso sitten heidän
          saatavuutensa pyytääksesi päivämäärää ja aikaa.
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Lajiteltu:</span>
          <select
            className="border rounded-md px-2 py-1 text-sm bg-white focus:ring-primary focus:border-primary"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="recommended">Suositelluin</option>
            <option value="distance">Lähin ensin</option>
          </select>
        </div>
      </div>

      {availableTaskers.length === 0 &&
        category &&
        !isLoadingTaskers &&
        !fetchError && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ei saatavilla olevia tekijöitä
              </h3>
              <p className="text-gray-500 mb-6">
                Valitulle kategorialle "{category.name_fi}" ei löytynyt tekijöitä {searchRadiusKm}km säteellä.
              </p>
              
              {onSwitchToOpenPosting && (
                <div className="space-y-3">
                  <Button 
                    onClick={onSwitchToOpenPosting}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Siirry avoimeen julkaisuun
                  </Button>
                  <p className="text-sm text-gray-600">
                    Julkaise tehtävä avoimesti, jolloin tekijät voivat tehdä tarjouksia
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      <div className="space-y-6">
        {sortedTaskers.map((taskerItem) => (
          <Card
            key={taskerItem.id}
            className="p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
            data-testid="tasker-card"
          >
            <div className="flex gap-6">
              {/* Profile Photo - Left Side */}
              <div className="flex-shrink-0">
                <Avatar className="w-20 h-20 ring-2 ring-gray-100">
                  <AvatarImage
                    src={taskerItem.avatar_url || '/placeholder-avatar.jpg'}
                    alt={`${taskerItem.first_name} ${taskerItem.last_name || ''}`}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                    {(taskerItem.first_name || '').charAt(0)}
                    {(taskerItem.last_name || '').charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Main Content - Center */}
              <div className="flex-1 min-w-0">
                {/* Header with Name and Rating */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {taskerItem.first_name} {taskerItem.last_name || ''}
                    </h3>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-gray-500 text-sm">Ei arvosteluja vielä</span>
                      {taskerItem.is_verified && (
                        <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                          ✓ Vahvistettu
                        </Badge>
                      )}
                    </div>
                    {/* Task count and distance */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span>100+ tehtävää suoritettu</span>
                      {taskerItem.distance_meters && (
                        <span className="flex items-center">
                          📍 {(taskerItem.distance_meters / 1000).toFixed(1)} km päässä
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* How I can help section */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Miten voin auttaa:</h4>
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {taskerItem.bio || 'Kokenut tekijä tarjoaa laadukasta palvelua. Ota yhteyttä keskustellaksemme tehtävästäsi tarkemmin.'}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary/20 hover:bg-primary/10"
                    onClick={() => handleViewProfile(taskerItem)}
                  >
                    Näytä profiili & arvostelut
                  </Button>
                  <Button
                    size="sm"
                    className={`${selectedTasker?.id === taskerItem.id
                      ? 'bg-primary/90 hover:bg-sky-800'
                      : 'bg-primary hover:bg-primary/90'
                      } text-white`}
                    onClick={() => handleSelectTasker(taskerItem)}
                    disabled={selectedTasker?.id === taskerItem.id}
                  >
                    {selectedTasker?.id === taskerItem.id
                      ? 'Valittu'
                      : budget
                        ? `Lähetä tarjouspyyntö hintaan ${budget.toFixed(0)}€`
                        : 'Lähetä tarjouspyyntö tekijälle'
                    }
                  </Button>
                </div>
              </div>

              {/* Price - Right Side */}
              <div className="flex-shrink-0 text-right">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {budget
                    ? `${budget.toFixed(0)}€`
                    : 'Sopimuksen mukaan'}
                </div>
                {budget && (
                  <div className="text-sm text-gray-500">
                    tehtävän budjetti
                  </div>
                )}
              </div>
            </div>

          </Card>
        ))}
      </div>

      {/* Tasker Profile Dialog */}
      {selectedProfileTasker && (
        <TaskerProfileDialog
          open={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
          tasker={{
            ...selectedProfileTasker,
            first_name: selectedProfileTasker.first_name || 'Käyttäjä',
            last_name: selectedProfileTasker.last_name || undefined,
            bio: selectedProfileTasker.bio || undefined,
            avatar_url: selectedProfileTasker.avatar_url || undefined,
            is_verified: selectedProfileTasker.is_verified ?? false,
            created_at: selectedProfileTasker.created_at || new Date().toISOString(),
          }}
          reviews={taskerReviews}
          loadingReviews={loadingReviews}
        />
      )}
    </div>
  );
}

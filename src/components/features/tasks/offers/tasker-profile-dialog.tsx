'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import {
  MapPin,
  Shield,
  Star,
  User
} from 'lucide-react';

interface TaskerProfile {
  id: string;
  first_name: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string;
  location_text?: string;
  distance_meters?: number;
  is_verified: boolean;
  created_at: string;
  completion_rate?: number;
  total_tasks_completed?: number;
  average_response_time?: number;
  categories?: string[];
}

interface TaskerReview {
  id: string;
  rating: number;
  comment?: string;
  task_title: string;
  created_at: string;
  reviewer_name: string;
}

interface TaskerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasker: TaskerProfile;
  reviews?: TaskerReview[];
  loadingReviews?: boolean;
}

export function TaskerProfileDialog({
  open,
  onOpenChange,
  tasker,
  reviews = [],
  loadingReviews = false
}: TaskerProfileDialogProps) {
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const formatDistance = (meters?: number) => {
    if (!meters) return '';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatResponseTime = (minutes?: number) => {
    if (!minutes) return 'Ei tietoa';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.round(minutes / 60);
    return `${hours} h`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            Tekijän profiili ja arvostelut
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 ring-2 ring-primary/10">
              <AvatarImage
                src={tasker.avatar_url}
                alt={`${tasker.first_name} ${tasker.last_name || ''}`}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {tasker.first_name?.charAt(0)?.toUpperCase()}
                {tasker.last_name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {tasker.first_name} {tasker.last_name || ''}
                </h2>
                {tasker.is_verified && (
                  <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                    <Shield className="w-3 h-3 mr-1" />
                    Vahvistettu
                  </Badge>
                )}
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                {tasker.location_text && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{tasker.location_text}</span>
                    {tasker.distance_meters && (
                      <span className="text-primary font-medium">
                        ({formatDistance(tasker.distance_meters)} päässä)
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Liittynyt {format(new Date(tasker.created_at), 'MMMM yyyy', { locale: fi })}</span>
                </div>
              </div>

              {/* Ratings Summary */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="font-semibold text-lg">{averageRating.toFixed(1)}</span>
                    <span className="text-gray-500 text-sm">
                      ({reviews.length} arvostelua)
                    </span>
                  </div>
                </div>
              )}

              {reviews.length === 0 && (
                <div className="mt-3 text-sm text-gray-500">
                  Ei arvosteluja vielä
                </div>
              )}
            </div>
          </div>

          {/* Bio Section */}
          {tasker.bio && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Esittely</h3>
              <p className="text-gray-700 leading-relaxed">{tasker.bio}</p>
            </div>
          )}

          {/* Stats Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Tilastot</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {tasker.total_tasks_completed !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {tasker.total_tasks_completed}
                  </div>
                  <div className="text-sm text-gray-600">Tehtävää tehty</div>
                </div>
              )}

              {tasker.completion_rate !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(tasker.completion_rate)}%
                  </div>
                  <div className="text-sm text-gray-600">Valmistumisaste</div>
                </div>
              )}

              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatResponseTime(tasker.average_response_time)}
                </div>
                <div className="text-sm text-gray-600">Vast. aika</div>
              </div>
            </div>
          </div>

          {/* Categories */}
          {tasker.categories && tasker.categories.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Erikoisalat</h3>
              <div className="flex flex-wrap gap-2">
                {tasker.categories.map((category, index) => (
                  <Badge key={index} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          {(reviews.length > 0 || loadingReviews) && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {loadingReviews ? 'Ladataan arvosteluja...' : `Arvostelut (${reviews.length})`}
              </h3>
              {loadingReviews ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : (
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {review.reviewer_name}
                            </span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-gray-300'
                                    }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {review.task_title}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(review.created_at), 'dd.MM.yyyy', { locale: fi })}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 text-sm italic">
                          "{review.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No Reviews Message */}
          {reviews.length === 0 && !loadingReviews && (
            <div className="text-center py-8 text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">Ei arvosteluja vielä</p>
              <p className="text-sm">
                Tämä tekijä on uusi tai ei ole vielä saanut arvosteluja.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Sulje
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
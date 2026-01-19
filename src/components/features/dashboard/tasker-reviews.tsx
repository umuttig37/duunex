'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Star, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Review {
  id: string;
  task_id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  tasks: {
    title: string;
  };
  reviewer_profile: {
    first_name: string | null;
    last_name: string | null;
  };
}

interface TaskerReviewsProps {
  taskerId: string;
}

export default function TaskerReviews({ taskerId }: TaskerReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchReviews();
  }, [taskerId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          task_id,
          rating,
          comment,
          created_at,
          tasks!inner(title),
          reviewer_profile:profiles!reviewer_profile_id(first_name, last_name)
        `)
        .eq('reviewee_profile_id', taskerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      setReviews(data || []);
      
      // Calculate average rating
      if (data && data.length > 0) {
        const total = data.reduce((sum: number, review: any) => sum + review.rating, 0);
        setAverageRating(total / data.length);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fi-FI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Saamasi arviot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Saamasi arviot
        </CardTitle>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(averageRating) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="font-medium">{averageRating.toFixed(1)}</span>
            <span>({reviews.length} arviota)</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-1">Ei vielä arvioita</p>
            <p className="text-sm">Kun saat ensimmäisen arvion, se näkyy täällä.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-sm">
                      {review.reviewer_profile.first_name} {review.reviewer_profile.last_name}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      {review.created_at ? formatDate(review.created_at) : 'Tuntematon päivä'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < review.rating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-xs font-medium">{review.rating}/5</span>
                  </div>
                </div>
                
                <div className="mb-2">
                  <span className="text-xs text-gray-500">Tehtävä: </span>
                  <span className="text-sm font-medium">{review.tasks.title}</span>
                </div>
                
                {review.comment && (
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                    "{review.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/shared/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Star } from 'lucide-react';
import { useState, useTransition } from 'react';

interface ReviewFormProps {
  taskId: string;
  taskerId: string;
  userId: string;
  taskTitle: string;
  taskerName: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewForm({
  taskId,
  taskerId,
  userId,
  taskTitle,
  taskerName,
  onReviewSubmitted
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        title: "Virhe",
        description: "Valitse arvosana tähdillä.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        // Insert review to database
        const { error } = await supabase
          .from('reviews')
          .insert({
            task_id: taskId,
            reviewer_profile_id: userId,
            reviewee_profile_id: taskerId,
            rating: rating,
            comment: comment.trim() || null,
          });

        if (error) {
          console.error('Error submitting review:', error);
          toast({
            title: "Virhe",
            description: "Arvioinnin lähettäminen epäonnistui. Yritä uudelleen.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Arviointi lähetetty!",
          description: "Kiitos palautteestasi. Se auttaa muita käyttäjiä tekemään parempia valintoja.",
          variant: "default",
        });

        // Reset form
        setRating(0);
        setComment('');

        // Call callback if provided
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }

      } catch (error) {
        console.error('Error submitting review:', error);
        toast({
          title: "Virhe",
          description: "Arvioinnin lähettäminen epäonnistui. Yritä uudelleen.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Arvostele tehtävä</CardTitle>
        <p className="text-sm text-gray-600">
          Miten sujui tehtävä "{taskTitle}" taskerin {taskerName} kanssa?
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Arvosana *</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-colors hover:bg-gray-100 rounded"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${star <= (hoveredRating || rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                    }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {rating > 0 && (
                <>
                  {rating} / 5 tähteä
                  {rating === 1 && ' - Huono'}
                  {rating === 2 && ' - Välttävä'}
                  {rating === 3 && ' - Hyvä'}
                  {rating === 4 && ' - Erittäin hyvä'}
                  {rating === 5 && ' - Erinomainen'}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Kommentti (valinnainen)</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Kerro kokemuksestasi taskerin kanssa. Mitä sujui hyvin? Mitä voisi parantaa?"
            className="min-h-[100px]"
            maxLength={500}
          />
          <p className="text-xs text-gray-500">
            {comment.length}/500 merkkiä
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setRating(0);
              setComment('');
              if (onReviewSubmitted) onReviewSubmitted();
            }}
            disabled={isPending}
          >
            Peruuta
          </Button>
          <Button
            onClick={handleSubmitReview}
            disabled={isPending || rating === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPending ? 'Lähettää...' : 'Lähetä arviointi'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 
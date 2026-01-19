'use client';

import ReviewForm from '@/components/features/tasks/reviews/review-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star } from 'lucide-react';
import { useState } from 'react';

interface TaskReviewSectionProps {
  taskId: string;
  taskerId: string;
  userId: string;
  taskTitle: string;
  taskerName: string;
  userReview?: {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string | null;
  } | null;
}

export default function TaskReviewSection({
  taskId,
  taskerId,
  userId,
  taskTitle,
  taskerName,
  userReview
}: TaskReviewSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleReviewSubmitted = () => {
    setIsDialogOpen(false);
    // Reload page to show the new review
    window.location.reload();
  };

  return (
    <div className="pt-2">
      {userReview ? (
        // Show existing review status
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-yellow-800">Arvioit tekijän</span>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < userReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                />
              ))}
              <span className="ml-2 text-sm font-semibold text-yellow-800">{userReview.rating}/5</span>
            </div>
          </div>
          {userReview.comment && (
            <p className="text-xs text-yellow-700 mt-1">{userReview.comment}</p>
          )}
        </div>
      ) : (
        // Show review button if not reviewed yet
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
              <Star className="mr-2 h-4 w-4" /> Arvostele tekijä
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Arvostele tehtävä</DialogTitle>
            </DialogHeader>
            <ReviewForm
              taskId={taskId}
              taskerId={taskerId}
              userId={userId}
              taskTitle={taskTitle}
              taskerName={taskerName}
              onReviewSubmitted={handleReviewSubmitted}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 
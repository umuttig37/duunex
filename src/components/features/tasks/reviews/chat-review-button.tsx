'use client';

import ReviewForm from '@/components/features/tasks/reviews/review-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ChatReviewButtonProps {
  taskId: string;
  currentUserId: string;
  isTaskOwner: boolean;
  taskTitle: string;
}

export default function ChatReviewButton({
  taskId,
  currentUserId,
  isTaskOwner,
  taskTitle
}: ChatReviewButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskData, setTaskData] = useState<any>(null);
  const [hasReview, setHasReview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaskData = async () => {
      const supabase = createClient();

      // Fetch task with assigned tasker
      const { data: task } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_tasker_profile:profiles!tasks_assigned_tasker_id_fkey(
            id, first_name, last_name
          )
        `)
        .eq('id', taskId)
        .single();

      if (task) {
        setTaskData(task);

        // Check if user has already reviewed this task
        if (isTaskOwner && task.assigned_tasker_id) {
          const { data: review } = await supabase
            .from('reviews')
            .select('id')
            .eq('task_id', taskId)
            .eq('reviewer_profile_id', currentUserId)
            .eq('reviewee_profile_id', task.assigned_tasker_id)
            .single();

          setHasReview(!!review);
        }
      }

      setLoading(false);
    };

    fetchTaskData();
  }, [taskId, currentUserId, isTaskOwner]);

  const handleReviewSubmitted = () => {
    setIsDialogOpen(false);
    setHasReview(true);
  };

  // Only show for task owners who haven't reviewed yet
  if (loading || !isTaskOwner || !taskData || !taskData.assigned_tasker_id || hasReview) {
    return null;
  }

  return (
    <div className="mt-3">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Star className="mr-1.5 h-4 w-4" />
            Arvostele tekijä
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Arvostele tehtävä</DialogTitle>
          </DialogHeader>
          <ReviewForm
            taskId={taskId}
            taskerId={taskData.assigned_tasker_id}
            userId={currentUserId}
            taskTitle={taskTitle}
            taskerName={taskData.assigned_tasker_profile ?
              `${taskData.assigned_tasker_profile.first_name} ${taskData.assigned_tasker_profile.last_name}` :
              'Tekijä'
            }
            onReviewSubmitted={handleReviewSubmitted}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 
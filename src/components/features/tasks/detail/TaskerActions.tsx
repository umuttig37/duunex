import TaskOfferForm from '@/components/features/tasks/offers/task-offer-form';
import TaskCompletionDialog from '@/components/features/tasks/reviews/task-completion-dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, MessageSquare, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { TaskerEarningsBanner } from './ContextBanner';

interface TaskerActionsProps {
  task: any;
  currentUser: any;
  isAssignedTasker: boolean;
  canTaskerInteract: boolean;
  hasAlreadyOffered?: boolean;
  finalPrice?: number;
  taskId: string;
}

export default function TaskerActions({
  task,
  currentUser,
  isAssignedTasker,
  canTaskerInteract,
  hasAlreadyOffered,
  finalPrice,
  taskId
}: TaskerActionsProps) {
  const status = task.status;

  // If not a tasker or owner, and task is open - show registration CTA
  if (!currentUser || (!isAssignedTasker && !canTaskerInteract && status === 'open')) {
    return (
      <Button
        size="lg"
        className="w-full bg-primary hover:bg-primary/90 text-white"
        asChild
      >
        <Link href="/signup/tasker">
          <ShieldCheck className="mr-2 h-4 w-4" />
          Rekisteröidy tekijäksi ja hae
        </Link>
      </Button>
    );
  }

  // Open task - Make offer
  if (canTaskerInteract && status === 'open') {
    return (
      <div className="space-y-3">
        <TaskOfferForm
          taskId={taskId}
          taskBudget={finalPrice}
          hasAlreadyOffered={hasAlreadyOffered}
        />
      </div>
    );
  }

  // Assigned tasker - Paid/In Progress
  if (isAssignedTasker && (status === 'paid' || status === 'in_progress')) {
    return (
      <div className="space-y-4">
        {/* Earnings Banner */}
        {finalPrice && (
          <TaskerEarningsBanner amount={finalPrice} />
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <TaskCompletionDialog
            taskId={taskId}
            taskTitle={task.title}
            scheduledDate={task.scheduled_date}
            scheduledTimeSlot={task.scheduled_time_slot}
          >
            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Merkitse valmiiksi
            </Button>
          </TaskCompletionDialog>

          <Button
            size="lg"
            variant="outline"
            className="w-full border-primary/30 text-primary hover:bg-primary/10"
            asChild
          >
            <Link href={`/dashboard/messages?receiverId=${task.user_id}&taskId=${taskId}`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Keskustele asiakkaan kanssa
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
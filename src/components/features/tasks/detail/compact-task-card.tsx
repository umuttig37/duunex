'use client';

import { DashboardTask } from '@/app/dashboard/page';
import DisputeForm from '@/components/features/tasks/dispute-form';
import EarlyCompletionConfirmation from '@/components/features/tasks/reviews/early-completion-confirmation';
import ReviewForm from '@/components/features/tasks/reviews/review-form';
import TaskCompletionDialog from '@/components/features/tasks/reviews/task-completion-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Edit,
  Euro,
  Eye,
  EyeOff,
  FileText,
  MapPin,
  MessageSquare,
  Star,
  Wrench
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface CompactTaskCardProps {
  task: DashboardTask;
  currentUserId: string;
  highlight?: boolean;
}

const CompactTaskCard: React.FC<CompactTaskCardProps> = ({
  task,
  currentUserId,
  highlight = false,
}) => {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const isAssignedTasker = currentUserId === task.assigned_tasker_id;
  const isTaskOwner = currentUserId === task.user_id;

  // Check if task can be disabled (expired with no offers)
  const canToggleTaskStatus = () => {
    if (!isTaskOwner) return false;
    if (task.status !== 'open' && task.status !== 'disabled') return false;

    // Check if task is older than 2 days
    const taskCreated = new Date(task.created_at);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    return taskCreated <= twoDaysAgo && (task.offers_count || 0) === 0;
  };

  // Check if task can be edited (open status and no offers)
  const canEditTask = () => {
    return isTaskOwner && task.status === 'open' && (task.offers_count || 0) === 0;
  };

  const toggleTaskStatus = async () => {
    if (!canToggleTaskStatus() || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const newStatus = task.status === 'open' ? 'disabled' : 'open';
      const response = await fetch(`/api/tasks/${task.id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Reload page to show updated status
        window.location.reload();
      } else {
        console.error('Failed to toggle task status');
      }
    } catch (error) {
      console.error('Error toggling task status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatTaskStatus = (task: DashboardTask) => {
    const statusMap: {
      [key: string]: {
        text: string;
        icon: React.ElementType;
        color: string;
      };
    } = {
      open: { text: 'Avoin', icon: Eye, color: 'text-blue-500' },
      pending_approval: {
        text: 'Odottaa hyväksyntää',
        icon: Eye,
        color: 'text-yellow-500',
      },
      paid: { text: 'Työn alla', icon: Wrench, color: 'text-green-500' },
      in_progress: { text: 'Työn alla', icon: Wrench, color: 'text-green-500' },
      early_completed: {
        text: 'Odottaa vahvistusta',
        icon: AlertTriangle,
        color: 'text-orange-500',
      },
      completed: {
        text: 'Valmis',
        icon: CheckCircle,
        color: 'text-gray-500',
      },
      cancelled: {
        text: 'Peruttu',
        icon: AlertTriangle,
        color: 'text-red-500',
      },
      disputed: {
        text: 'Riitautettu',
        icon: AlertTriangle,
        color: 'text-red-500',
      },
      rejected: {
        text: 'Hylätty',
        icon: AlertTriangle,
        color: 'text-red-500',
      },
      assigned: { text: 'Määritetty', icon: Wrench, color: 'text-green-500' },
      awaiting_payment: { text: 'Odottaa maksua', icon: Euro, color: 'text-amber-600' },
      request_sent: { text: 'Pyyntö lähetetty', icon: MessageSquare, color: 'text-amber-500' },
      disabled: { text: 'Piilotettu', icon: EyeOff, color: 'text-gray-400' },
    };

    const statusInfo = statusMap[task.status] || {
      text: task.status,
      icon: Eye,
      color: 'text-gray-500',
    };
    return (
      <div className={`flex items-center gap-2 ${statusInfo.color}`}>
        <statusInfo.icon className="h-4 w-4" />
        <span className="font-semibold">{statusInfo.text}</span>
      </div>
    );
  };

  const displayPrice = task.accepted_offer?.offered_price ?? task.budget;

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="min-w-0">{formatTaskStatus(task)}</div>
            {task.status === 'open' && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-300 text-xs font-medium flex-shrink-0"
              >
                Aktiivinen
              </Badge>
            )}
          </div>
          {task.user_review && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < task.user_review!.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                      }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <CardTitle className="pt-2 text-base sm:text-lg font-semibold leading-tight">
          <Link
            href={`/dashboard/tasks/${task.id}`}
            className="hover:text-primary transition-colors line-clamp-2 block"
          >
            {task.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <div className="space-y-3">
          {task.task_attachments && task.task_attachments.length > 0 && (
            <div className="relative h-32 w-full overflow-hidden rounded-md">
              <Image
                src={task.task_attachments[0].file_url}
                alt={`${task.title} kuva`}
                fill
                style={{ objectFit: 'cover' }}
                className="transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {task.description}
          </p>
          <div className="space-y-2 text-sm">
            {task.location_text && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{task.location_text}</span>
              </div>
            )}
            {task.scheduled_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">
                  {format(new Date(task.scheduled_date), 'dd.MM.yyyy', {
                    locale: fi,
                  })}
                  {task.scheduled_time_slot && `, ${task.scheduled_time_slot}`}
                </span>
              </div>
            )}
            {displayPrice && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Euro className="h-4 w-4" />
                <span className="font-bold text-foreground">
                  {displayPrice}€
                </span>
                {task.accepted_offer?.offered_price &&
                  task.budget &&
                  task.budget !== displayPrice && (
                    <span className="ml-1 line-through text-xs">
                      {task.budget}€
                    </span>
                  )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-3 bg-gray-50/50 p-3 sm:p-4">
        <div className="flex w-full items-center justify-between text-sm">
          <div className="flex items-center gap-3 sm:gap-4 text-muted-foreground min-w-0">
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span>{task.offers_count || 0}</span>
              <span className="hidden sm:inline">Tarjousta</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span>{(task as any).message_count || 0}</span>
              <span className="hidden sm:inline">Viestiä</span>
            </div>
          </div>
          <Button asChild size="sm" className="flex-shrink-0">
            <Link href={`/dashboard/tasks/${task.id}`}>
              <span className="hidden sm:inline">Avaa</span>
              <span className="sm:hidden">Avaa</span>
            </Link>
          </Button>
        </div>
        <div className="flex w-full flex-col sm:flex-row flex-wrap items-center gap-2">
          {canEditTask() && (
            <Link href={`/dashboard/tasks/edit/${task.id}`} className="w-full sm:flex-1">
              <Button size="sm" variant="outline" className="w-full">
                <Edit className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Muokkaa</span>
              </Button>
            </Link>
          )}
          {canToggleTaskStatus() && (
            <Button
              size="sm"
              variant={task.status === 'disabled' ? 'default' : 'outline'}
              className="w-full sm:flex-1 sm:min-w-fit"
              onClick={toggleTaskStatus}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : task.status === 'disabled' ? (
                <Eye className="mr-2 h-4 w-4" />
              ) : (
                <EyeOff className="mr-2 h-4 w-4" />
              )}
              <span className="truncate">{task.status === 'disabled' ? 'Näytä' : 'Piilota'}</span>
            </Button>
          )}
          {isTaskOwner && (task.status === 'assigned' || task.status === 'awaiting_payment') && task.assigned_tasker_id && (
            <Link
              href={`/dashboard/tasks/${task.id}`}
              className="w-full sm:flex-1"
            >
              <Button size="sm" variant="default" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                <Euro className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Maksa {displayPrice?.toFixed(2) || task.budget?.toFixed(2)}€</span>
              </Button>
            </Link>
          )}
          {isTaskOwner && task.status === 'early_completed' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-full sm:flex-1">
                  <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Vahvista valmistuminen</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Vahvista tehtävän valmistuminen</DialogTitle>
                </DialogHeader>
                <EarlyCompletionConfirmation
                  taskId={task.id}
                  taskTitle={task.title}
                  scheduledDate={task.scheduled_date}
                  scheduledTimeSlot={task.scheduled_time_slot}
                />
              </DialogContent>
            </Dialog>
          )}
          {isTaskOwner &&
            task.status === 'completed' &&
            !task.user_review &&
            task.assigned_tasker_id && (
              <Dialog
                open={isReviewDialogOpen}
                onOpenChange={setIsReviewDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="w-full sm:flex-1">
                    <Star className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Arvostele tekijä</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Arvostele tehtävä</DialogTitle>
                  </DialogHeader>
                  <ReviewForm
                    taskId={task.id}
                    taskerId={task.assigned_tasker_profile.id}
                    userId={currentUserId}
                    taskTitle={task.title}
                    taskerName={`${task.assigned_tasker_profile.first_name} ${task.assigned_tasker_profile.last_name}`}
                    onReviewSubmitted={() => setIsReviewDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          {isTaskOwner && task.status === 'completed' && (
            <Dialog
              open={isDisputeDialogOpen}
              onOpenChange={setIsDisputeDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive" className="w-full sm:flex-1">
                  <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Riitauta</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Riitauta tehtävä</DialogTitle>
                </DialogHeader>
                <DisputeForm
                  taskId={task.id}
                  userId={currentUserId}
                  taskTitle={task.title}
                  onDisputeSubmitted={() => setIsDisputeDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
          {isAssignedTasker &&
            (task.status === 'paid' || task.status === 'in_progress') && (
              <TaskCompletionDialog
                taskId={task.id}
                taskTitle={task.title}
                scheduledDate={task.scheduled_date}
                scheduledTimeSlot={task.scheduled_time_slot}
              >
                <Button size="sm" variant="outline" className="flex-1">
                  <CheckCircle className="mr-2 h-4 w-4" /> Merkitse valmiiksi
                </Button>
              </TaskCompletionDialog>
            )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default CompactTaskCard;

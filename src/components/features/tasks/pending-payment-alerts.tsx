'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { CheckCircle, Clock, Euro, ExternalLink, Info, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface PendingPaymentTask {
  id: string;
  title: string;
  description: string | null;
  location_text: string | null;
  scheduled_date: string | null;
  scheduled_time_slot: string | null;
  budget: number | null;
  status: string;
  user_profile: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  categories: {
    name_fi: string | null;
  } | null;
  accepted_offer: {
    id: string;
    offered_price: number;
    status: string;
    created_at: string;
  } | null;
  offer_type?: 'counter_offer' | 'original_offer';
}

interface PendingPaymentAlertsProps {
  taskerId: string;
}

export default function PendingPaymentAlerts({
  taskerId,
}: PendingPaymentAlertsProps) {
  const [pendingTasks, setPendingTasks] = useState<PendingPaymentTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedTasks, setDismissedTasks] = useState<Set<string>>(new Set());

  const supabase = createClient();

  useEffect(() => {
    const fetchPendingPaymentTasks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Updated strategy: Look for tasks where tasker has accepted offers
        // Case 1: Counter offers (task status = 'open', counter offer status = 'accepted')
        // Case 2: Original offers (task status = 'paid', original offer status = 'accepted')

        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select(
            `
            id,
            title,
            description,
            location_text,
            scheduled_date,
            scheduled_time_slot,
            budget,
            status,
            assigned_tasker_id,
            user_profile:profiles!user_id (
              first_name,
              last_name,
              avatar_url
            ),
            categories (name_fi)
          `
          )
          .in('status', ['open', 'paid']); // Look for both open and paid tasks

        if (tasksError) {
          throw tasksError;
        }

        // Now, for each task, check if there's an accepted offer involving our tasker
        const pendingTasksPromises = (tasks || []).map(async (task) => {
          // Case 1: Check for accepted counter offers (task is still 'open')
          if (task.status === 'open') {
            const { data: counterOffer, error: counterOfferError } =
              await supabase
                .from('task_offers')
                .select(
                  'id, offered_price, status, created_at, original_offer_id, is_counter_offer'
                )
                .eq('task_id', task.id)
                .eq('tasker_id', taskerId)
                .eq('is_counter_offer', true)
                .eq('status', 'accepted')
                .single();

            if (counterOfferError && counterOfferError.code !== 'PGRST116') {
              console.error('Error checking counter offer:', counterOfferError);
            }

            // If we found an accepted counter offer, this task is pending payment
            if (counterOffer) {
              return {
                ...task,
                accepted_offer: counterOffer,
                offer_type: 'counter_offer',
              };
            }
          }

          // Case 2: Check for accepted original offers (task is 'paid' and assigned to our tasker)
          if (task.status === 'paid' && task.assigned_tasker_id === taskerId) {
            const { data: originalOffer, error: originalOfferError } =
              await supabase
                .from('task_offers')
                .select(
                  'id, offered_price, status, created_at, is_counter_offer'
                )
                .eq('task_id', task.id)
                .eq('tasker_id', taskerId)
                .eq('is_counter_offer', false)
                .eq('status', 'accepted')
                .single();

            if (originalOfferError && originalOfferError.code !== 'PGRST116') {
              console.error(
                'Error checking original offer:',
                originalOfferError
              );
              return null;
            }

            // If we found an accepted original offer, this task has been paid
            if (originalOffer) {
              return {
                ...task,
                accepted_offer: originalOffer,
                offer_type: 'original_offer',
              };
            }
          }

          return null;
        });

        const resolvedTasks = await Promise.all(pendingTasksPromises);
        const validPendingTasks = resolvedTasks.filter(
          (task) => task !== null
        ) as PendingPaymentTask[];

        console.log('PendingPaymentAlerts debug:', {
          allTasks: tasks?.length || 0,
          validPendingTasks: validPendingTasks.length,
          taskerId,
          validTasks: validPendingTasks,
        });

        setPendingTasks(validPendingTasks);
      } catch (err) {
        console.error('Error fetching pending payment tasks:', err);
        setError('Virhe hyväksyttyjen tarjousten latauksessa');
        setPendingTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (taskerId) {
      fetchPendingPaymentTasks();
    }
  }, [taskerId]);

  const formatTimeSlot = (timeSlot: string | null) => {
    if (!timeSlot) return 'Ei määritelty';
    const slots: { [key: string]: string } = {
      morning: 'Aamupäivä (8-12)',
      afternoon: 'Iltapäivä (12-16)',
      evening: 'Ilta (16-20)',
      flexible: 'Joustava',
    };
    return slots[timeSlot] || timeSlot;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleDismissTask = (taskId: string) => {
    setDismissedTasks((prev) => new Set([...prev, taskId]));
  };

  // Filter out dismissed tasks
  const visibleTasks = pendingTasks.filter(
    (task) => !dismissedTasks.has(task.id)
  );

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Clock className="mr-2 h-5 w-5" />
            Hyväksytyt tarjoukset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-blue-600">Ladataan...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Virhe</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (pendingTasks.length === 0 || visibleTasks.length === 0) {
    return null; // Don't show anything if no pending payments or all dismissed
  }

  return (
    <div className="space-y-3">
      {visibleTasks.map((task) => (
        <div
          key={task.id}
          className={`relative p-4 rounded-lg border ${
            task.offer_type === 'counter_offer' 
              ? 'border-orange-200 bg-orange-50' 
              : 'border-sky-200 bg-sky-50'
          }`}
        >
          {/* Close button */}
          <button
            onClick={() => handleDismissTask(task.id)}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/10 transition-colors"
            aria-label="Sulje"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>

          {/* Compact header */}
          <div className="flex items-start gap-3 pr-8">
            <CheckCircle
              className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                task.offer_type === 'counter_offer' ? 'text-orange-600' : 'text-sky-600'
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm truncate">
                  {task.title}
                </h3>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className="text-lg font-bold text-sky-600">
                    {task.accepted_offer
                      ? formatCurrency(task.accepted_offer.offered_price)
                      : '–'}
                  </span>
                  <Button asChild size="sm" variant="outline" className="h-7 px-2">
                    <Link href={`/dashboard/tasks/${task.id}`}>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
              
              <p className={`text-sm font-medium ${
                task.offer_type === 'counter_offer' ? 'text-orange-800' : 'text-sky-800'
              }`}>
                {task.offer_type === 'counter_offer'
                  ? 'Vastaehdotus hyväksytty – odottaa maksua'
                  : 'Tarjous hyväksytty ja maksettu'}
              </p>
              
              <div className="text-xs text-gray-600 mt-1">
                {task.user_profile?.first_name && task.user_profile?.last_name
                  ? `${task.user_profile.first_name} ${task.user_profile.last_name}`
                  : 'Asiakas'} 
                {task.scheduled_date && (
                  <span className="ml-2">
                    • {format(new Date(task.scheduled_date), 'dd.MM.', { locale: fi })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

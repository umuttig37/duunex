'use client';

import EarlyCompletionConfirmation from '@/components/features/tasks/reviews/early-completion-confirmation';
import TaskReviewSection from '@/components/features/tasks/reviews/task-review-section';
import PaymentFlow from '@/components/features/payment/payment-simulation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Edit3, Euro, MessageSquare, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface OwnerActionsProps {
  task: any;
  currentUser: any;
  assignedTasker?: any;
  userReview?: any;
  taskId: string;
}

export default function OwnerActions({
  task,
  currentUser,
  assignedTasker,
  userReview,
  taskId
}: OwnerActionsProps) {
  const status = task.status;
  const [acceptedOffer, setAcceptedOffer] = useState<any>(null);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Fetch accepted offer and user info for assigned/awaiting payment tasks
  useEffect(() => {
    if (status === 'assigned' || status === 'awaiting_payment') {
      const fetchAcceptedOffer = async () => {
        const supabase = createClient();
        
        // Get the accepted offer
        const { data: offers, error: offersError } = await supabase
          .from('task_offers')
          .select('*')
          .eq('task_id', taskId)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!offersError && offers && offers.length > 0) {
          setAcceptedOffer(offers[0]);
        } else {
          // For direct selection, there might not be an explicit accepted offer yet
          // but we still need to show payment options. Check if we have a tasker assigned
          console.log('No accepted offer found, checking for assigned tasker offers');
          
          // Try to find any offer from the assigned tasker
          const { data: taskerOffers, error: taskerOffersError } = await supabase
            .from('task_offers')
            .select('*')
            .eq('task_id', taskId)
            .eq('tasker_id', task.assigned_tasker_id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!taskerOffersError && taskerOffers && taskerOffers.length > 0) {
            setAcceptedOffer(taskerOffers[0]);
          }
        }

        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      };

      fetchAcceptedOffer();
    }
  }, [status, taskId]);

  // Early completion confirmation
  if (status === 'early_completed') {
    return (
      <div className="space-y-4">
        <EarlyCompletionConfirmation
          taskId={taskId}
          taskTitle={task.title}
          scheduledDate={task.scheduled_date}
          scheduledTimeSlot={task.scheduled_time_slot}
        />
      </div>
    );
  }

  // Open task - Manage offers and edit
  if (status === 'open') {
    return (
      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-white"
          asChild
        >
          <Link href={`#offers`}>
            <Users className="mr-2 h-4 w-4" />
            Hallinnoi tarjouksia
          </Link>
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="w-full border-slate-300 text-slate-600 hover:bg-slate-50"
          asChild
        >
          <Link href={`/dashboard/tasks/edit/${taskId}`}>
            <Edit3 className="mr-2 h-4 w-4" />
            Muokkaa tehtävää
          </Link>
        </Button>
      </div>
    );
  }

  // Assigned/Awaiting Payment task - Payment required
  if ((status === 'assigned' || status === 'awaiting_payment') && (acceptedOffer || task.assigned_tasker_id) && assignedTasker) {
    // Ensure we have a valid price - prioritize offered_price, fallback to budget
    const finalPrice = (acceptedOffer?.offered_price && acceptedOffer.offered_price > 0) 
      ? acceptedOffer.offered_price 
      : (task.budget && task.budget > 0) 
        ? task.budget 
        : null;

    // Handle case where price is missing or invalid
    if (!finalPrice || finalPrice <= 0) {
      return (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center text-red-800">
              <Euro className="h-5 w-5 mr-2" />
              <div>
                <p className="font-medium">Hintatiedot puuttuvat</p>
                <p className="text-sm text-red-700 mt-1">
                  Tehtävältä puuttuu hintatiedot. Ota yhteyttä tukeen.
                </p>
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="lg"
            className="w-full border-slate-300 text-slate-600 hover:bg-slate-50"
            asChild
          >
            <Link href={`/dashboard/messages?receiverId=${task.assigned_tasker_id}&taskId=${taskId}`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Keskustele tekijän kanssa
            </Link>
          </Button>
        </div>
      );
    }

    if (showPaymentFlow) {
      return (
        <div className="space-y-4">
          <PaymentFlow
            taskId={taskId}
            offerId={acceptedOffer?.id || 'direct-selection'}
            taskTitle={task.title}
            taskerName={`${assignedTasker.first_name} ${assignedTasker.last_name}`}
            amount={finalPrice}
            user={user}
            onPaymentSuccess={() => {
              setShowPaymentFlow(false);
              window.location.reload();
            }}
            onCancel={() => setShowPaymentFlow(false)}
          />
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex items-center text-amber-800">
            <Euro className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">Maksu vaaditaan</p>
              <p className="text-sm text-amber-700 mt-1">
                {assignedTasker.first_name} hyväksyi tehtäväsi. Maksa aloittaaksesi työn.
              </p>
            </div>
          </div>
        </div>
        
        <Button
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-white"
          onClick={() => setShowPaymentFlow(true)}
        >
          <Euro className="mr-2 h-4 w-4" />
          Maksa {finalPrice.toFixed(2)}€
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="w-full border-slate-300 text-slate-600 hover:bg-slate-50"
          asChild
        >
          <Link href={`/dashboard/messages?receiverId=${task.assigned_tasker_id}&taskId=${taskId}`}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Keskustele tekijän kanssa
          </Link>
        </Button>
      </div>
    );
  }

  // Paid/In Progress - Chat with tasker
  if ((status === 'paid' || status === 'in_progress') && task.assigned_tasker_id) {
    return (
      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-white"
          asChild
        >
          <Link href={`/dashboard/messages?receiverId=${task.assigned_tasker_id}&taskId=${taskId}`}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Keskustele tekijän kanssa
          </Link>
        </Button>
      </div>
    );
  }

  // Completed - Review tasker
  if ((status === 'completed' || status === 'early_completed') && task.assigned_tasker_id && currentUser) {
    return (
      <div className="space-y-3">
        <TaskReviewSection
          taskId={taskId}
          taskerId={task.assigned_tasker_id}
          userId={currentUser.id}
          taskTitle={task.title}
          taskerName={
            assignedTasker
              ? `${assignedTasker.first_name} ${assignedTasker.last_name}`
              : 'Tekijä'
          }
          userReview={userReview}
        />
      </div>
    );
  }

  return null;
}
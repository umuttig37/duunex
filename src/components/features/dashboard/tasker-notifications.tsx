'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import SmartNotifications, { SmartNotification } from './smart-notifications';

interface TaskerNotificationsProps {
  taskerId: string;
  className?: string;
}

export default function TaskerNotifications({ taskerId, className }: TaskerNotificationsProps) {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      
      try {
        const notifications: SmartNotification[] = [];

        // 1. Pending offers awaiting response
        const { data: pendingOffers } = await supabase
          .from('task_offers')
          .select(`
            id,
            offered_price,
            created_at,
            task:tasks!task_id (
              id,
              title,
              status,
              user_profile:profiles!user_id (
                first_name,
                last_name
              )
            )
          `)
          .eq('tasker_id', taskerId)
          .eq('status', 'pending')
          .eq('is_counter_offer', false)
          .order('created_at', { ascending: false });

        const validOffers = (pendingOffers || []).filter(offer => 
          offer.task && offer.task.status === 'open'
        );

        if (validOffers.length > 0) {
          if (validOffers.length === 1) {
            const offer = validOffers[0];
            notifications.push({
              id: `pending-offer-${offer.id}`,
              type: 'offer',
              priority: 'medium',
              title: 'Tarjous odottaa vastausta',
              message: `Tarjouksesi tehtävään "${offer.task.title}" odottaa asiakkaan vastausta.`,
              actionText: 'Näytä',
              actionUrl: `/dashboard/tasks/${offer.task.id}`,
              timestamp: offer.created_at ?? new Date().toISOString(),
              data: {
                taskId: offer.task.id,
                amount: offer.offered_price
              },
              dismissible: true
            });
          } else {
            notifications.push({
              id: 'pending-offers-multiple',
              type: 'offer',
              priority: 'medium',
              title: 'Tarjoukset odottavat vastausta',
              message: `Sinulla on ${validOffers.length} tarjousta odottamassa asiakkaiden vastauksia.`,
              actionText: 'Näytä kaikki',
              actionUrl: '/dashboard/open-tasks',
              timestamp: validOffers[0]?.created_at ?? new Date().toISOString(),
              data: {
                count: validOffers.length
              },
              dismissible: true
            });
          }
        }

        // 2. Tasks awaiting payment
        const { data: tasksAwaitingPayment } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            updated_at,
            task_offers!inner (
              offered_price,
              status
            )
          `)
          .eq('assigned_tasker_id', taskerId)
          .eq('status', 'assigned')
          .eq('task_offers.status', 'accepted')
          .order('updated_at', { ascending: false });

        if (tasksAwaitingPayment && tasksAwaitingPayment.length > 0) {
          if (tasksAwaitingPayment.length === 1) {
            const task = tasksAwaitingPayment[0];
            const acceptedOffer = Array.isArray(task.task_offers) ? task.task_offers[0] : task.task_offers;
            notifications.push({
              id: `payment-pending-${task.id}`,
              type: 'payment',
              priority: 'high',
              title: 'Odottaa maksua',
              message: `Tehtävä "${task.title}" odottaa asiakkaan maksua. Työ voi alkaa maksun jälkeen.`,
              actionText: 'Näytä',
              actionUrl: `/dashboard/tasks/${task.id}`,
              timestamp: task.updated_at,
              data: {
                taskId: task.id,
                amount: acceptedOffer?.offered_price
              },
              dismissible: false
            });
          } else {
            const totalAmount = tasksAwaitingPayment.reduce((sum, task) => {
              const acceptedOffer = Array.isArray(task.task_offers) ? task.task_offers[0] : task.task_offers;
              return sum + (acceptedOffer?.offered_price || 0);
            }, 0);
            notifications.push({
              id: 'payment-pending-multiple',
              type: 'payment',
              priority: 'high',
              title: 'Tehtävät odottavat maksua',
              message: `${tasksAwaitingPayment.length} tehtävääsi odottaa asiakkaiden maksuja.`,
              actionText: 'Näytä kaikki',
              actionUrl: '/dashboard',
              timestamp: tasksAwaitingPayment[0].updated_at,
              data: {
                count: tasksAwaitingPayment.length,
                amount: totalAmount
              },
              dismissible: false
            });
          }
        }

        // 3. Unread messages
        const { data: unreadMessages } = await supabase
          .from('messages')
          .select(`
            id,
            task_id,
            created_at,
            tasks!task_id (
              id,
              title
            )
          `)
          .eq('receiver_profile_id', taskerId)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (unreadMessages && unreadMessages.length > 0) {
          const uniqueTasks = Array.from(new Set(unreadMessages.map(m => m.task_id)));
          
          if (uniqueTasks.length === 1 && unreadMessages.length === 1) {
            const message = unreadMessages[0];
            notifications.push({
              id: `message-${message.id}`,
              type: 'message',
              priority: 'medium',
              title: 'Uusi viesti',
              message: `Sait uuden viestin tehtävästä "${message.tasks?.title}".`,
              actionText: 'Lue',
              actionUrl: `dashboard/messages?task=${message.task_id}`,
              timestamp: message.created_at ?? new Date().toISOString(),
              data: {
                taskId: message.task_id
              },
              dismissible: true
            });
          } else {
            notifications.push({
              id: 'messages-multiple',
              type: 'message',
              priority: 'medium',
              title: 'Uusia viestejä',
              message: `Sinulla on ${unreadMessages.length} lukematonta viestiä ${uniqueTasks.length} tehtävässä.`,
              actionText: 'Näytä',
              actionUrl: '/dashboard/messages',
              timestamp: unreadMessages[0]?.created_at ?? new Date().toISOString(),
              data: {
                count: unreadMessages.length
              },
              dismissible: true
            });
          }
        }

        // 4. Tasks in progress reminder
        const { data: tasksInProgress } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            scheduled_date,
            scheduled_time_slot,
            updated_at
          `)
          .eq('assigned_tasker_id', taskerId)
          .in('status', ['paid', 'in_progress'])
          .order('scheduled_date', { ascending: true, nullsFirst: false });

        if (tasksInProgress && tasksInProgress.length > 0) {
          const upcomingTasks = tasksInProgress.filter(task => {
            if (!task.scheduled_date) return false;
            const taskDate = new Date(task.scheduled_date);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return taskDate <= tomorrow && taskDate >= new Date();
          });

          if (upcomingTasks.length > 0) {
            const task = upcomingTasks[0];
            notifications.push({
              id: `upcoming-${task.id}`,
              type: 'reminder',
              priority: 'high',
              title: 'Tehtävä huomenna',
              message: `Tehtävä "${task.title}" on aikataulutettu huomiselle.`,
              actionText: 'Näytä',
              actionUrl: `/dashboard/tasks/${task.id}`,
              timestamp: task.updated_at,
              data: {
                taskId: task.id
              },
              dismissible: true
            });
          }
        }

        // Sort by priority and timestamp
        notifications.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        setNotifications(notifications);
        
      } catch (error) {
        console.error('Error fetching tasker notifications:', error);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (taskerId) {
      fetchNotifications();
    }
  }, [taskerId]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <SmartNotifications 
      notifications={notifications}
      className={className}
      compact={notifications.length > 3}
    />
  );
}
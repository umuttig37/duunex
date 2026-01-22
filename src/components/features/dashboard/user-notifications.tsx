'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import SmartNotifications, { SmartNotification } from './smart-notifications';

interface UserNotificationsProps {
  userId: string;
  className?: string;
}

export default function UserNotifications({ userId, className }: UserNotificationsProps) {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      
      try {
        const notifications: SmartNotification[] = [];

        // 1. New offers on open tasks
        const { data: newOffers } = await supabase
          .from('task_offers')
          .select(`
            id,
            offered_price,
            created_at,
            tasker:profiles!tasker_id (
              first_name,
              last_name
            ),
            task:tasks!task_id (
              id,
              title,
              status
            )
          `)
          .eq('task.user_id', userId)
          .eq('status', 'pending')
          .eq('task.status', 'open')
          .order('created_at', { ascending: false })
          .limit(10);

        if (newOffers && newOffers.length > 0) {
          // Group by task
          const offersByTask = newOffers.reduce((acc: any, offer) => {
            const taskId = offer.task?.id;
            if (!taskId) return acc;
            if (!acc[taskId]) acc[taskId] = [];
            acc[taskId].push(offer);
            return acc;
          }, {});

          Object.entries(offersByTask).forEach(([taskId, offers]: [string, any]) => {
            const taskOffers = offers as typeof newOffers;
            const latestOffer = taskOffers[0];
            
            if (taskOffers.length === 1) {
              notifications.push({
                id: `offer-${latestOffer.id}`,
                type: 'offer',
                priority: 'medium',
                title: 'Uusi tarjous',
                message: `${latestOffer.tasker?.first_name || 'Tekijä'} teki tarjouksen tehtävääsi "${latestOffer.task?.title}".`,
                actionText: 'Katso',
                actionUrl: `/dashboard/tasks/${taskId}`,
                timestamp: latestOffer.created_at ?? new Date().toISOString(),
                data: {
                  taskId,
                  amount: latestOffer.offered_price
                },
                dismissible: true
              });
            } else {
              notifications.push({
                id: `offers-${taskId}`,
                type: 'offer',
                priority: 'high',
                title: 'Useita tarjouksia',
                message: `Sait ${taskOffers.length} tarjousta tehtävään "${latestOffer.task?.title}".`,
                actionText: 'Valitse',
                actionUrl: `/dashboard/tasks/${taskId}`,
                timestamp: latestOffer.created_at ?? new Date().toISOString(),
                data: {
                  taskId,
                  count: taskOffers.length
                },
                dismissible: true
              });
            }
          });
        }

        // 2. Tasks that need payment
        const { data: tasksNeedingPayment } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            updated_at,
            task_offers!inner (
              offered_price,
              status,
              tasker:profiles!tasker_id (
                first_name,
                last_name
              )
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'assigned')
          .eq('task_offers.status', 'accepted')
          .order('updated_at', { ascending: false });

        if (tasksNeedingPayment && tasksNeedingPayment.length > 0) {
          tasksNeedingPayment.forEach(task => {
            const acceptedOffer = Array.isArray(task.task_offers) ? task.task_offers[0] : task.task_offers;
            notifications.push({
              id: `payment-needed-${task.id}`,
              type: 'payment',
              priority: 'high',
              title: 'Maksu vaaditaan',
              message: `Hyväksyit ${acceptedOffer?.tasker?.first_name || 'tekijän'} tarjouksen. Maksa aloittaaksesi työn.`,
              actionText: 'Maksa nyt',
              actionUrl: `/dashboard/tasks/${task.id}`,
              timestamp: task.updated_at,
              data: {
                taskId: task.id,
                amount: acceptedOffer?.offered_price
              },
              dismissible: false
            });
          });
        }

          // 2b. Recently paid tasks (celebratory notification)
        const { data: recentlyPaidTasks } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            updated_at,
            assigned_tasker:profiles!assigned_tasker_id (
              first_name,
              last_name
            ),
            task_offers!left (
              offered_price,
              status
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'paid')
          .order('updated_at', { ascending: false })
          .limit(10);

        if (recentlyPaidTasks && recentlyPaidTasks.length > 0) {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 2); // show only last 48h

          recentlyPaidTasks
            .filter(task => new Date(task.updated_at) >= cutoff)
            .forEach(task => {
              const acceptedOffer = Array.isArray(task.task_offers) 
                ? task.task_offers.find((offer: any) => offer.status === 'accepted')
                : null;
              notifications.push({
                id: `payment-received-${task.id}`,
                type: 'payment',
                priority: 'high',
                title: 'Maksu vastaanotettu',
                message: `Maksu vastaanotettiin tehtävään "${task.title}". ${task.assigned_tasker?.first_name || 'Tekijä'} voi aloittaa työn.`,
                actionText: 'Avaa tehtävä',
                actionUrl: `/dashboard/tasks/${task.id}`,
                timestamp: task.updated_at,
                data: {
                  taskId: task.id,
                  amount: acceptedOffer?.offered_price
                },
                dismissible: true
              });
            });
        }

        // 3. Early completion confirmations needed
        const { data: earlyCompletions } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            updated_at,
            assigned_tasker:profiles!assigned_tasker_id (
              first_name,
              last_name
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'early_completed')
          .order('updated_at', { ascending: false });

        if (earlyCompletions && earlyCompletions.length > 0) {
          earlyCompletions.forEach(task => {
            notifications.push({
              id: `early-completion-${task.id}`,
              type: 'confirmation',
              priority: 'high',
              title: 'Vahvistus vaaditaan',
              message: `${task.assigned_tasker?.first_name || 'Tekijä'} ilmoittaa tehtävän "${task.title}" valmistuneeksi etuajassa.`,
              actionText: 'Vahvista',
              actionUrl: `/dashboard/tasks/${task.id}`,
              timestamp: task.updated_at,
              data: {
                taskId: task.id
              },
              dismissible: false
            });
          });
        }

        // 4. Disputed tasks
        const { data: disputedTasks } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            updated_at
          `)
          .eq('user_id', userId)
          .eq('status', 'disputed')
          .order('updated_at', { ascending: false });

        if (disputedTasks && disputedTasks.length > 0) {
          disputedTasks.forEach(task => {
            notifications.push({
              id: `dispute-${task.id}`,
              type: 'dispute',
              priority: 'high',
              title: 'Riita käsittelyssä',
              message: `Tehtävä "${task.title}" on riitautettu ja odottaa ylläpidon ratkaisua.`,
              actionText: 'Näytä',
              actionUrl: `/dashboard/tasks/${task.id}`,
              timestamp: task.updated_at,
              data: {
                taskId: task.id
              },
              dismissible: false
            });
          });
        }

        // 5. Unread messages
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
          .eq('receiver_profile_id', userId)
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
              actionUrl: `/messages?task=${message.task_id}`,
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
              actionUrl: '/messages',
              timestamp: unreadMessages[0]?.created_at ?? new Date().toISOString(),
              data: {
                count: unreadMessages.length
              },
              dismissible: true
            });
          }
        }

        // 6. Tasks without offers (reminder)
        const { data: tasksWithoutOffers } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            created_at,
            offers:task_offers(id)
          `)
          .eq('user_id', userId)
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        const tasksNeedingAttention = (tasksWithoutOffers || []).filter(task => {
          if (!task.offers || task.offers.length > 0) return false;
          const createdAt = new Date(task.created_at);
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          return createdAt <= oneDayAgo;
        });

        if (tasksNeedingAttention.length > 0) {
          const oldestTask = tasksNeedingAttention[0];
          notifications.push({
            id: `no-offers-reminder`,
            type: 'reminder',
            priority: 'low',
            title: tasksNeedingAttention.length === 1 ? 'Tehtävä ei saa tarjouksia' : 'Tehtävät eivät saa tarjouksia',
            message: tasksNeedingAttention.length === 1 
              ? `Tehtävä "${oldestTask.title}" ei ole saanut tarjouksia. Harkitse budjetin nostamista tai kuvauksen päivittämistä.`
              : `${tasksNeedingAttention.length} tehtävää ei ole saanut tarjouksia. Tarkista niiden asetukset.`,
            actionText: 'Muokkaa',
            actionUrl: tasksNeedingAttention.length === 1 
              ? `/dashboard/tasks/${oldestTask.id}` 
              : '/dashboard?filter=open',
            timestamp: oldestTask.created_at,
            data: {
              count: tasksNeedingAttention.length
            },
            dismissible: true
          });
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
        console.error('Error fetching user notifications:', error);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

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
'use client';

import type { DashboardTask } from '@/app/dashboard/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { format, isThisWeek, isToday, isTomorrow } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Calendar, Clock, Eye, MapPin, MessageSquare, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface UpcomingTasksProps {
  taskerId: string;
}

export default function UpcomingTasks({ taskerId }: UpcomingTasksProps) {
  const [upcomingTasks, setUpcomingTasks] = useState<DashboardTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchUpcomingTasks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('tasks')
          .select(`
            *,
            categories (name_fi, icon_url),
            user_profile:profiles!tasks_user_id_profiles_fkey (
              id,
              first_name,
              last_name,
              avatar_url
            ),
            task_attachments (id, file_url, file_type)
          `)
          .eq('assigned_tasker_id', taskerId)
          .in('status', ['paid', 'in_progress'])
          .not('scheduled_date', 'is', null)
          .gte('scheduled_date', new Date().toISOString().split('T')[0]) // Only future dates
          .order('scheduled_date', { ascending: true })
          .limit(10);

        if (fetchError) {
          console.error('Error fetching upcoming tasks:', fetchError);
          setError(fetchError.message);
          setUpcomingTasks([]);
        } else {
          setUpcomingTasks(data || []);
        }
      } catch (err) {
        console.error('Exception fetching upcoming tasks:', err);
        setError('Virhe tehtävien latauksessa');
        setUpcomingTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (taskerId) {
      fetchUpcomingTasks();
    }
  }, [taskerId, supabase]);

  // Helper to format the scheduled date in a user-friendly way
  const formatScheduledDate = (scheduledDate: string) => {
    const date = new Date(scheduledDate);
    
    if (isToday(date)) {
      return 'Tänään';
    } else if (isTomorrow(date)) {
      return 'Huomenna';
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE', { locale: fi }); // Day of week
    } else {
      return format(date, 'dd.MM.yyyy', { locale: fi });
    }
  };

  // Helper to format time slot
  const formatTimeSlot = (timeSlot: string | null) => {
    if (!timeSlot) return '';
    
    const timeSlotMap: { [key: string]: string } = {
      morning: 'Aamupäivä',
      afternoon: 'Iltapäivä', 
      evening: 'Ilta',
      flexible: 'Joustava'
    };
    
    return timeSlotMap[timeSlot] || timeSlot;
  };

  // Helper to get urgency badge
  const getUrgencyBadge = (scheduledDate: string) => {
    const date = new Date(scheduledDate);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return { text: 'Tänään', variant: 'destructive' as const };
    } else if (diffDays === 1) {
      return { text: 'Huomenna', variant: 'default' as const };
    } else if (diffDays <= 7) {
      return { text: 'Tällä viikolla', variant: 'secondary' as const };
    } else {
      return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Tulevat Tehtävät
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">Ladataan tulevia tehtäviä...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Tulevat Tehtävät
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-center py-4">Virhe: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (upcomingTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Tulevat Tehtävät
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            Ei tulevia aikataulutettuja tehtäviä.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Tulevat Tehtävät
          </div>
          <Badge variant="secondary" className="text-xs">
            {upcomingTasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingTasks.map((task) => {
          const urgencyBadge = getUrgencyBadge(task.scheduled_date!);
          
          return (
            <div 
              key={task.id} 
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {task.title}
                    </h3>
                    {urgencyBadge && (
                      <Badge variant={urgencyBadge.variant} className="text-xs">
                        {urgencyBadge.text}
                      </Badge>
                    )}
                  </div>
                  
                  {task.categories?.name_fi && (
                    <p className="text-xs text-gray-500 mb-2">
                      {task.categories.name_fi}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                {/* Date and Time */}
                <div className="flex items-center">
                  <Calendar className="mr-2 h-3 w-3" />
                  <span className="font-medium">
                    {formatScheduledDate(task.scheduled_date!)}
                  </span>
                  {task.scheduled_time_slot && (
                    <>
                      <Clock className="ml-3 mr-1 h-3 w-3" />
                      <span>{formatTimeSlot(task.scheduled_time_slot)}</span>
                    </>
                  )}
                </div>

                {/* Location */}
                {task.location_text && (
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-3 w-3" />
                    <span className="truncate">{task.location_text}</span>
                  </div>
                )}

                {/* Customer */}
                {task.user_profile && (
                  <div className="flex items-center">
                    <User className="mr-2 h-3 w-3" />
                    <span>
                      {task.user_profile.first_name} {task.user_profile.last_name}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/tasks/${task.id}`}>
                    <Eye className="mr-1 h-3 w-3" />
                    Katso
                  </Link>
                </Button>
                {task.status === 'paid' || task.status === 'in_progress' ? (
                  <Button size="sm" variant="default" asChild>
                    <Link href={`/dashboard/messages?taskId=${task.id}&taskerId=${task.assigned_tasker_id}&userId=${task.user_id}`}>
                      <MessageSquare className="mr-1 h-3 w-3" />
                      Viestit
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
} 
'use client';

import { acceptTaskRequest, declineTaskRequest } from '@/app/dashboard/tasks/actions'; // Adjust path as needed
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUnreadTaskRequests } from '@/hooks/tasks/use-unread-task-requests';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { CheckCircle, Info, Loader2, XCircle } from "lucide-react";
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

// Define the type for a task object that this component will handle
// Extend this based on the actual data you need to display for each task request
export type TaskRequest = Database['public']['Tables']['tasks']['Row'] & {
  categories?: {
    name_fi?: string | null;
    // add other category fields if needed
  } | null;
  user?: { // Renamed from profiles to user for clarity based on the join
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
  } | null;
  task_attachments?: Pick<Database['public']['Tables']['task_attachments']['Row'], 'id' | 'file_url' | 'file_type'>[] | null;
  // Add offer-related fields
  offer_id?: string;
  offer_status?: string;
  offered_price?: number;
  offer_message?: string | null;
};

interface TaskRequestsListProps {
  taskerId: string;
}

// Helper function to format time slots in Finnish
const formatTimeSlot = (timeSlot: string | null) => {
  if (!timeSlot) return '';
  const timeSlotMap: { [key: string]: string } = {
    morning: 'Aamupäivä (8-12)',
    afternoon: 'Iltapäivä (12-16)',
    evening: 'Ilta (16-20)',
    flexible: 'Joustava'
  };
  return timeSlotMap[timeSlot] || timeSlot;
};

export default function TaskRequestsList({ taskerId }: TaskRequestsListProps) {
  const [taskRequests, setTaskRequests] = useState<TaskRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);
  const { refetchUnreadCount } = useUnreadTaskRequests();

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'accept' | 'decline';
    taskId: string;
    taskTitle: string;
    customerName: string;
  } | null>(null);

  const supabase = createClient();

  // Prevent hydration mismatches by ensuring component is mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchTaskRequests = async () => {
      setIsLoading(true);
      setError(null);

      // Fetch tasks through task_offers where tasker has pending requests
      // Only show tasks that are still open for requests (not paid, completed, etc.)
      const { data, error: fetchError } = await supabase
        .from('task_offers')
        .select(`
          task_id,
          status,
          offered_price,
          message,
          tasks!inner (
            *,
            categories (name_fi),
            user:profiles!user_id (first_name, last_name, avatar_url),
            task_attachments (id, file_url, file_type)
          )
        `)
        .eq('tasker_id', taskerId)
        .eq('status', 'pending')
        .in('tasks.status', ['open', 'request_sent']) // Only show tasks that are still accepting offers
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching task requests:', fetchError);
        setError(fetchError.message);
        setTaskRequests([]);
      } else {
        // Transform data to expected TaskRequest format
        const transformedData = (data || []).map(offer => ({
          ...offer.tasks,
          offer_id: offer.task_id,
          offer_status: offer.status,
          offered_price: offer.offered_price,
          offer_message: offer.message
        }));
        setTaskRequests(transformedData);
      }
      setIsLoading(false);
    };

    if (taskerId) {
      fetchTaskRequests();
    }
  }, [taskerId, supabase]);

  // Show confirmation dialogs
  const handleAcceptClick = (taskId: string) => {
    const task = taskRequests.find(t => t.id === taskId);
    if (!task) return;

    setConfirmDialog({
      isOpen: true,
      type: 'accept',
      taskId,
      taskTitle: task.title || 'Nimetön tehtävä',
      customerName: task.user ? `${task.user.first_name} ${task.user.last_name}` : 'Tuntematon asiakas'
    });
  };

  const handleDeclineClick = (taskId: string) => {
    const task = taskRequests.find(t => t.id === taskId);
    if (!task) return;

    setConfirmDialog({
      isOpen: true,
      type: 'decline',
      taskId,
      taskTitle: task.title || 'Nimetön tehtävä',
      customerName: task.user ? `${task.user.first_name} ${task.user.last_name}` : 'Tuntematon asiakas'
    });
  };

  // Actual action handlers
  const handleAccept = async (taskId: string) => {
    startTransition(async () => {
      const result = await acceptTaskRequest(taskId);
      if (result.success) {
        toast.success('✅ Tehtäväpyyntö hyväksytty! Asiakas saa maksulinkin. Chat avataan kun asiakas on maksanut.', {
          duration: 6000,
        });
        setTaskRequests(prev => prev.filter(task => task.id !== taskId));
        refetchUnreadCount();
      } else {
        toast.error(`❌ Virhe: ${result.message}`);
      }
    });
    setConfirmDialog(null);
  };

  const handleDecline = async (taskId: string) => {
    startTransition(async () => {
      const result = await declineTaskRequest(taskId);
      if (result.success) {
        toast.success('✅ Tehtäväpyyntö hylätty. Asiakas on saanut ilmoituksen päätöksestäsi.');
        setTaskRequests(prev => prev.filter(task => task.id !== taskId));
        refetchUnreadCount();
      } else {
        toast.error(`❌ Virhe: ${result.message}`);
      }
    });
    setConfirmDialog(null);
  };

  if (!isMounted || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-600">Ladataan tehtäväpyyntöjä...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Virhe</AlertTitle>
        <AlertDescription>
          Tehtäväpyyntöjen lataaminen epäonnistui: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (taskRequests.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Ei uusia tehtäväpyyntöjä</AlertTitle>
        <AlertDescription>
          Sinulla ei ole tällä hetkellä odottavia tehtäväpyyntöjä.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Vastausta odottavat tehtäväpyynnöt</h2>
        <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
          {taskRequests.length} pyyntöä odottaa
        </Badge>
      </div>

      {taskRequests.map((task) => (
        <Card key={task.id} className="shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-amber-400">
          {/* Header with task priority and timing */}
          <div className="bg-gradient-to-r from-amber-50 to-white px-6 py-4 border-b">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {task.title || 'Nimetön tehtävä'}
                  </h3>
                  {task.categories?.name_fi && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {task.categories.name_fi}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    👤 {task.user ? `${task.user.first_name} ${task.user.last_name}` : 'Tuntematon asiakas'}
                  </span>
                  {task.scheduled_date && (
                    <span className="flex items-center">
                      🕒 {format(new Date(task.scheduled_date), 'dd.MM.yyyy', { locale: fi })}
                      {task.scheduled_time_slot && ` • ${formatTimeSlot(task.scheduled_time_slot)}`}
                    </span>
                  )}
                  {task.location_text && (
                    <span className="flex items-center">
                      📍 {task.location_text.split(',')[0]}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={task.status === 'request_sent' ? 'secondary' : 'default'}
                  className="bg-amber-100 text-amber-800 border-amber-200"
                >
                  {task.status === 'request_sent' ? 'Pyyntö lähetetty' : task.status?.replace('_', ' ')}
                </Badge>
                {task.budget && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {task.budget.toFixed(0)}€
                    </div>
                    <div className="text-xs text-gray-500">budjetti</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Task Details */}
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Task Description */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Tehtävän kuvaus:</h4>
                <p className="text-gray-700 leading-relaxed">
                  {task.description || 'Ei kuvausta saatavilla.'}
                </p>
              </div>

              {/* Location Details */}
              {task.location_text && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Sijainti:</h4>
                  <p className="text-gray-700 flex items-center">
                    📍 {task.location_text}
                  </p>
                </div>
              )}

              {/* Timing Information */}
              {task.scheduled_date && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Toivottu aikataulu:</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-900 font-medium">
                      {format(new Date(task.scheduled_date), 'EEEE, dd.MM.yyyy', { locale: fi })}
                      {task.scheduled_time_slot && ` • ${formatTimeSlot(task.scheduled_time_slot)}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Task attachments if any */}
              {task.task_attachments && task.task_attachments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Liitteet:</h4>
                  <p className="text-sm text-gray-600">
                    📎 {task.task_attachments.length} tiedostoa liitetty
                  </p>
                </div>
              )}
            </div>
          </CardContent>

          {/* Enhanced Action Buttons */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-amber-400 rounded-full mr-2 animate-pulse"></span>
              Vastaa pyyntöön mahdollisimman pian
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleDeclineClick(task.id)}
                disabled={isPending}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Hylkää pyyntö
              </Button>
              <Button
                onClick={() => handleAcceptClick(task.id)}
                disabled={isPending}
                className="bg-primary hover:bg-primary/90 text-white px-6"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Hyväksy tarjous
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <AlertDialog open={confirmDialog.isOpen} onOpenChange={() => setConfirmDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {confirmDialog.type === 'accept' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Hyväksy tehtäväpyyntö?
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    Hylkää tehtäväpyyntö?
                  </>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900 mb-1">{confirmDialog.taskTitle}</p>
                  <p className="text-sm text-gray-600">Asiakas: {confirmDialog.customerName}</p>
                </div>

                {confirmDialog.type === 'accept' ? (
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      Hyväksymällä tehtäväpyynnön:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Asiakas saa ilmoituksen ja suorittaa maksun</li>
                      <li>• Viestikenttä avataan asiakkaan kanssa maksun jälkeen</li>
                      <li>• Voit sopia asiakkaan kanssa tehtävän yksityiskohdista</li>
                      <li>• Sitoudut suorittamaan tehtävän sovitusti</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      Hylkäämällä tehtäväpyynnön:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Asiakas saa ilmoituksen hylkäyksestä</li>
                      <li>• Tehtäväpyyntö poistetaan listaltasi</li>
                      <li>• Asiakas voi etsiä toista tekijää</li>
                    </ul>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Peruuta</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => confirmDialog.type === 'accept'
                  ? handleAccept(confirmDialog.taskId)
                  : handleDecline(confirmDialog.taskId)
                }
                className={confirmDialog.type === 'accept'
                  ? 'bg-primary hover:bg-primary/90'
                  : 'bg-red-600 hover:bg-red-700'
                }
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : confirmDialog.type === 'accept' ? (
                  <CheckCircle className="mr-2 h-4 w-4" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                {confirmDialog.type === 'accept' ? 'Kyllä, hyväksy' : 'Kyllä, hylkää'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
} 
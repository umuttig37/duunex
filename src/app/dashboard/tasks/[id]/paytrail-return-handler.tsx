'use client';

import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/shared/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// Define a more specific type for the task data we expect
type TaskData = {
  id: string;
  status: string;
  assigned_tasker_id: string | null;
  // Add other fields that the child components might need
  [key: string]: any;
};

export default function PaytrailReturnHandler({
  children,
  searchParams,
}: {
  children: (taskData: TaskData | null) => React.ReactNode;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [fetchedTask, setFetchedTask] = useState<TaskData | null>(null);

  const isDevelopment = process.env.NODE_ENV === 'development';

  const pollForStatusUpdate = useCallback(async () => {
    const supabase = createClient();
    let attempts = 0;
    const maxAttempts = 60; // Poll for 30 seconds
    const pollInterval = 500;

    const checkStatus = async (): Promise<void> => {
      try {
        // Fetch the full task data, not just the status
        const { data: task, error } = await supabase
          .from('tasks')
          .select(
            `
            *,
            categories:category_id(name_fi, name),
            publisher:profiles!tasks_user_id_fkey(first_name, last_name, avatar_url),
            task_attachments(id, file_url, file_type),
            assignedTasker:profiles!tasks_assigned_tasker_id_fkey(id, first_name, last_name, avatar_url, bio)
          `
          )
          .eq('id', taskId)
          .single();

        if (error) {
          console.error('Polling error:', error);
          // Continue polling even if there's an error, as it might be a temporary issue
        }

        if (task?.status === 'paid') {
          console.log('Polling success: Task is paid. Rendering content.');
          toast({
            title: 'Tila päivitetty!',
            description: 'Tehtävä on nyt merkitty maksetuksi.',
            variant: 'default',
          });
          setFetchedTask(task as TaskData); // Set the fetched task data
          setIsPolling(false);
          setIsProcessing(false);
          // No router.refresh() needed, as we're now managing state
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, pollInterval);
        } else {
          console.warn('Polling timeout. Webhook may be delayed.');
          toast({
            title: 'Maksun käsittely odottaa vahvistusta',
            description:
              'Webhook-varmennus on viivästynyt. Sivu päivittyy automaattisesti, kun tila on vahvistettu.',
            variant: 'default',
            duration: 10000,
          });
          if (!isDevelopment) {
            setIsPolling(false);
            setIsProcessing(false);
            router.refresh(); // Fallback refresh for production
          }
        }
      } catch (error) {
        console.error('Polling exception:', error);
        setIsPolling(false);
        setIsProcessing(false);
        router.refresh();
      }
    };

    // Start polling after a short delay to allow the webhook to arrive first
    setTimeout(checkStatus, 2000);
  }, [taskId, router, isDevelopment]);

  useEffect(() => {
    const paymentStatus =
      searchParams['payment'] || searchParams['checkout-status'];
    const isMock = searchParams['mock'] === '1' || searchParams['mock'] === 'true';

    if (paymentStatus && !isPolling && !fetchedTask) {
      setIsProcessing(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      if (paymentStatus === 'success' || paymentStatus === 'ok') {
        // In mock mode we don't have a real webhook updating the task status,
        // so fetch the latest task data once and stop processing.
        if (isMock) {
          const fetchOnce = async () => {
            try {
              const supabase = createClient();
              const { data: task } = await supabase
                .from('tasks')
                .select(
                  `
                  *,
                  categories:category_id(name_fi, name),
                  publisher:profiles!tasks_user_id_fkey(first_name, last_name, avatar_url),
                  task_attachments(id, file_url, file_type),
                  assignedTasker:profiles!tasks_assigned_tasker_id_fkey(id, first_name, last_name, avatar_url, bio)
                `
                )
                .eq('id', taskId)
                .single();

              if (task) {
                setFetchedTask(task as TaskData);
              }
            } finally {
              setIsProcessing(false);
              setIsPolling(false);
            }
          };

          toast({
            title: 'Maksu (mock) onnistui!',
            description: 'Päivitetään näkymä ilman webhook-odotusta.',
            variant: 'default',
            duration: 6000,
          });

          fetchOnce();
        } else {
          toast({
            title: 'Maksu onnistui!',
            description: 'Pävitetään tehtävän tilaa. Tämä voi kestää hetken...',
            variant: 'default',
            duration: 8000,
          });
          setIsPolling(true);
          pollForStatusUpdate();
        }
      } else if (paymentStatus === 'cancel' || paymentStatus === 'fail') {
        toast({
          title: 'Maksu peruutettu tai epäonnistui',
          description: 'Voit yrittää uudelleen milloin tahansa.',
          variant: 'destructive',
          duration: 5000,
        });
        setIsProcessing(false);
      }
    }
  }, [searchParams, isPolling, taskId, pollForStatusUpdate, fetchedTask]);

  const handleSimulation = async () => {
    if (!isDevelopment) return;
    setIsSimulating(true);
    toast({
      title: 'Simuloidaan Webhookia...',
      description: 'Päivitetään tehtävän tila manuaalisesti.',
    });

    try {
      const response = await fetch('/api/paytrail-callback/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) {
        throw new Error('Simulaation suorittaminen epäonnistui.');
      }

      // After simulation, trigger polling to fetch the updated data
      setIsPolling(true);
      pollForStatusUpdate();
    } catch (error) {
      console.error('Error during simulation:', error);
      toast({
        title: 'Simulaatio epäonnistui',
        description: 'Tapahtui virhe. Tarkista konsoli saadaksesi lisätietoja.',
        variant: 'destructive',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8">
          <svg
            className="animate-spin h-12 w-12 text-sky-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <h1 className="text-2xl font-bold text-slate-800">
            Käsitellään maksua...
          </h1>
          <p className="text-slate-600 mt-2 max-w-md">
            Odotetaan vahvistusta Paytrail-palvelimelta. Tämä voi kestää hetken.
            Älä sulje tai päivitä tätä sivua.
          </p>
          {isDevelopment && (
            <div className="mt-8 p-4 border-t border-dashed">
              <h3 className="text-lg font-semibold text-slate-700">
                Kehitystyökalut
              </h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                Koska olet kehitysympäristössä, voit ohittaa odotuksen
                simuloimalla onnistunutta webhook-kutsua.
              </p>
              <Button
                onClick={handleSimulation}
                disabled={isSimulating}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isSimulating
                  ? 'Simuloidaan...'
                  : 'Paina tästä simuloidaksesi onnistunutta maksua'}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Pass the fetched task data to the children, or null if not yet fetched
  return <>{children(fetchedTask)}</>;
}

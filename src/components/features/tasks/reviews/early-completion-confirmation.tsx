'use client';

import { confirmEarlyCompletion, rejectEarlyCompletion } from '@/app/dashboard/tasks/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/shared/use-toast';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useTransition } from 'react';

interface EarlyCompletionConfirmationProps {
  taskId: string;
  taskTitle: string;
  scheduledDate?: string | null;
  scheduledTimeSlot?: string | null;
}

export default function EarlyCompletionConfirmation({
  taskId,
  taskTitle,
  scheduledDate,
  scheduledTimeSlot
}: EarlyCompletionConfirmationProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmEarlyCompletion(taskId);
      if (result.success) {
        toast({
          title: "Aikainen valmistuminen vahvistettu",
          description: result.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Virhe",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectEarlyCompletion(taskId);
      if (result.success) {
        toast({
          title: "Aikainen valmistuminen hylätty",
          description: result.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Virhe",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fi-FI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeSlot = (timeSlot: string) => {
    const slots: { [key: string]: string } = {
      morning: 'Aamupäivä (klo 8-12)',
      afternoon: 'Iltapäivä (klo 12-16)',
      evening: 'Ilta (klo 16-20)',
      flexible: 'Joustava',
    };
    return slots[timeSlot] || timeSlot;
  };

  return (
    <Card className="border-orange-200 bg-orange-50 w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800 text-sm sm:text-base">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <span className="leading-tight">Aikainen valmistuminen - Vahvistus vaaditaan</span>
        </CardTitle>
        <CardDescription className="text-orange-700 text-xs sm:text-sm">
          Taskeri on merkinnyt tehtävän valmiiksi ennen aikataulutettua päivämäärää.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-3 rounded-lg border">
          <h4 className="font-medium text-xs sm:text-sm mb-2">Tehtävän tiedot:</h4>
          <p className="text-xs sm:text-sm text-gray-700 mb-2 break-words">{taskTitle}</p>
          {scheduledDate && (
            <p className="text-xs sm:text-sm text-gray-600 break-words">
              Alkuperäinen aikataulu: {formatDate(scheduledDate)}
              {scheduledTimeSlot && `, ${formatTimeSlot(scheduledTimeSlot)}`}
            </p>
          )}
        </div>

        <div className="bg-orange-100 p-3 rounded-lg border border-orange-200">
          <p className="text-xs sm:text-sm text-orange-800">
            <strong>Huomio:</strong> Taskeri on suorittanut tehtävän ennen sovittua aikaa.
            Vahvista että tämä on hyväksyttävää ja työ on tehty sovitulla tavalla.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2 w-full">
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            className="w-full sm:flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm py-2 px-3"
          >
            <CheckCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">Vahvista valmistuminen</span>
          </Button>
          <Button
            onClick={handleReject}
            disabled={isPending}
            variant="outline"
            className="w-full sm:flex-1 border-red-200 text-red-700 hover:bg-red-500 text-xs sm:text-sm py-2 px-3"
          >
            <XCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">Hylkää aikainen valmistuminen</span>
          </Button>
        </div>

        <p className="text-xs text-gray-600 mt-3 break-words">
          Jos hylkäät aikaisen valmistumisen, tehtävä palautetaan "työn alla" -tilaan ja taskeri
          jatkaa työtä alkuperäisen aikataulun mukaisesti.
        </p>
      </CardContent>
    </Card>
  );
} 
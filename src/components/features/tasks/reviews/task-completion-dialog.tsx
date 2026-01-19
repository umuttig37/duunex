'use client';

import { markTaskCompleted } from '@/app/dashboard/tasks/actions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/shared/use-toast';
import { format, isBefore, isToday } from 'date-fns';
import { fi } from 'date-fns/locale';
import { AlertTriangle, Calendar, CheckCircle, Clock } from 'lucide-react';
import { useState, useTransition } from 'react';

interface TaskCompletionDialogProps {
  taskId: string;
  taskTitle: string;
  scheduledDate?: string | null;
  scheduledTimeSlot?: string | null;
  children: React.ReactNode; // The trigger button
}

export default function TaskCompletionDialog({
  taskId,
  taskTitle,
  scheduledDate,
  scheduledTimeSlot,
  children
}: TaskCompletionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Check if task is being completed before scheduled date
  const isEarlyCompletion = scheduledDate && isBefore(new Date(), new Date(scheduledDate)) && !isToday(new Date(scheduledDate));

  const handleMarkCompleted = async () => {
    if (!userConfirmed) {
      toast({
        title: "Vahvistus puuttuu",
        description: "Sinun täytyy vahvistaa että tehtävä on todella valmis.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await markTaskCompleted(taskId);
      if (result.success) {
        toast({
          title: "Tehtävä merkitty valmiiksi!",
          description: result.message,
          variant: "default",
        });
        setIsOpen(false);
        setUserConfirmed(false);
      } else {
        toast({
          title: "Virhe",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  const resetDialog = () => {
    setUserConfirmed(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetDialog();
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Merkitse tehtävä valmiiksi
          </DialogTitle>
          <DialogDescription>
            Varmista että tehtävä on todella valmis ennen merkitsemistä.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-1">Tehtävä:</h4>
            <p className="text-sm text-gray-700">{taskTitle}</p>

            {scheduledDate && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  Aikataulutettu: {format(new Date(scheduledDate), 'dd.MM.yyyy', { locale: fi })}
                  {scheduledTimeSlot && `, ${scheduledTimeSlot}`}
                </span>
              </div>
            )}
          </div>

          {/* Early completion warning */}
          {isEarlyCompletion && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Aikainen valmistuminen</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Merkit tehtävän valmiiksi ennen aikataulutettua päivämäärää.
                    Varmista että asiakas on tietoinen tästä ja hyväksyy aikaisen valmistumisen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Regular completion info */}
          {!isEarlyCompletion && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Tehtävän valmistuminen</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Kun merkit tehtävän valmiiksi, asiakas saa ilmoituksen ja voi arvioida työsi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* User confirmation checkbox */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="task-completed"
                checked={userConfirmed}
                onCheckedChange={(checked) => setUserConfirmed(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="task-completed"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Vahvistan että tehtävä on valmis
                </label>
                <p className="text-xs text-muted-foreground">
                  {isEarlyCompletion
                    ? "Tehtävä on suoritettu loppuun asiakkaan hyväksynnällä ennen aikataulutettua päivämäärää."
                    : "Tehtävä on suoritettu loppuun sovitulla tavalla ja asiakas voi tarkistaa tuloksen."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Peruuta
            </Button>
            <Button
              onClick={handleMarkCompleted}
              disabled={isPending || !userConfirmed}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Merkitsee...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Merkitse valmiiksi
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
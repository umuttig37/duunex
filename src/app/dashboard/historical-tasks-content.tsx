'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import Link from 'next/link';
import type { DashboardTask } from './page'; // Assuming DashboardTask is defined in ./page.tsx

interface HistoricalTasksContentProps {
  tasks: DashboardTask[];
}

// Helper to format task status for display
const formatTaskStatus = (status: string) => {
  const statusMap: { [key: string]: { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
    open: { text: 'Avoin', variant: 'outline' },
    assigned: { text: 'Määritetty', variant: 'default' },
    paid: { text: 'Maksettu', variant: 'default' },
    in_progress: { text: 'Työn alla', variant: 'default' },
    completed: { text: 'Valmis', variant: 'secondary' },
    early_completed: { text: 'Odottaa vahvistusta', variant: 'default' },
    cancelled: { text: 'Peruttu', variant: 'destructive' },
    disputed: { text: 'Riitautettu', variant: 'destructive' },
  };
  return statusMap[status] || { text: status, variant: 'outline' };
};

export default function HistoricalTasksContent({ tasks }: HistoricalTasksContentProps) {
  const historicalTasks = tasks.filter(task => task.status === 'completed' || task.status === 'cancelled');
  const viewTitle = "Työhistoria";
  const noTasksMessage = "Työhistoriassasi ei ole vielä tehtäviä.";

  if (historicalTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{viewTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{noTasksMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-gray-700">{viewTitle}</h2>
      {historicalTasks.map((task) => {
        const displayStatus = formatTaskStatus(task.status);
        return (
          <Card key={task.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-semibold text-primary hover:underline">
                  <Link href={`/dashboard/tasks/${task.id}`}>{task.title}</Link>
                </CardTitle>
                <Badge variant={displayStatus.variant} className="capitalize whitespace-nowrap">
                  {displayStatus.text}
                </Badge>
              </div>
              {task.categories?.name_fi && (
                <CardDescription className="text-sm text-gray-500">
                  Kategoria: {task.categories.name_fi}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 line-clamp-2 mb-2">{task.description}</p>
              <div className="text-sm text-gray-500 space-y-1">
                {task.user_profile && (
                  <p className="font-medium text-gray-800">
                    Asiakas: {task.user_profile.first_name} {task.user_profile.last_name}
                  </p>
                )}
                {task.location_text && <p>Sijainti: {task.location_text}</p>}
                {task.scheduled_date && (
                  <p>
                    Ajankohta: {format(new Date(task.scheduled_date), 'PPP', { locale: fi })}
                    {task.scheduled_time_slot && `, ${task.scheduled_time_slot}`}
                  </p>
                )}
              </div>
            </CardContent>
            {/* No specific footer actions for historical tasks in this example */}
          </Card>
        );
      })}
    </div>
  );
} 
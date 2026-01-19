'use client';

import CompactTaskCard from '@/components/features/tasks/detail/compact-task-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';
import type { DashboardTask } from './page';

interface TaskerHistoryContentProps {
  tasks: DashboardTask[];
  currentUserId: string;
}

export default function TaskerHistoryContent({
  tasks,
  currentUserId,
}: TaskerHistoryContentProps) {
  const completedTasks = tasks.filter((task) => task.status === 'completed');
  const cancelledTasks = tasks.filter(
    (task) => task.status === 'cancelled' || task.status === 'disputed'
  );

  // Helper function to determine if task should be highlighted (simplified approach)
  const shouldHighlight = (task: DashboardTask): boolean => {
    // Only highlight special cases like accepted counter offers
    const hasAcceptedCounterOffer =
      task.accepted_offer &&
      task.accepted_offer.status === 'accepted' &&
      task.accepted_offer.is_counter_offer;
    const hasCounterOfferAwaitingPayment =
      hasAcceptedCounterOffer && task.status === 'open';

    return !!hasCounterOfferAwaitingPayment;
  };

  const TaskGrid = ({ tasks: gridTasks }: { tasks: DashboardTask[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
      {gridTasks.map((task) => (
        <CompactTaskCard
          key={task.id}
          task={task}
          currentUserId={currentUserId}
          highlight={shouldHighlight(task)}
        />
      ))}
    </div>
  );

  const EmptyState = ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 mb-4 text-gray-300">
        <History className="w-full h-full" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Suoritetut Tehtävät</CardTitle>
        </CardHeader>
        <CardContent>
          {completedTasks.length > 0 ? (
            <TaskGrid tasks={completedTasks} />
          ) : (
            <EmptyState
              title="Ei suoritettuja tehtäviä"
              description="Täällä näet kaikki onnistuneesti valmistuneet työt."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Peruutetut tai Riitautetut Tehtävät</CardTitle>
        </CardHeader>
        <CardContent>
          {cancelledTasks.length > 0 ? (
            <TaskGrid tasks={cancelledTasks} />
          ) : (
            <EmptyState
              title="Ei peruutettuja tehtäviä"
              description="Täällä näet kaikki peruutetut tai riitautetut tehtävät."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

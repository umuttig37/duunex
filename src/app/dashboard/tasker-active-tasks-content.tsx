'use client';

import CompactTaskCard from '@/components/features/tasks/detail/compact-task-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, Zap } from 'lucide-react';
import type { DashboardTask } from './page';

interface TaskerActiveTasksContentProps {
  tasks: DashboardTask[];
  currentUserId?: string;
}

export default function TaskerActiveTasksContent({
  tasks,
  currentUserId,
}: TaskerActiveTasksContentProps) {
  // Helper function to check if task is upcoming (within next 7 days)
  const isUpcoming = (task: DashboardTask) => {
    if (!task.scheduled_date) return false;
    const scheduledDate = new Date(task.scheduled_date);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return scheduledDate >= now && scheduledDate <= sevenDaysFromNow;
  };

  // Helper function to determine priority status
  const isPriority = (task: DashboardTask) => {
    return (
      task.status === 'paid' || task.status === 'assigned' || isUpcoming(task)
    );
  };

  // Separate active and completed tasks clearly
  const activeTasks = tasks.filter(
    (task) =>
      task.status === 'open' ||
      task.status === 'paid' ||
      task.status === 'assigned' ||
      task.status === 'in_progress'
  );

  const completedTasks = tasks.filter((task) => task.status === 'completed');

  const earlyCompletedTasks = tasks.filter(
    (task) => task.status === 'early_completed'
  );

  // Sort tasks by scheduled date for paid/upcoming tasks, then by created date
  const sortTasks = (taskList: DashboardTask[]) => {
    return [...taskList].sort((a, b) => {
      const aHasScheduled =
        a.scheduled_date &&
        (a.status === 'paid' || a.status === 'assigned' || isUpcoming(a));
      const bHasScheduled =
        b.scheduled_date &&
        (b.status === 'paid' || b.status === 'assigned' || isUpcoming(b));

      // Both have scheduled dates - sort by scheduled date
      if (aHasScheduled && bHasScheduled) {
        return (
          new Date(a.scheduled_date!).getTime() -
          new Date(b.scheduled_date!).getTime()
        );
      }

      // One has scheduled date, prioritize it
      if (aHasScheduled && !bHasScheduled) return -1;
      if (!aHasScheduled && bHasScheduled) return 1;

      // Neither has scheduled date - sort by created date (newest first)
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  };

  const sortedActiveTasks = sortTasks(activeTasks);
  const sortedCompletedTasks = sortTasks(completedTasks);
  const sortedEarlyCompletedTasks = sortTasks(earlyCompletedTasks);

  // Count different types for statistics
  const openCount = activeTasks.filter((task) => task.status === 'open').length;
  const paidCount = activeTasks.filter((task) => task.status === 'paid').length;
  const inProgressCount = activeTasks.filter(
    (task) => task.status === 'in_progress'
  ).length;

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

  // Task grid component
  const TaskGrid = ({ tasks: gridTasks }: { tasks: DashboardTask[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
      {gridTasks.map((task) => (
        <CompactTaskCard
          key={task.id}
          task={task}
          currentUserId={currentUserId || ''}
          highlight={shouldHighlight(task)}
        />
      ))}
    </div>
  );

  // Empty state component
  const EmptyState = ({
    icon: Icon,
    title,
    description,
  }: {
    icon: any;
    title: string;
    description: string;
  }) => (
    <div className="text-center py-6 sm:py-8">
      <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-3 text-gray-300">
        <Icon className="w-full h-full" />
      </div>
      <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto">
        {description}
      </p>
    </div>
  );

  const totalTasks =
    sortedActiveTasks.length +
    sortedCompletedTasks.length +
    sortedEarlyCompletedTasks.length;

  if (totalTasks === 0) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 mb-4 text-gray-300">
            <Clock className="w-full h-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ei aktiivisia tehtäviä
          </h3>
          <p className="text-gray-500 mb-6">
            Sinulla ei ole tällä hetkellä määrättyjä tehtäviä.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl space-y-8">
      {/* Statistics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Omat Tehtäväni
          </h2>
          <p className="text-gray-600">Tehtävät jotka on määrätty sinulle</p>
        </div>
        <div className="flex items-center gap-3">
          {openCount > 0 && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-2 rounded-lg border border-yellow-200">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 animate-pulse"></div>
              <span className="text-sm font-medium text-yellow-700">
                {openCount} avointa
              </span>
            </div>
          )}
          {paidCount + inProgressCount > 0 && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-sky-50 px-4 py-2 rounded-lg border border-blue-200">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-sky-500 animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700">
                {paidCount + inProgressCount} työn alla
              </span>
            </div>
          )}
          {completedTasks.length > 0 && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-lg border border-green-200">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">
                {completedTasks.length} valmista
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Early Completed Tasks - Highest Priority */}
      {sortedEarlyCompletedTasks.length > 0 && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-orange-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                Odottaa Asiakkaan Vahvistusta
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-orange-100 border-orange-300 text-orange-700"
              >
                {sortedEarlyCompletedTasks.length} tehtävää
              </Badge>
            </div>
            <p className="text-sm text-orange-700">
              Nämä tehtävät on merkitty valmiiksi aikaisin ja odottavat
              asiakkaan vahvistusta
            </p>
          </CardHeader>
          <CardContent>
            <TaskGrid tasks={sortedEarlyCompletedTasks} />
          </CardContent>
        </Card>
      )}

      {/* Active Tasks */}
      {sortedActiveTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Aktiiviset Tehtävät
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-700"
              >
                {sortedActiveTasks.length} tehtävää
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Tehtävät joissa työtä tehdään tai joita odotetaan aloitettavan
            </p>
          </CardHeader>
          <CardContent>
            <TaskGrid tasks={sortedActiveTasks} />
          </CardContent>
        </Card>
      )}

      {/* Separator if both active and completed exist */}
      {sortedActiveTasks.length > 0 && sortedCompletedTasks.length > 0 && (
        <div className="flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-sm text-gray-500 font-medium px-4">
            Valmiit Tehtävät
          </span>
          <Separator className="flex-1" />
        </div>
      )}

      {/* Completed Tasks */}
      {sortedCompletedTasks.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-green-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-green-900 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Valmiit Tehtävät
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-green-100 border-green-300 text-green-700"
              >
                {sortedCompletedTasks.length} tehtävää
              </Badge>
            </div>
            <p className="text-sm text-green-700">
              Onnistuneesti suoritetut ja asiakkaan hyväksymät tehtävät
            </p>
          </CardHeader>
          <CardContent>
            <TaskGrid tasks={sortedCompletedTasks} />
          </CardContent>
        </Card>
      )}

      {/* Show empty states for individual sections if needed */}
      {sortedActiveTasks.length === 0 && totalTasks > 0 && (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={Clock}
              title="Ei aktiivisia tehtäviä"
              description="Kaikki määrätyt tehtävät on suoritettu"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

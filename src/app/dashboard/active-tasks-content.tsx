'use client';

import CompactTaskCard from '@/components/features/tasks/detail/compact-task-card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Clock, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { DashboardTask } from './page'; // Assuming DashboardTask is defined in ./page.tsx

interface ActiveTasksContentProps {
  tasks: DashboardTask[];
  currentUserId?: string;
}

export default function ActiveTasksContent({
  tasks,
  currentUserId,
}: ActiveTasksContentProps) {
  const [isDisabledSectionOpen, setIsDisabledSectionOpen] = useState(false);
  // Active tasks include open, paid, in_progress, and completed tasks (tasks that are actively worked on or recently finished)
  const activeTasks = tasks.filter(
    (task) =>
      task.status === 'open' ||
      task.status === 'paid' ||
      task.status === 'in_progress' ||
      task.status === 'completed'
  );

  // Separate disabled tasks
  const disabledTasks = tasks.filter((task) => task.status === 'disabled');

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

  // Helper function to determine if task should be highlighted
  /*   const shouldHighlight = (task: DashboardTask) => {
    return isPriority(task) || task.status === 'completed' || task.status === 'open';
  };
 */
  // Sort tasks by scheduled date for paid/upcoming tasks, then by created date
  const sortedActiveTasks = [...activeTasks].sort((a, b) => {
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
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Count completed and open tasks
  const completedCount = activeTasks.filter(
    (task) => task.status === 'completed'
  ).length;
  const openCount = activeTasks.filter((task) => task.status === 'open').length;
  const highlightedCount = activeTasks.filter((task) =>
    shouldHighlight(task)
  ).length;

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
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 mb-4 text-gray-300">
        <Icon className="w-full h-full" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
    </div>
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

  // Task grid component - same as in user dashboard
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

  if (sortedActiveTasks.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Ei aktiivisia tehtäviä"
        description="Sinulla ei ole tällä hetkellä aktiivisia tehtäviä."
      />
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Aktiiviset Tehtävät
            </h2>
            <p className="text-gray-600">
              Tehtävät, joita työstät parhaillaan tai jotka ovat vastikään
              valmistuneet
            </p>
          </div>
          {highlightedCount > 0 && (
            <div className="flex items-center gap-3">
              {openCount > 0 && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-2 rounded-lg border border-yellow-200">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-yellow-700">
                    {openCount} avointa
                  </span>
                </div>
              )}

              {completedCount > 0 && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-lg border border-green-200">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">
                    {completedCount} valmista
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <TaskGrid tasks={sortedActiveTasks} />

      {/* Disabled tasks section */}
      {disabledTasks.length > 0 && (
        <div className="mt-8">
          <Collapsible open={isDisabledSectionOpen} onOpenChange={setIsDisabledSectionOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 group">
              <EyeOff className="h-4 w-4" />
              <span className="font-medium">Piilotetut tehtävät ({disabledTasks.length})</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isDisabledSectionOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <TaskGrid tasks={disabledTasks} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}

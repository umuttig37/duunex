import TaskOffersList from '@/components/features/tasks/offers/task-offers-list';
import { Users } from 'lucide-react';

interface OffersSectionProps {
  taskId: string;
  isTaskOwner: boolean;
  status: string;
}

export default function OffersSection({ taskId, isTaskOwner, status }: OffersSectionProps) {
  // Only show offers section to task owner when task is open
  if (!isTaskOwner || status !== 'open') {
    return null;
  }

  return (
    <div id="offers" className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">Saadut tarjoukset</h2>
      </div>
      <TaskOffersList taskId={taskId} isTaskOwner={isTaskOwner} />
    </div>
  );
}
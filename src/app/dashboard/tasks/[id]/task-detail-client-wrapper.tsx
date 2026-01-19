'use client';

import ModernTaskDetailContent from '@/components/features/tasks/detail/ModernTaskDetailContent';
import PaytrailReturnHandler from './paytrail-return-handler';

interface TaskDetailClientWrapperProps {
  task: any;
  assignedTasker: any;
  offers: any[] | null;
  currentUser: any;
  userProfile: any;
  userReview: any;
  taskId: string;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function TaskDetailClientWrapper({
  task,
  assignedTasker,
  offers,
  currentUser,
  userProfile,
  userReview,
  taskId,
  searchParams,
}: TaskDetailClientWrapperProps) {
  return (
    <PaytrailReturnHandler searchParams={searchParams}>
      {(clientFetchedTask) => (
        <ModernTaskDetailContent
          task={task}
          assignedTasker={assignedTasker}
          offers={offers}
          currentUser={currentUser}
          userProfile={userProfile}
          userReview={userReview}
          taskId={taskId}
          clientFetchedTask={clientFetchedTask}
        />
      )}
    </PaytrailReturnHandler>
  );
}

'use client';

import AssignedTaskerCard from './AssignedTaskerCard';
import { EarlyCompletionBanner } from './ContextBanner';
import MediaGallery from './MediaGallery';
import OffersSection from './OffersSection';
import Overview from './Overview';
import OwnerActions from './OwnerActions';
import PricePanel from './PricePanel';
import PublisherCard from './PublisherCard';
import ReviewSection from './ReviewSection';
import TaskHeader from './TaskHeader';
import TaskerActions from './TaskerActions';
import { Star } from 'lucide-react';

// Define a type for the offer object
type Offer = {
  tasker_id: string;
  offered_price: number;
  status: string;
};

interface ModernTaskDetailContentProps {
  task: any;
  assignedTasker: any;
  offers: Offer[] | null;
  currentUser: any;
  userProfile: any;
  userReview: any;
  taskId: string;
  clientFetchedTask?: any;
}

export default function ModernTaskDetailContent({
  task,
  assignedTasker,
  offers,
  currentUser,
  userProfile,
  userReview,
  taskId,
  clientFetchedTask,
}: ModernTaskDetailContentProps) {
  // Use clientFetchedTask if available, otherwise fall back to server task
  const displayTask = clientFetchedTask || task;
  const assignedTaskerDetails = clientFetchedTask
    ? (clientFetchedTask as any).assignedTasker
    : assignedTasker;

  // Calculate derived variables based on the most current task data
  const acceptedOffer = offers?.find(
    (offer: Offer) => offer.status === 'accepted'
  );
  const finalPrice = acceptedOffer?.offered_price || displayTask.budget;
  const isTaskOwner = currentUser?.id === displayTask.user_id;
  const isTasker = userProfile?.role === 'tasker';
  const isAssignedTasker =
    isTasker && currentUser?.id === displayTask.assigned_tasker_id;
  const canTaskerInteract =
    isTasker && !isTaskOwner && displayTask.status === 'open';

  // Check if the current tasker has already submitted an offer
  const hasAlreadyOffered =
    isTasker && currentUser
      ? !!offers?.some((offer: Offer) => offer.tasker_id === currentUser.id)
      : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <TaskHeader
        title={displayTask.title}
        category={displayTask.categories}
        status={displayTask.status}
        createdAt={displayTask.created_at}
        scheduledDate={displayTask.scheduled_date}
        scheduledTimeSlot={displayTask.scheduled_time_slot}
        isTaskOwner={isTaskOwner}
        taskId={taskId}
        offers={offers}
      />

      {/* Early Completion Banner */}
      {displayTask.status === 'early_completed' && isTaskOwner && (
        <div className="mb-6">
          <EarlyCompletionBanner 
            scheduledDate={displayTask.scheduled_date} 
            requestedAt={displayTask.updated_at || displayTask.created_at}
          />
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column: Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media Gallery */}
          {displayTask.task_attachments && displayTask.task_attachments.length > 0 && (
            <MediaGallery
              attachments={displayTask.task_attachments}
              taskTitle={displayTask.title}
            />
          )}

          {/* Overview */}
          <Overview
            description={displayTask.description}
            locationText={displayTask.location_text}
            scheduledDate={displayTask.scheduled_date}
            scheduledTimeSlot={displayTask.scheduled_time_slot}
          />

          {/* Offers Section (only for owner when open) */}
          <OffersSection
            taskId={taskId}
            isTaskOwner={isTaskOwner}
            status={displayTask.status}
          />

          {/* Review Section (only when completed) */}
          <ReviewSection taskId={taskId} status={displayTask.status}>
            {isTaskOwner &&
              (displayTask.status === 'completed' || displayTask.status === 'early_completed') &&
              displayTask.assigned_tasker_id &&
              currentUser && (
                <OwnerActions
                  task={displayTask}
                  currentUser={currentUser}
                  assignedTasker={assignedTaskerDetails}
                  userReview={userReview}
                  taskId={taskId}
                />
              )}
            
            {/* Show user review to taskers when task is completed */}
            {isAssignedTasker &&
              (displayTask.status === 'completed' || displayTask.status === 'early_completed') &&
              userReview && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Asiakkaan arvostelu
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < userReview.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-lg font-semibold text-gray-900">
                        {userReview.rating}/5
                      </span>
                    </div>
                    {userReview.comment && (
                      <p className="text-gray-700 text-sm leading-relaxed">
                        "{userReview.comment}"
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Annettu {new Date(userReview.created_at).toLocaleDateString('fi-FI', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
          </ReviewSection>
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Price Panel with CTAs */}
          <PricePanel
            finalPrice={finalPrice}
            originalBudget={displayTask.budget}
            hasAcceptedOffer={!!acceptedOffer}
            status={displayTask.status}
          >
            {/* Owner Actions */}
            {isTaskOwner && (
              <OwnerActions
                task={displayTask}
                currentUser={currentUser}
                assignedTasker={assignedTaskerDetails}
                userReview={userReview}
                taskId={taskId}
              />
            )}

            {/* Tasker Actions */}
            {(isTasker || !currentUser) && (
              <TaskerActions
                task={displayTask}
                currentUser={currentUser}
                isAssignedTasker={isAssignedTasker}
                canTaskerInteract={canTaskerInteract}
                hasAlreadyOffered={hasAlreadyOffered}
                finalPrice={finalPrice}
                taskId={taskId}
              />
            )}
          </PricePanel>

          {/* Assigned Tasker Card */}
          {(displayTask.status === 'paid' || displayTask.status === 'request_sent' || displayTask.status === 'assigned' || displayTask.status === 'awaiting_payment') && assignedTaskerDetails && (
            <AssignedTaskerCard
              tasker={assignedTaskerDetails}
              taskId={taskId}
              canMessage={isTaskOwner && displayTask.status === 'paid'}
              status={displayTask.status}
            />
          )}

          {/* Publisher Card */}
          <PublisherCard
            publisher={displayTask.publisher}
            taskId={taskId}
            canMessage={isAssignedTasker && (displayTask.status === 'paid' || displayTask.status === 'in_progress')}
          />
        </div>
      </div>
    </div>
  );
}
'use client';

import TaskOfferForm from '@/components/features/tasks/offers/task-offer-form';
import TaskOffersList from '@/components/features/tasks/offers/task-offers-list';
import EarlyCompletionConfirmation from '@/components/features/tasks/reviews/early-completion-confirmation';
import TaskCompletionDialog from '@/components/features/tasks/reviews/task-completion-dialog';
import TaskReviewSection from '@/components/features/tasks/reviews/task-review-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle,
  Clock,
  Edit3,
  Info,
  MapPinIcon,
  MessageSquare,
  ShieldCheck,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Helper function to format date
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Ei määritelty';
  return new Date(dateString).toLocaleDateString('fi-FI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Helper function to format time slot
const formatTimeSlot = (timeSlot: string | null) => {
  if (!timeSlot) return 'Ei määritelty';
  const slots: { [key: string]: string } = {
    morning: 'Aamupäivä (klo 8-12)',
    afternoon: 'Iltapäivä (klo 12-16)',
    evening: 'Ilta (klo 16-20)',
    flexible: 'Joustava',
  };
  return slots[timeSlot] || timeSlot;
};

// Define a type for the offer object
type Offer = {
  tasker_id: string;
  offered_price: number;
  status: string;
};

interface TaskDetailContentProps {
  task: any;
  assignedTasker: any;
  offers: Offer[] | null;
  currentUser: any;
  userProfile: any;
  userReview: any;
  taskId: string;
  clientFetchedTask?: any; // Optional updated task from client-side fetch
}

export default function TaskDetailContent({
  task,
  assignedTasker,
  offers,
  currentUser,
  userProfile,
  userReview,
  taskId,
  clientFetchedTask,
}: TaskDetailContentProps) {
  // Use clientFetchedTask if available, otherwise fall back to server task
  const displayTask = clientFetchedTask || task;
  const assignedTaskerDetails = clientFetchedTask
    ? (clientFetchedTask as any).assignedTasker
    : assignedTasker;

  // Re-calculate derived variables based on the most current task data
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sky-600 hover:text-sky-800 hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Takaisin
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Images & Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {displayTask.task_attachments &&
            displayTask.task_attachments.length > 0 && (
              <Card className="overflow-hidden shadow-lg">
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-yellow-50 p-4 text-sm text-yellow-800 border-b">
                    <strong>Debug - Task Attachments:</strong>
                    <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto max-h-32">
                      {JSON.stringify(displayTask.task_attachments, null, 2)}
                    </pre>
                    <div className="mt-2">
                      <strong>Count:</strong> {displayTask.task_attachments?.length || 0}
                    </div>
                  </div>
                )}
                <CardContent className="p-0">
                  {displayTask.task_attachments.length === 1 ? (
                    <div className="relative h-80 md:h-[500px] w-full">
                      <Image
                        src={displayTask.task_attachments[0].file_url}
                        alt={
                          displayTask.title
                            ? `${displayTask.title} kuva`
                            : `Task image`
                        }
                        fill
                        style={{ objectFit: 'cover' }}
                        className="hover:scale-105 transition-transform duration-300"
                        priority={true}
                        unoptimized={true} // Disable optimization as fallback
                        onError={(e) => {
                          console.error('Image failed to load:', displayTask.task_attachments[0].file_url);
                          console.error('Error details:', e);
                          console.error('Full error event:', e.nativeEvent);
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', displayTask.task_attachments[0].file_url);
                        }}
                      />
                      {/* Fallback for debugging */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white p-2 text-xs rounded max-w-xs break-all">
                          URL: {displayTask.task_attachments[0].file_url}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
                      {displayTask.task_attachments.map(
                        (attachment: any, index: number) => (
                          <div
                            key={attachment.id}
                            className="relative h-32 md:h-40 rounded-lg overflow-hidden"
                          >
                            <Image
                              src={attachment.file_url}
                              alt={`${displayTask.title} kuva ${index + 1}`}
                              fill
                              style={{ objectFit: 'cover' }}
                              className="hover:scale-105 transition-transform duration-300"
                              unoptimized={true} // Disable optimization as fallback
                              onError={(e) => {
                                console.error(`Image ${index} failed to load:`, attachment.file_url);
                                console.error('Error details:', e);
                              }}
                              onLoad={() => {
                                console.log(`Image ${index} loaded successfully:`, attachment.file_url);
                              }}
                            />
                            {/* Debug overlay */}
                            {process.env.NODE_ENV === 'development' && (
                              <div className="absolute top-1 left-1 bg-black bg-opacity-75 text-white p-1 text-xs rounded">
                                {index + 1}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <CardTitle className="text-3xl font-bold text-slate-800">
                  {displayTask.title}
                </CardTitle>
                {displayTask.categories && (
                  <Badge
                    variant="secondary"
                    className="text-md mt-1 sm:mt-0 py-1 px-3"
                  >
                    {(displayTask.categories as any).name_fi ||
                      (displayTask.categories as any).name}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-slate-600 pt-2">
                Julkaistu {formatDate(displayTask.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">
                  Kuvaus
                </h3>
                <p className="text-slate-600 whitespace-pre-wrap">
                  {displayTask.description || 'Ei kuvausta.'}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Tehtävän tiedot
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center">
                    <MapPinIcon className="mr-2 h-4 w-4 text-sky-600" />
                    <span className="text-slate-600">
                      Sijainti: {displayTask.location_text || 'Ei määritelty'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CalendarDays className="mr-2 h-4 w-4 text-sky-600" />
                    <span className="text-slate-600">
                      Toivottu päivä: {formatDate(displayTask.scheduled_date)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-sky-600" />
                    <span className="text-slate-600">
                      Aika: {formatTimeSlot(displayTask.scheduled_time_slot)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {isTaskOwner && displayTask.status === 'open' && (
            <TaskOffersList taskId={displayTask.id} isTaskOwner={isTaskOwner} />
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          {displayTask.status === 'early_completed' && isTaskOwner && (
            <EarlyCompletionConfirmation
              taskId={displayTask.id}
              taskTitle={displayTask.title}
              scheduledDate={displayTask.scheduled_date}
              scheduledTimeSlot={displayTask.scheduled_time_slot}
            />
          )}

          <Card className="shadow-lg sticky top-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold text-slate-800">
                Hinta
              </CardTitle>
              <div className="text-4xl font-bold text-primary pt-1">
                {finalPrice ? `${finalPrice} €` : 'Ei budjettia'}
              </div>
              {finalPrice && acceptedOffer && (
                <div className="space-y-1">
                  <p className="text-sm text-primary font-medium">
                    Sovittu hinta
                  </p>
                  {displayTask.budget && finalPrice !== displayTask.budget && (
                    <p className="text-xs text-sidebar-foreground/70">
                      Alkuperäinen budjetti: {displayTask.budget} €
                    </p>
                  )}
                </div>
              )}
              {finalPrice && !acceptedOffer && displayTask.budget && (
                <p className="text-sm text-slate-500">Arvioitu budjetti</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-sky-600" />
                <span className="text-sm text-slate-600">
                  Tila:{' '}
                  <Badge
                    variant={
                      displayTask.status === 'open'
                        ? 'default'
                        : displayTask.status === 'paid' ||
                          displayTask.status === 'completed' ||
                          displayTask.status === 'early_completed'
                          ? 'default'
                          : 'secondary'
                    }
                    className={
                      displayTask.status === 'open'
                        ? 'bg-sky-500 text-white'
                        : displayTask.status === 'paid'
                          ? 'bg-blue-500 text-white'
                          : displayTask.status === 'completed' ||
                            displayTask.status === 'early_completed'
                            ? 'bg-primary text-white'
                            : ''
                    }
                  >
                    {displayTask.status === 'paid'
                      ? 'Maksettu'
                      : displayTask.status === 'completed'
                        ? 'Valmis'
                        : displayTask.status === 'early_completed'
                          ? 'Valmis (aikainen)'
                          : displayTask.status === 'open'
                            ? 'Avoin'
                            : displayTask.status || 'Ei tietoa'}
                  </Badge>
                </span>
              </div>

              {isTaskOwner &&
                (displayTask.status === 'paid' ||
                  displayTask.status === 'in_progress') &&
                displayTask.assigned_tasker_id && (
                  <div className="pt-2">
                    <Button
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                      asChild
                    >
                      <Link
                        href={`/dashboard/messages?receiverId=${displayTask.assigned_tasker_id}&taskId=${taskId}`}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" /> Keskustele
                        tekijän kanssa
                      </Link>
                    </Button>
                  </div>
                )}

              {isAssignedTasker &&
                (displayTask.status === 'paid' ||
                  displayTask.status === 'in_progress') && (
                  <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-lg p-4 mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Info className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 mb-1">
                          💰 Ansaitsemasi summa
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          <span className="font-medium text-primary">
                            {finalPrice} €
                          </span>{' '}
                          lisätään saldoosi, kun sekä sinä että asiakas
                          vahvistatte tehtävän valmistumisen.
                        </p>
                        <div className="mt-2 text-xs text-slate-500">
                          Merkitse tehtävä valmiiksi kun olet suorittanut työn
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {isAssignedTasker &&
                (displayTask.status === 'paid' ||
                  displayTask.status === 'in_progress') && (
                  <div className="pt-2">
                    <Button
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                      asChild
                    >
                      <Link
                        href={`/dashboard/messages?receiverId=${displayTask.user_id}&taskId=${taskId}`}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" /> Keskustele
                        asiakkaan kanssa
                      </Link>
                    </Button>
                  </div>
                )}

              {isAssignedTasker &&
                (displayTask.status === 'paid' ||
                  displayTask.status === 'in_progress') && (
                  <div className="pt-2">
                    <TaskCompletionDialog
                      taskId={displayTask.id}
                      taskTitle={displayTask.title}
                      scheduledDate={displayTask.scheduled_date}
                      scheduledTimeSlot={displayTask.scheduled_time_slot}
                    >
                      <Button
                        size="lg"
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Merkitse
                        valmiiksi
                      </Button>
                    </TaskCompletionDialog>
                  </div>
                )}

              {isTaskOwner &&
                (displayTask.status === 'completed' ||
                  displayTask.status === 'early_completed') &&
                displayTask.assigned_tasker_id &&
                currentUser && (
                  <TaskReviewSection
                    taskId={displayTask.id}
                    taskerId={displayTask.assigned_tasker_id}
                    userId={currentUser.id}
                    taskTitle={displayTask.title}
                    taskerName={
                      assignedTaskerDetails
                        ? `${assignedTaskerDetails.first_name} ${assignedTaskerDetails.last_name}`
                        : 'Tekijä'
                    }
                    userReview={userReview}
                  />
                )}

              {canTaskerInteract && (
                <div className="space-y-3 pt-2">
                  <TaskOfferForm
                    taskId={taskId}
                    taskBudget={finalPrice}
                    hasAlreadyOffered={hasAlreadyOffered}
                  />
                </div>
              )}

              {isTaskOwner && displayTask.status === 'open' && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-slate-500 text-slate-600 hover:bg-slate-100"
                  asChild
                >
                  <Link href={`/dashboard/tasks/edit/${taskId}`}>
                    <Edit3 className="mr-2 h-4 w-4" /> Muokkaa tehtävää
                  </Link>
                </Button>
              )}

              {!isTasker && !isTaskOwner && displayTask.status === 'open' && (
                <Button
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  asChild
                >
                  <Link href="/signup/tasker">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Rekisteröidy
                    tekijäksi ja hae
                  </Link>
                </Button>
              )}
            </CardContent>
            <CardFooter className="pt-6 border-t mt-4">
              <div className="w-full">
                {displayTask.status === 'paid' && assignedTaskerDetails && (
                  <div className="mb-4">
                    <h3 className="text-md font-semibold text-slate-700 mb-2">
                      Valittu tekijä
                    </h3>
                    <div className="flex items-center space-x-3">
                      {assignedTaskerDetails.avatar_url ? (
                        <Image
                          src={assignedTaskerDetails.avatar_url}
                          alt={`${assignedTaskerDetails.first_name || ''} ${assignedTaskerDetails.last_name || ''
                            }`}
                          width={48}
                          height={48}
                          className="rounded-full border-2 border-primary/20"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-800">{`${assignedTaskerDetails.first_name || ''
                          } ${assignedTaskerDetails.last_name || 'Tuntematon'
                          }`}</p>
                        {assignedTaskerDetails.bio && (
                          <p className="text-sm text-slate-600 mt-1">
                            {assignedTaskerDetails.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <h3 className="text-md font-semibold text-slate-700 mb-2">
                  Ilmoittaja
                </h3>
                <div className="flex items-center space-x-3">
                  {displayTask.publisher?.avatar_url ? (
                    <Image
                      src={displayTask.publisher.avatar_url}
                      alt={`${displayTask.publisher.first_name || ''} ${displayTask.publisher.last_name || ''
                        }`}
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-slate-200"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-300">
                      <User className="h-6 w-6 text-slate-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-800">{`${displayTask.publisher?.first_name || ''
                      } ${displayTask.publisher?.last_name || 'Tuntematon'}`}</p>
                    {isAssignedTasker &&
                      (displayTask.status === 'paid' ||
                        displayTask.status === 'in_progress') && (
                        <Link
                          href={`/dashboard/messages?receiverId=${displayTask.user_id}&taskId=${taskId}`}
                          className="text-sm text-sky-600 hover:underline flex items-center mt-1"
                        >
                          <MessageSquare className="mr-1 h-3 w-3" /> Lähetä
                          viesti
                        </Link>
                      )}
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

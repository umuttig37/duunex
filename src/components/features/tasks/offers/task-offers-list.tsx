'use client';

import { createPayment, declineTaskOffer } from '@/app/dashboard/tasks/actions';
import CounterOfferForm from '@/components/features/tasks/offers/counter-offer-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/hooks/shared/use-toast';
import { createClient } from '@/lib/supabase/client';
import { type User } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import {
  ArrowLeftRight,
  Briefcase,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

interface TaskOffer {
  id: string;
  task_id: string;
  tasker_id: string;
  offered_price: number;
  original_offered_price: number | null;
  message: string | null;
  status: string;
  proposed_date: string | null;
  proposed_time_slot: string | null;
  created_at: string | null;
  is_counter_offer: boolean | null;
  original_offer_id: string | null;
  counter_offer_reason: string | null;
  tasker: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    is_verified: boolean;
    average_rating: number | null;
    completed_tasks_count: number;
  } | null;
  task: {
    id: string;
    title: string;
    status: string;
    budget: number | null;
  } | null;
}

interface TaskOffersListProps {
  taskId: string;
  isTaskOwner: boolean;
}

export default function TaskOffersList({
  taskId,
  isTaskOwner,
}: TaskOffersListProps) {
  const [offers, setOffers] = useState<TaskOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    const fetchOffers = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('task_offers')
        .select(
          `
          id,
          task_id,
          tasker_id,
          offered_price,
          message,
          status,
          proposed_date,
          proposed_time_slot,
          created_at,
          is_counter_offer,
          original_offer_id,
          counter_offer_reason,
          tasker:profiles!tasker_id (
            id,
            first_name,
            last_name,
            avatar_url,
            bio,
            is_verified
          ),
          task:tasks!task_id (
            id,
            title,
            status,
            budget
          )
        `
        )
        .eq('task_id', taskId)
        .in('status', [
          'pending',
          'accepted',
          'declined',
          'counter_offered',
          'awaiting_counter_response',
        ])
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching task offers:', fetchError);
        setError(fetchError.message);
        setOffers([]);
      } else {
        const offersWithStats: TaskOffer[] = await Promise.all(
          (data || []).map(async (offer): Promise<TaskOffer> => {
            const originalOfferedPrice =
              (offer as any).original_offered_price ?? offer.offered_price;

            if (!offer.tasker?.id) {
              return {
                ...offer,
                original_offered_price: originalOfferedPrice,
                tasker: offer.tasker
                  ? {
                    ...offer.tasker,
                    completed_tasks_count: 0,
                    average_rating: null,
                  }
                  : null,
              } as TaskOffer;
            }

            const { count: completedCount } = await supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('assigned_tasker_id', offer.tasker.id)
              .eq('status', 'completed');

            const { data: reviewsData } = await supabase
              .from('reviews')
              .select('rating')
              .eq('reviewee_profile_id', offer.tasker.id);

            const averageRating =
              reviewsData && reviewsData.length > 0
                ? reviewsData.reduce((sum, review) => sum + review.rating, 0) /
                reviewsData.length
                : null;

            return {
              ...offer,
              original_offered_price: originalOfferedPrice,
              tasker: {
                ...offer.tasker,
                completed_tasks_count: completedCount || 0,
                average_rating: averageRating,
              },
            } as TaskOffer;
          })
        );

        setOffers(offersWithStats);
      }
      setIsLoading(false);
    };

    fetchOffers();
  }, [taskId, supabase]);

  const handleDeclineOffer = async (offerId: string) => {
    startTransition(async () => {
      const result = await declineTaskOffer(offerId);
      if (result.success) {
        toast({ title: 'Onnistui!', description: result.message });
        setOffers((prev) =>
          prev.map((offer) =>
            offer.id === offerId ? { ...offer, status: 'declined' } : offer
          )
        );
      } else {
        toast({
          title: 'Virhe',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  };

  const handleAcceptAndPay = async (offer: TaskOffer) => {
    if (!user?.email) {
      toast({
        title: 'Virhe',
        description: 'Käyttäjän sähköpostia ei löytynyt.',
        variant: 'destructive',
      });
      return;
    }
    const userEmail = user.email;

    startTransition(async () => {
      const result = await createPayment(
        offer.id,
        offer.task_id,
        offer.offered_price,
        userEmail
      );

      if (result.success && result.paymentUrl) {
        toast({
          title: 'Siirrytään maksuun...',
          description: 'Sinut ohjataan Paytrailin maksusivulle.',
        });
        router.push(result.paymentUrl);
      } else {
        toast({
          title: 'Maksun aloitus epäonnistui',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  };

  const getStatusBadge = (status: string, isCounterOffer?: boolean | null) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            Odottaa
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/5 text-primary">
            Hyväksytty
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
            Hylätty
          </span>
        );
      case 'counter_offered':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
            Vastaehdotus
          </span>
        );
      case 'awaiting_counter_response':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
            {isCounterOffer ? 'Odottaa vastausta' : 'Vastaehdotus'}
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700">
            Peruttu
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const formatTimeSlot = (timeSlot: string | null) => {
    if (!timeSlot) return 'Ei määritelty';
    const slots: { [key: string]: string } = {
      morning: 'Aamupäivä (8-12)',
      afternoon: 'Iltapäivä (12-16)',
      evening: 'Ilta (16-20)',
      flexible: 'Joustava',
    };
    return slots[timeSlot] || timeSlot;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Ladataan tarjouksia...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-red-600">
            Virhe ladattaessa tarjouksia: {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tarjoukset</CardTitle>
          <CardDescription>
            Tekijöiden tarjoukset tähän tehtävään
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-4">Ei tarjouksia vielä.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Tarjoukset ({offers.length})
        </h3>
        <p className="text-sm text-gray-500">
          Tekijöiden lähettämät tarjoukset
        </p>
      </div>

      {offers.map((offer) => (
        <div
          key={offer.id}
          className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 transition-colors overflow-hidden"
        >
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar className="h-10 w-10">
                <AvatarImage src={offer.tasker?.avatar_url || undefined} />
                <AvatarFallback className="bg-gray-100 text-gray-700 font-medium">
                  {offer.tasker?.first_name?.charAt(0) || 'T'}
                  {offer.tasker?.last_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {offer.tasker?.first_name || 'Tuntematon'}{' '}
                    {offer.tasker?.last_name || ''}
                  </h4>
                  <div className="flex items-center gap-2">
                    {offer.tasker?.is_verified && (
                      <div className="flex items-center gap-1 border border-gray-200 text-gray-700 bg-white px-2 py-0.5 rounded-full text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        <span className="hidden xs:inline">Varmennettu</span>
                        <span className="xs:hidden">✓</span>
                      </div>
                    )}
                    {getStatusBadge(offer.status, offer.is_counter_offer)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  {offer.tasker?.average_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{offer.tasker.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                  {offer.tasker?.completed_tasks_count !== undefined && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      <span className="hidden xs:inline">{offer.tasker.completed_tasks_count} tehtävää</span>
                      <span className="xs:hidden">{offer.tasker.completed_tasks_count}</span>
                    </div>
                  )}
                  {offer.created_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(offer.created_at), 'dd.MM.yyyy', { locale: fi })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="text-right sm:text-right text-left sm:flex-shrink-0">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {offer.offered_price}€
              </div>
              {offer.is_counter_offer && offer.original_offered_price && (
                <div className="text-xs text-gray-500 mt-1">
                  <span className="hidden sm:inline">Alkuperäinen: </span>
                  <span className="sm:hidden">Alku: </span>
                  {offer.original_offered_price}€
                </div>
              )}
              {offer.status === 'pending' &&
                offer.original_offered_price &&
                offer.original_offered_price !== offer.offered_price && (
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="line-through">{offer.original_offered_price}€</span>
                    <span className="ml-1 text-primary">→ {offer.offered_price}€</span>
                  </div>
                )}
            </div>
          </div>

          {/* Message */}
          {offer.message && (
            <div className="mb-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 break-words">
                {offer.message}
              </div>
            </div>
          )}

          {/* Counter Offer Reason */}
          {offer.is_counter_offer && offer.counter_offer_reason && (
            <div className="mb-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowLeftRight className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800">Vastaehdotuksen syy:</span>
                </div>
                <p className="text-sm text-gray-700 break-words">{offer.counter_offer_reason}</p>
              </div>
            </div>
          )}

          {/* Proposed Schedule */}
          {(offer.proposed_date || offer.proposed_time_slot) && (
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              {offer.proposed_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{format(new Date(offer.proposed_date), 'dd.MM.yyyy', { locale: fi })}</span>
                </div>
              )}
              {offer.proposed_time_slot && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="break-words">{formatTimeSlot(offer.proposed_time_slot)}</span>
                </div>
              )}
            </div>
          )}

          {/* Expandable Details */}
          {expandedOfferId === offer.id && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
              <h5 className="font-medium text-gray-900 mb-2">Lisätietoja tekijästä</h5>
              {offer.tasker?.bio ? (
                <p className="text-sm text-gray-600 italic mb-3 break-words">"{offer.tasker.bio}"</p>
              ) : (
                <p className="text-sm text-gray-500 mb-3">Ei kuvausta saatavilla.</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedOfferId(expandedOfferId === offer.id ? null : offer.id)}
              className="text-gray-600 hover:text-gray-900 self-start min-h-[44px] sm:min-h-auto"
            >
              {expandedOfferId === offer.id ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Piilota lisätiedot</span>
                  <span className="sm:hidden">Piilota</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Näytä lisätiedot</span>
                  <span className="sm:hidden">Lisää</span>
                </>
              )}
            </Button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {/* Action Buttons */}
              {isTaskOwner && !offer.is_counter_offer && offer.status === 'pending' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeclineOffer(offer.id)}
                    disabled={isPending}
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 min-h-[44px] sm:min-h-auto"
                  >
                    Hylkää
                  </Button>
                  <CounterOfferForm
                    offerId={offer.id}
                    originalPrice={offer.original_offered_price || offer.offered_price}
                    taskBudget={offer.task?.budget}
                    taskerName={`${offer.tasker?.first_name || ''} ${offer.tasker?.last_name || ''}`.trim()}
                    taskTitle={offer.task?.title || 'Tehtävä'}
                    onCounterOfferSent={() => window.location.reload()}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAcceptAndPay(offer)}
                    disabled={isPending}
                    className="bg-gray-900 hover:bg-gray-800 text-white min-h-[44px] sm:min-h-auto"
                  >
                    <span className="hidden sm:inline">Hyväksy ja maksa</span>
                    <span className="sm:hidden">Hyväksy</span>
                  </Button>
                </div>
              )}

              {isTaskOwner &&
                !offer.is_counter_offer &&
                offer.status === 'pending' &&
                offer.original_offered_price &&
                offer.original_offered_price !== offer.offered_price && (
                  <Button
                    size="sm"
                    onClick={() => handleAcceptAndPay(offer)}
                    disabled={isPending}
                    className="bg-gray-900 hover:bg-gray-800 text-white min-h-[44px] sm:min-h-auto"
                  >
                    <span className="hidden sm:inline">Maksa sovittu hinta</span>
                    <span className="sm:hidden">Maksa</span>
                  </Button>
                )}

              {offer.is_counter_offer && (
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg break-words">
                  <span className="hidden sm:inline">Odottaa tekijän vastausta vastaehdotukseesi</span>
                  <span className="sm:hidden">Odottaa vastausta</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

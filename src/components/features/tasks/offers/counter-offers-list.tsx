'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { ArrowLeftRight, CheckCircle, Euro, Info, Loader2, XCircle } from "lucide-react";
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

interface CounterOffer {
  id: string;
  task_id: string;
  tasker_id: string;
  offered_price: number;
  message: string | null;
  status: string;
  is_counter_offer: boolean;
  original_offer_id: string | null;
  counter_offer_reason: string | null;
  created_at: string;
  task: {
    id: string;
    title: string;
    description: string;
    location_text: string;
    scheduled_date: string | null;
    scheduled_time_slot: string | null;
    budget: number | null;
    user: {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
    } | null;
    categories: {
      name_fi: string | null;
    } | null;
  } | null;
  original_offer: {
    offered_price: number;
  } | null;
}

interface CounterOffersListProps {
  taskerId: string;
}

// Helper function to format time slots in Finnish
const formatTimeSlot = (timeSlot: string | null) => {
  if (!timeSlot) return '';
  const timeSlotMap: { [key: string]: string } = {
    morning: 'Aamupäivä (8-12)',
    afternoon: 'Iltapäivä (12-16)',
    evening: 'Ilta (16-20)',
    flexible: 'Joustava'
  };
  return timeSlotMap[timeSlot] || timeSlot;
};

export default function CounterOffersList({ taskerId }: CounterOffersListProps) {
  const [counterOffers, setCounterOffers] = useState<CounterOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  useEffect(() => {
    const fetchCounterOffers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get all counter offers for this tasker
        const { data: counterOffers, error: counterOffersError } = await supabase
          .from('task_offers')
          .select(`
            id,
            task_id,
            tasker_id,
            offered_price,
            message,
            status,
            is_counter_offer,
            original_offer_id,
            counter_offer_reason,
            created_at,
            task:tasks!task_id (
              id,
              title,
              description,
              location_text,
              scheduled_date,
              scheduled_time_slot,
              budget,
              user:profiles!user_id (
                first_name,
                last_name,
                avatar_url
              ),
              categories (name_fi)
            )
          `)
          .eq('tasker_id', taskerId)
          .eq('is_counter_offer', true)
          .eq('status', 'awaiting_counter_response');

        if (counterOffersError) {
          throw counterOffersError;
        }

        // For each counter offer, manually fetch the original offer price
        const counterOffersWithOriginalPrice: CounterOffer[] = await Promise.all(
          (counterOffers || []).map(async (offer) => {
            let originalOfferPrice = 0;

            if (offer.original_offer_id) {
              const { data: originalOffer, error: originalOfferError } = await supabase
                .from('task_offers')
                .select('offered_price')
                .eq('id', offer.original_offer_id)
                .single();

              if (originalOffer && !originalOfferError) {
                originalOfferPrice = originalOffer.offered_price;
              }
            }

            return {
              ...offer,
              is_counter_offer: offer.is_counter_offer || false,
              created_at: offer.created_at || new Date().toISOString(),
              original_offer: {
                offered_price: originalOfferPrice
              }
            };
          })
        );

        setCounterOffers(counterOffersWithOriginalPrice.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));

      } catch (err) {
        console.error('Exception fetching counter offers:', err);
        setError('Virhe vastaehdotusten latauksessa');
        setCounterOffers([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (taskerId) {
      fetchCounterOffers();
    }
  }, [taskerId]);

  const handleAcceptCounterOffer = async (counterOfferId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/counter-offers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            counterOfferId,
            responseStatus: 'accepted'
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success(result.message);
          setCounterOffers(prev => prev.filter(offer => offer.id !== counterOfferId));
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error('Error accepting counter offer:', error);
        toast.error('Vastaehdotuksen hyväksyminen epäonnistui');
      }
    });
  };

  const handleDeclineCounterOffer = async (counterOfferId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/counter-offers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            counterOfferId,
            responseStatus: 'declined'
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success(result.message);
          setCounterOffers(prev => prev.filter(offer => offer.id !== counterOfferId));
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error('Error declining counter offer:', error);
        toast.error('Vastaehdotuksen hylkääminen epäonnistui');
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-600">Ladataan vastaehdotuksia...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Virhe</AlertTitle>
        <AlertDescription>
          Vastaehdotusten lataaminen epäonnistui: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (counterOffers.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Ei vastaehdotuksia</AlertTitle>
        <AlertDescription>
          Sinulla ei ole tällä hetkellä odottavia vastaehdotuksia.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <ArrowLeftRight className="h-5 w-5 text-gray-700" />
        Vastaehdotukset ({counterOffers.length})
      </h2>

      {counterOffers.map((counterOffer) => (
        <Card key={counterOffer.id} className="border border-gray-200">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {counterOffer.task?.title || 'Nimetön tehtävä'}
                  <Badge variant="outline" className="text-gray-700 border-gray-200 bg-white">
                    Vastaehdotus
                  </Badge>
                </CardTitle>
                {counterOffer.task?.categories?.name_fi && (
                  <Badge variant="outline" className="mt-1 text-gray-700 border-gray-200 bg-white">
                    {counterOffer.task.categories.name_fi}
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <div className="flex flex-col items-end gap-1">
                  <div className="text-xs text-gray-500">Ilmoituksen alkuperäinen budjetti:</div>
                  <div className="text-base font-semibold text-gray-500 line-through">
                    {counterOffer.task?.budget ? formatCurrency(counterOffer.task.budget) : 'Ei budjettia'}
                  </div>
                  <div className="text-xs text-gray-600">Asiakkaan vastaehdotus:</div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(counterOffer.offered_price)}
                  </div>
                </div>
              </div>
            </div>

            {counterOffer.task?.user && (
              <CardDescription className='pt-2'>
                Asiakas: {counterOffer.task.user.first_name} {counterOffer.task.user.last_name}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-2">
            {/* Show tasker's original offer */}
            <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Euro className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-medium text-gray-800">Sinun alkuperäinen tarjouksesi:</span>
              </div>
              <p className="text-sm text-gray-800 font-medium">
                {formatCurrency(counterOffer.original_offer?.offered_price || 0)}
              </p>
            </div>

            {counterOffer.counter_offer_reason && (
              <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Euro className="h-4 w-4 text-gray-700" />
                  <span className="text-sm font-medium text-gray-800">Vastaehdotuksen syy:</span>
                </div>
                <p className="text-sm text-gray-700">{counterOffer.counter_offer_reason}</p>
              </div>
            )}

            {counterOffer.message && (
              <div className="bg-gray-50 p-3 rounded-md">
                <span className="text-sm font-medium text-gray-700">Asiakkaan viesti:</span>
                <p className="text-sm text-gray-600 mt-1">"{counterOffer.message}"</p>
              </div>
            )}

            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Tehtävä:</strong> {counterOffer.task?.description || 'Ei kuvausta'}</p>
              {counterOffer.task?.location_text && (
                <p><strong>Sijainti:</strong> {counterOffer.task.location_text}</p>
              )}
              {counterOffer.task?.scheduled_date && (
                <p>
                  <strong>Toivottu ajankohta:</strong> {' '}
                  {format(new Date(counterOffer.task.scheduled_date), 'PPP', { locale: fi })}
                  {counterOffer.task.scheduled_time_slot &&
                    `, ${formatTimeSlot(counterOffer.task.scheduled_time_slot)}`
                  }
                </p>
              )}
              <p className="text-xs text-gray-500">
                Lähetetty: {format(new Date(counterOffer.created_at), 'PPP p', { locale: fi })}
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleDeclineCounterOffer(counterOffer.id)}
              disabled={isPending}
              size="sm"
              className="text-gray-700 border-gray-300 hover:bg-gray-100"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Hylkää
            </Button>
            <Button
              onClick={() => handleAcceptCounterOffer(counterOffer.id)}
              disabled={isPending}
              size="sm"
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Hyväksy hinta
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 
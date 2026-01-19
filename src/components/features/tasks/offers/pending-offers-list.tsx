'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Clock, Euro, ExternalLink, Info, Send } from "lucide-react";
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface PendingOffer {
  id: string;
  offered_price: number;
  message: string | null;
  created_at: string;
  proposed_date: string | null;
  proposed_time_slot: string | null;
  task: {
    id: string;
    title: string;
    description: string | null;
    location_text: string | null;
    scheduled_date: string | null;
    scheduled_time_slot: string | null;
    budget: number | null;
    status: string;
    user_profile: {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
    } | null;
    categories: {
      name_fi: string | null;
    } | null;
  };
}

interface PendingOffersListProps {
  taskerId: string;
}

export default function PendingOffersList({ taskerId }: PendingOffersListProps) {
  const [pendingOffers, setPendingOffers] = useState<PendingOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchPendingOffers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all pending offers by this tasker for open tasks
        const { data: offers, error: offersError } = await supabase
          .from('task_offers')
          .select(`
            id,
            offered_price,
            message,
            created_at,
            proposed_date,
            proposed_time_slot,
            task:tasks!task_id (
              id,
              title,
              description,
              location_text,
              scheduled_date,
              scheduled_time_slot,
              budget,
              status,
              user_profile:profiles!user_id (
                first_name,
                last_name,
                avatar_url
              ),
              categories (name_fi)
            )
          `)
          .eq('tasker_id', taskerId)
          .eq('status', 'pending')
          .eq('is_counter_offer', false) // Only original offers, not counter offers
          .order('created_at', { ascending: false });

        if (offersError) {
          throw offersError;
        }

        // Filter for offers where the task is still open (user hasn't responded yet)
        const validOffers = (offers || []).filter(offer =>
          offer.task && offer.task.status === 'open'
        ) as PendingOffer[];

        console.log('PendingOffersList debug:', {
          allOffers: offers?.length || 0,
          validOffers: validOffers.length,
          taskerId,
          offers: validOffers
        });

        setPendingOffers(validOffers);

      } catch (err) {
        console.error('Error fetching pending offers:', err);
        setError('Virhe lähetettyjen tarjousten latauksessa');
        setPendingOffers([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (taskerId) {
      fetchPendingOffers();
    }
  }, [taskerId]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Alle tunti sitten';
    if (diffInHours < 24) return `${diffInHours} tuntia sitten`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Eilen';
    if (diffInDays < 7) return `${diffInDays} päivää sitten`;

    return format(date, 'PPP', { locale: fi });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <Clock className="mr-2 h-5 w-5" />
            Lähetetyt tarjoukset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-3 text-gray-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
            <span className="ml-2">Ladataan...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Virhe</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (pendingOffers.length === 0) {
    return null; // Don't show anything if no pending offers
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">
        Lähetetyt tarjoukset ({pendingOffers.length})
      </h2>

      {pendingOffers.map((offer) => (
        <Alert key={offer.id} className="bg-white border border-gray-200">
          <Send className="h-5 w-5 text-gray-700" />
          <AlertTitle className="text-gray-900 mb-1">
            Tarjouksesi odottaa vastausta
          </AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">{offer.task.title}</h3>
                <div className="text-sm text-slate-600 space-y-1">
                  <div className="flex items-center">
                    <span className="font-medium">Asiakas:</span>
                    <span className="ml-2">
                      {offer.task.user_profile?.first_name && offer.task.user_profile?.last_name
                        ? `${offer.task.user_profile.first_name} ${offer.task.user_profile.last_name}`
                        : 'Nimettömä käyttäjä'}
                    </span>
                  </div>

                  {offer.task.location_text && (
                    <div className="flex items-center">
                      <span className="font-medium">Sijainti:</span>
                      <span className="ml-2">{offer.task.location_text}</span>
                    </div>
                  )}

                  {offer.task.budget && (
                    <div className="flex items-center">
                      <span className="font-medium">Asiakkaan budjetti:</span>
                      <span className="ml-2">{formatCurrency(offer.task.budget)}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <span className="font-medium">Lähetetty:</span>
                    <span className="ml-2">{formatRelativeTime(offer.created_at)}</span>
                  </div>
                </div>
              </div>

              {offer.message && (
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Viestisi:</span> "{offer.message}"
                  </p>
                </div>
              )}

              {(offer.proposed_date || offer.proposed_time_slot) && (
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Ehdottamasi aikataulu:</span>
                    {offer.proposed_date && (
                      <span className="ml-2">
                        {format(new Date(offer.proposed_date), 'PPP', { locale: fi })}
                      </span>
                    )}
                    {offer.proposed_time_slot && (
                      <span className="ml-2">- {formatTimeSlot(offer.proposed_time_slot)}</span>
                    )}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <Euro className="h-4 w-4 text-gray-700 mr-2" />
                  <span className="text-base font-semibold text-gray-900">
                    {formatCurrency(offer.offered_price)}
                  </span>
                  <Badge variant="secondary" className="ml-2 border border-gray-200 bg-white text-gray-700">
                    Tarjouksesi
                  </Badge>
                </div>

                <Button asChild size="sm" className="bg-gray-900 hover:bg-gray-800 text-white">
                  <Link href={`/dashboard/tasks/${offer.task.id}`}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Näytä tehtävä
                  </Link>
                </Button>
              </div>

              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                <Info className="h-3 w-3 inline mr-1" />
                Asiakas näkee tarjouksesi ja voi hyväksyä sen, hylätä tai tehdä vastaehdotuksen. Saat ilmoituksen heti kun asiakas reagoi.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
} 
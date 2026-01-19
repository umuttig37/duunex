'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/shared/use-toast';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, DollarSign, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const withdrawalSchema = z.object({
  amount: z.number()
    .min(10, 'Vähimmäissumma on 10€')
    .max(10000, 'Enimmäissumma on 10 000€'),
  request_message: z.string().optional(),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

interface WithdrawalRequestFormProps {
  userId: string;
}

export default function WithdrawalRequestForm({ userId }: WithdrawalRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingWithdrawalsAmount, setPendingWithdrawalsAmount] = useState(0);
  const [bankAccount, setBankAccount] = useState<any>(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      request_message: '',
    },
  });

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      // Fetch balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('tasker_balance')
        .select('current_balance, pending_withdrawals')
        .eq('tasker_id', userId)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error('Error fetching balance:', balanceError);
      } else if (balanceData) {
        // Calculate available balance correctly: current_balance is already reduced by pending withdrawals
        // So available balance = current_balance (which already has pending withdrawals deducted)
        setAvailableBalance(balanceData.current_balance);
        setPendingWithdrawalsAmount(balanceData.pending_withdrawals || 0);
      }

      // Fetch bank account
      const { data: bankData, error: bankError } = await supabase
        .from('bank_account_info')
        .select('*')
        .eq('tasker_id', userId)
        .single();

      if (bankError && bankError.code !== 'PGRST116') {
        console.error('Error fetching bank account:', bankError);
      } else if (bankData) {
        setBankAccount(bankData);
      }

      // Fetch pending withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select('id, tasker_id, amount, status, request_message, created_at')
        .eq('tasker_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (withdrawalsError) {
        console.error('Error fetching withdrawals:', withdrawalsError);
      } else {
        setPendingWithdrawals(withdrawalsData || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const onSubmit = async (data: WithdrawalFormData) => {
    if (!bankAccount) {
      toast({
        title: "Pankkitiedot puuttuvat",
        description: "Lisää pankkitietosi ennen nostopyyntöä.",
        variant: "destructive",
      });
      return;
    }

    if (data.amount > availableBalance) {
      toast({
        title: "Riittämätön saldo",
        description: "Nostettava summa ei voi ylittää käytettävissä olevaa saldoa.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use the new function that automatically deducts balance
      const { data: requestId, error } = await supabase.rpc('create_withdrawal_request_with_deduction', {
        p_tasker_id: userId,
        p_amount: data.amount,
        p_request_message: data.request_message || undefined,
      });

      if (error) throw error;

      toast({
        title: "Nostopyyntö lähetetty",
        description: "Nostopyyntösi on lähetetty käsiteltäväksi ja summa on varattu. Saat ilmoituksen kun raha on siirretty.",
      });

      // Reset form and refresh data
      form.reset();
      await fetchUserData(); // Refresh balance and pending withdrawals
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error creating withdrawal request:', error);
      toast({
        title: "Virhe",
        description: error.message || "Nostopyynnön lähettäminen epäonnistui. Yritä uudelleen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fi-FI', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const maskIban = (iban: string) => {
    if (iban.length <= 8) return iban;
    return iban.substring(0, 4) + '****' + iban.substring(iban.length - 4);
  };

  if (!bankAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Pankkitiedot puuttuvat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Lisää pankkitietosi ennen nostopyynnön tekemistä.
          </p>
          <Button asChild>
            <a href={`/dashboard/profile/${userId}?tab=payment`}>Lisää pankkitiedot</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Bank account verification check removed - no longer needed

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Current Balance Info */}
      <Card>
        <CardHeader>
          <CardTitle>Nostettavissa oleva saldo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-emerald-600 mb-2">
            {formatCurrency(availableBalance)}
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Tämä summa on käytettävissäsi nostopyyntöön
          </p>
          {pendingWithdrawalsAmount > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-yellow-800">Käsittelyssä</span>
              </div>
              <p className="text-sm text-yellow-700">
                {formatCurrency(pendingWithdrawalsAmount)} odottaa käsittelyä
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Kohdetilit</CardTitle>
          <CardDescription>Raha siirretään tälle tilille</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{bankAccount.account_holder_name}</p>
                <p className="text-sm text-gray-600">{maskIban(bankAccount.iban)}</p>
                <p className="text-sm text-gray-600">{bankAccount.bic}</p>
                {bankAccount.bank_name && (
                  <p className="text-sm text-gray-600">{bankAccount.bank_name}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Käyttövalmis</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-yellow-500" />
              Käsiteltävänä olevat nostopyynnöt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <p className="font-medium">{formatCurrency(withdrawal.amount)}</p>
                    <p className="text-sm text-gray-600">
                      Pyydetty {formatDate(withdrawal.created_at)}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Käsittelyssä
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdrawal Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Uusi nostopyyntö
          </CardTitle>
          <CardDescription>
            Täytä lomake tehdäksesi nostopyynnön
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nostettava summa (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="10"
                        max={availableBalance}
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Vähimmäissumma 10€, enintään {formatCurrency(availableBalance)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="request_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lisätiedot (valinnainen)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Voit lisätä tähän lisätietoja nostopyynnöstäsi..."
                        {...field}
                        disabled={isLoading}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Esim. kiireellisyys tai erityistoiveet
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading || availableBalance < 10} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Lähetetään...
                  </>
                ) : (
                  'Lähetä nostopyyntö'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Nostoprosessista</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Nostopyynnöt käsitellään arkisin 1-3 työpäivässä</li>
              <li>• Saat sähköposti-ilmoituksen kun pyyntö on käsitelty</li>
              <li>• Rahansiirto kestää 1-2 pankkipäivää</li>
              <li>• Voit seurata pyynnön tilaa työpöydältä</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
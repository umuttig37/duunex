'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeftRight, Download, History, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface TransactionData {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string | null;
  task?: {
    title: string;
  } | null;
}

interface WithdrawalData {
  id: string;
  amount: number;
  status: string | null;
  request_message: string | null;
  created_at: string | null;
}

interface TaskerEventsContentProps {
  userId: string;
}

export default function TaskerEventsContent({ userId }: TaskerEventsContentProps) {
  const [recentTransactions, setRecentTransactions] = useState<TransactionData[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<WithdrawalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchTransactionData();
    }
  }, [userId]);

  const fetchTransactionData = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from('balance_transactions')
        .select(`
          id,
          amount,
          transaction_type,
          description,
          created_at,
          task:tasks(title)
        `)
        .eq('tasker_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch pending withdrawals
      const { data: withdrawalsData } = await supabase
        .from('withdrawal_requests')
        .select('id, amount, status, request_message, created_at')
        .eq('tasker_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setRecentTransactions(transactionsData || []);
      setPendingWithdrawals(withdrawalsData || []);
    } catch (error) {
      console.error('Error fetching transaction data:', error);
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
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionDescription = (transaction: TransactionData) => {
    if (transaction.transaction_type === 'earnings') {
      return transaction.task?.title || 'Tehtävän suoritus';
    } else if (transaction.transaction_type === 'withdrawal') {
      return 'Noston käsittely';
    } else if (transaction.transaction_type === 'counter_offer_received') {
      return 'Vastaehdotus saatu';
    } else if (transaction.transaction_type === 'counter_offer_accepted') {
      return 'Vastaehdotus hyväksytty';
    } else if (transaction.transaction_type === 'counter_offer_declined') {
      return 'Vastaehdotus hylätty';
    } else if (transaction.transaction_type === 'counter_offer_made') {
      return 'Vastaehdotus tehty';
    }
    return transaction.description || 'Tapahtuma';
  };

  const getTransactionIcon = (transaction: TransactionData) => {
    if (transaction.transaction_type === 'earnings') {
      return <TrendingUp className="h-4 w-4 text-emerald-600" />;
    } else if (transaction.transaction_type === 'withdrawal') {
      return <Download className="h-4 w-4 text-red-600" />;
    } else if (transaction.transaction_type.startsWith('counter_offer')) {
      return <ArrowLeftRight className="h-4 w-4 text-amber-600" />;
    }
    return <History className="h-4 w-4 text-gray-600" />;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Tapahtumat</h2>
          <p className="text-gray-600">Saldosi tapahtumat ja nostopyynnöt</p>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tapahtumat</h2>
        <p className="text-gray-600">Saldosi tapahtumat ja nostopyynnöt</p>
      </div>

      {/* Pending Withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50/50 to-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-yellow-900">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              Käsiteltävänä olevat nostopyynnöt
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Nämä summat on jo varattu saldostasi ja odottavat käsittelyä
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-4 bg-white border border-yellow-200 rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Download className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Nostopyyntö: {formatCurrency(withdrawal.amount)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Pyydetty {withdrawal.created_at ? formatDate(withdrawal.created_at) : 'Tuntematon päivä'}
                      </p>
                      {withdrawal.request_message && (
                        <p className="text-xs text-gray-500 mt-1">
                          "{withdrawal.request_message}"
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full font-medium">
                    Käsittelyssä
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            Viimeisimmät tapahtumat
          </CardTitle>
          <CardDescription>
            Tuoreimmat saldoasi koskevat tapahtumat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full border">
                      {getTransactionIcon(transaction)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {getTransactionDescription(transaction)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {transaction.created_at ? formatDate(transaction.created_at) : 'Tuntematon päivä'}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${
                    transaction.amount > 0 
                      ? 'text-emerald-600' 
                      : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-sm text-gray-500">Ei tapahtumia vielä</p>
            </div>
          )}
          
          <div className="pt-4 border-t mt-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/balance/history">
                <History className="mr-2 h-4 w-4" />
                Näytä kaikki tapahtumat
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pikavalinnat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/dashboard/balance/withdraw">
                <div className="text-center">
                  <Download className="mx-auto h-6 w-6 mb-2 text-emerald-600" />
                  <div className="text-sm font-medium">Tee nostopyyntö</div>
                  <div className="text-xs text-gray-500">Nosta ansaitsemiasi rahoja</div>
                </div>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/dashboard/balance/history">
                <div className="text-center">
                  <History className="mx-auto h-6 w-6 mb-2 text-blue-600" />
                  <div className="text-sm font-medium">Täydellinen historia</div>
                  <div className="text-xs text-gray-500">Katso kaikki tapahtumat</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
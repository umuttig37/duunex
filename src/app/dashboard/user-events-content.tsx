'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeftRight, Clock, History, Receipt, TrendingUp, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface UserTransactionData {
  id: string;
  amount: number | null;
  transaction_type: string;
  description: string | null;
  created_at: string | null;
  task?: {
    title: string;
  } | null;
}

interface UserEventsContentProps {
  userId: string;
}

export default function UserEventsContent({ userId }: UserEventsContentProps) {
  const [recentTransactions, setRecentTransactions] = useState<UserTransactionData[]>([]);
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
        .from('user_transactions')
        .select(`
          id,
          amount,
          transaction_type,
          description,
          created_at,
          task:tasks(title)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentTransactions(transactionsData || []);
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

  const getTransactionDescription = (transaction: UserTransactionData) => {
    return transaction.description || 'Tapahtuma';
  };

  const getTransactionIcon = (transaction: UserTransactionData) => {
    switch (transaction.transaction_type) {
      case 'payment':
        return <Receipt className="h-4 w-4 text-red-600" />;
      case 'assignment':
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case 'completion':
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'cancellation':
        return <Clock className="h-4 w-4 text-gray-600" />;
      case 'refund':
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'counter_offer_sent':
        return <ArrowLeftRight className="h-4 w-4 text-amber-600" />;
      case 'counter_offer_response':
        return <ArrowLeftRight className="h-4 w-4 text-amber-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionAmount = (transaction: UserTransactionData) => {
    if (!transaction.amount) return null;
    
    const isNegative = transaction.transaction_type === 'payment';
    const isCounterOffer = transaction.transaction_type.startsWith('counter_offer');
    
    return (
      <div className={`text-sm font-semibold ${
        isNegative ? 'text-red-600' : 
        isCounterOffer ? 'text-amber-600' :
        'text-emerald-600'
      }`}>
        {isNegative ? '-' : (isCounterOffer ? '' : '+')}
        {formatCurrency(Math.abs(transaction.amount))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Tapahtumat</h2>
          <p className="text-gray-600">Tehtäviin liittyvät tapahtumat ja maksut</p>
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
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tapahtumat</h2>
        <p className="text-gray-600">Tehtäviin liittyvät tapahtumat ja maksut</p>
      </div>
      
      <div className="space-y-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Viimeisimmät tapahtumat
            </CardTitle>
            <CardDescription>
              Tuoreimmat tehtäviisi liittyvät tapahtumat
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
                    <div className="flex-row md:flex-col items-center gap-3">
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
                    {getTransactionAmount(transaction)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-sm text-gray-500">Ei tapahtumia vielä</p>
              </div>
            )}
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
                <Link href="/dashboard/tasks/new">
                  <div className="text-center">
                    <TrendingUp className="mx-auto h-6 w-6 mb-2 text-blue-600" />
                    <div className="text-sm font-medium">Uusi tehtävä</div>
                    <div className="text-xs text-gray-500">Julkaise uusi tehtävä</div>
                  </div>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-auto p-4">
                <Link href="/dashboard">
                  <div className="text-center">
                    <UserCheck className="mx-auto h-6 w-6 mb-2 text-emerald-600" />
                    <div className="text-sm font-medium">Omat tehtävät</div>
                    <div className="text-xs text-gray-500">Hallinnoi aktiivisia tehtäviä</div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
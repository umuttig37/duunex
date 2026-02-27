'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { DollarSign, Download, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface BalanceData {
  current_balance: number;
  pending_withdrawals: number;
  total_earned: number;
  total_withdrawn: number;
  created_at: string | null;
  updated_at: string | null;
}

interface TaskerBalanceCardProps {
  userId: string;
}

export default function TaskerBalanceCard({ userId }: TaskerBalanceCardProps) {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVerifiedBankAccount, setHasVerifiedBankAccount] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchBalanceData();
    fetchBankAccountStatus();
  }, [userId]);

  const fetchBalanceData = async () => {
    try {
      // Fetch balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('tasker_balance')
        .select('*')
        .eq('tasker_id', userId)
        .maybeSingle();

      if (balanceError) {
        console.error('Error fetching balance:', balanceError);
      } else if (balanceData) {
        setBalance(balanceData);
      }



      // Fetch pending withdrawals
      const { data: pendingWithdrawalsData, error: pendingWithdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select('id, tasker_id, amount, status, request_message, admin_notes, created_at, processed_at, completed_at')
        .eq('tasker_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingWithdrawalsError) {
        console.error('Error fetching pending withdrawals:', pendingWithdrawalsError);
      } else {
        setPendingWithdrawals(pendingWithdrawalsData || []);
      }

      // Fetch recent completed/approved withdrawals
      const { data: recentWithdrawalsData, error: recentWithdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select('id, tasker_id, amount, status, request_message, admin_notes, created_at, processed_at, completed_at')
        .eq('tasker_id', userId)
        .in('status', ['approved', 'completed'])
        .order('processed_at', { ascending: false })
        .limit(3);

      if (recentWithdrawalsError) {
        console.error('Error fetching recent withdrawals:', recentWithdrawalsError);
      } else {
        setRecentWithdrawals(recentWithdrawalsData || []);
      }
    } catch (error) {
      console.error('Error fetching balance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBankAccountStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_account_info')
        .select('id')
        .eq('tasker_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching bank account status:', error);
      } else if (data) {
        setHasVerifiedBankAccount(true); // Bank account exists = can withdraw
      }
    } catch (error) {
      console.error('Error fetching bank account status:', error);
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
    });
  };

  const getWithdrawalStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full font-medium">
            Käsittelyssä
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full font-medium">
            Hyväksytty
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-medium">
            Maksettu
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full font-medium">
            Hylätty
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-full font-medium">
            {status}
          </span>
        );
    }
  };



  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Saldo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Main Balance Card */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
            Saldo
          </CardTitle>
          <CardDescription className="text-sm">
            Tässä näet ansaitsemasi rahat ja nostettavissa olevan summan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {/* Current Balance */}
            <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-primary/20">
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {formatCurrency(balance?.current_balance || 0)}
              </div>
              <p className="text-xs sm:text-sm text-primary mt-1">Nostettavissa oleva saldo</p>
              {balance?.pending_withdrawals && balance.pending_withdrawals > 0 && (
                <div className="mt-2 px-2 py-1 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                  {formatCurrency(balance.pending_withdrawals)} odottaa käsittelyä
                </div>
              )}
            </div>

            {/* Balance Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Ansaittu yhteensä</span>
                </div>
                <div className="text-lg font-semibold text-blue-700">
                  {formatCurrency(balance?.total_earned || 0)}
                </div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Download className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">Nostettu yhteensä</span>
                </div>
                <div className="text-lg font-semibold text-gray-700">
                  {formatCurrency(balance?.total_withdrawn || 0)}
                </div>
              </div>
            </div>

            {/* Withdrawal Button */}
            <div className="pt-2">
              {hasVerifiedBankAccount ? (
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link href="/dashboard/balance/withdraw">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Tee nostopyyntö
                  </Link>
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/dashboard/profile/${userId}?tab=payment`}>
                      Lisää pankkitiedot nostojen mahdollistamiseksi
                    </Link>
                  </Button>
                  <p className="text-xs text-gray-600 text-center">
                    Pankkitiedot vaaditaan rahaa nostaaksesi
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              Käsiteltävänä olevat nostopyynnöt
            </CardTitle>
            <CardDescription>
              Nämä summat on jo varattu saldostasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900">
                      {formatCurrency(withdrawal.amount)}
                    </p>
                    <p className="text-xs text-yellow-700">
                      Pyydetty {formatDate(withdrawal.created_at)}
                    </p>
                    {withdrawal.request_message && (
                      <p className="text-xs text-yellow-600 mt-1">
                        "{withdrawal.request_message}"
                      </p>
                    )}
                  </div>
                  {getWithdrawalStatusBadge(withdrawal.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Withdrawals */}
      {recentWithdrawals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Viimeisimmät nostot
            </CardTitle>
            <CardDescription>
              Äskettäin käsitellyt nostopyyntösi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(withdrawal.amount)}
                    </p>
                    <p className="text-xs text-gray-700">
                      {withdrawal.status === 'completed' && withdrawal.completed_at
                        ? `Maksettu ${formatDate(withdrawal.completed_at)}`
                        : withdrawal.processed_at
                        ? `Käsitelty ${formatDate(withdrawal.processed_at)}`
                        : `Pyydetty ${formatDate(withdrawal.created_at)}`
                      }
                    </p>
                    {withdrawal.admin_notes && (
                      <p className="text-xs text-gray-600 mt-1">
                        Admin: "{withdrawal.admin_notes}"
                      </p>
                    )}
                  </div>
                  {getWithdrawalStatusBadge(withdrawal.status)}
                </div>
              ))}
              
              {recentWithdrawals.length >= 3 && (
                <div className="text-center pt-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/balance/history">
                      Näytä kaikki nostot
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
} 
import DashboardLayout from '@/components/shared/layout/dashboard_layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, DollarSign, Download, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function BalanceHistoryPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?message=Please log in to view balance history.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    redirect('/dashboard?error=Profile not found');
  }

  // Only taskers can access balance features
  if (profile.role !== 'tasker') {
    redirect('/dashboard?error=Access denied - taskers only');
  }

  // Fetch balance
  const { data: balanceData } = await supabase
    .from('tasker_balance')
    .select('*')
    .eq('tasker_id', user.id)
    .single();

  // Fetch all transactions
  const { data: transactions } = await supabase
    .from('balance_transactions')
    .select(`
      *,
      task:tasks(title),
      withdrawal_request:withdrawal_requests(amount, status, completed_at, admin_notes)
    `)
    .eq('tasker_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch all withdrawal requests for status tracking
  const { data: withdrawalRequests } = await supabase
    .from('withdrawal_requests')
    .select('id, tasker_id, amount, status, request_message, admin_notes, created_at, processed_at, completed_at, processed_by')
    .eq('tasker_id', user.id)
    .order('created_at', { ascending: false });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Ei saatavilla';
    return new Date(dateString).toLocaleDateString('fi-FI', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earnings':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case 'withdrawal':
        return <Download className="h-4 w-4 text-blue-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionDescription = (transaction: any) => {
    if (transaction.transaction_type === 'earnings') {
      return transaction.task?.title || 'Tehtävän suoritus';
    } else if (transaction.transaction_type === 'withdrawal') {
      return 'Nostopyyntö';
    }
    return transaction.description || 'Tapahtuma';
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'earnings':
        return <Badge variant="outline" className="text-primary border-sky-600">Ansiot</Badge>;
      case 'withdrawal':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Nosto</Badge>;
      case 'adjustment':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Oikaisu</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getWithdrawalStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Käsittelyssä</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Hyväksytty</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-sky-600 border-sky-600">Maksettu</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">Hylätty</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout user={profile}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Takaisin työpöydälle
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tapahtumahistoria
          </h1>
          <p className="text-gray-600">
            Katso kaikki saldotapahtumat ja ansiohistoria
          </p>
        </div>

        {/* Balance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Nykyinen saldo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(balanceData?.current_balance || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Ansaittu yhteensä</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(balanceData?.total_earned || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Nostettu yhteensä</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {formatCurrency(balanceData?.total_withdrawn || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Requests */}
        {withdrawalRequests && withdrawalRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Nostopyynnöt</CardTitle>
              <CardDescription>
                Kaikki nostopyyntösi ja niiden tilat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {withdrawalRequests.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-semibold">
                          {formatCurrency(withdrawal.amount)}
                        </div>
                        {getWithdrawalStatusBadge(withdrawal.status)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Pyydetty: {formatDate(withdrawal.created_at)}
                        {withdrawal.processed_at && (
                          <span> • Käsitelty: {formatDate(withdrawal.processed_at)}</span>
                        )}
                        {withdrawal.completed_at && (
                          <span> • Maksettu: {formatDate(withdrawal.completed_at)}</span>
                        )}
                      </div>
                      {withdrawal.request_message && (
                        <div className="text-xs text-gray-500 mt-1">
                          <strong>Viesti:</strong> "{withdrawal.request_message}"
                        </div>
                      )}
                      {withdrawal.admin_notes && (
                        <div className="text-xs text-blue-600 mt-1">
                          <strong>Admin:</strong> "{withdrawal.admin_notes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>Kaikki tapahtumat</CardTitle>
            <CardDescription>
              Täydellinen historia kaikista saldotapahtumistasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getTransactionIcon(transaction.transaction_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {getTransactionDescription(transaction)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(transaction.created_at)}
                        </p>
                        {transaction.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        {getTransactionBadge(transaction.transaction_type)}
                        <div className={`text-lg font-semibold ${
                          transaction.amount > 0 
                            ? 'text-primary' 
                            : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}
                          {formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Ei tapahtumia</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tapahtumat näkyvät täällä kun suoritat tehtäviä tai teet nostopyyntöjä.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <Button asChild>
            <Link href="/dashboard/balance/withdraw">
              <Download className="mr-2 h-4 w-4" />
              Tee nostopyyntö
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/profile/${user.id}?tab=payment`}>
              Pankkitietojen hallinta
            </Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
} 
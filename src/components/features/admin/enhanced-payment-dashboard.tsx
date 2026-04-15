'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { 
  AlertTriangle, 
  ArrowDown, 
  ArrowUp, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  DollarSign, 
  Euro, 
  Eye,
  RefreshCw, 
  TrendingDown, 
  TrendingUp, 
  XCircle 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PaymentTransaction {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  provider?: string;
  paytrail_transaction_id?: string;
  task?: {
    id: string;
    title: string;
    status: string;
  };
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface PaymentStats {
  total_paid: number;
  paid_count: number;
  total_pending: number;
  pending_count: number;
  total_failed: number;
  failed_count: number;
  total_refunded: number;
  refunded_count: number;
  recent_transactions: number;
  avg_transaction_amount: number;
  platform_revenue: number;
  total_tasker_payouts: number;
  avg_service_fee_percentage: number;
  revenue_growth_rate: number;
}

interface BalanceStats {
  total_tasker_earnings: number;
  total_pending_withdrawals: number;
  total_completed_withdrawals: number;
  active_taskers: number;
}

interface EnhancedPaymentDashboardProps {
  initialPayments?: PaymentTransaction[];
  initialStats?: PaymentStats;
}

export default function EnhancedPaymentDashboard({ 
  initialPayments = [], 
  initialStats 
}: EnhancedPaymentDashboardProps) {
  const [payments, setPayments] = useState<PaymentTransaction[]>(initialPayments);
  const [stats, setStats] = useState<PaymentStats | null>(initialStats || null);
  const [balanceStats, setBalanceStats] = useState<BalanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('7d');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchPaymentData();
    fetchBalanceStats();
    
    // Set up real-time updates
    const paymentsChannel = supabase
      .channel('payments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        (payload) => {
          console.log('Payment data changed:', payload);
          fetchPaymentData();
        }
      )
      .subscribe();

    const balanceChannel = supabase
      .channel('balance_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasker_balance'
        },
        (payload) => {
          console.log('Balance data changed:', payload);
          fetchBalanceStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(balanceChannel);
    };
  }, [statusFilter, timeFilter]);

  const fetchPaymentData = async () => {
    setIsLoading(true);
    try {
      // Build time filter
      const timeFilterDate = new Date();
      switch (timeFilter) {
        case '24h':
          timeFilterDate.setHours(timeFilterDate.getHours() - 24);
          break;
        case '7d':
          timeFilterDate.setDate(timeFilterDate.getDate() - 7);
          break;
        case '30d':
          timeFilterDate.setDate(timeFilterDate.getDate() - 30);
          break;
        case '90d':
          timeFilterDate.setDate(timeFilterDate.getDate() - 90);
          break;
        default:
          timeFilterDate.setFullYear(timeFilterDate.getFullYear() - 1);
      }

      // Fetch payments with related data
      let query = supabase
        .from('payments')
        .select(`
          id,
          created_at,
          amount,
          status,
          provider,
          paytrail_transaction_id,
          task:tasks!task_id (
            id,
            title,
            status
          ),
          user:profiles!user_id (
            first_name,
            last_name,
            email
          )
        `)
        .gte('created_at', timeFilterDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: paymentsData, error: paymentsError } = await query;
      
      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
      } else {
        setPayments(paymentsData || []);
      }

      // Fetch payment statistics with revenue tracking
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_enhanced_payment_statistics_with_revenue', { time_period: timeFilter });
      
      if (statsError) {
        console.error('Error fetching payment stats:', statsError);
      } else if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error in fetchPaymentData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBalanceStats = async () => {
    try {
      const { data: balanceData, error: balanceError } = await supabase
        .rpc('get_balance_overview_statistics');
      
      if (balanceError) {
        console.error('Error fetching balance stats:', balanceError);
      } else if (balanceData && balanceData.length > 0) {
        setBalanceStats(balanceData[0]);
      }
    } catch (error) {
      console.error('Error in fetchBalanceStats:', error);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '0,00 €';
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fi-FI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Maksettu
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Odottaa
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Epäonnistui
          </Badge>
        );
      case 'refunded':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Euro className="h-3 w-3 mr-1" />
            Palautettu
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-5 w-5 text-primary" />;
      case 'pending': return <Clock className="h-5 w-5 text-amber-600" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'refunded': return <Euro className="h-5 w-5 text-blue-600" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-primary" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <ArrowUp className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-3">
          <div className="text-right text-sm text-gray-600">
            <div>Viimeksi päivitetty:</div>
            <div className="font-medium">{formatDate(lastRefresh.toISOString())}</div>
          </div>
          <Button 
            onClick={fetchPaymentData} 
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Päivitä
          </Button>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-sky-600/20"></div>
          <CardHeader className="relative pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-primary">
                Maksetut Yhteensä
              </CardTitle>
              {getStatusIcon('paid')}
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-primary mb-1">
              {formatCurrency(stats?.total_paid || 0)}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary">{stats?.paid_count || 0} maksua</span>
              {getTrendIcon(stats?.paid_count || 0, 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-600/20"></div>
          <CardHeader className="relative pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-amber-800">
                Odottavat Maksut
              </CardTitle>
              {getStatusIcon('pending')}
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-amber-700 mb-1">
              {formatCurrency(stats?.total_pending || 0)}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-600">{stats?.pending_count || 0} maksua</span>
              {stats?.pending_count && stats.pending_count > 0 && (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/20"></div>
          <CardHeader className="relative pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-red-800">
                Epäonnistuneet
              </CardTitle>
              {getStatusIcon('failed')}
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-red-700 mb-1">
              {formatCurrency(stats?.total_failed || 0)}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600">{stats?.failed_count || 0} maksua</span>
              {stats?.failed_count && stats.failed_count > 0 && (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-sky-600/20"></div>
          <CardHeader className="relative pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-sky-800">
                Alustan Tulot
              </CardTitle>
              <DollarSign className="h-5 w-5 text-sky-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-sky-700 mb-1">
              {formatCurrency(stats?.platform_revenue || 0)}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-sky-600">palvelumaksuja</span>
              {stats?.revenue_growth_rate && stats.revenue_growth_rate > 0 ? (
                <div className="flex items-center text-sky-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>+{Math.round(stats.revenue_growth_rate)}%</span>
                </div>
              ) : (
                <TrendingUp className="h-4 w-4 text-sky-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800">
              Tekijöiden Osuus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(stats?.total_tasker_payouts || 0)}
            </div>
            <p className="text-xs text-blue-600">
              ~{Math.round(100 - (stats?.avg_service_fee_percentage || 0))}% maksuista
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-sky-800">
              Palvelumaksu %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-700">
              {(stats?.avg_service_fee_percentage || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-sky-600">keskimääräinen palkkio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-800">
              Keskimaksu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {formatCurrency(stats?.avg_transaction_amount || 0)}
            </div>
            <p className="text-xs text-purple-600">per transaktio</p>
          </CardContent>
        </Card>

        {balanceStats && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-800">
                  Odottavat Nostot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">
                  {formatCurrency(balanceStats.total_pending_withdrawals)}
                </div>
                <p className="text-xs text-orange-600">käsittelyä odottaa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-cyan-800">
                  Aktiiviset Tekijät
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-700">
                  {balanceStats.active_taskers}
                </div>
                <p className="text-xs text-cyan-600">ansainnut rahaa</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters and Transactions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Maksutapahtumat
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 tuntia</SelectItem>
                  <SelectItem value="7d">7 päivää</SelectItem>
                  <SelectItem value="30d">30 päivää</SelectItem>
                  <SelectItem value="90d">90 päivää</SelectItem>
                  <SelectItem value="all">Kaikki</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Kaikki tilat</SelectItem>
                  <SelectItem value="paid">Maksettu</SelectItem>
                  <SelectItem value="pending">Odottaa</SelectItem>
                  <SelectItem value="failed">Epäonnistui</SelectItem>
                  <SelectItem value="refunded">Palautettu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Päivämäärä</TableHead>
                    <TableHead>Käyttäjä</TableHead>
                    <TableHead>Tehtävä</TableHead>
                    <TableHead>Summa</TableHead>
                    <TableHead>Tila</TableHead>
                    <TableHead>Maksutapa</TableHead>
                    <TableHead>Transaktio ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-gray-50">
                      <TableCell>
                        {formatDate(payment.created_at)}
                      </TableCell>
                      <TableCell>
                        {payment.user ? (
                          <div>
                            <div className="font-medium">
                              {payment.user.first_name} {payment.user.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {payment.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.task ? (
                          <Button
                            variant="link"
                            className="p-0 h-auto font-normal text-left justify-start"
                            onClick={() => router.push(`/admin/tasks/${payment.task?.id}`)}
                          >
                            {payment.task.title}
                          </Button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {payment.provider || 'Paytrail'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {payment.paytrail_transaction_id ? (
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {payment.paytrail_transaction_id.slice(0, 12)}...
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ei maksutapahtumia
              </h3>
              <p className="text-gray-500">
                Valitulla aikavälillä ei ole maksutapahtumia
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
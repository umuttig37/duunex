import { createClient } from '@/lib/supabase/server';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    AlertTriangle,
    Briefcase,
    ClipboardCheck,
    CreditCard,
    Euro,
    MessageSquare,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { DevToolsCard } from './dev-tools-card';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch dashboard statistics in parallel for better performance
  const [
    { count: pendingWithdrawals },
    { count: openTickets },
    { count: pendingApplications },
    { count: totalUsers },
    { data: paymentStatsResult }, // Rename to avoid conflict
  ] = await Promise.all([
    supabase
      .from('withdrawal_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open'),
    supabase
      .from('tasker_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.rpc('get_payment_statistics'),
  ]);

  // Get pending task approvals count with optimized error handling
  let pendingTaskApprovals = 0;
  try {
    // Use a more efficient approach - try RPC first for better performance
    const { count } = await supabase
      .from('task_approvals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    pendingTaskApprovals = count || 0;
  } catch (error) {
    console.error('Error getting pending task approval count:', error);
    // Fallback to counting pending_approval tasks
    try {
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_approval');
      pendingTaskApprovals = count || 0;
    } catch (fallbackError) {
      console.error('Error with fallback task approval count:', fallbackError);
      pendingTaskApprovals = 0;
    }
  }

  // The RPC returns an array, get the first (and only) item
  const paymentStats = paymentStatsResult?.[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tervetuloa Hallintapaneeliin</CardTitle>
          <CardDescription>
            Hallitse järjestelmän toimintoja ja käyttäjiä
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <Link href="/admin/payments">
          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-primary/20 hover:border-primary/30 active:scale-[0.98]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate pr-2">
                Maksut
              </CardTitle>
              <Euro className="h-4 w-4 text-primary flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {paymentStats?.total_paid || 0}€
              </div>
              <p className="text-xs text-muted-foreground">
                {paymentStats?.paid_count || 0} maksettua
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/withdrawals">
          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-orange-200 hover:border-orange-300 active:scale-[0.98]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate pr-2">
                Nostopyynnöt
              </CardTitle>
              <CreditCard className="h-4 w-4 text-orange-600 flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {pendingWithdrawals || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                odottaa käsittelyä
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/support-tickets">
          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-blue-200 hover:border-blue-300 active:scale-[0.98]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate pr-2">
                Tukipalvelupyynnöt
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600 flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {openTickets || 0}
              </div>
              <p className="text-xs text-muted-foreground">avointa pyyntöä</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/tasker-applications">
          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-sky-200 hover:border-sky-300 active:scale-[0.98]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate pr-2">
                Tekijähakemukset
              </CardTitle>
              <Briefcase className="h-4 w-4 text-sky-600 flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-600">
                {pendingApplications || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                odottaa hyväksyntää
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-purple-200 hover:border-purple-300 active:scale-[0.98]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate pr-2">
                Käyttäjät yhteensä
              </CardTitle>
              <Users className="h-4 w-4 text-purple-600 flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                rekisteröitynyttä käyttäjää
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/task-approvals">
          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-red-200 hover:border-red-300 active:scale-[0.98]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate pr-2">
                Tehtävien hyväksynnät
              </CardTitle>
              <ClipboardCheck className="h-4 w-4 text-red-600 flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {pendingTaskApprovals || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                odottaa hyväksyntää
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Pikataoiminnot</CardTitle>
          <CardDescription>Yleisimmin käytetyt admin-toiminnot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link
              href="/admin/payments"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-[0.98] hover:border-gray-300"
            >
              <Euro className="h-8 w-8 text-primary mr-3" />
              <div>
                <h3 className="font-medium">Seuraa maksuja</h3>
                <p className="text-sm text-gray-600">
                  Näe kaikki maksutapahtumat ja tilastot
                </p>
              </div>
            </Link>

            <Link
              href="/admin/withdrawals"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-[0.98] hover:border-gray-300"
            >
              <CreditCard className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <h3 className="font-medium">Käsittele nostopyyntöjä</h3>
                <p className="text-sm text-gray-600">
                  Hyväksy tai hylkää taskereite nostopyyntöjä
                </p>
              </div>
            </Link>

            <Link
              href="/admin/support-tickets"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-[0.98] hover:border-gray-300"
            >
              <MessageSquare className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="font-medium">Vastaa tukipalvelupyyntöihin</h3>
                <p className="text-sm text-gray-600">
                  Auta käyttäjiä heidän ongelmiensa kanssa
                </p>
              </div>
            </Link>

            <Link
              href="/admin/tasker-applications"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-[0.98] hover:border-gray-300"
            >
              <Briefcase className="h-8 w-8 text-sky-600 mr-3" />
              <div>
                <h3 className="font-medium">Tarkista tekijähakemukset</h3>
                <p className="text-sm text-gray-600">
                  Hyväksy uusia taskereita alustalle
                </p>
              </div>
            </Link>

            <Link
              href="/admin/disputes"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-[0.98] hover:border-gray-300"
            >
              <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <h3 className="font-medium">Hallitse riitojen ratkaisua</h3>
                <p className="text-sm text-gray-600">
                  Ratkaise tehtäväriidokkaat ja käsittele palautuksia
                </p>
              </div>
            </Link>

            <Link
              href="/admin/task-approvals"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-[0.98] hover:border-gray-300"
            >
              <ClipboardCheck className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h3 className="font-medium">Hyväksy tehtäviä</h3>
                <p className="text-sm text-gray-600">
                  Tarkista ja hyväksy uudet tehtäväilmoitukset
                </p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {process.env.NODE_ENV === 'development' && <DevToolsCard />}
    </div>
  );
}

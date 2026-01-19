import EnhancedPaymentDashboard from '@/components/features/admin/enhanced-payment-dashboard';
import { createClient } from '@/lib/supabase/server';

export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  // Fetch initial payment data for server-side rendering
  const { data: initialPayments } = await supabase
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
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch initial statistics with revenue tracking
  const { data: initialStats } = await supabase
    .rpc('get_enhanced_payment_statistics_with_revenue', { time_period: '30d' });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maksuhallinta</h1>
          <p className="text-gray-600 mt-1">
            Reaaliaikainen maksuseuranta ja palvelumaksujen seuranta
          </p>
        </div>
      </div>

      <EnhancedPaymentDashboard
        initialPayments={initialPayments || []}
        initialStats={initialStats?.[0] || undefined}
      />
    </div>
  );
}

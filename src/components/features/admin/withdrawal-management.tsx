'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/shared/use-toast';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, Clock, CreditCard, Eye, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface WithdrawalRequest {
  id: string;
  tasker_id: string;
  amount: number;
  status: string | null;
  request_message: string | null;
  admin_notes: string | null;
  created_at: string | null;
  processed_at: string | null;
  completed_at: string | null;
  tasker: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  bank_account: {
    account_holder_name: string;
    iban: string;
    bic: string;
    bank_name: string | null;
  } | null;
}

interface WithdrawalManagementProps {
  adminId: string;
}

export default function WithdrawalManagement({
  adminId,
}: WithdrawalManagementProps) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [forceApprove, setForceApprove] = useState(false);
  const [balanceError, setBalanceError] = useState<{
    error: string;
    error_code: string;
    can_force_approve?: boolean;
    available_balance?: number;
    requested_amount?: number;
  } | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  const fetchWithdrawals = async () => {
    setIsFetching(true);
    try {
      // First get withdrawal requests with tasker info
      let query = supabase
        .from('withdrawal_requests')
        .select(
          `
          id,
          tasker_id,
          amount,
          status,
          request_message,
          admin_notes,
          created_at,
          processed_at,
          completed_at,
          processed_by,
          tasker:profiles!withdrawal_requests_tasker_id_fkey(first_name, last_name, email)
        `
        )
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: withdrawalData, error: withdrawalError } = await query;

      if (withdrawalError) {
        console.error('Error fetching withdrawals:', withdrawalError);
        throw withdrawalError;
      }

      // Then get bank account info for each tasker
      const withdrawalsWithBankInfo = await Promise.all(
        (withdrawalData || []).map(async (withdrawal) => {
          const { data: bankAccountData } = await supabase
            .from('bank_account_info')
            .select('account_holder_name, iban, bic, bank_name')
            .eq('tasker_id', withdrawal.tasker_id)
            .single();

          return {
            ...withdrawal,
            bank_account: bankAccountData || null,
          };
        })
      );

      // Ensure data structure is valid before setting state
      const validWithdrawals = withdrawalsWithBankInfo.filter(
        (withdrawal) =>
          withdrawal &&
          withdrawal.tasker &&
          typeof withdrawal.tasker === 'object'
      );

      setWithdrawals(validWithdrawals as WithdrawalRequest[]);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast({
        title: 'Virhe',
        description: 'Nostopyyntöjen lataaminen epäonnistui.',
        variant: 'destructive',
      });
      // Set empty array on error to prevent further issues
      setWithdrawals([]);
    } finally {
      setIsFetching(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedWithdrawal || !newStatus) return;

    setIsLoading(true);
    setProcessingId(selectedWithdrawal.id);
    setBalanceError(null);
    
    try {
      // Use the new payment-sync function to ensure admin dashboard stats update correctly
      const { data, error } = await supabase.rpc('process_withdrawal_with_payment_sync', {
        request_id: selectedWithdrawal.id,
        new_status: newStatus,
        admin_id: adminId,
        admin_notes: adminNotes || undefined,
        force_approve: forceApprove
      });

      if (error) {
        // Fallback to enhanced function if payment-sync one doesn't exist yet
        const fallbackResult = await supabase.rpc('process_withdrawal_request_enhanced', {
          request_id: selectedWithdrawal.id,
          new_status: newStatus,
          admin_id: adminId,
          admin_notes: adminNotes || undefined,
          force_approve: forceApprove
        });
        
        if (fallbackResult.error) {
          // Final fallback to original function
          const originalResult = await supabase.rpc('process_withdrawal_request', {
            request_id: selectedWithdrawal.id,
            new_status: newStatus,
            admin_id: adminId,
            admin_notes: adminNotes || undefined,
          });
          
          if (originalResult.error) throw originalResult.error;
        }
        
        toast({
          title: 'Nostopyyntö päivitetty',
          description: `Nostopyynnön tila muutettu: ${getStatusText(newStatus)}`,
        });
      } else if (data && typeof data === 'object' && 'success' in data && !data.success) {
        // Handle insufficient balance error with admin override option
        const errorData = data as { 
          success: boolean; 
          error_code?: string; 
          error?: string;
          available_balance?: number;
          requested_amount?: number;
          can_force_approve?: boolean;
        };
        
        if (errorData.error_code === 'INSUFFICIENT_BALANCE' && newStatus === 'approved') {
          setBalanceError({
            error: errorData.error || 'Riittämätön saldo',
            error_code: errorData.error_code,
            available_balance: errorData.available_balance,
            requested_amount: errorData.requested_amount,
            can_force_approve: errorData.can_force_approve
          });
          toast({
            title: 'Riittämätön saldo',
            description: errorData.error || 'Riittämätön saldo',
            variant: 'destructive',
          });
          return; // Don't close dialog, allow admin to force approve
        } else {
          throw new Error(errorData.error || 'Tuntematon virhe');
        }
      } else {
        // Success
        toast({
          title: 'Nostopyyntö päivitetty',
          description: `Nostopyynnön tila muutettu: ${getStatusText(newStatus)}`,
        });
        
        if (data && typeof data === 'object' && 'balance_info' in data && data.balance_info) {
          const balanceInfo = data.balance_info as { current_balance: number };
          toast({
            title: 'Saldon tiedot päivitetty',
            description: `Uusi saldo: ${balanceInfo.current_balance}€`,
          });
        }

        // Show payment sync notification if applicable
        if (data && typeof data === 'object' && 'payments_synced' in data && 
            typeof data.payments_synced === 'number' && data.payments_synced > 0) {
          toast({
            title: 'Maksut synkronoitu',
            description: `${data.payments_synced} maksua synkronoitu admin-tilastoihin`,
          });
        }
      }

      // Reset and close dialog on success
      setIsDialogOpen(false);
      setSelectedWithdrawal(null);
      setNewStatus('');
      setAdminNotes('');
      setForceApprove(false);
      setBalanceError(null);
      fetchWithdrawals();
      
    } catch (error: any) {
      console.error('Error updating withdrawal:', error);
      
      // Check if it's the specific insufficient balance error
      if (error.message && error.message.includes('Insufficient balance')) {
        setBalanceError({
          error: error.message,
          error_code: 'INSUFFICIENT_BALANCE',
          can_force_approve: true
        });
        toast({
          title: 'Riittämätön saldo',
          description: 'Taskerin saldo ei riitä nostopyyntöön. Voit pakottaa hyväksynnän admin-oikeuksilla.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Virhe',
          description: error.message || 'Nostopyynnön päivittäminen epäonnistui.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
      setProcessingId(null);
    }
  };

  const openStatusDialog = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setNewStatus(withdrawal.status || 'pending');
    setAdminNotes(withdrawal.admin_notes || '');
    setForceApprove(false);
    setBalanceError(null);
    setIsDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Ei määritelty';
    return new Date(dateString).toLocaleDateString('fi-FI', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600"
          >
            <Clock className="mr-1 h-3 w-3" />
            Odottaa
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Hyväksytty
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Maksettu
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="mr-1 h-3 w-3" />
            Hylätty
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || 'Tuntematon'}</Badge>;
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'pending':
        return 'Odottaa käsittelyä';
      case 'approved':
        return 'Hyväksytty';
      case 'completed':
        return 'Maksettu';
      case 'rejected':
        return 'Hylätty';
      default:
        return status || 'Tuntematon';
    }
  };

  const maskIban = (iban: string) => {
    if (iban.length <= 8) return iban;
    return iban.substring(0, 4) + '****' + iban.substring(iban.length - 4);
  };

  const filteredWithdrawals = withdrawals;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Nostopyyntöjen hallinta
          </CardTitle>
          <CardDescription>
            Käsittele taskereite nostopyyntöjä ja seuraa rahansiirtoja
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter */}
          <div className="mb-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Suodata tilaa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kaikki pyynnöt</SelectItem>
                <SelectItem value="pending">Odottaa käsittelyä</SelectItem>
                <SelectItem value="approved">Hyväksytyt</SelectItem>
                <SelectItem value="completed">Maksetut</SelectItem>
                <SelectItem value="rejected">Hylätyt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Withdrawals Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Taskeri</TableHead>
                  <TableHead>Summa</TableHead>
                  <TableHead>Tila</TableHead>
                  <TableHead>Pyydetty</TableHead>
                  <TableHead>Pankkitili</TableHead>
                  <TableHead>Toiminnot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWithdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {withdrawal.tasker.first_name || 'Ei nimeä'}{' '}
                          {withdrawal.tasker.last_name || ''}
                        </p>
                        <p className="text-sm text-gray-600">
                          {withdrawal.tasker.email || 'Ei sähköpostia'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(withdrawal.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(withdrawal.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {withdrawal.bank_account ? (
                        <div>
                          <p className="font-medium">
                            {withdrawal.bank_account.account_holder_name}
                          </p>
                          <p className="text-gray-600">
                            {maskIban(withdrawal.bank_account.iban)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-red-600">Ei pankkitietoja</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openStatusDialog(withdrawal)}
                        disabled={processingId === withdrawal.id}
                      >
                        {processingId === withdrawal.id ? (
                          <>
                            <Clock className="mr-1 h-3 w-3 animate-spin" />
                            Käsitellään...
                          </>
                        ) : (
                          <>
                            <Eye className="mr-1 h-3 w-3" />
                            Käsittele
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredWithdrawals.length === 0 && (
              <div className="text-center py-8">
                {isFetching ? (
                  <>
                    <Clock className="mx-auto h-12 w-12 text-gray-300 animate-spin" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Ladataan nostopyyntöjä...
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Haetaan tietoja tietokannasta.
                    </p>
                  </>
                ) : (
                  <>
                    <CreditCard className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Ei nostopyyntöjä
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Ei nostopyyntöjä valituilla suodattimilla
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Käsittele nostopyyntö</DialogTitle>
            <DialogDescription>
              Muuta nostopyynnön tilaa ja lisää kommentteja
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              {/* Withdrawal Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Nostopyynnön tiedot</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <strong>Taskeri:</strong>{' '}
                      {selectedWithdrawal.tasker.first_name || 'Ei nimeä'}{' '}
                      {selectedWithdrawal.tasker.last_name || ''}
                    </p>
                    <p>
                      <strong>Summa:</strong>{' '}
                      {formatCurrency(selectedWithdrawal.amount)}
                    </p>
                    <p>
                      <strong>Nykyinen tila:</strong>{' '}
                      {getStatusText(selectedWithdrawal.status)}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Pyydetty:</strong>{' '}
                      {formatDate(selectedWithdrawal.created_at)}
                    </p>
                    {selectedWithdrawal.processed_at && (
                      <p>
                        <strong>Käsitelty:</strong>{' '}
                        {formatDate(selectedWithdrawal.processed_at)}
                      </p>
                    )}
                  </div>
                </div>

                {selectedWithdrawal.request_message && (
                  <div className="mt-3">
                    <strong>Taskerin viesti:</strong>
                    <p className="text-gray-700 mt-1">
                      {selectedWithdrawal.request_message}
                    </p>
                  </div>
                )}
              </div>

              {/* Bank Account Details */}
              {selectedWithdrawal.bank_account && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Pankkitiedot</h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Tilinomistaja:</strong>{' '}
                      {selectedWithdrawal.bank_account.account_holder_name}
                    </p>
                    <p>
                      <strong>IBAN:</strong>{' '}
                      {selectedWithdrawal.bank_account.iban}
                    </p>
                    <p>
                      <strong>BIC:</strong>{' '}
                      {selectedWithdrawal.bank_account.bic}
                    </p>
                    {selectedWithdrawal.bank_account.bank_name && (
                      <p>
                        <strong>Pankki:</strong>{' '}
                        {selectedWithdrawal.bank_account.bank_name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Uusi tila
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Valitse tila" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Odottaa käsittelyä</SelectItem>
                    <SelectItem value="approved">Hyväksy nostopyyntö</SelectItem>
                    <SelectItem value="completed">
                      Merkitse maksetuksi
                    </SelectItem>
                    <SelectItem value="rejected">Hylkää nostopyyntö</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Workflow explanation */}
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs text-blue-800">
                    <div className="font-medium mb-1">Nostoprosessi:</div>
                    <div>1. <strong>Hyväksy</strong> → Varaa saldo maksua varten</div>
                    <div>2. <strong>Merkitse maksetuksi</strong> → Vahvista maksun suoritus</div>
                    <div>3. Taskeri näkee päivityksen omassa paneelissaan</div>
                  </div>
                </div>
              </div>

              {/* Balance Error and Force Approve */}
              {balanceError && balanceError.error_code === 'INSUFFICIENT_BALANCE' && newStatus === 'approved' && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-800 mb-1">Riittämätön saldo</h4>
                      <p className="text-red-700 text-sm mb-3">{balanceError.error}</p>
                      
                      {balanceError.available_balance !== undefined && balanceError.requested_amount !== undefined && (
                        <div className="bg-white p-3 rounded border text-xs">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium">Saatavilla:</span>
                              <span className="ml-1 text-green-600">{balanceError.available_balance.toFixed(2)}€</span>
                            </div>
                            <div>
                              <span className="font-medium">Pyydetty:</span>
                              <span className="ml-1 text-red-600">{balanceError.requested_amount.toFixed(2)}€</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {balanceError.can_force_approve && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="forceApprove"
                              checked={forceApprove}
                              onChange={(e) => setForceApprove(e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor="forceApprove" className="text-sm font-medium text-yellow-800">
                              Pakota hyväksyntä admin-oikeuksilla
                            </label>
                          </div>
                          <p className="text-xs text-yellow-700 mt-1">
                            Tämä ohittaa saldotarkistuksen ja hyväksyy nostopyynnön huolimatta riittämättömästä saldosta.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Admin-kommentit
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Lisää kommentteja tai huomioita..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Peruuta
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={isLoading || !newStatus}
            >
              {isLoading ? 'Päivitetään...' : 'Päivitä tila'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

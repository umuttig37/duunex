'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/shared/use-toast';
import { createClient } from '@/lib/supabase/client';
import { sendTaskApprovedEmail, sendTaskRejectedEmail } from '@/services/notifications/email-service';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { CheckCircle, Clock, Eye, FileText, Image as ImageIcon, MapPin, User, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TaskApproval {
  id: string;
  task_id: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // Task details from the RPC function
  task_title: string;
  task_description: string;
  task_budget: number | null;
  task_category_name: string | null;
  task_location: string;
  user_name: string;
  user_email: string;
  posting_type: string | null;
  // Task attachments (images)
  task_attachments?: {
    id: string;
    file_url: string;
    file_type: string | null;
  }[];
}

interface TaskApprovalManagementProps {
  adminId: string;
}

export default function TaskApprovalManagement({ adminId }: TaskApprovalManagementProps) {
  const [approvals, setApprovals] = useState<TaskApproval[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<TaskApproval | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('pending');
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchApprovals();
  }, [filter]);

  const fetchApprovals = async () => {
    setIsFetching(true);
    try {
      console.log('Fetching approvals with filter:', filter);

      if (filter === 'pending') {
        // Try RPC function first, fallback to direct query if it fails
        let rpcSuccess = false;
        try {
          const { data, error } = await supabase.rpc('get_pending_task_approvals_for_admin');

          console.log('RPC response:', { data, error });

          if (!error && data) {
            // Transform RPC data to match our interface
            const transformedData = data?.map((item: any) => ({
              id: item.approval_id,
              task_id: item.task_id,
              submitted_at: item.submitted_at,
              reviewed_at: null,
              reviewed_by: null,
              status: 'pending' as const,
              admin_notes: null,
              rejection_reason: null,
              created_at: item.submitted_at,
              updated_at: item.submitted_at,
              task_title: item.task_title,
              task_description: item.task_description,
              task_budget: item.task_budget,
              task_category_name: item.task_category_name,
              task_location: item.task_location,
              user_name: item.user_name,
              user_email: item.user_email,
              posting_type: item.posting_type,
            })) || [];

            console.log('Transformed data:', transformedData);

            // Optimized: Fetch all attachments in a single query
            const taskIds = transformedData.map(approval => approval.task_id);
            let attachmentsByTask: Record<string, any[]> = {};

            if (taskIds.length > 0) {
              const { data: attachmentsData, error: attachmentsError } = await supabase
                .from('task_attachments')
                .select('id, file_url, file_type, task_id')
                .in('task_id', taskIds)
                .eq('file_type', 'image');

              if (!attachmentsError && attachmentsData) {
                // Group attachments by task_id
                attachmentsByTask = attachmentsData.reduce((acc, attachment) => {
                  if (!acc[attachment.task_id]) {
                    acc[attachment.task_id] = [];
                  }
                  acc[attachment.task_id].push(attachment);
                  return acc;
                }, {} as Record<string, any[]>);
              }
            }

            // Add attachments to each approval
            const dataWithAttachments = transformedData.map(approval => ({
              ...approval,
              task_attachments: attachmentsByTask[approval.task_id] || []
            }));

            setApprovals(dataWithAttachments);
            rpcSuccess = true;
          }
        } catch (rpcError) {
          console.log('RPC function failed, trying direct query:', rpcError);
        }

        // Fallback to direct query if RPC failed
        if (!rpcSuccess) {
          console.log('Using fallback direct query');
          const { data, error } = await supabase
            .from('task_approvals')
            .select(`
              *,
              task:tasks!task_id (
                title,
                description,
                budget,
                location_text,
                posting_type,
                categories!category_id (name_fi),
                user:profiles!user_id (first_name, last_name, email)
              )
            `)
            .eq('status', 'pending')
            .order('submitted_at', { ascending: true });

          console.log('Direct query response:', { data, error });

          if (error) throw error;

          // Transform joined data to match our interface
          const transformedData = data?.map((item: any) => ({
            id: item.id,
            task_id: item.task_id,
            submitted_at: item.submitted_at,
            reviewed_at: item.reviewed_at,
            reviewed_by: item.reviewed_by,
            status: item.status,
            admin_notes: item.admin_notes,
            rejection_reason: item.rejection_reason,
            created_at: item.created_at,
            updated_at: item.updated_at,
            task_title: item.task?.title || 'N/A',
            task_description: item.task?.description || 'N/A',
            task_budget: item.task?.budget,
            task_category_name: item.task?.categories?.name_fi,
            task_location: item.task?.location_text || 'N/A',
            user_name: item.task?.user ? `${item.task.user.first_name} ${item.task.user.last_name}` : 'N/A',
            user_email: item.task?.user?.email || 'N/A',
            posting_type: item.task?.posting_type,
          })) || [];

          console.log('Fallback transformed data:', transformedData);

          // Optimized: Fetch all attachments in a single query
          const taskIds = transformedData.map(approval => approval.task_id);
          let attachmentsByTask: Record<string, any[]> = {};

          if (taskIds.length > 0) {
            const { data: attachmentsData, error: attachmentsError } = await supabase
              .from('task_attachments')
              .select('id, file_url, file_type, task_id')
              .in('task_id', taskIds)
              .eq('file_type', 'image');

            if (!attachmentsError && attachmentsData) {
              // Group attachments by task_id
              attachmentsByTask = attachmentsData.reduce((acc, attachment) => {
                if (!acc[attachment.task_id]) {
                  acc[attachment.task_id] = [];
                }
                acc[attachment.task_id].push(attachment);
                return acc;
              }, {} as Record<string, any[]>);
            }
          }

          // Add attachments to each approval
          const dataWithAttachments = transformedData.map(approval => ({
            ...approval,
            task_attachments: attachmentsByTask[approval.task_id] || []
          }));

          setApprovals(dataWithAttachments);
        }
      } else {
        // For approved/rejected, query task_approvals table with joins
        let query = supabase
          .from('task_approvals')
          .select(`
            *,
            task:tasks!task_id (
              title,
              description,
              budget,
              location_text,
              posting_type,
              categories!category_id (name_fi),
              user:profiles!user_id (first_name, last_name, email)
            )
          `)
          .order('submitted_at', { ascending: false });

        if (filter !== 'all') {
          query = query.eq('status', filter);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Transform joined data to match our interface
        const transformedData = data?.map((item: any) => ({
          id: item.id,
          task_id: item.task_id,
          submitted_at: item.submitted_at,
          reviewed_at: item.reviewed_at,
          reviewed_by: item.reviewed_by,
          status: item.status,
          admin_notes: item.admin_notes,
          rejection_reason: item.rejection_reason,
          created_at: item.created_at,
          updated_at: item.updated_at,
          task_title: item.task?.title || 'N/A',
          task_description: item.task?.description || 'N/A',
          task_budget: item.task?.budget,
          task_category_name: item.task?.categories?.name_fi,
          task_location: item.task?.location_text || 'N/A',
          user_name: item.task?.user ? `${item.task.user.first_name} ${item.task.user.last_name}` : 'N/A',
          user_email: item.task?.user?.email || 'N/A',
          posting_type: item.task?.posting_type,
        })) || [];

        // Optimized: Fetch all attachments in a single query
        const taskIds = transformedData.map(approval => approval.task_id);
        let attachmentsByTask: Record<string, any[]> = {};

        if (taskIds.length > 0) {
          const { data: attachmentsData, error: attachmentsError } = await supabase
            .from('task_attachments')
            .select('id, file_url, file_type, task_id')
            .in('task_id', taskIds)
            .eq('file_type', 'image');

          if (!attachmentsError && attachmentsData) {
            // Group attachments by task_id
            attachmentsByTask = attachmentsData.reduce((acc, attachment) => {
              if (!acc[attachment.task_id]) {
                acc[attachment.task_id] = [];
              }
              acc[attachment.task_id].push(attachment);
              return acc;
            }, {} as Record<string, any[]>);
          }
        }

        // Add attachments to each approval
        const dataWithAttachments = transformedData.map(approval => ({
          ...approval,
          task_attachments: attachmentsByTask[approval.task_id] || []
        }));

        setApprovals(dataWithAttachments);
      }
    } catch (error) {
      console.error('Error fetching task approvals:', error);
      toast({
        title: "Virhe",
        description: "Tehtävien hyväksyntöjen lataaminen epäonnistui.",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const openApprovalDialog = (approval: TaskApproval) => {
    setSelectedApproval(approval);
    setNewStatus(approval.status === 'pending' ? '' : approval.status);
    setAdminNotes(approval.admin_notes || '');
    setRejectionReason(approval.rejection_reason || '');
    setIsDialogOpen(true);
  };

  const handleApprovalAction = async () => {
    if (!selectedApproval || !newStatus) return;

    setIsLoading(true);
    setProcessingId(selectedApproval.id);
    try {
      console.log('Processing task approval with data:', {
        task_approval_id: selectedApproval.id,
        admin_id: adminId,
        approval_status: newStatus,
        admin_notes: adminNotes.trim() || undefined,
        rejection_reason: newStatus === 'rejected' ? rejectionReason.trim() : undefined,
      });

      // Call the process_task_approval function
      const { error } = await supabase.rpc('process_task_approval', {
        task_approval_id: selectedApproval.id,
        admin_id: adminId,
        approval_status: newStatus,
        admin_notes: adminNotes.trim() || undefined,
        rejection_reason: newStatus === 'rejected' ? rejectionReason.trim() : undefined,
      });

      if (error) throw error;

      // Send email notification to the user
      try {
        const baseUrl = window.location.origin;

        if (newStatus === 'approved') {
          await sendTaskApprovedEmail({
            taskTitle: selectedApproval.task_title,
            taskId: selectedApproval.task_id,
            userFirstName: selectedApproval.user_name.split(' ')[0], // Get first name
            taskUrl: `${baseUrl}/dashboard/tasks/${selectedApproval.task_id}`,
            adminNotes: adminNotes.trim() || undefined,
          }, selectedApproval.user_email);

          toast({
            title: "Tehtävä hyväksytty!",
            description: `Tehtävä hyväksyttiin onnistuneesti ja sähköposti-ilmoitus lähetettiin käyttäjälle.`,
            variant: "default",
          });
        } else if (newStatus === 'rejected') {
          await sendTaskRejectedEmail({
            taskTitle: selectedApproval.task_title,
            taskId: selectedApproval.task_id,
            userFirstName: selectedApproval.user_name.split(' ')[0], // Get first name
            rejectionReason: rejectionReason.trim(),
            adminNotes: adminNotes.trim() || undefined,
            resubmitUrl: `${baseUrl}/tasks/new`,
          }, selectedApproval.user_email);

          toast({
            title: "Tehtävä hylätty",
            description: `Tehtävä hylättiin ja sähköposti-ilmoitus lähetettiin käyttäjälle.`,
            variant: "default",
          });
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the whole operation if email fails
        toast({
          title: "Onnistui!",
          description: `Tehtävä ${newStatus === 'approved' ? 'hyväksyttiin' : 'hylättiin'} onnistuneesti. Sähköposti-ilmoituksen lähetys epäonnistui.`,
          variant: "default",
        });
      }

      // Reset form and close dialog
      setIsDialogOpen(false);
      setSelectedApproval(null);
      setNewStatus('');
      setAdminNotes('');
      setRejectionReason('');

      // Refresh the list
      fetchApprovals();
    } catch (error) {
      console.error('Error processing task approval:', error);
      toast({
        title: "Virhe",
        description: "Tehtävän käsittely epäonnistui.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-600"><Clock className="mr-1 h-3 w-3" />Odottaa</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="mr-1 h-3 w-3" />Hyväksytty</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="mr-1 h-3 w-3" />Hylätty</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPostingTypeBadge = (postingType: string | null) => {
    switch (postingType) {
      case 'open':
        return <Badge variant="secondary" className="text-blue-600 border-blue-600">Avoin tarjous</Badge>;
      case 'direct':
        return <Badge variant="secondary" className="text-purple-600 border-purple-600">Suora valinta</Badge>;
      default:
        return <Badge variant="secondary">N/A</Badge>;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return `${amount.toFixed(2)} €`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Tehtävien hyväksyntä
          </CardTitle>
          <CardDescription>
            Hallitse käyttäjien lähettämiä tehtäviä ja hyväksy ne julkaistavaksi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Suodata tila" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Odottavat</SelectItem>
                <SelectItem value="approved">Hyväksytyt</SelectItem>
                <SelectItem value="rejected">Hylätyt</SelectItem>
                <SelectItem value="all">Kaikki</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchApprovals} variant="outline" disabled={isFetching}>
              {isFetching ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Ladataan...
                </>
              ) : (
                'Päivitä'
              )}
            </Button>
          </div>

          {approvals.length === 0 ? (
            <div className="text-center py-8">
              {isFetching ? (
                <>
                  <Clock className="mx-auto h-12 w-12 text-gray-300 animate-spin" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Ladataan tehtäviä...
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Haetaan tietoja tietokannasta.
                  </p>
                </>
              ) : (
                <>
                  <FileText className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Ei tehtäviä
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {filter === 'pending'
                      ? 'Ei odottavia hyväksyntöjä.'
                      : `Ei ${filter === 'approved' ? 'hyväksyttyjä' : filter === 'rejected' ? 'hylättyjä' : ''} tehtäviä.`
                    }
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tehtävä</TableHead>
                    <TableHead>Käyttäjä</TableHead>
                    <TableHead>Kategoria</TableHead>
                    <TableHead>Budjetti</TableHead>
                    <TableHead>Tyyppi</TableHead>
                    <TableHead>Lähetetty</TableHead>
                    <TableHead>Tila</TableHead>
                    <TableHead>Toiminnot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell>
                        <div className="max-w-48">
                          <div className="font-medium truncate flex items-center">
                            {approval.task_title}
                            {approval.task_attachments && approval.task_attachments.length > 0 && (
                              <span title={`${approval.task_attachments.length} kuvaa`}>
                                <ImageIcon className="ml-2 h-4 w-4 text-blue-500" />
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate">{approval.task_description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">{approval.user_name}</div>
                            <div className="text-xs text-gray-500">{approval.user_email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{approval.task_category_name || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(approval.task_budget)}</span>
                      </TableCell>
                      <TableCell>
                        {getPostingTypeBadge(approval.posting_type)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(approval.submitted_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(approval.status)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openApprovalDialog(approval)}
                          disabled={processingId === approval.id}
                        >
                          {processingId === approval.id ? (
                            <>
                              <Clock className="mr-1 h-3 w-3 animate-spin" />
                              Käsitellään...
                            </>
                          ) : (
                            <>
                              <Eye className="mr-1 h-3 w-3" />
                              {approval.status === 'pending' ? 'Käsittele' : 'Näytä'}
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Processing Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedApproval?.status === 'pending' ? 'Käsittele tehtävä' : 'Tehtävän tiedot'}
            </DialogTitle>
            <DialogDescription>
              {selectedApproval?.status === 'pending'
                ? 'Tarkista tehtävän tiedot ja päätä hyväksymisestä'
                : 'Tehtävän käsittelyn tiedot'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-6">
              {/* Task Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tehtävän otsikko</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{selectedApproval.task_title}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Kuvaus</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedApproval.task_description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Budjetti</label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{formatCurrency(selectedApproval.task_budget)}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Kategoria</label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">{selectedApproval.task_category_name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Sijainti</label>
                    <div className="p-3 bg-gray-50 rounded-lg flex items-start">
                      <MapPin className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
                      <p className="text-sm">{selectedApproval.task_location}</p>
                    </div>
                  </div>

                  {/* Task Images Section */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Tehtävän kuvat</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {selectedApproval.task_attachments && selectedApproval.task_attachments.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {selectedApproval.task_attachments.map((attachment, index) => (
                            <div
                              key={attachment.id}
                              className="relative group cursor-pointer"
                              onClick={() => window.open(attachment.file_url, '_blank')}
                            >
                              <img
                                src={attachment.file_url}
                                alt={`Tehtävän kuva ${index + 1}`}
                                className="w-full h-24 object-cover rounded border hover:opacity-75 transition-opacity"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder-image.png'; // Fallback image
                                  target.style.display = 'flex';
                                  target.style.alignItems = 'center';
                                  target.style.justifyContent = 'center';
                                  target.style.backgroundColor = '#f3f4f6';
                                  target.alt = 'Kuva ei saatavilla';
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded transition-all flex items-center justify-center">
                                <ImageIcon className="text-white opacity-0 group-hover:opacity-100 h-6 w-6" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-500 text-sm">
                          <ImageIcon className="mr-2 h-4 w-4" />
                          <span>Ei kuvia liitetty</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Käyttäjä</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{selectedApproval.user_name}</p>
                      <p className="text-sm text-gray-500">{selectedApproval.user_email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tyyppi</label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        {getPostingTypeBadge(selectedApproval.posting_type)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Lähetetty</label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">
                          {format(new Date(selectedApproval.submitted_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing Admin Response (if any) */}
              {selectedApproval.admin_notes && (
                <div>
                  <label className="block text-sm font-medium mb-2">Aiemmat admin-kommentit</label>
                  <div className="bg-blue-50 p-3 border border-blue-200 rounded-lg whitespace-pre-wrap">
                    {selectedApproval.admin_notes}
                  </div>
                </div>
              )}

              {selectedApproval.rejection_reason && (
                <div>
                  <label className="block text-sm font-medium mb-2">Hylkäyksen syy</label>
                  <div className="bg-red-50 p-3 border border-red-200 rounded-lg whitespace-pre-wrap">
                    {selectedApproval.rejection_reason}
                  </div>
                </div>
              )}

              {/* Action Section (only for pending approvals) */}
              {selectedApproval.status === 'pending' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Päätös</label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Valitse päätös" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">Hyväksy</SelectItem>
                          <SelectItem value="rejected">Hylkää</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Admin-kommentit</label>
                    <Textarea
                      placeholder="Valinnainen kommentti päätöksestä..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {newStatus === 'rejected' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Hylkäyksen syy *</label>
                      <Textarea
                        placeholder="Selitä miksi tehtävä hylättiin (näytetään käyttäjälle)..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                      />
                      {newStatus === 'rejected' && !rejectionReason.trim() && (
                        <p className="text-sm text-red-600 mt-1">Hylkäyksen syy on pakollinen</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {selectedApproval?.status === 'pending' && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Peruuta
              </Button>
              <Button
                onClick={handleApprovalAction}
                disabled={isLoading || !newStatus || (newStatus === 'rejected' && !rejectionReason.trim())}
              >
                {isLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Käsitellään...
                  </>
                ) : newStatus === 'approved' ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Hyväksy tehtävä
                  </>
                ) : newStatus === 'rejected' ? (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Hylkää tehtävä
                  </>
                ) : (
                  'Valitse päätös'
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

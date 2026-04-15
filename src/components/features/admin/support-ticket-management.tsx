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
import { AlertCircle, CheckCircle, Clock, Eye, MessageSquare, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SupportTicket {
  id: string;
  user_id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  admin_response: string | null;
  admin_id: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    first_name: string | null;
    last_name: string | null;
    role: string;
  };
}

interface SupportTicketManagementProps {
  adminId: string;
}

export default function SupportTicketManagement({ adminId }: SupportTicketManagementProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [adminResponse, setAdminResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<string>('open');
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          user:profiles!support_tickets_user_id_fkey(first_name, last_name, role)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      toast({
        title: "Virhe",
        description: "Tukipalvelupyyntöjen lataaminen epäonnistui.",
        variant: "destructive",
      });
    }
  };

  const handleTicketUpdate = async () => {
    if (!selectedTicket || !newStatus) return;

    setIsLoading(true);
    try {
      const updateData: any = {
        status: newStatus,
        admin_id: adminId,
        updated_at: new Date().toISOString(),
      };

      // Add admin response if provided
      if (adminResponse.trim()) {
        updateData.admin_response = adminResponse.trim();
      }

      // Set resolved_at if ticket is being resolved or closed
      if ((newStatus === 'resolved' || newStatus === 'closed') && selectedTicket.status !== newStatus) {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast({
        title: "Tukipalvelupyyntö päivitetty",
        description: `Tukipalvelupyynnön tila muutettu: ${getStatusText(newStatus)}`,
      });

      setIsDialogOpen(false);
      setSelectedTicket(null);
      setNewStatus('');
      setAdminResponse('');
      fetchTickets();
    } catch (error: any) {
      console.error('Error updating support ticket:', error);
      toast({
        title: "Virhe",
        description: error.message || "Tukipalvelupyynnön päivittäminen epäonnistui.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openTicketDialog = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setAdminResponse(ticket.admin_response || '');
    setIsDialogOpen(true);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><MessageSquare className="mr-1 h-3 w-3" />Avoin</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="mr-1 h-3 w-3" />Käsittelyssä</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="text-sky-600 border-sky-600"><CheckCircle className="mr-1 h-3 w-3" />Ratkaistu</Badge>;
      case 'closed':
        return <Badge variant="outline" className="text-gray-600 border-gray-600"><CheckCircle className="mr-1 h-3 w-3" />Suljettu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs"><AlertCircle className="mr-1 h-3 w-3" />Kiireellinen</Badge>;
      case 'normal':
        return <Badge variant="secondary" className="text-xs">Normaali</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Matala</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{priority}</Badge>;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Avoin';
      case 'in_progress': return 'Käsittelyssä';
      case 'resolved': return 'Ratkaistu';
      case 'closed': return 'Suljettu';
      default: return status;
    }
  };

  const getUserRoleBadge = (role: string) => {
    switch (role) {
      case 'user':
        return <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs"><User className="mr-1 h-3 w-3" />Asiakas</Badge>;
      case 'tasker':
        return <Badge variant="outline" className="text-primary border-sky-600 text-xs"><User className="mr-1 h-3 w-3" />Tekijä</Badge>;
      case 'admin':
        return <Badge variant="outline" className="text-red-600 border-red-600 text-xs"><User className="mr-1 h-3 w-3" />Admin</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Tukipalvelupyynnöt
          </CardTitle>
          <CardDescription>
            Hallitse käyttäjien tukipalvelupyyntöjä ja anna vastauksia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter */}
          <div className="mb-4 flex items-center gap-4">
            <div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Suodata tilaan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Kaikki pyynnöt</SelectItem>
                  <SelectItem value="open">Avoimet</SelectItem>
                  <SelectItem value="in_progress">Käsittelyssä</SelectItem>
                  <SelectItem value="resolved">Ratkaistut</SelectItem>
                  <SelectItem value="closed">Suljetut</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 text-sm text-gray-600">
              Yhteensä {tickets.length} tukipalvelupyyntöä
            </div>
          </div>

          {/* Support Tickets Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Käyttäjä</TableHead>
                  <TableHead>Aihe</TableHead>
                  <TableHead>Prioriteetti</TableHead>
                  <TableHead>Tila</TableHead>
                  <TableHead>Luotu</TableHead>
                  <TableHead>Toiminnot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {ticket.user.first_name} {ticket.user.last_name}
                        </div>
                        <div className="text-sm text-gray-600">{ticket.email}</div>
                        <div>{getUserRoleBadge(ticket.user.role)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{ticket.subject}</div>
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {ticket.message.length > 100
                            ? `${ticket.message.substring(0, 100)}...`
                            : ticket.message}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(ticket.priority)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(ticket.status)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(ticket.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTicketDialog(ticket)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Näytä
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {tickets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {filter === 'all'
                        ? 'Ei tukipalvelupyyntöjä'
                        : `Ei ${getStatusText(filter).toLowerCase()} tukipalvelupyyntöjä`}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tukipalvelupyyntö #{selectedTicket?.id.substring(0, 8)}</DialogTitle>
            <DialogDescription>
              Katso tukipalvelupyynnön tiedot ja vastaa käyttäjälle
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Käyttäjätiedot</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Nimi:</strong> {selectedTicket.user.first_name} {selectedTicket.user.last_name}</div>
                    <div><strong>Sähköposti:</strong> {selectedTicket.email}</div>
                    <div><strong>Rooli:</strong> {getUserRoleBadge(selectedTicket.user.role)}</div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Pyynnön tiedot</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Prioriteetti:</strong> {getPriorityBadge(selectedTicket.priority)}</div>
                    <div><strong>Tila:</strong> {getStatusBadge(selectedTicket.status)}</div>
                    <div><strong>Luotu:</strong> {formatDate(selectedTicket.created_at)}</div>
                    {selectedTicket.resolved_at && (
                      <div><strong>Ratkaistu:</strong> {formatDate(selectedTicket.resolved_at)}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subject and Message */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Aihe</h4>
                  <div className="bg-white p-3 border rounded-lg">
                    {selectedTicket.subject}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Viesti</h4>
                  <div className="bg-white p-3 border rounded-lg whitespace-pre-wrap">
                    {selectedTicket.message}
                  </div>
                </div>
              </div>

              {/* Existing Admin Response */}
              {selectedTicket.admin_response && (
                <div>
                  <h4 className="font-semibold mb-2">Nykyinen vastaus</h4>
                  <div className="bg-sky-50 p-3 border border-sky-200 rounded-lg whitespace-pre-wrap">
                    {selectedTicket.admin_response}
                  </div>
                </div>
              )}

              {/* Status Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tila</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Valitse tila" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Avoin</SelectItem>
                      <SelectItem value="in_progress">Käsittelyssä</SelectItem>
                      <SelectItem value="resolved">Ratkaistu</SelectItem>
                      <SelectItem value="closed">Suljettu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Admin Response */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {selectedTicket.admin_response ? 'Päivitä vastaus' : 'Admin-vastaus'}
                </label>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Kirjoita vastaus käyttäjälle..."
                  rows={4}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tämä vastaus lähetetään käyttäjälle sähköpostitse (tulevaisuudessa)
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Peruuta
            </Button>
            <Button
              onClick={handleTicketUpdate}
              disabled={isLoading || !newStatus}
            >
              {isLoading ? 'Päivitetään...' : 'Päivitä tukipalvelupyyntö'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/shared/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fi } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  RefreshCw,
  User,
  XCircle
} from 'lucide-react';
import { useState, useTransition } from 'react';

interface Dispute {
  id: string;
  task_id: string;
  opened_by_profile_id: string;
  opened_by_role: 'user' | 'tasker' | 'admin';
  reason: string;
  description?: string;
  attachments?: any[];
  status: 'open' | 'under_review' | 'resolved_refund' | 'resolved_partial' | 'resolved_release' | 'cancelled';
  refund_amount?: number;
  resolution_summary?: string;
  created_at: string;
  updated_at: string;
  task?: {
    id: string;
    title: string;
    user_id: string;
    assigned_tasker_id?: string;
    status: string;
  };
  opened_by?: {
    id: string;
    first_name?: string;
    last_name?: string;
  };
}

interface DisputeManagementProps {
  disputes: Dispute[];
}

const statusConfig = {
  open: { label: 'Avoin', variant: 'destructive' as const, icon: AlertTriangle },
  under_review: { label: 'Käsittelyssä', variant: 'secondary' as const, icon: Clock },
  resolved_refund: { label: 'Ratkaisu: Palautus', variant: 'outline' as const, icon: CheckCircle },
  resolved_partial: { label: 'Ratkaisu: Osittainen', variant: 'outline' as const, icon: CheckCircle },
  resolved_release: { label: 'Ratkaisu: Vapautus', variant: 'outline' as const, icon: CheckCircle },
  cancelled: { label: 'Peruutettu', variant: 'secondary' as const, icon: XCircle },
};

const reasonLabels = {
  no_show: 'Ei saapunut paikalle',
  poor_quality: 'Huono laatu',
  scope_disagreement: 'Erimielisyys työn laajuudesta',
  damages: 'Vahingot',
  other: 'Muu syy'
};

export default function DisputeManagement({ disputes }: DisputeManagementProps) {
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionType, setResolutionType] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleResolveDispute = () => {
    if (!selectedDispute || !resolutionType) return;

    startTransition(async () => {
      try {
        // This would call an API route to resolve the dispute
        // For now, just show success message
        toast({
          title: 'Riita ratkaistu',
          description: `Riita ${selectedDispute.id} on ratkaistu: ${resolutionType}`,
          variant: 'default'
        });
        setSelectedDispute(null);
        setResolutionType('');
        setRefundAmount('');
        setResolutionSummary('');
      } catch (error) {
        toast({
          title: 'Virhe',
          description: 'Riidan ratkaiseminen epäonnistui',
          variant: 'destructive'
        });
      }
    });
  };

  const openDisputes = disputes.filter(d => d.status === 'open');
  const inReviewDisputes = disputes.filter(d => d.status === 'under_review');
  const resolvedDisputes = disputes.filter(d => d.status.startsWith('resolved_'));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{openDisputes.length}</p>
                <p className="text-sm text-gray-600">Avoinna olevat riidat</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{inReviewDisputes.length}</p>
                <p className="text-sm text-gray-600">Käsittelyssä</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{resolvedDisputes.length}</p>
                <p className="text-sm text-gray-600">Ratkaistut riidat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kaikki riidat</CardTitle>
          <CardDescription>
            Hallitse tehtäväriitojen ratkaisuprosessia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Tehtävä</th>
                  <th className="px-6 py-3">Avasi</th>
                  <th className="px-6 py-3">Syy</th>
                  <th className="px-6 py-3">Tila</th>
                  <th className="px-6 py-3">Luotu</th>
                  <th className="px-6 py-3">Toiminnot</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((dispute) => {
                  const statusConf = statusConfig[dispute.status];
                  const StatusIcon = statusConf.icon;

                  return (
                    <tr key={dispute.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {dispute.task?.title || 'Tuntematon tehtävä'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {dispute.task_id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {dispute.opened_by?.first_name} {dispute.opened_by?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {dispute.opened_by_role === 'user' ? 'Käyttäjä' :
                                dispute.opened_by_role === 'tasker' ? 'Tekijä' : 'Admin'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">
                          {reasonLabels[dispute.reason as keyof typeof reasonLabels] || dispute.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusConf.variant} className="inline-flex items-center space-x-1">
                          <StatusIcon className="h-3 w-3" />
                          <span>{statusConf.label}</span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDistanceToNow(new Date(dispute.created_at), {
                          addSuffix: true,
                          locale: fi
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDispute(dispute)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Näytä
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Riidan tiedot</DialogTitle>
                              <DialogDescription>
                                Riita tehtävässä: {dispute.task?.title}
                              </DialogDescription>
                            </DialogHeader>

                            {selectedDispute && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="font-medium">Syy:</Label>
                                    <p>{reasonLabels[selectedDispute.reason as keyof typeof reasonLabels]}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Avasi:</Label>
                                    <p>{selectedDispute.opened_by?.first_name} {selectedDispute.opened_by?.last_name}</p>
                                  </div>
                                </div>

                                {selectedDispute.description && (
                                  <div>
                                    <Label className="font-medium">Kuvaus:</Label>
                                    <p className="mt-1 text-gray-700">{selectedDispute.description}</p>
                                  </div>
                                )}

                                {selectedDispute.status === 'open' && (
                                  <div className="border-t pt-4 space-y-4">
                                    <h4 className="font-medium">Ratkaise riita</h4>

                                    <div>
                                      <Label htmlFor="resolution-type">Ratkaisun tyyppi</Label>
                                      <Select value={resolutionType} onValueChange={setResolutionType}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Valitse ratkaisun tyyppi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="refund">Täysi palautus</SelectItem>
                                          <SelectItem value="partial">Osittainen palautus</SelectItem>
                                          <SelectItem value="release">Vapautetaan varat tekijälle</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {(resolutionType === 'refund' || resolutionType === 'partial') && (
                                      <div>
                                        <Label htmlFor="refund-amount">Palautusmäärä (€)</Label>
                                        <Input
                                          id="refund-amount"
                                          type="number"
                                          step="0.01"
                                          value={refundAmount}
                                          onChange={(e) => setRefundAmount(e.target.value)}
                                          placeholder="0.00"
                                        />
                                      </div>
                                    )}

                                    <div>
                                      <Label htmlFor="resolution-summary">Perustelut</Label>
                                      <Textarea
                                        id="resolution-summary"
                                        value={resolutionSummary}
                                        onChange={(e) => setResolutionSummary(e.target.value)}
                                        placeholder="Kirjoita päätöksen perustelut..."
                                        rows={3}
                                      />
                                    </div>

                                    <Button
                                      onClick={handleResolveDispute}
                                      disabled={!resolutionType || isPending}
                                      className="w-full"
                                    >
                                      {isPending ? (
                                        <>
                                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                          Ratkaistaan...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Ratkaise riita
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {disputes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Ei riitojen tietoja saatavilla</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';
import { fi } from 'date-fns/locale';
import {
  BarChart3,
  Clock,
  Download,
  Eye,
  Loader2,
  MessageSquare,
  TrendingUp,
  User
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface FeedbackItem {
  id: string;
  user_id: string | null;
  session_id: string | null;
  concept_clarity_score: number;
  usability_score: number;
  open_feedback: string | null;
  page_url: string | null;
  created_at: string;
  status: 'new' | 'reviewed' | 'archived';
  admin_notes: string | null;
  reviewed_at: string | null;
  is_authenticated: boolean;
  feedback_version: number;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  reviewed_by_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface FeedbackStats {
  total_feedback_count: number;
  avg_concept_clarity: number;
  avg_usability_score: number;
  new_feedback_count: number;
  reviewed_feedback_count: number;
  anonymous_feedback_count: number;
  authenticated_feedback_count: number;
}

interface FeedbackResponse {
  feedback: FeedbackItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: FeedbackStats;
  filters: {
    status: string;
    sortBy: string;
    sortOrder: string;
    search?: string;
  };
}

export default function FeedbackManagement() {
  const [feedbackData, setFeedbackData] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URL params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const status = searchParams.get('status') || 'all';
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const search = searchParams.get('search') || '';

  // Update URL params
  const updateParams = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  // Fetch feedback data
  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      params.set('status', status);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      if (search) {
        params.set('search', search);
      }

      const response = await fetch(`/api/admin/feedback?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }

      const data = await response.json();
      setFeedbackData(data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Virhe palautteita haettaessa');
    } finally {
      setLoading(false);
    }
  };

  // Update feedback status
  const updateFeedbackStatus = async (feedbackId: string, newStatus: string, adminNotes?: string) => {
    try {
      setUpdatingStatus(feedbackId);

      const response = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackId,
          status: newStatus,
          adminNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update feedback');
      }

      toast.success('Palaute päivitetty onnistuneesti');
      fetchFeedback(); // Refresh data
      setDetailsOpen(false);
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast.error('Virhe päivitettäessä palautetta');
    } finally {
      setUpdatingStatus(null);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [page, status, sortBy, sortOrder, search]);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      new: { label: 'Uusi', variant: 'default' as const },
      reviewed: { label: 'Käsitelty', variant: 'secondary' as const },
      archived: { label: 'Arkistoitu', variant: 'outline' as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.new;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return 'text-red-600';
    if (score <= 6) return 'text-yellow-600';
    return 'text-sky-600';
  };

  const formatUserName = (feedback: FeedbackItem) => {
    if (feedback.user?.first_name || feedback.user?.last_name) {
      return `${feedback.user.first_name || ''} ${feedback.user.last_name || ''}`.trim();
    }
    return feedback.is_authenticated ? 'Kirjautunut käyttäjä' : 'Anonyymi';
  };

  if (loading && !feedbackData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {feedbackData?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yhteensä palautteita</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{feedbackData.stats.total_feedback_count}</div>
              <p className="text-xs text-muted-foreground">
                {feedbackData.stats.new_feedback_count} uutta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Konseptin selkeys</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {feedbackData.stats.avg_concept_clarity || 0}/10
              </div>
              <p className="text-xs text-muted-foreground">Keskiarvo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Käytettävyys</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {feedbackData.stats.avg_usability_score || 0}/10
              </div>
              <p className="text-xs text-muted-foreground">Keskiarvo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kirjautuneet</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((feedbackData.stats.authenticated_feedback_count / feedbackData.stats.total_feedback_count) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {feedbackData.stats.authenticated_feedback_count}/{feedbackData.stats.total_feedback_count}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Suodattimet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Hae palautteista..."
                value={search}
                onChange={(e) => updateParams({ search: e.target.value, page: '1' })}
                className="w-full"
              />
            </div>

            <Select value={status} onValueChange={(value) => updateParams({ status: value, page: '1' })}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kaikki tilat</SelectItem>
                <SelectItem value="new">Uudet</SelectItem>
                <SelectItem value="reviewed">Käsitellyt</SelectItem>
                <SelectItem value="archived">Arkistoidut</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => updateParams({ sortBy: value, page: '1' })}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Luontiaika</SelectItem>
                <SelectItem value="concept_clarity_score">Konseptin selkeys</SelectItem>
                <SelectItem value="usability_score">Käytettävyys</SelectItem>
                <SelectItem value="status">Tila</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Palautteet</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Vie CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Päivämäärä</TableHead>
                    <TableHead>Käyttäjä</TableHead>
                    <TableHead>Konsepti</TableHead>
                    <TableHead>Käytettävyys</TableHead>
                    <TableHead>Tila</TableHead>
                    <TableHead>Toiminnot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackData?.feedback?.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {format(parseISO(feedback.created_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatUserName(feedback)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getScoreColor(feedback.concept_clarity_score)}`}>
                          {feedback.concept_clarity_score}/10
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getScoreColor(feedback.usability_score)}`}>
                          {feedback.usability_score}/10
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(feedback.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFeedback(feedback);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {feedbackData?.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Näytetään {((feedbackData.pagination.page - 1) * feedbackData.pagination.limit) + 1} - {Math.min(feedbackData.pagination.page * feedbackData.pagination.limit, feedbackData.pagination.total)} / {feedbackData.pagination.total}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={feedbackData.pagination.page === 1}
                      onClick={() => updateParams({ page: (feedbackData.pagination.page - 1).toString() })}
                    >
                      Edellinen
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={feedbackData.pagination.page >= feedbackData.pagination.totalPages}
                      onClick={() => updateParams({ page: (feedbackData.pagination.page + 1).toString() })}
                    >
                      Seuraava
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Feedback Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Palautteen yksityiskohdat</DialogTitle>
            <DialogDescription>
              Lähetetty {selectedFeedback && format(parseISO(selectedFeedback.created_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-6">
              {/* User Info */}
              <div>
                <Label className="text-sm font-medium">Käyttäjä</Label>
                <p className="text-sm text-gray-600">{formatUserName(selectedFeedback)}</p>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Konseptin selkeys</Label>
                  <p className={`text-lg font-bold ${getScoreColor(selectedFeedback.concept_clarity_score)}`}>
                    {selectedFeedback.concept_clarity_score}/10
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Käytettävyys</Label>
                  <p className={`text-lg font-bold ${getScoreColor(selectedFeedback.usability_score)}`}>
                    {selectedFeedback.usability_score}/10
                  </p>
                </div>
              </div>

              {/* Open Feedback */}
              {selectedFeedback.open_feedback && (
                <div>
                  <Label className="text-sm font-medium">Avoin palaute</Label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md mt-1">
                    {selectedFeedback.open_feedback}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <strong>Sivu:</strong> {selectedFeedback.page_url || 'Ei tietoa'}
                </div>
                <div>
                  <strong>Versio:</strong> {selectedFeedback.feedback_version}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <Label htmlFor="adminNotes" className="text-sm font-medium">Admin muistiinpanot</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Lisää muistiinpanoja..."
                  defaultValue={selectedFeedback.admin_notes || ''}
                  className="mt-1"
                />
              </div>

              {/* Status Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Tila:</span>
                  {getStatusBadge(selectedFeedback.status)}
                </div>
                <div className="flex space-x-2">
                  {selectedFeedback.status !== 'reviewed' && (
                    <Button
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, 'reviewed')}
                      disabled={updatingStatus === selectedFeedback.id}
                      size="sm"
                    >
                      {updatingStatus === selectedFeedback.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Merkitse käsitellyksi
                    </Button>
                  )}
                  {selectedFeedback.status !== 'archived' && (
                    <Button
                      variant="outline"
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, 'archived')}
                      disabled={updatingStatus === selectedFeedback.id}
                      size="sm"
                    >
                      Arkistoi
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
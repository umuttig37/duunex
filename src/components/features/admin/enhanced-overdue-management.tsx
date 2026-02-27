'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/shared/use-toast';
import { createClient } from '@/lib/supabase/client';
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle2,
  Clock, 
  CreditCard, 
  Euro,
  Eye,
  Mail, 
  Play, 
  RefreshCw, 
  Shield, 
  TrendingUp,
  User,
  Zap,
  XCircle,
  Settings,
  Bell
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface OverdueTask {
  task_id: string;
  title: string;
  status: string;
  user_id: string;
  user_name: string;
  user_email: string;
  assigned_tasker_id: string | null;
  tasker_name: string | null;
  tasker_email: string | null;
  overdue_type: string;
  overdue_hours: number;
  priority_level: string;
  scheduled_date: string | null;
  scheduled_time_slot: string | null;
  created_at: string;
  budget: number | null;
  last_status_change: string;
  escalation_level: number;
  auto_action_eligible: boolean;
}

interface EscalationAction {
  id: string;
  task_id: string;
  overdue_type: string;
  escalation_level: number;
  action_type: string;
  action_status: string;
  action_description: string;
  scheduled_at: string;
  executed_at: string | null;
  admin_notified: boolean;
  task_title: string;
  user_name: string;
  tasker_name: string;
}

interface EscalationStats {
  total_overdue: number;
  critical_overdue: number;
  high_priority_overdue: number;
  auto_action_pending: number;
  escalation_actions_today: number;
  avg_escalation_time: number;
}

export default function EnhancedOverdueManagement({ adminId }: { adminId: string }) {
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
  const [escalationActions, setEscalationActions] = useState<EscalationAction[]>([]);
  const [stats, setStats] = useState<EscalationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedTask, setSelectedTask] = useState<OverdueTask | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [actionNotes, setActionNotes] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoActionProcessing, setAutoActionProcessing] = useState(false);
  
  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchOverdueData();
    fetchEscalationActions();
    fetchStats();
  }, [priorityFilter, statusFilter]);

  const fetchOverdueData = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .rpc('get_overdue_tasks', {
          grace_period_hours: 24,
          include_paid_tasks: true
        });

      if (error) throw error;

      // Apply filters
      let filteredTasks = data || [];
      
      if (priorityFilter !== 'all') {
        filteredTasks = filteredTasks.filter((task: OverdueTask) => 
          task.priority_level === priorityFilter
        );
      }

      if (statusFilter !== 'all') {
        filteredTasks = filteredTasks.filter((task: OverdueTask) => 
          task.status === statusFilter
        );
      }

      setOverdueTasks(filteredTasks);
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
      toast({
        title: 'Virhe',
        description: 'Myöhässä olevien tehtävien lataaminen epäonnistui.',
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const fetchEscalationActions = async () => {
    try {
      const { data, error } = await supabase
        .from('overdue_task_actions')
        .select(`
          *,
          task:tasks!task_id (
            title
          ),
          user:profiles!user_id (
            first_name,
            last_name
          ),
          tasker:profiles!tasker_id (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const processedActions = (data || []).map((action: any) => ({
        ...action,
        task_title: action.task?.title || 'Unknown Task',
        user_name: action.user ? `${action.user.first_name || ''} ${action.user.last_name || ''}`.trim() : 'Unknown User',
        tasker_name: action.tasker ? `${action.tasker.first_name || ''} ${action.tasker.last_name || ''}`.trim() : 'Unassigned'
      }));

      setEscalationActions(processedActions);
    } catch (error) {
      console.error('Error fetching escalation actions:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Get basic overdue stats
      const { data: overdueTasks, error } = await supabase
        .rpc('get_overdue_tasks', {
          grace_period_hours: 24,
          include_paid_tasks: true
        });

      if (!error && overdueTasks) {
        setStats({
          total_overdue: overdueTasks.length,
          critical_overdue: overdueTasks.filter((t: OverdueTask) => t.priority_level === 'critical').length,
          high_priority_overdue: overdueTasks.filter((t: OverdueTask) => t.priority_level === 'high').length,
          auto_action_pending: overdueTasks.filter((t: OverdueTask) => t.auto_action_eligible).length,
          escalation_actions_today: 0, // Would need separate query
          avg_escalation_time: 0 // Would need separate calculation
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const triggerManualEscalation = async () => {
    setAutoActionProcessing(true);
    try {
      const response = await fetch('/api/cron/overdue-task-escalation', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Eskalointianalyysi suoritettu',
          description: `Löydettiin ${result.overdue_tasks.total} myöhässä olevaa tehtävää. ${result.escalation_actions.actions_created || 0} toimenpidettä luotu.`,
        });

        // Refresh data
        await fetchOverdueData();
        await fetchEscalationActions();
        await fetchStats();
      } else {
        throw new Error(result.error || 'Manual escalation failed');
      }
    } catch (error) {
      console.error('Manual escalation error:', error);
      toast({
        title: 'Virhe',
        description: 'Manuaalinen eskalointianalyysi epäonnistui.',
        variant: 'destructive',
      });
    } finally {
      setAutoActionProcessing(false);
    }
  };

  const handleTaskAction = async () => {
    if (!selectedTask || !actionType) return;

    setIsLoading(true);
    try {
      // Process different action types
      switch (actionType) {
        case 'resolve':
          // Mark task as resolved/completed
          const { error: resolveError } = await supabase
            .from('tasks')
            .update({ 
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', selectedTask.task_id);

          if (resolveError) throw resolveError;
          break;

        case 'refund':
          // This would trigger refund process
          toast({
            title: 'Hyvitys',
            description: 'Hyvitysprosessi käynnistetään. Tämä vaatii manuaalista käsittelyä.',
          });
          break;

        case 'escalate':
          // Create higher-level escalation
          const { error: escalateError } = await supabase
            .from('overdue_task_actions')
            .insert({
              task_id: selectedTask.task_id,
              user_id: selectedTask.user_id,
              tasker_id: selectedTask.assigned_tasker_id,
              overdue_type: selectedTask.overdue_type,
              escalation_level: selectedTask.escalation_level + 1,
              action_type: 'manual_escalation',
              action_description: `Manuaalinen eskalointitoimenpide: ${actionNotes}`,
              admin_notified: true
            });

          if (escalateError) throw escalateError;
          break;
      }

      toast({
        title: 'Toimenpide suoritettu',
        description: 'Tehtävälle suoritettu toimenpide onnistuneesti.',
      });

      setIsActionDialogOpen(false);
      setSelectedTask(null);
      setActionType('');
      setActionNotes('');
      
      // Refresh data
      await fetchOverdueData();
      await fetchEscalationActions();
      
    } catch (error) {
      console.error('Error processing task action:', error);
      toast({
        title: 'Virhe',
        description: 'Toimenpiteen suorittaminen epäonnistui.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" />Kriittinen</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200"><TrendingUp className="h-3 w-3 mr-1" />Korkea</Badge>;
      case 'medium':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="h-3 w-3 mr-1" />Keskitaso</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Bell className="h-3 w-3 mr-1" />Matala</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-primary/10 text-primary border-primary/20"><CreditCard className="h-3 w-3 mr-1" />Maksettu</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Play className="h-3 w-3 mr-1" />Käynnissä</Badge>;
      case 'assigned':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200"><User className="h-3 w-3 mr-1" />Määritetty</Badge>;
      case 'open':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><Eye className="h-3 w-3 mr-1" />Avoin</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Myöhässä olevien tehtävien hallinta</h1>
          <p className="text-gray-600 mt-1">
            Automaattinen eskalointijärjestelmä ja toimenpidetyökalut
          </p>
        </div>
        <Button 
          onClick={triggerManualEscalation}
          disabled={autoActionProcessing}
          size="sm"
        >
          {autoActionProcessing ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          Suorita Eskalointianalyysi
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/20"></div>
            <CardHeader className="relative pb-3">
              <CardTitle className="text-sm font-medium text-red-800">Kriittiset Tehtävät</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-red-700 mb-1">{stats.critical_overdue}</div>
              <div className="flex items-center text-sm text-red-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Vaatii välitöntä toimenpidettä
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/20"></div>
            <CardHeader className="relative pb-3">
              <CardTitle className="text-sm font-medium text-orange-800">Korkean Prioriteetin</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-orange-700 mb-1">{stats.high_priority_overdue}</div>
              <div className="flex items-center text-sm text-orange-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                Eskaloidut tehtävät
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-600/20"></div>
            <CardHeader className="relative pb-3">
              <CardTitle className="text-sm font-medium text-amber-800">Automaattitoimenpide</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-amber-700 mb-1">{stats.auto_action_pending}</div>
              <div className="flex items-center text-sm text-amber-600">
                <Settings className="h-4 w-4 mr-1" />
                Odottaa hyväksyntää
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/20"></div>
            <CardHeader className="relative pb-3">
              <CardTitle className="text-sm font-medium text-blue-800">Yhteensä Myöhässä</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-blue-700 mb-1">{stats.total_overdue}</div>
              <div className="flex items-center text-sm text-blue-600">
                <Clock className="h-4 w-4 mr-1" />
                Aktiivisia tehtäviä
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Myöhässä Olevat Tehtävät</TabsTrigger>
          <TabsTrigger value="actions">Eskalointitoimenpiteet</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Suodata prioriteetilla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kaikki prioriteetit</SelectItem>
                <SelectItem value="critical">Kriittinen</SelectItem>
                <SelectItem value="high">Korkea</SelectItem>
                <SelectItem value="medium">Keskitaso</SelectItem>
                <SelectItem value="low">Matala</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Suodata tilalla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kaikki tilat</SelectItem>
                <SelectItem value="paid">Maksettu</SelectItem>
                <SelectItem value="in_progress">Käynnissä</SelectItem>
                <SelectItem value="assigned">Määritetty</SelectItem>
                <SelectItem value="open">Avoin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Overdue Tasks Table */}
          <Card>
            <CardHeader>
              <CardTitle>Myöhässä Olevat Tehtävät</CardTitle>
              <CardDescription>
                Tehtävät, jotka vaativat seurantaa tai toimenpiteitä
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tehtävä</TableHead>
                      <TableHead>Tila</TableHead>
                      <TableHead>Prioriteetti</TableHead>
                      <TableHead>Myöhässä</TableHead>
                      <TableHead>Asiakas / Tekijä</TableHead>
                      <TableHead>Toimenpiteet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFetching ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                          Ladataan tehtäviä...
                        </TableCell>
                      </TableRow>
                    ) : overdueTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
                          Ei myöhässä olevia tehtäviä suodattimilla
                        </TableCell>
                      </TableRow>
                    ) : (
                      overdueTasks.map((task) => (
                        <TableRow key={task.task_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-gray-600">
                                {task.overdue_type.replace(/_/g, ' ')} • {task.budget && `${task.budget}€`}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(task.status)}</TableCell>
                          <TableCell>{getPriorityBadge(task.priority_level)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium text-red-600">
                                {task.overdue_hours}h myöhässä
                              </div>
                              <div className="text-gray-500">
                                Taso {task.escalation_level}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>👤 {task.user_name}</div>
                              {task.tasker_name && <div>🔧 {task.tasker_name}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setIsActionDialogOpen(true);
                                }}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Toimenpide
                              </Button>
                              {task.auto_action_eligible && (
                                <Badge variant="destructive" className="text-xs">
                                  Auto
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          {/* Recent Escalation Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Viimeaikaiset Eskalointitoimenpiteet</CardTitle>
              <CardDescription>
                Automaattiset ja manuaaliset toimenpiteet myöhässä oleville tehtäville
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {escalationActions.slice(0, 20).map((action) => (
                  <div key={action.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{action.task_title}</h4>
                        <p className="text-sm text-gray-600">
                          {action.action_description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>👤 {action.user_name}</span>
                          {action.tasker_name && <span>🔧 {action.tasker_name}</span>}
                          <span>📅 {formatDate(action.scheduled_at)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={action.action_status === 'completed' ? 'default' : 'outline'}
                          className="mb-2"
                        >
                          {action.action_status}
                        </Badge>
                        <div className="text-sm text-gray-500">
                          Taso {action.escalation_level}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tehtävälle Toimenpide</DialogTitle>
            <DialogDescription>
              {selectedTask && (
                <>
                  <strong>{selectedTask.title}</strong><br />
                  Myöhässä: {selectedTask.overdue_hours}h • Prioriteetti: {selectedTask.priority_level}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue placeholder="Valitse toimenpide" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resolve">Merkitse valmistuneeksi</SelectItem>
                <SelectItem value="escalate">Korota eskalointitasoa</SelectItem>
                <SelectItem value="refund">Käynnistä hyvitysprosessi</SelectItem>
                <SelectItem value="contact">Ota yhteyttä osapuoliin</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Toimenpiteen kuvaus tai muistiinpanot..."
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsActionDialogOpen(false)}
            >
              Peruuta
            </Button>
            <Button
              onClick={handleTaskAction}
              disabled={!actionType || isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Suorita Toimenpide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
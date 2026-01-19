'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle2,
  Clock, 
  CreditCard, 
  Mail, 
  Play, 
  RefreshCw, 
  Shield, 
  TrendingUp,
  User,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface OverdueTask {
  task_id: string;
  title: string;
  status: string;
  scheduled_date: string | null;
  scheduled_time_slot: string | null;
  user_id: string;
  user_name: string;
  user_email: string;
  assigned_tasker_id: string | null;
  tasker_name: string | null;
  tasker_email: string | null;
  overdue_type: string;
  overdue_hours: number;
  priority_level: string;
  created_at: string;
  budget: number | null;
}

interface OverdueStats {
  total_overdue: number;
  critical_overdue: number;
  high_priority_overdue: number;
  payment_completion_overdue: number;
  task_completion_overdue: number;
  start_overdue: number;
  response_overdue: number;
  review_overdue: number;
  scheduling_overdue: number;
  total_overdue_value: number;
  avg_overdue_hours: number;
}

interface ProcessResult {
  task_id: string;
  action_taken: string;
  previous_status: string;
  new_status: string;
  notification_sent: boolean;
}

export default function OverdueTaskManagement() {
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
  const [overdueStats, setOverdueStats] = useState<OverdueStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gracePeriod, setGracePeriod] = useState<number>(24);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [processResults, setProcessResults] = useState<ProcessResult[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchOverdueData();
    
    // Set up real-time updates
    const tasksChannel = supabase
      .channel('tasks_overdue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Task data changed:', payload);
          fetchOverdueData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
    };
  }, [gracePeriod, priorityFilter, typeFilter]);

  const fetchOverdueData = async () => {
    setIsLoading(true);
    try {
      // Fetch overdue tasks
      const { data: tasksData, error: tasksError } = await supabase
        .rpc('get_overdue_tasks', { 
          grace_period_hours: gracePeriod,
          include_paid_tasks: true 
        });

      if (tasksError) {
        console.error('Error fetching overdue tasks:', tasksError);
      } else {
        let filteredTasks = tasksData || [];
        
        // Apply filters
        if (priorityFilter !== 'all') {
          filteredTasks = filteredTasks.filter((task: OverdueTask) => 
            task.priority_level === priorityFilter
          );
        }
        
        if (typeFilter !== 'all') {
          filteredTasks = filteredTasks.filter((task: OverdueTask) => 
            task.overdue_type === typeFilter
          );
        }
        
        setOverdueTasks(filteredTasks);
      }

      // Fetch overdue statistics
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_overdue_statistics');

      if (statsError) {
        console.error('Error fetching overdue stats:', statsError);
      } else if (statsData && statsData.length > 0) {
        setOverdueStats(statsData[0]);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error in fetchOverdueData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processOverdueTasks = async () => {
    setIsProcessing(true);
    try {
      const { data: processData, error: processError } = await supabase
        .rpc('process_overdue_tasks');

      if (processError) {
        console.error('Error processing overdue tasks:', processError);
        alert('Virhe käsiteltäessä myöhässä olevia tehtäviä');
      } else {
        setProcessResults(processData || []);
        
        // Show success message
        const processedCount = (processData || []).length;
        if (processedCount > 0) {
          alert(`Käsiteltiin ${processedCount} myöhässä olevaa tehtävää`);
        } else {
          alert('Ei myöhässä olevia tehtäviä käsiteltäväksi');
        }
        
        // Refresh data
        await fetchOverdueData();
      }
    } catch (error) {
      console.error('Error processing overdue tasks:', error);
      alert('Virhe käsiteltäessä tehtäviä');
    } finally {
      setIsProcessing(false);
    }
  };

  const sendOverdueNotifications = async () => {
    try {
      const { data: notificationCount, error: notificationError } = await supabase
        .rpc('send_overdue_notifications');

      if (notificationError) {
        console.error('Error sending notifications:', notificationError);
        alert('Virhe lähetettäessä ilmoituksia');
      } else {
        alert(`Lähetettiin ${notificationCount || 0} ilmoitusta`);
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      alert('Virhe lähetettäessä ilmoituksia');
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
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fi-FI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Kriittinen
          </Badge>
        );
      case 'high':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            Korkea
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Keskitaso
          </Badge>
        );
      case 'low':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Matala
          </Badge>
        );
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getOverdueTypeLabel = (type: string) => {
    switch (type) {
      case 'payment_completion_overdue': return 'Maksu suoritettu, odottaa merkitsemistä';
      case 'completion_overdue': return 'Tehtävä myöhässä';
      case 'start_overdue': return 'Aloitus myöhässä';
      case 'response_overdue': return 'Vastaus myöhässä';
      case 'review_overdue': return 'Tarkastus myöhässä';
      case 'scheduling_overdue': return 'Aikataulu myöhässä';
      default: return type;
    }
  };

  const getOverdueTypeIcon = (type: string) => {
    switch (type) {
      case 'payment_completion_overdue': return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'completion_overdue': return <CheckCircle2 className="h-4 w-4 text-orange-600" />;
      case 'start_overdue': return <Play className="h-4 w-4 text-blue-600" />;
      case 'response_overdue': return <Mail className="h-4 w-4 text-purple-600" />;
      case 'review_overdue': return <Shield className="h-4 w-4 text-indigo-600" />;
      case 'scheduling_overdue': return <Calendar className="h-4 w-4 text-gray-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50/50 to-orange-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-red-900">
                  Myöhässä Olevien Tehtävien Hallinta
                </CardTitle>
                <CardDescription className="text-red-700">
                  Seuraa ja käsittele automaattisesti myöhässä olevia tehtäviä
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm text-red-700">
                <div>Viimeksi päivitetty:</div>
                <div className="font-medium">{formatDateTime(lastRefresh.toISOString())}</div>
              </div>
              <Button 
                onClick={fetchOverdueData} 
                disabled={isLoading}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
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
        </CardHeader>
      </Card>

      {/* Statistics */}
      {overdueStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/20"></div>
            <CardHeader className="relative pb-3">
              <CardTitle className="text-sm font-medium text-red-800">
                Yhteensä Myöhässä
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-red-700 mb-1">
                {overdueStats.total_overdue}
              </div>
              <div className="text-sm text-red-600">
                {formatCurrency(overdueStats.total_overdue_value)} arvosta
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/20"></div>
            <CardHeader className="relative pb-3">
              <CardTitle className="text-sm font-medium text-orange-800">
                Kriittiset & Korkeat
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-orange-700 mb-1">
                {overdueStats.critical_overdue + overdueStats.high_priority_overdue}
              </div>
              <div className="text-sm text-orange-600">
                vaatii välitöntä toimintaa
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/20"></div>
            <CardHeader className="relative pb-3">
              <CardTitle className="text-sm font-medium text-blue-800">
                Keskimäärin Myöhässä
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-blue-700 mb-1">
                {Math.round(overdueStats.avg_overdue_hours || 0)}h
              </div>
              <div className="text-sm text-blue-600">
                per tehtävä
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/20"></div>
            <CardHeader className="relative pb-3">
              <CardTitle className="text-sm font-medium text-purple-800">
                Maksu Valmis
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-purple-700 mb-1">
                {overdueStats.payment_completion_overdue}
              </div>
              <div className="text-sm text-purple-600">
                odottaa merkitsemistä valmiiksi
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Yleiskatsaus</TabsTrigger>
          <TabsTrigger value="tasks">Tehtävät</TabsTrigger>
          <TabsTrigger value="actions">Toiminnot</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={processOverdueTasks}
              disabled={isProcessing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Käsittele Automaattisesti
            </Button>
            <Button 
              onClick={sendOverdueNotifications}
              variant="outline"
            >
              <Mail className="h-4 w-4 mr-2" />
              Lähetä Ilmoituksia
            </Button>
          </div>

          {/* Breakdown by Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { type: 'payment_completion_overdue', count: overdueStats?.payment_completion_overdue, label: 'Maksu Valmis' },
              { type: 'completion_overdue', count: overdueStats?.task_completion_overdue, label: 'Suoritus Myöhässä' },
              { type: 'start_overdue', count: overdueStats?.start_overdue, label: 'Aloitus Myöhässä' },
              { type: 'response_overdue', count: overdueStats?.response_overdue, label: 'Vastaus Myöhässä' },
              { type: 'review_overdue', count: overdueStats?.review_overdue, label: 'Tarkastus Myöhässä' },
              { type: 'scheduling_overdue', count: overdueStats?.scheduling_overdue, label: 'Aikataulu Myöhässä' }
            ].map(item => (
              <Card key={item.type} className="cursor-pointer hover:bg-gray-50" onClick={() => {
                setTypeFilter(item.type);
                setActiveTab('tasks');
              }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getOverdueTypeIcon(item.type)}
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-gray-600">{item.count || 0} tehtävää</div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-700">
                      {item.count || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>Myöhässä Olevat Tehtävät</CardTitle>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={gracePeriod.toString()} onValueChange={(value) => setGracePeriod(parseInt(value))}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 tuntia</SelectItem>
                      <SelectItem value="24">24 tuntia</SelectItem>
                      <SelectItem value="48">48 tuntia</SelectItem>
                      <SelectItem value="72">72 tuntia</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Kaikki prioriteetit</SelectItem>
                      <SelectItem value="critical">Kriittinen</SelectItem>
                      <SelectItem value="high">Korkea</SelectItem>
                      <SelectItem value="medium">Keskitaso</SelectItem>
                      <SelectItem value="low">Matala</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Kaikki tyypit</SelectItem>
                      <SelectItem value="payment_completion_overdue">Maksu valmis</SelectItem>
                      <SelectItem value="completion_overdue">Suoritus myöhässä</SelectItem>
                      <SelectItem value="start_overdue">Aloitus myöhässä</SelectItem>
                      <SelectItem value="response_overdue">Vastaus myöhässä</SelectItem>
                      <SelectItem value="review_overdue">Tarkastus myöhässä</SelectItem>
                      <SelectItem value="scheduling_overdue">Aikataulu myöhässä</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {overdueTasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tehtävä</TableHead>
                        <TableHead>Tyyppi</TableHead>
                        <TableHead>Prioriteetti</TableHead>
                        <TableHead>Myöhässä</TableHead>
                        <TableHead>Asiakas</TableHead>
                        <TableHead>Tekijä</TableHead>
                        <TableHead>Budjetti</TableHead>
                        <TableHead>Toiminnot</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueTasks.map((task) => (
                        <TableRow key={task.task_id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">{task.title}</div>
                              <div className="text-sm text-gray-500">
                                {task.status} • {task.scheduled_date && formatDate(task.scheduled_date)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getOverdueTypeIcon(task.overdue_type)}
                              <span className="text-sm">
                                {getOverdueTypeLabel(task.overdue_type)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(task.priority_level)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-red-600">
                              {Math.round(task.overdue_hours)}h
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium">{task.user_name}</div>
                                <div className="text-xs text-gray-500">{task.user_email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.assigned_tasker_id ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="font-medium">{task.tasker_name}</div>
                                  <div className="text-xs text-gray-500">{task.tasker_email}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Ei määritetty</span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(task.budget)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/admin/tasks/${task.task_id}`)}
                            >
                              Näytä
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ei myöhässä olevia tehtäviä
                  </h3>
                  <p className="text-gray-500">
                    Kaikki tehtävät ovat aikataulussa valituilla suodattimilla
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          {/* Process Results */}
          {processResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Viimeisimmät Automaattiset Toiminnot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processResults.map((result, index) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Tehtävä {result.task_id.slice(0, 8)}...</div>
                          <div className="text-sm text-gray-600">
                            {result.previous_status} → {result.new_status}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{result.action_taken}</div>
                          {result.notification_sent && (
                            <div className="text-sm text-green-600">Ilmoitus lähetetty</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Manuaaliset Toiminnot</CardTitle>
              <CardDescription>
                Käytä näitä työkaluja myöhässä olevien tehtävien käsittelyyn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Automaattinen Käsittely</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Käsittelee automaattisesti tehtäviä sääntöjen mukaan (peruutus, hyväksyntä, jne.)
                  </p>
                  <Button 
                    onClick={processOverdueTasks}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Käsittele Automaattisesti
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Ilmoitusten Lähetys</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Lähettää ilmoituksia käyttäjille ja tekijöille myöhässä olevista tehtävistä
                  </p>
                  <Button 
                    onClick={sendOverdueNotifications}
                    variant="outline"
                    className="w-full"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Lähetä Ilmoituksia
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
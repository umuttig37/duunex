'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Calendar, Eye, Filter, Search, Copy } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';

type Task = Database['public']['Tables']['tasks']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface ExtendedTask extends Task {
  profile: Pick<Profile, 'first_name' | 'last_name' | 'email'> | null;
  assigned_tasker_profile: Pick<
    Profile,
    'first_name' | 'last_name' | 'email'
  > | null;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'paid':
      return 'default';
    case 'completed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'open':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    case 'pending_approval':
      return 'secondary';
    default:
      return 'secondary';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Maksettu';
    case 'completed':
      return 'Valmis';
    case 'pending':
      return 'Odottaa';
    case 'open':
      return 'Avoin';
    case 'cancelled':
      return 'Peruttu';
    case 'pending_approval':
      return 'Odottaa hyväksyntää';
    default:
      return status;
  }
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  // Fetch tasks data
  useEffect(() => {
    async function fetchTasks() {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(
            `
            *,
            profile:profiles!tasks_user_id_fkey(first_name, last_name, email),
            assigned_tasker_profile:profiles!tasks_assigned_tasker_id_fkey(first_name, last_name, email)
          `
          )
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching tasks:', error);
          return;
        }

        setTasks(data || []);
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [supabase]);

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;

    const query = searchQuery.toLowerCase();
    return tasks.filter((task) => {
      const customerName = `${(task.profile as any)?.first_name || ''} ${(task.profile as any)?.last_name || ''}`.toLowerCase();
      const customerEmail = ((task.profile as any)?.email || '').toLowerCase();
      const taskerName = task.assigned_tasker_profile 
        ? `${task.assigned_tasker_profile.first_name || ''} ${task.assigned_tasker_profile.last_name || ''}`.toLowerCase()
        : '';
      const taskerEmail = task.assigned_tasker_profile?.email?.toLowerCase() || '';
      
      return (
        task.id.toLowerCase().includes(query) ||
        task.user_id.toLowerCase().includes(query) ||
        (task.assigned_tasker_id && task.assigned_tasker_id.toLowerCase().includes(query)) ||
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        customerName.includes(query) ||
        customerEmail.includes(query) ||
        taskerName.includes(query) ||
        taskerEmail.includes(query) ||
        getStatusText(task.status).toLowerCase().includes(query)
      );
    });
  }, [tasks, searchQuery]);

  const taskStats = {
    total: filteredTasks?.length || 0,
    pending: filteredTasks?.filter((t) => t.status === 'pending').length || 0,
    open: filteredTasks?.filter((t) => t.status === 'open').length || 0,
    paid: filteredTasks?.filter((t) => t.status === 'paid').length || 0,
    completed: filteredTasks?.filter((t) => t.status === 'completed').length || 0,
    pendingApproval:
      filteredTasks?.filter((t) => t.status === 'pending_approval').length || 0,
  };

  // Copy ID to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tehtävät Yhteensä
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Odottaa Hyväksyntää
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {taskStats.pendingApproval}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avoimet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {taskStats.open}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maksetut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600">
              {taskStats.paid}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valmiit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {taskStats.completed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Odottavat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {taskStats.pending}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tehtävien Hallinta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Hae tehtävä ID:llä, käyttäjä ID:llä, nimellä tai sähköpostilla..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-600">
                Näytetään {filteredTasks.length} tulosta haulle "{searchQuery}"
              </p>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
              <p className="mt-2 text-gray-500">Ladataan tehtäviä...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {searchQuery ? 'Ei hakutuloksia.' : 'Ei tehtäviä löytynyt.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Otsikko</TableHead>
                  <TableHead>Asiakas</TableHead>
                  <TableHead>Tasker</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hinta</TableHead>
                  <TableHead>Aikataulu</TableHead>
                  <TableHead>Luotu</TableHead>
                  <TableHead className="text-right">Toiminnot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks?.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {task.id.slice(-8)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(task.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Käyttäjä: 
                        <code className="ml-1 bg-gray-100 px-1 py-0.5 rounded font-mono">
                          {task.user_id.slice(-8)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(task.user_id)}
                          className="h-4 w-4 p-0 ml-1"
                        >
                          <Copy className="h-2 w-2" />
                        </Button>
                      </div>
                      {task.assigned_tasker_id && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Tekijä: 
                          <code className="ml-1 bg-gray-100 px-1 py-0.5 rounded font-mono">
                            {task.assigned_tasker_id.slice(-8)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(task.assigned_tasker_id!)}
                            className="h-4 w-4 p-0 ml-1"
                          >
                            <Copy className="h-2 w-2" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {task.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(task.profile as any)?.first_name}{' '}
                      {(task.profile as any)?.last_name}
                    </TableCell>
                    <TableCell>
                      {task.assigned_tasker_profile
                        ? `${task.assigned_tasker_profile.first_name} ${task.assigned_tasker_profile.last_name}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(task.status)}>
                        {getStatusText(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.budget ? `${task.budget}€` : '-'}
                    </TableCell>
                    <TableCell>
                      {task.scheduled_date
                        ? format(new Date(task.scheduled_date), 'dd.MM.yyyy', {
                            locale: fi,
                          })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {task.created_at
                        ? format(new Date(task.created_at), 'dd.MM.yyyy', {
                            locale: fi,
                          })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/tasks/${task.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Tarkastele
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

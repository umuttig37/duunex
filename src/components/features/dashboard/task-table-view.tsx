'use client';

import { DashboardTask } from '@/app/dashboard/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import {
    AlertTriangle,
    ArrowUpDown,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Clock,
    Euro,
    Eye,
    FileText,
    MapPin,
    MessageSquare,
    MoreHorizontal,
    Wrench,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface TaskTableViewProps {
  tasks: DashboardTask[];
  currentUserId: string;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

interface TaskRowProps {
  task: DashboardTask;
  currentUserId: string;
  isSelected?: boolean;
  onSelect?: (taskId: string, selected: boolean) => void;
}

const getStatusConfig = (status: string) => {
  const statusMap: {
    [key: string]: {
      text: string;
      icon: React.ElementType;
      color: string;
      bgColor: string;
    };
  } = {
    open: { 
      text: 'Avoin', 
      icon: Eye, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50' 
    },
    pending_approval: {
      text: 'Odottaa hyväksyntää',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    paid: { 
      text: 'Työn alla', 
      icon: Wrench, 
      color: 'text-green-600', 
      bgColor: 'bg-green-50' 
    },
    in_progress: { 
      text: 'Työn alla', 
      icon: Wrench, 
      color: 'text-green-600', 
      bgColor: 'bg-green-50' 
    },
    early_completed: {
      text: 'Odottaa vahvistusta',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    completed: {
      text: 'Valmis',
      icon: CheckCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    cancelled: {
      text: 'Peruttu',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    disputed: {
      text: 'Riitautettu',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    rejected: {
      text: 'Hylätty',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    assigned: { 
      text: 'Määritetty', 
      icon: Wrench, 
      color: 'text-green-600', 
      bgColor: 'bg-green-50' 
    },
    awaiting_payment: { 
      text: 'Odottaa maksua', 
      icon: Euro, 
      color: 'text-amber-600', 
      bgColor: 'bg-amber-50' 
    },
    request_sent: { 
      text: 'Pyyntö lähetetty', 
      icon: MessageSquare, 
      color: 'text-amber-600', 
      bgColor: 'bg-amber-50' 
    },
  };

  return statusMap[status] || {
    text: status,
    icon: Eye,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  };
};

const TaskRow: React.FC<TaskRowProps> = ({ 
  task, 
  currentUserId, 
  isSelected = false, 
  onSelect 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = getStatusConfig(task.status);
  const displayPrice = task.accepted_offer?.offered_price ?? task.budget;

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on links, buttons, or checkboxes
    const target = e.target as HTMLElement;
    if (target.closest('a, button, input[type="checkbox"]')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <TableRow 
        className="cursor-pointer hover:bg-gray-50/50 transition-colors group"
        onClick={handleRowClick}
      >
        <TableCell className="w-12">
          <div className="flex items-center">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => 
                onSelect?.(task.id, checked as boolean)
              }
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-6 w-6 p-0 opacity-60 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </TableCell>
        
        <TableCell>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full ${statusConfig.bgColor}`}>
              <statusConfig.icon className={`h-3 w-3 ${statusConfig.color}`} />
            </div>
            <span className={`text-xs font-medium ${statusConfig.color}`}>
              {statusConfig.text}
            </span>
            {task.status === 'open' && (
              <Badge 
                variant="outline" 
                className="bg-green-50 text-green-700 border-green-300 text-xs"
              >
                Aktiivinen
              </Badge>
            )}
          </div>
        </TableCell>

        <TableCell className="max-w-0 w-full">
          <div className="flex flex-col space-y-1">
            <Link
              href={`/dashboard/tasks/${task.id}`}
              className="font-semibold text-sm hover:text-blue-600 transition-colors truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {task.title}
            </Link>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {task.description}
            </p>
            {task.categories && (
              <span className="text-xs text-blue-600 font-medium">
                {task.categories.name_fi}
              </span>
            )}
          </div>
        </TableCell>

        <TableCell className="text-sm">
          {task.scheduled_date ? (
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(task.scheduled_date), 'dd.MM.', { locale: fi })}
              </span>
              {task.scheduled_time_slot && (
                <span className="text-xs text-muted-foreground">
                  {task.scheduled_time_slot}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Ei ajoitettu</span>
          )}
        </TableCell>

        <TableCell className="text-sm">
          {displayPrice ? (
            <div className="flex items-center gap-1">
              <Euro className="h-3 w-3 text-green-600" />
              <span className="font-semibold text-green-600">
                {displayPrice}€
              </span>
              {task.accepted_offer?.offered_price && 
               task.budget && 
               task.budget !== displayPrice && (
                <span className="ml-1 line-through text-xs text-muted-foreground">
                  {task.budget}€
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Ei budjettia</span>
          )}
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-blue-500" />
              <span className="font-medium">{task.offers_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3 text-green-500" />
              <span className="font-medium">{(task as any).message_count || 0}</span>
            </div>
          </div>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-1">
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/tasks/${task.id}`}>
                Avaa
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded Row Content */}
      {isExpanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={7} className="p-0">
            <div className="bg-gray-50/30 border-t px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Task Details */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-900">
                    Tehtävän tiedot
                  </h4>
                  {task.description && (
                    <p className="text-sm text-gray-600">{task.description}</p>
                  )}
                  {task.location_text && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{task.location_text}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Luotu: {format(new Date(task.created_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                  </div>
                </div>

                {/* Task Image */}
                {task.task_attachments && task.task_attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-900">
                      Kuva
                    </h4>
                    <div className="relative h-32 w-48 overflow-hidden rounded-md border">
                      <Image
                        src={task.task_attachments[0].file_url}
                        alt={`${task.title} kuva`}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button asChild size="sm">
                  <Link href={`/dashboard/tasks/${task.id}`}>
                    Näytä yksityiskohdat
                  </Link>
                </Button>
                {(task.offers_count || 0) > 0 && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/tasks/${task.id}#offers`}>
                      Tarkastele tarjouksia ({task.offers_count || 0})
                    </Link>
                  </Button>
                )}
                {(task as any).message_count > 0 && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/messages?taskId=${task.id}`}>
                      Avaa viestit ({(task as any).message_count})
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  currentUserId,
  onSort,
  sortColumn,
  sortDirection,
}) => {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(tasks.map(task => task.id)));
    } else {
      setSelectedTasks(new Set());
    }
    setSelectAll(checked);
  };

  const handleSelectTask = (taskId: string, selected: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (selected) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
    setSelectAll(newSelected.size === tasks.length);
  };

  const handleSort = (column: string) => {
    const direction = 
      sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort?.(column, direction);
  };

  const SortableHeader = ({ 
    column, 
    children 
  }: { 
    column: string; 
    children: React.ReactNode; 
  }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 font-semibold hover:bg-transparent"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </Button>
  );

  if (tasks.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Ei tehtäviä näytettäväksi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedTasks.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">
            {selectedTasks.size} tehtävää valittu
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              Massatoiminto
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => {
                setSelectedTasks(new Set());
                setSelectAll(false);
              }}
            >
              Peruuta valinta
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>
                <SortableHeader column="status">Tila</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="title">Tehtävä</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="scheduled_date">Aikataulu</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="budget">Budjetti</SortableHeader>
              </TableHead>
              <TableHead>Aktiviteetti</TableHead>
              <TableHead>Toiminnot</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                currentUserId={currentUserId}
                isSelected={selectedTasks.has(task.id)}
                onSelect={handleSelectTask}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TaskTableView;

'use client';

import { DashboardTask } from '@/app/dashboard/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import {
    AlertTriangle,
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

interface TaskMobileViewProps {
  tasks: DashboardTask[];
  currentUserId: string;
  selectedTasks?: Set<string>;
  onSelectTask?: (taskId: string, selected: boolean) => void;
}

interface TaskMobileCardProps {
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

const TaskMobileCard: React.FC<TaskMobileCardProps> = ({ 
  task, 
  currentUserId, 
  isSelected = false, 
  onSelect 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = getStatusConfig(task.status);
  const displayPrice = task.accepted_offer?.offered_price ?? task.budget;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="p-4 space-y-3">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => 
                    onSelect?.(task.id, checked as boolean)
                  }
                />
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`p-1.5 rounded-full ${statusConfig.bgColor} flex-shrink-0`}>
                    <statusConfig.icon className={`h-3 w-3 ${statusConfig.color}`} />
                  </div>
                  <span className={`text-xs font-medium ${statusConfig.color}`}>
                    {statusConfig.text}
                  </span>
                  {task.status === 'open' && (
                    <Badge 
                      variant="outline" 
                      className="bg-green-50 text-green-700 border-green-300 text-xs flex-shrink-0"
                    >
                      Aktiivinen
                    </Badge>
                  )}
                </div>
              </div>
              <CollapsibleTrigger className="flex items-center gap-1 flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </CollapsibleTrigger>
            </div>

            {/* Task Title */}
            <div className="space-y-1">
              <Link
                href={`/dashboard/tasks/${task.id}`}
                className="font-semibold text-sm hover:text-blue-600 transition-colors block"
              >
                {task.title}
              </Link>
              {task.categories && (
                <span className="text-xs text-blue-600 font-medium">
                  {task.categories.name_fi}
                </span>
              )}
            </div>

            {/* Quick Info Row */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-blue-500" />
                  <span>{task.offers_count || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3 text-green-500" />
                  <span>{(task as any).message_count || 0}</span>
                </div>
              </div>
              {displayPrice && (
                <div className="flex items-center gap-1">
                  <Euro className="h-3 w-3 text-green-600" />
                  <span className="font-semibold text-green-600">
                    {displayPrice}€
                  </span>
                </div>
              )}
            </div>

            {/* Schedule Info */}
            {task.scheduled_date && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(task.scheduled_date), 'dd.MM.yyyy', { locale: fi })}
                  {task.scheduled_time_slot && `, ${task.scheduled_time_slot}`}
                </span>
              </div>
            )}
          </div>

          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t bg-gray-50/30">
              {/* Description */}
              {task.description && (
                <div>
                  <h4 className="font-medium text-sm text-gray-900 mb-1">
                    Kuvaus
                  </h4>
                  <p className="text-sm text-gray-600">{task.description}</p>
                </div>
              )}

              {/* Location */}
              {task.location_text && (
                <div>
                  <h4 className="font-medium text-sm text-gray-900 mb-1">
                    Sijainti
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{task.location_text}</span>
                  </div>
                </div>
              )}

              {/* Task Image */}
              {task.task_attachments && task.task_attachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-900 mb-2">
                    Kuva
                  </h4>
                  <div className="relative h-32 w-full overflow-hidden rounded-md border">
                    <Image
                      src={task.task_attachments[0].file_url}
                      alt={`${task.title} kuva`}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
              )}

              {/* Pricing Details */}
              {(displayPrice || task.budget) && (
                <div>
                  <h4 className="font-medium text-sm text-gray-900 mb-1">
                    Hinta
                  </h4>
                  <div className="space-y-1">
                    {displayPrice && (
                      <div className="flex items-center gap-1 text-sm">
                        <Euro className="h-3 w-3 text-green-600" />
                        <span className="font-semibold text-green-600">
                          {displayPrice}€
                        </span>
                        {task.accepted_offer?.offered_price && (
                          <span className="text-xs text-muted-foreground">
                            (hyväksytty tarjous)
                          </span>
                        )}
                      </div>
                    )}
                    {task.accepted_offer?.offered_price && 
                     task.budget && 
                     task.budget !== displayPrice && (
                      <div className="text-xs text-muted-foreground">
                        Alkuperäinen budjetti: {task.budget}€
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="text-xs text-muted-foreground border-t pt-2">
                Luotu: {format(new Date(task.created_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <Button asChild size="sm" className="w-full">
                  <Link href={`/dashboard/tasks/${task.id}`}>
                    Näytä yksityiskohdat
                  </Link>
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  {(task.offers_count || 0) > 0 && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/tasks/${task.id}#offers`}>
                        Tarjoukset ({task.offers_count || 0})
                      </Link>
                    </Button>
                  )}
                  {(task as any).message_count > 0 && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/messages?taskId=${task.id}`}>
                        Viestit ({(task as any).message_count})
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <MoreHorizontal className="h-4 w-4" />
                    Lisää
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

const TaskMobileView: React.FC<TaskMobileViewProps> = ({
  tasks,
  currentUserId,
  selectedTasks = new Set(),
  onSelectTask,
}) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ei tehtäviä näytettäväksi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskMobileCard
          key={task.id}
          task={task}
          currentUserId={currentUserId}
          isSelected={selectedTasks.has(task.id)}
          onSelect={onSelectTask}
        />
      ))}
    </div>
  );
};

export default TaskMobileView;

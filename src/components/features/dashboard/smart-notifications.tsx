'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Euro,
  MessageSquare,
  Users,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export interface SmartNotification {
  id: string;
  type: 'offer' | 'payment' | 'message' | 'task_update' | 'dispute' | 'confirmation' | 'reminder';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  actionBadgeText?: string;
  timestamp: string;
  data?: {
    taskId?: string;
    amount?: number;
    count?: number;
    [key: string]: any;
  };
  dismissible?: boolean;
}

interface SmartNotificationsProps {
  notifications: SmartNotification[];
  onDismiss?: (id: string) => void;
  className?: string;
  compact?: boolean;
}

const notificationIcons = {
  offer: Users,
  payment: CreditCard,
  message: MessageSquare,
  task_update: Calendar,
  dispute: AlertTriangle,
  confirmation: CheckCircle,
  reminder: Bell
};

const priorityStyles = {
  high: 'border-red-200 bg-red-50/50 hover:bg-red-50',
  medium: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50',
  low: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'
};

const iconStyles = {
  high: 'text-red-600',
  medium: 'text-amber-600',
  low: 'text-blue-600'
};

export default function SmartNotifications({
  notifications,
  onDismiss,
  className,
  compact = false
}: SmartNotificationsProps) {
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  const handleDismiss = (id: string) => {
    setDismissedNotifications(prev => new Set(prev).add(id));
    onDismiss?.(id);
  };

  const visibleNotifications = notifications.filter(n => !dismissedNotifications.has(n.id));

  if (visibleNotifications.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {visibleNotifications.map((notification) => {
        const Icon = notificationIcons[notification.type];
        const isCompactView = compact && visibleNotifications.length > 3;

        return (
          <Card
            key={notification.id}
            className={cn(
              "transition-all duration-200 border shadow-sm hover:shadow-md",
              priorityStyles[notification.priority],
              isCompactView && "hover:scale-[1.01]"
            )}
          >
            <CardContent className={cn("p-3", isCompactView && "py-2")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "p-1.5 rounded-md flex-shrink-0",
                    notification.priority === 'high' ? 'bg-red-100' :
                      notification.priority === 'medium' ? 'bg-amber-100' : 'bg-blue-100',
                    isCompactView && "p-1"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      iconStyles[notification.priority],
                      isCompactView && "h-3 w-3"
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        "font-medium text-gray-900 truncate",
                        isCompactView ? "text-sm" : "text-base"
                      )}>
                        {notification.title}
                      </h4>
                      {notification.data?.count && notification.data.count > 1 && (
                        <Badge variant="secondary" className={cn(
                          "text-xs",
                          isCompactView && "px-1.5 py-0.5 text-[10px]"
                        )}>
                          {notification.data.count}
                        </Badge>
                      )}
                    </div>

                    {!isCompactView && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                    )}

                    <div className={cn(
                      "flex items-center gap-2 text-xs text-gray-500",
                      isCompactView && "text-[11px]"
                    )}>
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(notification.timestamp)}</span>
                      {notification.data?.amount && (
                        <>
                          <span>•</span>
                          <Euro className="h-3 w-3" />
                          <span>{formatCurrency(notification.data.amount)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {notification.actionUrl && (
                    <Button
                      asChild
                      size={isCompactView ? "xs" : "sm"}
                      variant="outline"
                      className={cn(
                        "text-xs",
                        isCompactView && "h-7 px-2 text-[11px]"
                      )}
                    >
                      <Link href={notification.actionUrl}>
                        {notification.actionText || 'Näytä'}
                      </Link>
                    </Button>
                  )}

                  {notification.dismissible && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-6 w-6 p-0 text-gray-400 hover:text-gray-600",
                        isCompactView && "h-5 w-5"
                      )}
                      onClick={() => handleDismiss(notification.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Nyt';
  if (diffInMinutes < 60) return `${diffInMinutes} min sitten`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} t sitten`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Eilen';
  if (diffInDays < 7) return `${diffInDays} pv sitten`;

  return date.toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'short'
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
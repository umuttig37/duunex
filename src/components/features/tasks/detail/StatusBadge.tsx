import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type TaskStatus = 'open' | 'paid' | 'in_progress' | 'completed' | 'early_completed' | 'cancelled' | 'request_sent' | 'request_declined' | 'assigned' | 'awaiting_payment' | 'disputed';

interface StatusMeta {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}

const getTaskStatusMeta = (status: string): StatusMeta => {
  const statusMap: Record<TaskStatus, StatusMeta> = {
    open: {
      label: 'Avoin',
      variant: 'default',
      className: 'bg-green-500 hover:bg-green-600 text-white border-green-500'
    },
    request_sent: {
      label: 'Pyyntö lähetetty',
      variant: 'default',
      className: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
    },
    request_declined: {
      label: 'Pyyntö hylätty',
      variant: 'secondary',
      className: 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500'
    },
    assigned: {
      label: 'Määritetty',
      variant: 'default',
      className: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500'
    },
    awaiting_payment: {
      label: 'Odottaa maksua',
      variant: 'default',
      className: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
    },
    paid: {
      label: 'Maksettu',
      variant: 'default',
      className: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
    },
    in_progress: {
      label: 'Työn alla',
      variant: 'default',
      className: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500'
    },
    completed: {
      label: 'Valmis',
      variant: 'default',
      className: 'bg-primary hover:bg-primary text-white border-emerald-500'
    },
    early_completed: {
      label: 'Valmis (aikainen)',
      variant: 'default',
      className: 'bg-primary hover:bg-primary/90 text-white border-emerald-600'
    },
    cancelled: {
      label: 'Peruutettu',
      variant: 'destructive',
      className: 'bg-red-500 hover:bg-red-600 text-white border-red-500'
    },
    disputed: {
      label: 'Kiistanalainen',
      variant: 'destructive',
      className: 'bg-red-600 hover:bg-red-700 text-white border-red-600'
    }
  };

  return statusMap[status as TaskStatus] || {
    label: status || 'Ei tietoa',
    variant: 'secondary',
    className: 'bg-gray-400 hover:bg-gray-500 text-white border-gray-400'
  };
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export default function StatusBadge({ status, className, size = 'default' }: StatusBadgeProps) {
  const statusMeta = getTaskStatusMeta(status);
  
  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    default: 'text-sm py-1 px-3',
    lg: 'text-base py-2 px-4'
  };

  return (
    <Badge
      variant={statusMeta.variant}
      className={cn(
        statusMeta.className,
        sizeClasses[size],
        'font-medium',
        className
      )}
    >
      {statusMeta.label}
    </Badge>
  );
}

export { getTaskStatusMeta };
export type { TaskStatus, StatusMeta };
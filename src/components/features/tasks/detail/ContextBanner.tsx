'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Info,
  Star,
  Zap
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type BannerType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'early_completion'
  | 'payment_info'
  | 'guidance';

interface ContextBannerProps {
  type: BannerType;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

const getBannerConfig = (type: BannerType) => {
  const configs = {
    info: {
      icon: Info,
      className: 'border-blue-200 bg-blue-50',
      iconClassName: 'text-blue-600',
      titleClassName: 'text-blue-800',
      descriptionClassName: 'text-blue-700'
    },
    success: {
      icon: CheckCircle,
      className: 'border-primary/20 bg-primary/5',
      iconClassName: 'text-primary',
      titleClassName: 'text-primary',
      descriptionClassName: 'text-primary'
    },
    warning: {
      icon: AlertCircle,
      className: 'border-amber-200 bg-amber-50',
      iconClassName: 'text-amber-600',
      titleClassName: 'text-amber-800',
      descriptionClassName: 'text-amber-700'
    },
    error: {
      icon: AlertCircle,
      className: 'border-red-200 bg-red-50',
      iconClassName: 'text-red-600',
      titleClassName: 'text-red-800',
      descriptionClassName: 'text-red-700'
    },
    early_completion: {
      icon: Clock,
      className: 'border-indigo-200 bg-indigo-50',
      iconClassName: 'text-indigo-600',
      titleClassName: 'text-indigo-800',
      descriptionClassName: 'text-indigo-700'
    },
    payment_info: {
      icon: Zap,
      className: 'border-primary/20 bg-gradient-to-r from-sky-50 to-blue-50',
      iconClassName: 'text-primary',
      titleClassName: 'text-slate-800',
      descriptionClassName: 'text-slate-700'
    },
    guidance: {
      icon: Star,
      className: 'border-slate-200 bg-slate-50',
      iconClassName: 'text-slate-600',
      titleClassName: 'text-slate-800',
      descriptionClassName: 'text-slate-600'
    }
  };

  return configs[type];
};

export default function ContextBanner({ 
  type, 
  title, 
  description, 
  className,
  children 
}: ContextBannerProps) {
  const config = getBannerConfig(type);
  const Icon = config.icon;

  return (
    <Alert className={cn(config.className, 'border-l-4', className)}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            type === 'payment_info' ? 'bg-primary/10' : 'bg-white'
          )}>
            <Icon className={cn('h-4 w-4', config.iconClassName)} />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <AlertTitle className={cn('text-sm font-semibold mb-1', config.titleClassName)}>
            {title}
          </AlertTitle>
          <AlertDescription className={cn('text-sm leading-relaxed', config.descriptionClassName)}>
            {description}
          </AlertDescription>
          
          {children && (
            <div className="mt-3">
              {children}
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}

// Predefined banner variants for common use cases
export const EarlyCompletionBanner = ({ 
  scheduledDate, 
  requestedAt,
  deadlineHours = 72,
  children 
}: { 
  scheduledDate?: string;
  requestedAt?: string;
  deadlineHours?: number;
  children?: React.ReactNode;
}) => {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const { remainingMs, deadlineIso } = useMemo(() => {
    if (!requestedAt) {
      return { remainingMs: undefined as number | undefined, deadlineIso: undefined as string | undefined };
    }
    const startMs = new Date(requestedAt).getTime();
    const deadline = startMs + deadlineHours * 60 * 60 * 1000;
    return { remainingMs: Math.max(0, deadline - now), deadlineIso: new Date(deadline).toISOString() };
  }, [requestedAt, deadlineHours, now]);

  const formatRemaining = (ms?: number) => {
    if (ms == null) return undefined;
    const totalMinutes = Math.floor(ms / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} pv`);
    parts.push(`${hours} h`, `${minutes} min`);
    return parts.join(' ');
  };

  const description = `Tekijä on merkinnyt tehtävän valmiiksi ennen aikataulutettua päivämäärää${
    scheduledDate ? ` (${new Date(scheduledDate).toLocaleDateString('fi-FI')})` : ''
  }. Vahvista, että tämä on hyväksyttävää.`;

  const countdownUi = remainingMs != null ? (
    <div className="text-xs text-indigo-800/80">
      <div>
        Aikaa jäljellä: <span className="font-semibold">{formatRemaining(remainingMs)}</span>
      </div>
      {deadlineIso && (
        <div>
          Määräaika: {new Date(deadlineIso).toLocaleString('fi-FI')}
        </div>
      )}
    </div>
  ) : null;

  return (
    <ContextBanner
      type="early_completion"
      title="Aikainen valmistuminen odottaa vahvistusta"
      description={description}
    >
      {countdownUi}
      {children}
    </ContextBanner>
  );
};

export const TaskerEarningsBanner = ({ amount }: { amount: number }) => (
  <ContextBanner
    type="payment_info"
    title="💰 Ansaitsemasi summa"
    description={`${amount} € lisätään saldoosi, kun sekä sinä että asiakas vahvistatte tehtävän valmistumisen.`}
  />
);

export const GuidanceBanner = ({ message }: { message: string }) => (
  <ContextBanner
    type="guidance"
    title="Ohje"
    description={message}
  />
);
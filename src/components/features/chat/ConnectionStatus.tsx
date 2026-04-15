'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected';
  className?: string;
  onRetry?: () => void;
}

export function ConnectionStatus({ status, className = '', onRetry }: ConnectionStatusProps) {
  if (status === 'connected') {
    return (
      <Badge variant="secondary" className="bg-sky-100 text-sky-800 border-sky-200">
        <Wifi className="h-3 w-3 mr-1" />
        Yhdistetty
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {status === 'connecting' && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Yhdistetään...
        </Badge>
      )}

      {status === 'disconnected' && (
        <>
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <WifiOff className="h-3 w-3 mr-1" />
            Yhteys katkennut
          </Badge>
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-6 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Yritä uudelleen
            </Button>
          )}
        </>
      )}
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Euro, Info } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface PricePanelProps {
  finalPrice?: number;
  originalBudget?: number;
  hasAcceptedOffer: boolean;
  status: string;
  children?: React.ReactNode; // For CTAs and additional content
}

export default function PricePanel({ 
  finalPrice, 
  originalBudget, 
  hasAcceptedOffer, 
  status,
  children 
}: PricePanelProps) {
  const displayPrice = finalPrice || originalBudget;
  const showOriginalBudget = hasAcceptedOffer && originalBudget && finalPrice !== originalBudget;

  return (
    <Card className="shadow-lg border-slate-200 sticky top-8">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-slate-800 flex items-center">
          <Euro className="h-5 w-5 mr-2 text-emerald-600" />
          Hinta
        </CardTitle>
        
        <div className="space-y-2">
          <div className="text-3xl lg:text-4xl font-bold text-emerald-600">
            {displayPrice ? `${displayPrice} €` : 'Ei budjettia'}
          </div>
          
          {hasAcceptedOffer && finalPrice && (
            <p className="text-sm font-medium text-emerald-600">
              Sovittu hinta
            </p>
          )}
          
          {!hasAcceptedOffer && originalBudget && (
            <p className="text-sm text-slate-500">
              Arvioitu budjetti
            </p>
          )}
          
          {showOriginalBudget && (
            <p className="text-xs text-slate-400">
              Alkuperäinen budjetti: {originalBudget} €
            </p>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          <Info className="h-4 w-4 text-slate-500" />
          <span className="text-sm text-slate-600">Tila:</span>
          <StatusBadge status={status} />
        </div>

        {/* CTAs and additional content */}
        {children && (
          <div className="pt-2 space-y-3">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
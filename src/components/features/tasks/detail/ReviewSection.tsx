import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface ReviewSectionProps {
  taskId: string;
  status: string;
  children?: React.ReactNode;
}

export default function ReviewSection({ taskId, status, children }: ReviewSectionProps) {
  // Only show review section when task is completed
  if (status !== 'completed' && status !== 'early_completed') {
    return null;
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-slate-800 flex items-center">
          <Star className="h-5 w-5 mr-2 text-amber-500" />
          Arvostelu
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}
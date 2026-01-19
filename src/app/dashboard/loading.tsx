import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
      <h1 className="text-2xl font-semibold text-foreground mb-2">Ladataan työpöytää...</h1>
      <p className="text-muted-foreground">Ole hyvä ja odota hetki.</p>
    </div>
  );
} 
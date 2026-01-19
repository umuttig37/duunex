import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Clock, MapPin } from 'lucide-react';

interface OverviewProps {
  description: string;
  locationText?: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Ei määritelty';
  return new Date(dateString).toLocaleDateString('fi-FI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTimeSlot = (timeSlot: string | null) => {
  if (!timeSlot) return 'Ei määritelty';
  const slots: { [key: string]: string } = {
    morning: 'Aamupäivä (klo 8-12)',
    afternoon: 'Iltapäivä (klo 12-16)',
    evening: 'Ilta (klo 16-20)',
    flexible: 'Joustava',
  };
  return slots[timeSlot] || timeSlot;
};

export default function Overview({ 
  description, 
  locationText, 
  scheduledDate, 
  scheduledTimeSlot 
}: OverviewProps) {
  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Kuvaus
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Description */}
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {description || 'Ei kuvausta saatavilla.'}
          </p>
        </div>

        {/* Location - Only show if available */}
        {locationText && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">Sijainti:</span>
              <span className="text-gray-600">{locationText}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
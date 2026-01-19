import ModernTaskBookingWrapper from '@/components/features/tasks/booking/modern-task-booking-wrapper';
import { Suspense } from 'react';

// Simple page component - all URL parameter handling is now done in ModernTaskBookingWrapper
export default function NewTaskPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Ladataan...</p>
          </div>
        </div>
      }
    >
      <ModernTaskBookingWrapper />
    </Suspense>
  );
}

'use client';

import { format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';
import { fi } from 'date-fns/locale';

interface DateDividerProps {
  date: Date;
}

export function DateDivider({ date }: DateDividerProps) {
  const getDateLabel = (date: Date): string => {
    if (isToday(date)) {
      return 'Tänään';
    }
    
    if (isYesterday(date)) {
      return 'Eilen';
    }
    
    if (isThisWeek(date)) {
      return format(date, 'EEEE', { locale: fi });
    }
    
    if (isThisYear(date)) {
      return format(date, 'd. MMMM', { locale: fi });
    }
    
    return format(date, 'd.M.yyyy', { locale: fi });
  };

  return (
    <div className="flex items-center justify-center py-4 my-2">
      <div className="flex items-center">
        <div className="flex-1 h-px bg-gray-200"></div>
        <div className="px-4 py-1 bg-gray-100 rounded-full">
          <span className="text-xs font-medium text-gray-600">
            {getDateLabel(date)}
          </span>
        </div>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>
    </div>
  );
}
'use client';

import type { HeroCategoryData } from '@/constants/hero-categories';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: HeroCategoryData;
  isActive: boolean;
  onClick: (category: HeroCategoryData) => void;
  className?: string;
}

export function CategoryBadge({ category, isActive, onClick, className }: CategoryBadgeProps) {
  const Icon = category.icon;
  
  return (
    <button
      onClick={() => onClick(category)}
      className={cn(
        "flex flex-col items-center justify-center p-2 min-h-[80px] min-w-[75px] sm:min-h-[90px] sm:min-w-[90px]",
        "bg-white border-gray-200 touch-manipulation flex-shrink-0",
        "sm:w-full", // Full width on larger screens when in grid
        className
      )}
      aria-label={category.name_fi}
    >
      {/* Icon */}
      <div className={cn(
        "flex items-center hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 justify-center w-12 h-12 sm:w-16 sm:h-14 lg:w-20 lg:h-16 rounded-lg mb-1 sm:mb-2",
        isActive 
          ? "bg-emerald-500 text-white" 
          : "text-gray-600"
      )}>
        <Icon className="w-6 h-6 sm:w-8 sm:h-8 lg:w-8 lg:h-12" />
      </div>
      
      {/* Label */}
      <span className={cn(
        "text-xs sm:text-sm lg:text-md font-semibold text-center leading-tight px-1",
        isActive 
          ? "text-emerald-700" 
          : "text-gray-700"
      )}>
        {category.name_fi}
      </span>
    </button>
  );
}
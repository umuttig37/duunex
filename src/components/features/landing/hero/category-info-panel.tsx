'use client';

import type { HeroCategoryData } from '@/constants/hero-categories';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface CategoryInfoPanelProps {
  category: HeroCategoryData | null;
  className?: string;
}

export function CategoryInfoPanel({ category, className }: CategoryInfoPanelProps) {
  if (!category) {
    return (
      <div className={cn(
        "relative rounded-2xl sm:rounded-3xl overflow-hidden h-[300px] sm:h-[380px] md:h-[440px] lg:h-[560px] bg-gray-100",
        className
      )}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <p className="text-lg">Valitse kategoria</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-2xl sm:rounded-3xl overflow-hidden h-[320px] sm:h-[420px] md:h-[520px] lg:h-[650px] transition-all duration-300",
        className
      )}
    >
      {/* Large background image */}
      <Image
        src={category.heroImage}
        alt={`${category.name_fi} palvelut`}
        fill
        className="object-cover"
        priority={false}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 70vw"
      />
      
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-transparent md:bg-gradient-to-br">
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-6 sm:right-6 md:top-8 md:bottom-auto md:left-10 md:right-auto md:max-w-xl">
          <div className="bg-white/95 backdrop-blur-xl border border-white/80 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-7 lg:p-8 backdrop-saturate-150">
            {/* Enhanced trending badge */}
            {category.trending && (
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[10px] sm:text-xs font-semibold rounded-full mb-2 sm:mb-4 shadow-sm">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full opacity-90"></div>
                {category.trending}
              </div>
            )}
            
            {/* Enhanced category title */}
            <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4 leading-tight">{category.name_fi}</h2>
            
            {/* Enhanced description */}
            <p className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-5 font-medium">
              {category.description}
            </p>
            
            {/* Enhanced benefits with modern styling */}
            <div className="space-y-2 sm:space-y-3">
              {category.benefits.slice(0, 3).map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-[15px] md:text-base">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex-shrink-0 shadow-sm"></div>
                  <span className="text-gray-800 font-medium leading-tight">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
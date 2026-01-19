'use client';

import type { HeroCategoryData } from '@/constants/hero-categories';
import { cn } from '@/lib/utils';
import { CategoryBadge } from './category-badge';

interface CategoryBadgeGridProps {
  categories: HeroCategoryData[];
  activeCategory: HeroCategoryData | null;
  onCategorySelect: (category: HeroCategoryData) => void;
  className?: string;
}

export function CategoryBadgeGrid({ 
  categories, 
  activeCategory, 
  onCategorySelect, 
  className 
}: CategoryBadgeGridProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Category navigation */}
      <div className="flex overflow-x-auto gap-2 sm:gap-3 lg:gap-4 sm:grid sm:grid-cols-6 lg:grid-cols-7 sm:overflow-x-visible scrollbar-hide pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map((category) => (
          <CategoryBadge
            key={category.id}
            category={category}
            isActive={activeCategory?.id === category.id}
            onClick={onCategorySelect}
          />
        ))}
      </div>
    </div>
  );
}
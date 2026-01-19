'use client';

import type { HeroCategoryData, HeroTemplateData } from '@/constants/hero-categories';
import { cn } from '@/lib/utils';
import { TemplateBadge } from './template-badge';

interface TemplateBadgeGroupProps {
  category: HeroCategoryData | null;
  onTemplateClick: (template: HeroTemplateData) => void;
  className?: string;
}

export function TemplateBadgeGroup({ category, onTemplateClick, className }: TemplateBadgeGroupProps) {
  if (!category || category.templates.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Simple section title */}
      <h3 className="text-lg font-medium text-gray-900">
        {category.name_fi} palvelut
      </h3>
      
      {/* Template badges: simple grid layout */}
      <div className="flex flex-wrap gap-2">
        {category.templates.slice(0, 6).map((template) => (
          <TemplateBadge
            key={template.id}
            template={template}
            onClick={onTemplateClick}
          />
        ))}
      </div>
    </div>
  );
}
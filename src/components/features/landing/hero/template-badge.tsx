'use client';

import type { HeroTemplateData } from '@/constants/hero-categories';
import { cn } from '@/lib/utils';

interface TemplateBadgeProps {
  template: HeroTemplateData;
  onClick: (template: HeroTemplateData) => void;
  className?: string;
}

export function TemplateBadge({ template, onClick, className }: TemplateBadgeProps) {
  return (
    <button
      onClick={() => onClick(template)}
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-800",
        "focus:outline-none focus:ring-2 focus:ring-emerald-500",
        className
      )}
    >
      {/* Simple popular indicator */}
      {template.isPopular && (
        <span className="text-emerald-600">↗</span>
      )}
      
      {/* Template name */}
      <span>
        {template.name_fi}
      </span>
    </button>
  );
}
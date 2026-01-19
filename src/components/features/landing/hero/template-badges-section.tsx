'use client';

import type { HeroCategoryData, HeroTemplateData } from '@/constants/hero-categories';
import { defaultTemplatesByCategory } from '@/constants/templates';
import { toDbSlug } from '@/lib/category-slug-alias';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface DbTemplate {
  id: string;
  name: string;
  description?: string;
  popularity_score?: number;
  questions?: any[];
  isPopular?: boolean; // Computed from popularity_score
}

interface TemplateBadgesSectionProps {
  category: HeroCategoryData | null;
  onTemplateSelect: (template: HeroTemplateData & { dbId?: string; questions?: any[] }) => void;
  className?: string;
}

export function TemplateBadgesSection({
  category,
  onTemplateSelect,
  className
}: TemplateBadgesSectionProps) {
  const [templates, setTemplates] = useState<DbTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear templates immediately when category changes
    setTemplates([]);

    if (!category) {
      return;
    }

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    console.log(`Loading templates for category: ${category.id} (${category.name_fi})`);
    setLoading(true);

    // Normalize slug to database format before making request
    const dbSlug = toDbSlug(category.id);
    console.log(`Normalized slug: ${category.id} -> ${dbSlug}`);

    fetch(`/api/search-templates?categorySlug=${dbSlug}&limit=6`, {
      signal: abortController.signal
    })
      .then(response => response.json())
      .then(data => {
        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        const dbTemplates = data.results || [];

        // If we have database templates, use them
        if (dbTemplates.length > 0) {
          console.log(`Found ${dbTemplates.length} database templates for ${category.id}:`, dbTemplates.map((t: DbTemplate) => t.name));
          setTemplates(dbTemplates);
        } else {
          // If no database templates found, prefer default-templates fallback by FE slug; fallback to hero constants if not available
          const feSlug = category.id;
          const defaults = defaultTemplatesByCategory[feSlug] || [];
          if (defaults.length > 0) {
            console.log(`No DB templates; using defaultTemplates fallback for ${feSlug} (${defaults.length})`);
            const fallbackTemplates = defaults.slice(0, 6).map(t => ({
              id: t.id,
              name: t.name_fi,
              description: t.description_fi || `${t.name_fi} - ${category.name_fi}`,
              popularity_score: t.popularity_score ?? 60,
              questions: Array.isArray(t.questions) ? t.questions : []
            }));
            setTemplates(fallbackTemplates);
          } else {
            console.log(`No DB templates and no defaultTemplates for ${feSlug}; using hero constants (${category.templates.length})`);
            const fallbackTemplates = category.templates.slice(0, 6).map(t => ({
              id: t.id,
              name: t.name_fi,
              description: `${t.name_fi} - ${category.name_fi}`,
              popularity_score: t.isPopular ? 85 : 60,
              questions: t.isPopular ? [{ id: 'basic', type: 'text', label_fi: 'Kerro lisätietoja', required: false }] : []
            }));
            setTemplates(fallbackTemplates);
          }
        }
      })
      .catch(error => {
        // Ignore aborted requests
        if (error.name === 'AbortError') {
          return;
        }

        console.error('Error fetching templates:', error);
        // Fallback: default-templates by FE slug, then hero constants
        const feSlug = category.id;
        const defaults = defaultTemplatesByCategory[feSlug] || [];
        if (defaults.length > 0) {
          setTemplates(defaults.slice(0, 6).map(t => ({
            id: t.id,
            name: t.name_fi,
            description: t.description_fi || `${t.name_fi} - ${category.name_fi}`,
            popularity_score: t.popularity_score ?? 60,
            questions: Array.isArray(t.questions) ? t.questions : []
          })));
        } else {
          setTemplates(category.templates.slice(0, 6).map(t => ({
            id: t.id,
            name: t.name_fi,
            description: `${t.name_fi} - ${category.name_fi}`,
            popularity_score: t.isPopular ? 85 : 60,
            questions: t.isPopular ? [{ id: 'basic', type: 'text', label_fi: 'Kerro lisätietoja', required: false }] : []
          })));
        }
      })
      .finally(() => {
        // Only update loading state if request wasn't aborted
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    // Cleanup function to abort request if component unmounts or category changes
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [category?.id]);

  if (!category) {
    return null;
  }

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex overflow-x-auto gap-2 sm:gap-3 md:gap-4 sm:flex-wrap scrollbar-hide pb-2 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-200 rounded-full text-xs sm:text-sm bg-gray-100 animate-pulse whitespace-nowrap flex-shrink-0 min-w-fit"
            >
              <div className="w-16 sm:w-20 h-3 sm:h-4 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleTemplateClick = (template: DbTemplate) => {
    // Convert DB template to HeroTemplateData format with additional data
    const heroTemplate: HeroTemplateData & { dbId?: string; questions?: any[] } = {
      id: template.id, // Use DB ID directly
      name_fi: template.name,
      categoryId: category.id,
      isPopular: (template.popularity_score || 0) >= 80,
      dbId: template.id,
      questions: template.questions
    };

    onTemplateSelect(heroTemplate);
  };

  // Don't render the section if loading or no templates are available
  if (loading || templates.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Template badges in mobile-optimized horizontal layout */}
      <div className="flex overflow-x-auto gap-2 sm:gap-3 md:gap-4 sm:flex-wrap scrollbar-hide pb-2 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleTemplateClick(template)}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-400 font-medium rounded-full text-xs sm:text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors whitespace-nowrap flex-shrink-0 min-w-fit"
          >
            <span>{template.name}</span>
            {/* Popularity indicator */}
            {(template.popularity_score || 0) >= 80 && (
              <TrendingUp className="w-3 h-3 text-emerald-600" />
            )}
            {/* Questions indicator */}
            {template.questions && template.questions.length > 0 && (
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
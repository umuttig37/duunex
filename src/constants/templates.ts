import { serviceCatalog } from '@/constants/service-catalog';

export interface DefaultTemplate {
  id: string;
  name_fi: string;
  description_fi: string;
  category_slug: string;
  popularity_score?: number;
  questions?: any[];
}

export const defaultTemplatesByCategory: Record<string, DefaultTemplate[]> = serviceCatalog.reduce(
  (acc, category) => {
    acc[category.slug] = category.templates.map((template) => ({
      id: template.id,
      name_fi: template.name_fi,
      description_fi: template.description_fi,
      category_slug: category.slug,
      popularity_score: template.popularity_score,
      questions: [],
    }));
    return acc;
  },
  {} as Record<string, DefaultTemplate[]>
);

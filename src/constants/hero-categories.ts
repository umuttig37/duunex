import type { LucideIcon } from 'lucide-react';

import { getCategoryUi } from '@/constants/category-ui';
import { serviceCatalog } from '@/constants/service-catalog';

export interface HeroCategoryData {
  id: string;
  name_fi: string;
  icon: LucideIcon;
  description: string;
  benefits: string[];
  heroImage: string;
  trending?: string;
  templates: HeroTemplateData[];
}

export interface HeroTemplateData {
  id: string;
  name_fi: string;
  categoryId: string;
  isPopular?: boolean;
  dbId?: string;
  questions?: any[];
}

export const heroCategoriesData: HeroCategoryData[] = serviceCatalog.map((category) => ({
  id: category.slug,
  name_fi: category.name_fi,
  icon: getCategoryUi(category.slug).icon,
  description: category.description_fi,
  benefits: category.benefits,
  heroImage: category.hero_image,
  trending: category.trending,
  templates: category.templates.map((template) => ({
    id: template.id,
    name_fi: template.name_fi,
    categoryId: category.slug,
    isPopular: template.popularity_score >= 85,
  })),
}));

export const getCategoryById = (id: string): HeroCategoryData | undefined =>
  heroCategoriesData.find((category) => category.id === id);

export const getPopularTemplates = (): HeroTemplateData[] =>
  heroCategoriesData.flatMap((category) =>
    category.templates.filter((template) => template.isPopular)
  );

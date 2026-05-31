import type { LucideIcon } from 'lucide-react';

import { getCategoryUi } from '@/constants/category-ui';
import { serviceCatalog } from '@/constants/service-catalog';

export interface CategoryWithIcon {
  id: string;
  name: string;
  name_fi: string;
  slug: string;
  icon: LucideIcon;
  question: string;
  description: string;
  gradient: string;
}

export const categoriesWithIcons: CategoryWithIcon[] = serviceCatalog.map((category) => {
  const ui = getCategoryUi(category.slug);

  return {
    id: category.slug,
    name: category.name_fi,
    name_fi: category.name_fi,
    slug: category.slug,
    icon: ui.icon,
    question: category.question,
    description: category.description_fi,
    gradient: ui.gradient,
  };
});

export const categoryIconMap: Record<string, LucideIcon> = categoriesWithIcons.reduce(
  (acc, category) => {
    acc[category.slug] = category.icon;
    return acc;
  },
  {} as Record<string, LucideIcon>
);

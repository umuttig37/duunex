import type { LucideIcon } from 'lucide-react';

import { getCategoryUi } from '@/constants/category-ui';
import { serviceCatalogBySlug } from '@/constants/service-catalog';
import { toAppSlug } from '@/lib/category-slug-alias';

const fallbackImage = '/images/handyman.png';

export function getCategoryIcon(slug: string): LucideIcon {
  return getCategoryUi(toAppSlug(slug)).icon;
}

export function getCategoryHeroImage(slug: string): string {
  return serviceCatalogBySlug[toAppSlug(slug)]?.hero_image || fallbackImage;
}

export function getCategoryBenefits(slug: string): string[] {
  return (
    serviceCatalogBySlug[toAppSlug(slug)]?.benefits || [
      'Julkaise työ selkeästi ja vastaanota kiinnostuneita tekijöitä',
      'Vertaa tekijöitä, viestintää ja tarjouksia samassa paikassa',
      'Pidä työn eteneminen hallussa koko prosessin ajan',
    ]
  );
}

export function getCategoryTrending(slug: string): string | undefined {
  return serviceCatalogBySlug[toAppSlug(slug)]?.trending;
}

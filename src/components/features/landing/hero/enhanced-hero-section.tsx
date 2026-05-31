'use client';

import type { DbHeroCategory } from '@/app/api/hero-categories/route';
import { BrandLogo } from '@/components/shared/brand/brand-logo';
import { Button } from '@/components/ui/button';
import { serviceCatalog } from '@/constants/service-catalog';
import type { HeroCategoryData } from '@/constants/hero-categories';
import {
  getCategoryBenefits,
  getCategoryHeroImage,
  getCategoryIcon,
  getCategoryTrending,
} from '@/lib/category-icon-mapping';
import { trackEvent } from '@/services/notifications/analytics';
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CategoryBadgeGrid } from './category-badge-grid';
import { CategoryInfoPanel } from './category-info-panel';
import HeroSearchBar from './hero-search-bar';
import { TemplateBadgesSection } from './template-badges-section';
import { useCategorySelection } from './use-category-selection';

const INITIAL_CATEGORY_LIMIT = 8;

export default function EnhancedHeroSection() {
  const [heroCategories, setHeroCategories] = useState<HeroCategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const categoryOrder = useMemo(
    () => new Map(serviceCatalog.map((category, index) => [category.slug, index])),
    []
  );

  const { activeCategory, isTransitioning, selectCategory, selectTemplate } =
    useCategorySelection(heroCategories);

  useEffect(() => {
    fetch('/api/hero-categories')
      .then((response) => response.json())
      .then((data) => {
        const dbCategories = (data.categories || []) as DbHeroCategory[];

        const formatted: HeroCategoryData[] = dbCategories
          .map((category) => ({
            id: category.slug,
            name_fi: category.name_fi,
            icon: getCategoryIcon(category.slug),
            description: category.description_fi || `${category.name_fi} -palvelut`,
            benefits: getCategoryBenefits(category.slug),
            heroImage: getCategoryHeroImage(category.slug),
            trending: getCategoryTrending(category.slug),
            templates: [],
          }))
          .sort(
            (a, b) =>
              (categoryOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
              (categoryOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER)
          );

        setHeroCategories(formatted);
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
        import('@/constants/hero-categories').then(({ heroCategoriesData }) => {
          setHeroCategories(heroCategoriesData);
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [categoryOrder]);

  return (
    <section className="bg-gradient-to-b from-background via-sky-50/70 to-background pt-10 sm:pt-14 pb-10 lg:pb-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <BrandLogo
              variant="stacked"
              className="h-28 w-auto sm:h-36"
              priority
              sizes="(max-width: 640px) 160px, 210px"
            />
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-3 py-1.5 text-sm font-medium text-sky-800 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Paikalliset tekijät arjen töihin ja pieniin projekteihin
          </div>

          <h1 className="mx-auto mb-4 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Duunex auttaa löytämään tekijän{' '}
            <span className="bg-gradient-to-r from-sky-600 to-orange-500 bg-clip-text text-transparent">
              oikeaan työhön ilman säätöä
            </span>
          </h1>

          <p className="mx-auto mb-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Julkaise työ, selaa valmiita palvelupohjia tai aloita kategoriasta.
            Siivous, muutto, asennukset, digituki ja kymmenet muut palvelut löytyvät
            samasta paikasta.
          </p>

          <div className="mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-3 py-1.5">
              <CheckCircle2 className="h-4 w-4 text-sky-600" />
              Julkaise tehtävä minuuteissa
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-3 py-1.5">
              <ShieldCheck className="h-4 w-4 text-orange-500" />
              Tarjoukset, viestit ja eteneminen yhdessä paikassa
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-3 py-1.5">
              <Sparkles className="h-4 w-4 text-sky-600" />
              Kategoriat valmiina yleisimpiin kotipalveluihin
            </span>
          </div>
        </div>

        <div className="mx-auto mb-6 max-w-2xl">
          <HeroSearchBar
            variant="clean"
            placeholder="Hae esimerkiksi muuttosiivous, valaisimen asennus tai koiran ulkoilutus"
          />
        </div>

        <div className="mb-6 flex justify-center">
          <div className="w-full max-w-4xl">
            {loading ? (
              <div className="flex overflow-x-auto gap-2 pb-2 sm:grid sm:grid-cols-6 sm:overflow-x-visible sm:pb-0 lg:grid-cols-8">
                {[...Array(INITIAL_CATEGORY_LIMIT)].map((_, index) => (
                  <div
                    key={index}
                    className="min-h-[78px] min-w-[82px] animate-pulse rounded-lg bg-white/80"
                  />
                ))}
              </div>
            ) : (
              <>
                <CategoryBadgeGrid
                  categories={
                    showAllCategories
                      ? heroCategories
                      : heroCategories.slice(0, INITIAL_CATEGORY_LIMIT)
                  }
                  activeCategory={activeCategory}
                  onCategorySelect={selectCategory}
                />

                {heroCategories.length > INITIAL_CATEGORY_LIMIT && (
                  <div className="mt-3 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllCategories((value) => !value)}
                      className="font-medium text-primary hover:bg-primary/10"
                    >
                      {showAllCategories
                        ? 'Näytä vähemmän'
                        : `Näytä kaikki kategoriat (${heroCategories.length})`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {activeCategory && (
          <div className="mx-auto mt-8 max-w-5xl">
            <div className="mb-5 h-px w-full bg-border" />
            <TemplateBadgesSection category={activeCategory} onTemplateSelect={selectTemplate} />
            <div className="mt-4">
              <CategoryInfoPanel
                category={activeCategory}
                className={isTransitioning ? 'scale-95 opacity-75' : 'scale-100 opacity-100'}
              />
            </div>
          </div>
        )}

        <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="flex-1 rounded-md bg-gradient-to-r from-sky-600 to-sky-500 px-8 py-4 font-medium text-white shadow-sm hover:from-sky-700 hover:to-sky-600"
          >
            <Link
              href="/dashboard/tasks/new"
              onClick={() => trackEvent('hero_cta_click', { type: 'create_task' })}
            >
              Luo tehtävä
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="flex-1 rounded-md border-orange-300 px-8 py-4 font-medium text-foreground hover:bg-orange-50 hover:text-foreground"
          >
            <Link
              href="/signup/tasker"
              onClick={() => trackEvent('hero_cta_click', { type: 'become_tasker' })}
            >
              Ryhdy tekijäksi
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

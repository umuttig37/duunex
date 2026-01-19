'use client';

import type { DbHeroCategory } from '@/app/api/hero-categories/route';
import { Button } from '@/components/ui/button';
import type { HeroCategoryData } from '@/constants/hero-categories';
import { getCategoryBenefits, getCategoryHeroImage, getCategoryIcon, getCategoryTrending } from '@/lib/category-icon-mapping';
import { trackEvent } from '@/services/notifications/analytics';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CategoryBadgeGrid } from './category-badge-grid';
import { CategoryInfoPanel } from './category-info-panel';
import HeroSearchBar from './hero-search-bar';
import { TemplateBadgesSection } from './template-badges-section';
import { useCategorySelection } from './use-category-selection';

const EnhancedHeroSection = () => {
  const [heroCategories, setHeroCategories] = useState<HeroCategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const INITIAL_CATEGORY_LIMIT = 7; // Show 7 categories initially to align with search bar

  const {
    activeCategory,
    isTransitioning,
    selectCategory,
    selectTemplate
  } = useCategorySelection(heroCategories);

  // Fetch real categories from database
  useEffect(() => {
    fetch('/api/hero-categories')
      .then(response => response.json())
      .then(data => {
        const dbCats = data.categories || [];

        // Convert database categories to HeroCategoryData format
        const heroFormatted: HeroCategoryData[] = dbCats.map((dbCat: DbHeroCategory) => ({
          id: dbCat.slug,
          name_fi: dbCat.name_fi,
          icon: getCategoryIcon(dbCat.slug),
          description: dbCat.description_fi || `${dbCat.name_fi} palvelut`,
          benefits: getCategoryBenefits(dbCat.slug),
          heroImage: getCategoryHeroImage(dbCat.slug),
          trending: getCategoryTrending(dbCat.slug),
          templates: [] // Will be populated dynamically from API
        }));

        console.log(`Loaded ${heroFormatted.length} categories from database:`, heroFormatted.map(c => c.name_fi));
        setHeroCategories(heroFormatted);
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
        // Fallback to hardcoded categories if API fails
        import('@/constants/hero-categories').then(({ heroCategoriesData }) => {
          setHeroCategories(heroCategoriesData);
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <section className="bg-gradient-to-b from-white via-emerald-50/40 to-white pt-16 sm:pt-20 pb-8 lg:pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Main heading - more compact */}
        <div className="text-center mb-6">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            Löydä luotettavaa apua{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent">
              kotiin, tänään
            </span>
          </h1>

          <p className="text-base text-gray-600 max-w-xl mx-auto mb-4">
            Siivouspalveluista huonekalujen kokoamiseen, tarkistetut auttajat ovat valmiina kun tarvitset.
          </p>

          {/* Prominent Paytrail Partnership Display */}
          <div className="flex items-center justify-center gap-3 py-3 px-4 bg-white rounded-xl border border-emerald-100 shadow-sm max-w-sm mx-auto">
            <span className="text-sm font-medium text-gray-700">Turvalliset maksut Paytraililla!</span>
            <Image
              src="/images/hero/paytrail.png"
              alt="Paytrail - Turvallinen maksukumppani"
              width={160}
              height={80}
              className="h-16 w-auto"
              sizes="160px"
              priority={true}
            />
          </div>
        </div>

        {/* Search bar - more compact */}
        <div className="max-w-2xl mx-auto mb-6">
          <HeroSearchBar
            variant="clean"
            placeholder="Hae palvelua tai kirjoita mitä tarvitset..."
          />
        </div>

        {/* Category badges grid - more compact */}
        <div className="flex justify-center mb-4">
          <div className="max-w-3xl w-full">
            {loading ? (
              <div className="flex overflow-x-auto gap-2 sm:gap-3 sm:grid sm:grid-cols-6 lg:grid-cols-7 sm:overflow-x-visible scrollbar-hide pb-2 sm:pb-0">
                {[...Array(INITIAL_CATEGORY_LIMIT)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center justify-center p-2 min-h-[75px] min-w-[75px] bg-gray-100 animate-pulse rounded-lg">
                    <div className="w-6 h-6 bg-gray-300 rounded mb-1"></div>
                    <div className="w-12 h-3 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <CategoryBadgeGrid
                  categories={showAllCategories ? heroCategories : heroCategories.slice(0, INITIAL_CATEGORY_LIMIT)}
                  activeCategory={activeCategory}
                  onCategorySelect={selectCategory}
                />

                {/* Show All / Show Less button */}
                {heroCategories.length > INITIAL_CATEGORY_LIMIT && (
                  <div className="flex justify-center mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium"
                    >
                      {showAllCategories ? (
                        <>Näytä vähemmän</>
                      ) : (
                        <>Näytä kaikki ({heroCategories.length})</>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Only show expanded content if category is selected - keeps above fold clean */}
        {activeCategory && (
          <>
            {/* divider */}
            <div className="h-px bg-gray-200 w-full my-6"></div>

            {/* Compact layout for selected category */}
            <div className="max-w-5xl mx-auto">
              <TemplateBadgesSection
                category={activeCategory}
                onTemplateSelect={selectTemplate}
              />

              <div className="mt-4">
                <CategoryInfoPanel
                  category={activeCategory}
                  className={isTransitioning ? 'opacity-75 scale-95' : 'opacity-100 scale-100'}
                />
              </div>
            </div>
          </>
        )}

        {/* CTA Buttons - more compact positioning */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 max-w-md mx-auto">
          <Button
            asChild
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-medium"
          >
            <Link href="/dashboard/tasks/new" onClick={() => trackEvent('hero_cta_click', { type: 'create_task' })}>
              Luo tehtävä
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-8 py-4 rounded-lg font-medium"
          >
            <Link href="/signup/tasker" onClick={() => trackEvent('hero_cta_click', { type: 'become_tasker' })}>Ryhdy tekijäksi</Link>
          </Button>
        </div>

        {/* Trust elements - simplified without duplicate Paytrail logo */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-gray-600">
            <span>✓ Rahasi palautetaan, jos työ ei onnistu</span>
            <span className="hidden sm:inline text-gray-400">•</span>
            <span>Luottaa yli 10 000 kotitaloutta</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedHeroSection;
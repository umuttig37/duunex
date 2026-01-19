'use client';

import { CategoryBadge, ModernCard, SearchBar, TemplateCard } from '@/components/ui/modern-primitives';
import { categoriesWithIcons, type CategoryWithIcon } from '@/constants/categories-with-icons';
import { defaultTemplatesByCategory } from '@/constants/templates';
import { cn } from '@/lib/utils';
import { ArrowRight, Search, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

/* ================================
   INTERFACES & TYPES
   ================================ */
interface TaskTemplate {
  id: string;
  name_fi: string;
  description_fi: string;
  category: string;
  popularity_score: number;
  icon?: string;
}

interface ModernCategorySelectionProps {
  categories: CategoryWithIcon[];
  selectedCategory?: CategoryWithIcon | null;
  onSelect: (category: CategoryWithIcon) => void;
  templates?: TaskTemplate[];
  onTemplateSelect?: (template: TaskTemplate) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  className?: string;
}

/* ================================
   MOCK DATA FOR TEMPLATES
   ================================ */
// Build default templates list from constants
const mockTemplates: TaskTemplate[] = Object.entries(defaultTemplatesByCategory).flatMap(([slug, templates]) =>
  templates.map(t => ({
    id: t.id,
    name_fi: t.name_fi,
    description_fi: t.description_fi,
    category: categoriesWithIcons.find(c => c.slug === slug)?.name_fi || slug,
    popularity_score: t.popularity_score || 0,
  }))
);

/* ================================
   MAIN COMPONENT
   ================================ */
export default function ModernCategorySelection({
  categories,
  selectedCategory,
  onSelect,
  templates = mockTemplates,
  onTemplateSelect,
  searchQuery = '',
  onSearchChange,
  className,
}: ModernCategorySelectionProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [filteredCategories, setFilteredCategories] = useState(categories);
  const [filteredTemplates, setFilteredTemplates] = useState(templates);
  const [showAllCategories, setShowAllCategories] = useState(true);

  // Filter categories and templates based on search and selected category
  useEffect(() => {
    const query = localSearchQuery.toLowerCase().trim();

    if (!query) {
      setFilteredCategories(categories);
      // If a category is selected, suggest templates for that category first
      if (selectedCategory) {
        const catName = selectedCategory.name_fi.toLowerCase();
        const byCategory = templates.filter(t => t.category.toLowerCase().includes(catName));
        setFilteredTemplates(byCategory.length > 0 ? byCategory : templates);
      } else {
        setFilteredTemplates(templates);
      }
      return;
    }

    // Filter categories
    const matchingCategories = categories.filter(cat =>
      cat.name_fi.toLowerCase().includes(query) ||
      cat.description?.toLowerCase().includes(query)
    );
    setFilteredCategories(matchingCategories);

    // Filter templates
    const matchingTemplates = templates.filter(template =>
      template.name_fi.toLowerCase().includes(query) ||
      template.description_fi.toLowerCase().includes(query) ||
      template.category.toLowerCase().includes(query)
    );
    setFilteredTemplates(matchingTemplates);
  }, [localSearchQuery, categories, templates, selectedCategory]);

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    onSearchChange?.(value);
  };

  const normalize = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  const handleTemplateClick = (template: TaskTemplate) => {
    const templateKey = normalize(template.category);

    // First, try slug match if available
    const slugMatch = categories.find(cat => normalize(cat.slug || cat.name_fi) === templateKey);
    if (slugMatch) {
      onSelect(slugMatch);
      onTemplateSelect?.(template);
      return;
    }

    // Second, try name includes either way
    const includesMatch = categories.find(cat => {
      const nameKey = normalize(cat.name_fi);
      return nameKey.includes(templateKey) || templateKey.includes(nameKey);
    });
    if (includesMatch) {
      onSelect(includesMatch);
      onTemplateSelect?.(template);
      return;
    }

    // Third, synonym map
    const synonyms: Record<string, string[]> = {
      kotitalous: ['siivous', 'kodin', 'koti'],
      siivous: ['kotitalous', 'kodin', 'koti'],
      kokoonpano: ['huonekalut', 'asennus', 'kaluste'],
      'pienet korjaukset': ['korjaus', 'kiinnitys', 'tv', 'seinakiinnitys'],
      'it apu': ['tietokone', 'it', 'atk', 'laptop', 'läppäri']
    };
    const synonymMatch = categories.find(cat => {
      const nameKey = normalize(cat.name_fi);
      return synonyms[nameKey]?.some(s => templateKey.includes(s)) ?? false;
    });
    if (synonymMatch) {
      onSelect(synonymMatch);
      onTemplateSelect?.(template);
      return;
    }

    // Fallback: select first category but warn for analytics
    console.warn('No category match found for template:', template.category);
    onSelect(categories[0]);
    onTemplateSelect?.(template);
  };

  const popularCategories = categories.slice(0, 7); // Increased to 7 for better desktop alignment
  const hasSearchResults = localSearchQuery.trim().length > 0;

  return (
    <div className={cn("animate-fade-in", className)}>
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="heading-1 mb-4">
          Mitä tarvitset?
        </h1>
        <p className="body-large max-w-2xl mx-auto">
          Hae valmiista pohjista tai valitse kategoria.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <SearchBar
          placeholder="Esim. siivous, kokoonpano, IT-apu..."
          value={localSearchQuery}
          onChange={handleSearchChange}
          className="w-full"
        />
      </div>

      {/* Search Results or Default View */}
      {hasSearchResults ? (
        <div className="space-y-8">
          {/* Search Results Header */}
          <div className="text-center">
            <h2 className="heading-2 mb-2">
              Hakutulokset: "{localSearchQuery}"
            </h2>
            <p className="body-base">
              Löytyi {filteredTemplates.length + filteredCategories.length} tulosta
            </p>
          </div>

          {/* Matching Templates */}
          {filteredTemplates.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="heading-3">Suositut pohjat</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {filteredTemplates.map((template) => {
                  const categoryIcon = categoriesWithIcons.find(cat =>
                    cat.name_fi === template.category
                  )?.icon;

                  return (
                    <TemplateCard
                      key={template.id}
                      title={template.name_fi}
                      description={template.description_fi}
                      icon={categoryIcon || Search}
                      category={template.category}
                      popularity={template.popularity_score}
                      onClick={() => handleTemplateClick(template)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Matching Categories */}
          {filteredCategories.length > 0 && (
            <div>
              <h3 className="heading-3 mb-4">Sopivat kategoriat</h3>

              <div className="flex flex-wrap gap-3">
                {filteredCategories.map((category) => (
                  <CategoryBadge
                    key={category.id}
                    name={category.name_fi}
                    icon={category.icon}
                    selected={selectedCategory?.id === category.id}
                    onClick={() => onSelect(category)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {filteredTemplates.length === 0 && filteredCategories.length === 0 && (
            <ModernCard variant="base" className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="heading-3 mb-2">Ei tuloksia haulle</h3>
              <p className="body-base mb-4">
                Kokeile eri hakusanoja tai selaa kategorioita alta
              </p>
              <button
                onClick={() => setLocalSearchQuery('')}
                className="btn-secondary"
              >
                Tyhjennä haku
              </button>
            </ModernCard>
          )}
        </div>
      ) : (
        /* Default View - No Search */
        <div className="space-y-8">
          {/* Popular Templates Section (or category-suggested templates) */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-2">Suositut pohjat</h2>
              <span className="badge-emerald">
                {selectedCategory ? `Ehdotukset: ${selectedCategory.name_fi}` : 'Nopea aloitus'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {filteredTemplates.map((template) => {
                const categoryIcon = categoriesWithIcons.find(cat =>
                  cat.name_fi === template.category
                )?.icon;

                return (
                  <TemplateCard
                    key={template.id}
                    title={template.name_fi}
                    description={template.description_fi}
                    icon={categoryIcon || Search}
                    category={template.category}
                    popularity={template.popularity_score}
                    onClick={() => handleTemplateClick(template)}
                  />
                );
              })}
            </div>

          </div>

          {/* Categories Section */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="heading-2">Tai valitse kategoria</h2>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              {(showAllCategories ? categories : popularCategories).map((category) => (
                <CategoryBadge
                  key={category.id}
                  name={category.name_fi}
                  icon={category.icon}
                  selected={selectedCategory?.id === category.id}
                  onClick={() => onSelect(category)}
                />
              ))}
            </div>

            {/* Show More Categories */}
            {categories.length > 7 && !hasSearchResults && !showAllCategories && (
              <ModernCard variant="interactive" className="text-center py-6">
                <p className="body-base mb-4">
                  {showAllCategories ? 'Kaikki kategoriat näkyvissä' : `${categories.length - 7} muuta kategoriaa saatavilla`}
                </p>
                <button
                  onClick={() => setShowAllCategories(true)}
                  className="btn-outline inline-flex items-center gap-2"
                >
                  Näytä kaikki kategoriat
                  <ArrowRight className="w-4 h-4" />
                </button>
              </ModernCard>
            )}
          </div>
        </div>
      )}

      {/* Selected Category Confirmation */}
      {selectedCategory && (
        <ModernCard variant="selected" className="mt-8 animate-scale-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <selectedCategory.icon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="body-small text-emerald-700">Valittu kategoria:</p>
                <h3 className="heading-4">{selectedCategory.name_fi}</h3>
              </div>
            </div>

            <div className="text-right">
              <p className="badge-success">Valittu ✓</p>
              <p className="body-small mt-1">Jatka seuraavaan vaiheeseen</p>
            </div>
          </div>
        </ModernCard>
      )}

    </div>
  );
}
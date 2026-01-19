'use client';

import type { HeroCategoryData, HeroTemplateData } from '@/constants/hero-categories';
import { toAppSlug } from '@/lib/category-slug-alias';
import { trackEvent } from '@/services/notifications/analytics';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface CategorySelectionState {
  activeCategory: HeroCategoryData | null;
  isTransitioning: boolean;
}

export function useCategorySelection(categories: HeroCategoryData[] = []) {
  const router = useRouter();
  const [state, setState] = useState<CategorySelectionState>({
    activeCategory: null,
    isTransitioning: false
  });

  // Set default category when categories are loaded
  useEffect(() => {
    if (!state.activeCategory && categories.length > 0) {
      console.log(`Setting default category: ${categories[0].name_fi}`);
      setState({
        activeCategory: categories[0],
        isTransitioning: false
      });
    }
  }, [categories, state.activeCategory]);

  const selectCategory = useCallback((category: HeroCategoryData) => {
    setState(prev => ({
      ...prev,
      isTransitioning: true
    }));

    // Simulate smooth transition
    setTimeout(() => {
      setState({
        activeCategory: category,
        isTransitioning: false
      });
      trackEvent('hero_category_select', { categoryId: category.id });
    }, 150);
  }, []);

  const clearSelection = useCallback(() => {
    setState({
      activeCategory: null,
      isTransitioning: false
    });
  }, []);

  const selectTemplate = useCallback((template: HeroTemplateData & { dbId?: string; questions?: any[] }) => {
    const currentCategory = state.activeCategory;
    if (!currentCategory) return;

    // Convert category slug to FE format for localStorage consistency
    const feSlug = toAppSlug(currentCategory.id);

    // Prepare localStorage data for task booking flow
    const taskBookingData = {
      selectedCategory: {
        id: feSlug, // Store as FE slug for compatibility with task booking flow
        slug: feSlug, // Store as FE slug for compatibility with task booking flow
        name_fi: currentCategory.name_fi
      },
      selectedTemplate: {
        id: template.dbId || template.id, // Store DB UUID for template
        name_fi: template.name_fi,
        description_fi: '', // Will be filled from DB in the task booking page
        questions: template.questions || []
      },
      currentStep: 'details'
    };

    // Get existing data and merge
    const existingData = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('modern-task-booking-data') || '{}')
      : {};
    
    const mergedData = {
      ...existingData,
      ...taskBookingData,
      origin: 'hero_template_click',
      persistedAt: Date.now()
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('modern-task-booking-data', JSON.stringify(mergedData));
    }

    // Navigate to task creation with FE slug and DB template UUID
    const searchParams = new URLSearchParams({
      category: feSlug, // Use 'category' parameter with FE slug
      template: template.dbId || template.id, // Use DB UUID for template
      templateName: template.name_fi
    });
    
    // Enhanced analytics with FE slug for consistency
    trackEvent('hero_template_click', { 
      categorySlug: feSlug, // Use FE slug for analytics consistency
      templateId: template.dbId || template.id,
      popularity: template.isPopular ? 'high' : 'normal',
      hasQuestions: template.questions && template.questions.length > 0
    });
    
    router.push(`/dashboard/tasks/new?${searchParams.toString()}`);
  }, [router, state.activeCategory]);

  const navigateToCategory = useCallback((categoryId: string) => {
    // Navigate to category-specific task listing
    router.push(`/categories/${categoryId}`);
  }, [router]);

  return {
    activeCategory: state.activeCategory,
    isTransitioning: state.isTransitioning,
    selectCategory,
    clearSelection,
    selectTemplate,
    navigateToCategory
  };
}
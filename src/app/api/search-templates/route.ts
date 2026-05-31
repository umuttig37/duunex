import { defaultTemplatesByCategory } from '@/constants/templates';
import { serviceCatalog, topLevelCategoryNames } from '@/constants/service-catalog';
import { toAppSlug, toDbSlug } from '@/lib/category-slug-alias';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export interface SearchResult {
  type: 'template' | 'category' | 'subcategory';
  id: string;
  name: string;
  description?: string;
  category_name?: string;
  category_slug?: string;
  popularity_score?: number;
  icon?: string;
  questions?: any[];
}

function buildFallbackTemplates(query?: string): SearchResult[] {
  const normalizedQuery = query?.trim().toLowerCase();

  return Object.entries(defaultTemplatesByCategory)
    .flatMap(([categorySlug, templates]) =>
      templates.map((template) => ({
        type: 'template' as const,
        id: template.id,
        name: template.name_fi,
        description: template.description_fi,
        category_name:
          serviceCatalog.find((category) => category.slug === categorySlug)?.name_fi || categorySlug,
        category_slug: categorySlug,
        popularity_score: template.popularity_score || 0,
        questions: Array.isArray(template.questions) ? template.questions : [],
      }))
    )
    .filter((template) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        template.name.toLowerCase().includes(normalizedQuery) ||
        (template.description || '').toLowerCase().includes(normalizedQuery) ||
        (template.category_name || '').toLowerCase().includes(normalizedQuery)
      );
    })
    .sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0));
}

function appendUniqueTemplates(results: SearchResult[], templates: SearchResult[], limit: number) {
  const seenIds = new Set(results.filter((item) => item.type === 'template').map((item) => item.id));

  for (const template of templates) {
    if (results.length >= limit) {
      break;
    }
    if (seenIds.has(template.id)) {
      continue;
    }
    results.push(template);
    seenIds.add(template.id);
  }
}

async function getCategoryTemplates(categorySlug: string, limit: number) {
  try {
    const supabase = await createClient();
    const results: SearchResult[] = [];
    const normalizedSlug = toDbSlug(categorySlug);

    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id, name_fi, slug')
      .eq('slug', normalizedSlug)
      .maybeSingle();

    if (categoryError || !category) {
      const fallbackSlug = toAppSlug(normalizedSlug);
      const fallbackResults = buildFallbackTemplates().filter(
        (template) => template.category_slug === fallbackSlug
      );

      return NextResponse.json({
        results: fallbackResults.slice(0, limit),
        total: fallbackResults.length,
        query: null,
        categorySlug: fallbackSlug,
      });
    }

    const { data: categoryTemplates, error: templatesError } = await supabase
      .from('task_templates')
      .select(`
        id,
        name_fi,
        description_fi,
        popularity_score,
        questions,
        categories!task_templates_category_id_fkey(
          id,
          name_fi,
          icon_url,
          slug
        )
      `)
      .eq('is_active', true)
      .eq('category_id', category.id)
      .order('popularity_score', { ascending: false })
      .order('name_fi', { ascending: true })
      .limit(limit);

    if (templatesError) {
      console.error('Error fetching category templates:', templatesError);
      return NextResponse.json({ results: [], error: templatesError.message });
    }

    (categoryTemplates || []).forEach((template: any) => {
      results.push({
        type: 'template',
        id: template.id,
        name: template.name_fi,
        description: template.description_fi || undefined,
        category_name: template.categories?.name_fi,
        category_slug: toAppSlug(template.categories?.slug || normalizedSlug),
        popularity_score: template.popularity_score || 0,
        icon: template.categories?.icon_url || undefined,
        questions: template.questions,
      });
    });

    if (results.length === 0) {
      const fallbackSlug = toAppSlug(normalizedSlug);
      const fallbackResults = buildFallbackTemplates().filter(
        (template) => template.category_slug === fallbackSlug
      );
      appendUniqueTemplates(results, fallbackResults, limit);
    }

    return NextResponse.json({
      results,
      total: results.length,
      query: null,
      categorySlug: toAppSlug(normalizedSlug),
    });
  } catch (error) {
    console.error('Error fetching category templates:', error);
    return NextResponse.json({ results: [] });
  }
}

async function getPopularSuggestions(limit: number) {
  try {
    const supabase = await createClient();
    const results: SearchResult[] = [];

    const { data: popularTemplates } = await supabase
      .from('task_templates')
      .select(`
        id,
        name_fi,
        description_fi,
        popularity_score,
        questions,
        categories!task_templates_category_id_fkey(
          id,
          name_fi,
          icon_url,
          slug
        )
      `)
      .eq('is_active', true)
      .order('popularity_score', { ascending: false })
      .limit(Math.min(limit, 4));

    (popularTemplates || []).forEach((template: any) => {
      results.push({
        type: 'template',
        id: template.id,
        name: template.name_fi,
        description: template.description_fi || undefined,
        category_name: template.categories?.name_fi,
        category_slug: toAppSlug(template.categories?.slug || ''),
        popularity_score: template.popularity_score || 0,
        icon: template.categories?.icon_url || undefined,
        questions: template.questions,
      });
    });

    appendUniqueTemplates(results, buildFallbackTemplates(), limit);

    if (results.length < limit) {
      const { data: popularCategories } = await supabase
        .from('categories')
        .select('id, name_fi, description_fi, icon_url, slug')
        .is('parent_category_id', null)
        .in('name_fi', topLevelCategoryNames.slice(0, 10))
        .order('name_fi')
        .limit(Math.min(limit - results.length, 4));

      (popularCategories || []).forEach((category: any) => {
        const hasTemplate = results.some((result) => result.category_name === category.name_fi);
        if (!hasTemplate) {
          results.push({
            type: 'category',
            id: category.id,
            name: category.name_fi,
            description: category.description_fi || undefined,
            category_slug: category.slug,
            icon: category.icon_url || undefined,
          });
        }
      });
    }

    return NextResponse.json({
      results,
      total: results.length,
      query: null,
    });
  } catch (error) {
    console.error('Error fetching popular suggestions:', error);
    return NextResponse.json({ results: buildFallbackTemplates().slice(0, limit) });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim().toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const getPopular = searchParams.get('popular') === 'true';
    const categorySlug = searchParams.get('categorySlug');

    if (getPopular && (!query || query.length < 2)) {
      return getPopularSuggestions(limit);
    }

    if (categorySlug && (!query || query.length < 2)) {
      return getCategoryTemplates(categorySlug, limit);
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const supabase = await createClient();
    const results: SearchResult[] = [];

    const { data: templates, error: templatesError } = await supabase
      .from('task_templates')
      .select(`
        id,
        name_fi,
        description_fi,
        keywords_fi,
        popularity_score,
        questions,
        categories!task_templates_category_id_fkey(
          id,
          name_fi,
          icon_url,
          slug
        )
      `)
      .eq('is_active', true)
      .or(`name_fi.ilike.%${query}%,description_fi.ilike.%${query}%,keywords_fi.cs.{${query}}`)
      .order('popularity_score', { ascending: false })
      .limit(Math.min(limit, 8));

    if (templatesError) {
      console.error('Templates search error:', templatesError);
    } else {
      (templates || []).forEach((template: any) => {
        results.push({
          type: 'template',
          id: template.id,
          name: template.name_fi,
          description: template.description_fi || undefined,
          category_name: template.categories?.name_fi,
          category_slug: toAppSlug(template.categories?.slug || ''),
          popularity_score: template.popularity_score || 0,
          icon: template.categories?.icon_url || undefined,
          questions: template.questions,
        });
      });
    }

    appendUniqueTemplates(results, buildFallbackTemplates(query), limit);

    if (results.length < limit) {
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name_fi, description_fi, icon_url, slug')
        .or(`name_fi.ilike.%${query}%,description_fi.ilike.%${query}%`)
        .is('parent_category_id', null)
        .limit(Math.min(limit - results.length, 4));

      if (categoriesError) {
        console.error('Categories search error:', categoriesError);
      } else {
        (categories || []).forEach((category: any) => {
          const hasTemplate = results.some((result) => result.category_name === category.name_fi);
          if (!hasTemplate) {
            results.push({
              type: 'category',
              id: category.id,
              name: category.name_fi,
              description: category.description_fi || undefined,
              category_slug: category.slug,
              icon: category.icon_url || undefined,
            });
          }
        });
      }
    }

    if (results.length < limit) {
      const { data: subcategories, error: subcategoriesError } = await supabase
        .from('categories')
        .select(`
          id,
          name_fi,
          description_fi,
          icon_url,
          slug,
          parent_category:categories!parent_category_id(name_fi, slug)
        `)
        .or(`name_fi.ilike.%${query}%,description_fi.ilike.%${query}%`)
        .not('parent_category_id', 'is', null)
        .limit(Math.min(limit - results.length, 3));

      if (subcategoriesError) {
        console.error('Subcategories search error:', subcategoriesError);
      } else {
        (subcategories || []).forEach((subcategory: any) => {
          results.push({
            type: 'subcategory',
            id: subcategory.id,
            name: subcategory.name_fi,
            description: subcategory.description_fi || undefined,
            category_name: subcategory.parent_category?.name_fi,
            category_slug: subcategory.parent_category?.slug,
            icon: subcategory.icon_url || undefined,
          });
        });
      }
    }

    results.sort((a, b) => {
      const typeOrder = { template: 3, category: 2, subcategory: 1 };
      const typeDiff = typeOrder[b.type] - typeOrder[a.type];
      if (typeDiff !== 0) {
        return typeDiff;
      }

      const popularityA = a.popularity_score || 0;
      const popularityB = b.popularity_score || 0;
      if (popularityA !== popularityB) {
        return popularityB - popularityA;
      }

      const exactMatchA = a.name.toLowerCase().includes(query) ? 1 : 0;
      const exactMatchB = b.name.toLowerCase().includes(query) ? 1 : 0;
      return exactMatchB - exactMatchA;
    });

    return NextResponse.json({
      results: results.slice(0, limit),
      total: results.length,
      query,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

import { createClient } from '@/lib/supabase/server';
import { toDbSlug } from '@/lib/category-slug-alias';
import { NextRequest, NextResponse } from 'next/server';

export interface SearchResult {
  type: 'template' | 'category' | 'subcategory';
  id: string;
  name: string;
  description?: string;
  category_name?: string;
  popularity_score?: number;
  icon?: string;
  questions?: any[];
}

// Helper function to get templates for a specific category
async function getCategoryTemplates(categorySlug: string, limit: number) {
  try {
    const supabase = await createClient();
    const results: SearchResult[] = [];

    // Normalize categorySlug to database format
    const normalizedSlug = toDbSlug(categorySlug);
    console.log(`🔍 Fetching templates for category: ${categorySlug} -> normalized: ${normalizedSlug}`);

    // First, get the category ID by slug
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id, name_fi, slug')
      .eq('slug', normalizedSlug)
      .single();

    if (categoryError || !category) {
      console.log(`❌ Category not found for slug: ${normalizedSlug}`, categoryError);
      return NextResponse.json({ results: [], error: `Category not found: ${normalizedSlug}` });
    }

    // Get templates for the specified category using category_id
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

    if (categoryTemplates) {
      console.log(`✅ Found ${categoryTemplates.length} templates for category ${normalizedSlug}`);
      categoryTemplates.forEach((template: any) => {
        results.push({
          type: 'template',
          id: template.id,
          name: template.name_fi,
          description: template.description_fi || undefined,
          category_name: template.categories?.name_fi,
          popularity_score: template.popularity_score || 0,
          icon: template.categories?.icon_url || undefined,
          questions: template.questions
        });
      });
    } else {
      console.log(`❌ No templates found for category ${normalizedSlug}`);
    }

    return NextResponse.json({
      results,
      total: results.length,
      query: null,
      categorySlug: normalizedSlug
    });

  } catch (error) {
    console.error('Error fetching category templates:', error);
    return NextResponse.json({ results: [] });
  }
}

// Helper function to get popular suggestions (for when input is clicked without typing)
async function getPopularSuggestions(limit: number) {
  try {
    const supabase = await createClient();
    const results: SearchResult[] = [];

    // Get most popular templates
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
          icon_url
        )
      `)
      .eq('is_active', true)
      .order('popularity_score', { ascending: false })
      .limit(Math.min(limit, 4));

    if (popularTemplates) {
      popularTemplates.forEach((template: any) => {
        results.push({
          type: 'template',
          id: template.id,
          name: template.name_fi,
          description: template.description_fi || undefined,
          category_name: template.categories?.name_fi,
          popularity_score: template.popularity_score || 0,
          icon: template.categories?.icon_url || undefined,
          questions: template.questions
        });
      });
    }

    // Get popular categories if we have space - updated to include new categories
    if (results.length < limit) {
      const { data: popularCategories } = await supabase
        .from('categories')
        .select('id, name_fi, description_fi, icon_url')
        .is('parent_category_id', null)
        .in('name_fi', ['Siivous', 'Muutto', 'Korjaukset', 'Puutarha', 'Kokoonpano', 'Kotitalous', 'IT-apu'])
        .order('name_fi')
        .limit(Math.min(limit - results.length, 4));

      if (popularCategories) {
        popularCategories.forEach((category: any) => {
          results.push({
            type: 'category',
            id: category.id,
            name: category.name_fi,
            description: category.description_fi || undefined,
            icon: category.icon_url || undefined
          });
        });
      }
    }

    return NextResponse.json({
      results,
      total: results.length,
      query: null
    });

  } catch (error) {
    console.error('Error fetching popular suggestions:', error);
    return NextResponse.json({ results: [] });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim().toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '10');
    const getPopular = searchParams.get('popular') === 'true';
    const categorySlug = searchParams.get('categorySlug');

    // If requesting popular suggestions without query
    if (getPopular && (!query || query.length < 2)) {
      return getPopularSuggestions(limit);
    }

    // If requesting category-specific templates without query
    if (categorySlug && (!query || query.length < 2)) {
      return getCategoryTemplates(categorySlug, limit);
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const supabase = await createClient();
    const results: SearchResult[] = [];

    // Search task templates first (highest priority)
    // Enhanced search with better keyword matching for new categories
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

    console.log(`Searching for query: "${query}", found ${templates?.length || 0} templates`);
    if (templatesError) {
      console.error('Templates search error:', templatesError);
    } else if (templates) {
      (templates as any[]).forEach((template: any) => {
        results.push({
          type: 'template',
          id: template.id,
          name: template.name_fi,
          description: template.description_fi || undefined,
          category_name: template.categories?.name_fi,
          popularity_score: template.popularity_score || 0,
          icon: template.categories?.icon_url || undefined,
          questions: template.questions
        });
      });
    }

    // Search categories (medium priority) if we have space
    if (results.length < limit) {
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name_fi, description_fi, icon_url, parent_category_id')
        .or(`name_fi.ilike.%${query}%,description_fi.ilike.%${query}%`)
        .is('parent_category_id', null) // Only parent categories
        .limit(Math.min(limit - results.length, 4));

      if (categoriesError) {
        console.error('Categories search error:', categoriesError);
      } else if (categories) {
        (categories as any[]).forEach((category: any) => {
          // Avoid duplicates if category is already represented by templates
          const hasTemplate = results.some(r => r.category_name === category.name_fi);
          if (!hasTemplate) {
            results.push({
              type: 'category',
              id: category.id,
              name: category.name_fi,
              description: category.description_fi || undefined,
              icon: category.icon_url || undefined
            });
          }
        });
      }
    }

    // Search subcategories (lowest priority) if we still have space
    if (results.length < limit) {
      const { data: subcategories, error: subcategoriesError } = await supabase
        .from('categories')
        .select(`
          id, 
          name_fi, 
          description_fi, 
          icon_url,
          parent_category:categories!parent_category_id(name_fi)
        `)
        .or(`name_fi.ilike.%${query}%,description_fi.ilike.%${query}%`)
        .not('parent_category_id', 'is', null) // Only subcategories
        .limit(Math.min(limit - results.length, 3));

      if (subcategoriesError) {
        console.error('Subcategories search error:', subcategoriesError);
      } else if (subcategories) {
        (subcategories as any[]).forEach((subcategory: any) => {
          results.push({
            type: 'subcategory',
            id: subcategory.id,
            name: subcategory.name_fi,
            description: subcategory.description_fi || undefined,
            category_name: subcategory.parent_category?.name_fi,
            icon: subcategory.icon_url || undefined
          });
        });
      }
    }

    // Sort results by relevance and popularity
    results.sort((a, b) => {
      // First, prioritize by type (templates > categories > subcategories)
      const typeOrder = { template: 3, category: 2, subcategory: 1 };
      const typeDiff = typeOrder[b.type] - typeOrder[a.type];
      if (typeDiff !== 0) return typeDiff;

      // Then by popularity score (if available)
      const popularityA = a.popularity_score || 0;
      const popularityB = b.popularity_score || 0;
      if (popularityA !== popularityB) return popularityB - popularityA;

      // Finally by name match relevance (exact match first)
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      const exactMatchA = nameA.includes(query) ? 1 : 0;
      const exactMatchB = nameB.includes(query) ? 1 : 0;
      
      return exactMatchB - exactMatchA;
    });

    return NextResponse.json({
      results: results.slice(0, limit),
      total: results.length,
      query
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
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

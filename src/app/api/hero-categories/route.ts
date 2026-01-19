import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface DbHeroCategory {
  id: string;
  name_fi: string;
  slug: string;
  icon_url: string | null;
  description_fi: string | null;
  template_count?: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const limitNum = limit ? parseInt(limit, 10) : undefined;

    const supabase = await createClient();
    
    // Get parent categories (no parent_category_id) with optional limit
    let query = supabase
      .from('categories')
      .select(`
        id,
        name_fi,
        slug,
        icon_url,
        description_fi
      `)
      .is('parent_category_id', null)
      .order('name_fi');

    // Apply limit if specified
    if (limitNum && limitNum > 0) {
      query = query.limit(limitNum);
    }

    const { data: categories, error } = await query;

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Get template counts for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category) => {
        const { count } = await supabase
          .from('task_templates')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)
          .eq('is_active', true);

        return {
          ...category,
          template_count: count || 0
        };
      })
    );

    return NextResponse.json({
      categories: categoriesWithCounts,
      total: categoriesWithCounts.length
    });

  } catch (error) {
    console.error('Hero categories API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
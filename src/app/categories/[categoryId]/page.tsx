import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import CategoryTasksContent from './category-tasks-content';

interface CategoryTasksPageProps {
  params: Promise<{ categoryId: string }>;
}

const isUuid = (value: string) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    value
  );

export default async function CategoryTasksPage({ params }: CategoryTasksPageProps) {
  const supabase = await createClient();
  const resolvedParams = await params;
  const categoryParam = resolvedParams.categoryId;

  const { data: categoryBySlug } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', categoryParam)
    .maybeSingle();

  let category = categoryBySlug;

  if (!category && isUuid(categoryParam)) {
    const { data: categoryById } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryParam)
      .maybeSingle();
    category = categoryById;
  }

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Kategoriaa ei löytynyt</h1>
          <p className="text-gray-600">
            Tarkista linkki tai palaa etusivulle valitsemaan palvelu uudelleen.
          </p>
        </div>
      </div>
    );
  }

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select(`
      *,
      categories (name_fi, icon_url),
      publisher:profiles!tasks_user_id_fkey (
        first_name,
        last_name,
        avatar_url
      ),
      task_attachments (id, file_url, file_type)
    `)
    .eq('category_id', category.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-gray-600">Ladataan tehtäviä...</div>
          </div>
        }
      >
        <CategoryTasksContent category={category} tasks={tasks || []} />
      </Suspense>
    </div>
  );
}

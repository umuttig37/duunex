import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import CategoryTasksContent from './category-tasks-content';

interface CategoryTasksPageProps {
  params: Promise<{ categoryId: string }>;
}

export default async function CategoryTasksPage({ params }: CategoryTasksPageProps) {
  const supabase = await createClient();
  const resolvedParams = await params;
  const categoryId = resolvedParams.categoryId;

  // Fetch category details
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single();

  if (categoryError || !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Kategoriaa ei löytynyt</h1>
          <p className="text-gray-600">Yritä myöhemmin uudelleen tai palaa etusivulle.</p>
        </div>
      </div>
    );
  }

  // Fetch open tasks in this category
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select(`
      *,
      categories (name_fi, icon_url),
      publisher:profiles!tasks_user_id_profiles_fkey (
        first_name,
        last_name,
        avatar_url
      ),
      task_attachments (id, file_url, file_type)
    `)
    .eq('category_id', categoryId)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600">Ladataan tehtäviä...</div>
        </div>
      }>
        <CategoryTasksContent 
          category={category}
          tasks={tasks || []}
        />
      </Suspense>
    </div>
  );
}

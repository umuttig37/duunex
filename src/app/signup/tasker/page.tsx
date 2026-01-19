import BecomeTaskerCTA from '@/components/features/auth/become-tasker-cta';
import TaskerSignupForm from '@/components/features/auth/tasker-signup-form';

export default async function TaskerSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; category?: string }>;
}) {
  const { region, category } = await searchParams;
  // If region or category is missing, render the call-to-action page
  if (!region || !category) {
    return <BecomeTaskerCTA />;
  }

  // Otherwise, render the multi-step tasker signup form
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-4">Ryhdy Tekijäksi</h1>
        <TaskerSignupForm initialCategoryId={category} initialRegionId={region} />
      </div>
    </main>
  );
}

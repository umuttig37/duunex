'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { categoriesWithIcons } from '@/constants/categories-with-icons';
import { Database } from '@/lib/supabase/database.types';
import { Calendar, Clock, Euro, HelpCircle, MapPin, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type Task = Database['public']['Tables']['tasks']['Row'] & {
  categories?: {
    name_fi?: string | null;
    icon_url?: string | null;
  } | null;
  publisher?: {
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
  } | null;
  task_attachments?: {
    id: string;
    file_url?: string | null;
    file_type?: string | null;
  }[] | null;
};

type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryTasksContentProps {
  category: Category;
  tasks: Task[];
}

export default function CategoryTasksContent({ category, tasks }: CategoryTasksContentProps) {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'budget'>('newest');

  const categoryWithIcon = categoriesWithIcons.find((item) => item.slug === category.slug);
  const IconComponent = categoryWithIcon?.icon || HelpCircle;

  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return (
          (b.created_at ? new Date(b.created_at).getTime() : 0) -
          (a.created_at ? new Date(a.created_at).getTime() : 0)
        );
      case 'oldest':
        return (
          (a.created_at ? new Date(a.created_at).getTime() : 0) -
          (b.created_at ? new Date(b.created_at).getTime() : 0)
        );
      case 'budget':
        return (Number(b.budget) || 0) - (Number(a.budget) || 0);
      default:
        return 0;
    }
  });

  const formatDate = (value: string | null) => {
    if (!value) {
      return 'Ei määritelty';
    }

    return new Date(value).toLocaleDateString('fi-FI', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatBudget = (budget: number | string | null) => {
    if (!budget) return 'Ei määritelty';
    const amount = typeof budget === 'string' ? parseFloat(budget) : budget;
    return `${amount.toFixed(0)} €`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-sky-600 to-orange-500 p-4 text-white">
            <IconComponent className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{category.name_fi}</h1>
            <p className="text-gray-600">{category.description_fi || category.description}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Badge variant="outline" className="w-fit text-sm">
            {tasks.length} avointa tehtävää
          </Badge>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild>
              <Link href={`/dashboard/tasks/new?category=${category.slug}`}>Luo uusi tehtävä</Link>
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Järjestä:</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as 'newest' | 'oldest' | 'budget')}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="newest">Uusimmat ensin</option>
                <option value="oldest">Vanhimmat ensin</option>
                <option value="budget">Budjetin mukaan</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="py-14 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <IconComponent className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Ei avoimia tehtäviä tässä kategoriassa
          </h3>
          <p className="mb-6 text-gray-600">
            Ole ensimmäinen, joka luo tehtävän tähän kategoriaan.
          </p>
          <Button asChild>
            <Link href={`/dashboard/tasks/new?category=${category.slug}`}>Luo ensimmäinen tehtävä</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedTasks.map((task) => (
            <Card key={task.id} className="transition-shadow duration-200 hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="line-clamp-2 text-lg font-semibold transition-colors hover:text-sky-600">
                    <Link href={`/dashboard/tasks/${task.id}`}>{task.title}</Link>
                  </CardTitle>
                  <Badge variant="secondary" className="bg-sky-100 text-sky-800 border-sky-200">
                    Avoin
                  </Badge>
                </div>
                {task.budget && (
                  <div className="flex items-center gap-1 text-lg font-bold text-sky-600">
                    <Euro className="h-4 w-4" />
                    {formatBudget(task.budget)}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <CardDescription className="line-clamp-3 text-gray-700">
                  {task.description}
                </CardDescription>

                <div className="space-y-2 text-sm text-gray-600">
                  {task.location_text && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{task.location_text}</span>
                    </div>
                  )}

                  {task.scheduled_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(task.scheduled_date)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Luotu {formatDate(task.created_at)}</span>
                  </div>
                </div>

                {task.publisher && (
                  <div className="flex items-center gap-3 border-t border-gray-100 pt-3">
                    {task.publisher.avatar_url ? (
                      <Image
                        src={task.publisher.avatar_url}
                        alt=""
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300">
                        <User className="h-3 w-3 text-gray-600" />
                      </div>
                    )}
                    <span className="text-sm text-gray-700">
                      {task.publisher.first_name} {task.publisher.last_name}
                    </span>
                  </div>
                )}

                <Button asChild className="w-full">
                  <Link href={`/dashboard/tasks/${task.id}`}>Näytä tehtävä</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Button variant="outline" asChild>
          <Link href="/">Takaisin etusivulle</Link>
        </Button>
      </div>
    </div>
  );
}

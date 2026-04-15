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
  
  // Find the icon component for this category from the categoriesWithIcons array
  const categoryWithIcon = categoriesWithIcons.find(cat => cat.slug === category.slug);
  const IconComponent = categoryWithIcon?.icon || HelpCircle;
  
  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'budget':
        const budgetA = a.budget ? Number(a.budget) : 0;
        const budgetB = b.budget ? Number(b.budget) : 0;
        return budgetB - budgetA;
      default:
        return 0;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fi-FI', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatBudget = (budget: number | string | null) => {
    if (!budget) return 'Ei määritelty';
    const numBudget = typeof budget === 'string' ? parseFloat(budget) : budget;
    return `${numBudget.toFixed(0)} €`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white">
            <IconComponent className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{category.name_fi}</h1>
            <p className="text-gray-600">{category.description}</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-6">
            <Badge variant="outline" className="text-sm">
              {tasks.length} avointa tehtävää
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link href={`/dashboard/tasks/new?category=${category.id}`}>
                Luo uusi tehtävä
              </Link>
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Järjestä:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'budget')}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Uusimmat ensin</option>
                <option value="oldest">Vanhimmat ensin</option>
                <option value="budget">Budjetin mukaan</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      {sortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <IconComponent className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ei avoimia tehtäviä tässä kategoriassa
          </h3>
          <p className="text-gray-600 mb-6">
            Ole ensimmäinen joka luo tehtävän tähän kategoriaan!
          </p>
          <Button asChild>
            <Link href={`/dashboard/tasks/new?category=${category.id}`}>
              Luo ensimmäinen tehtävä
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold line-clamp-2 hover:text-blue-600 transition-colors">
                    <Link href={`/dashboard/tasks/${task.id}`}>
                      {task.title}
                    </Link>
                  </CardTitle>
                  <Badge variant="secondary" className="ml-2 bg-sky-100 text-sky-800 border-sky-200">
                    Avoin
                  </Badge>
                </div>
                {task.budget && (
                  <div className="flex items-center gap-1 text-lg font-bold text-sky-600">
                    <Euro className="w-4 h-4" />
                    {formatBudget(task.budget)}
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-gray-700 line-clamp-3">
                  {task.description}
                </CardDescription>

                {/* Task Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  {task.location_text && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{task.location_text}</span>
                    </div>
                  )}
                  
                  {task.scheduled_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(task.scheduled_date)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Luotu {formatDate(task.created_at)}</span>
                  </div>
                </div>

                {/* Publisher Info */}
                {task.publisher && (
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {task.publisher.avatar_url ? (
                        <Image
                          src={task.publisher.avatar_url}
                          alt=""
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-600" />
                        </div>
                      )}
                      <span className="text-sm text-gray-700">
                        {task.publisher.first_name} {task.publisher.last_name}
                      </span>
                    </div>
                  </div>
                )}

                {/* View Task Button */}
                <Button asChild className="w-full">
                  <Link href={`/dashboard/tasks/${task.id}`}>
                    Näytä tehtävä
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Back to Categories */}
      <div className="mt-12 text-center">
        <Button variant="outline" asChild>
          <Link href="/">
            Takaisin etusivulle
          </Link>
        </Button>
      </div>
    </div>
  );
}

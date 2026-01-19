'use client';

import type { DashboardTask } from '@/app/dashboard/page';
import EnhancedOpenTasksMap from '@/components/features/dashboard/enhanced-open-tasks-map';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  Eye,
  List,
  Map as MapIcon,
  MapPin,
  Star,
  Target,
  TrendingUp
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface EnhancedTaskerMapContentProps {
  taskerId: string;
  openTasksForMap: DashboardTask[];
  taskerCategories?: string[];
}

export default function EnhancedTaskerMapContent({
  taskerId,
  openTasksForMap,
  taskerCategories = []
}: EnhancedTaskerMapContentProps) {
  const [activeView, setActiveView] = useState<'map' | 'stats'>('map');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const tasksCount = openTasksForMap?.length || 0;

  // Filter tasks by category if selected
  const filteredTasks = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') return openTasksForMap;
    return openTasksForMap.filter(task =>
      task.categories?.name_fi?.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  }, [openTasksForMap, selectedCategory]);

  // Get unique categories from tasks
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    openTasksForMap.forEach(task => {
      if (task.categories?.name_fi) {
        categories.add(task.categories.name_fi);
      }
    });
    return Array.from(categories);
  }, [openTasksForMap]);

  // Task statistics
  const taskStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    return {
      total: openTasksForMap.length,
      newToday: openTasksForMap.filter(task =>
        new Date(task.created_at) >= today
      ).length,
      newYesterday: openTasksForMap.filter(task => {
        const created = new Date(task.created_at);
        return created >= yesterday && created < today;
      }).length,
      urgent: openTasksForMap.filter(task => {
        try {
          if (!task.scheduled_date) return false;
          const now = Date.now();
          const scheduledMs = new Date(task.scheduled_date as unknown as string).getTime();
          if (isNaN(scheduledMs)) return false;
          const hoursUntil = (scheduledMs - now) / (1000 * 60 * 60);
          return hoursUntil <= 72; // within 3 days considered urgent
        } catch {
          return false;
        }
      }).length,
      highBudget: openTasksForMap.filter(task =>
        task.budget && task.budget > 200
      ).length,
      averageBudget: openTasksForMap.reduce((sum, task) =>
        sum + (task.budget || 0), 0
      ) / (openTasksForMap.filter(task => task.budget).length || 1),
      noOffers: openTasksForMap.filter(task =>
        !task.offers_count || task.offers_count === 0
      ).length
    };
  }, [openTasksForMap]);

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <MapIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">Tehtäväkartta</CardTitle>
                <CardDescription className="text-blue-700">
                  {tasksCount > 0 ? `${tasksCount} avointa tehtävää alueellasi` : 'Ei avoimia tehtäviä'}
                </CardDescription>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-900">{taskStats.newToday}</div>
                <div className="text-xs text-blue-600">Uusia tänään</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{taskStats.urgent}</div>
                <div className="text-xs text-blue-600">Kiireellisiä</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-600">{taskStats.noOffers}</div>
                <div className="text-xs text-blue-600">Ei tarjouksia</div>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Mobile Quick Stats */}
        <div className="md:hidden px-6 pb-4">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-blue-900">{taskStats.newToday}</div>
              <div className="text-xs text-blue-600">Uusia tänään</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">{taskStats.urgent}</div>
              <div className="text-xs text-blue-600">Kiireellisiä</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-600">{taskStats.noOffers}</div>
              <div className="text-xs text-blue-600">Ei tarjouksia</div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        {availableCategories.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="h-7 text-xs"
              >
                Kaikki ({tasksCount})
              </Button>
              {availableCategories.map((category) => {
                const count = openTasksForMap.filter(task =>
                  task.categories?.name_fi === category
                ).length;
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="h-7 text-xs"
                  >
                    {category} ({count})
                  </Button>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'map' | 'stats')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapIcon className="h-4 w-4" />
            Karttanäkymä
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Tilastot
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          {/* Instructions Card */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-blue-100 rounded-full mt-0.5">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Etsi läheltäsi</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Tehtävät näkyvät värikkäinä merkkeinä sijaintinsa mukaan
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-blue-100 rounded-full mt-0.5">
                    <Eye className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Katso tiedot</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Klikkaa merkkiä nähdäksesi tehtävän tiedot ja budjetin
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-blue-100 rounded-full mt-0.5">
                    <Star className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Tee tarjous</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Siirry tehtäväsivulle tekemään kilpailukykyinen tarjous
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Map */}
          {tasksCount > 0 ? (
            <EnhancedOpenTasksMap
              openTasks={filteredTasks}
              taskerCategories={taskerCategories}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-16 h-16 mb-4 text-gray-300">
                  <MapPin className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ei avoimia tehtäviä kartalla
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Kun uusia tehtäviä julkaistaan alueellasi, ne näkyvät täällä kartalla automaattisesti.
                </p>
                <Button variant="outline" disabled>
                  <Eye className="mr-2 h-4 w-4" />
                  Selaa kaikkia tehtäviä (tulossa)
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Uudet tehtävät
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {taskStats.newToday}
                </div>
                <p className="text-xs text-gray-600">
                  Tänään julkaistut (+{taskStats.newYesterday} eilen)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Kilpailu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 mb-1">
                  {taskStats.noOffers}
                </div>
                <p className="text-xs text-gray-600">
                  Tehtävää ilman tarjouksia
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Premium tehtävät
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {taskStats.highBudget}
                </div>
                <p className="text-xs text-gray-600">
                  Tehtävää yli 200€ budjetilla
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Keskibudjetti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {Math.round(taskStats.averageBudget)}€
                </div>
                <p className="text-xs text-gray-600">
                  Tehtävien keskimääräinen budjetti
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          {availableCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Tehtävät kategorioittain
                </CardTitle>
                <CardDescription>
                  Avoimet tehtävät jaoteltuna kategorioiden mukaan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {availableCategories.map((category) => {
                    const categoryTasks = openTasksForMap.filter(task =>
                      task.categories?.name_fi === category
                    );
                    const count = categoryTasks.length;
                    const percentage = Math.round((count / tasksCount) * 100);
                    const avgBudget = categoryTasks.reduce((sum, task) =>
                      sum + (task.budget || 0), 0
                    ) / (categoryTasks.filter(task => task.budget).length || 1);

                    return (
                      <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm">{category}</h4>
                            <span className="text-sm text-gray-600">{count} tehtävää</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1 text-xs text-gray-600">
                            <span>{percentage}% kaikista tehtävistä</span>
                            <span>Keskibudjetti: {Math.round(avgBudget)}€</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
'use client';

import OpenTasksMap from '@/components/features/dashboard/OpenTasksMap';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Zap } from 'lucide-react';
import type { DashboardTask } from './page';

interface TaskerMapContentProps {
  taskerId: string;
  openTasksForMap: DashboardTask[];
}

export default function TaskerMapContent({ taskerId, openTasksForMap }: TaskerMapContentProps) {
  const tasksCount = openTasksForMap?.length || 0;

  return (
    <div className="space-y-4">
      {/* Modern Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Lähialueen tehtävät</h2>
            <p className="text-sm text-gray-500">
              {tasksCount > 0 ? 'Klikkaa merkkiä nähdäksesi tiedot' : 'Uudet tehtävät näkyvät täällä'}
            </p>
          </div>
        </div>
        {tasksCount > 0 && (
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-medium">
            <Zap className="h-3 w-3 mr-1.5" />
            {tasksCount}
          </Badge>
        )}
      </div>

      {/* Modern Map View */}
      <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
        <CardContent className="p-0">
          {tasksCount > 0 ? (
            <div className="relative">
              <OpenTasksMap openTasks={openTasksForMap} />
              
              {/* Modern floating status */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-lg border border-white/20 z-10">
                <div className="flex items-center gap-2.5 text-sm font-medium text-gray-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                  <span>{tasksCount} avointa</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-20 text-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="mx-auto w-16 h-16 mb-6 text-gray-300">
                <MapPin className="w-full h-full" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Ei avoimia tehtäviä lähialueella
              </h3>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                Kun alueellesi tulee uusia tehtäviä, ne näkyvät automaattisesti kartalla
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
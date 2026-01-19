'use client';

import TaskerBalanceCard from '@/components/features/dashboard/tasker-balance-card';
import TaskerNotifications from '@/components/features/dashboard/tasker-notifications';
import TaskerReviews from '@/components/features/dashboard/tasker-reviews';
import CounterOffersList from '@/components/features/tasks/offers/counter-offers-list';
import TaskRequestsList from '@/components/features/tasks/task-requests-list';
import UpcomingTasks from '@/components/features/tasks/upcoming-tasks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Calendar, MapPin, Zap } from 'lucide-react';
import Link from 'next/link';
import type { DashboardTask } from './page';

interface TaskerDashboardContentProps {
  taskerId: string;
  openTasksForMap: DashboardTask[];
}

export default function TaskerDashboardContent({ taskerId }: TaskerDashboardContentProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Tekijän Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Hallitse tehtäviäsi ja pysy ajan tasalla asiakkaiden kanssa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/open-tasks">
              <MapPin className="mr-2 h-4 w-4" />
              Avoimet tehtävät
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/tasker-history">
              <BarChart3 className="mr-2 h-4 w-4" />
              Tilastot
            </Link>
          </Button>
        </div>
      </div>

      {/* Smart Notifications */}
      <TaskerNotifications taskerId={taskerId} />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/open-tasks" className="block">
            <CardContent className="p-4 text-center">
              <MapPin className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Löydä tehtäviä</p>
              <p className="text-xs text-muted-foreground">Selaile alueesi töitä</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/balance" className="block">
            <CardContent className="p-4 text-center">
              <Zap className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Saldo</p>
              <p className="text-xs text-muted-foreground">Hallitse tulojasi</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/messages" className="block">
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Viestit</p>
              <p className="text-xs text-muted-foreground">Keskustelu asiakkaiden kanssa</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/tasker-history" className="block">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Historia</p>
              <p className="text-xs text-muted-foreground">Tehdyt työt</p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tasks & Activity */}
        <div className="lg:col-span-2 space-y-6">
          <UpcomingTasks taskerId={taskerId} />
          <CounterOffersList taskerId={taskerId} />
          <TaskRequestsList taskerId={taskerId} />
        </div>

        {/* Right Column - Balance & Profile */}
        <div className="lg:col-span-1 space-y-6">
          <TaskerBalanceCard userId={taskerId} />
          <TaskerReviews taskerId={taskerId} />
        </div>
      </div>
    </div>
  );
} 
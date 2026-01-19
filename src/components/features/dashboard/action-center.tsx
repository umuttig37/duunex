'use client';

import type { DashboardTask } from '@/app/dashboard/page';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, CreditCard, Mail, Star } from 'lucide-react';

interface ActionCenterProps {
  tasks: DashboardTask[];
  onFilterChange?: (filter: string) => void;
}

export default function ActionCenter({ tasks, onFilterChange }: ActionCenterProps) {
  // Find tasks that require immediate user action
  const tasksWithOffers = tasks.filter(
    (task) => task.status === 'open' && (task.offers_count || 0) > 0
  );

  const tasksPendingPayment = tasks.filter(
    (task) => task.status === 'assigned' || task.status === 'awaiting_payment'
  );

  const tasksPendingResponse = tasks.filter(
    (task) => task.status === 'request_sent'
  );

  const disputedTasks = tasks.filter((task) => task.status === 'disputed');

  const earlyCompletedTasks = tasks.filter(
    (task) => task.status === 'early_completed'
  );

  // If no actions are required, don't show the action center
  const totalActionItems =
    tasksWithOffers.length +
    tasksPendingPayment.length +
    tasksPendingResponse.length +
    disputedTasks.length +
    earlyCompletedTasks.length;

  if (totalActionItems === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg text-orange-900">
              Toimenpiteitä vaativat
            </CardTitle>
          </div>
          <CardDescription className="text-orange-700">
            Tehtäviä, jotka vaativat huomiotasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Offers Received */}
          {tasksWithOffers.length > 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <Mail className="h-4 w-4" />
              <AlertTitle className="text-blue-900">
                Tarjouksia saapunut
              </AlertTitle>
              <AlertDescription className="text-blue-800 flex items-center justify-between">
                <span>
                  {tasksWithOffers.length} tehtävään on saapunut{' '}
                  {tasksWithOffers.reduce(
                    (total, task) => total + (task.offers_count || 0),
                    0
                  )}{' '}
                  tarjousta
                </span>
                <Button
                  size="sm"
                  className="ml-4"
                  onClick={() => onFilterChange?.('offers')}
                >
                  Tarkastele tarjouksia
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Pending Responses */}
          {tasksPendingResponse.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <Mail className="h-4 w-4" />
              <AlertTitle className="text-amber-900">
                Odottaa vastausta
              </AlertTitle>
              <AlertDescription className="text-amber-800 flex items-center justify-between">
                <span>
                  {tasksPendingResponse.length} tehtäväpyyntö odottaa tekijän vastausta
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-4 border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={() => onFilterChange?.('pending_response')}
                >
                  Näytä pyynnöt
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Pending Payments */}
          {tasksPendingPayment.length > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CreditCard className="h-4 w-4" />
              <AlertTitle className="text-green-900">Odottaa maksua</AlertTitle>
              <AlertDescription className="text-green-800 flex items-center justify-between">
                <span>{tasksPendingPayment.length} tehtävä odottaa maksua</span>
                <Button
                  size="sm"
                  className="ml-4"
                  onClick={() => onFilterChange?.('payment')}
                >
                  Maksa tehtävät
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Disputed Tasks */}
          {disputedTasks.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-red-900">
                Riitautetut tehtävät
              </AlertTitle>
              <AlertDescription className="text-red-800 flex items-center justify-between">
                <span>{disputedTasks.length} tehtävä vaatii huomiota</span>
                <Button
                  size="sm"
                  variant="destructive"
                  className="ml-4"
                  onClick={() => onFilterChange?.('disputed')}
                >
                  Käsittele riita
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Early Completed Tasks */}
          {earlyCompletedTasks.length > 0 && (
            <Alert className="border-purple-200 bg-purple-50">
              <Star className="h-4 w-4" />
              <AlertTitle className="text-purple-900">
                Odottaa vahvistusta
              </AlertTitle>
              <AlertDescription className="text-purple-800 flex items-center justify-between">
                <span>
                  {earlyCompletedTasks.length} tehtävä odottaa vahvistustasi
                </span>
                <Button
                  size="sm"
                  className="ml-4"
                  onClick={() => onFilterChange?.('confirmation')}
                >
                  Vahvista valmistuminen
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

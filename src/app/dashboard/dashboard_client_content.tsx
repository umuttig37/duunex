'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Database } from '@/lib/supabase/database.types';
import { Briefcase, History, ListChecks, MapPin, Receipt, Clock, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Import the refactored and new components
import TaskerActiveTasksContent from './tasker-active-tasks-content';
import TaskerDashboardContent from './tasker-dashboard-content';
import TaskerEventsContent from './tasker-events-content';
import TaskerHistoryContent from './tasker-history-content'; // Newly added import for TaskerHistoryContent
import TaskerMapContent from './tasker-map-content'; // Added import for TaskerMapContent
import UserDashboardContent from './user-dashboard-content'; // Assuming this exists or will be created for user tasks
import UserEventsContent from './user-events-content';

// Type for tasks passed to this client component, ensure it matches what DashboardPage fetches
export type DashboardTask = Database['public']['Tables']['tasks']['Row'] & {
  categories?: Pick<
    Database['public']['Tables']['categories']['Row'],
    'name_fi' | 'icon_url'
  > | null;
  assigned_tasker_profile?: Pick<
    Database['public']['Tables']['profiles']['Row'],
    'id' | 'first_name' | 'last_name' | 'avatar_url'
  > | null;
  user_profile?: Pick<
    Database['public']['Tables']['profiles']['Row'],
    'id' | 'first_name' | 'last_name' | 'avatar_url'
  > | null;
  task_attachments?:
    | Pick<
        Database['public']['Tables']['task_attachments']['Row'],
        'id' | 'file_url' | 'file_type'
      >[]
    | null;
};

interface DashboardClientContentProps {
  user: Database['public']['Tables']['profiles']['Row'];
  tasks: DashboardTask[];
  openTasksForMap: DashboardTask[];
  currentUserId: string;
}

interface TaskerApplicationStatus {
  status: string;
  submitted_at: string | null;
  review_notes: string | null;
}

export default function DashboardClientContent({
  user,
  tasks: initialTasks,
  openTasksForMap,
  currentUserId,
}: DashboardClientContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [notification, setNotification] = useState<{type: 'info' | 'success', message: string, taskId?: string} | null>(null);
  const [taskerApplication, setTaskerApplication] = useState<TaskerApplicationStatus | null>(null);
  
  const currentView =
    searchParams.get('view') || (user.role === 'tasker' ? 'tyopoyta' : 'tasks'); // Default view
  const currentFilter = searchParams.get('filter') || null; // Parse filter parameter

  // Check for notification messages from URL parameters
  useEffect(() => {
    const message = searchParams.get('message');
    const taskId = searchParams.get('taskId');
    
    if (message === 'task_submitted_for_review' && taskId) {
      setNotification({
        type: 'info',
        message: 'Tehtäväsi on lähetetty ylläpidon tarkastettavaksi. Saat ilmoituksen kun tehtävä on hyväksytty ja julkaistu.',
        taskId
      });
    } else if (message === 'tasker_assigned' && taskId) {
      setNotification({
        type: 'success',
        message: 'Tekijä on määritetty tehtävääsi! Saat pian yhteydenoton valitulta tekijältä.',
        taskId
      });
      
      // Clear URL parameters after showing notification
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('message');
      newUrl.searchParams.delete('taskId');
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, router]);

  // Fetch tasker application status for unverified taskers
  useEffect(() => {
    if (user.role === 'tasker' && !user.is_verified) {
      const fetchTaskerApplication = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('tasker_applications')
          .select('status, submitted_at, review_notes')
          .eq('profile_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching tasker application:', error);
        } else {
          setTaskerApplication(data);
        }
      };

      fetchTaskerApplication();
    }
  }, [user.role, user.is_verified, user.id]);

  const handleTaskerViewChange = (view: string) => {
    const params = new URLSearchParams();
    params.set('view', view);
    if (currentFilter) params.set('filter', currentFilter);
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleUserViewChange = (view: string) => {
    const params = new URLSearchParams();
    params.set('view', view);
    if (currentFilter) params.set('filter', currentFilter);
    router.push(`/dashboard?${params.toString()}`);
  };

  const getHeaderText = () => {
    if (user.role === 'tasker') {
      if (currentView === 'tyopoyta') return 'Tasker Työpöytä';
      if (currentView === 'kartta') return 'Tehtäväkartta';
      if (currentView === 'active') return 'Aktiiviset Tehtävät';
      if (currentView === 'history') return 'Työhistoria';
      if (currentView === 'events') return 'Tapahtumat';
    } else {
      if (currentView === 'events') return 'Tapahtumat';
    }
    return 'Työpöytäni'; // Default for user or other cases
  };

  return (
    <>
      <header className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
          {getHeaderText()}
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Tervetuloa takaisin, {user.first_name || 'Käyttäjä'}!
        </p>
      </header>

      {notification && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {notification.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Unverified Tasker Warning */}
      {user.role === 'tasker' && !user.is_verified && taskerApplication && (
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <div className="font-semibold text-amber-800 mb-2">
              {taskerApplication.status === 'pending' && 'Hakemuksesi käsittelyssä'}
              {taskerApplication.status === 'under_review' && 'Tarkistamme hakemustasi'}
              {taskerApplication.status === 'rejected' && 'Hakemus hylätty'}
            </div>
            <AlertDescription className="text-amber-700">
              {taskerApplication.status === 'pending' && (
                <>
                  Tekijähakemuksesi on käsittelyssä. Tarkistamme hakemuksesi 1-2 arkipäivässä.
                  <br />
                  <span className="text-sm">Et voi vielä hakea tehtäviä tai vastaanottaa tehtävätarjouksia.</span>
                </>
              )}
              {taskerApplication.status === 'under_review' && (
                <>
                  Tarkistamme hakemustasi ja otamme yhteyttä pian.
                  <br />
                  <span className="text-sm">Et voi vielä hakea tehtäviä tai vastaanottaa tehtävätarjouksia.</span>
                </>
              )}
              {taskerApplication.status === 'rejected' && taskerApplication.review_notes && (
                <>
                  Valitettavasti hakemuksesi hylättiin. Syy: {taskerApplication.review_notes}
                  <br />
                  <span className="text-sm">Voit ottaa yhteyttä tukeen saadaksesi lisätietoja.</span>
                </>
              )}
              {taskerApplication.status === 'rejected' && !taskerApplication.review_notes && (
                <>
                  Valitettavasti hakemuksesi hylättiin.
                  <br />
                  <span className="text-sm">Ota yhteyttä tukeen saadaksesi lisätietoja.</span>
                </>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Warning for verified taskers who might be temporarily restricted */}
      {user.role === 'tasker' && user.is_verified && taskerApplication?.status === 'suspended' && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <Shield className="h-5 w-5 text-red-600" />
          <div>
            <div className="font-semibold text-red-800 mb-2">Tilisi on tilapäisesti rajoitettu</div>
            <AlertDescription className="text-red-700">
              Tekijätilisi on tilapäisesti rajoitettu. Ota yhteyttä asiakaspalveluun saadaksesi lisätietoja.
              {taskerApplication.review_notes && (
                <>
                  <br />
                  <span className="text-sm">Syy: {taskerApplication.review_notes}</span>
                </>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {user.role === 'tasker' && (
        <div className="mb-4 sm:mb-6 border-b pb-3 sm:pb-4">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-hide">
            <Button
              variant={currentView === 'tyopoyta' ? 'default' : 'outline'}
              onClick={() => handleTaskerViewChange('tyopoyta')}
              className="flex items-center whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-w-fit"
            >
              <Briefcase className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Työpöytä</span>
              <span className="xs:hidden">Työ</span>
            </Button>
            <Button
              variant={currentView === 'kartta' ? 'default' : 'outline'}
              onClick={() => handleTaskerViewChange('kartta')}
              className="flex items-center whitespace-nowrap border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:from-blue-100 hover:to-indigo-100 shadow-sm text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-w-fit"
            >
              <MapPin className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Tehtäväkartta</span>
              <span className="xs:hidden">Kartta</span>
            </Button>
            <Button
              variant={currentView === 'active' ? 'default' : 'outline'}
              onClick={() => handleTaskerViewChange('active')}
              className="flex items-center whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-w-fit"
            >
              <ListChecks className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Aktiiviset Tehtävät</span>
              <span className="xs:hidden">Aktv</span>
            </Button>
            <Button
              variant={currentView === 'events' ? 'default' : 'outline'}
              onClick={() => handleTaskerViewChange('events')}
              className="flex items-center whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-w-fit"
            >
              <Receipt className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Tapahtumat</span>
              <span className="xs:hidden">Tapahtumat</span>
            </Button>
            <Button
              variant={currentView === 'history' ? 'default' : 'outline'}
              onClick={() => handleTaskerViewChange('history')}
              className="flex items-center whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-w-fit"
            >
              <History className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Työhistoria</span>
              <span className="xs:hidden">Hist</span>
            </Button>
          </div>
        </div>
      )}

      {user.role === 'user' && (
        <div className="mb-4 sm:mb-6 border-b pb-3 sm:pb-4">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-hide">
            <Button
              variant={currentView === 'tasks' ? 'default' : 'outline'}
              onClick={() => handleUserViewChange('tasks')}
              className="flex items-center whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-w-fit"
            >
              <ListChecks className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Omat tehtävät</span>
              <span className="xs:hidden">Tehtävät</span>
            </Button>
            <Button
              variant={currentView === 'events' ? 'default' : 'outline'}
              onClick={() => handleUserViewChange('events')}
              className="flex items-center whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-w-fit"
            >
              <Receipt className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Tapahtumat</span>
              <span className="xs:hidden">Tapahtumat</span>
            </Button>
          </div>
        </div>
      )}

      {user.role === 'tasker' && currentView === 'tyopoyta' && (
        <TaskerDashboardContent
          taskerId={currentUserId}
          openTasksForMap={openTasksForMap}
        />
      )}
      {user.role === 'tasker' && currentView === 'kartta' && (
        <TaskerMapContent
          taskerId={currentUserId}
          openTasksForMap={openTasksForMap}
        />
      )}
      {user.role === 'tasker' && currentView === 'active' && (
        <TaskerActiveTasksContent
          tasks={initialTasks}
          currentUserId={currentUserId}
        />
      )}
      {user.role === 'tasker' && currentView === 'events' && (
        <TaskerEventsContent userId={currentUserId} />
      )}
      {user.role === 'tasker' && currentView === 'history' && (
        <TaskerHistoryContent
          tasks={initialTasks}
          currentUserId={currentUserId}
        />
      )}

      {user.role === 'user' && currentView === 'tasks' && (
        // UserDashboardContent receives tasks already filtered for them by page.tsx
        <UserDashboardContent
          tasks={initialTasks}
          currentUserId={currentUserId}
          activeFilter={currentFilter}
        />
      )}
      {user.role === 'user' && currentView === 'events' && (
        <UserEventsContent userId={currentUserId} />
      )}
      {user.role === 'user' &&
        !currentView.startsWith('tasks') &&
        !currentView.startsWith('events') && (
          // Default view for users
          <UserDashboardContent
            tasks={initialTasks}
            currentUserId={currentUserId}
            activeFilter={currentFilter}
          />
        )}
    </>
  );
}

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
          .maybeSingle();

        if (error) {
          console.error('Error fetching tasker application:', error);
        } else if (data) {
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
        <div className="bg-primary/5 rounded-2xl p-6 sm:p-8 border border-primary/10/50 shadow-sm">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary h-12 ">
            {getHeaderText()}
          </h1>
          <p className="text-slate-600 mt-2 text-base sm:text-lg">
            Tervetuloa takaisin, <span className="font-semibold text-slate-800">{user.first_name || 'Käyttäjä'}</span>!
          </p>
        </div>
      </header>

      {notification && (
        <Alert className="mb-6 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-sm">
          <Clock className="h-5 w-5 text-indigo-600" />
          <AlertDescription className="text-slate-700 font-medium">
            {notification.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Unverified Tasker Warning */}
      {user.role === 'tasker' && !user.is_verified && taskerApplication && (
        <Alert className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <div className="font-bold text-amber-900 mb-2 text-lg">
              {taskerApplication.status === 'pending' && 'Hakemuksesi käsittelyssä'}
              {taskerApplication.status === 'under_review' && 'Tarkistamme hakemustasi'}
              {taskerApplication.status === 'rejected' && 'Hakemus hylätty'}
            </div>
            <AlertDescription className="text-slate-700">
              {taskerApplication.status === 'pending' && (
                <>
                  Tekijähakemuksesi on käsittelyssä. Tarkistamme hakemuksesi 1-2 arkipäivässä.
                  <br />
                  <span className="text-sm text-slate-600 mt-1 inline-block">Et voi vielä hakea tehtäviä tai vastaanottaa tehtävätarjouksia.</span>
                </>
              )}
              {taskerApplication.status === 'under_review' && (
                <>
                  Tarkistamme hakemustasi ja otamme yhteyttä pian.
                  <br />
                  <span className="text-sm text-slate-600 mt-1 inline-block">Et voi vielä hakea tehtäviä tai vastaanottaa tehtävätarjouksia.</span>
                </>
              )}
              {taskerApplication.status === 'rejected' && taskerApplication.review_notes && (
                <>
                  Valitettavasti hakemuksesi hylättiin. Syy: {taskerApplication.review_notes}
                  <br />
                  <span className="text-sm text-slate-600 mt-1 inline-block">Voit ottaa yhteyttä tukeen saadaksesi lisätietoja.</span>
                </>
              )}
              {taskerApplication.status === 'rejected' && !taskerApplication.review_notes && (
                <>
                  Valitettavasti hakemuksesi hylättiin.
                  <br />
                  <span className="text-sm text-slate-600 mt-1 inline-block">Ota yhteyttä tukeen saadaksesi lisätietoja.</span>
                </>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Warning for verified taskers who might be temporarily restricted */}
      {user.role === 'tasker' && user.is_verified && taskerApplication?.status === 'suspended' && (
        <Alert className="mb-6 border-red-200 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl shadow-sm">
          <Shield className="h-5 w-5 text-red-600" />
          <div>
            <div className="font-bold text-red-900 mb-2 text-lg">Tilisi on tilapäisesti rajoitettu</div>
            <AlertDescription className="text-slate-700">
              Tekijätilisi on tilapäisesti rajoitettu. Ota yhteyttä asiakaspalveluun saadaksesi lisätietoja.
              {taskerApplication.review_notes && (
                <>
                  <br />
                  <span className="text-sm text-slate-600 mt-1 inline-block">Syy: {taskerApplication.review_notes}</span>
                </>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {user.role === 'tasker' && (
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-2 shadow-sm border border-slate-200/50 overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2 min-w-fit">
              <Button
                variant={currentView === 'tyopoyta' ? 'default' : 'ghost'}
                onClick={() => handleTaskerViewChange('tyopoyta')}
                className={`flex items-center whitespace-nowrap text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all ${
                  currentView === 'tyopoyta' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-600 hover:to-emerald-700' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Briefcase className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span>Työpöytä</span>
              </Button>
              <Button
                variant={currentView === 'kartta' ? 'default' : 'ghost'}
                onClick={() => handleTaskerViewChange('kartta')}
                className={`flex items-center whitespace-nowrap text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all ${
                  currentView === 'kartta' 
                    ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md hover:from-indigo-600 hover:to-blue-600' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <MapPin className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span>Tehtäväkartta</span>
              </Button>
              <Button
                variant={currentView === 'active' ? 'default' : 'ghost'}
                onClick={() => handleTaskerViewChange('active')}
                className={`flex items-center whitespace-nowrap text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all ${
                  currentView === 'active' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-600 hover:to-emerald-700' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ListChecks className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Aktiiviset</span>
                <span className="sm:hidden">Aktv</span>
              </Button>
              <Button
                variant={currentView === 'events' ? 'default' : 'ghost'}
                onClick={() => handleTaskerViewChange('events')}
                className={`flex items-center whitespace-nowrap text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all ${
                  currentView === 'events' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-600 hover:to-emerald-700' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Receipt className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span>Tapahtumat</span>
              </Button>
              <Button
                variant={currentView === 'history' ? 'default' : 'ghost'}
                onClick={() => handleTaskerViewChange('history')}
                className={`flex items-center whitespace-nowrap text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all ${
                  currentView === 'history' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-600 hover:to-emerald-700' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <History className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Historia</span>
                <span className="sm:hidden">Hist</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {user.role === 'user' && (
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-2 shadow-sm border border-slate-200/50 overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2 min-w-fit">
              <Button
                variant={currentView === 'tasks' ? 'default' : 'ghost'}
                onClick={() => handleUserViewChange('tasks')}
                className={`flex items-center whitespace-nowrap text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all ${
                  currentView === 'tasks' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-600 hover:to-emerald-700' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ListChecks className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span>Omat tehtävät</span>
              </Button>
              <Button
                variant={currentView === 'events' ? 'default' : 'ghost'}
                onClick={() => handleUserViewChange('events')}
                className={`flex items-center whitespace-nowrap text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all ${
                  currentView === 'events' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-600 hover:to-emerald-700' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Receipt className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span>Tapahtumat</span>
              </Button>
            </div>
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

'use client';

import { DashboardTask } from '@/app/dashboard/page';
import ActionCenter from '@/components/features/dashboard/action-center';
import TaskFilterBar from '@/components/features/dashboard/task-filter-bar';
import TaskMobileView from '@/components/features/dashboard/task-mobile-view';
import TaskTableView from '@/components/features/dashboard/task-table-view';
import UserNotifications from '@/components/features/dashboard/user-notifications';
import CompactTaskCard from '@/components/features/tasks/detail/compact-task-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type UserDashboardContentProps = {
  tasks: DashboardTask[];
  currentUserId: string;
  activeFilter: string | null;
};

const TaskGrid = ({
  tasks,
  currentUserId,
}: {
  tasks: DashboardTask[];
  currentUserId: string;
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
    {tasks.map((task) => (
      <CompactTaskCard
        key={task.id}
        task={task}
        currentUserId={currentUserId}
      />
    ))}
  </div>
);

const UserDashboardContent = ({
  tasks,
  currentUserId,
  activeFilter: initialActiveFilter,
}: UserDashboardContentProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState(initialActiveFilter);
  const [sortOption, setSortOption] = useState('newest');
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  
  // New state for enhanced functionality
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'mobile'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  
  // Advanced filters
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [budgetRange, setBudgetRange] = useState<{ min?: number; max?: number }>({});
  const [hasOffers, setHasOffers] = useState(false);
  const [hasMessages, setHasMessages] = useState(false);

  useEffect(() => {
    setActiveFilter(initialActiveFilter);
  }, [initialActiveFilter]);

  // Responsive view mode detection
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('mobile');
      } else if (viewMode === 'mobile') {
        setViewMode('table');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const getFilteredTasks = (filter: string | null) => {
    let filteredTasks = tasks;

    // Apply special filters from ActionCenter
    if (filter === 'offers') {
      filteredTasks = filteredTasks.filter((task) => 
        task.status === 'open' && (task.offers_count || 0) > 0
      );
    } else if (filter === 'payment') {
      filteredTasks = filteredTasks.filter((task) => task.status === 'assigned' || task.status === 'awaiting_payment');
    } else if (filter === 'pending_response') {
      filteredTasks = filteredTasks.filter((task) => 
        task.status === 'request_sent'
      );
    } else if (filter === 'disputed') {
      filteredTasks = filteredTasks.filter((task) => task.status === 'disputed');
    } else if (filter === 'confirmation') {
      filteredTasks = filteredTasks.filter((task) => task.status === 'early_completed');
    } else if (filter && filter !== 'all') {
      // Handle legacy filters
      if (filter === 'has-offers') filteredTasks = filteredTasks.filter((task) => (task.offers_count || 0) > 0);
      if (filter === 'has-messages') filteredTasks = filteredTasks.filter((task) => (task.message_count || 0) > 0);
      if (filter === 'is-scheduled') filteredTasks = filteredTasks.filter((task) => !!task.scheduled_date);
      
      // Status filters
      if (['open', 'paid', 'in_progress', 'completed', 'cancelled', 'disputed'].includes(filter)) {
        filteredTasks = filteredTasks.filter((task) => task.status === filter);
      }
      if (filter === 'in-progress') {
        filteredTasks = filteredTasks.filter((task) => 
          ['open', 'paid', 'in_progress', 'assigned', 'awaiting_payment'].includes(task.status)
        );
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter((task) =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.location_text?.toLowerCase().includes(query) ||
        task.categories?.name_fi?.toLowerCase().includes(query)
      );
    }

    // Apply advanced filters
    if (hasOffers) {
      filteredTasks = filteredTasks.filter((task) => (task.offers_count || 0) > 0);
    }

    if (hasMessages) {
      filteredTasks = filteredTasks.filter((task) => (task.message_count || 0) > 0);
    }

    if (dateRange.from) {
      filteredTasks = filteredTasks.filter((task) => {
        const taskDate = new Date(task.scheduled_date || task.created_at);
        const fromDate = dateRange.from!;
        const toDate = dateRange.to || new Date();
        return taskDate >= fromDate && taskDate <= toDate;
      });
    }

    if (budgetRange.min !== undefined || budgetRange.max !== undefined) {
      filteredTasks = filteredTasks.filter((task) => {
        const price = task.accepted_offer?.offered_price ?? task.budget;
        if (!price) return false;
        
        const min = budgetRange.min ?? 0;
        const max = budgetRange.max ?? Number.MAX_SAFE_INTEGER;
        return price >= min && price <= max;
      });
    }

    return filteredTasks;
  };

  const sortTasks = (tasksToSort: DashboardTask[], option: string) => {
    return [...tasksToSort].sort((a, b) => {
      switch (option) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'budget-high':
          const priceA = a.accepted_offer?.offered_price ?? a.budget ?? 0;
          const priceB = b.accepted_offer?.offered_price ?? b.budget ?? 0;
          return priceB - priceA;
        case 'budget-low':
          const priceA2 = a.accepted_offer?.offered_price ?? a.budget ?? 0;
          const priceB2 = b.accepted_offer?.offered_price ?? b.budget ?? 0;
          return priceA2 - priceB2;
        case 'most-offers':
          return (b.offers_count || 0) - (a.offers_count || 0);
        case 'scheduled-soon':
          if (!a.scheduled_date && !b.scheduled_date) return 0;
          if (!a.scheduled_date) return 1;
          if (!b.scheduled_date) return -1;
          return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  };

  const handleTableSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
    
    // Map table sort to existing sort options
    if (column === 'created_at') {
      setSortOption(direction === 'desc' ? 'newest' : 'oldest');
    } else if (column === 'budget') {
      setSortOption(direction === 'desc' ? 'budget-high' : 'budget-low');
    } else if (column === 'scheduled_date') {
      setSortOption('scheduled-soon');
    }
  };

  const filteredTasks = useMemo(
    () => getFilteredTasks(activeFilter),
    [activeFilter, tasks, searchQuery, hasOffers, hasMessages, dateRange, budgetRange]
  );
  
  const sortedTasks = useMemo(
    () => sortTasks(filteredTasks, sortOption),
    [filteredTasks, sortOption]
  );

  const handleFilterChange = (value: string) => {
    // Pure client-side filtering without page reload
    if (value === 'all') {
      setActiveFilter(null);
    } else {
      setActiveFilter(value);
    }
  };

  const clearAllFilters = () => {
    // Pure client-side filter clearing without page reload
    setSearchQuery('');
    setHasOffers(false);
    setHasMessages(false);
    setDateRange({});
    setBudgetRange({});
    setActiveFilter(null);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (hasOffers) count++;
    if (hasMessages) count++;
    if (dateRange.from) count++;
    if (budgetRange.min !== undefined || budgetRange.max !== undefined) count++;
    if (activeFilter && activeFilter !== 'all') count++;
    return count;
  };

  const handleSelectTask = (taskId: string, selected: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (selected) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Omat Tehtävät
          </h1>
          <p className="text-sm text-muted-foreground">
            Hallinnoi tehtäviäsi ja pysy ajan tasalla.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/tasks/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Luo uusi tehtävä
          </Link>
        </Button>
      </div>

      {/* Smart Notifications */}
      <UserNotifications userId={currentUserId} />

      <ActionCenter tasks={tasks} onFilterChange={handleFilterChange} />

      {/* Special Filter Alert - Keep but make it more minimal */}
      {(activeFilter === 'offers' || 
        activeFilter === 'payment' || 
        activeFilter === 'disputed' || 
        activeFilter === 'confirmation') && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="font-medium text-slate-700">
              {activeFilter === 'offers' && 'Tehtävät tarjouksilla'}
              {activeFilter === 'payment' && 'Odottavat maksua'}
              {activeFilter === 'disputed' && 'Riitautetut'}
              {activeFilter === 'confirmation' && 'Odottavat vahvistusta'}
            </span>
            <span className="text-slate-500">({sortedTasks.length})</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFilterChange('all')}
            className="text-slate-600 hover:text-slate-800 h-6 px-2"
          >
            ✕
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="p-4 border-b">
          <TaskFilterBar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={activeFilter || 'all'}
            onStatusFilterChange={handleFilterChange}
            sortOption={sortOption}
            onSortOptionChange={setSortOption}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            budgetRange={budgetRange}
            onBudgetRangeChange={setBudgetRange}
            hasOffers={hasOffers}
            onHasOffersChange={setHasOffers}
            hasMessages={hasMessages}
            onHasMessagesChange={setHasMessages}
            activeFilters={getActiveFiltersCount()}
            onClearAllFilters={clearAllFilters}
          />
        </CardHeader>
        
        <CardContent className="p-4">
          {sortedTasks.length > 0 ? (
            <>
              {/* Desktop Table View */}
              {viewMode === 'table' && (
                <div className="hidden md:block">
                  <TaskTableView
                    tasks={sortedTasks}
                    currentUserId={currentUserId}
                    onSort={handleTableSort}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                  />
                </div>
              )}

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="hidden md:block">
                  <TaskGrid tasks={sortedTasks} currentUserId={currentUserId} />
                </div>
              )}

              {/* Mobile View */}
              {(viewMode === 'mobile' || viewMode === 'table') && (
                <div className="md:hidden">
                  <TaskMobileView
                    tasks={sortedTasks}
                    currentUserId={currentUserId}
                    selectedTasks={selectedTasks}
                    onSelectTask={handleSelectTask}
                  />
                </div>
              )}

              {/* Grid view for smaller screens when grid is selected */}
              {viewMode === 'grid' && (
                <div className="md:hidden">
                  <TaskGrid tasks={sortedTasks} currentUserId={currentUserId} />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold">Ei tehtäviä</h3>
              <p className="text-muted-foreground mt-2">
                {searchQuery || getActiveFiltersCount() > 0
                  ? 'Hakuehdoillasi ei löytynyt tehtäviä. Kokeile muuttaa hakuehtoja.'
                  : 'Et ole vielä luonut tehtäviä.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                {(searchQuery || getActiveFiltersCount() > 0) && (
                  <Button variant="outline" onClick={clearAllFilters}>
                    Tyhjennä suodattimet
                  </Button>
                )}
                <Button asChild>
                  <Link href="/dashboard/tasks/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> 
                    {tasks.length === 0 ? 'Luo ensimmäinen tehtäväsi' : 'Luo uusi tehtävä'}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboardContent;

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Edit, Hammer, Home, Laptop, Car, Briefcase, Heart, Wrench, Paintbrush, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from './StatusBadge';

interface TaskHeaderProps {
  title: string;
  category?: {
    name_fi?: string;
    name?: string;
  };
  status: string;
  createdAt: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  backHref?: string;
  isTaskOwner?: boolean;
  taskId?: string;
  offers?: any[] | null;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Ei määritelty';
  return new Date(dateString).toLocaleDateString('fi-FI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTimeSlot = (timeSlot: string | null) => {
  if (!timeSlot) return 'Joustava';
  const slots: { [key: string]: string } = {
    morning: 'Aamupäivä',
    afternoon: 'Iltapäivä', 
    evening: 'Ilta',
    flexible: 'Joustava',
  };
  return slots[timeSlot] || timeSlot;
};

// Category icon mapping
const getCategoryIcon = (categoryName: string | undefined) => {
  if (!categoryName) return Briefcase;
  
  const name = categoryName.toLowerCase();
  if (name.includes('siivous') || name.includes('cleaning')) return ShieldCheck;
  if (name.includes('kodinhoito') || name.includes('household')) return Home;
  if (name.includes('muutto') || name.includes('moving')) return Car;
  if (name.includes('korjaus') || name.includes('repair')) return Wrench;
  if (name.includes('asennus') || name.includes('installation')) return Hammer;
  if (name.includes('maalaus') || name.includes('painting')) return Paintbrush;
  if (name.includes('it') || name.includes('tietotekniikka')) return Laptop;
  if (name.includes('hoiva') || name.includes('care')) return Heart;
  return Briefcase;
};

// Calculate deadline urgency
const getDeadlineUrgency = (scheduledDate: string | null) => {
  if (!scheduledDate) return 'flexible';
  
  const now = new Date();
  const deadline = new Date(scheduledDate);
  const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 0) return 'overdue';
  if (diffHours <= 24) return 'urgent';
  if (diffHours <= 72) return 'soon';
  if (diffHours <= 168) return 'upcoming';
  return 'flexible';
};

export default function TaskHeader({ 
  title, 
  category, 
  status, 
  createdAt,
  scheduledDate,
  scheduledTimeSlot,
  backHref = '/dashboard',
  isTaskOwner = false,
  taskId,
  offers
}: TaskHeaderProps) {
  const CategoryIcon = getCategoryIcon(category?.name_fi || category?.name);
  const urgency = getDeadlineUrgency(scheduledDate || null);
  
  // Urgency styling
  const urgencyStyles = {
    overdue: 'bg-red-100 text-red-800 border-red-200',
    urgent: 'bg-red-50 text-red-700 border-red-200',
    soon: 'bg-orange-50 text-orange-700 border-orange-200',
    upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
    flexible: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  const urgencyLabels = {
    overdue: 'Myöhässä',
    urgent: 'Kiireellinen',
    soon: 'Pian',
    upcoming: 'Tulossa',
    flexible: 'Joustava'
  };

  // Check if task can be edited (open status and no offers)
  const canEditTask = () => {
    return isTaskOwner && status === 'open' && (!offers || offers.length === 0);
  };

  return (
    <div className="mb-6">
      {/* Back Link */}
      <div className="mb-4">
        <Link
          href={backHref}
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 hover:underline transition-colors text-sm font-medium"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Takaisin
        </Link>
      </div>

      {/* Header Content */}
      <div className="space-y-4">
        {/* Title and Status Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {category && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CategoryIcon className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
                    {category.name_fi || category.name}
                  </span>
                </div>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {title}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <StatusBadge status={status} size="lg" />
            {canEditTask() && taskId && (
              <Link href={`/dashboard/tasks/edit/${taskId}`}>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Muokkaa</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Deadline and Meta Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Deadline Pill */}
          {scheduledDate && (
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium ${urgencyStyles[urgency as keyof typeof urgencyStyles]}`}>
              <Calendar className="h-4 w-4" />
              <span className="font-semibold">{urgencyLabels[urgency as keyof typeof urgencyLabels]}</span>
              <span className="opacity-75">•</span>
              <span>{formatDate(scheduledDate)}</span>
              {scheduledTimeSlot && scheduledTimeSlot !== 'flexible' && (
                <>
                  <Clock className="h-3 w-3 ml-1" />
                  <span className="text-xs">{formatTimeSlot(scheduledTimeSlot)}</span>
                </>
              )}
            </div>
          )}
          
          {/* Meta Information */}
          <div className="text-gray-500 text-sm">
            Julkaistu {formatDate(createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}
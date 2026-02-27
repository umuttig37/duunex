'use client';

import { FeatureHighlight, ModernCard } from '@/components/ui/modern-primitives';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  CheckCircle,
  Euro,
  Eye,
  Shield,
  User,
  Users
} from 'lucide-react';
import { useState } from 'react';

/* ================================
   INTERFACES & TYPES
   ================================ */
type PublishingMode = 'open' | 'direct';

interface TaskSummary {
  category: string;
  description: string;
  location: string;
  budget?: number;
  date?: Date | string;
  timeSlot?: string;
  imageCount: number;
}

interface PublishingModeSelectorProps {
  selectedMode?: PublishingMode;
  onModeSelect: (mode: PublishingMode) => void;
  taskSummary: TaskSummary;
  onEdit?: (section: string) => void;
  onPublish?: () => void;
  isPublishing?: boolean;
  className?: string;
}

/* ================================
   MODE OPTION COMPONENT
   ================================ */
interface ModeOptionProps {
  mode: PublishingMode;
  selected: boolean;
  onSelect: () => void;
}

function ModeOption({ mode, selected, onSelect }: ModeOptionProps) {
  const isOpen = mode === 'open';

  const modeData = {
    open: {
      icon: Users,
      title: 'Avoin julkaisu',
      subtitle: 'Saat tarjouksia monilta tekijöiltä',
      benefits: [
        'Kilpailutus tuo paremmat hinnat',
        'Voit valita parhaan tekijän'
      ],
      timeEstimate: '2-24 tuntia',
      color: 'emerald'
    },
    direct: {
      icon: User,
      title: 'Suora valinta',
      subtitle: 'Valitse tietty tekijä suoraan',
      benefits: [
        'Nopea ja henkilökohtainen',
        'Suora yhteys tekijään'
      ],
      timeEstimate: 'Heti',
      color: 'blue'
    }
  };

  const data = modeData[mode];
  const IconComponent = data.icon;

  return (
    <ModernCard
      variant={selected ? 'selected' : 'interactive'}
      className={cn(
        "transition-all duration-300 cursor-pointer group",
        selected && "ring-2 ring-offset-2",
        data.color === 'emerald' && selected && "ring-emerald-500",
        data.color === 'blue' && selected && "ring-blue-500"
      )}
      onClick={onSelect}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
              selected
                ? data.color === 'emerald'
                  ? "bg-primary/10 text-primary"
                  : "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
            )}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="heading-3 mb-1">{data.title}</h3>
              <p className="body-base text-gray-600">{data.subtitle}</p>
            </div>
          </div>

          {/* Selection indicator */}
          <div className={cn(
            "w-6 h-6 min-w-6 rounded-full border-2 flex items-center justify-center transition-colors",
            selected
              ? data.color === 'emerald'
                ? "bg-primary border-emerald-600"
                : "bg-blue-600 border-blue-600"
              : "border-gray-300 group-hover:border-gray-400"
          )}>
            {selected && <CheckCircle className="w-4 h-4 text-white" />}
          </div>
        </div>

        {/* Benefits */}
        <div>
          <ul className="space-y-2">
            {data.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats */}
        <div className="pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600">Vastausaika: {data.timeEstimate}</p>
          </div>
        </div>
      </div>
    </ModernCard>
  );
}

/* ================================
   TASK SUMMARY COMPONENT
   ================================ */
interface TaskSummaryCardProps {
  taskSummary: TaskSummary;
  onEdit?: (section: string) => void;
}

function TaskSummaryCard({ taskSummary, onEdit }: TaskSummaryCardProps) {
  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDate:', date);
      return 'Virheellinen päivämäärä';
    }

    return new Intl.DateTimeFormat('fi-FI', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  };

  const getTimeSlotLabel = (slot: string) => {
    const labels = {
      morning: '🌅 Aamupäivä (8-12)',
      afternoon: '☀️ Iltapäivä (12-16)',
      evening: '🌆 Ilta (16-20)',
      flexible: '🕐 Joustava'
    };
    return labels[slot as keyof typeof labels] || slot;
  };

  return (
    <ModernCard variant="base" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="heading-3">Tehtävän yhteenveto</h3>
        <span className="badge-emerald text-xs">Valmis</span>
      </div>

      <div className="space-y-4">
        {/* Category & Description */}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">{taskSummary.category}</p>
            <p className="text-sm text-gray-600 mt-1 line-clamp-3 break-words">
              {taskSummary.description}
            </p>
          </div>
          {onEdit && (
            <button
              onClick={() => onEdit('details')}
              className="btn-ghost btn-small ml-2 flex-shrink-0"
            >
              Muokkaa
            </button>
          )}
        </div>

        {/* Location */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm">{taskSummary.location}</span>
          </div>
          {onEdit && (
            <button
              onClick={() => onEdit('location')}
              className="text-xs text-blue-600 hover:underline"
            >
              muokkaa
            </button>
          )}
        </div>

        {/* Budget */}
        {taskSummary.budget && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Euro className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">{taskSummary.budget}€</span>
            </div>
            {onEdit && (
              <button
                onClick={() => onEdit('budget')}
                className="text-xs text-blue-600 hover:underline"
              >
                muokkaa
              </button>
            )}
          </div>
        )}

        {/* Date & Time */}
        {taskSummary.date && (
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium">{formatDate(taskSummary.date)}</p>
              {taskSummary.timeSlot && (
                <p className="text-xs text-gray-600">
                  {getTimeSlotLabel(taskSummary.timeSlot)}
                </p>
              )}
            </div>
            {onEdit && (
              <button
                onClick={() => onEdit('datetime')}
                className="text-xs text-blue-600 hover:underline"
              >
                muokkaa
              </button>
            )}
          </div>
        )}

        {/* Images */}
        {taskSummary.imageCount > 0 && (
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <span className="text-sm">
              {taskSummary.imageCount} kuva{taskSummary.imageCount !== 1 ? 'a' : ''} lisätty
            </span>
          </div>
        )}
      </div>
    </ModernCard>
  );
}

/* ================================
   MAIN COMPONENT
   ================================ */
export default function PublishingModeSelector({
  selectedMode,
  onModeSelect,
  taskSummary,
  onEdit,
  onPublish,
  isPublishing = false,
  className,
}: PublishingModeSelectorProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handlePublish = () => {
    if (!selectedMode) return;

    // For direct selection, skip confirmation and go directly to tasker selection
    if (selectedMode === 'direct') {
      onPublish?.();
    } else {
      setShowConfirmation(true);
    }
  };

  const confirmPublish = () => {
    onPublish?.();
    setShowConfirmation(false);
  };

  return (
    <div className={cn("animate-fade-in space-y-8", className)}>
      {/* Header */}
      <div className="text-center">
        <h1 className="heading-1 mb-4">
          Miten julkaistaan tehtävä?
        </h1>
        <p className="body-large max-w-2xl mx-auto">
          Valitse sopiva tapa löytää tekijä.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Publishing Mode Options */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ModeOption
              mode="open"
              selected={selectedMode === 'open'}
              onSelect={() => onModeSelect('open')}
            />
            <ModeOption
              mode="direct"
              selected={selectedMode === 'direct'}
              onSelect={() => onModeSelect('direct')}
            />
          </div>

          {/* Mode-specific information */}
          {selectedMode && (
            <div className="animate-slide-up">
              {selectedMode === 'open' ? (
                <FeatureHighlight
                  icon={Users}
                  title="Avoin julkaisu valittu"
                  description="Tehtäväsi julkaistaan kaikille sopiville tekijöille. Tekijät voivat ottaa sinuun yhteyttä ja tehdä tarjouksia. Voit vertailla tarjouksia ja valita parhaan."
                  variant="success"
                />
              ) : (
                <FeatureHighlight
                  icon={User}
                  title="Suora valinta valittu"
                  description="Seuraavaksi voit selata lähialueen tekijöitä ja valita sopivimman. Lähetämme tehtäväpyynnön suoraan valitsemallesi tekijälle."
                  variant="info"
                />
              )}
            </div>
          )}
        </div>

        {/* Task Summary & Publish */}
        <div className="space-y-6">
          <TaskSummaryCard
            taskSummary={taskSummary}
            onEdit={onEdit}
          />

          {/* Publish Button */}
          {selectedMode && (
            <div className="space-y-4">
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="btn-primary w-full flex items-center justify-center gap-2 h-14 text-lg"
              >
                {isPublishing ? (
                  selectedMode === 'direct' ? (
                    <>
                      <div className="loading-spinner" />
                      Siirrytään tekijöihin...
                    </>
                  ) : (
                    <>
                      <div className="loading-spinner" />
                      Julkaistaan...
                    </>
                  )
                ) : selectedMode === 'direct' ? (
                  <>
                    Selaa tekijöitä
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Julkaise tehtävä
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Trust indicators */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Turvallinen Paytrail-maksu</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Voit muokata tehtävää myöhemmin</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <ModernCard variant="elevated" className="max-w-md w-full">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>

              <h3 className="heading-2">Valmis julkaisuun?</h3>

              <p className="body-base">
                {selectedMode === 'open'
                  ? 'Tehtäväsi julkaistaan kaikille tekijöille ja he voivat tehdä tarjouksia.'
                  : 'Siirrymme seuraavaksi tekijöiden selailuun, jossa voit valita sopivan tekijän.'
                }
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="btn-outline flex-1"
                >
                  Takaisin
                </button>
                <button
                  onClick={confirmPublish}
                  className="btn-primary flex-1"
                >
                  {selectedMode === 'direct' ? 'Selaa tekijöitä!' : 'Kyllä, julkaise!'}
                </button>
              </div>
            </div>
          </ModernCard>
        </div>
      )}
    </div>
  );
}
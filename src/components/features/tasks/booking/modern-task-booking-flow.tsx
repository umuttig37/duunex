'use client';

import SmartTaskDetails from '@/components/features/tasks/detail/smart-task-details';
import { ProgressBar, StepIndicator } from '@/components/ui/modern-primitives';
import { categoriesWithIcons, type CategoryWithIcon } from '@/constants/categories-with-icons';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Info,
  Settings,
  Target,
  X
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import ModernCategorySelection from './modern-category-selection';
import PublishingModeSelector from './publishing-mode-selector';

/* ================================
   INTERFACES & TYPES
   ================================ */
type BookingStep = 'category' | 'details' | 'publish';
type PublishingMode = 'open' | 'direct';

interface TaskFormData {
  description: string;
  location_text: string;
  latitude?: number | null;
  longitude?: number | null;
  // @deprecated - No longer used for task creation. Service radius is configured by taskers in their profile.
  service_radius_km?: number | null;
  budget: number | null;
  scheduled_date: Date | null;
  scheduled_time_slot: 'morning' | 'afternoon' | 'evening' | 'flexible' | null;
  image_urls: string[];
  image_files?: File[]; // Store actual File objects for upload later
  dynamic_answers: Record<string, any>;
}

interface TaskTemplate {
  id: string;
  name_fi: string;
  description_fi: string;
  category: string;
  popularity_score: number;
  questions?: DynamicQuestion[];
}

interface DynamicQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'time_range';
  label_fi: string;
  required: boolean;
  options_fi?: string[];
  helper_text_fi?: string;
  min?: number;
  max?: number;
}

interface ModernTaskBookingFlowProps {
  onComplete?: (data: {
    category: CategoryWithIcon;
    formData: TaskFormData;
    publishingMode: PublishingMode;
    template?: TaskTemplate;
  }) => void;
  onCancel?: () => void;
  onStepChange?: (step: BookingStep, stepNumber: number) => void;
  initialData?: Partial<TaskFormData>;
  className?: string;
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
  isTasker?: boolean;
}

/* ================================
   HELPER FUNCTIONS
   ================================ */
const getStepInfo = (step: BookingStep) => {
  const stepMap = {
    category: {
      number: 1,
      title: 'Kategoria',
      description: 'Valitse mitä tarvitset',
      icon: Target,
    },
    details: {
      number: 2,
      title: 'Tiedot',
      description: 'Kerro tehtävästäsi',
      icon: Info,
    },
    publish: {
      number: 3,
      title: 'Julkaisu',
      description: 'Valitse julkaisutapa',
      icon: Settings,
    },
  };
  return stepMap[step];
};

const validateStep = (step: BookingStep, data: {
  selectedCategory?: CategoryWithIcon;
  formData: TaskFormData;
  publishingMode?: PublishingMode;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  switch (step) {
    case 'category':
      if (!data.selectedCategory) {
        errors.push('Valitse kategoria');
      }
      break;

    case 'details':
      if (!data.formData.description?.trim()) {
        errors.push('Tehtävän kuvaus on pakollinen');
      }
      if (!data.formData.location_text?.trim()) {
        errors.push('Sijainti on pakollinen');
      }
      if (data.formData.description && data.formData.description.length < 20) {
        errors.push('Kuvauksen tulee olla vähintään 20 merkkiä');
      }
      break;

    case 'publish':
      if (!data.publishingMode) {
        errors.push('Valitse julkaisutapa');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/* ================================
   MAIN COMPONENT
   ================================ */
export default function ModernTaskBookingFlow({
  onComplete,
  onCancel,
  onStepChange,
  initialData,
  className,
  isAuthenticated = false,
  onAuthRequired,
  isTasker = false,
}: ModernTaskBookingFlowProps) {
  // State management
  const [currentStep, setCurrentStep] = useState<BookingStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithIcon | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [publishingMode, setPublishingMode] = useState<PublishingMode | undefined>();
  const [formData, setFormData] = useState<TaskFormData>({
    description: '',
    location_text: '',
    latitude: null,
    longitude: null,
    budget: null,
    scheduled_date: null,
    scheduled_time_slot: null,
    image_urls: [],
    image_files: [],
    dynamic_answers: {},
    ...initialData,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showRestoredBanner, setShowRestoredBanner] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Step navigation
  const steps: BookingStep[] = ['category', 'details', 'publish'];
  const currentStepIndex = steps.indexOf(currentStep);
  const totalSteps = steps.length;

  // Auto-save to localStorage (only after initialization to prevent overwriting restored data)
  useEffect(() => {
    if (!hasInitialized) return; // Don't save during initial load

    // Persist only minimal category info (slug + id + name) to avoid serializing icon component
    const minimalCategory = selectedCategory
      ? { id: selectedCategory.id, slug: selectedCategory.slug, name_fi: selectedCategory.name_fi }
      : null;

    // Exclude image_files from formData since File objects can't be serialized
    const { image_files, ...serializableFormData } = formData;

    const data = {
      selectedCategory: minimalCategory,
      selectedTemplate,
      publishingMode,
      formData: serializableFormData,
      currentStep,
    };
    console.log('💾 Auto-saving data:', data); // Debug log
    localStorage.setItem('modern-task-booking-data', JSON.stringify(data));
  }, [selectedCategory, selectedTemplate, publishingMode, formData, currentStep, hasInitialized]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('modern-task-booking-data');
      console.log('🔍 Loading saved data:', saved); // Debug log

      if (saved) {
        const data = JSON.parse(saved);
        console.log('📦 Parsed saved data:', data); // Debug log
        const origin = data.origin as string | undefined;
        const persistedAt = typeof data.persistedAt === 'number' ? data.persistedAt : 0;
        const isImmediateHeroSeed = origin === 'hero_template_click' && (Date.now() - persistedAt) < 60_000;
        let hasRestored = false;

        if (data.selectedCategory) {
          console.log('✅ Restoring category (from minimal data):', data.selectedCategory); // Debug log
          // Rehydrate full category (including icon) from constants by slug or id
          const restored = categoriesWithIcons.find(c =>
            c.slug === data.selectedCategory.slug || c.id === data.selectedCategory.id
          );
          if (restored) {
            setSelectedCategory(restored);
            // Only mark as restored if there's additional meaningful data beyond just category
            if (data.selectedTemplate || data.publishingMode ||
              (data.formData && Object.keys(data.formData).some(key => data.formData[key])) ||
              data.currentStep) {
              hasRestored = true;
            }
          }
        }
        if (data.selectedTemplate) {
          console.log('✅ Restoring template:', data.selectedTemplate); // Debug log
          setSelectedTemplate(data.selectedTemplate);
          hasRestored = true;
        }
        if (data.publishingMode) {
          console.log('✅ Restoring publishing mode:', data.publishingMode); // Debug log
          setPublishingMode(data.publishingMode);
          hasRestored = true;
        }
        if (data.formData && Object.keys(data.formData).some(key => data.formData[key])) {
          console.log('✅ Restoring form data:', data.formData); // Debug log
          // Fix: Use the saved formData directly, not merge with current (which has defaults)
          setFormData(prev => ({
            ...prev,
            ...data.formData
          }));
          hasRestored = true;
        }

        // Restore current step if available and valid
        const validSteps: BookingStep[] = ['category', 'details', 'publish'];
        if (data.currentStep && validSteps.includes(data.currentStep)) {
          // Safety check: if step is 'details' but no category, fall back to 'category'
          if (data.currentStep === 'details' && !data.selectedCategory) {
            console.log('⚠️ Details step without category, falling back to category step'); // Debug log
            setCurrentStep('category');
          } else {
            console.log('✅ Restoring step:', data.currentStep); // Debug log
            setCurrentStep(data.currentStep as BookingStep);
            hasRestored = true;
          }
        } else if (data.selectedCategory) {
          // If no explicit step saved, infer a reasonable step based on restored data
          // But don't mark as "restored" since this is just step inference
          console.log('✅ Inferring step: details (category exists)'); // Debug log
          setCurrentStep('details');
          // Don't set hasRestored = true here - this is just initialization logic
        }

        // Show banner if any data was restored (but suppress if just navigated via hero template or fresh template selection)
        if (hasRestored && !isImmediateHeroSeed && !(data.selectedTemplate && !data.formData?.description)) {
          console.log('🎉 Data restored successfully'); // Debug log
          setShowRestoredBanner(true);
          // Auto-hide banner after 5 seconds
          setTimeout(() => setShowRestoredBanner(false), 5000);
        }

        // Step is now restored or inferred
      } else {
        console.log('❌ No saved data found'); // Debug log
      }
    } catch (error) {
      console.warn('Failed to load saved booking data:', error);
    } finally {
      // Mark as initialized to allow auto-saving
      setHasInitialized(true);
    }
  }, []);

  // Handlers
  const handleFieldChange = useCallback((field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation errors when user makes changes
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [validationErrors]);

  const handleDynamicAnswerChange = useCallback((questionId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      dynamic_answers: {
        ...prev.dynamic_answers,
        [questionId]: value
      }
    }));
  }, []);

  const handleStepValidation = useCallback((step: BookingStep): boolean => {
    const validation = validateStep(step, {
      selectedCategory: selectedCategory || undefined,
      formData,
      publishingMode,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return false;
    }

    setValidationErrors([]);
    return true;
  }, [selectedCategory, formData, publishingMode]);

  const goToStep = useCallback((step: BookingStep) => {
    const stepInfo = getStepInfo(step);
    setCurrentStep(step);
    onStepChange?.(step, stepInfo.number);

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onStepChange]);

  const goToNextStep = useCallback(() => {
    if (!handleStepValidation(currentStep)) return;

    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      // Only block entering publish step for taskers
      if (steps[nextStepIndex] === 'publish' && isTasker) {
        setValidationErrors(['Et voi julkaista tehtävää tekijä-tilillä. Kirjaudu ulos ja käytä asiakastiliä.']);
        return;
      }
      goToStep(steps[nextStepIndex]);
    }
  }, [currentStep, currentStepIndex, steps, handleStepValidation, goToStep]);

  const goToPreviousStep = useCallback(() => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      goToStep(steps[prevStepIndex]);
    }
  }, [currentStepIndex, steps, goToStep]);

  const handleComplete = useCallback(async () => {
    if (!handleStepValidation('publish')) return;

    if (!selectedCategory || !publishingMode) {
      setValidationErrors(['Puuttuu vaadittuja tietoja']);
      return;
    }

    // Block taskers from submitting tasks
    if (isTasker) {
      setValidationErrors(['Et voi julkaista tehtävää tekijä-tilillä. Kirjaudu ulos ja käytä asiakastiliä.']);
      return;
    }

    // Check authentication before proceeding
    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }

    setIsLoading(true);

    try {
      await onComplete?.({
        category: selectedCategory,
        formData,
        publishingMode,
        template: selectedTemplate || undefined,
      });
    } catch (error) {
      console.error('Failed to complete booking:', error);
      setValidationErrors(['Tehtävän luonnissa tapahtui virhe. Yritä uudelleen.']);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, formData, publishingMode, selectedTemplate, handleStepValidation, onComplete, isAuthenticated, onAuthRequired, isTasker]);

  const handleCancel = useCallback(() => {
    // Clear saved data
    localStorage.removeItem('modern-task-booking-data');
    onCancel?.();
  }, [onCancel]);

  const handleEditStep = useCallback((step: BookingStep) => {
    goToStep(step);
  }, [goToStep]);

  // Create task summary for final step
  const getTaskSummary = useCallback(() => {
    return {
      category: selectedCategory?.name_fi || '',
      description: formData.description,
      location: formData.location_text,
      budget: formData.budget || undefined,
      date: formData.scheduled_date || undefined,
      timeSlot: formData.scheduled_time_slot || undefined,
      imageCount: formData.image_files?.length || 0,
    };
  }, [selectedCategory, formData]);

  const currentStepInfo = getStepInfo(currentStep);
  const canGoBack = currentStepIndex > 0;
  const canGoNext = currentStepIndex < steps.length - 1;
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container-responsive py-2">
          <div className="flex items-center gap-4">
            {/* Current Step Title (compact) */}
            <div className="shrink-0">
              <p className="text-sm font-medium text-gray-900 leading-none">{currentStepInfo.title}</p>
              <p className="text-[11px] text-gray-500">Vaihe {currentStepInfo.number} / {totalSteps}</p>
            </div>
            {/* Progress */}
            <div className="flex-1">
              <ProgressBar
                currentStep={currentStepInfo.number}
                totalSteps={totalSteps}
                showPercentage={true}
              />
            </div>
            {/* Actions */}
            <div className="flex items-center ml-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 flex items-center gap-2 font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
              >
                <X className="w-5 h-5" />
                <span className="hidden sm:inline">Peruuta</span>
              </button>
            </div>
          </div>
          {/* Step Navigation (compact, only on large screens) */}
          <div className="hidden lg:flex items-center justify-center mt-2 gap-4">
            {steps.map((step, index) => {
              const stepInfo = getStepInfo(step);
              return (
                <StepIndicator
                  key={step}
                  step={stepInfo.number}
                  currentStep={currentStepInfo.number}
                  totalSteps={totalSteps}
                  icon={stepInfo.icon}
                  title={stepInfo.title}
                  description={''}
                  onClick={index <= currentStepIndex ? () => goToStep(step) : undefined}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Korjaa seuraavat virheet:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restored State Banner */}
      {showRestoredBanner && (
        <div className="bg-emerald-50 border border-emerald-200 mx-4 mt-4 p-4 rounded-lg animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-emerald-800">
                  Tiedot palautettu
                </p>
                <p className="text-sm text-emerald-700">
                  Jatkat siitä mihin jäit
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRestoredBanner(false)}
              className="text-emerald-600 hover:text-emerald-800 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container-responsive py-8">
        {/* Step Content */}
        {currentStep === 'category' && (
          <ModernCategorySelection
            categories={categoriesWithIcons}
            selectedCategory={selectedCategory}
            onSelect={(category) => {
              setSelectedCategory(category);
              setValidationErrors([]);

              // Force immediate save to localStorage (exclude image_files)
              const { image_files, ...serializableFormData } = formData;
              const data = {
                selectedCategory: { id: category.id, slug: category.slug, name_fi: category.name_fi },
                selectedTemplate,
                publishingMode,
                formData: serializableFormData,
                currentStep,
              };
              localStorage.setItem('modern-task-booking-data', JSON.stringify(data));
            }}
            onTemplateSelect={(template) => {
              setSelectedTemplate(template);
              setValidationErrors([]);

              // Pre-fill details from template if description is empty and reset dynamic answers
              const updatedFormData = {
                ...formData,
                description: formData.description?.trim() ? formData.description : template.description_fi || formData.description,
                dynamic_answers: {}, // Reset dynamic answers when switching templates
              };

              setFormData(updatedFormData);

              // Force immediate save to localStorage with the updated form data (exclude image_files)
              const { image_files, ...serializableFormData } = updatedFormData;
              const data = {
                selectedCategory: selectedCategory
                  ? { id: selectedCategory.id, slug: selectedCategory.slug, name_fi: selectedCategory.name_fi }
                  : null,
                selectedTemplate: template,
                publishingMode,
                formData: serializableFormData,
                currentStep: 'details' as const,
              };
              localStorage.setItem('modern-task-booking-data', JSON.stringify(data));

              // Move to details step when a template is chosen
              goToStep('details');
            }}
          />
        )}

        {currentStep === 'details' && selectedCategory && (
          <SmartTaskDetails
            category={selectedCategory}
            formData={formData}
            onFieldChange={handleFieldChange}
            onDynamicAnswerChange={handleDynamicAnswerChange}
            templateData={selectedTemplate && selectedTemplate.questions
              ? { name_fi: selectedTemplate.name_fi, description_fi: selectedTemplate.description_fi, questions: selectedTemplate.questions }
              : null}
          />
        )}

        {currentStep === 'publish' && selectedCategory && (
          <PublishingModeSelector
            selectedMode={publishingMode}
            onModeSelect={(mode) => {
              setPublishingMode(mode);
              setValidationErrors([]);
            }}
            taskSummary={getTaskSummary()}
            onEdit={(section) => {
              if (section === 'category') goToStep('category');
              else goToStep('details');
            }}
            onPublish={handleComplete}
            isPublishing={isLoading}
          />
        )}
      </div>

      {/* Footer Navigation */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0 z-40">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <div>
              {canGoBack ? (
                <button
                  onClick={goToPreviousStep}
                  className="btn-outline flex items-center gap-2"
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Takaisin
                </button>
              ) : (
                <div /> // Placeholder for spacing
              )}
            </div>

            {/* Step Info */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {currentStepInfo.title}
              </p>
              <p className="text-xs text-gray-500">
                Vaihe {currentStepInfo.number} / {totalSteps}
              </p>
            </div>

            {/* Next/Complete Button */}
            <div>
              {isLastStep ? (
                <button
                  onClick={handleComplete}
                  disabled={isLoading || !selectedCategory || !publishingMode || isTasker}
                  className="btn-primary flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="loading-spinner" />
                      Luodaan...
                    </>
                  ) : isAuthenticated ? (
                    publishingMode === 'direct' ? (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Selaa tekijöitä
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Luo tehtävä
                      </>
                    )
                  ) : (
                    publishingMode === 'direct' ? (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Kirjaudu ja selaa tekijöitä
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Kirjaudu ja luo tehtävä
                      </>
                    )
                  )}
                </button>
              ) : (
                <button
                  onClick={goToNextStep}
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  Jatka
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
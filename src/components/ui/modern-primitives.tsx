/**
 * Modern UI Primitives for Task Booking Flow
 * Inspired by hero sections and HowItWorksSection styling
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

/* ================================
   STEP INDICATOR COMPONENTS
   ================================ */
interface StepIndicatorProps {
  step: number;
  currentStep: number;
  totalSteps: number;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  onClick?: () => void;
  className?: string;
}

export function StepIndicator({
  step,
  currentStep,
  totalSteps,
  icon: Icon,
  title,
  description,
  onClick,
  className,
}: StepIndicatorProps) {
  const isActive = step === currentStep;
  const isCompleted = step < currentStep;
  const isClickable = step <= currentStep && onClick;

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex flex-col items-center">
        <button
          onClick={isClickable ? onClick : undefined}
          disabled={!isClickable}
          className={cn(
            "step-indicator touch-target",
            {
              active: isActive,
              completed: isCompleted,
              inactive: step > currentStep,
            },
            isClickable && "cursor-pointer hover:scale-105",
            !isClickable && "cursor-default"
          )}
          aria-label={`Step ${step}: ${title}`}
          aria-current={isActive ? "step" : undefined}
        >
          {Icon ? (
            <Icon className="w-5 h-5" />
          ) : (
            <span className="font-semibold">{step}</span>
          )}
        </button>
        
        {title && (
          <div className="mt-2 text-center">
            <p className={cn(
              "text-xs font-medium",
              isActive && "text-primary",
              isCompleted && "text-primary",
              step > currentStep && "text-gray-400"
            )}>
              {title}
            </p>
            {description && (
              <p className="text-xs text-gray-500 mt-1 max-w-20">
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {step < totalSteps && (
        <div className={cn(
          "step-connector mx-4 hidden sm:block",
          { completed: isCompleted }
        )} />
      )}
    </div>
  );
}

/* ================================
   MODERN CARD COMPONENTS
   ================================ */
interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'elevated' | 'interactive' | 'selected' | 'gradient';
  padding?: 'sm' | 'base' | 'lg';
  children: React.ReactNode;
}

export function ModernCard({
  variant = 'base',
  padding = 'base',
  className,
  children,
  ...props
}: ModernCardProps) {
  const cardClasses = {
    base: 'card-base',
    elevated: 'card-elevated',
    interactive: 'card-interactive',
    selected: 'card-selected',
    gradient: 'card-gradient',
  };

  const paddingClasses = {
    sm: 'p-3 md:p-4',
    base: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  };

  return (
    <div
      className={cn(
        cardClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ================================
   TEMPLATE CARD COMPONENT
   ================================ */
interface TemplateCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  category: string;
  popularity?: number;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TemplateCard({
  title,
  description,
  icon: Icon,
  category,
  popularity,
  selected = false,
  onClick,
  className,
}: TemplateCardProps) {
  return (
    <ModernCard
      variant={selected ? 'selected' : 'interactive'}
      padding="base"
      className={cn(
        "group cursor-pointer animate-fade-in touch-target-large",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start space-x-4">
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200",
          selected 
            ? "bg-primary/10 text-primary" 
            : "bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="heading-4 truncate">{title}</h3>
            {popularity && (
              <span className="badge-emerald text-xs">
                #{popularity}
              </span>
            )}
          </div>
          
          {description && (
            <p className="body-small line-clamp-2 mb-2">
              {description}
            </p>
          )}
          
          <span className="badge-gray text-xs">
            {category}
          </span>
        </div>
      </div>
    </ModernCard>
  );
}

/* ================================
   CATEGORY BADGE COMPONENT
   ================================ */
interface CategoryBadgeProps {
  name: string;
  icon: LucideIcon;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CategoryBadge({
  name,
  icon: Icon,
  selected = false,
  onClick,
  className,
}: CategoryBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 touch-target",
        selected
          ? "bg-primary/10 text-primary border-2 border-primary/30 shadow-sm"
          : "bg-white border-2 border-gray-200 text-gray-700 hover:border-primary/30 hover:bg-primary/10 hover:text-primary",
        className
      )}
      type="button"
      aria-pressed={selected}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{name}</span>
    </button>
  );
}

/* ================================
   PROGRESS BAR COMPONENT
   ================================ */
interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({
  currentStep,
  totalSteps,
  showPercentage = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100);
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">
          Step {currentStep} of {totalSteps}
        </span>
        {showPercentage && (
          <span className="text-sm font-medium text-primary">
            {percentage}%
          </span>
        )}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

/* ================================
   SEARCH BAR COMPONENT
   ================================ */
interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  loading?: boolean;
  icon?: LucideIcon;
  actionText?: string;
  className?: string;
}

export function SearchBar({
  placeholder = "Search...",
  value = "",
  onChange,
  onSubmit,
  loading = false,
  icon: Icon,
  actionText = "Search",
  className,
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative group", className)}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "form-input",
            actionText ? "pr-20" : "pr-4"
          )}
        />
        
        {actionText && (
          <button
            type="submit"
            disabled={!value.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary btn-small"
          >
            {loading ? (
              <div className="loading-spinner" />
            ) : (
              actionText
            )}
          </button>
        )}
      </div>
    </form>
  );
}

/* ================================
   FEATURE HIGHLIGHT COMPONENT
   ================================ */
interface FeatureHighlightProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: 'default' | 'success' | 'info' | 'warning';
  className?: string;
}

export function FeatureHighlight({
  icon: Icon,
  title,
  description,
  variant = 'default',
  className,
}: FeatureHighlightProps) {
  const variantClasses = {
    default: 'bg-gray-50 border-gray-200 text-gray-600',
    success: 'bg-primary/5 border-primary/20 text-primary',
    info: 'bg-blue-50 border-blue-200 text-blue-600',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-600',
  };

  return (
    <div className={cn(
      "flex items-start space-x-3 p-4 rounded-xl border",
      variantClasses[variant],
      className
    )}>
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="body-small">{description}</p>
      </div>
    </div>
  );
}
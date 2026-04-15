'use client';

import type { DashboardTask } from '@/app/dashboard/page';
import React from 'react';

// Enhanced marker types with modern design
export interface MapMarkerType {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  priority: number;
  description: string;
}

// Define marker types based on task characteristics
export const MARKER_TYPES: Record<string, MapMarkerType> = {
  // High priority tasks (urgent, high budget)
  premium: {
    id: 'premium',
    name: 'Premium Tehtävä',
    color: '#FFA500', // Orange
    bgColor: '#FFF3E0',
    borderColor: '#FF8F00',
    icon: '⭐',
    priority: 1,
    description: 'Kiireellinen tehtävä korkea budjetti'
  },
  
  // Regular open tasks
  open: {
    id: 'open',
    name: 'Avoin Tehtävä',
    color: '#10B981', // Emerald
    bgColor: '#ECFDF5',
    borderColor: '#0284c7',
    icon: '📋',
    priority: 2,
    description: 'Normaalisti avoin tehtävä'
  },
  
  // Tasks with many offers (competitive)
  competitive: {
    id: 'competitive',
    name: 'Kilpailtu Tehtävä',
    color: '#EF4444', // Red
    bgColor: '#FEF2F2',
    borderColor: '#DC2626',
    icon: '🔥',
    priority: 3,
    description: 'Paljon tarjouksia jo tehty'
  },
  
  // New tasks (posted recently)
  fresh: {
    id: 'fresh',
    name: 'Uusi Tehtävä',
    color: '#3B82F6', // Blue  
    bgColor: '#EFF6FF',
    borderColor: '#2563EB',
    icon: '✨',
    priority: 4,
    description: 'Äskettäin julkaistu tehtävä'
  },
  
  // Tasks in your categories/expertise
  matched: {
    id: 'matched',
    name: 'Sopiva Tehtävä',
    color: '#8B5CF6', // Purple
    bgColor: '#F3F4F6',
    borderColor: '#7C3AED',
    icon: '🎯',
    priority: 5,
    description: 'Vastaa osaamistasi'
  },
  
  // Default for other tasks
  default: {
    id: 'default',
    name: 'Tehtävä',
    color: '#6B7280', // Gray
    bgColor: '#F9FAFB',
    borderColor: '#4B5563',
    icon: '📍',
    priority: 6,
    description: 'Perus tehtävä'
  }
};

// Function to determine marker type based on task properties
export const getMarkerType = (task: DashboardTask, taskerCategories?: string[]): MapMarkerType => {
  const now = new Date();
  const taskCreated = new Date(task.created_at);
  const hoursSinceCreated = (now.getTime() - taskCreated.getTime()) / (1000 * 60 * 60);
  
  // Check if task is premium (high budget or scheduled soon)
  const scheduledSoon = (() => {
    try {
      if (!task.scheduled_date) return false;
      const nowMs = now.getTime();
      const scheduledMs = new Date(task.scheduled_date as unknown as string).getTime();
      if (isNaN(scheduledMs)) return false;
      const hoursUntil = (scheduledMs - nowMs) / (1000 * 60 * 60);
      return hoursUntil <= 72; // within 3 days considered urgent
    } catch {
      return false;
    }
  })();

  if ((task.budget && task.budget > 200) || scheduledSoon) {
    return MARKER_TYPES.premium;
  }
  
  // Check if task is fresh (created within last 24 hours)
  if (hoursSinceCreated <= 24) {
    return MARKER_TYPES.fresh;
  }
  
  // Check if task is competitive (many offers)
  if (task.offers_count && task.offers_count >= 5) {
    return MARKER_TYPES.competitive;
  }
  
  // Check if task matches tasker's categories
  if (taskerCategories && task.categories?.name_fi && 
      taskerCategories.some(cat => task.categories?.name_fi?.toLowerCase().includes(cat.toLowerCase()))) {
    return MARKER_TYPES.matched;
  }
  
  // Default to open task
  return MARKER_TYPES.open;
};

// Custom SVG marker component
export const CustomMapMarker: React.FC<{
  markerType: MapMarkerType;
  size?: number;
  showPulse?: boolean;
}> = ({ markerType, size = 40, showPulse = false }) => {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Pulse animation for premium/fresh tasks */}
      {showPulse && (
        <div 
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ 
            backgroundColor: markerType.color,
            animationDuration: '2s'
          }}
        />
      )}
      
      {/* Main marker circle */}
      <div
        className="relative flex items-center justify-center rounded-full shadow-lg border-2 transition-transform hover:scale-110"
        style={{
          width: size * 0.8,
          height: size * 0.8,
          backgroundColor: markerType.bgColor,
          borderColor: markerType.borderColor,
          color: markerType.color
        }}
      >
        {/* Icon or emoji */}
        <span 
          className="text-center font-medium"
          style={{ 
            fontSize: size * 0.3,
            lineHeight: 1
          }}
        >
          {markerType.icon}
        </span>
      </div>
      
      {/* Small indicator dot for priority */}
      <div
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
        style={{ backgroundColor: markerType.color }}
      />
    </div>
  );
};

// Cluster marker for grouped tasks
export const ClusterMarker: React.FC<{
  count: number;
  size?: number;
}> = ({ count, size = 50 }) => {
  return (
    <div 
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold shadow-lg border-2 border-white hover:scale-110 transition-transform"
      style={{ width: size, height: size }}
    >
      <span className="text-sm">{count}</span>
    </div>
  );
};

// Legend component for the map
export const MapLegend: React.FC<{
  visibleTypes: MapMarkerType[];
  className?: string;
}> = ({ visibleTypes, className = '' }) => {
  return (
    <div className={`bg-white/95 backdrop-blur-sm rounded-lg border shadow-sm p-3 space-y-2 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-900 mb-2">Tehtävätyypit</h4>
      <div className="space-y-1.5">
        {visibleTypes.map((type) => (
          <div key={type.id} className="flex items-center gap-2 text-xs">
            <CustomMapMarker markerType={type} size={20} />
            <span className="text-gray-700 flex-1">{type.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Task priority indicator
export const getPriorityBadge = (markerType: MapMarkerType): string => {
  if (markerType.priority <= 2) return 'Korkea prioriteetti';
  if (markerType.priority <= 4) return 'Keskitaso prioriteetti';
  return 'Matala prioriteetti';
};
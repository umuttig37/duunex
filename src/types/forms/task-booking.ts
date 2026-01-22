import type { CategoryRow } from '@/components/features/tasks/booking/category-selection';
import type { Database } from '@/lib/supabase/database.types';

// Tasker profile type used in task booking
export type TaskerProfile = Database['public']['Tables']['profiles']['Row'] & {
  tasker_details?: {
    hourly_rate: number;
    is_available: boolean;
  } | null;
};

// Main task booking form data interface
export interface NewTaskBookingFormData {
  category: CategoryRow | null;
  location_text: string;
  description: string;
  task_size: 'small' | 'medium' | 'large';
  scheduled_date: Date | null;
  scheduled_time_slot: 'morning' | 'afternoon' | 'evening' | 'flexible' | null;
  tasker: TaskerProfile | null;
  postingType: 'open' | 'direct';
  budget?: number | null;
  // @deprecated - No longer used for task creation. Service radius is configured by taskers in their profile.
  service_radius_km?: number;
  additionalDetails: {
    items?: string;
    needs_packing?: 'yes' | 'no';
    floors?: string;
    pet_type?: string;
    service_type?: string;
    pet_details?: string;
    cleaning_type?: string;
    home_size?: string;
    areas?: string[];
    specific_requirements?: string;
  };
  dynamicFieldAnswers?: Record<
    string,
    {
      value: any;
      questionType?: string;
      questionLabel?: string;
    }
  >;
  latitude?: number | null;
  longitude?: number | null;
  savedCurrentStep?: number;
  image_urls?: string[];
  temporaryImageFiles?: { file: File; previewUrl: string }[];
}
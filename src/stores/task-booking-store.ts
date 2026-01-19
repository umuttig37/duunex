import type { NewTaskBookingFormData as FormDataType } from '@/types/forms/task-booking';
import { create } from 'zustand';

// Ensure NewTaskBookingFormData in the store includes savedCurrentStep and temporary images
export interface NewTaskBookingFormDataInStore extends FormDataType {
  savedCurrentStep?: number;
  temporaryImageFiles?: { file: File; previewUrl: string }[]; // For storing visitor images temporarily
}

interface TaskBookingState {
  pendingFormData: NewTaskBookingFormDataInStore | null;
  hasPendingFormData: boolean;
  isRestored: boolean;
  setPendingFormData: (data: NewTaskBookingFormDataInStore) => void;
  clearPendingFormData: () => void;
  markAsRestored: () => void;
  // You could add a specific redirect path here if needed, e.g., afterLoginRedirectPath: string | null
}

export const useTaskBookingStore = create<TaskBookingState>((set) => ({
  pendingFormData: null,
  hasPendingFormData: false,
  isRestored: false,
  setPendingFormData: (data) => set({
    pendingFormData: data,
    hasPendingFormData: true,
    isRestored: false,
  }),
  clearPendingFormData: () => set({
    pendingFormData: null,
    hasPendingFormData: false,
    isRestored: false,
  }),
  markAsRestored: () => set({ isRestored: true }),
})); 
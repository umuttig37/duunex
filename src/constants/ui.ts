// UI-related constants

// Sidebar constants
export const SIDEBAR_COOKIE_NAME = "sidebar_state";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const SIDEBAR_WIDTH = "16rem";
export const SIDEBAR_WIDTH_MOBILE = "18rem";
export const SIDEBAR_WIDTH_ICON = "3rem";
export const SIDEBAR_KEYBOARD_SHORTCUT = "b";

// Booking flow steps
export const BOOKING_STEPS = ['category', 'details', 'publish'] as const;
export type BookingStep = typeof BOOKING_STEPS[number];

// Connection status types
export const CONNECTION_STATUSES = ['connecting', 'connected', 'error', 'disconnected'] as const;
export type ConnectionStatus = typeof CONNECTION_STATUSES[number];

// Filter types
export const FILTER_TYPES = ['all', 'unread', 'pinned'] as const;
export type FilterType = typeof FILTER_TYPES[number];

// Recurrence types
export const RECURRENCE_TYPES = ['none', 'weekly', 'bi-weekly', 'monthly'] as const;
export type RecurrenceType = typeof RECURRENCE_TYPES[number];

// Task statuses
export const TASK_STATUSES = ['open', 'disabled', 'assigned', 'completed', 'paid'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];
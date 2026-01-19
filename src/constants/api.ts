// API endpoint constants

// Base API paths
export const API_BASE = '/api';

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  CALLBACK: '/auth/callback',
  CALLBACK_COMPLETE: '/auth/callback-complete',
} as const;

// Task-related endpoints
export const TASK_ENDPOINTS = {
  BASE: '/api/tasks',
  EDIT: (id: string) => `/api/tasks/${id}/edit`,
  TOGGLE_STATUS: (id: string) => `/api/tasks/${id}/toggle-status`,
} as const;

// Offer-related endpoints
export const OFFER_ENDPOINTS = {
  COUNTER_OFFERS: '/api/counter-offers',
} as const;

// Payment endpoints
export const PAYMENT_ENDPOINTS = {
  PAYTRAIL_CALLBACK: '/api/paytrail-callback',
  PAYTRAIL_CALLBACK_SIMULATE: '/api/paytrail-callback/simulate',
  PAYTRAIL_CALLBACK_TEST: '/api/paytrail-callback/test',
  TEST_PAYTRAIL: '/api/test-paytrail',
} as const;

// Search and template endpoints
export const SEARCH_ENDPOINTS = {
  TEMPLATES: '/api/search-templates',
  HERO_CATEGORIES: '/api/hero-categories',
  OPEN_TASKS: '/api/open-tasks',
} as const;

// Contact and support endpoints
export const SUPPORT_ENDPOINTS = {
  CONTACT: '/api/contact',
} as const;

// Cron job endpoints
export const CRON_ENDPOINTS = {
  EARLY_COMPLETION: '/api/cron/early-completion',
} as const;
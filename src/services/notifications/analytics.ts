/* Lightweight analytics helper. Replace with real provider when available. */

type AnalyticsPayload = Record<string, unknown>;

export function trackEvent(eventName: string, payload: AnalyticsPayload = {}): void {
  try {
    if (typeof window === 'undefined') return;
    // Console fallback; replace with dataLayer or provider call
    // eslint-disable-next-line no-console
    console.debug('[analytics]', eventName, payload);
    // Example: window.dataLayer?.push({ event: eventName, ...payload });
  } catch {
    // no-op
  }
}



'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type ConsentPreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const CONSENT_COOKIE_NAME = 'tmvp_consent';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function readConsentCookie(): ConsentPreferences | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!match) return null;
  try {
    const value = decodeURIComponent(match.split('=')[1] ?? '');
    const parsed = JSON.parse(value) as ConsentPreferences;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      parsed.necessary === true &&
      typeof parsed.analytics === 'boolean' &&
      typeof parsed.marketing === 'boolean'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeConsentCookie(preferences: ConsentPreferences): void {
  if (typeof document === 'undefined') return;
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const value = encodeURIComponent(JSON.stringify(preferences));
  const parts = [
    `${CONSENT_COOKIE_NAME}=${value}`,
    'Path=/',
    `Max-Age=${ONE_YEAR_SECONDS}`,
    'SameSite=Lax',
  ];
  if (isSecure) parts.push('Secure');
  document.cookie = parts.join('; ');
}

export default function CookieConsentBanner(): JSX.Element | null {
  const existingConsent = useMemo(readConsentCookie, []);
  const [visible, setVisible] = useState<boolean>(false);
  const [analytics, setAnalytics] = useState<boolean>(false);
  const [marketing, setMarketing] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (!existingConsent) {
      setVisible(true);
    } else {
      setAnalytics(existingConsent.analytics);
      setMarketing(existingConsent.marketing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Allow opening the banner from elsewhere (e.g., footer link)
  useEffect(() => {
    const openHandler = () => {
      setVisible(true);
      setExpanded(true);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('open-cookie-consent', openHandler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-cookie-consent', openHandler);
      }
    };
  }, []);

  function saveAndClose(next: { analytics: boolean; marketing: boolean }): void {
    writeConsentCookie({ necessary: true, analytics: next.analytics, marketing: next.marketing });
    setVisible(false);
  }

  if (!visible) return null;

  // Collapsed (compact) view
  if (!expanded) {
    return (
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[10000] flex justify-center p-3"
        role="dialog"
        aria-live="polite"
        aria-label="Evästeasetukset (supistettu)"
      >
        <div className="pointer-events-auto w-full max-w-5xl rounded-full border border-gray-200 bg-white/95 p-2 shadow-2xl backdrop-blur transition-all duration-300 ease-out dark:border-gray-800 dark:bg-gray-900/95">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="px-2 text-sm text-gray-700 dark:text-gray-300">
              Käytämme evästeitä kokemuksen parantamiseksi.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Avaa asetukset
              </button>
              <button
                type="button"
                onClick={() => saveAndClose({ analytics: true, marketing: true })}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Hyväksy kaikki
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Expanded (full) view
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[10000] flex justify-center p-3 md:p-4"
      role="dialog"
      aria-live="polite"
      aria-label="Evästeasetukset"
    >
      <div className="pointer-events-auto w-full max-w-5xl rounded-xl border border-gray-200 bg-white p-3 shadow-2xl transition-all duration-300 ease-out dark:border-gray-800 dark:bg-gray-900 md:p-4">
        <div className="flex flex-col gap-3 transition-all duration-300 ease-out md:flex-row md:items-center md:justify-between md:gap-4">
          {/* Left: title + summary */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Evästeet</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Käytämme välttämättömiä evästeitä sekä suostumuksella analytiikkaa ja markkinointia. Lue lisää{' '}
                  <Link href="/cookies" className="text-emerald-600 underline hover:text-emerald-700 dark:text-emerald-400">
                    evästekäytännöistämme
                  </Link>
                  .
                </p>
              </div>
              <button
                type="button"
                aria-label="Supista evästebanneri"
                onClick={() => setExpanded(false)}
                className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                title="Supista"
              >
                ▾
              </button>
            </div>
          </div>

          {/* Middle: toggles */}
          <div className="flex max-h-64 flex-1 flex-wrap items-center gap-2 overflow-hidden transition-[max-height] duration-300 ease-out md:max-h-64 md:justify-center">
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800">
              <input type="checkbox" checked readOnly className="h-4 w-4 cursor-not-allowed" />
              <span className="text-gray-800 dark:text-gray-200">Välttämättömät</span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              <span className="text-gray-800 dark:text-gray-200">Analytiikka</span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />
              <span className="text-gray-800 dark:text-gray-200">Markkinointi</span>
            </label>
          </div>

          {/* Right: actions */}
          <div className="flex flex-1 items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => saveAndClose({ analytics: false, marketing: false })}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Hylkää ei‑välttämättömät
            </button>
            <button
              type="button"
              onClick={() => saveAndClose({ analytics, marketing })}
              className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Tallenna valinnat
            </button>
            <button
              type="button"
              onClick={() => saveAndClose({ analytics: true, marketing: true })}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Hyväksy kaikki
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



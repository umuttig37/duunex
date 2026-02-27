'use client';

export default function ResetConsentButton(): JSX.Element {
  function reset(): void {
    if (typeof document === 'undefined') return;
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const parts = ['tmvp_consent=; Path=/', 'Max-Age=0', 'SameSite=Lax'];
    if (isSecure) parts.push('Secure');
    document.cookie = parts.join('; ');
    if (typeof window !== 'undefined') window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={reset}
      className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
    >
      Tyhjennä suostumus ja näytä banneri uudelleen
    </button>
  );
}



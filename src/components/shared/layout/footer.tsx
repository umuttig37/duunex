'use client';

import Link from 'next/link';

import { BrandLogo } from '@/components/shared/brand/brand-logo';

const footerSections = {
  categories: [
    { label: 'Siivous', href: '/dashboard/tasks/new?category=siivous' },
    { label: 'Kokoonpano', href: '/dashboard/tasks/new?category=kokoonpano' },
    { label: 'Asennus', href: '/dashboard/tasks/new?category=asennus' },
    { label: 'Muutto', href: '/dashboard/tasks/new?category=muutto' },
    { label: 'IT-apu', href: '/dashboard/tasks/new?category=it-apu' },
    { label: 'Puutarha', href: '/dashboard/tasks/new?category=puutarha' },
  ],
  clients: [
    { label: 'Luo tehtävä', href: '/dashboard/tasks/new' },
    { label: 'Kirjaudu sisään', href: '/login' },
    { label: 'Rekisteröidy', href: '/signup' },
    { label: 'Yhteystiedot', href: '/yhteystiedot' },
  ],
  taskers: [
    { label: 'Ryhdy tekijäksi', href: '/signup/tasker' },
    { label: 'Kirjaudu', href: '/login' },
    { label: 'Tietosuoja', href: '/privacy' },
    { label: 'Käyttöehdot', href: '/terms' },
  ],
  legal: [
    { label: 'Tietosuoja', href: '/privacy' },
    { label: 'Käyttöehdot', href: '/terms' },
    { label: 'Evästekäytännöt', href: '/cookies' },
    { label: 'Yhteystiedot', href: '/yhteystiedot' },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div className="max-w-md">
            <Link
              href="/"
              className="inline-flex rounded-md bg-white px-2 py-1 shadow-sm transition-opacity hover:opacity-90"
            >
              <BrandLogo variant="wordmark" className="h-8 w-auto max-w-[160px]" sizes="160px" />
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-slate-300">
              Duunex auttaa löytämään tekijän arjen töihin, muuttoihin, pieniin asennuksiin
              ja muihin käytännön toimeksiantoihin ilman ylimääräisiä välivaiheita.
            </p>
            <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              Kategoriat on koottu yleisimpiin kotipalveluihin, kuljetuksiin, digitukeen
              ja muihin arjen tarpeisiin, jotta työn julkaiseminen on nopeaa heti alusta asti.
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-tight text-white">Kategoriat</h3>
            <ul className="space-y-3">
              {footerSections.categories.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-sky-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-tight text-white">Käyttäjille</h3>
            <ul className="space-y-3">
              {footerSections.clients.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-sky-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="mb-4 mt-8 text-sm font-semibold tracking-tight text-white">Tekijöille</h3>
            <ul className="space-y-3">
              {footerSections.taskers.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-sky-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-tight text-white">Palvelu</h3>
            <ul className="space-y-3">
              {footerSections.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-sky-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() =>
                typeof window !== 'undefined' && window.dispatchEvent(new Event('open-cookie-consent'))
              }
              className="mt-6 rounded-md border border-white/15 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-sky-300 hover:text-sky-300"
            >
              Muuta evästeasetuksia
            </button>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-sm text-slate-500">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>© {currentYear} Duunex. Kaikki oikeudet pidätetään.</div>
            <div>Selkeä polku työn luonnista yhteydenottoon ja etenemisen seurantaan.</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

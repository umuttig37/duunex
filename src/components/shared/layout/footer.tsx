'use client';

import { Mail, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const teamMembers = [
  {
    id: 'umut',
    name: 'Umut Ugyr',
    role: 'Toimitusjohtaja',
    email: 'umut@taskmvp.fi',
    avatar: '/images/testmonials/mikael.jpg',
  },
  {
    id: 'riku',
    name: 'Riku Kaartoaho',
    role: 'Tekninen asiantuntija',
    email: 'riku@taskmvp.fi',
    avatar: '/images/testmonials/lady.jpg',
  },
  {
    id: 'support',
    name: 'Asiakaspalvelu',
    role: 'Tuki & apu',
    email: 'info@taskmvp.fi',
    avatar: '/images/testmonials/maria.png',
  },
];

// Fiverr-style footer structure
const footerSections = {
  categories: [
    { label: 'Siivous', href: '/categories/siivous' },
    { label: 'Korjaukset', href: '/categories/korjaukset' },
    { label: 'Asennus', href: '/categories/asennus' },
    { label: 'Maalaus', href: '/categories/maalaus' },
    { label: 'Kuljetus', href: '/categories/kuljetus' },
    { label: 'Pihatöt', href: '/categories/pihatyot' },
  ],
  clients: [
    { label: 'Luo tehtävä', href: '/dashboard/tasks/new' },
    { label: 'Miten se toimii', href: '/how-it-works' },
    { label: 'Turvallisuus ja luottamus', href: '/trust-safety' },
    { label: 'Asiakastarinoita', href: '/success-stories' },
    { label: 'Palvelun laatu', href: '/quality-guide' },
    { label: 'Tuki käyttäjille', href: '/client-help' },
  ],
  taskers: [
    { label: 'Ryhdy tekijäksi', href: '/signup/tasker' },
    { label: 'Tekijän ohjeet', href: '/tasker-guide' },
    { label: 'Ansaintamahdollisuudet', href: '/earnings' },
    { label: 'Tekijäyhteisö', href: '/tasker-community' },
    { label: 'Työkaluja tekijöille', href: '/tasker-tools' },
    { label: 'Tuki tekijöille', href: '/tasker-help' },
  ],
  company: [
    { label: 'Tietoja meistä', href: '/about' },
    { label: 'Tuki ja apu', href: '/support' },
    { label: 'Yhteisövastuu', href: '/social-impact' },
    { label: 'Ura TaskMVP:ssa', href: '/careers' },
    { label: 'Käyttöehdot', href: '/terms' },
    { label: 'Tietosuoja', href: '/privacy' },
    { label: 'Evästeasetukset', href: '/cookies' },
    { label: 'Yhteistyökumppanit', href: '/partnerships' },
  ],
};

const companyInfo = {
  name: 'TaskMVP Oy',
  address: 'Aleksanterinkatu 15 A 3',
  city: '00100 Helsinki',
  email: 'info@taskmvp.fi',
  phone: '+358 9 123 4567',
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
          <div>
            <h3 className="text-sm font-semibold mb-6 text-background tracking-tight">Kategoriat</h3>
            <ul className="space-y-3">
              {footerSections.categories.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-zinc-400 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-6 text-background tracking-tight">Käyttäjille</h3>
            <ul className="space-y-3">
              {footerSections.clients.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-zinc-400 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-6 text-background tracking-tight">Tekijöille</h3>
            <ul className="space-y-3">
              {footerSections.taskers.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-zinc-400 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-6 text-background tracking-tight">Yritys</h3>
            <ul className="space-y-3">
              {footerSections.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-zinc-400 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-6 text-background tracking-tight">Yhteystiedot</h3>
            <div className="space-y-3 text-sm text-zinc-400 mb-6">
              <div className="font-medium text-background">{companyInfo.name}</div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <div>{companyInfo.address}<br />{companyInfo.city}</div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a href={`mailto:${companyInfo.email}`} className="hover:text-primary transition-colors break-all">
                  {companyInfo.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <a href={`tel:${companyInfo.phone}`} className="hover:text-primary transition-colors">
                  {companyInfo.phone}
                </a>
              </div>
            </div>
            <div className="p-3 bg-background rounded-md">
              <div className="flex items-center gap-2">
                <Image src="/images/hero/paytrail.png" alt="Paytrail" width={60} height={20} className="h-5 w-auto" />
                <div>
                  <div className="text-xs font-medium text-foreground">Turvallinen</div>
                  <div className="text-xs text-muted-foreground">maksu</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-700 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">TM</div>
                <span className="text-lg font-semibold text-background">TaskMVP</span>
              </Link>
              <p className="text-sm text-zinc-500">Luotettava kotipalvelujen markkinapaikka</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-zinc-500">
              <div>© {currentYear} TaskMVP Oy. Kaikki oikeudet pidätetään.</div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new Event('open-cookie-consent'))}
                  className="rounded-md border border-zinc-600 px-3 py-1.5 text-zinc-400 transition-colors hover:border-primary hover:text-primary"
                >
                  Evästeasetukset
                </button>
                <span>Tehty Helsingissä</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
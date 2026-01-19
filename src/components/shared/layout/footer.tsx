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
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Fiverr-style Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Categories Section */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Kategoriat</h3>
            <ul className="space-y-3">
              {footerSections.categories.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Clients Section */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Käyttäjille</h3>
            <ul className="space-y-3">
              {footerSections.clients.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Taskers Section */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Tekijöille</h3>
            <ul className="space-y-3">
              {footerSections.taskers.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Yritys</h3>
            <ul className="space-y-3">
              {footerSections.company.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Trust Section */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Yhteystiedot</h3>
            
            {/* Company Info */}
            <div className="space-y-3 text-sm text-gray-300 mb-6">
              <div className="font-semibold text-white">{companyInfo.name}</div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                <div>
                  {companyInfo.address}<br />
                  {companyInfo.city}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <a href={`mailto:${companyInfo.email}`} className="hover:text-emerald-400 transition-colors break-all">
                  {companyInfo.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <a href={`tel:${companyInfo.phone}`} className="hover:text-emerald-400 transition-colors">
                  {companyInfo.phone}
                </a>
              </div>
            </div>

            {/* Paytrail Trust Badge */}
            <div className="p-3 bg-white rounded-lg">
              <div className="flex items-center gap-2">
                <Image
                  src="/images/hero/paytrail.png"
                  alt="Paytrail"
                  width={60}
                  height={20}
                  className="h-5 w-auto"
                />
                <div>
                  <div className="text-xs font-medium text-gray-900">Turvallinen</div>
                  <div className="text-xs text-gray-600">maksu</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                  TM
                </div>
                <span className="text-xl font-bold text-emerald-400">TaskMVP</span>
              </Link>
              <p className="text-sm text-gray-400">
                Luotettava kotipalvelujen markkinapaikka
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-gray-400">
              <div>
                © {currentYear} TaskMVP Oy. Kaikki oikeudet pidätetään.
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new Event('open-cookie-consent'))
                    }
                  }}
                  className="rounded-md border border-gray-700 px-3 py-1.5 text-gray-300 transition-colors hover:border-emerald-500 hover:text-white"
                >
                  Evästeasetukset
                </button>
                <span>Tehty ❤️:llä Helsingissä</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
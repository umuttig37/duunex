'use client';

import HeroSearchBar from '@/components/features/landing/hero/hero-search-bar';
import { Button } from '@/components/ui/button';
import { Brush, Hammer, Settings, TreePine, Truck, Wrench } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const categories = [
  { icon: Settings, label: 'Kokoonpano' },
  { icon: Brush, label: 'Siivous' },
  { icon: Hammer, label: 'Asennus' },
  { icon: Truck, label: 'Muutto' },
  { icon: Wrench, label: 'Korjaus' },
  { icon: TreePine, label: 'Puutarha' },
];

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 pt-24 sm:pt-28 pb-12 lg:pb-20 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-300/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-blue-300/25 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-purple-300/25 rounded-full blur-xl animate-pulse delay-500"></div>
        <div className="absolute top-60 right-1/3 w-16 h-16 bg-orange-300/20 rounded-full blur-xl animate-pulse delay-1500"></div>
      </div>
      <div className="max-w-7xl mx-auto px-4">
        {/* Trust indicator at top */}
        <div className="text-center mb-8">
          <p className="text-sm text-emerald-700 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-100 to-emerald-50 border border-emerald-200 rounded-full px-4 py-2 mx-auto w-fit shadow-sm">
            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Luotettava kotipalvelujen markkinapaikka
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center relative">
          {/* Left column - Content */}
          <div className="lg:col-span-3 relative z-10">
            {/* Main heading */}
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Löydä luotettavaa apua{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                kotiin, tänään
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-700 mb-8 max-w-xl">
              Siivouspalveluista huonekalujen kokoamiseen, tarkistetut auttajat ovat valmiina kun tarvitset.
            </p>

            {/* Search bar */}
            <div className="mb-8">
              <HeroSearchBar
                variant="clean"
                placeholder="Mitä tarvitset? Esim. siivous, lastenhoito..."
                className="mb-4"
              />
            </div>

            {/* Category badges with vibrant colors */}
            <div className="flex flex-wrap gap-3 mb-8">
              {categories.map(({ icon: Icon, label }, index) => {
                const colors = [
                  'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
                  'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200', 
                  'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200',
                  'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200',
                  'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200',
                  'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200'
                ];
                return (
                  <div
                    key={label}
                    className={`flex items-center gap-2 border rounded-full px-4 py-2.5 text-sm font-medium transition-all cursor-pointer shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${colors[index % colors.length]}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                );
              })}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col mx-4 sm:flex-row gap-4 mb-8">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-emerald-200 transition-all"
              >
                <Link href="/dashboard/tasks/new">Luo tehtävä</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 px-8 py-3 rounded-lg font-medium shadow-sm transition-all"
              >
                <Link href="/register/tasker">Ryhdy tekijäksi</Link>
              </Button>
            </div>

            {/* Trust text and Paytrail logo */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <p className="text-sm text-gray-500">
                Luottaa yli 10 000 kotitaloutta • Tyytyväisyystakuu
              </p>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                <Image
                  src="/images/hero/paytrail.png"
                  alt="Paytrail"
                  width={80}
                  height={20}
                  className="h-5 w-auto"
                />
                <span className="text-xs text-gray-600">Turvallinen maksu</span>
              </div>
            </div>
          </div>

          {/* Right column - Hero illustration */}
          <div className="lg:col-span-2 relative z-10">
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden backdrop-blur-sm relative">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/30 via-blue-100/20 to-purple-100/25 pointer-events-none"></div>
              <Image
                src="/images/hero/hero-home-services.jpg"
                alt="Home services illustration - people helping with moving, organizing and plant care"
                width={600}
                height={1200}
                className="w-full h-full object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

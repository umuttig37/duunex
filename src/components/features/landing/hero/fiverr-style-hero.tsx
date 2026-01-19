'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const FiverrStyleHero = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Popular service categories
  const serviceCategories = [
    { name: 'Verkkosivun kehitys', href: '/categories/website-development', color: 'bg-blue-600' },
    { name: 'Arkkitehtuuri & sisustus', href: '/categories/architecture-interior', color: 'bg-green-600' },
    { name: 'UGC videot', href: '/categories/ugc-videos', color: 'bg-purple-600' },
    { name: 'Video muokkaus', href: '/categories/video-editing', color: 'bg-red-600' },
    { name: 'Video koodaus', href: '/categories/video-coding', color: 'bg-yellow-600' },
  ];

  // Trust partners/payment methods
  const trustBadges = [
    { name: 'Meta', logo: '/trust-badges/meta.png' },
    { name: 'Google', logo: '/trust-badges/google.png' },
    { name: 'Netflix', logo: '/trust-badges/netflix.png' },
    { name: 'P&G', logo: '/trust-badges/pg.png' },
    { name: 'PayPal', logo: '/trust-badges/paypal.png' },
    { name: 'Payoneer', logo: '/trust-badges/payoneer.png' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <section className="relative h-[500px] md:h-[600px] overflow-hidden">
      {/* Background Image with Professional Overlay */}
      <div className="absolute inset-0">
        {/* Using a professional background image URL - you'll need to replace with actual image */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700">
          {/* Simulating the professional background image from Fiverr */}
          <div className="absolute inset-0 opacity-40">
            <div className="w-full h-full bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-teal-800/30"></div>
          </div>
          {/* Professional overlay pattern */}
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex flex-col justify-center h-full text-center">
          {/* Main Heading - Professional Typography */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight tracking-tight">
              Meidän tekijämme
            </h1>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
              hoitavat sen tästä eteenpäin
            </h1>
          </div>

          {/* Professional Search Bar */}
          <div className="max-w-3xl mx-auto mb-10">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 backdrop-blur-sm">
                <Input
                  type="text"
                  placeholder="Etsi mitä tahansa palvelua..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-none focus-visible:ring-0 text-lg py-6 px-8 bg-transparent placeholder:text-gray-500"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 px-10 py-6 rounded-none font-semibold text-base transition-all duration-200 hover:shadow-lg"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>

          {/* Professional Service Category Pills */}
          <div className="mb-16">
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-5xl mx-auto px-4">
              {serviceCategories.map((service) => (
                <Link key={service.name} href={service.href}>
                  <div className={`
                      ${service.color} hover:shadow-xl transition-all duration-300
                      text-white border-0 px-6 py-3 text-base font-semibold
                      whitespace-nowrap cursor-pointer rounded-full
                      hover:scale-105 transform backdrop-blur-sm
                      shadow-lg hover:shadow-2xl
                      bg-gradient-to-r hover:brightness-110
                    `}
                  >
                    {service.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-auto pb-8">
            <p className="text-white/80 text-sm mb-4 font-medium">Luotettu partneri:</p>
            <div className="flex justify-center items-center space-x-6 md:space-x-8 flex-wrap gap-4 opacity-80">
              {trustBadges.map((badge) => (
                <div key={badge.name} className="text-white/90 font-semibold text-sm">
                  {badge.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FiverrStyleHero;
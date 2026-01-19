'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PremiumCTASection() {
  return (
    <section className="py-20 md:py-24 bg-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          {/* Left Column - Content */}
          <div className="max-w-lg">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-800 leading-tight mb-6">
              Aloita nyt
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-2">
              Julkaise tehtävä minuuteissa ja löydä luotettavat tekijät.
            </p>
            <p className="text-lg text-gray-500 leading-relaxed mb-10">
              Selkeä hinnoittelu ja turvallinen maksu.
            </p>

            <Button
              asChild
              className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full transition-colors duration-200"
            >
              <Link href="/dashboard/tasks/new">
                Aloita tehtävä
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </Button>
          </div>

          {/* Right Column - Features */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-lg font-medium text-slate-700">Nopea integraatio</span>
            </div>

            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-lg font-medium text-slate-700">24/7 Asiakastuki</span>
            </div>

            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-lg font-medium text-slate-700">Skaalautuvuus</span>
            </div>

            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-lg font-medium text-slate-700">Satojen tekijöiden verkosto</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



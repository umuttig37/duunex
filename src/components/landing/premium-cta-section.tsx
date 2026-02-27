'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PremiumCTASection() {
  const Check = () => (
    <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
  return (
    <section className="py-16 md:py-20 bg-muted/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div className="max-w-lg">
            <h2 className="text-4xl md:text-5xl font-semibold text-foreground tracking-tight leading-tight mb-4">
              Aloita nyt
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-2">
              Julkaise tehtävä minuuteissa ja löydä luotettavat tekijät.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              Selkeä hinnoittelu ja turvallinen maksu.
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium px-6 py-3">
              <Link href="/dashboard/tasks/new">
                Aloita tehtävä
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            {['Nopea integraatio', '24/7 Asiakastuki', 'Skaalautuvuus', 'Satojen tekijöiden verkosto'].map((label) => (
              <div key={label} className="flex items-center gap-3">
                <Check />
                <span className="text-base font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}



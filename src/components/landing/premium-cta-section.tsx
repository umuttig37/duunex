'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

const benefits = [
  'Kymmenet palvelukategoriat valmiina kotiin, muuttoihin ja pieniin projekteihin',
  'Työn kuvaus, viestit ja eteneminen samassa paikassa',
  'Helppo tapa aloittaa myös silloin, kun tarvitset vain yhden tekijän yhteen käyntiin',
];

export default function PremiumCTASection() {
  return (
    <section className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-500 py-16 text-white md:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white/90">
            Aloita helposti
          </div>
          <h2 className="mb-4 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            Kun tarve tulee, työn saa nopeasti liikkeelle
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
            Valitse sopiva kategoria, kuvaa työ omin sanoin ja etene omaan tahtiin.
            Duunex on tehty tilanteisiin, joissa haluat päästä suoraan itse tekemiseen
            ilman turhaa välikerrosta.
          </p>
        </div>

        <div className="rounded-lg border border-white/15 bg-white/10 p-6 backdrop-blur-sm">
          <div className="space-y-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 text-sm leading-relaxed text-white/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-200" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-white text-sky-700 hover:bg-white/90">
              <Link href="/dashboard/tasks/new">
                Luo tehtävä
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/signup/tasker">Ryhdy tekijäksi</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

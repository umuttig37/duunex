'use client';

// Legacy components removed - using standard components
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export default function TaskMvpCtaSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left Column - Content */}
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Aloita TaskMVPn käyttö jo tänään ja ala tienaa rahaa
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-10">
              Luo tehtäväsi tai ilmoittaudu tekijäksi minuuteissa. TaskMVP auttaa sinua
              löytämään oikeat asiakkaat ja aloittamaan tienaamisen nopeasti ja
              turvallisesti.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-6 py-3 transition-colors duration-200"
              >
                <Link href="/dashboard/tasks/new">
                  Aloita tehtävä
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full"
              >
                <Link href="/yhteystiedot">Ota yhteyttä</Link>
              </Button>
            </div>
          </div>

          {/* Right Column - Testimonial */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 md:p-8">
            <p className="text-gray-800 text-base md:text-lg leading-relaxed">
              “Manu vastasi nopeasti, oli erittäin ammattimainen ja toimitti
              verkkosivun viikossa. Erittäin hyvä työ. Odotan innolla uutta
              yhteistyötä.”
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Image
                src="/images/testmonials/leena.jpg"
                alt="Asiakasavatar"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div>
                <div className="text-sm font-semibold text-gray-900">Asiakas</div>
                <div className="text-xs text-gray-500">Yrittäjä</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



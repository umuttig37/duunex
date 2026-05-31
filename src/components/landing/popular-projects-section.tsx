'use client';

import Image from 'next/image';
import Link from 'next/link';

type ProjectExample = {
  title: string;
  subtitle: string;
  categorySlug: string;
  image: string;
};

const items: ProjectExample[] = [
  {
    title: 'Muuttosiivous ennen avainten luovutusta',
    subtitle: 'Siivous',
    categorySlug: 'siivous',
    image: '/images/cleaning.png',
  },
  {
    title: 'IKEA-kaapin kokoaminen ja oikaisu',
    subtitle: 'Kokoonpano',
    categorySlug: 'kokoonpano',
    image: '/images/mountingtv.png',
  },
  {
    title: 'Valaisimen ja verhokiskon asennus samaan käyntiin',
    subtitle: 'Asennus',
    categorySlug: 'asennus',
    image: '/images/mountingtv.png',
  },
  {
    title: 'Muuttoapu kerrostalokaksioon',
    subtitle: 'Muutto',
    categorySlug: 'muutto',
    image: '/images/movingco.png',
  },
  {
    title: 'Pihan kevätsiivous ja pensaiden siistiminen',
    subtitle: 'Puutarha',
    categorySlug: 'puutarha',
    image: '/images/hero/hero-home-services.jpg',
  },
  {
    title: 'WiFi-yhteyden vianhaku etätyöpisteelle',
    subtitle: 'IT-apu',
    categorySlug: 'it-apu',
    image: '/images/pricing/womanlaptop.jpg',
  },
  {
    title: 'Lapsiperheen ilta-apu muutamaksi tunniksi',
    subtitle: 'Lastenhoito',
    categorySlug: 'lastenhoito',
    image: '/images/hero/hero-home-services.jpg',
  },
  {
    title: 'Koiran ulkoilutus työpäivän ajaksi',
    subtitle: 'Lemmikinhoito',
    categorySlug: 'lemmikinhoito',
    image: '/images/hero/hero-home-services.jpg',
  },
];

export default function PopularProjectsSection() {
  return (
    <section className="bg-slate-50/70 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex rounded-full border border-sky-200 bg-white px-3 py-1 text-sm font-medium text-sky-800">
              Tyypilliset toimeksiannot
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Yleisiä töitä, joihin palvelua käytetään
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Esimerkit auttavat hahmottamaan, millaisia töitä voi julkaista sellaisenaan
            tai käyttää pohjana omalle toimeksiannolle.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.title}
              href={`/dashboard/tasks/new?category=${item.categorySlug}`}
              className="overflow-hidden rounded-lg border border-border bg-white transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-sm"
            >
              <div className="relative aspect-[4/3] w-full bg-slate-100">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                  {item.subtitle}
                </div>
                <h3 className="text-base font-semibold leading-snug text-foreground">{item.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

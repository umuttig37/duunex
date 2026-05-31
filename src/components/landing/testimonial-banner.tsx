'use client';

import { serviceCatalogBySlug } from '@/constants/service-catalog';
import Link from 'next/link';

const serviceGroups = [
  {
    title: 'Koti ja siisteys',
    description: 'Työt, joilla koti pysyy toimivana arjessa ja muutoksissa.',
    categories: ['siivous', 'kotitalous', 'korjaukset', 'maalaus'],
  },
  {
    title: 'Muutto ja kuljetus',
    description: 'Kantaminen, tavaran siirto ja pienet logistiikkatarpeet.',
    categories: ['muutto', 'kuljetus', 'asiointiapu'],
  },
  {
    title: 'Asennukset ja tekniikka',
    description: 'Kalusteet, pienasennukset ja laitteet käyttövalmiiksi.',
    categories: ['kokoonpano', 'asennus', 'it-apu'],
  },
  {
    title: 'Perhe, lemmikit ja tapahtumat',
    description: 'Arjen tuki sekä tilanteet, joissa tarvitaan lisäkäsiä.',
    categories: ['lastenhoito', 'lemmikinhoito', 'juhlat', 'opetus'],
  },
];

const categoryChips = [
  'siivous',
  'kotitalous',
  'kokoonpano',
  'asennus',
  'korjaukset',
  'maalaus',
  'muutto',
  'kuljetus',
  'puutarha',
  'it-apu',
  'lastenhoito',
  'lemmikinhoito',
  'opetus',
  'valokuvaus',
  'suunnittelu',
  'asiointiapu',
  'juhlat',
  'muu',
];

export default function TestimonialBanner() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 max-w-3xl">
          <div className="mb-3 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-800">
            Palvelukatalogi
          </div>
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Palvelualueet on jäsennelty oikeita työtilanteita varten
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            Kategoriat ja alakategoriat kattavat kotipalvelut, muutot, pienasennukset,
            digituen, arjen avun ja useita muita yleisiä työtilanteita. Käyttäjä pääsee
            liikkeelle nopeasti ilman että jokainen tehtävä pitää keksiä alusta asti.
          </p>
        </div>

        <div className="mb-10 flex flex-wrap gap-2">
          {categoryChips.map((slug) => {
            const category = serviceCatalogBySlug[slug];
            if (!category) return null;

            return (
              <Link
                key={slug}
                href={`/dashboard/tasks/new?category=${slug}`}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-sky-300 hover:bg-sky-50"
              >
                {category.name_fi}
              </Link>
            );
          })}
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {serviceGroups.map((group) => (
            <section
              key={group.title}
              className="rounded-lg border border-border bg-slate-50/70 p-5"
            >
              <h3 className="mb-2 text-lg font-semibold text-foreground">{group.title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                {group.description}
              </p>

              <div className="space-y-4">
                {group.categories.map((slug) => {
                  const category = serviceCatalogBySlug[slug];
                  if (!category) return null;

                  return (
                    <div key={slug}>
                      <div className="mb-2 text-sm font-semibold text-foreground">
                        {category.name_fi}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {category.subcategories.slice(0, 4).map((subcategory) => (
                          <span
                            key={subcategory.slug}
                            className="rounded-full bg-white px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-border"
                          >
                            {subcategory.name_fi}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

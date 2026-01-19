"use client";

import Image from "next/image";
import Link from "next/link";

type ProjectItem = {
  title: string;
  subtitle: string;
  categorySlug: string; // matches categories slugs
  img: string; // remote image (picsum)
};

const items: ProjectItem[] = [
  {
    title: "Huonekalujen kokoaminen",
    subtitle: "Projektit alk. 49€",
    categorySlug: "kokoonpano",
    img: "https://picsum.photos/seed/assembly/640/420",
  },
  {
    title: "TV:n kiinnitys seinälle",
    subtitle: "Projektit alk. 69€",
    categorySlug: "kokoonpano",
    img: "/images/mountingtv.png",
  },
  {
    title: "Kodin järjestely",
    subtitle: "Projektit alk. 55€",
    categorySlug: "kotitalous",
    img: "https://picsum.photos/seed/organizing/640/420",
  },
  {
    title: "Tietokoneen asennus",
    subtitle: "Projektit alk. 75€",
    categorySlug: "it-apu",
    img: "https://picsum.photos/seed/computer/640/420",
  },
  {
    title: "Muuttoapu",
    subtitle: "Projektit alk. 67€",
    categorySlug: "muutto",
    img: "/images/movingco.png",
  },
  {
    title: "Kodin siivous",
    subtitle: "Projektit alk. 49€",
    categorySlug: "siivous",
    img: "/images/cleaning.png",
  },
  {
    title: "Pienet korjaukset",
    subtitle: "Projektit alk. 65€",
    categorySlug: "korjaukset",
    img: "/images/plumber.png",
  },
  {
    title: "Ruoanlaitto-apu",
    subtitle: "Projektit alk. 45€",
    categorySlug: "kotitalous",
    img: "https://picsum.photos/seed/cooking/640/420",
  },
];

export default function PopularProjectsSection() {
  return (
    <section className="pt-28 sm:pt-28 pb-8 sm:pb-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Suositut projektit</h2>
        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.title}
              href={`/dashboard/tasks/new?category=${item.categorySlug}`}
              className="group rounded-2xl bg-white border border-gray-200 hover:border-emerald-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover group-hover:scale-[1.02] transition-transform"
                  priority={false}
                />
              </div>
              <div className="p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-emerald-700">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{item.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

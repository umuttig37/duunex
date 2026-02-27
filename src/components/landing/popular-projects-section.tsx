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
    <section className="pt-20 sm:pt-24 pb-8 sm:pb-12 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-6">Suositut projektit</h2>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.title}
              href={`/dashboard/tasks/new?category=${item.categorySlug}`}
              className="group rounded-lg bg-card border border-border hover:border-primary/30 transition-all overflow-hidden"
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
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{item.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

import { CheckCircle2, FileText, MessageSquareText, SearchCheck } from 'lucide-react';
import Image from 'next/image';

const steps = [
  {
    number: '01',
    title: 'Kuvaa työ mahdollisimman selkeästi',
    description:
      'Valitse kategoria tai valmis pohja, lisää sijainti, aikataulu ja tarpeelliset lisätiedot. Mitä täsmällisempi kuvaus, sitä helpompi tekijän on vastata oikein.',
    icon: FileText,
  },
  {
    number: '02',
    title: 'Vertaa tekijöitä ja pidä keskustelu samassa paikassa',
    description:
      'Saat kiinnostuneita tekijöitä, tarjouksia tai suoria vastauksia tehtävään. Viestit, tarkennukset ja työn eteneminen pysyvät yhdessä näkymässä.',
    icon: MessageSquareText,
  },
  {
    number: '03',
    title: 'Vahvista sopiva tekijä ja vie työ maaliin',
    description:
      'Kun sopiva tekijä löytyy, vahvistat työn etenemisen ja seuraat tilannetta omalta dashboardilta. Näin koko prosessi pysyy hallittuna ensimmäisestä viestistä valmiiseen työhön.',
    icon: SearchCheck,
  },
];

const principles = [
  'Selkeä rakenne yleisimmille työtilanteille',
  'Mahdollisuus aloittaa myös ilman valmista pohjaa',
  'Sama näkymä tehtäville, viesteille ja etenemiselle',
];

export default function HowItWorksSection() {
  return (
    <section className="bg-background py-16 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
            Näin palvelu toimii
          </div>
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Kolme askelta, joilla työ lähtee liikkeelle
          </h2>
          <p className="mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Olipa kyse siivouksesta, muutosta tai pienestä asennuksesta, eteneminen pysyy
            samana: kuvaa tarve, tarkenna yksityiskohdat ja vie työ valmiiksi hallitusti.
          </p>

          <div className="space-y-6">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.number} className="flex gap-4 rounded-lg border border-border bg-slate-50/70 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                      {step.number}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:pt-6">
          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-lg font-semibold text-foreground">Käyttö ilman turhaa kitkaa</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Sama näkymä auttaa pitämään työn, viestit ja päätökset järjestyksessä.
              </p>
            </div>

            <div className="relative aspect-[4/3] border-b border-border bg-slate-100">
              <Image
                src="/images/how-it-works/userdashboard.png"
                alt="Duunexin dashboard-näkymä"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
            </div>

            <div className="space-y-3 px-5 py-5">
              {principles.map((principle) => (
                <div key={principle} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                  <span>{principle}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { Minus, Plus } from 'lucide-react';

const faqs = [
  {
    question: 'Miten työn julkaiseminen toimii?',
    answer:
      'Aloitat valitsemalla kategorian tai valmiin palvelupohjan, kuvaat työn omin sanoin ja lisäät sijainnin sekä aikataulun. Sen jälkeen voit jatkaa tehtävän luonnista eteenpäin dashboardiin.',
  },
  {
    question: 'Pitääkö minun tietää tarkka palveluluokka etukäteen?',
    answer:
      'Ei tarvitse. Duunexissa on laaja valikoima kategorioita ja alakategorioita, mutta tarvittaessa voit käyttää myös "Muu apu" -luokkaa ja kuvata tarpeesi tarkemmin tekstillä.',
  },
  {
    question: 'Voinko yhdistää useita pieniä töitä samaan tehtävään?',
    answer:
      'Kyllä. Monet arjen työt, kuten pienet asennukset, kodin järjestely ja asiointiapu, kannattaa kuvata samassa tehtävässä jos ne on tarkoitus hoitaa samalla käynnillä.',
  },
  {
    question: 'Missä näen viestit ja työn etenemisen?',
    answer:
      'Tehtävät, viestit ja jatkovaiheet on koottu dashboardiin. Tarkoitus on, että käyttäjän ei tarvitse hyppiä eri näkymien välillä pysyäkseen kärryillä tilanteesta.',
  },
  {
    question: 'Miten maksaminen etenee?',
    answer:
      'Maksamiseen liittyvät vaiheet tapahtuvat palvelun kautta siinä vaiheessa kun työ etenee vahvistukseen. Maksutapa ja työn ehdot on syytä tarkistaa aina ennen lopullista hyväksyntää.',
  },
  {
    question: 'Voiko palvelua käyttää myös yrityksen tai taloyhtiön pieniin tarpeisiin?',
    answer:
      'Kyllä. Sama tehtävänluonti sopii hyvin myös pieniin toimistoihin, liiketiloihin ja taloyhtiön yksittäisiin toimeksiantoihin, kun työ on rajattu selkeästi.',
  },
];

export default function FAQSection() {
  return (
    <section className="bg-background py-14 sm:py-16 md:py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
            Usein kysyttyä
          </div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            Mitä ennen aloittamista on hyvä tietää
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            Kokosimme yleisimmät kysymykset yhteen, jotta työn julkaiseminen on
            mahdollisimman suoraviivaista ensimmäisestä käynnistä alkaen.
          </p>
        </div>

        <div className="lg:col-span-3">
          <Accordion.Root type="single" collapsible className="divide-y divide-border border-y border-border">
            {faqs.map((faq) => (
              <Accordion.Item key={faq.question} value={faq.question} className="group">
                <Accordion.Trigger className="w-full py-5 text-left focus:outline-none">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-base font-medium text-foreground md:text-lg">{faq.question}</span>
                    <span className="shrink-0 text-primary">
                      <Plus className="h-5 w-5 group-data-[state=open]:hidden" />
                      <Minus className="hidden h-5 w-5 group-data-[state=open]:block" />
                    </span>
                  </div>
                </Accordion.Trigger>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <div className="pb-5 pr-8 text-sm leading-relaxed text-muted-foreground md:text-base">
                    {faq.answer}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </div>
    </section>
  );
}

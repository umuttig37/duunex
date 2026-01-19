'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { Minus, Plus } from 'lucide-react';

const faqs: { question: string; answer: string }[] = [
  {
    question: 'Miten maksut toimivat?',
    answer:
      'Turvallisesti Paytrailin kautta. Maksat vasta kun olet tyytyväinen työhön.',
  },
  {
    question: 'Paljonko palvelu maksaa?',
    answer:
      'Tehtävän julkaiseminen on ilmaista. Pieni palvelumaksu (5–10%) veloitetaan vain onnistuneista tehtävistä.',
  },
  {
    question: 'Kuinka ryhtyä tekijäksi?',
    answer:
      'Täytä tekijähakemus ja kerro osaamisestasi. Hyväksymme hakemukset yleensä 1–2 arkipäivässä.',
  },
  {
    question: 'Mitä jos en ole tyytyväinen?',
    answer:
      'Asiakaspalvelumme auttaa ratkaisemaan tilanteen. Tarvittaessa maksusi hyvitetään.',
  },
  {
    question: 'Onko palvelu saatavilla kaikkialla?',
    answer:
      'Laajennamme jatkuvasti. Syötä osoitteesi tehtävän luonnissa niin kerromme saatavuuden.',
  },
];

export default function FAQSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left: big heading */}
        <div className="lg:col-span-2">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-[1.1]">
            Usein kysytyt
            <br />
            kysymykset
          </h2>
        </div>

        {/* Right: minimalist list */}
        <div className="lg:col-span-3">
          <Accordion.Root type="single" collapsible className="divide-y divide-gray-200 border-y">
            {faqs.map((faq, index) => (
              <Accordion.Item key={index} value={`item-${index}`} className="group">
                <Accordion.Trigger className="w-full text-left py-5 focus:outline-none">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-base md:text-lg font-medium text-gray-900">
                      {faq.question}
                    </span>
                    <span className="shrink-0 text-emerald-600">
                      {/* plus/minus toggle */}
                      <Plus className="h-5 w-5 group-data-[state=open]:hidden" />
                      <Minus className="h-5 w-5 hidden group-data-[state=open]:block" />
                    </span>
                  </div>
                </Accordion.Trigger>
                <Accordion.Content className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
                  <div className="pb-5 pr-10 text-gray-600">
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



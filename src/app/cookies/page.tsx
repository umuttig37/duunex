import ResetConsentButton from '@/components/shared/cookie/ResetConsentButton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Evästekäytännöt | Duunex',
  description: 'Tietoa Duunex-palvelun evästeistä ja suostumusasetuksista.',
};

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Evästekäytännöt</h1>
      <p className="mb-4 text-gray-700">
        Duunex käyttää evästeitä palvelun perustoimintojen toteuttamiseen sekä suostumuksen
        perusteella analytiikkaan ja mahdolliseen markkinointiin.
      </p>

      <h2 className="mb-2 mt-8 text-xl font-semibold">Evästeluokat</h2>
      <ul className="list-disc space-y-2 pl-6 text-gray-700">
        <li>
          <span className="font-medium">Välttämättömät evästeet:</span> tarvitaan kirjautumiseen,
          turvallisuuteen ja palvelun keskeisiin toimintoihin.
        </li>
        <li>
          <span className="font-medium">Analytiikka:</span> auttaa ymmärtämään, miten palvelua
          käytetään ja missä kohtaa käyttökokemusta kannattaa parantaa.
        </li>
        <li>
          <span className="font-medium">Markkinointi:</span> mahdollistaa erillisen suostumuksen
          perusteella kohdennetumman viestinnän ja mittauksen.
        </li>
      </ul>

      <h2 className="mb-2 mt-8 text-xl font-semibold">Suostumuksen hallinta</h2>
      <p className="text-gray-700">
        Voit avata suostumusnäkymän uudelleen ja muuttaa asetuksiasi alla olevasta painikkeesta.
      </p>
      <ResetConsentButton />
    </div>
  );
}

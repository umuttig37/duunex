import ResetConsentButton from '@/components/shared/cookie/ResetConsentButton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Evästekäytännöt | Duunex',
  description: 'Tietoa Duunex:n evästeistä ja suostumusasetuksista.',
};

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Evästekäytännöt</h1>
      <p className="mb-4 text-gray-700">
        Käytämme evästeitä palvelun välttämättömien toimintojen mahdollistamiseksi sekä analytiikkaan ja markkinointiin suostumuksesi perusteella.
      </p>
      <h2 className="mt-8 mb-2 text-xl font-semibold">Evästeluokat</h2>
      <ul className="list-disc space-y-2 pl-6 text-gray-700">
        <li>
          <span className="font-medium">Välttämättömät:</span> tarvitaan sivuston perustoimintoihin. Aina käytössä.
        </li>
        <li>
          <span className="font-medium">Analytiikka:</span> auttaa ymmärtämään käyttöä ja kehittämään palvelua.
        </li>
        <li>
          <span className="font-medium">Markkinointi:</span> mahdollistaa personoidun mainonnan.
        </li>
      </ul>
      <h2 className="mt-8 mb-2 text-xl font-semibold">Suostumuksen hallinta</h2>
      <p className="text-gray-700">
        Voit muuttaa suostumustasi koska tahansa poistamalla suostumus-evästeen selaimestasi tai käyttämällä alla olevaa painiketta:
      </p>
      <ResetConsentButton />
      <p className="mt-8 text-sm text-gray-500">Viimeksi päivitetty: {new Date().toLocaleDateString('fi-FI')}</p>
    </div>
  );
}


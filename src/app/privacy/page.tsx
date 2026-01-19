import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tietosuojaseloste | TaskMVP',
  description: 'Tietoja henkilötietojen käsittelystä TaskMVP-palvelussa.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Tietosuojaseloste</h1>
      <p className="mb-4 text-gray-700">
        Tässä kuvataan, miten keräämme, käytämme ja suojaamme henkilötietoja TaskMVP-palvelussa.
      </p>
      <h2 className="mt-8 mb-2 text-xl font-semibold">1. Rekisterinpitäjä</h2>
      <p className="text-gray-700">TaskMVP Oy, Helsinki, Suomi. Yhteys: info@taskmvp.fi</p>
      <h2 className="mt-8 mb-2 text-xl font-semibold">2. Käsittelyn tarkoitus</h2>
      <p className="text-gray-700">
        Palvelun tuottaminen, asiakastuki, turvallisuus, analytiikka ja markkinointi suostumuksen perusteella.
      </p>
      <h2 className="mt-8 mb-2 text-xl font-semibold">3. Tietojen säilytys</h2>
      <p className="text-gray-700">Säilytämme tietoja vain niin kauan kuin se on tarpeellista.</p>
      <h2 className="mt-8 mb-2 text-xl font-semibold">4. Oikeutesi</h2>
      <p className="text-gray-700">
        Sinulla on oikeus tarkastaa tietosi, pyytää korjausta tai poistamista sekä rajoittaa käsittelyä sovellettavan lain mukaisesti.
      </p>
      <p className="mt-8 text-sm text-gray-500">Viimeksi päivitetty: {new Date().toLocaleDateString('fi-FI')}</p>
    </div>
  );
}



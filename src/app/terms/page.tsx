import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Käyttöehdot | Duunex',
  description: 'Duunex:n palvelun käyttöehdot.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Käyttöehdot</h1>
      <p className="mb-4 text-gray-700">
        Tämä sivu kuvaa Duunex-palvelun käyttöehdot. Päivitämme ehtoja tarpeen mukaan.
      </p>
      <h2 className="mt-8 mb-2 text-xl font-semibold">1. Palvelun kuvaus</h2>
      <p className="text-gray-700">
        Duunex on markkinapaikka, jossa asiakkaat voivat julkaista tehtäviä ja tekijät tarjota palveluitaan.
      </p>
      <h2 className="mt-8 mb-2 text-xl font-semibold">2. Käyttäjän vastuut</h2>
      <p className="text-gray-700">
        Käyttäjä sitoutuu antamaan oikeat tiedot, noudattamaan lakia ja hyvää tapaa sekä kunnioittamaan muita käyttäjiä.
      </p>
      <h2 className="mt-8 mb-2 text-xl font-semibold">3. Maksut ja peruutukset</h2>
      <p className="text-gray-700">
        Maksut välitetään maksupalveluntarjoajan kautta. Peruutusehdot kuvataan tarkemmin tilausvaiheessa.
      </p>
      <h2 className="mt-8 mb-2 text-xl font-semibold">4. Vastuunrajoitus</h2>
      <p className="text-gray-700">
        Palvelu tarjotaan sellaisena kuin se on. Emme vastaa välillisistä vahingoista sovellettavan lain sallimissa rajoissa.
      </p>
      <p className="mt-8 text-sm text-gray-500">Viimeksi päivitetty: {new Date().toLocaleDateString('fi-FI')}</p>
    </div>
  );
}



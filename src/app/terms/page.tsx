import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Käyttöehdot | Duunex',
  description: 'Duunex-palvelun yleiset käyttöehdot.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Käyttöehdot</h1>
      <p className="mb-4 text-gray-700">
        Duunex on alusta, jossa työn tilaaja voi julkaista tehtävän ja tekijä voi tarjota
        omaa osaamistaan sen toteuttamiseen. Alla on tiivistetty palvelun yleiset periaatteet.
      </p>

      <h2 className="mb-2 mt-8 text-xl font-semibold">1. Palvelun käyttö</h2>
      <p className="text-gray-700">
        Käyttäjä sitoutuu antamaan olennaiset tiedot oikein, käyttämään palvelua asiallisesti
        ja noudattamaan soveltuvaa lainsäädäntöä sekä hyvää toimintatapaa.
      </p>

      <h2 className="mb-2 mt-8 text-xl font-semibold">2. Tehtävät ja tarjoukset</h2>
      <p className="text-gray-700">
        Tehtävän tilaaja vastaa tehtävän kuvauksen oikeellisuudesta. Tekijä vastaa siitä,
        että hänen antamansa tiedot, osaaminen ja tarjouksen ehdot pitävät paikkansa.
      </p>

      <h2 className="mb-2 mt-8 text-xl font-semibold">3. Maksaminen</h2>
      <p className="text-gray-700">
        Maksamiseen liittyvät ehdot ja mahdolliset kulut esitetään käyttäjälle siinä vaiheessa,
        kun työ etenee vahvistukseen ja maksuprosessiin.
      </p>

      <h2 className="mb-2 mt-8 text-xl font-semibold">4. Vastuut</h2>
      <p className="text-gray-700">
        Alusta välittää tehtäviä ja viestintää osapuolten välillä. Käyttäjien tulee varmistaa
        työn sisältö, aikataulu, hinta ja mahdolliset ehdot ennen lopullisia sitoumuksia.
      </p>
    </div>
  );
}

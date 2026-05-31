import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tietosuojaseloste | Duunex',
  description: 'Tietoa henkilötietojen käsittelystä Duunex-palvelussa.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Tietosuojaseloste</h1>
      <p className="mb-4 text-gray-700">
        Tällä sivulla kuvataan yleistasolla, miten Duunex-palvelussa käsitellään
        käyttäjien, tekijöiden ja yhteydenottajien tietoja.
      </p>

      <h2 className="mb-2 mt-8 text-xl font-semibold">1. Mitä tietoja käsitellään</h2>
      <p className="text-gray-700">
        Palvelussa voidaan käsitellä esimerkiksi tilitietoja, yhteystietoja, tehtävien
        kuvauksia, viestejä, maksuihin liittyviä tapahtumatietoja sekä käyttöä koskevia
        teknisiä lokitietoja.
      </p>

      <h2 className="mb-2 mt-8 text-xl font-semibold">2. Miksi tietoja käsitellään</h2>
      <p className="text-gray-700">
        Tietoja käytetään palvelun tarjoamiseen, tehtävien välittämiseen, asiakastukeen,
        turvallisuuden ylläpitoon, väärinkäytösten ehkäisyyn sekä palvelun kehittämiseen.
      </p>

      <h2 className="mb-2 mt-8 text-xl font-semibold">3. Tietojen säilytys</h2>
      <p className="text-gray-700">
        Tietoja säilytetään vain niin kauan kuin se on tarpeen palvelun toteuttamiseksi,
        lakisääteisten velvoitteiden täyttämiseksi tai väärinkäytösten selvittämiseksi.
      </p>

      <h2 className="mb-2 mt-8 text-xl font-semibold">4. Käyttäjän oikeudet</h2>
      <p className="text-gray-700">
        Käyttäjällä on sovellettavan lainsäädännön mukaiset oikeudet tarkastaa tietonsa,
        pyytää virheiden korjausta, rajoittaa käsittelyä ja pyytää poistamista silloin
        kun siihen on laillinen peruste.
      </p>

      <h2 className="mb-2 mt-8 text-xl font-semibold">5. Yhteydenotot</h2>
      <p className="text-gray-700">
        Tietosuojaa tai henkilötietojen käsittelyä koskevissa kysymyksissä käytä
        Duunexin yhteydenottolomaketta yhteystietosivulla.
      </p>
    </div>
  );
}

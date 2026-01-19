'use client';

export interface DefaultTemplate {
  id: string;
  name_fi: string;
  description_fi: string;
  category_slug: string;
  popularity_score?: number;
  questions?: any[];
}

export const defaultTemplatesByCategory: Record<string, DefaultTemplate[]> = {
  siivous: [
    {
      id: 'tmpl_siivous_yleissiivous',
      name_fi: 'Yleissiivous',
      description_fi: 'Kodin perussiivous: imurointi, lattioiden pesu, tasojen pyyhintä ja kylpyhuoneen siistiminen.',
      category_slug: 'siivous',
      popularity_score: 10,
    },
    {
      id: 'tmpl_siivous_ikkunat',
      name_fi: 'Ikkunanpesu',
      description_fi: 'Ikkunoiden pesu sisä- ja ulkopuolelta, karmien ja puitteiden pyyhintä.',
      category_slug: 'siivous',
      popularity_score: 8,
    },
    {
      id: 'tmpl_siivous_muutto',
      name_fi: 'Muuttosiivous',
      description_fi: 'Perusteellinen muuttosiivous ennen luovutusta (kaapit, pinnat, kylpyhuone, keittiö).',
      category_slug: 'siivous',
      popularity_score: 9,
    },
  ],
  kokoonpano: [
    {
      id: 'tmpl_kokoonpano_ikae',
      name_fi: 'IKEA-huonekalujen kokoaminen',
      description_fi: 'Hyllyjen, kaappien, sängyn ja muiden IKEA-kalusteiden kokoaminen ohjeiden mukaan.',
      category_slug: 'kokoonpano',
      popularity_score: 10,
    },
    {
      id: 'tmpl_kokoonpano_tv',
      name_fi: 'TV:n seinäkiinnitys',
      description_fi: 'TV:n ja telineen asennus seinään, piuhat siististi, tarvittaessa kaapelikanava.',
      category_slug: 'kokoonpano',
      popularity_score: 9,
    },
    {
      id: 'tmpl_kokoonpano_tyopiste',
      name_fi: 'Työpisteen kokoaminen',
      description_fi: 'Sähköpöydän, tuolin ja oheislaitteiden kokoaminen sekä viimeistely.',
      category_slug: 'kokoonpano',
      popularity_score: 7,
    },
  ],
  muutto: [
    {
      id: 'tmpl_muutto_kantaminen',
      name_fi: 'Kantaminen ja lastaus',
      description_fi: 'Huonekalujen ja laatikoiden kantaminen sekä auton lastaus/purku.',
      category_slug: 'muutto',
      popularity_score: 9,
    },
    {
      id: 'tmpl_muutto_pakkaus',
      name_fi: 'Pakkausapu',
      description_fi: 'Tavaroiden pakkaaminen muuttolaatikoihin, suojaaminen ja merkintä.',
      category_slug: 'muutto',
      popularity_score: 7,
    },
    {
      id: 'tmpl_muutto_kuljetus',
      name_fi: 'Pieni kuljetusapu',
      description_fi: 'Yksittäisten kalusteiden/laatikoiden kuljetus pakettiautolla lähialueella.',
      category_slug: 'muutto',
      popularity_score: 6,
    },
  ],
  'it-apu': [
    {
      id: 'tmpl_it_asennus',
      name_fi: 'Tietokoneen käyttöönotto',
      description_fi: 'Windows/macOS käyttöönotto, käyttäjätilit, päivitykset ja perusohjelmat.',
      category_slug: 'it-apu',
      popularity_score: 10,
    },
    {
      id: 'tmpl_it_tulostin',
      name_fi: 'Tulostimen asennus',
      description_fi: 'Tulostimen kytkentä verkkoon, ajurit, testitulostus ja peruskäyttö.',
      category_slug: 'it-apu',
      popularity_score: 8,
    },
    {
      id: 'tmpl_it_wififix',
      name_fi: 'WiFi-ongelmien korjaus',
      description_fi: 'Hitaan tai pätkivän WiFin vianhaku, kanavanvaihto ja sijoittelun optimointi.',
      category_slug: 'it-apu',
      popularity_score: 7,
    },
  ],
  kotitalous: [
    {
      id: 'tmpl_koti_jarjestys',
      name_fi: 'Kodin järjestely',
      description_fi: 'Vaatekaappien, varaston tai keittiön järjestely ja säilytysratkaisut.',
      category_slug: 'kotitalous',
      popularity_score: 8,
    },
    {
      id: 'tmpl_koti_pienetkorjaukset',
      name_fi: 'Pienet kodin korjaukset',
      description_fi: 'Taulujen kiinnitys, listat, silikonisaumat ja muut pikkuhuollot.',
      category_slug: 'kotitalous',
      popularity_score: 7,
    },
    {
      id: 'tmpl_koti_asennukset',
      name_fi: 'Pienasennukset',
      description_fi: 'Kiskot, naulakot, verhotangot ja valaisimet valmistajan ohjeilla.',
      category_slug: 'kotitalous',
      popularity_score: 6,
    },
  ],
  puutarha: [
    {
      id: 'tmpl_puutarha_nurmi',
      name_fi: 'Nurmikon leikkuu',
      description_fi: 'Nurmikon leikkaus, roskien poisto ja rajaus tarvittaessa.',
      category_slug: 'puutarha',
      popularity_score: 9,
    },
    {
      id: 'tmpl_puutarha_pensaiden_leikkaus',
      name_fi: 'Pensaiden leikkaus',
      description_fi: 'Pensasaidan ja pensaiden siistiminen kauden mukaan.',
      category_slug: 'puutarha',
      popularity_score: 7,
    },
    {
      id: 'tmpl_puutarha_syys',
      name_fi: 'Syys-/kevätsiivous pihalla',
      description_fi: 'Lehtien haravointi, risujen poisto ja yleissiistiminen.',
      category_slug: 'puutarha',
      popularity_score: 6,
    },
  ],
  korjaus: [
    {
      id: 'tmpl_korjaus_taulut',
      name_fi: 'Taulujen ja hyllyjen kiinnitys',
      description_fi: 'Taulujen, peilien ja hyllyjen asennus seinämateriaalin mukaan.',
      category_slug: 'korjaus',
      popularity_score: 8,
    },
    {
      id: 'tmpl_korjaus_oikaisu',
      name_fi: 'Kaapinoven oikaisu',
      description_fi: 'Löystyneiden saranoiden kiristys ja ovien säätö.',
      category_slug: 'korjaus',
      popularity_score: 6,
    },
    {
      id: 'tmpl_korjaus_silikonit',
      name_fi: 'Silikonisaumojen uusinta',
      description_fi: 'Kylpyhuoneen/keittiön silikonien poisto ja uusinta.',
      category_slug: 'korjaus',
      popularity_score: 7,
    },
  ],
  lemmikinhoito: [
    {
      id: 'tmpl_lemmikki_ulkoilutus',
      name_fi: 'Koiran ulkoilutus',
      description_fi: 'Säännöllinen ulkoilutus lähialueella, ruokinta ja vesien vaihto sovitusti.',
      category_slug: 'lemmikinhoito',
      popularity_score: 9,
    },
    {
      id: 'tmpl_lemmikki_hoito',
      name_fi: 'Lemmikin hoito kotona',
      description_fi: 'Kissan/koiran hoito omassa kodissa: ruokinta, hiekkalaatikko, leikitys ja seurustelu.',
      category_slug: 'lemmikinhoito',
      popularity_score: 8,
    },
    {
      id: 'tmpl_lemmikki_kuljetus',
      name_fi: 'Lemmikin kuljetus',
      description_fi: 'Lemmikin kuljetus eläinlääkäriin tai hoitopaikkaan turvallisesti.',
      category_slug: 'lemmikinhoito',
      popularity_score: 6,
    },
  ],
  lastenhoito: [
    {
      id: 'tmpl_lastenhoito_ilta',
      name_fi: 'Ilta- ja viikonloppulapsenvahti',
      description_fi: 'Luotettava lastenvahti iltoihin ja viikonloppuihin, perushoito ja leikitys.',
      category_slug: 'lastenhoito',
      popularity_score: 9,
    },
    {
      id: 'tmpl_lastenhoito_koulu',
      name_fi: 'Koululaisten iltapäivähoito',
      description_fi: 'Haku koulusta, välipala ja läksyapu, ulkoilu ja harrastuksiin vienti.',
      category_slug: 'lastenhoito',
      popularity_score: 7,
    },
    {
      id: 'tmpl_lastenhoito_sijainen',
      name_fi: 'Sijaisapu lyhyellä varoitusajalla',
      description_fi: 'Nopea apu äkillisiin tarpeisiin muutamaksi tunniksi.',
      category_slug: 'lastenhoito',
      popularity_score: 6,
    },
  ],
  opetus: [
    {
      id: 'tmpl_opetus_matikka',
      name_fi: 'Matematiikan tukiopetus',
      description_fi: 'Yläkoulu/lukio -tasoinen tuki: läksyt, kokeisiin valmistautuminen.',
      category_slug: 'opetus',
      popularity_score: 8,
    },
    {
      id: 'tmpl_opetus_kielet',
      name_fi: 'Kielten yksityisopetus',
      description_fi: 'Englanti/Ruotsi keskustelutunnit, kieliopin kertaaminen ja kokeisiin valmistautuminen.',
      category_slug: 'opetus',
      popularity_score: 7,
    },
    {
      id: 'tmpl_opetus_it',
      name_fi: 'IT- ja laiteopastus',
      description_fi: 'Tietokoneen ja älylaitteiden peruskäyttö, sähköposti ja tiedostot.',
      category_slug: 'opetus',
      popularity_score: 6,
    },
  ],
  valokuvaus: [
    {
      id: 'tmpl_valokuvaus_muoto',
      name_fi: 'Muotokuvaus',
      description_fi: 'Henkilö- tai perhepotretit luonnonvalossa tai kotistudiossa.',
      category_slug: 'valokuvaus',
      popularity_score: 8,
    },
    {
      id: 'tmpl_valokuvaus_tapahtuma',
      name_fi: 'Tapahtumakuvaus',
      description_fi: 'Pienet juhlat, yritystapahtumat, rippi- ja valmistujaiskuvat.',
      category_slug: 'valokuvaus',
      popularity_score: 7,
    },
    {
      id: 'tmpl_valokuvaus_tuote',
      name_fi: 'Tuotekuvaus',
      description_fi: 'Pienyritysten tuotekuvat verkkokauppaan ja someen.',
      category_slug: 'valokuvaus',
      popularity_score: 6,
    },
  ],
  suunnittelu: [
    {
      id: 'tmpl_suunnittelu_grafiikka',
      name_fi: 'Graafinen suunnittelu',
      description_fi: 'Logot, käyntikortit, esitteet ja somegrafiikat nopealla aikataululla.',
      category_slug: 'suunnittelu',
      popularity_score: 8,
    },
    {
      id: 'tmpl_suunnittelu_uiux',
      name_fi: 'UI/UX-suunnittelu',
      description_fi: 'Keveät wirefremet, käyttöliittymän parannukset ja pikakorjaukset.',
      category_slug: 'suunnittelu',
      popularity_score: 7,
    },
    {
      id: 'tmpl_suunnittelu_somesisalto',
      name_fi: 'Some-sisällön suunnittelu',
      description_fi: 'Julkaisupohjat, kampanjabannerit ja julkaisuideoiden paketointi.',
      category_slug: 'suunnittelu',
      popularity_score: 6,
    },
  ],
  muu: [
    {
      id: 'tmpl_muu_asiointi',
      name_fi: 'Asiointiapu',
      description_fi: 'Pienten juoksevien asioiden hoito: noudot, toimitukset, jonotukset.',
      category_slug: 'muu',
      popularity_score: 7,
    },
    {
      id: 'tmpl_muu_kasaapu',
      name_fi: 'Sekalainen apu',
      description_fi: 'Pienet työt joita on hankala luokitella – kerro mitä tarvitset.',
      category_slug: 'muu',
      popularity_score: 6,
    },
    {
      id: 'tmpl_muu_kuljetus',
      name_fi: 'Pikkukuljetus',
      description_fi: 'Yksittäisen tavaran kuljetus lyhyellä matkalla.',
      category_slug: 'muu',
      popularity_score: 6,
    },
  ],
};



import { Settings, Brush, Truck, Wrench, TreePine, Drill, PaintBucket, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface HeroCategoryData {
  id: string;
  name_fi: string;
  icon: LucideIcon;
  description: string;
  benefits: string[];
  heroImage: string;
  trending?: string;
  templates: HeroTemplateData[];
}

export interface HeroTemplateData {
  id: string;
  name_fi: string;
  categoryId: string;
  isPopular?: boolean;
  dbId?: string; // Database UUID for linking
  questions?: any[]; // Template questions from database
}

// Category data mapping based on TaskRabbit's approach
export const heroCategoriesData: HeroCategoryData[] = [
  {
    id: 'kokoonpano',
    name_fi: 'Kokoonpano',
    icon: Settings,
    description: 'Ammattitaitoista huonekalujen kokoamista, hyllyjen kiinnittämistä ja tv-tason asennusta turvallisesti.',
    benefits: [
      'Huonekalujen turvallinen kokoaminen',
      'Hyllyjen ja kaappien asennus',
      'Tv-telineiden kiinnittäminen',
      'Toimistokalusteiden kokoaminen'
    ],
    heroImage: '/images/mountingtv.png',
    trending: 'Nyt suosittua: Hyllyt',
    templates: [
      { id: 'ikea-huonekalut', name_fi: 'IKEA huonekalujen kokoaminen', categoryId: 'kokoonpano', isPopular: true },
      { id: 'hyllyjen-asennus', name_fi: 'Hyllyjen seinäkiinnitys', categoryId: 'kokoonpano', isPopular: true },
      { id: 'tv-teline', name_fi: 'TV-telineen asennus', categoryId: 'kokoonpano', isPopular: true },
      { id: 'keittion-kokoaminen', name_fi: 'Keittiön kokoaminen', categoryId: 'kokoonpano' },
      { id: 'toimistokalusteet', name_fi: 'Toimistokalusteiden kokoaminen', categoryId: 'kokoonpano' },
      { id: 'makuuhuone-kalusteet', name_fi: 'Makuuhuonekalusteet', categoryId: 'kokoonpano' }
    ]
  },
  {
    id: 'siivous',
    name_fi: 'Siivous',
    icon: Brush,
    description: 'Perusteellista kotisiivousta, ikkunoiden pesua ja erikoissiivouksia ammattilaisilta.',
    benefits: [
      'Perusteellinen kotisiivous',
      'Ikkunoiden pesu sisältä ja ulkoa',
      'Muuton jälkeinen siivous',
      'Toimiston ylläpitosiivous'
    ],
    heroImage: '/images/cleaning.png',
    trending: 'Nyt suosittua: Perussiivous',
    templates: [
      { id: 'perussiivous', name_fi: 'Kodin perussiivous', categoryId: 'siivous', isPopular: true },
      { id: 'ikkuna-pesu', name_fi: 'Ikkunoiden pesu', categoryId: 'siivous', isPopular: true },
      { id: 'muuttosiivous', name_fi: 'Muuton jälkeinen siivous', categoryId: 'siivous', isPopular: true },
      { id: 'syvyys-siivous', name_fi: 'Syvyyssiivous', categoryId: 'siivous' },
      { id: 'toimisto-siivous', name_fi: 'Toimiston siivous', categoryId: 'siivous' },
      { id: 'maton-pesu', name_fi: 'Mattojen pesu', categoryId: 'siivous' }
    ]
  },
  {
    id: 'asennus',
    name_fi: 'Asennus',
    icon: Drill,
    description: 'Turvallista valaisinten asennusta, kaakelointia ja muita asennustöitä koulutetuilta asentajilta.',
    benefits: [
      'Valaisinten turvallinen asennus',
      'Kaakeleiden ja laattojen asennus',
      'Vesikalusteiden asennus',
      'Ovien ja ikkunoiden asennus'
    ],
    heroImage: '/images/handyman.png',
    trending: 'Nyt suosittua: Valaisimet',
    templates: [
      { id: 'valaisimet', name_fi: 'Valaisinten asennus', categoryId: 'asennus', isPopular: true },
      { id: 'kaakeloiminen', name_fi: 'Kaakeleiden asennus', categoryId: 'asennus', isPopular: true },
      { id: 'hana-asennus', name_fi: 'Hanojen ja vesikalusteiden asennus', categoryId: 'asennus' },
      { id: 'oven-asennus', name_fi: 'Ovien asennus', categoryId: 'asennus' },
      { id: 'ikkuna-asennus', name_fi: 'Ikkunoiden asennus', categoryId: 'asennus' },
      { id: 'verhokiskot', name_fi: 'Verhokiskojen asennus', categoryId: 'asennus' }
    ]
  },
  {
    id: 'muutto',
    name_fi: 'Muutto',
    icon: Truck,
    description: 'Sujuvaa muutto-apua, pakkaamista ja kuljetusta luotettavilta muuttoapulaisilta.',
    benefits: [
      'Ammattimainen pakkaus ja purku',
      'Kuljetuspalvelut ja nostoapu',
      'Huonekalujen suojaus ja käsittely',
      'Siivous ennen ja jälkeen muuton'
    ],
    heroImage: '/images/movingco.png',
    trending: 'Nyt suosittua: Muuttoapu',
    templates: [
      { id: 'muuttoapu', name_fi: 'Muuttoapu ja kantaminen', categoryId: 'muutto', isPopular: true },
      { id: 'pakkausapu', name_fi: 'Pakkaaminen ja purku', categoryId: 'muutto', isPopular: true },
      { id: 'kuljetuspalvelu', name_fi: 'Pienesineiden kuljetus', categoryId: 'muutto', isPopular: true },
      { id: 'varastointi', name_fi: 'Välivarastointi', categoryId: 'muutto' },
      { id: 'piano-muutto', name_fi: 'Pianon siirtäminen', categoryId: 'muutto' },
      { id: 'jatesiivous', name_fi: 'Jätehuolto', categoryId: 'muutto' }
    ]
  },
  {
    id: 'korjaus',
    name_fi: 'Korjaus',
    icon: Wrench,
    description: 'Luotettavaa kodin korjausapua, putkitöitä ja sähkötöitä alan ammattilaisilta.',
    benefits: [
      'Pienet putkityöt ja vuotojen korjaus',
      'Sähkötöiden asennus ja korjaus',
      'Maalaus- ja rappaustyöt',
      'Ovien ja ikkunoiden korjaus'
    ],
    heroImage: '/images/plumber.png',
    trending: 'Nyt suosittua: Putki- ja sähkötyöt',
    templates: [
      { id: 'putkityot', name_fi: 'Pienet putkityöt', categoryId: 'korjaus', isPopular: true },
      { id: 'sahkotyot', name_fi: 'Sähkötöiden korjaus', categoryId: 'korjaus', isPopular: true },
      { id: 'maalaustyot', name_fi: 'Maalaus ja lakitus', categoryId: 'korjaus', isPopular: true },
      { id: 'oven-korjaus', name_fi: 'Ovien korjaus', categoryId: 'korjaus' },
      { id: 'seinien-korjaus', name_fi: 'Seinävaurioiden korjaus', categoryId: 'korjaus' },
      { id: 'lattian-korjaus', name_fi: 'Lattioiden korjaus', categoryId: 'korjaus' }
    ]
  },
  {
    id: 'maalaus',
    name_fi: 'Maalaus',
    icon: PaintBucket,
    description: 'Ammattimaista maalaustyötä sisä- ja ulkotiloihin kokeneilta maalareiltä.',
    benefits: [
      'Sisätilojen maalaustyöt',
      'Ulkomaalaus ja julkisivutyöt',
      'Tapetointi ja seinäpintojen valmistelu',
      'Erikoismaalausteknikat'
    ],
    heroImage: '/images/pricing/handyman.jpg',
    trending: 'Nyt suosittua: Sisämaalaus',
    templates: [
      { id: 'sisamaalaus', name_fi: 'Huoneiden sisämaalaus', categoryId: 'maalaus', isPopular: true },
      { id: 'ulkomaalaus', name_fi: 'Ulkomaalaus', categoryId: 'maalaus', isPopular: true },
      { id: 'tapetointi', name_fi: 'Tapetointi', categoryId: 'maalaus' },
      { id: 'katon-maalaus', name_fi: 'Kattojen maalaus', categoryId: 'maalaus' },
      { id: 'aitamaalaus', name_fi: 'Aitojen maalaus', categoryId: 'maalaus' },
      { id: 'pinta-kasittely', name_fi: 'Pintojen käsittely', categoryId: 'maalaus' }
    ]
  },
  {
    id: 'puutarha',
    name_fi: 'Puutarha',
    icon: TreePine,
    description: 'Puutarhanhoitoa, nurmikonleikkausta ja pihatyötä pihan asiantuntijoilta.',
    benefits: [
      'Nurmikon leikkaus ja hoito',
      'Pensaiden ja puiden leikkaus',
      'Kukkien istutus ja kasvihuolto',
      'Piha-alueiden siivous'
    ],
    heroImage: '/images/hero/hero-home-services.jpg',
    trending: 'Nyt suosittua: Nurmikon hoito',
    templates: [
      { id: 'nurmikon-leikkaus', name_fi: 'Nurmikon leikkaus', categoryId: 'puutarha', isPopular: true },
      { id: 'pensaiden-leikkaus', name_fi: 'Pensaiden ja puiden leikkaus', categoryId: 'puutarha', isPopular: true },
      { id: 'kukkien-istutus', name_fi: 'Kukkien istutus', categoryId: 'puutarha', isPopular: true },
      { id: 'pihan-siivous', name_fi: 'Pihan siivous', categoryId: 'puutarha' },
      { id: 'lumityot', name_fi: 'Lumenluonti', categoryId: 'puutarha' },
      { id: 'kastelustjarjestelma', name_fi: 'Kastelujärjestelmän asennus', categoryId: 'puutarha' }
    ]
  },
  {
    id: 'opetus',
    name_fi: 'Opetus',
    icon: GraduationCap,
    description: 'Ammattitaitoista yksityisopetusta, tukiopetusta ja kieliopetusta koulutetuilta opettajilta.',
    benefits: [
      'Matematiikan tukiopetus',
      'Kielten yksityisopetus',
      'IT- ja laiteopastus',
      'Lukion ja yliopiston opetus'
    ],
    heroImage: '/images/hero/hero-education.jpg',
    trending: 'Nyt suosittua: Matematiikka',
    templates: [
      { id: 'matematiikka', name_fi: 'Matematiikan tukiopetus', categoryId: 'opetus', isPopular: true },
      { id: 'englanti', name_fi: 'Englannin opetus', categoryId: 'opetus', isPopular: true },
      { id: 'ruotsi', name_fi: 'Ruotsin opetus', categoryId: 'opetus' },
      { id: 'it-opastus', name_fi: 'IT- ja laiteopastus', categoryId: 'opetus' },
      { id: 'lukion-opetus', name_fi: 'Lukion aineiden opetus', categoryId: 'opetus' },
      { id: 'yliopisto-opetus', name_fi: 'Yliopiston kurssiopetus', categoryId: 'opetus' }
    ]
  }
];

// Helper function to get category by ID
export const getCategoryById = (id: string): HeroCategoryData | undefined => {
  return heroCategoriesData.find(category => category.id === id);
};

// Helper function to get popular templates across all categories
export const getPopularTemplates = (): HeroTemplateData[] => {
  return heroCategoriesData.flatMap(category => 
    category.templates.filter(template => template.isPopular)
  );
};

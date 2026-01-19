import { 
  Settings, 
  Brush, 
  Hammer, 
  Truck, 
  Wrench, 
  TreePine, 
  Drill, 
  PaintBucket,
  Home,
  Package,
  Zap,
  Laptop,
  Utensils,
  ShieldCheck,
  Car,
  Heart,
  Users,
  Building,
  Monitor,
  Scissors,
  Camera,
  Palette,
  BookOpen,
  Baby
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Mapping from database category slugs to appropriate Lucide icons
export const getCategoryIcon = (slug: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    // Database categories (exact slugs from your database)
    'muuttoapu': Truck,
    'lemmikin-hoito': Heart,
    'pienet-korjaukset': Wrench,
    'lastenhoito': Baby,
    'opetus-ja-tuutorointi': BookOpen,
    'siivous': Brush,
    'kotitalous': Home,
    'kokoonpano': Settings,
    'valokuvaus': Camera,
    'graafinen-suunnittelu': Palette,
    'muu': Package,
    'puutarhatyot': TreePine,
    'it-apu': Laptop,
    
    // Legacy/fallback categories (keeping for compatibility)
    'asennus': Drill,
    'muutto': Truck,
    'korjaus': Wrench,
    'maalaus': PaintBucket,
    'puutarha': TreePine,
    'sahkotyot': Zap,
    'huolto': ShieldCheck,
    'kuljetus': Package,
    'rakentaminen': Hammer,
    
    // Fallback icon
    'default': Home
  };

  return iconMap[slug] || iconMap['default'];
};

// Default hero image mapping for categories
export const getCategoryHeroImage = (slug: string): string => {
  const imageMap: Record<string, string> = {
    // Database categories (exact slugs)
    'muuttoapu': '/images/movingco.png',
    'lemmikin-hoito': '/images/hero/hero-home-services.jpg',
    'pienet-korjaukset': '/images/plumber.png',
    'lastenhoito': '/images/hero/hero-home-services.jpg',
    'opetus-ja-tuutorointi': '/images/handyman.png',
    'siivous': '/images/cleaning.png',
    'kotitalous': '/images/cleaning.png',
    'kokoonpano': '/images/mountingtv.png',
    'valokuvaus': '/images/handyman.png',
    'graafinen-suunnittelu': '/images/pricing/handyman.jpg',
    'muu': '/images/handyman.png',
    'puutarhatyot': '/images/hero/hero-home-services.jpg',
    'it-apu': '/images/handyman.png',
    
    // Legacy categories (keeping for compatibility)
    'asennus': '/images/handyman.png',
    'muutto': '/images/movingco.png',
    'korjaus': '/images/plumber.png',
    'maalaus': '/images/pricing/handyman.jpg',
    'puutarha': '/images/hero/hero-home-services.jpg',
    
    // Fallback image
    'default': '/images/handyman.png'
  };

  return imageMap[slug] || imageMap['default'];
};

// Category benefits mapping for displaying in CategoryInfoPanel
export const getCategoryBenefits = (slug: string): string[] => {
  const benefitsMap: Record<string, string[]> = {
    // Database categories (exact slugs)
    'muuttoapu': [
      'Ammattimainen pakkaus ja purku',
      'Kuljetuspalvelut ja nostoapu',
      'Huonekalujen suojaus ja käsittely',
      'Siivous ennen ja jälkeen muuton'
    ],
    'lemmikin-hoito': [
      'Lemmikin ulkoilutus ja hoito',
      'Ruokinta ja lääkitys',
      'Lemmikin viihdyttäminen',
      'Kotikäynnit ja hoitoapu'
    ],
    'pienet-korjaukset': [
      'Pienet putkityöt ja vuotojen korjaus',
      'Sähkötöiden korjaus',
      'Maalaus- ja rappaustyöt',
      'Ovien ja ikkunoiden korjaus'
    ],
    'lastenhoito': [
      'Turvallinen lastenhoito kotona',
      'Aktiviteetit ja leikit',
      'Ruokinta ja hoitaminen',
      'Koululaisten valvonta'
    ],
    'opetus-ja-tuutorointi': [
      'Henkilökohtainen opetus',
      'Läksyjen tekemisen tuki',
      'Kielten opettaminen',
      'Ammattitaitojen koulutus'
    ],
    'siivous': [
      'Perusteellinen kotisiivous',
      'Ikkunoiden pesu sisältä ja ulkoa',
      'Muuton jälkeinen siivous',
      'Toimiston ylläpitosiivous'
    ],
    'kotitalous': [
      'Kodinhoitopalvelut',
      'Ruoanlaitto ja kauppapalvelut',
      'Yleinen kotiapu',
      'Arjen helpottaminen'
    ],
    'kokoonpano': [
      'Huonekalujen turvallinen kokoaminen',
      'Hyllyjen ja kaappien asennus',
      'TV-telineiden kiinnittäminen',
      'Toimistokalusteiden kokoaminen'
    ],
    'valokuvaus': [
      'Ammattimaiset valokuvauspalvelut',
      'Tapahtumien dokumentointi',
      'Muotokuvaukset ja perhekuvat',
      'Editointi ja jälkikäsittely'
    ],
    'graafinen-suunnittelu': [
      'Logo- ja brändimateriaali',
      'Painotuotteiden suunnittelu',
      'Digitaalinen grafiikka',
      'Markkinointimateriaalit'
    ],
    'muu': [
      'Erikoispalvelut tarpeen mukaan',
      'Räätälöidyt ratkaisut',
      'Konsultointi ja neuvonta',
      'Muut kotitalouspalvelut'
    ],
    'puutarhatyot': [
      'Nurmikon leikkaus ja hoito',
      'Pensaiden ja puiden leikkaus',
      'Kukkien istutus ja kasvihuolto',
      'Piha-alueiden siivous'
    ],
    'it-apu': [
      'Tietokoneiden korjaus ja huolto',
      'Ohjelmistojen asennus',
      'Verkkojen asennus ja konfigurointi',
      'Tekninen tuki ja koulutus'
    ],
    
    // Legacy categories (keeping for compatibility)
    'asennus': [
      'Valaisinten turvallinen asennus',
      'Kaakeleiden ja laattojen asennus',
      'Vesikalusteiden asennus'
    ],
    'korjaus': [
      'Pienet korjaustyöt',
      'Huolto ja ylläpito',
      'Vianetsintä ja korjaus'
    ],
    
    // Default benefits for unknown categories
    'default': [
      'Ammattitaitoista palvelua',
      'Luotettavat ja tarkistetut tekijät',
      'Nopea ja tehokas suoritus'
    ]
  };

  return benefitsMap[slug] || benefitsMap['default'];
};

// Category trending text for displaying in CategoryInfoPanel
export const getCategoryTrending = (slug: string): string | undefined => {
  const trendingMap: Record<string, string> = {
    // Database categories (exact slugs)
    'muuttoapu': 'Nyt suosittua: Muuttoapu',
    'lemmikin-hoito': 'Nyt suosittua: Koiranulkoilutus',
    'pienet-korjaukset': 'Nyt suosittua: Putoavat hanat',
    'lastenhoito': 'Nyt suosittua: Iltavuorot',
    'opetus-ja-tuutorointi': 'Nyt suosittua: Matematiikka',
    'siivous': 'Nyt suosittua: Perussiivous',
    'kotitalous': 'Nyt suosittua: Kodinhoito',
    'kokoonpano': 'Nyt suosittua: IKEA hyllyt',
    'valokuvaus': 'Nyt suosittua: Perhekuvat',
    'graafinen-suunnittelu': 'Nyt suosittua: Logot',
    'muu': 'Nyt suosittua: Erikoistehtävät',
    'puutarhatyot': 'Nyt suosittua: Nurmikon leikkaus',
    'it-apu': 'Nyt suosittua: Tietokoneiden korjaus',
    
    // Legacy categories (keeping for compatibility)
    'asennus': 'Nyt suosittua: Valaisimet',
    'muutto': 'Nyt suosittua: Muuttoapu',
    'korjaus': 'Nyt suosittua: Korjaukset',
    'maalaus': 'Nyt suosittua: Sisämaalaus',
    'puutarha': 'Nyt suosittua: Nurmikon hoito'
  };

  return trendingMap[slug];
};
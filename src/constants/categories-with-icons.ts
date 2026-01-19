import {
  Baby,
  Camera,
  GraduationCap,
  Hammer,
  Home,
  Monitor,
  Package,
  Palette,
  PawPrint,
  Sparkles,
  TreePine,
  Truck,
  Wrench
} from 'lucide-react';

export interface CategoryWithIcon {
  id: string;
  name: string;
  name_fi: string;
  slug: string;
  icon: any; // Lucide React component
  question: string;
  description: string;
  gradient: string;
}

// Updated categories that match the new concise database structure
// Using reliable Lucide React icons instead of database-stored icons
export const categoriesWithIcons: CategoryWithIcon[] = [
  {
    id: 'kotitalous', // updated to match new concise naming
    name: 'Kotitalous',
    name_fi: 'Kotitalous',
    slug: 'kotitalous',
    icon: Home,
    question: 'Tarvitsetko apua kotitöissä?',
    description: 'Yleiset kotitaloustyöt ja kodinhoito',
    gradient: 'from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200',
  },
  {
    id: 'siivous', // matches database slug
    name: 'Siivous',
    name_fi: 'Siivous',
    slug: 'siivous',
    icon: Sparkles,
    question: 'Tarvitsetko siivousapua?',
    description: 'Kodin ja toimiston siivouspalvelut',
    gradient: 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200',
  },
  {
    id: 'korjaukset', // matches database slug
    name: 'Korjaukset',
    name_fi: 'Korjaukset',
    slug: 'korjaukset',
    icon: Wrench,
    question: 'Tarvitsetko korjausapua kotiin?',
    description: 'Pienet korjaustyöt ja huolto',
    gradient: 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200',
  },
  {
    id: 'kokoonpano', // matches database slug
    name: 'Kokoonpano',
    name_fi: 'Kokoonpano', 
    slug: 'kokoonpano',
    icon: Hammer,
    question: 'Tarvitsetko kokoonpano-apua?',
    description: 'Huonekalujen ja laitteiden kokoonpano',
    gradient: 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200',
  },
  {
    id: 'muutto', // matches database slug
    name: 'Muutto',
    name_fi: 'Muutto',
    slug: 'muutto',
    icon: Truck,
    question: 'Tarvitsetko muutto-apua?',
    description: 'Muuttopalvelut ja tavaroiden kuljetus',
    gradient: 'from-blue-50 to-emerald-50 hover:from-blue-100 hover:to-emerald-100',
  },
  {
    id: 'puutarha', // matches database slug
    name: 'Puutarha',
    name_fi: 'Puutarha',
    slug: 'puutarha',
    icon: TreePine,
    question: 'Tarvitsetko puutarha-apua?',
    description: 'Puutarhatyöt ja ulkoalueiden hoito',
    gradient: 'from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100',
  },
  {
    id: 'it-apu', // matches database slug
    name: 'IT-apu',
    name_fi: 'IT-apu',
    slug: 'it-apu',
    icon: Monitor,
    question: 'Tarvitsetko teknistä tukea?',
    description: 'Tietokoneiden, sovellusten ja teknologian apu',
    gradient: 'from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100',
  },
  // Additional categories from database
  {
    id: 'lastenhoito',
    name: 'Lastenhoito',
    name_fi: 'Lastenhoito',
    slug: 'lastenhoito',
    icon: Baby,
    question: 'Tarvitsetko lastenhoidon apua?',
    description: 'Lastenhoito ja lastenvahtaus',
    gradient: 'from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200',
  },
  {
    id: 'lemmikinhoito',
    name: 'Lemmikinhoito',
    name_fi: 'Lemmikinhoito', 
    slug: 'lemmikinhoito',
    icon: PawPrint,
    question: 'Tarvitsetko lemmikinhoitoa?',
    description: 'Lemmikin hoito ja ulkoilutus',
    gradient: 'from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200',
  },
  {
    id: 'opetus',
    name: 'Opetus',
    name_fi: 'Opetus',
    slug: 'opetus',
    icon: GraduationCap,
    question: 'Tarvitsetko opetusta?',
    description: 'Yksityisopetus ja tuutorointi',
    gradient: 'from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200',
  },
  {
    id: 'valokuvaus',
    name: 'Valokuvaus',
    name_fi: 'Valokuvaus',
    slug: 'valokuvaus',
    icon: Camera,
    question: 'Tarvitsetko valokuvausta?',
    description: 'Valokuvauspalvelut',
    gradient: 'from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200',
  },
  {
    id: 'suunnittelu',
    name: 'Suunnittelu',
    name_fi: 'Suunnittelu',
    slug: 'suunnittelu',
    icon: Palette,
    question: 'Tarvitsetko suunnittelua?',
    description: 'Graafinen suunnittelu ja luova työ',
    gradient: 'from-violet-50 to-violet-100 hover:from-violet-100 hover:to-violet-200',
  },
  {
    id: 'muu',
    name: 'Muu',
    name_fi: 'Muu',
    slug: 'muu',
    icon: Package,
    question: 'Tarvitsetko muuta apua?',
    description: 'Muut palvelut',
    gradient: 'from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200',
  },
];

// Create a convenient map for accessing icons by slug
export const categoryIconMap: Record<string, any> = categoriesWithIcons.reduce(
  (map, category) => {
    map[category.slug] = category.icon;
    return map;
  },
  {} as Record<string, any>
);

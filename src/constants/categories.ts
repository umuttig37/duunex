export interface Category {
  id: string;
  name: string;
  icon: string;
  question: string;
  description: string;
  gradient: string;
}

// Updated categories - removed problematic entries that don't exist in database
// Removed: 'Luova työ', 'Opetus' (don't exist in database)
// These categories align with realistic Finnish service market
export const categories: Category[] = [
  {
    id: 'korjaukset',
    name: 'Korjaukset',
    icon: '🔧',
    question: 'Tarvitsetko korjausapua kotiin?',
    description: 'Pienet korjaukset, asennus- ja huoltotyöt',
    gradient: 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200',
  },
  {
    id: 'kotityot',
    name: 'Kotitaloustyöt',
    icon: '🏠',
    question: 'Tarvitsetko apua kotitöissä?',
    description: 'Siivous, järjestely ja kodinhoito',
    gradient: 'from-sky-50 to-sky-100 hover:from-sky-100 hover:to-sky-200',
  },
  {
    id: 'muutto',
    name: 'Muutto',
    icon: '📦',
    question: 'Tarvitsetko muutto-apua?',
    description: 'Muuttopalvelut ja kuljetukset',
    gradient: 'from-blue-50 to-sky-50 hover:from-blue-100 hover:to-sky-100',
  },
  {
    id: 'it-apu',
    name: 'IT-apu',
    icon: '💻',
    question: 'Tarvitsetko teknistä tukea?',
    description: 'Tietotekniikka-apu ja digitaalinen tuki',
    gradient: 'from-sky-50 to-sky-50 hover:from-sky-100 hover:to-sky-100',
  },
  {
    id: 'kokoonpano',
    name: 'Kokoonpano',
    icon: '🔨',
    question: 'Tarvitsetko kokoonpano-apua?',
    description: 'Huonekalujen ja laitteiden kokoonpano',
    gradient: 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200',
  },
  {
    id: 'puutarha',
    name: 'Puutarha',
    icon: '🌱',
    question: 'Tarvitsetko puutarha-apua?',
    description: 'Puutarhanhoito ja ulkotyöt',
    gradient: 'from-sky-50 to-sky-50 hover:from-sky-100 hover:to-sky-100',
  },
];

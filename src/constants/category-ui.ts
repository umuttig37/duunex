import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Brush,
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
  Wrench,
} from 'lucide-react';

interface CategoryUiDefinition {
  icon: LucideIcon;
  gradient: string;
}

const fallbackUi: CategoryUiDefinition = {
  icon: Package,
  gradient: 'from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200',
};

export const categoryUiBySlug: Record<string, CategoryUiDefinition> = {
  siivous: {
    icon: Sparkles,
    gradient: 'from-sky-50 to-blue-100 hover:from-sky-100 hover:to-blue-200',
  },
  kotitalous: {
    icon: Home,
    gradient: 'from-orange-50 to-sky-50 hover:from-orange-100 hover:to-sky-100',
  },
  kokoonpano: {
    icon: Hammer,
    gradient: 'from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200',
  },
  asennus: {
    icon: Wrench,
    gradient: 'from-sky-50 to-cyan-100 hover:from-sky-100 hover:to-cyan-200',
  },
  korjaukset: {
    icon: Wrench,
    gradient: 'from-blue-50 to-slate-100 hover:from-blue-100 hover:to-slate-200',
  },
  maalaus: {
    icon: Palette,
    gradient: 'from-orange-50 to-amber-100 hover:from-orange-100 hover:to-amber-200',
  },
  muutto: {
    icon: Truck,
    gradient: 'from-indigo-50 to-sky-100 hover:from-indigo-100 hover:to-sky-200',
  },
  kuljetus: {
    icon: Package,
    gradient: 'from-sky-50 to-slate-100 hover:from-sky-100 hover:to-slate-200',
  },
  puutarha: {
    icon: TreePine,
    gradient: 'from-emerald-50 to-sky-50 hover:from-emerald-100 hover:to-sky-100',
  },
  'it-apu': {
    icon: Monitor,
    gradient: 'from-sky-50 to-indigo-100 hover:from-sky-100 hover:to-indigo-200',
  },
  lastenhoito: {
    icon: Baby,
    gradient: 'from-orange-50 to-rose-100 hover:from-orange-100 hover:to-rose-200',
  },
  lemmikinhoito: {
    icon: PawPrint,
    gradient: 'from-amber-50 to-orange-100 hover:from-amber-100 hover:to-orange-200',
  },
  opetus: {
    icon: GraduationCap,
    gradient: 'from-indigo-50 to-blue-100 hover:from-indigo-100 hover:to-blue-200',
  },
  valokuvaus: {
    icon: Camera,
    gradient: 'from-slate-50 to-blue-100 hover:from-slate-100 hover:to-blue-200',
  },
  suunnittelu: {
    icon: Palette,
    gradient: 'from-violet-50 to-sky-100 hover:from-violet-100 hover:to-sky-200',
  },
  asiointiapu: {
    icon: Brush,
    gradient: 'from-sky-50 to-orange-100 hover:from-sky-100 hover:to-orange-200',
  },
  juhlat: {
    icon: Sparkles,
    gradient: 'from-orange-50 to-pink-100 hover:from-orange-100 hover:to-pink-200',
  },
  muu: {
    icon: Package,
    gradient: 'from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200',
  },
};

export function getCategoryUi(slug: string): CategoryUiDefinition {
  return categoryUiBySlug[slug] || fallbackUi;
}

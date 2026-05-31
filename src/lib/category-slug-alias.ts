const DB_TO_FE_SLUG_MAP: Record<string, string> = {
  siivous: 'siivous',
  kotitalous: 'kotitalous',
  kotitaloustyot: 'kotitalous',
  kokoonpano: 'kokoonpano',
  asennus: 'asennus',
  korjaus: 'korjaukset',
  korjaukset: 'korjaukset',
  'pienet-korjaukset': 'korjaukset',
  maalaus: 'maalaus',
  muutto: 'muutto',
  muuttoapu: 'muutto',
  kuljetus: 'kuljetus',
  puutarha: 'puutarha',
  puutarhatyot: 'puutarha',
  'it-apu': 'it-apu',
  lastenhoito: 'lastenhoito',
  lemmikinhoito: 'lemmikinhoito',
  'lemmikin-hoito': 'lemmikinhoito',
  opetus: 'opetus',
  'opetus-ja-tuutorointi': 'opetus',
  valokuvaus: 'valokuvaus',
  suunnittelu: 'suunnittelu',
  'graafinen-suunnittelu': 'suunnittelu',
  asiointiapu: 'asiointiapu',
  juhlat: 'juhlat',
  muu: 'muu',
};

const FE_TO_DB_SLUG_CANDIDATES: Record<string, string[]> = {
  siivous: ['siivous'],
  kotitalous: ['kotitalous', 'kotitaloustyot'],
  kokoonpano: ['kokoonpano'],
  asennus: ['asennus'],
  korjaukset: ['korjaukset', 'korjaus', 'pienet-korjaukset'],
  maalaus: ['maalaus'],
  muutto: ['muutto', 'muuttoapu'],
  kuljetus: ['kuljetus'],
  puutarha: ['puutarha', 'puutarhatyot'],
  'it-apu': ['it-apu'],
  lastenhoito: ['lastenhoito'],
  lemmikinhoito: ['lemmikinhoito', 'lemmikin-hoito'],
  opetus: ['opetus', 'opetus-ja-tuutorointi'],
  valokuvaus: ['valokuvaus'],
  suunnittelu: ['suunnittelu', 'graafinen-suunnittelu'],
  asiointiapu: ['asiointiapu'],
  juhlat: ['juhlat'],
  muu: ['muu'],
};

export function toDbSlug(feSlug: string): string {
  const candidates = FE_TO_DB_SLUG_CANDIDATES[feSlug];
  if (candidates?.length) {
    return candidates[0];
  }

  const dbSlug = Object.keys(DB_TO_FE_SLUG_MAP).find(
    (candidate) => DB_TO_FE_SLUG_MAP[candidate] === feSlug
  );

  return dbSlug || feSlug;
}

export function toAppSlug(dbSlug: string): string {
  return DB_TO_FE_SLUG_MAP[dbSlug] || dbSlug;
}

export function isValidSlug(slug: string): boolean {
  return slug in DB_TO_FE_SLUG_MAP || slug in FE_TO_DB_SLUG_CANDIDATES;
}

export function getAllFeSlugS(): string[] {
  return Array.from(new Set(Object.values(DB_TO_FE_SLUG_MAP)));
}

export function getAllDbSlugs(): string[] {
  return Object.keys(DB_TO_FE_SLUG_MAP);
}

export function getDbSlugCandidates(feSlug: string): string[] {
  return FE_TO_DB_SLUG_CANDIDATES[feSlug] || [toDbSlug(feSlug)];
}

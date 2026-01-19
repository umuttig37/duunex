// Category slug alias mapping between database and frontend
// Solves mismatch: DB uses 'puutarhatyot' while FE uses 'puutarha'

// DB slug -> FE slug mapping
const DB_TO_FE_SLUG_MAP: Record<string, string> = {
  // Canonical slugs
  'muutto': 'muutto',
  'siivous': 'siivous',
  'kokoonpano': 'kokoonpano',
  'asennus': 'asennus',
  'korjaus': 'korjaus',
  'korjaukset': 'korjaus',
  'maalaus': 'maalaus',
  'puutarha': 'puutarha',
  'puutarhatyot': 'puutarha',
  'kotitalous': 'kotitalous',
  'it-apu': 'it-apu',
  'valokuvaus': 'valokuvaus',
  'lastenhoito': 'lastenhoito',
  'lemmikin-hoito': 'lemmikinhoito',
  'opetus-ja-tuutorointi': 'opetus',
  'opetus': 'opetus',
  'graafinen-suunnittelu': 'suunnittelu',
  'muu': 'muu',
  
  // Aliases in DB that may appear in older data/migrations
  'muuttoapu': 'muutto',
  'muutto-ja-kuljetus': 'muutto',
  'kokoonpano-ja-asennus': 'kokoonpano',
  'asennus-ja-korjaus': 'asennus',
  'pienet-korjaukset': 'korjaus',
  'kotitaloustyot': 'kotitalous',
  'tech-support': 'it-apu',
};

// FE -> DB mapping with multiple candidates to make lookups resilient
const FE_TO_DB_SLUG_CANDIDATES: Record<string, string[]> = {
  'muutto': ['muutto', 'muuttoapu', 'muutto-ja-kuljetus'],
  'siivous': ['siivous'],
  'kokoonpano': ['kokoonpano', 'kokoonpano-ja-asennus'],
  'asennus': ['asennus', 'asennus-ja-korjaus'],
  'korjaus': ['korjaus', 'korjaukset', 'pienet-korjaukset', 'asennus-ja-korjaus'],
  'maalaus': ['maalaus'],
  'puutarha': ['puutarha', 'puutarhatyot'],
  'kotitalous': ['kotitalous', 'kotitaloustyot'],
  'it-apu': ['it-apu', 'tech-support'],
  'valokuvaus': ['valokuvaus'],
  'lastenhoito': ['lastenhoito'],
  'lemmikinhoito': ['lemmikin-hoito'],
  'opetus': ['opetus', 'opetus-ja-tuutorointi'],
  'suunnittelu': ['graafinen-suunnittelu'],
  'muu': ['muu'],
  // legacy Frontend IDs that may still appear
  'korjaukset': ['korjaus', 'korjaukset', 'pienet-korjaukset']
};

/**
 * Convert frontend slug to database slug
 * @param feSlug Frontend slug (e.g. 'puutarha')
 * @returns Database slug (e.g. 'puutarhatyot')
 */
export function toDbSlug(feSlug: string): string {
  const candidates = FE_TO_DB_SLUG_CANDIDATES[feSlug];
  if (candidates && candidates.length > 0) {
    return candidates[0];
  }
  // As a fallback, try reverse map
  const dbSlug = Object.keys(DB_TO_FE_SLUG_MAP).find(db => DB_TO_FE_SLUG_MAP[db] === feSlug);
  return dbSlug || feSlug;
}

/**
 * Convert database slug to frontend slug  
 * @param dbSlug Database slug (e.g. 'puutarhatyot')
 * @returns Frontend slug (e.g. 'puutarha')
 */
export function toAppSlug(dbSlug: string): string {
  return DB_TO_FE_SLUG_MAP[dbSlug] || dbSlug;
}

/**
 * Check if a slug exists in either format
 * @param slug Slug to check
 * @returns boolean
 */
export function isValidSlug(slug: string): boolean {
  return slug in DB_TO_FE_SLUG_MAP || slug in FE_TO_DB_SLUG_CANDIDATES;
}

/**
 * Get all valid frontend slugs
 * @returns Array of frontend slugs
 */
export function getAllFeSlugS(): string[] {
  return Array.from(new Set(Object.values(DB_TO_FE_SLUG_MAP)));
}

/**
 * Get all valid database slugs
 * @returns Array of database slugs
 */
export function getAllDbSlugs(): string[] {
  return Object.keys(DB_TO_FE_SLUG_MAP);
}

/**
 * Get robust list of DB slug candidates for a given FE slug
 */
export function getDbSlugCandidates(feSlug: string): string[] {
  return FE_TO_DB_SLUG_CANDIDATES[feSlug] || [toDbSlug(feSlug)];
}
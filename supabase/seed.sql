-- Seed Categories Table with Realistic Finnish Service Categories
-- Idempotent seed file that can be run multiple times safely

-- ============================================================================
-- CATEGORY SEED DATA
-- ============================================================================
-- This seed file uses INSERT ... ON CONFLICT to ensure idempotency
-- Categories are identified by slug for upsert operations

-- Insert or update existing categories
INSERT INTO categories (id, name, name_fi, name_en, slug, description, description_fi, icon_url)
VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Kotitaloustyöt',
    'Kotitaloustyöt',
    'Household Tasks',
    'kotitaloustyot',
    'Yleiset kotitaloustyöt kuten pyykinpesu, tiskaus ja järjestely',
    'Yleiset kotitaloustyöt kuten pyykinpesu, tiskaus ja järjestely',
    '🏠'
  ),
  (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'Siivous',
    'Siivous',
    'Cleaning',
    'siivous',
    'Kodin ja toimiston siivouspalvelut',
    'Kodin ja toimiston siivouspalvelut',
    '🧹'
  ),
  (
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'Korjaukset',
    'Korjaukset',
    'Repairs',
    'korjaukset',
    'Pienet korjaustyöt ja huolto',
    'Pienet korjaustyöt ja huolto',
    '🔧'
  ),
  (
    'd4e5f6a7-b8c9-0123-defa-234567890123',
    'Kokoonpano',
    'Kokoonpano',
    'Assembly',
    'kokoonpano',
    'Huonekalujen ja laitteiden kokoonpano',
    'Huonekalujen ja laitteiden kokoonpano',
    '🔨'
  ),
  (
    'e5f6a7b8-c9d0-1234-efab-345678901234',
    'Puutarha',
    'Puutarha',
    'Gardening',
    'puutarha',
    'Puutarhatyöt ja ulkoalueiden hoito',
    'Puutarhatyöt ja ulkoalueiden hoito',
    '🌱'
  ),
  (
    'f6a7b8c9-d0e1-2345-fabc-456789012345',
    'Muutto',
    'Muutto',
    'Moving',
    'muutto',
    'Muuttopalvelut ja tavaroiden kuljetus',
    'Muuttopalvelut ja tavaroiden kuljetus',
    '📦'
  ),
  (
    'a7b8c9d0-e1f2-3456-abcd-567890123456',
    'IT-apu',
    'IT-apu',
    'IT Support',
    'it-apu',
    'Tietokoneiden, sovellusten ja teknologian apu',
    'Tietokoneiden, sovellusten ja teknologian apu',
    '💻'
  )
ON CONFLICT (slug)
DO UPDATE SET
  name = EXCLUDED.name,
  name_fi = EXCLUDED.name_fi,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_fi = EXCLUDED.description_fi,
  icon_url = EXCLUDED.icon_url;

-- Log seed completion
DO $$
BEGIN
  RAISE NOTICE 'Categories seed data applied successfully';
END $$;

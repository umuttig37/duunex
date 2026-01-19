-- Consolidate duplicate Korjaus categories
-- Remove duplicate "Korjaus" category and merge with "Korjaukset"
-- Safe migration that preserves all foreign key references

-- Step 1: Identify the duplicate categories
SELECT 'Current Korjaus-related categories before consolidation:' as info;
SELECT 
    id, 
    name_fi, 
    name_en,
    slug, 
    description_fi,
    created_at
FROM categories 
WHERE slug IN ('korjaus', 'korjaukset') OR name_fi ILIKE '%korjaus%'
ORDER BY created_at;

-- Step 2: Check for existing foreign key references before consolidation
SELECT 'Checking foreign key references for Korjaus categories:' as info;
SELECT 
    c.slug,
    c.name_fi,
    COUNT(tc.category_id) as tasker_count,
    COUNT(t.category_id) as task_count,
    COUNT(tt.category_id) as template_count
FROM categories c
LEFT JOIN tasker_categories tc ON c.id = tc.category_id
LEFT JOIN tasks t ON c.id = t.category_id  
LEFT JOIN task_templates tt ON c.id = tt.category_id
WHERE c.slug IN ('korjaus', 'korjaukset') OR c.name_fi ILIKE '%korjaus%'
GROUP BY c.id, c.slug, c.name_fi
ORDER BY c.slug;

-- Step 3: Consolidation strategy
-- Keep the "korjaukset" category (plural form is more comprehensive)
-- Migrate all references from "korjaus" to "korjaukset"

-- Update tasker_categories references
UPDATE tasker_categories 
SET category_id = (
    SELECT id FROM categories WHERE slug = 'korjaukset' LIMIT 1
)
WHERE category_id = (
    SELECT id FROM categories WHERE slug = 'korjaus' LIMIT 1
)
AND NOT EXISTS (
    -- Prevent duplicate category assignments for same tasker (profile)
    -- Table uses profile_id (not tasker_id) as per current schema
    SELECT 1 FROM tasker_categories tc2 
    WHERE tc2.profile_id = tasker_categories.profile_id 
    AND tc2.category_id = (SELECT id FROM categories WHERE slug = 'korjaukset' LIMIT 1)
);

-- Update task references
UPDATE tasks 
SET category_id = (
    SELECT id FROM categories WHERE slug = 'korjaukset' LIMIT 1
)
WHERE category_id = (
    SELECT id FROM categories WHERE slug = 'korjaus' LIMIT 1
);

-- Update task_templates references
UPDATE task_templates 
SET category_id = (
    SELECT id FROM categories WHERE slug = 'korjaukset' LIMIT 1
)
WHERE category_id = (
    SELECT id FROM categories WHERE slug = 'korjaus' LIMIT 1
);

-- Step 4: (Skipped) Duplicate removal
-- The tasker_categories table has a composite primary key (profile_id, category_id)
-- so true duplicates cannot exist. Older scripts referenced tasker_id/created_at,
-- but current schema only has (profile_id, category_id). No action needed.

-- Step 5: Ensure the "korjaukset" category has proper details
UPDATE categories 
SET 
    name_fi = 'Korjaukset',
    name_en = 'Repairs',
    description_fi = 'Pienet korjaustyöt ja huoltotehtävät kotiin ja toimistoon',
    description_en = 'Small repairs and maintenance tasks for home and office',
    icon_url = '🔧'
WHERE slug = 'korjaukset';

-- Step 6: Delete the duplicate "korjaus" category (only if it has no remaining references)
DELETE FROM categories 
WHERE slug = 'korjaus' 
AND id NOT IN (
    SELECT DISTINCT category_id FROM tasker_categories WHERE category_id IS NOT NULL
    UNION
    SELECT DISTINCT category_id FROM tasks WHERE category_id IS NOT NULL  
    UNION
    SELECT DISTINCT category_id FROM task_templates WHERE category_id IS NOT NULL
);

-- Step 7: Verify the consolidation was successful
SELECT 'Categories after consolidation:' as info;
SELECT 
    id, 
    name_fi, 
    name_en,
    slug, 
    description_fi,
    created_at
FROM categories 
WHERE slug IN ('korjaus', 'korjaukset') OR name_fi ILIKE '%korjaus%'
ORDER BY created_at;

-- Check final reference counts
SELECT 'Final reference counts after consolidation:' as info;
SELECT 
    c.slug,
    c.name_fi,
    COUNT(tc.category_id) as tasker_count,
    COUNT(t.category_id) as task_count,
    COUNT(tt.category_id) as template_count
FROM categories c
LEFT JOIN tasker_categories tc ON c.id = tc.category_id
LEFT JOIN tasks t ON c.id = t.category_id  
LEFT JOIN task_templates tt ON c.id = tt.category_id
WHERE c.slug = 'korjaukset'
GROUP BY c.id, c.slug, c.name_fi;
# Data Migrations

  **These are optional data cleanup scripts, NOT schema migrations.**

## Purpose

This directory contains SQL scripts that fix or clean up data issues without modifying the database schema. These scripts are separate from schema migrations because:

1. They are optional and situation-specific
2. They may only need to run once on existing data
3. They don't create or modify tables, just fix data problems

## When to Run

Only run these scripts if you have the specific data issue they address.

## Current Scripts

### 20250822_consolidate_korjaus_categories.sql
**Issue:** Duplicate "Korjaus" categories in the database
**What it does:** Consolidates duplicate category records and reassigns related data
**When to run:** Only if you have duplicate Korjaus categories (check first!)

```sql
-- Check if you need this migration
SELECT name_fi, COUNT(*)
FROM categories
WHERE name_fi = 'Korjaus'
GROUP BY name_fi
HAVING COUNT(*) > 1;
```

If the query returns results, you have duplicates and should run the migration.

## How to Run

These scripts are NOT run automatically by `supabase db reset`.

To run manually:
```bash
# Via Supabase CLI
supabase db execute --file supabase/data-migrations/[script-name].sql

# Or via psql
psql [DATABASE_URL] -f supabase/data-migrations/[script-name].sql
```

## Important Notes

- Always backup your database before running data migrations
- Test on development environment first
- These scripts should be idempotent when possible
- Document any new scripts you add here

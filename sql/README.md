# SQL Directory - Database Archive

⚠️ **IMPORTANT**: This directory is for archival purposes only. Active database migrations have been moved to `supabase/migrations/`.

## 📁 Current Structure

```
sql/
└── archive/
    └── pre_consolidation/  # Pre-Supabase CLI consolidation (archived 2025-01-01)
        ├── migrations/     # 41 original migration files
        ├── functions/      # 3 RPC function files
        ├── indexes/        # Production indexes
        └── seeds/          # Category seed data
```

## ✅ New Supabase-First Structure

**All active migrations are now in:** `supabase/migrations/`

The new structure uses Supabase CLI conventions:
```
supabase/
├── migrations/
│   ├── 20250101_000_initial_schema.sql          # Consolidated comprehensive schema with all fixes
│   └── 20250102_000_performance_indexes.sql     # All production indexes
├── seed.sql                                     # Idempotent category seed data
└── data-migrations/
    └── 20250822_consolidate_korjaus_categories.sql  # Optional: Fixes duplicate categories
```

**What's included in initial_schema.sql:**
- All tables, constraints, and relationships
- All RLS policies and triggers
- Counter offer system (with acceptance bug fix)
- PostGIS functions (`find_nearby_taskers`, `update_tasker_location`)
- Payment processing functions (3% platform fee)
- Admin dashboard metrics
- Notification system
- Task approval workflow

## 🔧 How to Use Migrations (New Process)

### Initial Database Setup
```bash
# Install and start Supabase CLI
supabase start

# Reset database and apply all migrations
supabase db reset

# This will:
# 1. Apply all files in supabase/migrations/ in order
# 2. Run supabase/seed.sql for initial data
# 3. Generate fresh database
```

### After Schema Changes
```bash
# Generate TypeScript types
supabase gen types typescript --local > src/lib/supabase/database.types.ts

# Create new migration
supabase migration new your_migration_name

# Test migration
supabase db reset
```

## 📦 Archive Contents (Reference Only)

### pre_consolidation/migrations/ (41 files)
Consolidated into `supabase/migrations/20250101_000_initial_schema.sql`:
- All table creation scripts
- RLS policies and triggers
- Payment system (3% platform fee)
- Balance tracking and withdrawals
- Task management and offers
- Counter offer system (with acceptance bug fix)
- Admin features and metrics
- PostGIS geospatial functions

### pre_consolidation/functions/ (3 files)
Consolidated into initial schema:
- `find_nearby_taskers.sql` - PostGIS geospatial queries
- `enhanced_payment_functions.sql` - Payment statistics
- `admin_dashboard_3_percent_metrics.sql` - Admin metrics

### pre_consolidation/indexes/
Consolidated into `supabase/migrations/20250102_000_performance_indexes.sql`:
- Geospatial GIST indexes for location searches
- Status-based partial indexes
- Foreign key relationship indexes
- Composite indexes for complex queries

### pre_consolidation/seeds/
Consolidated into `supabase/seed.sql`:
- Task categories (Siivous, Muutto, Korjaukset, etc.)
- Idempotent with ON CONFLICT handling

### Recent fixes (merged into initial schema)
Previously separate migration files, now incorporated:
- `20250816_fix_find_nearby_taskers.sql` - Fixed to use tasker_details.location
- `20250819_fix_counter_offer_acceptance.sql` - Fixed status = 'accepted' bug
- `20250819_create_update_tasker_location.sql` - Location update utility
- `20250819_create_delete_non_admin_users_rpc.sql` - Removed (dev-only, dangerous)

## 🔐 Security Considerations

### Row Level Security (RLS)
All tables have RLS policies enabled. Key security features:
- User-specific data access controls
- Role-based permissions (user, tasker, admin)
- Protected financial operations

### SECURITY DEFINER Functions
Some functions use `SECURITY DEFINER` to bypass RLS for legitimate operations:
- Payment processing functions
- Balance update functions
- Admin reporting functions

**Warning**: Only use `SECURITY DEFINER` when absolutely necessary and validate all inputs!

### Sensitive Data
Tables with sensitive data:
- `tasker_balance` - Tasker earnings and withdrawals
- `bank_account_info` - Banking information
- `payments` - Payment transactions
- `withdrawal_requests` - Withdrawal history

## 📊 Database Schema Overview

### Core Tables
- `profiles` - User/tasker profiles with role information
- `tasker_details` - Tasker-specific data (location, rates, availability)
- `tasks` - Task records with PostGIS location data
- `task_offers` - Tasker offers/applications for tasks

### Financial Tables
- `payments` - Payment transaction records
- `tasker_balance` - Tasker balance tracking
- `balance_transactions` - Transaction history
- `withdrawal_requests` - Withdrawal management

### Communication
- `messages` - Task-based messaging system
- `user_feedback` - User feedback collection

### Admin
- `tasker_applications` - Tasker verification workflow
- `admin_revenue_tracking` - Platform revenue metrics
- `overdue_task_actions` - Automated task escalation

## 🧪 Testing Migrations

Before applying to production:
1. Test on local Supabase instance
2. Verify RLS policies work correctly
3. Check for constraint violations
4. Validate foreign key relationships
5. Test rollback scenarios if possible

## 📝 Migration Best Practices

1. **Idempotent**: Use `CREATE TABLE IF NOT EXISTS`, `DROP IF EXISTS`, etc.
2. **Transactional**: Wrap related changes in transactions where possible
3. **Documented**: Add comments explaining complex migrations
4. **Versioned**: Include creation date in filename (future improvement)
5. **Tested**: Always test on development environment first

## 🔄 Type Generation

After any schema changes, regenerate TypeScript types:

```bash
supabase gen types typescript --project-id [PROJECT_ID] > src/lib/supabase/database.types.ts
```

This ensures your application code stays in sync with the database schema.

## 📞 Support

- **Schema Questions**: Reference [docs/blueprint.md](../docs/blueprint.md) for database design
- **API Setup**: See [docs/API_SETUP_GUIDE.md](../docs/API_SETUP_GUIDE.md) for Supabase and 3rd party services
- **Security Concerns**: See [docs/SECURITY_FIX_README.md](../docs/SECURITY_FIX_README.md)

---

**Important**: Always backup your database before running migrations in production!

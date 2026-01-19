import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY and should only be used in server-side code
// where you need to bypass RLS policies.
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
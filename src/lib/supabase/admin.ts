import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

let adminClient: SupabaseClient<Database> | null = null;

function getRequiredEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY') {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export function getSupabaseAdminClient(): SupabaseClient<Database> {
  if (!adminClient) {
    adminClient = createClient<Database>(
      getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
      getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    );
  }

  return adminClient;
}

// Keep the old API shape so existing server code can continue calling
// supabaseAdmin.from(...), but avoid creating the client during module import.
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseAdminClient(), prop, receiver);
  },
});

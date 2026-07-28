import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isDemoMode = !supabaseUrl || !supabaseAnonKey;

if (isDemoMode) {
  console.warn(
    '⚠️ Next.js running in standalone DEMO mode. Supabase environment credentials missing in .env.local. Seeding local state mocks...'
  );
}

export const supabase = !isDemoMode 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : (null as any);

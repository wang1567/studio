import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase'; // We'll create this file later

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL. Please check your .env.local file.");
}

if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY. Please check your .env.local file.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

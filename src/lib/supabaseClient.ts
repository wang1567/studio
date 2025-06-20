import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("環境變數 NEXT_PUBLIC_SUPABASE_URL 未設定。請檢查您的 .env.local 檔案。");
}

if (!supabaseAnonKey) {
  throw new Error("環境變數 NEXT_PUBLIC_SUPABASE_ANON_KEY 未設定。請檢查您的 .env.local 檔案。");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);


import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "關鍵錯誤：環境變數 NEXT_PUBLIC_SUPABASE_URL 未設定。請在您的 Firebase Studio 環境設定中設定此變數，或在專案根目錄建立 .env.local 檔案並加入 NEXT_PUBLIC_SUPABASE_URL=your_url。設定後，請務必重新啟動您的開發伺服器/Studio 環境。"
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "關鍵錯誤：環境變數 NEXT_PUBLIC_SUPABASE_ANON_KEY 未設定。請在您的 Firebase Studio 環境設定中設定此變數，或在專案根目錄建立 .env.local 檔案並加入 NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key。設定後，請務必重新啟動您的開發伺服器/Studio 環境。"
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "關鍵錯誤：環境變數 NEXT_PUBLIC_SUPABASE_URL 未設定。\n\n請依照以下步驟檢查：\n1. Firebase Studio 環境設定：請在您的 Firebase Studio 專案的環境變數設定中，確認 NEXT_PUBLIC_SUPABASE_URL 已正確設定。\n2. .env.local 檔案：如果在本地或特定支援的環境中使用，請確保專案根目錄下的 .env.local 檔案包含 NEXT_PUBLIC_SUPABASE_URL=your_supabase_url。\n3. 重新啟動/重新部署：在 Firebase Studio 中設定或修改環境變數後，您必須依照 Firebase Studio 的指示重新啟動應用程式、重新部署或重建，以使變更生效。\n4. 檢查建置日誌：查看 Firebase Studio 的建置或部署日誌，確認環境變數是否已成功載入。\n\n如果問題持續，請查閱 Firebase Studio 的官方文件或尋求其支援管道以了解如何正確設定環境變數。"
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "關鍵錯誤：環境變數 NEXT_PUBLIC_SUPABASE_ANON_KEY 未設定。\n\n請依照以下步驟檢查：\n1. Firebase Studio 環境設定：請在您的 Firebase Studio 專案的環境變數設定中，確認 NEXT_PUBLIC_SUPABASE_ANON_KEY 已正確設定。\n2. .env.local 檔案：如果在本地或特定支援的環境中使用，請確保專案根目錄下的 .env.local 檔案包含 NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key。\n3. 重新啟動/重新部署：在 Firebase Studio 中設定或修改環境變數後，您必須依照 Firebase Studio 的指示重新啟動應用程式、重新部署或重建，以使變更生效。\n4. 檢查建置日誌：查看 Firebase Studio 的建置或部署日誌，確認環境變數是否已成功載入。\n\n如果問題持續，請查閱 Firebase Studio 的官方文件或尋求其支援管道以了解如何正確設定環境變數。"
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    
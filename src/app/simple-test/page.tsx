"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 創建一個安全的 Supabase 客戶端測試
const testSupabaseConnection = async () => {
  try {
    // 檢查環境變數
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        success: false,
        error: '環境變數未設定',
        details: `URL: ${!!supabaseUrl}, Key: ${!!supabaseKey}`
      };
    }

    // 動態導入 Supabase 來避免載入錯誤
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 測試認證狀態
    const { data: { user } } = await supabase.auth.getUser();
    
    // 測試簡單查詢
    const { data, error } = await supabase
      .from('tas_adoption_centers')
      .select('count')
      .limit(1);
    
    return {
      success: !error,
      user: user ? 'authenticated' : 'anonymous',
      error: error?.message,
      details: error?.details,
      code: error?.code
    };
    
  } catch (err) {
    return {
      success: false,
      error: `連接錯誤: ${err}`,
      details: err instanceof Error ? err.stack : String(err)
    };
  }
};

export default function SimpleAuthTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const testResult = await testSupabaseConnection();
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        error: `測試失敗: ${error}`,
        details: error instanceof Error ? error.message : String(error)
      });
    }
    
    setLoading(false);
  };

  const testWithLogout = async () => {
    setLoading(true);
    try {
      // 先登出
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      await supabase.auth.signOut();
      
      // 等待一下
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 重新測試
      const testResult = await testSupabaseConnection();
      setResult({
        ...testResult,
        note: '已登出後測試'
      });
      
    } catch (error) {
      setResult({
        success: false,
        error: `登出測試失敗: ${error}`
      });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">🔧 簡化權限測試</h1>
      
      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400">
        <h3 className="font-bold text-blue-800">測試說明</h3>
        <p className="text-blue-700">
          這是一個簡化版本的權限測試，用來診斷 Supabase 連接和權限問題。
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <Button 
          onClick={runTest} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? '測試中...' : '執行基本測試'}
        </Button>
        
        <Button 
          onClick={testWithLogout} 
          disabled={loading}
          variant="outline"
          className="ml-4"
        >
          {loading ? '測試中...' : '登出後測試'}
        </Button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="bg-gray-900 text-white p-4 rounded-lg">
            <h3 className="font-bold mb-2">測試結果:</h3>
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>

          {!result.success && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <h3 className="font-bold text-red-800">❌ 發現問題</h3>
              <p className="text-red-700 mb-4">
                {result.error}
              </p>
              
              {result.code === 'PGRST116' && (
                <div className="mt-4 p-3 bg-yellow-100 rounded">
                  <h4 className="font-bold text-yellow-800">💡 解決方案：</h4>
                  <p className="text-yellow-700 mb-2">
                    錯誤代碼 PGRST116 表示資料表不存在。請在 Supabase 中執行以下 SQL：
                  </p>
                  <pre className="text-sm bg-gray-800 text-white p-2 rounded">
{`-- 創建 TAS 認養中心資料表
CREATE TABLE IF NOT EXISTS tas_adoption_centers (
  id SERIAL PRIMARY KEY,
  area TEXT,
  organization_name TEXT,
  address TEXT,
  phone TEXT,
  mobile_phone TEXT,
  is_mobile BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入測試資料
INSERT INTO tas_adoption_centers (area, organization_name, address, phone) VALUES
('中正區', '台北市動物之家', '台北市中正區某某路123號', '02-1234-5678'),
('大安區', '毛孩之家', '台北市大安區某某街456號', '02-2345-6789');

-- 設定權限
ALTER TABLE tas_adoption_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access" ON tas_adoption_centers FOR SELECT USING (true);`}
                  </pre>
                </div>
              )}
              
              {result.error?.includes('permission denied') && (
                <div className="mt-4 p-3 bg-yellow-100 rounded">
                  <h4 className="font-bold text-yellow-800">💡 解決方案：</h4>
                  <p className="text-yellow-700 mb-2">
                    權限被拒絕，請在 Supabase SQL Editor 中執行：
                  </p>
                  <pre className="text-sm bg-gray-800 text-white p-2 rounded">
{`-- 允許所有用戶讀取資料
ALTER TABLE tas_adoption_centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access" ON tas_adoption_centers;
CREATE POLICY "Allow read access" ON tas_adoption_centers FOR SELECT USING (true);`}
                  </pre>
                </div>
              )}
            </div>
          )}

          {result.success && (
            <div className="p-4 bg-green-50 border-l-4 border-green-400">
              <h3 className="font-bold text-green-800">✅ 測試通過！</h3>
              <p className="text-green-700">
                Supabase 連接正常，權限設定沒有問題。
                使用者狀態: {result.user === 'authenticated' ? '已登入' : '匿名用戶'}
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-bold mb-2">🔗 相關連結</h3>
        <ul className="space-y-2 text-sm">
          <li>• <a href="https://supabase.com/dashboard" className="text-blue-600 underline" target="_blank" rel="noopener">Supabase Dashboard</a></li>
          <li>• <a href="/shelter-animals" className="text-blue-600 underline">測試收容所動物頁面</a></li>
          <li>• <a href="/tas-adoption" className="text-blue-600 underline">測試TAS認養中心頁面</a></li>
          <li>• <a href="/matches" className="text-blue-600 underline">測試滑卡配對頁面</a></li>
        </ul>
      </div>
    </div>
  );
}
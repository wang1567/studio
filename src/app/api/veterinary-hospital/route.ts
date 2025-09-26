// Next.js API 路由 - 台北市動物醫院 API 代理
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 提取查詢參數
    const q = searchParams.get('q');
    const limit = searchParams.get('limit') || '1000';
    const offset = searchParams.get('offset') || '0';

    console.log('動物醫院 API 代理請求開始...');
    console.log('查詢參數:', { q, limit, offset });

    // 構建台北市政府 API URL
    const apiUrl = new URL('https://data.taipei/api/v1/dataset/40d79051-1839-4d00-855f-be88f1e06caf');
    apiUrl.searchParams.append('scope', 'resourceAquire');
    apiUrl.searchParams.append('resource_id', '40d79051-1839-4d00-855f-be88f1e06caf');
    
    if (q) {
      apiUrl.searchParams.append('q', q);
    }
    apiUrl.searchParams.append('limit', limit);
    apiUrl.searchParams.append('offset', offset);

    console.log('代理目標 URL:', apiUrl.toString());

    // 發送請求到台北市政府 API
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error('API 請求失敗:', response.status, response.statusText);
      throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API 完整回應:', JSON.stringify(data, null, 2));
    console.log('API 回應成功，資料結構:', {
      success: data.success,
      hasResult: !!data.result,
      hasResults: !!data.result?.results,
      resultCount: data.result?.results?.length || 0,
      dataKeys: Object.keys(data)
    });

    // 標準化回應格式，確保 success 為 true
    const normalizedData = {
      success: true, // 強制設為 true，因為請求成功了
      result: data.result || {
        results: Array.isArray(data) ? data : [],
        count: Array.isArray(data) ? data.length : 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    };

    // 如果直接回應是陣列（某些 API 會這樣），進行轉換
    if (Array.isArray(data)) {
      normalizedData.result = {
        results: data,
        count: data.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
    }

    console.log('標準化後的回應:', {
      success: normalizedData.success,
      resultCount: normalizedData.result?.results?.length || 0
    });

    // 回傳代理的資料
    return NextResponse.json(normalizedData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('動物醫院 API 代理錯誤:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤',
        result: {
          results: [],
          count: 0
        }
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
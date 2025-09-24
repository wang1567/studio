import { NextRequest, NextResponse } from 'next/server';

// 台北市寵物登記站 API 代理
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const limit = searchParams.get('limit') || '1000';
    const offset = searchParams.get('offset') || '0';
    const 縣市 = searchParams.get('縣市');
    const 編號 = searchParams.get('編號');

    // 建構原始 API URL - 使用動物醫院資料作為寵物登記機構
    const apiUrl = new URL('https://data.taipei/api/v1/dataset/40d79051-1839-4d00-855f-be88f1e06caf');
    apiUrl.searchParams.append('scope', 'resourceAquire');
    apiUrl.searchParams.append('resource_id', '40d79051-1839-4d00-855f-be88f1e06caf');

    // 添加搜尋參數
    if (q) {
      apiUrl.searchParams.append('q', q);
    }
    if (limit) {
      apiUrl.searchParams.append('limit', limit);
    }
    if (offset) {
      apiUrl.searchParams.append('offset', offset);
    }

    const fullApiUrl = apiUrl.toString();
    console.log('寵物登記站 API 請求URL:', fullApiUrl);

    const response = await fetch(fullApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error('API 回應錯誤:', response.status, response.statusText);
      throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API 回應成功，資料結構:', {
      success: data.success,
      hasResult: !!data.result,
      hasResults: !!data.results,
      resultCount: Array.isArray(data.result) ? data.result.length : 'Not array',
      dataKeys: Object.keys(data)
    });

    // 標準化回應格式
    let standardizedResponse;
    if (data.result && data.result.results && Array.isArray(data.result.results)) {
      standardizedResponse = {
        success: true,
        result: data.result.results,
        count: data.result.results.length
      };
    } else if (data.result && Array.isArray(data.result)) {
      standardizedResponse = {
        success: true,
        result: data.result,
        count: data.result.length
      };
    } else if (Array.isArray(data)) {
      standardizedResponse = {
        success: true,
        result: data,
        count: data.length
      };
    } else {
      console.warn('未預期的 API 回應格式:', data);
      standardizedResponse = {
        success: data.success !== false,
        result: [],
        count: 0
      };
    }

    console.log('標準化後的回應:', { success: standardizedResponse.success, resultCount: standardizedResponse.count });

    return NextResponse.json(standardizedResponse);

  } catch (error) {
    console.error('寵物登記站 API 代理錯誤:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知錯誤',
        result: [],
        count: 0
      },
      { status: 500 }
    );
  }
}
// 臺北市動物醫院資訊服務

import type { 
  VeterinaryHospital, 
  VeterinaryHospitalSearchParams,
  VeterinaryHospitalResponse,
  ApiResponse 
} from '@/types/veterinary-hospital';

export class VeterinaryHospitalService {
  /**
   * 搜尋動物醫院
   */
  static async searchHospitals(params: VeterinaryHospitalSearchParams = {}): Promise<ApiResponse<VeterinaryHospital[]>> {
    try {
      const { q, limit = 1000, offset = 0 } = params;
      
      console.log('搜尋動物醫院參數:', { q, limit, offset });

      // 構建查詢參數 - 使用我們的 API 代理
      const searchParams = new URLSearchParams();

      if (q) {
        searchParams.append('q', q);
      }
      if (limit) {
        searchParams.append('limit', limit.toString());
      }
      if (offset) {
        searchParams.append('offset', offset.toString());
      }

      const url = `/api/veterinary-hospital?${searchParams.toString()}`;
      console.log('代理 API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      console.log('服務層收到的 API 回應:', data);

      // 簡化的資料處理邏輯
      let hospitals: VeterinaryHospital[] = [];
      let totalCount = 0;

      console.log('資料處理 - 回應類型:', typeof data);
      console.log('資料處理 - 是否為陣列:', Array.isArray(data));
      console.log('資料處理 - success 欄位:', data.success);

      // 如果明確指示失敗
      if (data.success === false) {
        console.error('API 明確指示失敗:', data);
        throw new Error(`API 回應錯誤: ${data.error || '未知錯誤'}`);
      }

      // 嘗試提取資料 - 優先處理最常見的格式
      if (data.result?.results && Array.isArray(data.result.results)) {
        // 標準 result.results 格式
        hospitals = data.result.results;
        totalCount = data.result.count || hospitals.length;
        console.log('使用 result.results 格式，找到', hospitals.length, '筆資料');
      } else if (Array.isArray(data.result)) {
        // result 直接是陣列
        hospitals = data.result;
        totalCount = hospitals.length;
        console.log('使用 result 陣列格式，找到', hospitals.length, '筆資料');
      } else if (Array.isArray(data)) {
        // 整個回應就是陣列
        hospitals = data;
        totalCount = hospitals.length;
        console.log('使用直接陣列格式，找到', hospitals.length, '筆資料');
      } else {
        // 其他情況 - 不拋出錯誤，而是回傳空結果
        console.warn('未知的資料格式，回傳空結果. Data keys:', Object.keys(data));
        hospitals = [];
        totalCount = 0;
      }

      console.log(`成功獲取 ${hospitals.length} 家動物醫院資料，總數: ${totalCount}`);
      console.log('前3筆資料範例:', hospitals.slice(0, 3));

      return {
        data: hospitals,
        count: totalCount
      };

    } catch (error) {
      console.error('搜尋動物醫院失敗:', error);
      
      let errorMessage = '搜尋動物醫院失敗: 未知錯誤';
      
      if (error instanceof Error) {
        errorMessage = `搜尋動物醫院失敗: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = `搜尋動物醫院失敗: ${JSON.stringify(error)}`;
      }
      
      return { data: [], error: errorMessage };
    }
  }

  /**
   * 根據關鍵字搜尋動物醫院
   */
  static async searchByKeyword(keyword: string, limit = 50): Promise<ApiResponse<VeterinaryHospital[]>> {
    return this.searchHospitals({
      q: keyword,
      limit,
      offset: 0
    });
  }

  /**
   * 獲取所有動物醫院（分頁）
   */
  static async getAllHospitals(page = 1, pageSize = 50): Promise<ApiResponse<VeterinaryHospital[]>> {
    const offset = (page - 1) * pageSize;
    return this.searchHospitals({
      limit: pageSize,
      offset
    });
  }

  /**
   * 根據區域篩選動物醫院
   */
  static async searchByArea(area: string): Promise<ApiResponse<VeterinaryHospital[]>> {
    const allHospitalsResponse = await this.searchHospitals({ limit: 1000 });
    
    if (allHospitalsResponse.error) {
      return allHospitalsResponse;
    }

    const filteredHospitals = allHospitalsResponse.data.filter(hospital => 
      hospital.地址.includes(area)
    );

    return {
      data: filteredHospitals,
      count: filteredHospitals.length
    };
  }
}
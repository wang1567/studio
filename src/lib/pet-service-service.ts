// 寵物專區服務

import type { 
  PetService, 
  PetServiceSearchParams,
  PetServiceResponse,
  ApiResponse 
} from '@/types/pet-service';

export class PetServiceService {
  /**
   * 搜尋寵物服務業者
   */
  static async searchPetServices(params: PetServiceSearchParams = {}): Promise<ApiResponse<PetService[]>> {
    try {
      const { q, limit = 1000, offset = 0, 縣市, 行政區, 營業項目, 評鑑等級 } = params;

      console.log('搜尋寵物服務業者參數:', { q, limit, offset, 縣市, 行政區, 營業項目, 評鑑等級 });      // 構建查詢參數 - 使用我們的 API 代理
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
      if (評鑑等級) {
        searchParams.append('評鑑等級', 評鑑等級);
      }
      if (縣市) {
        searchParams.append('縣市', 縣市);
      }
      if (行政區) {
        searchParams.append('行政區', 行政區);
      }
      if (營業項目) {
        searchParams.append('營業項目', 營業項目);
      }

      const url = `/api/pet-service?${searchParams.toString()}`;
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
      let petServices: PetService[] = [];
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
        petServices = data.result.results;
        totalCount = data.result.count || petServices.length;
        console.log('使用 result.results 格式，找到', petServices.length, '筆資料');
      } else if (Array.isArray(data.result)) {
        // result 直接是陣列
        petServices = data.result;
        totalCount = petServices.length;
        console.log('使用 result 陣列格式，找到', petServices.length, '筆資料');
      } else if (Array.isArray(data)) {
        // 整個回應就是陣列
        petServices = data;
        totalCount = petServices.length;
        console.log('使用直接陣列格式，找到', petServices.length, '筆資料');
      } else {
        // 其他情況 - 不拋出錯誤，而是回傳空結果
        console.warn('未知的資料格式，回傳空結果. Data keys:', Object.keys(data));
        petServices = [];
        totalCount = 0;
      }

      // 標準化資料格式
      petServices = petServices.map(service => ({
        ...service,
        // 清理營業項目中的換行符號和多餘空白
        營業項目: service.營業項目?.replace(/\n/g, '、').trim() || '',
        // 清理評鑑等級中的換行符號和多餘空白
        評鑑等級: service.評鑑等級?.replace(/\n/g, '').trim() || ''
      }));

      // 客戶端篩選（因為 API 可能不支援所有篩選）
      let filteredServices = petServices;

      if (縣市) {
        filteredServices = filteredServices.filter(service => 
          service.縣市 === 縣市
        );
        console.log(`縣市篩選 (${縣市}) 後剩餘:`, filteredServices.length);
      }

      if (行政區) {
        filteredServices = filteredServices.filter(service => 
          service.行政區 === 行政區
        );
        console.log(`行政區篩選 (${行政區}) 後剩餘:`, filteredServices.length);
      }

      if (營業項目) {
        filteredServices = filteredServices.filter(service => {
          const businessType = service.營業項目.toLowerCase();
          const searchType = 營業項目.toLowerCase();
          
          // 處理特殊情況
          if (searchType === '買賣寄養') {
            return businessType.includes('買賣') && businessType.includes('寄養');
          }
          
          return businessType.includes(searchType);
        });
        console.log(`營業項目篩選 (${營業項目}) 後剩餘:`, filteredServices.length);
      }

      if (評鑑等級) {
        filteredServices = filteredServices.filter(service => 
          service.評鑑等級 === 評鑑等級
        );
        console.log(`評鑑等級篩選 (${評鑑等級}) 後剩餘:`, filteredServices.length);
      }

      console.log(`成功獲取 ${filteredServices.length} 家寵物服務業者資料，總數: ${totalCount}`);
      console.log('前3筆資料範例:', filteredServices.slice(0, 3));

      return {
        data: filteredServices,
        count: filteredServices.length
      };

    } catch (error) {
      console.error('搜尋寵物服務業者失敗:', error);
      
      let errorMessage = '搜尋寵物服務業者失敗: 未知錯誤';
      
      if (error instanceof Error) {
        errorMessage = `搜尋寵物服務業者失敗: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = `搜尋寵物服務業者失敗: ${JSON.stringify(error)}`;
      }
      
      return { data: [], error: errorMessage };
    }
  }

  /**
   * 根據關鍵字搜尋寵物服務業者
   */
  static async searchByKeyword(keyword: string, limit = 100): Promise<ApiResponse<PetService[]>> {
    return this.searchPetServices({
      q: keyword,
      limit,
      offset: 0
    });
  }

  /**
   * 獲取所有寵物服務業者（分頁）
   */
  static async getAllPetServices(page = 1, pageSize = 50): Promise<ApiResponse<PetService[]>> {
    const offset = (page - 1) * pageSize;
    return this.searchPetServices({
      limit: pageSize,
      offset
    });
  }

  /**
   * 根據縣市和行政區篩選
   */
  static async searchByArea(縣市?: string, 行政區?: string): Promise<ApiResponse<PetService[]>> {
    return this.searchPetServices({
      縣市,
      行政區,
      limit: 1000
    });
  }

  /**
   * 根據營業項目篩選
   */
  static async searchByBusinessType(營業項目: string): Promise<ApiResponse<PetService[]>> {
    return this.searchPetServices({
      營業項目,
      limit: 1000
    });
  }

  /**
   * 根據評鑑等級篩選
   */
  static async searchByRating(評鑑等級: string): Promise<ApiResponse<PetService[]>> {
    return this.searchPetServices({
      評鑑等級,
      limit: 1000
    });
  }

  /**
   * 獲取所有可用的縣市列表
   */
  static async getAvailableCities(): Promise<ApiResponse<string[]>> {
    try {
      const allServicesResponse = await this.searchPetServices({ limit: 1000 });
      
      if (allServicesResponse.error) {
        return { data: [], error: allServicesResponse.error };
      }

      const cities = [...new Set(allServicesResponse.data.map(service => service.縣市))].sort();
      
      return {
        data: cities
      };
    } catch (error) {
      console.error('獲取縣市列表失敗:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : '獲取縣市列表失敗'
      };
    }
  }

  /**
   * 根據縣市獲取行政區列表
   */
  static async getDistrictsByCity(縣市: string): Promise<ApiResponse<string[]>> {
    try {
      const servicesResponse = await this.searchByArea(縣市);
      
      if (servicesResponse.error) {
        return { data: [], error: servicesResponse.error };
      }

      const districts = [...new Set(servicesResponse.data.map(service => service.行政區))].sort();
      
      return {
        data: districts
      };
    } catch (error) {
      console.error('獲取行政區列表失敗:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : '獲取行政區列表失敗'
      };
    }
  }
}
// 寵物登記站服務

import type { 
  PetRegistration, 
  PetRegistrationSearchParams,
  PetRegistrationResponse,
  ApiResponse 
} from '@/types/pet-registration';

export class PetRegistrationService {
  /**
   * 搜尋寵物登記站
   */
  static async searchPetRegistrations(params: PetRegistrationSearchParams = {}): Promise<ApiResponse<PetRegistration[]>> {
    try {
      const { q, limit = 1000, offset = 0, 縣市, 動物醫院名稱 } = params;

      console.log('搜尋寵物登記站參數:', { q, limit, offset, 縣市, 動物醫院名稱 });

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
      if (縣市) {
        searchParams.append('縣市', 縣市);
      }
      if (動物醫院名稱) {
        searchParams.append('動物醫院名稱', 動物醫院名稱);
      }

      const url = `/api/pet-registration?${searchParams.toString()}`;
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
      let petRegistrations: PetRegistration[] = [];
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
        petRegistrations = data.result.results;
        totalCount = data.result.count || petRegistrations.length;
        console.log('使用 result.results 格式，找到', petRegistrations.length, '筆資料');
      } else if (Array.isArray(data.result)) {
        // result 直接是陣列
        petRegistrations = data.result;
        totalCount = petRegistrations.length;
        console.log('使用 result 陣列格式，找到', petRegistrations.length, '筆資料');
      } else if (Array.isArray(data)) {
        // 整個回應就是陣列
        petRegistrations = data;
        totalCount = petRegistrations.length;
        console.log('使用直接陣列格式，找到', petRegistrations.length, '筆資料');
      } else {
        // 其他情況 - 不拋出錯誤，而是回傳空結果
        console.warn('未知的資料格式，回傳空結果. Data keys:', Object.keys(data));
        petRegistrations = [];
        totalCount = 0;
      }

      // 標準化資料格式
      petRegistrations = petRegistrations.map(station => ({
        ...station,
        // 清理地址中的換行符號和多餘空白
        地址: station.地址?.replace(/\n/g, ' ').trim() || '',
        // 確保電話號碼格式正確
        電話: station.電話?.replace(/\n/g, ' ').trim() || ''
      }));

      // 客戶端篩選（因為 API 可能不支援所有篩選）
      let filteredStations = petRegistrations;

      if (縣市) {
        filteredStations = filteredStations.filter(station => 
          station.縣市 === 縣市
        );
        console.log(`縣市篩選 (${縣市}) 後剩餘:`, filteredStations.length);
      }

      if (動物醫院名稱) {
        filteredStations = filteredStations.filter(station => 
          station.動物醫院名稱.includes(動物醫院名稱)
        );
        console.log(`動物醫院名稱篩選 (${動物醫院名稱}) 後剩餘:`, filteredStations.length);
      }

      console.log(`成功獲取 ${filteredStations.length} 個寵物登記站資料，總數: ${totalCount}`);
      console.log('前3筆資料範例:', filteredStations.slice(0, 3));

      return {
        data: filteredStations,
        count: filteredStations.length
      };

    } catch (error) {
      console.error('搜尋寵物登記站失敗:', error);
      
      let errorMessage = '搜尋寵物登記站失敗: 未知錯誤';
      
      if (error instanceof Error) {
        errorMessage = `搜尋寵物登記站失敗: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = `搜尋寵物登記站失敗: ${JSON.stringify(error)}`;
      }

      return {
        data: [],
        error: errorMessage,
        count: 0
      };
    }
  }

  /**
   * 獲取可用縣市列表
   */
  static async getAvailableCities(): Promise<ApiResponse<string[]>> {
    try {
      const response = await this.searchPetRegistrations({ limit: 1000 });
      
      if (response.error) {
        return {
          data: [],
          error: response.error,
          count: 0
        };
      }

      const cities = [...new Set(response.data.map(station => station.縣市))].sort();
      
      return {
        data: cities,
        count: cities.length
      };
    } catch (error) {
      return {
        data: [],
        error: '獲取縣市列表失敗',
        count: 0
      };
    }
  }
}
// 收容所動物 API 服務
// 提供與 Supabase 互動的函式

import { supabase } from '@/lib/supabaseClient';
import type {
  City,
  Shelter,
  ShelterAnimal,
  ShelterAnimalWithDetails,
  ShelterAnimalSearchParams,
  ShelterAnimalSearchResult,
  ShelterStatistics,
  ApiResponse,
  PaginationParams,
  FilterParams
} from '@/types/shelter-animals';

export class ShelterAnimalService {
  
  /**
   * 獲取所有城市列表
   */
  static async getCities(): Promise<ApiResponse<City[]>> {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('id');
      
      if (error) {
        console.error('Supabase 查詢錯誤:', error);
        throw error;
      }
      
      return { data: data || [] };
    } catch (error) {
      console.error('獲取城市列表失敗:', error);
      const errorMessage = error instanceof Error 
        ? `獲取城市列表失敗: ${error.message}` 
        : '獲取城市列表失敗: 未知錯誤';
      return { data: [], error: errorMessage };
    }
  }

  /**
   * 獲取收容所列表
   */
  static async getShelters(cityId?: string): Promise<ApiResponse<Shelter[]>> {
    try {
      let query = supabase
        .from('shelters')
        .select('*')
        .order('name');
      
      if (cityId) {
        query = query.eq('city_id', cityId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return { data: data || [] };
    } catch (error) {
      console.error('獲取收容所列表失敗:', error);
      return { data: [], error: '獲取收容所列表失敗' };
    }
  }

  /**
   * 搜尋收容所動物
   */
  static async searchShelterAnimals(
    params: ShelterAnimalSearchParams = {}
  ): Promise<ApiResponse<ShelterAnimalSearchResult[]>> {
    try {
      const {
        city_code,
        shelter_id,
        animal_type,
        breed,
        gender,
        size,
        age_category,
        is_neutered,
        status = 'OPEN',
        limit = 2500,
        offset = 0
      } = params;

      console.log('搜尋參數:', { city_code, shelter_id, animal_type, breed, gender, size, age_category, is_neutered, status, limit, offset });

      // 簡化查詢邏輯，直接使用資料表查詢
      console.log('=== 開始查詢動物資料 ===');
      console.log('查詢參數:', { city_code, animal_type, breed, gender, size, age_category, is_neutered, status, limit, offset });
      
      let data, error;
      let actualTotalCount = 0;
      
      // 直接使用標準查詢，不再嘗試 RPC
      console.log('使用直接資料表查詢...');
      
      // 首先檢查資料庫中的總動物數量
      const { count: totalAnimalsInDb } = await supabase
        .from('shelter_animals')
        .select('*', { count: 'exact', head: true });
      
      console.log('資料庫總動物數量:', totalAnimalsInDb);

      // 檢查前10筆動物的狀態分布
      const { data: statusSample } = await supabase
        .from('shelter_animals')
        .select('status')
        .limit(10);
      
      if (statusSample) {
        const statusCounts: Record<string, number> = statusSample.reduce((acc: Record<string, number>, item: any) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});
        console.log('前10筆動物狀態分布:', statusCounts);
        console.log('篩選狀態:', status);
      }
        const { count: totalCount } = await supabase
          .from('shelter_animals')
          .select('*', { count: 'exact', head: true });
        
        console.log('總動物數量:', totalCount);

        // 檢查不同狀態的動物數量
        const { data: statusData } = await supabase
          .from('shelter_animals')
          .select('status')
          .limit(50); // 減少數量，只查看前50筆
        
        if (statusData) {
          const statusCounts: Record<string, number> = statusData.reduce((acc: Record<string, number>, item: any) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          }, {});
          console.log('前50筆動物的狀態分布:', statusCounts);
          console.log('用於篩選的狀態值:', status);
        }

        let query = supabase
          .from('shelter_animals')
          .select(`
            id,
            serial_number,
            animal_type,
            breed,
            gender,
            size,
            color,
            age_category,
            is_neutered,
            image_url,
            adoption_start_date,
            notes,
            shelter_id,
            city_code
          `);

        // 創建計數查詢（與主查詢使用相同的篩選條件）
        let fallbackCountQuery = supabase
          .from('shelter_animals')
          .select('*', { count: 'exact', head: true });

        // 套用過濾條件
        if (status && status !== 'ALL') {
          console.log('套用狀態篩選:', status);
          query = query.eq('status', status);
          fallbackCountQuery = fallbackCountQuery.eq('status', status);
        }
        if (city_code) {
          console.log('套用城市篩選:', city_code);
          query = query.eq('city_code', city_code);
          fallbackCountQuery = fallbackCountQuery.eq('city_code', city_code);
        }
        if (shelter_id) {
          console.log('套用收容所篩選:', shelter_id);
          query = query.eq('shelter_id', shelter_id);
          fallbackCountQuery = fallbackCountQuery.eq('shelter_id', shelter_id);
        }
        if (animal_type) {
          query = query.eq('animal_type', animal_type);
          fallbackCountQuery = fallbackCountQuery.eq('animal_type', animal_type);
        }
        if (gender) {
          query = query.eq('gender', gender);
          fallbackCountQuery = fallbackCountQuery.eq('gender', gender);
        }
        if (size) {
          query = query.eq('size', size);
          fallbackCountQuery = fallbackCountQuery.eq('size', size);
        }
        if (age_category) {
          query = query.eq('age_category', age_category);
          fallbackCountQuery = fallbackCountQuery.eq('age_category', age_category);
        }
        if (is_neutered !== undefined) {
          query = query.eq('is_neutered', is_neutered);
          fallbackCountQuery = fallbackCountQuery.eq('is_neutered', is_neutered);
        }
        if (breed) {
          query = query.ilike('breed', `%${breed}%`);
          fallbackCountQuery = fallbackCountQuery.ilike('breed', `%${breed}%`);
        }

        // 先執行計數查詢
        const fallbackCountResult = await fallbackCountQuery;
        actualTotalCount = fallbackCountResult.count || 0;
        console.log('Fallback 總數查詢結果:', { actualTotalCount, countError: fallbackCountResult.error });

        console.log('執行查詢...');
        
        // 執行分頁查詢
        if (offset && offset > 0) {
          query = query.range(offset, offset + limit - 1);
        } else {
          query = query.limit(limit);
        }
        
        const result = await query;
        console.log('查詢結果:', { count: result.data?.length, actualTotalCount, error: result.error });
        data = result.data;
        error = result.error;

      if (error) throw error;

      // 格式化資料以符合預期的回傳格式
      const formattedData = data?.map((item: any) => ({
        id: item.id,
        serial_number: item.serial_number,
        animal_type: item.animal_type,
        breed: item.breed,
        gender: item.gender,
        size: item.size,
        color: item.color,
        age_category: item.age_category,
        is_neutered: item.is_neutered,
        image_url: item.image_url,
        shelter_name: '收容所', // 暫時使用預設值
        city_name: '城市', // 暫時使用預設值
        adoption_start_date: item.adoption_start_date,
        notes: item.notes
      })) || [];

      return { data: formattedData, count: actualTotalCount || formattedData.length };
    } catch (error) {
      console.error('搜尋收容所動物失敗:', error);
      
      // 提供更詳細的錯誤信息
      let errorMessage = '搜尋收容所動物失敗: 未知錯誤';
      
      if (error instanceof Error) {
        errorMessage = `搜尋收容所動物失敗: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        // 處理 Supabase 錯誤對象
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage = `搜尋收容所動物失敗: ${supabaseError.message}`;
        } else if (supabaseError.error) {
          errorMessage = `搜尋收容所動物失敗: ${supabaseError.error}`;
        } else {
          errorMessage = `搜尋收容所動物失敗: ${JSON.stringify(error)}`;
        }
      }
      
      console.error('錯誤詳情:', errorMessage);
      return { data: [], error: errorMessage };
    }
  }

  /**
   * 獲取單隻動物詳細資料
   */
  static async getShelterAnimalById(id: string): Promise<ApiResponse<ShelterAnimalWithDetails | null>> {
    try {
      const { data, error } = await supabase
        .from('shelter_animals_with_details')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return { data };
    } catch (error) {
      console.error('獲取動物詳細資料失敗:', error);
      return { data: null, error: '獲取動物詳細資料失敗' };
    }
  }

  /**
   * 獲取收容所統計資料
   */
  static async getShelterStatistics(): Promise<ApiResponse<ShelterStatistics | null>> {
    try {
      const { data, error } = await supabase.rpc('get_shelter_statistics');

      if (error) throw error;

      return { data };
    } catch (error) {
      console.error('獲取統計資料失敗:', error);
      return { data: null, error: '獲取統計資料失敗' };
    }
  }

  /**
   * 獲取熱門品種列表
   */
  static async getPopularBreeds(animalType?: string): Promise<ApiResponse<string[]>> {
    try {
      let query = supabase
        .from('shelter_animals')
        .select('breed')
        .not('breed', 'is', null)
        .neq('breed', '');

      if (animalType) {
        query = query.eq('animal_type', animalType);
      }

      const { data, error } = await query;

      if (error) throw error;

      // 統計品種並排序
      const breedCounts: { [key: string]: number } = {};
      data?.forEach(item => {
        if (item.breed) {
          const breed = item.breed.trim();
          breedCounts[breed] = (breedCounts[breed] || 0) + 1;
        }
      });

      const sortedBreeds = Object.keys(breedCounts)
        .sort((a, b) => breedCounts[b] - breedCounts[a])
        .slice(0, 20); // 取前20個最受歡迎的品種

      return { data: sortedBreeds };
    } catch (error) {
      console.error('獲取熱門品種失敗:', error);
      return { data: [], error: '獲取熱門品種失敗' };
    }
  }

  /**
   * 批次獲取收容所動物（用於卡片瀏覽）
   */
  static async getShelterAnimalsForCards(
    filters: FilterParams = {},
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<ApiResponse<ShelterAnimalSearchResult[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.pageSize;
      
      const searchParams: ShelterAnimalSearchParams = {
        ...filters,
        limit: pagination.pageSize,
        offset
      };

      return await this.searchShelterAnimals(searchParams);
    } catch (error) {
      console.error('獲取動物卡片資料失敗:', error);
      return { data: [], error: '獲取動物卡片資料失敗' };
    }
  }

  /**
   * 隨機獲取收容所動物（用於滑動介面）
   */
  static async getRandomShelterAnimals(
    count: number = 10,
    excludeIds: string[] = []
  ): Promise<ApiResponse<ShelterAnimalSearchResult[]>> {
    try {
      let query = supabase
        .from('shelter_animals_with_details')
        .select(`
          id,
          serial_number,
          animal_type,
          breed,
          gender,
          size,
          color,
          age_category,
          is_neutered,
          image_url,
          shelter_name,
          city_name,
          adoption_start_date,
          notes
        `)
        .eq('status', 'OPEN');

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      // 使用隨機排序（注意：這在大數據集上可能效能不佳）
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(count * 3); // 獲取較多資料後在前端隨機選擇

      if (error) throw error;

      // 在前端進行隨機排序並取指定數量
      const shuffled = data?.sort(() => Math.random() - 0.5).slice(0, count) || [];

      return { data: shuffled };
    } catch (error) {
      console.error('獲取隨機動物資料失敗:', error);
      return { data: [], error: '獲取隨機動物資料失敗' };
    }
  }

  /**
   * 根據收容所獲取動物列表
   */
  static async getAnimalsByShelter(
    shelterId: string,
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<ApiResponse<ShelterAnimalSearchResult[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.pageSize;

      const { data, error } = await supabase
        .from('shelter_animals_with_details')
        .select(`
          id,
          serial_number,
          animal_type,
          breed,
          gender,
          size,
          color,
          age_category,
          is_neutered,
          image_url,
          shelter_name,
          city_name,
          adoption_start_date,
          notes
        `)
        .eq('shelter_id', shelterId)
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .range(offset, offset + pagination.pageSize - 1);

      if (error) throw error;

      return { data: data || [] };
    } catch (error) {
      console.error('根據收容所獲取動物列表失敗:', error);
      return { data: [], error: '根據收容所獲取動物列表失敗' };
    }
  }
}

export default ShelterAnimalService;
// TAS浪愛滿屋推廣動物認養計畫服務

import { supabase } from '@/lib/supabaseClient';
import type { 
  TASAdoptionCenter, 
  TASAdoptionCenterResponse, 
  TASAdoptionCenterSearchParams,
  ApiResponse 
} from '@/types/tas-adoption';

export class TASAdoptionService {
  /**
   * 獲取所有 TAS 認養中心資料
   */
  static async getAllTASCenters(): Promise<ApiResponse<TASAdoptionCenter[]>> {
    try {
      console.log('正在從資料庫獲取 TAS 認養中心資料...');
      
      const { data, error } = await supabase
        .from('tas_adoption_centers')
        .select(`
          id,
          area,
          organization_name,
          address,
          phone,
          mobile_phone,
          is_mobile
        `)
        .order('area', { ascending: true })
        .order('id', { ascending: true });

      if (error) {
        throw error;
      }

      // 轉換資料格式以符合前端期望
      const formattedData = data?.map((item: any) => ({
        id: item.id,
        區域: item.area,
        合作機構名稱: item.organization_name,
        地址: item.address,
        電話: item.phone,
        行動電話: item.mobile_phone
      })) || [];

      console.log('成功獲取認養中心資料:', formattedData.length, '個中心');

      return {
        data: formattedData
      };

    } catch (error) {
      console.error('獲取 TAS 認養中心資料失敗:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : '未知錯誤'
      };
    }
  }

  /**
   * 搜尋 TAS 認養中心
   */
  static async searchTASCenters(params: TASAdoptionCenterSearchParams): Promise<ApiResponse<TASAdoptionCenterResponse>> {
    try {
      console.log('搜尋 TAS 認養中心，參數:', params);

      // 建立查詢
      let query = supabase
        .from('tas_adoption_centers')
        .select(`
          id,
          area,
          organization_name,
          address,
          phone,
          mobile_phone,
          is_mobile
        `, { count: 'exact' });

      // 建立計數查詢
      let countQuery = supabase
        .from('tas_adoption_centers')
        .select('*', { count: 'exact', head: true });

      // 套用篩選條件
      if (params.區域 && params.區域 !== 'ALL') {
        query = query.eq('area', params.區域);
        countQuery = countQuery.eq('area', params.區域);
      }

      if (params.合作機構名稱) {
        query = query.ilike('organization_name', `%${params.合作機構名稱}%`);
        countQuery = countQuery.ilike('organization_name', `%${params.合作機構名稱}%`);
      }

      // 先取得總數
      const { count: totalCount, error: countError } = await countQuery;
      
      if (countError) {
        throw countError;
      }

      // 套用排序和分頁
      const limit = params.limit || 20;
      const offset = params.offset || 0;
      
      query = query
        .order('area', { ascending: true })
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // 轉換資料格式
      const formattedData = data?.map((item: any) => ({
        id: item.id,
        區域: item.area,
        合作機構名稱: item.organization_name,
        地址: item.address,
        電話: item.phone,
        行動電話: item.mobile_phone
      })) || [];

      console.log(`搜尋結果: ${formattedData.length} 個中心，總共 ${totalCount} 個`);

      return {
        data: {
          data: formattedData,
          count: formattedData.length,
          total: totalCount || 0
        }
      };

    } catch (error) {
      console.error('搜尋 TAS 認養中心失敗:', error);
      return {
        data: { data: [], count: 0, total: 0 },
        error: error instanceof Error ? error.message : '搜尋失敗'
      };
    }
  }

  /**
   * 根據 ID 獲取特定認養中心
   */
  static async getTASCenterById(id: number): Promise<ApiResponse<TASAdoptionCenter | null>> {
    try {
      console.log('獲取認養中心詳情，ID:', id);

      const { data, error } = await supabase
        .from('tas_adoption_centers')
        .select(`
          id,
          area,
          organization_name,
          address,
          phone,
          mobile_phone,
          is_mobile
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      // 轉換資料格式
      const formattedData = data ? {
        id: data.id,
        區域: data.area,
        合作機構名稱: data.organization_name,
        地址: data.address,
        電話: data.phone,
        行動電話: data.mobile_phone
      } : null;

      return {
        data: formattedData
      };

    } catch (error) {
      console.error('獲取 TAS 認養中心詳情失敗:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : '獲取詳情失敗'
      };
    }
  }

  /**
   * 獲取所有可用的區域列表
   */
  static async getAvailableAreas(): Promise<ApiResponse<string[]>> {
    try {
      console.log('獲取可用區域列表...');

      const { data, error } = await supabase
        .from('tas_adoption_centers')
        .select('area')
        .order('area', { ascending: true });

      if (error) {
        throw error;
      }

      // 提取唯一區域並排序
      const areas = [...new Set(data?.map(item => item.area) || [])].sort();
      
      console.log('可用區域:', areas);

      return {
        data: areas
      };

    } catch (error) {
      console.error('獲取區域列表失敗:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : '獲取區域列表失敗'
      };
    }
  }
}

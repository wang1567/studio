// 收容所動物系統型別定義
// 對應 Supabase 資料庫中的收容所相關表格

export interface City {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Shelter {
  id: string;
  code: string;
  name: string;
  city_id: string;
  address?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface ShelterAnimal {
  id: string;
  serial_number: string; // 動物的流水編號
  shelter_code: string; // 動物的收容編號
  city_code: string; // 動物所屬縣市代碼
  shelter_id: string;
  current_location?: string; // 動物的實際所在地
  animal_type: string; // 動物的類型 (狗/貓)
  breed?: string; // 動物品種
  gender?: string; // 動物性別 (M/F)
  size?: string; // 動物體型 (SMALL/MEDIUM/BIG)
  color?: string; // 動物毛色
  age_category?: string; // 動物年紀 (CHILD/ADULT)
  is_neutered: boolean; // 是否絕育
  rabies_vaccinated: boolean; // 是否施打狂犬病疫苗
  found_location?: string; // 動物尋獲地
  web_title?: string; // 動物網頁標題
  status: string; // 動物狀態
  notes?: string; // 資料備註
  other_info?: string; // 其他說明
  adoption_start_date?: string; // 開放認養時間(起)
  adoption_end_date?: string; // 開放認養時間(迄)
  data_updated_at?: string; // 動物資料異動時間
  data_created_at?: string; // 動物資料建立時間
  image_url?: string; // 圖片URL
  last_modified_at?: string; // 異動時間
  system_updated_at: string; // 系統更新時間
  created_at: string;
}

// 包含詳細資訊的收容所動物視圖
export interface ShelterAnimalWithDetails extends ShelterAnimal {
  shelter_name: string;
  shelter_address?: string;
  shelter_phone?: string;
  city_name: string;
}

// 搜尋參數介面
export interface ShelterAnimalSearchParams {
  city_code?: string;
  shelter_id?: string;
  animal_type?: string;
  breed?: string;
  gender?: string;
  size?: string;
  age_category?: string;
  is_neutered?: boolean;
  status?: string;
  limit?: number;
  offset?: number;
}

// 搜尋結果介面
export interface ShelterAnimalSearchResult {
  id: string;
  serial_number: string;
  animal_type: string;
  breed?: string;
  gender?: string;
  size?: string;
  color?: string;
  age_category?: string;
  is_neutered: boolean;
  image_url?: string;
  shelter_name: string;
  city_name: string;
  adoption_start_date?: string;
  notes?: string;
}

// 統計資料介面
export interface ShelterStatistics {
  total_animals: number;
  by_city: Array<{
    city_name: string;
    count: number;
  }>;
  by_type: Array<{
    animal_type: string;
    count: number;
  }>;
  by_shelter: Array<{
    shelter_name: string;
    city_name: string;
    count: number;
  }>;
}

// 動物類型枚舉
export enum AnimalType {
  DOG = '狗',
  CAT = '貓'
}

// 動物性別枚舉
export enum AnimalGender {
  MALE = 'M',
  FEMALE = 'F'
}

// 動物體型枚舉
export enum AnimalSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  BIG = 'BIG'
}

// 動物年齡類別枚舉
export enum AnimalAgeCategory {
  CHILD = 'CHILD',
  ADULT = 'ADULT'
}

// 動物狀態枚舉
export enum AnimalStatus {
  OPEN = 'OPEN',
  ADOPTED = 'ADOPTED',
  RESERVED = 'RESERVED'
}

// 城市代碼枚舉
export enum CityCode {
  TAIPEI = '2',
  NEW_TAIPEI = '3',
  KEELUNG = '4'
}

// API 回應包裝器
export interface ApiResponse<T> {
  data: T;
  error?: string;
  count?: number;
}

// 分頁參數
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 排序參數
export interface SortParams {
  field: keyof ShelterAnimal;
  order: 'asc' | 'desc';
}

// 篩選器參數（用於前端篩選）
export interface FilterParams extends ShelterAnimalSearchParams {
  search?: string; // 全文搜尋
  dateRange?: {
    start: string;
    end: string;
  };
}

// Supabase 查詢選項
export interface SupabaseQueryOptions {
  select?: string;
  order?: { column: string; ascending: boolean };
  range?: { from: number; to: number };
  filters?: Record<string, any>;
}
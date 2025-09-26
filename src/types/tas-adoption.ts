// TAS浪愛滿屋推廣動物認養計畫的型別定義

export interface TASAdoptionCenter {
  id: number;
  區域: string;
  合作機構名稱: string;
  地址: string;
  電話?: string;
  行動電話?: string;
}

export interface TASAdoptionCenterSearchParams {
  區域?: string;
  合作機構名稱?: string;
  limit?: number;
  offset?: number;
}

export interface TASAdoptionCenterResponse {
  data: TASAdoptionCenter[];
  count: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

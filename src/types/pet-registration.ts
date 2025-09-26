// 寵物登記站類型定義

export interface PetRegistration {
  _id: number;
  縣市: string;
  動物醫院名稱: string;
  地址: string;
  電話: string;
  負責人: string;
  _importdate?: {
    date: string;
    timezone_type: number;
    timezone: string;
  };
}

export interface PetRegistrationSearchParams {
  q?: string; // 關鍵字搜尋
  縣市?: string;
  動物醫院名稱?: string;
  limit?: number;
  offset?: number;
}

export interface PetRegistrationResponse {
  success: boolean;
  result: PetRegistration[];
  count: number;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  count: number;
}

// 台北市行政區
export const TAIPEI_DISTRICTS = [
  '中正區', '大同區', '中山區', '松山區', '大安區', '萬華區',
  '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'
] as const;
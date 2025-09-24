// 臺北市動物醫院資訊類型定義

export interface VeterinaryHospital {
  _id: number;
  縣市: string;
  動物醫院名稱: string;
  地址: string;
  電話: string;
  負責人: string;
}

export interface VeterinaryHospitalSearchParams {
  q?: string;        // 關鍵字查詢
  limit?: number;    // 筆數上限(1000)
  offset?: number;   // 位移筆數
}

export interface VeterinaryHospitalResponse {
  success: boolean;
  result: {
    limit: number;
    offset: number;
    count: number;
    sort: string;
    results: VeterinaryHospital[];
  };
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  count?: number;
}
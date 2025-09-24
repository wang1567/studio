// 寵物專區類型定義

export interface PetService {
  id: number;
  縣市: string;
  行政區: string;
  郵遞區號: string;
  特寵業字號及有效期限: string;
  許可證登記公司名: string;
  電話: string;
  地址: string;
  營業項目: string;
  評鑑等級: string;
}

export interface PetServiceSearchParams {
  q?: string;        // 關鍵字查詢
  limit?: number;    // 筆數上限(1000)
  offset?: number;   // 位移筆數
  縣市?: string;     // 縣市篩選
  行政區?: string;   // 行政區篩選
  營業項目?: string; // 營業項目篩選
  評鑑等級?: string; // 評鑑等級篩選
}

export interface PetServiceResponse {
  success: boolean;
  result: {
    limit: number;
    offset: number;
    count: number;
    sort: string;
    results: PetService[];
  };
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  count?: number;
}

// 營業項目枚舉
export const BUSINESS_TYPES = {
  '寄養': '寄養',
  '買賣': '買賣',
  '買賣寄養': '買賣、寄養'
} as const;

// 評鑑等級枚舉
export const RATING_LEVELS = {
  '特優': '特優',
  '優等': '優等',
  '甲等': '甲等',
  '乙等': '乙等',
  '丙等': '丙等',
  '新設': '新設'
} as const;

// 台北市行政區
export const TAIPEI_DISTRICTS = [
  '中正區', '大同區', '中山區', '松山區', '大安區', '萬華區',
  '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'
] as const;
# 收容所動物功能 - PawsConnect

這個功能模組為 PawsConnect 平台新增了北北基（台北、新北、基隆）地區收容所動物的瀏覽和搜尋功能。

## 📋 功能特色

### 🏠 收容所動物管理
- **多地區支援**: 涵蓋台北市、新北市、基隆市共 11 個收容所
- **即時資料**: 包含 2,337 隻動物的完整資料
- **詳細資訊**: 動物品種、性別、年齡、絕育狀況、照片等
- **智慧搜尋**: 支援多條件篩選和關鍵字搜尋

### 🔍 搜尋與篩選
- 按城市篩選（台北/新北/基隆）
- 按動物類型篩選（狗/貓）
- 按品種、性別、體型、年齡篩選
- 絕育狀況篩選
- 收容所篩選

### 📊 統計與分析
- 即時統計各地區動物數量
- 收容所動物分布分析
- 熱門品種統計
- 領養趨勢分析

## 🗄️ 資料庫結構

### 核心表格

1. **cities** - 城市資料表
   ```sql
   - id: 城市代碼 (2=台北, 3=新北, 4=基隆)
   - name: 城市名稱
   - code: 城市縮寫
   ```

2. **shelters** - 收容所資料表
   ```sql
   - id: 收容所唯一識別碼
   - code: 收容所代碼
   - name: 收容所名稱
   - city_id: 所屬城市
   - address: 地址
   - phone: 聯絡電話
   ```

3. **shelter_animals** - 收容所動物資料表
   ```sql
   - id: 動物唯一識別碼
   - serial_number: 動物流水編號
   - animal_type: 動物類型 (狗/貓)
   - breed: 品種
   - gender: 性別 (M/F)
   - size: 體型 (SMALL/MEDIUM/BIG)
   - color: 毛色
   - age_category: 年齡類別 (CHILD/ADULT)
   - is_neutered: 是否絕育
   - image_url: 照片網址
   - status: 動物狀態 (OPEN/ADOPTED/RESERVED)
   ```

### 進階功能
- **RLS (Row Level Security)**: 確保資料安全性
- **索引優化**: 提升查詢效能
- **視圖支援**: 簡化複雜查詢
- **函數封裝**: 提供便利的查詢介面

## 🚀 安裝與設定

### 1. 資料庫建立
按順序執行以下 SQL 檔案：

```bash
# 1. 建立基礎表格和函數
psql -f supabase/migrations/20250923_create_shelter_animals_system.sql

# 2. 插入收容所資料
psql -f supabase/migrations/20250923_insert_shelter_data.sql

# 3. 導入動物資料（大檔案，約 0.92MB）
psql -f supabase/migrations/20250923_import_shelter_animals_data.sql
```

### 2. 環境變數設定
在 `.env.local` 中添加 Supabase 設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 依賴套件
確保已安裝必要的套件：

```bash
npm install @supabase/supabase-js
```

## 📁 檔案結構

```
studio/
├── src/
│   ├── types/
│   │   └── shelter-animals.ts          # TypeScript 型別定義
│   ├── lib/
│   │   └── shelter-animal-service.ts   # API 服務層
│   ├── components/
│   │   └── shelter-animals/
│   │       └── ShelterAnimalSearch.tsx # 搜尋組件
│   └── app/
│       └── shelter-animals/
│           └── page.tsx                # 收容所動物頁面
├── supabase/
│   ├── migrations/
│   │   ├── 20250923_create_shelter_animals_system.sql
│   │   ├── 20250923_insert_shelter_data.sql
│   │   └── 20250923_import_shelter_animals_data.sql
│   └── convert_csv_to_sql.ps1          # CSV 轉換腳本
└── 北北基收容所資料.csv                  # 原始資料檔案
```

## 🔧 API 使用方法

### 基本搜尋
```typescript
import { ShelterAnimalService } from '@/lib/shelter-animal-service';

// 搜尋所有動物
const { data: animals } = await ShelterAnimalService.searchShelterAnimals();

// 按條件搜尋
const { data: dogs } = await ShelterAnimalService.searchShelterAnimals({
  animal_type: '狗',
  city_code: '2', // 台北市
  size: 'MEDIUM',
  limit: 20
});
```

### 獲取統計資料
```typescript
const { data: stats } = await ShelterAnimalService.getShelterStatistics();
console.log(stats.total_animals); // 總動物數量
console.log(stats.by_city);       // 按城市分布
```

### 隨機獲取動物（用於滑動功能）
```typescript
const { data: randomAnimals } = await ShelterAnimalService.getRandomShelterAnimals(10);
```

## 🎨 UI 組件使用

### 搜尋組件
```tsx
import { ShelterAnimalSearch } from '@/components/shelter-animals/ShelterAnimalSearch';

function MyPage() {
  return (
    <ShelterAnimalSearch
      showFilters={true}
      maxResults={24}
      onAnimalSelect={(animal) => {
        console.log('選擇了動物:', animal);
      }}
    />
  );
}
```

## 📊 資料來源

資料來源於台灣政府開放資料平台的收容所動物資料，包含：
- **台北市**: 1,002 隻動物
- **新北市**: 1,267 隻動物  
- **基隆市**: 68 隻動物
- **總計**: 2,337 隻動物

資料欄位包括動物基本資訊、收容所資訊、認養狀態、照片等完整資訊。

## 🔄 資料更新

### 手動更新
1. 下載最新的政府開放資料 CSV 檔案
2. 執行 `convert_csv_to_sql.ps1` 腳本轉換資料
3. 執行生成的 SQL 檔案更新資料庫

### 自動化更新（建議）
考慮設定定期任務來自動更新資料：
- 每日或每週從政府開放資料 API 獲取最新資料
- 比較差異並更新變更的記錄
- 記錄更新日誌

## 🚀 擴展功能建議

### 短期目標
1. **動物詳細頁面**: 顯示單隻動物的完整資訊
2. **收藏功能**: 讓用戶收藏感興趣的動物
3. **通知系統**: 新動物或狀態變更通知
4. **分享功能**: 分享動物資訊到社交媒體

### 長期目標
1. **全台資料**: 擴展到全台灣所有縣市
2. **AI 配對**: 基於用戶偏好智慧推薦
3. **領養追蹤**: 領養流程管理
4. **收容所管理**: 收容所端的管理介面

## 🔒 安全性考量

- **RLS 政策**: 確保一般用戶只能讀取，管理員才能修改
- **資料驗證**: 前端和後端雙重驗證
- **隱私保護**: 避免暴露敏感的收容所內部資訊
- **速率限制**: 防止 API 濫用

## 📈 效能優化

- **資料庫索引**: 為常用查詢欄位建立索引
- **分頁載入**: 避免一次載入過多資料
- **圖片優化**: 使用 CDN 和適當的圖片格式
- **快取策略**: 快取常用的統計資料和搜尋結果

## 🤝 貢獻指南

歡迎對此功能提出改進建議或貢獻程式碼：

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/shelter-animals-enhancement`)
3. 提交變更 (`git commit -am 'Add new feature'`)
4. 推送到分支 (`git push origin feature/shelter-animals-enhancement`)
5. 建立 Pull Request

## 📄 授權

此功能遵循 MIT 授權條款。資料來源為政府開放資料，使用時請遵守相關規範。

---

**PawsConnect Team** 🐾
*讓每一隻毛孩都能找到溫暖的家*
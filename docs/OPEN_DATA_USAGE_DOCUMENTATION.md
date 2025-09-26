# PawsConnect 開放資料使用文檔

## 📊 資料來源總覽

PawsConnect 系統整合了多個政府開放資料平台的資料，提供完整的寵物相關服務。本文檔詳細記錄了所使用的開放資料來源、資料格式、以及在系統中的應用功能。

---

## 🏛️ 資料平台分類

### 1. 臺北市資料大平台 (data.taipei)

#### 1.1 臺北市動物醫院一覽表
- **資料集 ID**: `01bcb5ee-7c18-41fa-86d4-4e75daee1f94`
- **資料來源**: 產業局動保處
- **資料描述**: 提供臺北市動物醫院資料
- **API 端點**: `https://data.taipei/api/v1/dataset/40d79051-1839-4d00-855f-be88f1e06caf`
- **更新頻率**: 不定期更新
- **系統應用功能**:
  - 🏥 **動物醫院頁面** (`/veterinary-hospital`)
  - 🏥 **寵物登記站功能** (`/pet-registration`)
  - 📍 **地圖導航整合** (所有 TAS 認養、寵物專區、登記站頁面的地圖功能)

#### 1.2 臺北市動物之家相關資訊
- **資料集 ID**: `62ae9017-3421-4a41-86c9-2686e345f9ce`
- **資料來源**: 產業局動保處
- **資料描述**: 臺北市動物之家地址、電話、開放時間
- **系統應用功能**:
  - 🏠 **收容所動物功能** (`/shelter-animals`)
  - 📍 **收容所地理資訊顯示**

#### 1.3 臺北市特定寵物業分區名冊
- **資料集 ID**: `b9bc6499-e5de-4f10-a340-b7788c66bc1f`
- **資料來源**: 產業局動保處
- **資料描述**: 提供臺北市特定寵物業分區名冊
- **API 端點**: `https://data.taipei/api/v1/dataset/609df33e-d8f1-4c8a-ac47-12cc5767ff03`
- **系統應用功能**:
  - 🐾 **寵物專區頁面** (`/pet-service`)
  - 🔍 **寵物服務業者搜尋**
  - 📍 **服務業者地圖導航**

#### 1.4 臺北市委託民間設置TAS浪愛滿屋推廣動物認養計畫
- **資料集 ID**: `d47a2569-178a-4992-8d70-5feb0197797f`
- **資料來源**: 產業局動保處
- **資料描述**: 臺北市動物保護處與商家團體合作送養動物之家犬貓
- **系統應用功能**:
  - 🏪 **TAS認養中心頁面** (`/tas-adoption`)
  - 📍 **認養中心地圖導航**
  - 💾 **Supabase 資料庫整合** (tas_adoption_centers 表)

#### 1.5 臺北市寵物登記站名冊
- **資料集 ID**: `a3b0ca64-9901-4e4d-8a6d-93f43326d407`
- **資料來源**: 產業局動保處
- **資料描述**: 提供臺北市寵物登記站名冊
- **系統應用功能**:
  - 📋 **寵物登記站頁面** (`/pet-registration`)
  - 🗺️ **登記站地圖導航**
  - 🔍 **按區域篩選登記站**

### 2. 政府資料開放平臺 (data.gov.tw)

#### 2.1 動物認領養
- **資料集 ID**: `85903`
- **資料來源**: 動物保護司
- **資料描述**: 全國動物收容所認領養資料
- **系統應用功能**:
  - 🐕 **收容所動物搜尋** (`/shelter-animals`)
  - 🎯 **滑卡配對功能** (`/` 首頁)
  - 💾 **Supabase 資料庫整合** (shelter_animals 表)

---

## 🗄️ 資料庫整合架構

### Supabase 資料表結構

#### 1. TAS 認養中心 (tas_adoption_centers)
```sql
CREATE TABLE tas_adoption_centers (
  id BIGSERIAL PRIMARY KEY,
  area TEXT NOT NULL,                    -- 區域
  organization_name TEXT NOT NULL,       -- 合作機構名稱
  address TEXT NOT NULL,                -- 地址
  phone TEXT,                           -- 電話
  mobile_phone TEXT,                    -- 行動電話
  is_mobile BOOLEAN DEFAULT FALSE,      -- 是否為巡迴式
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**資料來源**: 臺北市資料大平台 - TAS浪愛滿屋推廣動物認養計畫

#### 2. 收容所動物系統 (shelter_animals)
```sql
CREATE TABLE shelter_animals (
  id TEXT PRIMARY KEY,
  serial_number TEXT,                   -- 動物流水編號
  shelter_code TEXT,                    -- 收容編號
  city_code TEXT,                       -- 縣市代碼
  shelter_id TEXT,                      -- 收容所ID
  animal_type TEXT,                     -- 動物類型
  breed TEXT,                          -- 品種
  gender TEXT,                         -- 性別
  size TEXT,                           -- 體型
  color TEXT,                          -- 毛色
  age_category TEXT,                   -- 年齡分類
  is_neutered BOOLEAN,                 -- 是否絕育
  status TEXT,                         -- 狀態
  image_url TEXT,                      -- 照片URL
  adoption_start_date TIMESTAMP,       -- 開放認養開始時間
  -- ... 更多欄位
);
```
**資料來源**: 政府資料開放平臺 - 動物認領養資料 (ID: 85903)

---

## 🔧 API 端點說明

### 1. 內部 API 路由

#### 動物醫院 API
- **路徑**: `/api/veterinary-hospital`
- **代理目標**: `https://data.taipei/api/v1/dataset/40d79051-1839-4d00-855f-be88f1e06caf`
- **功能**: 提供台北市動物醫院資料
- **支援參數**: 
  - `q`: 搜尋關鍵字
  - `limit`: 資料筆數限制 (預設 1000)
  - `offset`: 資料偏移量 (預設 0)

#### 寵物專區 API
- **路徑**: `/api/pet-service`
- **代理目標**: `https://data.taipei/api/v1/dataset/609df33e-d8f1-4c8a-ac47-12cc5767ff03`
- **功能**: 提供台北市特定寵物業資料
- **支援參數**: 同動物醫院 API

#### 寵物登記站 API
- **路徑**: `/api/pet-registration`
- **代理目標**: `https://data.taipei/api/v1/dataset/40d79051-1839-4d00-855f-be88f1e06caf`
- **功能**: 提供寵物登記站資料 (複用動物醫院資料)
- **支援參數**: 
  - 基本參數同上
  - `縣市`: 縣市篩選
  - `編號`: 特定編號查詢

### 2. Supabase RPC 函數

#### TAS 認養中心服務
```typescript
// 取得所有認養中心
TASAdoptionService.getAllTASCenters()

// 搜尋認養中心
TASAdoptionService.searchTASCenters({
  區域: '大安區',
  合作機構名稱: '寵物店',
  limit: 20,
  offset: 0
})

// 取得可用區域
TASAdoptionService.getAvailableAreas()
```

#### 收容所動物服務
```typescript
// 搜尋收容所動物
ShelterAnimalService.searchShelterAnimals({
  city_code: '2',      // 台北市
  animal_type: '狗',
  status: 'OPEN',
  limit: 20
})

// 取得統計資料
ShelterAnimalService.getShelterStatistics()

// 隨機取得動物 (用於滑卡功能)
ShelterAnimalService.getRandomShelterAnimals(10)
```

---

## 📱 功能模組對應

### 1. 核心功能頁面

| 功能名稱 | 路徑 | 主要資料來源 | 次要資料來源 |
|---------|------|------------|------------|
| 滑卡配對 | `/` | 政府開放資料平臺 (動物認領養) | - |
| 收容所動物 | `/shelter-animals` | 政府開放資料平臺 (動物認領養) | 臺北市資料大平台 (動物之家資訊) |
| TAS認養中心 | `/tas-adoption` | 臺北市資料大平台 (TAS浪愛滿屋) | 臺北市資料大平台 (動物醫院) |
| 動物醫院 | `/veterinary-hospital` | 臺北市資料大平台 (動物醫院) | - |
| 寵物專區 | `/pet-service` | 臺北市資料大平台 (特定寵物業) | 臺北市資料大平台 (動物醫院) |
| 寵物登記站 | `/pet-registration` | 臺北市資料大平台 (寵物登記站) | 臺北市資料大平台 (動物醫院) |

### 2. 地圖導航整合

所有功能頁面都整合了 **Google Maps JavaScript API**，提供：
- 🗺️ **地圖檢視**: 顯示服務據點位置
- 🧭 **導航功能**: 支援 Google Maps、Apple Maps 導航
- 📱 **設備偵測**: 自動選擇適合的導航應用程式
- 🔍 **地點搜尋**: 結合開放資料進行地理位置查詢

---

## 📊 資料統計

### 收容所動物資料統計
- **台北市**: 1,002 隻動物
- **新北市**: 1,267 隻動物  
- **基隆市**: 68 隻動物
- **總計**: 2,337 隻動物

### TAS 認養中心統計
- **涵蓋區域**: 台北市 12 個行政區
- **合作機構**: 寵物店、動物醫院、其他商業機構
- **服務類型**: 固定據點 + 巡迴式服務

### 寵物服務業者統計
- **動物醫院**: 約 1000+ 家 (台北市)
- **特定寵物業**: 依照營業項目分類
- **寵物登記站**: 分布於各行政區

---

## 🔄 資料更新機制

### 1. 即時資料 (Real-time)
- **動物醫院資料**: 透過 API 代理即時查詢台北市資料大平台
- **寵物專區資料**: 透過 API 代理即時查詢台北市資料大平台
- **寵物登記站資料**: 透過 API 代理即時查詢台北市資料大平台

### 2. 定期同步資料 (Periodic Sync)
- **TAS 認養中心**: 手動匯入並儲存於 Supabase
- **收容所動物資料**: 從政府開放資料平臺匯入並定期更新

### 3. 資料快取策略
- **前端快取**: 使用 Next.js 內建快取機制
- **API 快取**: 適當的 HTTP 快取標頭設定
- **資料庫查詢最佳化**: 適當的索引和查詢最佳化

---

## 🛡️ 資料品質保證

### 1. 資料驗證
- **型別檢查**: 使用 TypeScript 進行嚴格型別檢查
- **資料格式驗證**: API 回應格式驗證
- **錯誤處理**: 完善的錯誤處理和使用者友善的錯誤訊息

### 2. 資料清理
- **地址標準化**: 地址格式統一處理
- **電話號碼格式化**: 統一電話號碼格式
- **重複資料處理**: 避免重複資料造成的問題

### 3. 效能最佳化
- **分頁查詢**: 大量資料採用分頁機制
- **索引最佳化**: 資料庫查詢索引最佳化
- **快取機制**: 多層次快取策略

---

## 📝 使用授權和聲明

### 資料使用聲明
本系統使用的所有開放資料均來自政府官方平台，遵循各平台的使用條款和授權聲明：

1. **臺北市資料大平台**: 遵循臺北市政府開放資料使用條款
2. **政府資料開放平臺**: 遵循中華民國政府資料開放授權條款

### 資料正確性聲明
- 資料來源為政府官方平台，系統不對資料正確性負責
- 如資料有誤，請向原始資料提供機關反映
- 系統提供的資料僅供參考，實際情況請以官方公告為準

### 隱私保護
- 系統不收集使用者個人資料
- 地理位置資訊僅用於導航功能，不予儲存
- 遵循相關隱私保護法規

---

## 📞 技術支援和聯絡資訊

### 開放資料相關問題
- **臺北市資料大平台**: [data.taipei](https://data.taipei/)
- **政府資料開放平臺**: [data.gov.tw](https://data.gov.tw/)

### 系統技術問題
- **專案 GitHub**: [PawsConnect Repository]
- **技術文件**: 詳見 `/docs` 目錄其他文檔

---

*本文檔最後更新: 2025年9月25日*
*PawsConnect 開發團隊製作*

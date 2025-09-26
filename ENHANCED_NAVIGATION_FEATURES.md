# 增強導航功能整合說明

本文件說明為 TAS浪愛滿屋推廣動物認養計畫、寵物專區、臺北市寵物登記站 三個功能新增的地圖與導航功能。

## 🎯 功能概覽

### 新增功能
1. **列表檢視與地圖檢視切換** - 使用 Tabs 組件提供雙重瀏覽體驗
2. **Google Maps 地圖顯示** - 在地圖上標示所有相關機構位置
3. **一鍵導航功能** - 智能設備檢測，優化導航體驗

### 涵蓋頁面
- `/tas-adoption` - TAS浪愛滿屋推廣動物認養計畫
- `/pet-service` - 寵物專區（特殊寵物業者資訊）
- `/pet-registration` - 臺北市寵物登記站

## 🔧 技術實現

### 1. 組件架構升級

#### TAS 浪愛滿屋推廣動物認養計畫
- **檔案**: `src/components/tas-adoption/TASAdoptionSearch.tsx`
- **新增導入**: `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`, `GoogleMapsComponent`, `Map`, `Navigation`
- **導航按鈕顏色**: 藍色漸層 (`from-blue-500 to-blue-600`)

#### 寵物專區
- **檔案**: `src/components/pet-service/PetServiceSearch.tsx`
- **新增導入**: `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`, `GoogleMapsComponent`, `Map`, `Navigation`
- **導航按鈕顏色**: 綠色漸層 (`from-green-500 to-green-600`)

#### 臺北市寵物登記站
- **檔案**: `src/components/pet-registration/PetRegistrationSearch.tsx`
- **新增導入**: `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`, `GoogleMapsComponent`, `Map`, `Navigation`
- **導航按鈕顏色**: 紫色漸層 (`from-purple-500 to-purple-600`)

### 2. 數據轉換

為了整合現有的 `GoogleMapsComponent`，我們將各功能的數據格式統一轉換為 `VeterinaryHospital` 類型：

#### TAS 認養中心數據轉換
```typescript
centers.map(center => ({
  _id: parseInt(center.id.toString()),
  縣市: center.區域,
  動物醫院名稱: center.合作機構名稱,
  地址: center.地址,
  電話: center.電話 || center.行動電話 || '',
  負責人: center.區域
}))
```

#### 寵物服務業者數據轉換
```typescript
petServices.map((service, index) => ({
  _id: service.id || index + 1,
  縣市: service.縣市,
  動物醫院名稱: service.許可證登記公司名,
  地址: service.地址,
  電話: service.電話 || '',
  負責人: service.評鑑等級
}))
```

#### 寵物登記站數據轉換
```typescript
petRegistrations.map((station, index) => ({
  _id: typeof station._id === 'string' ? parseInt(station._id) || index + 1 : station._id,
  縣市: station.縣市,
  動物醫院名稱: station.動物醫院名稱,
  地址: station.地址,
  電話: station.電話 || '',
  負責人: station.負責人 || ''
}))
```

### 3. 導航功能實現

#### 智能設備檢測
```javascript
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
```

#### 一鍵導航邏輯
- **行動設備**: 優先嘗試開啟 Google Maps App，2秒後自動開啟網頁版作為備案
- **桌面設備**: 直接開啟 Google Maps 網頁版

#### 導航 URL 格式
- **App 連結**: `comgooglemaps://?daddr=${destination}&directionsmode=driving`
- **網頁連結**: `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`

## 🎨 用戶體驗設計

### 雙檢視模式
- **列表檢視**: 傳統卡片式布局，每個卡片包含導航按鈕
- **地圖檢視**: 整合 Google Maps，可在地圖上查看所有機構位置

### 視覺差異化
- **TAS 認養中心**: 藍色主題，強調愛心與關懷
- **寵物專區**: 綠色主題，代表專業服務
- **寵物登記站**: 紫色主題，體現政府服務

### 響應式設計
- **地圖高度**: 
  - 手機: `h-96` (384px)
  - 平板: `md:h-[500px]` (500px)
  - 桌面: `lg:h-[600px]` (600px)

## 🛠️ 技術依賴

### 現有組件重用
- `GoogleMapsComponent` - 完整地圖功能（已具備一鍵導航）
- `Tabs` 系列組件 - 檢視模式切換
- `Button`, `Card` 等 UI 組件

### Google Maps API
- 需要有效的 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- 使用現有的地圖載入和導航邏輯

## 📱 功能特色

### 1. 統一的導航體驗
所有三個功能都提供一致的導航體驗，但保持各自的視覺特色。

### 2. 無需位置權限
導航功能不需要獲取用戶位置權限，直接開啟到目的地的導航。

### 3. 跨平台兼容
智能檢測用戶設備，在行動設備上優先使用原生 Google Maps App。

### 4. 地圖整合
重用動物醫院功能的完整地圖系統，包含標記、資訊窗口和導航功能。

## 🔄 升級路徑

### 從舊版本升級
1. 更新三個組件文件
2. 確保 Google Maps API 金鑰已配置
3. 確認 shadcn/ui Tabs 組件可用

### 測試檢查清單
- [ ] 列表檢視正常顯示
- [ ] 地圖檢視載入正確
- [ ] Tab 切換功能正常
- [ ] 一鍵導航在行動設備上正常運作
- [ ] 一鍵導航在桌面設備上正常運作
- [ ] 地圖標記顯示完整資訊
- [ ] 響應式布局在不同螢幕尺寸下正常

## 📝 使用說明

### 用戶操作流程
1. **瀏覽機構** - 在列表檢視中瀏覽所有相關機構
2. **查看位置** - 切換到地圖檢視查看地理位置
3. **一鍵導航** - 點擊導航按鈕開啟 Google Maps 導航

### 注意事項
- 導航功能需要網路連接
- 在行動設備上，如果未安裝 Google Maps App，將自動開啟網頁版
- 地圖載入需要有效的 Google Maps API 金鑰

---

**更新日期**: 2025年9月24日  
**版本**: 1.0.0  
**相關文件**: `ONE_CLICK_NAVIGATION_GUIDE.md`, `GOOGLE_MAPS_SETUP.md`
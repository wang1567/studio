# Google Maps API 費用控制建議

## 🛡️ 免費使用策略

### 1. 設定配額限制
在 Google Cloud Console 中：
- 前往「API 和服務」→「配額」
- 為每個 API 設定每日使用限制
- 建議設定為免費額度的 80%（避免意外超額）

### 2. 程式碼優化建議

#### A. 快取地理編碼結果
```typescript
// 在本地儲存已轉換的座標，避免重複 Geocoding API 呼叫
const geocacheKey = `geocode_${hospitalAddress}`;
const cachedCoords = localStorage.getItem(geocacheKey);
if (cachedCoords) {
  // 使用快取的座標
} else {
  // 呼叫 Geocoding API 並儲存結果
}
```

#### B. 批次處理標記
```typescript
// 一次載入所有醫院標記，而非逐一載入
const bounds = new google.maps.LatLngBounds();
hospitals.forEach(hospital => {
  // 添加標記到地圖
  bounds.extend(marker.getPosition());
});
map.fitBounds(bounds); // 只調整一次地圖視角
```

#### C. 延遲載入
```typescript
// 只有當用戶點擊「地圖檢視」時才載入 Google Maps
const [shouldLoadMap, setShouldLoadMap] = useState(false);

const onTabChange = (value: string) => {
  if (value === 'map' && !shouldLoadMap) {
    setShouldLoadMap(true);
  }
};
```

### 3. 監控使用量
- 定期檢查 Google Cloud Console 中的 API 使用統計
- 設定警示，當使用量接近免費額度時收到通知
- 分析使用模式，優化高頻呼叫

### 4. 替代方案（如果需要）
- **OpenStreetMap + Leaflet**: 完全免費的開源地圖解決方案
- **Mapbox**: 有競爭力的免費額度和定價
- **Azure Maps**: Microsoft 的地圖服務

## 📊 使用量估算工具

### 當前專案預估
- **預期日用戶**: _____ 人
- **平均地圖檢視次數**: _____ 次/用戶
- **每月預估載入**: _____ 次
- **免費額度使用率**: _____%

### 建議的配額設定
- **Maps JavaScript API**: 800 次/日 (約 24,000 次/月)
- **Geocoding API**: 100 次/日 (保留緩衝)
- **Directions API**: 100 次/日

## 💡 實際建議

### 對於您的寵物服務專案：
1. **免費額度足夠**: 除非是超大型應用，否則免費額度通常足夠
2. **成本可控**: 即使超過免費額度，費用也相對合理
3. **用戶體驗價值**: 地圖功能大幅提升用戶體驗，值得投資
4. **漸進式啟用**: 可以先啟用基本功能，根據使用情況再擴展

### 立即行動建議：
1. ✅ 先用免費額度測試和開發
2. ✅ 設定帳單警示和配額限制
3. ✅ 實施程式碼層面的優化
4. 📊 監控實際使用情況再決定是否需要付費計劃
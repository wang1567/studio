# 快速設定 Google Maps API 金鑰

## 🚀 快速開始（5 分鐘設定）

### 第一步：前往 Google Cloud Console
1. 開啟瀏覽器，前往 [Google Cloud Console](https://console.developers.google.com/)
2. 使用您的 Google 帳號登入

### 第二步：建立專案（如果還沒有的話）
1. 點擊右上角的「選擇專案」
2. 點擊「新增專案」
3. 輸入專案名稱（例如：`my-pet-app`）
4. 點擊「建立」

### 第三步：啟用 Google Maps API
1. 在左側導航中點擊「API 和服務」→「程式庫」
2. 搜尋並啟用以下 API：
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
   - **Directions API**

### 第四步：建立 API 金鑰
1. 在左側導航中點擊「API 和服務」→「憑證」
2. 點擊「+ 建立憑證」→「API 金鑰」
3. 複製產生的 API 金鑰

### 第五步：設定環境變數
1. 開啟 `studio/.env.local` 檔案
2. 找到這一行：
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
   ```
3. 替換為您的實際 API 金鑰：
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...您的金鑰...
   ```

### 第六步：重新啟動伺服器
```bash
# 停止目前的伺服器 (Ctrl+C)
# 然後重新啟動
npm run dev
```

## ⚠️ 重要提醒

### 免費配額
Google Maps API 每個月有免費配額：
- **Maps JavaScript API**: 28,000 次載入/月
- **Geocoding API**: 40,000 次要求/月
- **Directions API**: 40,000 次要求/月

對於開發和測試來說，這個配額通常已經足夠。

### API 金鑰安全
建議在生產環境中：
1. 限制 API 金鑰的使用範圍（只允許特定網域）
2. 限制 API 金鑰可存取的服務
3. 定期輪換 API 金鑰

## 🔍 故障排除

### 問題：API 金鑰無效
**錯誤訊息**: `InvalidKeyMapError`
**解決方案**:
1. 確認 API 金鑰已正確複製到 .env.local
2. 確認已啟用 Maps JavaScript API
3. 重新啟動開發伺服器

### 問題：重複載入 API
**錯誤訊息**: `You have included the Google Maps JavaScript API multiple times`
**解決方案**:
1. 重新整理瀏覽器頁面
2. 確認只有在地圖標籤頁面才載入 API
3. 檢查是否有其他地方也載入了 Google Maps

### 問題：地圖顯示為灰色
**原因**: API 金鑰權限不足或配額用盡
**解決方案**:
1. 檢查 Google Cloud Console 中的配額使用情況
2. 確認已啟用所有必要的 API
3. 檢查瀏覽器控制台的錯誤訊息

## 💡 測試步驟

設定完成後，請按照以下步驟測試：

1. **前往動物醫院頁面**
   ```
   http://localhost:3000/veterinary-hospital
   ```

2. **點擊「地圖檢視」標籤**
   - 應該看到載入中的提示
   - 然後顯示台北市的地圖

3. **測試定位功能**
   - 點擊「定位」按鈕
   - 允許瀏覽器存取位置
   - 地圖應該移動到您的位置

4. **測試醫院標記**
   - 地圖上應該顯示紅色標記
   - 點擊標記應該顯示醫院資訊
   - 如果有定位，應該看到導航按鈕

## 📞 需要協助？

如果遇到任何問題，請：
1. 檢查瀏覽器控制台的錯誤訊息
2. 確認 .env.local 檔案設定正確
3. 重新啟動開發伺服器
4. 檢查 Google Cloud Console 中的 API 使用狀況
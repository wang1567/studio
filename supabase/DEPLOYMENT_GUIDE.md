# 收容所動物系統部署指南

## 🚨 錯誤修復說明

在部署過程中如果遇到角色枚舉錯誤：
```
ERROR: 22P02: invalid input value for enum user_role_enum: "admin"
```

這表示現有的資料庫角色枚舉中沒有 `admin` 值。我們已經修正了 SQL 腳本來避免這個問題。

## 📝 部署步驟

### 第一步：執行主要系統建立腳本
```sql
-- 執行修正後的系統建立腳本
\i 20250923_create_shelter_animals_system.sql
```

### 第二步：執行收容所基礎資料插入
```sql
-- 插入收容所資料
\i 20250923_insert_shelter_data.sql
```

### 第三步：執行動物資料導入
```sql
-- 導入動物資料（大檔案，需要一些時間）
\i 20250923_import_shelter_animals_data.sql
```

### 第四步：執行測試驗證
```sql
-- 驗證系統是否正確建立
\i 20250923_test_shelter_system.sql
```

## 🔒 權限設定說明

目前的 RLS 政策設定為：
- ✅ **讀取權限**：所有用戶都可以讀取收容所和動物資料
- ❌ **寫入權限**：暫時禁用所有用戶的寫入權限

### 如需啟用寫入權限：

1. **首先查詢現有的角色枚舉值**：
```sql
SELECT unnest(enum_range(NULL::user_role_enum)) as role_value;
```

2. **根據結果選擇適當的方案**：

#### 方案 A：如果已有管理員角色
如果查詢結果包含類似 `manager`, `admin`, 或 `shelter_admin` 的角色，執行：
```sql
-- 修改 20250923_fix_rls_policies.sql 中對應的方案
```

#### 方案 B：添加新的管理員角色
```sql
ALTER TYPE user_role_enum ADD VALUE 'admin';
-- 然後執行 fix_rls_policies.sql 中的方案二
```

#### 方案 C：保持唯讀模式（推薦）
收容所資料通常不需要頻繁修改，建議：
- 保持現有的唯讀權限
- 透過管理腳本進行批次更新
- 確保資料一致性和完整性

## 🧪 測試查詢

部署完成後，可以執行以下查詢來測試功能：

```sql
-- 測試搜尋功能
SELECT * FROM search_shelter_animals(
    p_city_code := '2',
    p_animal_type := '狗',
    p_limit := 10
);

-- 測試統計功能
SELECT get_shelter_statistics();

-- 測試視圖查詢
SELECT 
    animal_type,
    COUNT(*) as count
FROM shelter_animals_with_details 
WHERE status = 'OPEN'
GROUP BY animal_type;
```

## 📊 預期結果

成功部署後應該看到：
- ✅ 3 個城市（台北、新北、基隆）
- ✅ 11 個收容所
- ✅ 2,337 隻動物資料
- ✅ 完整的搜尋和統計功能

## 🔧 故障排除

### 常見問題

1. **權限錯誤**
   - 確保以具有 CREATEDB 權限的用戶執行
   - 檢查 Supabase 服務角色權限

2. **資料重複錯誤**
   - 腳本使用 `ON CONFLICT` 處理重複資料
   - 可以安全地重複執行

3. **記憶體不足**
   - 動物資料檔案較大（~1MB）
   - 可能需要調整 PostgreSQL 記憶體設定

4. **連線逾時**
   - 導入可能需要數分鐘時間
   - 建議在穩定的網路環境下執行

## 📞 技術支援

如果遇到其他問題，請檢查：
1. PostgreSQL 版本是否支援所需功能
2. Supabase 專案設定是否正確
3. 網路連線是否穩定
4. 資料庫儲存空間是否充足

## 📈 後續擴展

系統建立後可以考慮：
1. 定期更新動物資料
2. 添加更多城市和收容所
3. 整合通知系統
4. 建立管理後台
# 收容所動物管理系統 - 資料庫部署指南

## 📋 執行順序（必須嚴格遵守！）

### 步驟 1：建立系統架構
執行檔案：`20250923_create_shelter_animals_system.sql`

**功能說明：**
- 建立 cities、shelters、shelter_animals 三個核心資料表
- 設定 RLS (Row Level Security) 安全政策
- 建立查詢索引和效能優化
- 插入基本的縣市資料（台北市、新北市、基隆市）
- 建立搜尋和統計函數

**預期結果：**
```sql
✅ 資料表建立完成
✅ 縣市資料插入完成 (3筆)
✅ 索引和函數建立完成
✅ RLS 安全政策啟用
```

---

### 步驟 2：插入收容所資料
執行檔案：`20250923_insert_shelter_data.sql`

**功能說明：**
- 插入 12 個收容所的詳細資料
- 包含收容所代碼、名稱、地址、電話
- 使用 ON CONFLICT 避免重複插入

**預期結果：**
```sql
✅ 收容所資料插入完成 (12筆)
  - 台北市：1個收容所
  - 新北市：10個收容所  
  - 基隆市：1個收容所
```

**重要收容所代碼：**
- 48: 基隆市寵物銀行
- 49: 臺北市動物之家
- 50, 55: 新北市淡水區公立動物之家 (不同地址)
- 51: 新北市新店區公立動物之家
- 52: 新北市板橋區公立動物之家
- 53: 新北市中和區公立動物之家
- 54: 新北市三芝區公立動物之家
- 56, 57: 新北市瑞芳區公立動物之家 (不同地址)
- 58: 新北市五股區公立動物之家
- 59: 新北市八里區公立動物之家
- 60, 92: 新北市政府動物保護防疫處

---

### 步驟 3：導入動物資料
執行檔案：`20250923_import_shelter_animals_data.sql`

**功能說明：**
- 導入 2,337 筆動物資料
- 使用動態查詢關聯收容所 ID
- 分批插入優化效能（100筆/批次）
- 包含依賴性檢查，確保收容所資料已存在

**預期結果：**
```sql
✅ 動物資料導入完成 (2,337筆)
✅ 所有外鍵關聯正確建立
✅ 資料完整性驗證通過
```

**資料分佈：**
- 台北市：1,002 隻動物
- 新北市：1,267 隻動物
- 基隆市：68 隻動物

---

## 🚨 常見錯誤處理

### 錯誤 1：null value in column "shelter_id"
```
ERROR: 23502: null value in column "shelter_id" of relation "shelter_animals" violates not-null constraint
```

**原因：** 收容所資料尚未插入，動物資料找不到對應的收容所 ID

**解決方案：**
1. 確認已完成步驟 2（插入收容所資料）
2. 檢查收容所資料是否正確插入：
   ```sql
   SELECT code, name FROM public.shelters ORDER BY code;
   ```
3. 重新執行步驟 3（動物資料導入）

### 錯誤 2：invalid input value for enum user_role_enum
```
ERROR: invalid input value for enum user_role_enum: "admin"
```

**原因：** RLS 政策中引用了不存在的用戶角色

**解決方案：** 此錯誤已在最新版本修正，使用系統層級權限控制

### 錯誤 3：table "xxx" already exists
```
ERROR: relation "cities" already exists
```

**原因：** 資料表已存在，重複執行建立腳本

**解決方案：** 使用 `IF NOT EXISTS` 語法，可安全重複執行

---

## 🔍 驗證步驟

### 1. 檢查資料表建立
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cities', 'shelters', 'shelter_animals');
```

### 2. 檢查縣市資料
```sql
SELECT * FROM public.cities ORDER BY id;
```

### 3. 檢查收容所資料
```sql
SELECT code, name, city_id 
FROM public.shelters 
ORDER BY code;
```

### 4. 檢查動物資料統計
```sql
SELECT 
    c.name as city_name,
    COUNT(*) as animal_count
FROM public.shelter_animals sa
JOIN public.shelters s ON sa.shelter_id = s.id
JOIN public.cities c ON s.city_id = c.id
GROUP BY c.name
ORDER BY animal_count DESC;
```

### 5. 測試搜尋功能
```sql
SELECT * FROM public.search_shelter_animals(
    p_city_code => '2',
    p_animal_type => '狗',
    p_limit => 10
);
```

---

## 📊 預期最終結果

執行完成後，你的資料庫應該包含：

| 資料表 | 記錄數 | 說明 |
|--------|--------|------|
| cities | 3 | 台北市、新北市、基隆市 |
| shelters | 12 | 北北基地區收容所 |
| shelter_animals | 2,337 | 待領養動物資料 |

**系統功能：**
- ✅ 多維度動物搜尋
- ✅ 收容所統計分析
- ✅ 資料安全權限控制
- ✅ 高效能查詢索引
- ✅ 完整的資料完整性檢查

---

## 🎯 後續開發

資料庫部署完成後，可以：
1. 整合前端搜尋組件到 PawsConnect 平台
2. 設定定期資料更新機制
3. 開發進階功能（動物詳情頁、收藏夾等）
4. 整合地圖顯示功能
5. 建立認養申請流程

---

## 📞 技術支援

如遇到問題，請檢查：
1. 執行順序是否正確
2. 資料庫連線是否正常
3. 權限設定是否適當
4. 參考本文件的錯誤處理章節

**系統版本：** v1.0.0  
**更新日期：** 2025年9月23日  
**相容性：** Supabase PostgreSQL 15+
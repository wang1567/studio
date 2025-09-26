# 🔧 Supabase 修復指南

## 🚨 問題診斷

基於您的資料庫結構和 Supabase 設定，發現以下問題：

### 1. **認證 URL 設定錯誤**
- 目前設定：`https://rjj1tw0-5173.asse.devtunnels.ms`
- 應該改為：`https://studio-chi-seven-94.vercel.app`

### 2. **RLS 權限問題**
匿名用戶可以讀取資料，但登入用戶不行，表示 RLS 政策設定有問題。

## 🛠️ 修復步驟

### 第一步：修正 Supabase Authentication URL

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的專案 (`sb1-xakraxlh`)
3. 點選 **Authentication** → **URL Configuration**
4. 將 **Site URL** 改為：
   ```
   https://studio-chi-seven-94.vercel.app
   ```
5. 在 **Redirect URLs** 中新增：
   ```
   https://studio-chi-seven-94.vercel.app/auth/callback
   https://studio-chi-seven-94.vercel.app/auth/confirm
   https://studio-chi-seven-94.vercel.app/*
   ```

### 第二步：修正 RLS 政策

前往 **SQL Editor**，執行以下 SQL：

```sql
-- 1. 設定 tas_adoption_centers 權限
ALTER TABLE public.tas_adoption_centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to tas_adoption_centers" ON public.tas_adoption_centers;
CREATE POLICY "Allow read access to tas_adoption_centers" ON public.tas_adoption_centers
    FOR SELECT USING (true);

-- 2. 設定 shelter_animals 權限  
ALTER TABLE public.shelter_animals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to shelter_animals" ON public.shelter_animals;
CREATE POLICY "Allow read access to shelter_animals" ON public.shelter_animals
    FOR SELECT USING (true);

-- 3. 設定 shelters 權限
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to shelters" ON public.shelters;
CREATE POLICY "Allow read access to shelters" ON public.shelters
    FOR SELECT USING (true);

-- 4. 設定 cities 權限
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to cities" ON public.cities;
CREATE POLICY "Allow read access to cities" ON public.cities
    FOR SELECT USING (true);

-- 5. 設定 pets 權限（用於滑卡配對）
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to pets" ON public.pets;
CREATE POLICY "Allow read access to pets" ON public.pets
    FOR SELECT USING (true);

-- 6. 允許登入用戶管理自己的 pets
DROP POLICY IF EXISTS "Users can manage own pets" ON public.pets;
CREATE POLICY "Users can manage own pets" ON public.pets
    FOR ALL USING (auth.uid() = user_id);

-- 7. 設定 user_dog_likes 權限（滑卡配對功能）
ALTER TABLE public.user_dog_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own likes" ON public.user_dog_likes;
CREATE POLICY "Users can manage own likes" ON public.user_dog_likes
    FOR ALL USING (auth.uid() = user_id);

-- 8. 設定 profiles 權限
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to profiles" ON public.profiles;
CREATE POLICY "Allow read access to profiles" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);
```

### 第三步：測試修復結果

1. 訪問測試頁面：[https://studio-chi-seven-94.vercel.app/simple-test](https://studio-chi-seven-94.vercel.app/simple-test)
2. 點擊「執行基本測試」
3. 點擊「登出後測試」
4. 比較結果，應該都會成功

### 第四步：測試實際頁面

修復完成後，測試這些頁面：
- [收容所動物](https://studio-chi-seven-94.vercel.app/shelter-animals)
- [TAS認養中心](https://studio-chi-seven-94.vercel.app/tas-adoption)
- [滑卡配對](https://studio-chi-seven-94.vercel.app/matches)

## 🎯 為什麼會有這個問題？

1. **URL 不匹配**：Supabase 認證系統會檢查請求來源
2. **RLS 預設拒絕**：當啟用 RLS 但沒有適當政策時，會拒絕所有請求
3. **匿名 vs 認證用戶**：不同的認證狀態觸發不同的權限檢查

修復後，所有用戶（不論是否登入）都應該能正常瀏覽這些頁面！
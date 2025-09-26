-- 收容所動物系統測試腳本
-- 用於驗證基本功能是否正常工作

-- 測試 1：檢查表格是否正確創建
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('cities', 'shelters', 'shelter_animals')
ORDER BY table_name;

-- 測試 2：檢查城市資料是否正確插入
SELECT * FROM public.cities ORDER BY id;

-- 測試 3：檢查索引是否創建
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN ('cities', 'shelters', 'shelter_animals')
ORDER BY tablename, indexname;

-- 測試 4：檢查視圖是否存在
SELECT 
    table_name,
    table_type
FROM information_schema.views 
WHERE table_schema = 'public' 
    AND table_name = 'shelter_animals_with_details';

-- 測試 5：檢查函數是否創建
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_name IN ('search_shelter_animals', 'get_shelter_statistics');

-- 測試 6：檢查 RLS 是否啟用
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('cities', 'shelters', 'shelter_animals');

-- 測試 7：檢查 RLS 政策
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('cities', 'shelters', 'shelter_animals')
ORDER BY tablename, policyname;
-- 北北基收容所動物資料導入腳本
-- 此腳本用於將 CSV 資料導入到 Supabase 資料庫
-- 執行前請確保已經先執行 20250923_create_shelter_animals_system.sql

-- 首先插入收容所資料（從 CSV 中提取的唯一收容所）
INSERT INTO public.shelters (code, name, city_id, address, phone) VALUES

-- 台北市收容所
('49', '臺北市動物之家', '2', '臺北市內湖區安美街191號', '02-87913254'),

-- 新北市收容所
('53', '新北市中和區公立動物之家', '3', '新北市中和區興南路三段100號', '02-86685547'),
('52', '新北市板橋區公立動物之家', '3', '新北市板橋區板城路28-2號', '02-29596353'),
('51', '新北市新店區公立動物之家', '3', '新北市新店區小城里民族路238號', '02-22159730'),
('58', '新北市五股區公立動物之家', '3', '新北市五股區新五路二段169號', '02-89742281'),
('59', '新北市八里區公立動物之家', '3', '新北市八里區長坑里6鄰長坑道路36號', '02-26194428'),
('50', '新北市淡水區公立動物之家', '3', '新北市淡水區下圭柔里2鄰中正東路二段145號', '02-26203106'),
('55', '新北市淡水區公立動物之家', '3', '新北市淡水區下圭柔山91之3號', '02-26267558'),
('57', '新北市瑞芳區公立動物之家', '3', '新北市瑞芳區龍安里大埔路100-1號', '02-24062158'),
('56', '新北市瑞芳區公立動物之家', '3', '新北市瑞芳區靜安路四段(106縣道74.5K清潔隊場區內)', '02-24063481'),
('54', '新北市三芝區公立動物之家', '3', '新北市三芝區圓山里二坪頂69號', '02-26362444'),
('60', '新北市政府動物保護防疫處', '3', '新北市板橋區四川路一段157巷2號', '02-29596353'),
('92', '新北市政府動物保護防疫處', '3', '新北市板橋區四川路一段157巷2號', '02-29596353'),

-- 基隆市收容所
('48', '基隆市寵物銀行', '4', '基隆市七堵區大華三路45-12號(欣欣安樂園旁)', '02-24560148')

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    updated_at = now();

-- 注意：由於資料量龐大(2337筆)，建議分批導入
-- 以下提供示例導入語法，實際執行時需要處理完整的 CSV 資料

-- 示例：插入動物資料的模板
-- INSERT INTO public.shelter_animals (
--     serial_number,
--     shelter_code,
--     city_code,
--     shelter_id,
--     current_location,
--     animal_type,
--     breed,
--     gender,
--     size,
--     color,
--     age_category,
--     is_neutered,
--     rabies_vaccinated,
--     found_location,
--     web_title,
--     status,
--     notes,
--     other_info,
--     adoption_start_date,
--     adoption_end_date,
--     data_updated_at,
--     data_created_at,
--     image_url,
--     last_modified_at,
--     system_updated_at
-- ) VALUES (
--     -- 這裡需要將 CSV 的每一行轉換為對應的值
-- );

-- 提供 CSV 資料轉換的參考對應關係：
/*
CSV 欄位 -> 資料庫欄位
動物的流水編號 -> serial_number
動物的收容編號 -> shelter_code
動物所屬縣市代碼 -> city_code
動物所屬收容所代碼 -> 用於查找 shelter_id
動物的實際所在地 -> current_location
動物的類型 -> animal_type
動物品種 -> breed
動物性別 -> gender (M/F)
動物體型 -> size (SMALL/MEDIUM/BIG)
動物毛色 -> color
動物年紀 -> age_category (CHILD/ADULT)
是否絕育 -> is_neutered (T=true, F=false)
是否施打狂犬病疫苗 -> rabies_vaccinated (T=true, F=false)
動物尋獲地 -> found_location
動物網頁標題 -> web_title
動物狀態 -> status
資料備註 -> notes
其他說明 -> other_info
開放認養時間(起) -> adoption_start_date
開放認養時間(迄) -> adoption_end_date
動物資料異動時間 -> data_updated_at
動物資料建立時間 -> data_created_at
圖片名稱 -> image_url
異動時間 -> last_modified_at
資料更新時間 -> system_updated_at
*/
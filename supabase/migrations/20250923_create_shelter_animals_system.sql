-- 創建收容所相關表格系統
-- 作者: PawsConnect Team
-- 創建日期: 2025/09/23

-- 創建縣市資料表
CREATE TABLE IF NOT EXISTS public.cities (
    id text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    code text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now()
);

-- 創建收容所資料表
CREATE TABLE IF NOT EXISTS public.shelters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    city_id text NOT NULL REFERENCES public.cities(id),
    address text,
    phone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 創建收容所動物資料表
CREATE TABLE IF NOT EXISTS public.shelter_animals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number text NOT NULL UNIQUE, -- 動物的流水編號
    shelter_code text NOT NULL, -- 動物的收容編號
    city_code text NOT NULL REFERENCES public.cities(id),
    shelter_id uuid NOT NULL REFERENCES public.shelters(id),
    current_location text, -- 動物的實際所在地
    animal_type text NOT NULL, -- 動物的類型 (狗/貓)
    breed text, -- 動物品種
    gender text, -- 動物性別 (M/F)
    size text, -- 動物體型 (SMALL/MEDIUM/BIG)
    color text, -- 動物毛色
    age_category text, -- 動物年紀 (CHILD/ADULT)
    is_neutered boolean DEFAULT false, -- 是否絕育 (T/F)
    rabies_vaccinated boolean DEFAULT false, -- 是否施打狂犬病疫苗 (T/F)
    found_location text, -- 動物尋獲地
    web_title text, -- 動物網頁標題
    status text DEFAULT 'OPEN', -- 動物狀態
    notes text, -- 資料備註
    other_info text, -- 其他說明
    adoption_start_date date, -- 開放認養時間(起)
    adoption_end_date date, -- 開放認養時間(迄)
    data_updated_at timestamp with time zone, -- 動物資料異動時間
    data_created_at timestamp with time zone, -- 動物資料建立時間
    image_url text, -- 圖片名稱
    last_modified_at timestamp with time zone, -- 異動時間
    system_updated_at timestamp with time zone DEFAULT now(), -- 資料更新時間
    created_at timestamp with time zone DEFAULT now()
);

-- 插入縣市資料
INSERT INTO public.cities (id, name, code) VALUES 
('2', '台北市', 'TPE'),
('3', '新北市', 'NTC'),
('4', '基隆市', 'KEE')
ON CONFLICT (id) DO NOTHING;

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_shelter_animals_city_code ON public.shelter_animals(city_code);
CREATE INDEX IF NOT EXISTS idx_shelter_animals_shelter_id ON public.shelter_animals(shelter_id);
CREATE INDEX IF NOT EXISTS idx_shelter_animals_animal_type ON public.shelter_animals(animal_type);
CREATE INDEX IF NOT EXISTS idx_shelter_animals_status ON public.shelter_animals(status);
CREATE INDEX IF NOT EXISTS idx_shelter_animals_breed ON public.shelter_animals(breed);
CREATE INDEX IF NOT EXISTS idx_shelter_animals_gender ON public.shelter_animals(gender);
CREATE INDEX IF NOT EXISTS idx_shelter_animals_adoption_dates ON public.shelter_animals(adoption_start_date, adoption_end_date);

-- 啟用 RLS (Row Level Security)
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelter_animals ENABLE ROW LEVEL SECURITY;

-- 創建 RLS 政策 - 允許所有認證用戶讀取收容所動物資料
CREATE POLICY "Allow public read access to cities" ON public.cities
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to shelters" ON public.shelters
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to shelter animals" ON public.shelter_animals
    FOR SELECT USING (true);

-- 只允許服務角色修改資料（系統管理用途）
-- 注意：這些政策限制只有系統層級的操作可以修改資料
-- 如需要特定用戶修改權限，請根據實際的角色枚舉值調整

-- 暫時禁用一般用戶的修改權限，只允許系統級別操作
CREATE POLICY "Restrict cities modification" ON public.cities
    FOR ALL USING (false);

CREATE POLICY "Restrict shelters modification" ON public.shelters
    FOR ALL USING (false);

CREATE POLICY "Restrict shelter animals modification" ON public.shelter_animals
    FOR ALL USING (false);

-- 創建用於查詢的視圖
CREATE OR REPLACE VIEW public.shelter_animals_with_details AS
SELECT 
    sa.*,
    s.name as shelter_name,
    s.address as shelter_address,
    s.phone as shelter_phone,
    c.name as city_name
FROM public.shelter_animals sa
JOIN public.shelters s ON sa.shelter_id = s.id
JOIN public.cities c ON sa.city_code = c.id;

-- 創建函數：按條件搜尋收容所動物
CREATE OR REPLACE FUNCTION public.search_shelter_animals(
    p_city_code text DEFAULT NULL,
    p_animal_type text DEFAULT NULL,
    p_breed text DEFAULT NULL,
    p_gender text DEFAULT NULL,
    p_size text DEFAULT NULL,
    p_age_category text DEFAULT NULL,
    p_is_neutered boolean DEFAULT NULL,
    p_status text DEFAULT 'OPEN',
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    serial_number text,
    animal_type text,
    breed text,
    gender text,
    size text,
    color text,
    age_category text,
    is_neutered boolean,
    image_url text,
    shelter_name text,
    city_name text,
    adoption_start_date date,
    notes text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.id,
        sa.serial_number,
        sa.animal_type,
        sa.breed,
        sa.gender,
        sa.size,
        sa.color,
        sa.age_category,
        sa.is_neutered,
        sa.image_url,
        s.name as shelter_name,
        c.name as city_name,
        sa.adoption_start_date,
        sa.notes
    FROM public.shelter_animals sa
    JOIN public.shelters s ON sa.shelter_id = s.id
    JOIN public.cities c ON sa.city_code = c.id
    WHERE 
        (p_city_code IS NULL OR sa.city_code = p_city_code)
        AND (p_animal_type IS NULL OR sa.animal_type = p_animal_type)
        AND (p_breed IS NULL OR sa.breed ILIKE '%' || p_breed || '%')
        AND (p_gender IS NULL OR sa.gender = p_gender)
        AND (p_size IS NULL OR sa.size = p_size)
        AND (p_age_category IS NULL OR sa.age_category = p_age_category)
        AND (p_is_neutered IS NULL OR sa.is_neutered = p_is_neutered)
        AND sa.status = p_status
    ORDER BY sa.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 創建函數：獲取收容所統計資料
CREATE OR REPLACE FUNCTION public.get_shelter_statistics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_animals', (SELECT COUNT(*) FROM public.shelter_animals WHERE status = 'OPEN'),
        'by_city', (
            SELECT json_agg(
                json_build_object(
                    'city_name', c.name,
                    'count', city_counts.animal_count
                )
            )
            FROM (
                SELECT city_code, COUNT(*) as animal_count
                FROM public.shelter_animals 
                WHERE status = 'OPEN'
                GROUP BY city_code
            ) city_counts
            JOIN public.cities c ON city_counts.city_code = c.id
        ),
        'by_type', (
            SELECT json_agg(
                json_build_object(
                    'animal_type', animal_type,
                    'count', animal_count
                )
            )
            FROM (
                SELECT animal_type, COUNT(*) as animal_count
                FROM public.shelter_animals 
                WHERE status = 'OPEN'
                GROUP BY animal_type
            ) type_counts
        ),
        'by_shelter', (
            SELECT json_agg(
                json_build_object(
                    'shelter_name', s.name,
                    'city_name', c.name,
                    'count', shelter_counts.animal_count
                )
            )
            FROM (
                SELECT shelter_id, COUNT(*) as animal_count
                FROM public.shelter_animals 
                WHERE status = 'OPEN'
                GROUP BY shelter_id
            ) shelter_counts
            JOIN public.shelters s ON shelter_counts.shelter_id = s.id
            JOIN public.cities c ON s.city_id = c.id
        )
    ) INTO result;
    
    RETURN result;
END;
$$;
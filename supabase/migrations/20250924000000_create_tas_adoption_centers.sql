-- Supabase 遷移檔案: TAS 認養中心資料表
-- 檔案名稱建議: 20250924000000_create_tas_adoption_centers.sql

-- 建立 TAS 認養中心資料表
CREATE TABLE IF NOT EXISTS public.tas_adoption_centers (
    id BIGSERIAL PRIMARY KEY,
    area TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    mobile_phone TEXT,
    is_mobile BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立更新時間觸發器
CREATE OR REPLACE FUNCTION update_tas_adoption_centers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tas_adoption_centers_updated_at
    BEFORE UPDATE ON public.tas_adoption_centers
    FOR EACH ROW
    EXECUTE FUNCTION update_tas_adoption_centers_updated_at();

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_tas_adoption_centers_area 
    ON public.tas_adoption_centers(area);
CREATE INDEX IF NOT EXISTS idx_tas_adoption_centers_organization 
    ON public.tas_adoption_centers(organization_name);
CREATE INDEX IF NOT EXISTS idx_tas_adoption_centers_mobile 
    ON public.tas_adoption_centers(is_mobile);

-- 插入資料
INSERT INTO public.tas_adoption_centers (area, organization_name, address, phone, mobile_phone, is_mobile) VALUES
('信義區', '中圓寵物家族信安店', '臺北市信義區信安街99號', '(02)23770008', NULL, FALSE),
('信義區', '逗貓坊', '臺北市信義區永吉路380號1樓', '(02)27686348', NULL, FALSE),
('中山區', '浪你幸福美髮沙龍', '臺北市中山區中山北路二段96巷31號1樓', NULL, NULL, FALSE),
('中山區', '宅貓旅館', '臺北市中山區民生東路二段3號1樓', '(02)25218488', NULL, FALSE),
('中山區', '好得文旅', '臺北市中山區南京東路二段11號11樓', '(02)25718875', NULL, FALSE),
('松山區', '北歐寵物旅館游泳館', '臺北市松山區八德路3段224號', '(02)27333288', NULL, FALSE),
('大安區', '北歐寵物旅館森林館', '臺北市大安區和平東路2段20-1號', '(02)83695662', NULL, FALSE),
('大安區', '金吉旺寵物店', '臺北市大安區基隆路二段104號1樓', NULL, '王先生 0933097072', FALSE),
('信義區', '伯特利流浪動物重生樂園', '臺北市信義區松仁路184號', '(02)27239639', NULL, FALSE),
('大安區', 'e書漫羅斯福店', '臺北市大安區羅斯福路2段75號2樓', '(02)83691989', NULL, FALSE),
('大安區', '東森寵物雲(通化店)', '臺北市大安區基隆路2段118號', '(02)27324986', NULL, FALSE),
('士林區', '東森寵物雲(士林文林店)', '臺北市士林區文林路74號', '(02)28831359', NULL, FALSE),
('北投區', '東森寵物雲(北投店)', '臺北市北投區中和街317號', '(02)28912103', NULL, FALSE),
('內湖區', '李老師毛孩屋', '臺北市內湖區成功路4段8弄182巷7號', '(02)27591447', NULL, FALSE),
('大同區', '奧斯卡水族量販廣場(台北大同店)', '臺北市大同區民族西路224、226號1樓', '(02)25858887', NULL, FALSE),
('不分區', '社團法人台灣收容動物關懷協會', '巡迴式', NULL, NULL, TRUE),
('不分區', '東森寵物雲(建國南路店)', '巡迴式', NULL, NULL, TRUE)
ON CONFLICT (area, organization_name, address) DO NOTHING;

-- 啟用 Row Level Security (RLS)
ALTER TABLE public.tas_adoption_centers ENABLE ROW LEVEL SECURITY;

-- 建立 RLS 政策 (允許所有人讀取)
CREATE POLICY "Allow public read access on tas_adoption_centers" ON public.tas_adoption_centers
    FOR SELECT USING (true);

-- 建立管理員寫入政策 (如果需要的話)
-- CREATE POLICY "Allow admin write access on tas_adoption_centers" ON public.tas_adoption_centers
--     FOR ALL USING (auth.role() = 'admin');
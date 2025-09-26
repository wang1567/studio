-- TAS浪愛滿屋推廣動物認養計畫 - 完整資料庫腳本

-- 1. 建立資料表
CREATE TABLE IF NOT EXISTS tas_adoption_centers (
  id SERIAL PRIMARY KEY,
  area VARCHAR(20) NOT NULL COMMENT '區域',
  organization_name VARCHAR(100) NOT NULL COMMENT '合作機構名稱',
  address VARCHAR(200) NOT NULL COMMENT '地址',
  phone VARCHAR(20) COMMENT '電話',
  mobile_phone VARCHAR(30) COMMENT '行動電話',
  is_mobile BOOLEAN DEFAULT FALSE COMMENT '是否為巡迴式',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間'
);

-- 2. 建立索引以提升查詢效能
CREATE INDEX idx_tas_adoption_centers_area ON tas_adoption_centers(area);
CREATE INDEX idx_tas_adoption_centers_organization ON tas_adoption_centers(organization_name);
CREATE INDEX idx_tas_adoption_centers_mobile ON tas_adoption_centers(is_mobile);

-- 3. 插入資料
INSERT INTO tas_adoption_centers (area, organization_name, address, phone, mobile_phone, is_mobile) VALUES
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
('不分區', '東森寵物雲(建國南路店)', '巡迴式', NULL, NULL, TRUE);

-- 4. 驗證資料插入結果
SELECT 
    COUNT(*) as total_centers,
    COUNT(DISTINCT area) as total_areas,
    COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as centers_with_phone,
    COUNT(CASE WHEN mobile_phone IS NOT NULL THEN 1 END) as centers_with_mobile,
    COUNT(CASE WHEN is_mobile = TRUE THEN 1 END) as mobile_centers
FROM tas_adoption_centers;

-- 5. 按區域統計
SELECT 
    area as 區域,
    COUNT(*) as 認養中心數量
FROM tas_adoption_centers 
GROUP BY area 
ORDER BY COUNT(*) DESC, area;

-- 6. 查詢所有資料 (驗證用)
SELECT 
    id,
    area as 區域,
    organization_name as 合作機構名稱,
    address as 地址,
    phone as 電話,
    mobile_phone as 行動電話,
    CASE WHEN is_mobile THEN '是' ELSE '否' END as 巡迴式
FROM tas_adoption_centers 
ORDER BY 
    CASE area 
        WHEN '不分區' THEN 99 
        ELSE 1 
    END,
    area, 
    id;
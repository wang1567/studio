-- PawsConnect 收容所動物視圖修復
-- 為滑卡功能創建 dogs_for_adoption_view 視圖，並加入模擬健康記錄和餵食計畫

-- 1. 刪除現有視圖（如果存在）
DROP VIEW IF EXISTS public.dogs_for_adoption_view CASCADE;

-- 2. 創建 dogs_for_adoption_view 視圖，整合收容所動物資料
CREATE VIEW public.dogs_for_adoption_view AS
SELECT 
  sa.id,
  sa.serial_number,
  
  -- 基本資訊 - 從 shelter_animals 轉換為 Dog 介面所需欄位
  COALESCE(NULLIF(TRIM(sa.breed), ''), '混種') as breed,
  
  -- 根據 age_category 推算年齡
  CASE 
    WHEN sa.age_category = 'CHILD' THEN 1
    WHEN sa.age_category = 'ADULT' THEN 3
    ELSE 2
  END as age,
  
  -- 性別轉換
  CASE 
    WHEN sa.gender = 'M' THEN 'Male'
    WHEN sa.gender = 'F' THEN 'Female'
    ELSE 'Unknown'
  END as gender,
  
  -- 照片陣列 - 如果有圖片就用，沒有就用預設
  CASE 
    WHEN sa.image_url IS NOT NULL AND sa.image_url != '' 
    THEN ARRAY[sa.image_url]
    ELSE ARRAY['https://placehold.co/600x400.png?text=' || COALESCE(sa.serial_number, 'Pet')]
  END as photos,
  
  -- 描述 - 結合多個欄位
  CASE 
    WHEN sa.notes IS NOT NULL AND sa.notes != '' 
    THEN sa.notes
    WHEN sa.other_info IS NOT NULL AND sa.other_info != ''
    THEN sa.other_info
    ELSE '這是一隻來自收容所的可愛動物，正在等待一個溫暖的家。'
  END as description,
  
  -- 個性特徵 - 根據品種和描述推測
  CASE 
    WHEN sa.animal_type = '貓' THEN ARRAY['溫和', '獨立', '聰明']
    WHEN sa.size = 'SMALL' THEN ARRAY['可愛', '活潑', '適合室內']
    WHEN sa.size = 'BIG' THEN ARRAY['忠誠', '友善', '需要運動空間']
    ELSE ARRAY['親人', '溫和', '適合家庭']
  END as personality_traits,
  
  -- 健康記錄 - 創建模擬資料結構
  jsonb_build_object(
    'lastCheckup', 
    CASE 
      WHEN sa.adoption_start_date IS NOT NULL 
      THEN to_char(sa.adoption_start_date::date, 'YYYY-MM-DD')
      ELSE to_char(CURRENT_DATE - interval '30 days', 'YYYY-MM-DD')
    END,
    'conditions', 
    CASE 
      WHEN sa.is_neutered THEN ARRAY['已絕育']
      ELSE ARRAY['未絕育']
    END ||
    CASE 
      WHEN sa.rabies_vaccinated THEN ARRAY['已施打狂犬病疫苗']
      ELSE ARRAY[]
    END,
    'notes', 
    CASE 
      WHEN sa.notes IS NOT NULL AND LENGTH(TRIM(sa.notes)) > 0
      THEN '收容所記錄：' || sa.notes
      ELSE '收容所定期健康檢查，狀態良好'
    END
  ) as health_records,
  
  -- 餵食計畫 - 根據動物類型和大小創建
  jsonb_build_object(
    'foodType', 
    CASE 
      WHEN sa.animal_type = '貓' THEN '成貓專用飼料'
      WHEN sa.size = 'SMALL' THEN '小型犬專用飼料'
      WHEN sa.size = 'BIG' THEN '大型犬專用飼料'
      ELSE '一般犬用飼料'
    END,
    'timesPerDay',
    CASE 
      WHEN sa.age_category = 'CHILD' THEN 3
      WHEN sa.size = 'BIG' THEN 2
      ELSE 2
    END,
    'portionSize',
    CASE 
      WHEN sa.size = 'SMALL' THEN '100-150g'
      WHEN sa.size = 'BIG' THEN '300-400g'
      ELSE '200-250g'
    END,
    'notes', '收容所標準餵食計畫，領養後可依獸醫建議調整'
  ) as feeding_schedule,
  
  -- 疫苗記錄 - 創建基本疫苗資料
  CASE 
    WHEN sa.rabies_vaccinated THEN 
      jsonb_build_array(
        jsonb_build_object(
          'vaccine_name', '狂犬病疫苗',
          'date', COALESCE(sa.adoption_start_date, CURRENT_DATE - interval '60 days'),
          'next_due_date', COALESCE(sa.adoption_start_date, CURRENT_DATE) + interval '1 year'
        )
      )
    ELSE jsonb_build_array()
  END as vaccination_records,
  
  -- 狀態轉換
  CASE 
    WHEN sa.status = 'OPEN' THEN 'Available'
    WHEN sa.status = 'ADOPTED' THEN 'Adopted'
    ELSE 'Available'
  END as status,
  
  -- 位置資訊 - 使用收容所名稱
  COALESCE(s.name, c.name, '收容所') as location,
  
  -- 新增 name 欄位 - 使用流水號作為名字
  COALESCE(
    CASE 
      WHEN LENGTH(TRIM(sa.serial_number)) > 0 
      THEN TRIM(sa.serial_number)
      ELSE NULL
    END,
    '小' || 
    CASE 
      WHEN sa.animal_type = '貓' THEN 
        CASE 
          WHEN sa.gender = 'M' THEN '帥'
          WHEN sa.gender = 'F' THEN '美'
          ELSE '咪'
        END
      ELSE 
        CASE 
          WHEN sa.gender = 'M' THEN '黑'
          WHEN sa.gender = 'F' THEN '花'
          ELSE '旺'
        END
    END
  ) as name

FROM public.shelter_animals sa
LEFT JOIN public.shelters s ON sa.shelter_id::text = s.id::text
LEFT JOIN public.cities c ON s.city_id::text = c.id::text
WHERE sa.status = 'OPEN'
  AND sa.animal_type IN ('狗', '貓');

-- 3. 創建視圖索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_dogs_for_adoption_view_id 
  ON public.shelter_animals(id) 
  WHERE status = 'OPEN' AND animal_type IN ('狗', '貓');

-- 4. 授權設定
GRANT SELECT ON public.dogs_for_adoption_view TO authenticated;
GRANT SELECT ON public.dogs_for_adoption_view TO anon;

-- 5. 測試查詢
-- 驗證視圖是否正常工作
SELECT 
  id, 
  name, 
  breed, 
  age, 
  gender,
  health_records->>'lastCheckup' as last_checkup,
  health_records->'conditions' as conditions,
  feeding_schedule->>'foodType' as food_type,
  feeding_schedule->>'timesPerDay' as times_per_day,
  status,
  location
FROM public.dogs_for_adoption_view 
LIMIT 5;

-- 6. 檢查視圖資料統計
SELECT 
  COUNT(*) as total_animals,
  COUNT(CASE WHEN health_records IS NOT NULL THEN 1 END) as with_health_records,
  COUNT(CASE WHEN feeding_schedule IS NOT NULL THEN 1 END) as with_feeding_schedule,
  COUNT(CASE WHEN vaccination_records::text != '[]' THEN 1 END) as with_vaccinations
FROM public.dogs_for_adoption_view;
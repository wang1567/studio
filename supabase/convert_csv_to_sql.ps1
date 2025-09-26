# 北北基收容所資料導入腳本
# 將 CSV 資料轉換為 SQL INSERT 語句

param(
    [Parameter(Mandatory = $true)]
    [string]$CsvPath = "c:\FinalProjectCode_number2\北北基收容所資料.csv",
    
    [Parameter(Mandatory = $false)]
    [string]$OutputPath = "c:\FinalProjectCode_number2\studio\supabase\migrations\20250923_import_shelter_animals_data.sql"
)

Write-Host "開始處理 CSV 資料..." -ForegroundColor Green

# 讀取 CSV 資料
$csvData = Import-Csv $CsvPath

Write-Host "共讀取 $($csvData.Count) 筆資料" -ForegroundColor Yellow

# 建立 SQL 檔案開頭
$sqlContent = @"
-- 北北基收容所動物資料導入
-- 自動生成於: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- 資料來源: 政府開放資料平台

-- 開始匯入動物資料
BEGIN;

"@

# 函數：轉換布林值
function ConvertTo-Boolean {
    param($value)
    if ($value -eq 'T') { return 'true' }
    elseif ($value -eq 'F') { return 'false' }
    else { return 'NULL' }
}

# 函數：清理和轉義字串
function Format-SqlString {
    param($value)
    if ([string]::IsNullOrWhiteSpace($value)) {
        return 'NULL'
    }
    # 移除多餘空格並轉義單引號
    $cleaned = $value.Trim() -replace "'", "''"
    return "'$cleaned'"
}

# 函數：轉換日期
function Format-SqlDate {
    param($dateString)
    if ([string]::IsNullOrWhiteSpace($dateString) -or $dateString -eq '2999-12-31') {
        return 'NULL'
    }
    try {
        $date = [DateTime]::ParseExact($dateString, "yyyy-MM-dd", $null)
        return "'$($date.ToString("yyyy-MM-dd"))'"
    }
    catch {
        try {
            $date = [DateTime]::ParseExact($dateString, "yyyy/MM/dd", $null)
            return "'$($date.ToString("yyyy-MM-dd"))'"
        }
        catch {
            return 'NULL'
        }
    }
}

# 函數：轉換時間戳
function Format-SqlTimestamp {
    param($timestampString)
    if ([string]::IsNullOrWhiteSpace($timestampString)) {
        return 'NULL'
    }
    try {
        $timestamp = [DateTime]::ParseExact($timestampString, "yyyy/MM/dd", $null)
        return "'$($timestamp.ToString("yyyy-MM-dd HH:mm:ss"))'"
    }
    catch {
        return 'NULL'
    }
}

Write-Host "開始轉換資料為 SQL 語句..." -ForegroundColor Yellow

$insertStatements = @()
$batchSize = 100
$currentBatch = 0

for ($i = 0; $i -lt $csvData.Count; $i++) {
    $row = $csvData[$i]
    
    # 每100筆建立一個批次
    if ($i % $batchSize -eq 0) {
        $currentBatch++
        if ($insertStatements.Count -gt 0) {
            $sqlContent += $insertStatements -join ",`n"
            $sqlContent += ";`n`n"
        }
        
        $sqlContent += "-- 批次 $currentBatch (第 $($i + 1) - $([Math]::Min($i + $batchSize, $csvData.Count)) 筆)`n"
        $sqlContent += "INSERT INTO public.shelter_animals (`n"
        $sqlContent += "    serial_number, shelter_code, city_code, shelter_id, current_location,`n"
        $sqlContent += "    animal_type, breed, gender, size, color, age_category,`n"
        $sqlContent += "    is_neutered, rabies_vaccinated, found_location, web_title, status,`n"
        $sqlContent += "    notes, other_info, adoption_start_date, adoption_end_date,`n"
        $sqlContent += "    data_updated_at, data_created_at, image_url, last_modified_at`n"
        $sqlContent += ") VALUES`n"
        
        $insertStatements = @()
    }
    
    # 構建 INSERT 值
    $values = @(
        (Format-SqlString $row.'動物的流水編號'),
        (Format-SqlString $row.'動物的收容編號'),
        (Format-SqlString $row.'動物所屬縣市代碼'),
        "(SELECT id FROM public.shelters WHERE code = $(Format-SqlString $row.'動物所屬收容所代碼'))",
        (Format-SqlString $row.'動物的實際所在地'),
        (Format-SqlString $row.'動物的類型'),
        (Format-SqlString $row.'動物品種'),
        (Format-SqlString $row.'動物性別'),
        (Format-SqlString $row.'動物體型'),
        (Format-SqlString $row.'動物毛色'),
        (Format-SqlString $row.'動物年紀'),
        (ConvertTo-Boolean $row.'是否絕育'),
        (ConvertTo-Boolean $row.'是否施打狂犬病疫苗'),
        (Format-SqlString $row.'動物尋獲地'),
        (Format-SqlString $row.'動物網頁標題'),
        (Format-SqlString $row.'動物狀態'),
        (Format-SqlString $row.'資料備註'),
        (Format-SqlString $row.'其他說明'),
        (Format-SqlDate $row.'開放認養時間(起)'),
        (Format-SqlDate $row.'開放認養時間(迄)'),
        (Format-SqlTimestamp $row.'動物資料異動時間'),
        (Format-SqlTimestamp $row.'動物資料建立時間'),
        (Format-SqlString $row.'圖片名稱'),
        (Format-SqlTimestamp $row.'異動時間')
    )
    
    $insertStatements += "    ($($values -join ', '))"
    
    # 進度顯示
    if (($i + 1) % 100 -eq 0) {
        $percent = [Math]::Round(($i + 1) / $csvData.Count * 100, 1)
        Write-Host "已處理 $($i + 1) 筆資料 ($percent%)" -ForegroundColor Cyan
    }
}

# 添加最後一批資料
if ($insertStatements.Count -gt 0) {
    $sqlContent += $insertStatements -join ",`n"
    $sqlContent += ";`n`n"
}

# 添加結尾
$sqlContent += @"
-- 提交交易
COMMIT;

-- 更新統計資訊
ANALYZE public.shelter_animals;
ANALYZE public.shelters;
ANALYZE public.cities;

-- 驗證導入結果
SELECT 
    '導入完成' as status,
    COUNT(*) as total_animals,
    COUNT(DISTINCT city_code) as cities_count,
    COUNT(DISTINCT shelter_id) as shelters_count
FROM public.shelter_animals;

-- 按縣市統計
SELECT 
    c.name as city_name,
    COUNT(*) as animal_count
FROM public.shelter_animals sa
JOIN public.cities c ON sa.city_code = c.id
GROUP BY c.name
ORDER BY animal_count DESC;
"@

# 寫入檔案
$sqlContent | Out-File -FilePath $OutputPath -Encoding UTF8

Write-Host "SQL 檔案已生成: $OutputPath" -ForegroundColor Green
Write-Host "總共處理了 $($csvData.Count) 筆資料" -ForegroundColor Green
Write-Host "檔案大小: $([Math]::Round((Get-Item $OutputPath).Length / 1MB, 2)) MB" -ForegroundColor Yellow

Write-Host "`n下一步操作指引:" -ForegroundColor Magenta
Write-Host "1. 先執行基礎表格建立: 20250923_create_shelter_animals_system.sql" -ForegroundColor White
Write-Host "2. 執行收容所資料插入: 20250923_insert_shelter_data.sql" -ForegroundColor White
Write-Host "3. 最後執行動物資料導入: 20250923_import_shelter_animals_data.sql" -ForegroundColor White
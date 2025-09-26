// 測試資料庫連線和視圖創建的臨時腳本
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hkjclbdisriyqsvcpmnp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhramNsYmRpc3JpeXFzdmNwbW5wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTk1MzU3NCwiZXhwIjoyMDU1NTI5NTc0fQ.CVRbG_UEoesN6n0Ofz1TPx66mOKqK09pvDu5vFkg0as';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseConnection() {
    console.log('🔄 測試資料庫連線...');

    // 1. 測試基本連線
    const { data: connection, error: connectionError } = await supabase
        .from('shelter_animals')
        .select('count(*)', { count: 'exact' });

    if (connectionError) {
        console.error('❌ 資料庫連線失敗:', connectionError);
        return;
    }

    console.log('✅ 資料庫連線成功');
    console.log('📊 收容所動物總數:', connection);

    // 2. 檢查是否存在 dogs_for_adoption_view
    const { data: viewExists, error: viewError } = await supabase
        .from('dogs_for_adoption_view')
        .select('count(*)', { count: 'exact' })
        .limit(1);

    if (viewError) {
        console.log('⚠️  dogs_for_adoption_view 視圖不存在:', viewError.message);
        console.log('🔧 需要執行 SQL 創建視圖');
        return;
    }

    console.log('✅ dogs_for_adoption_view 視圖存在');
    console.log('📊 視圖資料數量:', viewExists);

    // 3. 測試視圖資料結構
    const { data: sampleData, error: sampleError } = await supabase
        .from('dogs_for_adoption_view')
        .select('id, name, breed, age, gender, health_records, feeding_schedule')
        .limit(3);

    if (sampleError) {
        console.error('❌ 視圖資料查詢失敗:', sampleError);
        return;
    }

    console.log('📋 視圖範例資料:');
    sampleData?.forEach((dog, index) => {
        console.log(`\n🐕 動物 ${index + 1}:`);
        console.log(`   ID: ${dog.id}`);
        console.log(`   名稱: ${dog.name}`);
        console.log(`   品種: ${dog.breed}`);
        console.log(`   年齡: ${dog.age}`);
        console.log(`   性別: ${dog.gender}`);
        console.log(`   健康記錄: ${dog.health_records ? '✅ 有資料' : '❌ 無資料'}`);
        console.log(`   餵食計畫: ${dog.feeding_schedule ? '✅ 有資料' : '❌ 無資料'}`);

        if (dog.health_records) {
            const health = typeof dog.health_records === 'string'
                ? JSON.parse(dog.health_records)
                : dog.health_records;
            console.log(`   - 上次檢查: ${health.lastCheckup || '未提供'}`);
            console.log(`   - 狀況: ${health.conditions?.join(', ') || '無特殊狀況'}`);
        }

        if (dog.feeding_schedule) {
            const feeding = typeof dog.feeding_schedule === 'string'
                ? JSON.parse(dog.feeding_schedule)
                : dog.feeding_schedule;
            console.log(`   - 食物類型: ${feeding.foodType || '未指定'}`);
            console.log(`   - 每日次數: ${feeding.timesPerDay || 0}`);
        }
    });
}

// 執行測試
testDatabaseConnection().catch(console.error);
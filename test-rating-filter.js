// 測試評鑑等級篩選功能
const testRatingFilter = async () => {
    console.log('🧪 測試評鑑等級篩選功能...');

    try {
        // 測試獲取所有資料
        const allResponse = await fetch('http://localhost:3000/api/pet-service?limit=20');
        const allData = await allResponse.json();
        console.log('✅ 全部資料:', allData.resultCount || allData.result?.length || 'Unknown count');

        // 測試篩選特優
        const excellentResponse = await fetch('http://localhost:3000/api/pet-service?評鑑等級=特優&limit=20');
        const excellentData = await excellentResponse.json();
        console.log('✅ 特優篩選:', excellentData.resultCount || excellentData.result?.length || 'Unknown count');

        // 測試篩選甲等
        const aGradeResponse = await fetch('http://localhost:3000/api/pet-service?評鑑等級=甲等&limit=20');
        const aGradeData = await aGradeResponse.json();
        console.log('✅ 甲等篩選:', aGradeData.resultCount || aGradeData.result?.length || 'Unknown count');

        // 檢查回應中是否確實只有指定等級
        if (excellentData.result && Array.isArray(excellentData.result)) {
            const hasOnlyExcellent = excellentData.result.every(item => item.評鑑等級 === '特優');
            console.log('✅ 特優篩選正確性:', hasOnlyExcellent ? '正確' : '有誤');

            if (!hasOnlyExcellent) {
                console.log('❌ 發現的評鑑等級:', [...new Set(excellentData.result.map(item => item.評鑑等級))]);
            }
        }

    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
};

// 如果在瀏覽器中運行
if (typeof window !== 'undefined') {
    window.testRatingFilter = testRatingFilter;
    console.log('🔧 使用 testRatingFilter() 來執行測試');
} else {
    // 如果在 Node.js 中運行
    testRatingFilter();
}
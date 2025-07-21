// This is the final, consolidated stream server.
// To run this server:
// 1. Open a terminal IN THIS FOLDER (stream-server).
// 2. Run 'npm install' ONE TIME to install dependencies.
// 3. Run 'npm start' to start the server.

const Stream = require('node-rtsp-stream');

// --- 組態設定 (Configuration) ---
// 重要提示：請將此處的 RTSP URL 換成您攝影機的實際位址，包含帳號和密碼。
const rtspUrl = 'rtsp://wang1567:15671567@192.168.88.103:554/stream1';

// --- 連接埠解釋 (Port Explanation) ---
// 為什麼需要兩個不同的連接埠？
// 因為 `node-rtsp-stream` 套件內部同時啟動了兩種服務：
// 1. MJPEG 影像串流服務 (streamPort): 這是我們真正需要的服務，用來傳送影像畫面。
// 2. WebSocket 內部管理服務 (webSocketPort): 這是套件內部使用的輔助服務，我們不會直接用到它，但必須為它指定一個連接埠。

// MJPEG 影像串流服務的連接埠
const streamPort = 8082; 

// WebSocket 內部管理服務的連接埠（必須提供，但我們不會直接使用）
const webSocketPort = 8083;

console.log(`[設定] 正在嘗試連線至本地 RTSP 攝影機: ${rtspUrl.replace(/:.*@/, '://****:****@')}`);

const stream = new Stream({
    name: 'PawsConnect Live Stream',
    streamUrl: rtspUrl,
    wsPort: webSocketPort, // 提供 WebSocket 連接埠
    // 以下是 ffmpeg 的參數，我們明確指定影像品質以確保穩定性。
    ffmpegOptions: {
        '-stats': '',      // 在終端機顯示處理狀態
        '-r': 30,          // 設定幀率為每秒 30 幀 (30 frames per second)
        '-q:v': 7          // 設定影像品質 (數字越低品質越好，7 是一個很好的平衡點)
    }
});

// 監聽 ffmpeg 異常退出的事件
stream.on('exitWithError', () => {
    console.error('[FFmpeg 錯誤] FFmpeg 程序因錯誤而終止。這通常是因為 RTSP URL 不正確、帳號密碼錯誤，或是與攝影機的網路連線有問題。');
    stream.stop(); // 停止串流以釋放資源
});


console.log(`\n[伺服器] MJPEG 影像串流伺服器正在啟動於連接埠 ${streamPort}`);
console.log(`[資訊]   影像串流將可於 http://localhost:${streamPort} 觀看`);
console.log(`[資訊]   WebSocket 伺服器 (供套件內部使用) 位於連接埠 ${webSocketPort}`);

// --- NGROK 與使用教學 ---
console.log('\n--- NGROK & USAGE INSTRUCTIONS ---');
console.log("1. 這個腳本會自行建立一個 MJPEG 伺服器，您不需要任何其他的伺服器檔案。");
console.log(`2. 在【另一個】終端機視窗中，執行指令: ngrok http ${streamPort} --host-header="localhost:${streamPort}"`);
console.log("3. 複製 ngrok 提供的 'Forwarding' 公開網址 (例如: https://abcd-1234.ngrok-free.app)。");
console.log("4. *** 最關鍵的步驟 ***: 直接在您的【瀏覽器】中打開剛剛複製的 ngrok 網址，以進行授權與測試。");
console.log("   範例: https://abcd-1234.ngrok-free.app (網址結尾不需要加任何路徑)");
console.log("5. 測試成功看到影像後，將這個 ngrok 網址更新到您資料庫中的 'live_stream_url' 欄位。");
console.log("6. 重新整理 PawsConnect 應用程式，影像串流現在應該可以正常運作了。");

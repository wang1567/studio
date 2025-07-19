
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const http = require('http'); // 改回使用 http
const path = require('path');

const app = express();

// 允許所有來源的請求，以簡化開發環境中的跨域問題
app.use(cors({ origin: '*' }));

// --- 使用 http 建立伺服器 ---
const server = http.createServer(app);
// -----------------------------

// 將 WebSocket 伺服器附加到 HTTP 伺服器上
const wss = new WebSocket.Server({ server });

// --- 正確的攝影機 RTSP 位址 ---
// 請確保此處的 IP 位址和認證資訊是正確的
const rtspUrl = 'rtsp://wang1567:15671567@192.168.88.101:554/stream1';
// -----------------------------

console.log(`[Config] 設定的 RTSP URL: ${rtspUrl}`);

// WebSocket 連線處理
wss.on('connection', (ws, req) => {
    const remoteAddress = req.socket.remoteAddress;
    console.log(`[${new Date().toLocaleTimeString()}] 來自 ${remoteAddress} 的新 WebSocket (WS) 連線`);

    // 為每一個新的客戶端連線，都產生一個新的 FFmpeg 程序
    const ffmpeg = spawn('ffmpeg', [
        '-rtsp_transport', 'tcp',        // 優先使用 TCP 傳輸，更穩定
        '-i', rtspUrl,                   // 輸入的 RTSP 串流
        '-f', 'mpegts',                  // 輸出格式為 MPEG-TS
        '-codec:v', 'mpeg1video',        // 輸出視訊編碼為 mpeg1
        '-s', '1280x720',                // 輸出解析度
        '-b:v', '1000k',                 // 視訊位元率
        '-bf', '0',                      // 關閉 B 幀，降低延遲
        '-r', '30',                      // 幀率
        '-muxdelay', '0.001',            // 關鍵：極低的複用延遲，確保即時輸出
        'pipe:1'                         // 將輸出導向到標準輸出 (stdout)
    ]);

    console.log(`[FFmpeg] 為連線 ${remoteAddress} 產生了新的 FFmpeg 程序。`);

    // 監聽 FFmpeg 的標準錯誤輸出 (用於除錯)
    ffmpeg.stderr.on('data', (data) => {
        // 為了避免洗版，可以選擇性地註解掉此行
        // console.log(`[FFmpeg stderr - ${remoteAddress}]`, data.toString());
    });
    
    // 監聽 FFmpeg 的標準輸出 (即影像資料)
    ffmpeg.stdout.on('data', (data) => {
        // 如果 WebSocket 仍然開啟，就傳送資料
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });

    // 當 WebSocket 連線關閉時
    ws.on('close', () => {
        console.log(`[WebSocket] 來自 ${remoteAddress} 的連線已關閉。`);
        ffmpeg.kill(); // 終止對應的 FFmpeg 程序，釋放資源
        console.log(`[FFmpeg] 已終止連線 ${remoteAddress} 的 FFmpeg 程序。`);
    });
    
    // 當 WebSocket 發生錯誤時
    ws.on('error', (error) => {
        console.error(`[WebSocket Error - ${remoteAddress}]`, error);
        ffmpeg.kill();
    });

    // 當 FFmpeg 程序退出時
    ffmpeg.on('close', (code) => {
        console.log(`[FFmpeg] 連線 ${remoteAddress} 的程序以代碼 ${code} 退出`);
        // 如果 WebSocket 仍然開啟，就主動關閉它
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    });
});

app.get('/', (req, res) => {
    res.send('Stream server is running.');
});

process.on('uncaughtException', (error) => {
    console.error('未捕獲的例外:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('未處理的 Promise 拒絕:', error);
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
    console.log(`串流伺服器 (HTTP & WS) 正在埠 ${PORT} 上執行`);
});

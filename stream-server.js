
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const http = require('http');

const app = express();
// --- 修改 CORS 設定以允許所有來源 ---
app.use(cors({ origin: '*' }));

// 使用 Node's built-in HTTP server 來整合 Express 和 WebSocket 伺服器
const server = http.createServer(app);

// 將 WebSocket 伺服器附加到 HTTP 伺服器上
const wss = new WebSocket.Server({ server });

// --- 正確的攝影機 RTSP 位址 ---
const rtspUrl = 'rtsp://wang1567:15671567@192.168.88.101:554/stream1';
// -----------------------------

console.log(`已設定的 RTSP URL: ${rtspUrl}`);

// WebSocket 連線處理
wss.on('connection', (ws, req) => {
    const remoteAddress = req.socket.remoteAddress;
    console.log(`[${new Date().toLocaleTimeString()}] 來自 ${remoteAddress} 的新 WebSocket 連線`);

    // 為每一個新的客戶端連線，都產生一個新的 FFmpeg 程序
    const ffmpeg = spawn('ffmpeg', [
        '-rtsp_transport', 'tcp', // 使用 TCP 進行 RTSP 傳輸以減少封包遺失問題
        '-i', rtspUrl,
        '-f', 'mpegts',
        '-codec:v', 'mpeg1video',
        '-s', '1280x720',
        '-b:v', '1000k',
        '-bf', '0',
        '-r', '30', // 設定幀率
        '-muxdelay', '0.001', // <<<--- 這是關鍵的修改！強制 ffmpeg 立即輸出資料
        'pipe:1'
    ]);

    console.log(`[${remoteAddress}] 為新連線產生了 FFmpeg 程序。`);

    ffmpeg.stderr.on('data', (data) => {
        // 為了除錯，紀錄 FFmpeg 的錯誤/資訊
        console.log(`[FFmpeg - ${remoteAddress}]`, data.toString());
    });
    
    // 將 FFmpeg 的輸出直接導向 WebSocket 客戶端
    ffmpeg.stdout.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });

    ws.on('close', () => {
        console.log(`[${new Date().toLocaleTimeString()}] 來自 ${remoteAddress} 的 WebSocket 連線已關閉。`);
        // 當客戶端斷線時，終止 FFmpeg 程序
        ffmpeg.kill();
        console.log(`[${remoteAddress}] 已終止相關的 FFmpeg 程序。`);
    });
    
    ws.on('error', (error) => {
        console.error(`[WebSocket 錯誤 - ${remoteAddress}]`, error);
        ffmpeg.kill(); // 確保在 WebSocket 發生錯誤時，也終止 FFmpeg 程序
    });

    ffmpeg.on('close', (code) => {
        console.log(`[FFmpeg - ${remoteAddress}] 程序以代碼 ${code} 退出`);
        // 確保在 FFmpeg 程序意外終止時，也關閉 WebSocket
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    });
});

// API 路由 (可選，保留自原始碼)
app.get('/streams', (req, res) => {
    res.json(['camera1']);
});

app.get('/stream/:id/status', (req, res) => {
    res.json({ status: 'active' });
});

// 全域錯誤處理
process.on('uncaughtException', (error) => {
    console.error('未捕獲的例外:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('未處理的 Promise 拒絕:', error);
});

// 啟動伺服器
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
    console.log(`串流伺服器 (HTTP & WebSocket) 正在埠 ${PORT} 上執行`);
});

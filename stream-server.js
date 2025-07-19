
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const https = require('https'); // 引入 https 模組
const fs = require('fs'); // 引入 fs 模組
const path = require('path'); // 引入 path 模組

const app = express();
app.use(cors({ origin: '*' }));

// --- SSL/TLS 憑證設定 ---
// 讀取您在 certs/ 資料夾中產生的金鑰和憑證
const options = {
  key: fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem'))
};
// ------------------------

// --- 使用 https 建立安全伺服器 ---
const server = https.createServer(options, app);
// ---------------------------------

// 將 WebSocket 伺服器附加到 HTTPS 伺服器上
const wss = new WebSocket.Server({ server });

// --- 正確的攝影機 RTSP 位址 ---
const rtspUrl = 'rtsp://wang1567:15671567@192.168.88.101:554/stream1';
// -----------------------------

console.log(`已設定的 RTSP URL: ${rtspUrl}`);
console.log('正在讀取 SSL 憑證...');

// WebSocket 連線處理
wss.on('connection', (ws, req) => {
    const remoteAddress = req.socket.remoteAddress;
    console.log(`[${new Date().toLocaleTimeString()}] 來自 ${remoteAddress} 的新安全 WebSocket (WSS) 連線`);

    // 為每一個新的客戶端連線，都產生一個新的 FFmpeg 程序
    const ffmpeg = spawn('ffmpeg', [
        '-rtsp_transport', 'tcp',
        '-i', rtspUrl,
        '-f', 'mpegts',
        '-codec:v', 'mpeg1video',
        '-s', '1280x720',
        '-b:v', '1000k',
        '-bf', '0',
        '-r', '30',
        '-muxdelay', '0.001',
        'pipe:1'
    ]);

    console.log(`[${remoteAddress}] 為新連線產生了 FFmpeg 程序。`);

    ffmpeg.stderr.on('data', (data) => {
        console.log(`[FFmpeg - ${remoteAddress}]`, data.toString());
    });
    
    ffmpeg.stdout.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });

    ws.on('close', () => {
        console.log(`[${new Date().toLocaleTimeString()}] 來自 ${remoteAddress} 的 WebSocket 連線已關閉。`);
        ffmpeg.kill();
        console.log(`[${remoteAddress}] 已終止相關的 FFmpeg 程序。`);
    });
    
    ws.on('error', (error) => {
        console.error(`[WebSocket 錯誤 - ${remoteAddress}]`, error);
        ffmpeg.kill();
    });

    ffmpeg.on('close', (code) => {
        console.log(`[FFmpeg - ${remoteAddress}] 程序以代碼 ${code} 退出`);
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    });
});

app.get('/streams', (req, res) => {
    res.json(['camera1']);
});

app.get('/stream/:id/status', (req, res) => {
    res.json({ status: 'active' });
});

process.on('uncaughtException', (error) => {
    console.error('未捕獲的例外:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('未處理的 Promise 拒絕:', error);
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
    console.log(`安全串流伺服器 (HTTPS & WSS) 正在埠 ${PORT} 上執行`);
});

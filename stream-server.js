
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const http = require('http');

const app = express();
app.use(cors());

// Use Node's built-in HTTP server to integrate Express and WebSocket server
const server = http.createServer(app);

// Attach WebSocket server to the HTTP server
const wss = new WebSocket.Server({ server });

// --- 正確的攝影機 RTSP 位址 ---
const rtspUrl = 'rtsp://wang1567:15671567@192.168.88.101:554/stream1';
// -----------------------------

console.log(`Configured RTSP URL: ${rtspUrl}`);

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    const remoteAddress = req.socket.remoteAddress;
    console.log(`[${new Date().toLocaleTimeString()}] New WebSocket connection from ${remoteAddress}`);

    // Spawn a new FFmpeg process for each new client connection
    const ffmpeg = spawn('ffmpeg', [
        '-rtsp_transport', 'tcp', // Use TCP for RTSP transport to reduce packet loss issues
        '-i', rtspUrl,
        '-f', 'mpegts',
        '-codec:v', 'mpeg1video',
        '-s', '1280x720',
        '-b:v', '1000k',
        '-bf', '0',
        '-r', '30', // Set a frame rate
        '-muxdelay', '0.001', // <<<--- 這就是關鍵的修改！強制 ffmpeg 立即輸出資料
        'pipe:1'
    ]);

    console.log(`[${remoteAddress}] Spawned FFmpeg process for new connection.`);

    ffmpeg.stderr.on('data', (data) => {
        // Log FFmpeg errors/info for debugging
        console.log(`[FFmpeg - ${remoteAddress}]`, data.toString());
    });
    
    // Pipe the FFmpeg output directly to the WebSocket client
    ffmpeg.stdout.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });

    ws.on('close', () => {
        console.log(`[${new Date().toLocaleTimeString()}] WebSocket connection from ${remoteAddress} closed.`);
        // Terminate the FFmpeg process when the client disconnects
        ffmpeg.kill();
        console.log(`[${remoteAddress}] Killed associated FFmpeg process.`);
    });
    
    ws.on('error', (error) => {
        console.error(`[WebSocket Error - ${remoteAddress}]`, error);
        ffmpeg.kill(); // Ensure FFmpeg process is killed on WebSocket error
    });

    ffmpeg.on('close', (code) => {
        console.log(`[FFmpeg - ${remoteAddress}] process exited with code ${code}`);
        // Ensure WebSocket is closed if FFmpeg process terminates unexpectedly
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    });
});

// API routes (optional, kept from original code)
app.get('/streams', (req, res) => {
    res.json(['camera1']);
});

app.get('/stream/:id/status', (req, res) => {
    res.json({ status: 'active' });
});

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
});

// Start the server
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
    console.log(`Stream server (HTTP & WebSocket) running on port ${PORT}`);
});


const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const https = require('https'); // Use https for wss
const http = require('http');
const path = require('path');
const fs = require('fs'); // Use fs to read certificate files

const app = express();
app.use(cors({ origin: '*' }));

// --- SSL Certificate Configuration ---
// This part reads the self-signed certificate you generated.
// Make sure you have run the openssl command to create these files in the /certs directory.
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem'))
};

// Create an HTTPS server instead of an HTTP server
const server = https.createServer(httpsAptions, app);

// Attach the WebSocket server to the HTTPS server.
// This automatically handles wss:// connections.
const wss = new WebSocket.Server({ server });

const rtspUrl = 'rtsp://wang1567:15671567@192.168.88.101:554/stream1';
console.log(`[Config] Configured RTSP URL: ${rtspUrl}`);

wss.on('connection', (ws, req) => {
    const remoteAddress = req.socket.remoteAddress;
    console.log(`[${new Date().toLocaleTimeString()}] New Secure WebSocket (WSS) connection from ${remoteAddress}`);

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

    console.log(`[FFmpeg] Spawned new FFmpeg process for connection ${remoteAddress}.`);

    ffmpeg.stderr.on('data', (data) => {
        // console.log(`[FFmpeg stderr - ${remoteAddress}]`, data.toString());
    });
    
    ffmpeg.stdout.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });

    ws.on('close', () => {
        console.log(`[WebSocket] Connection from ${remoteAddress} has closed.`);
        ffmpeg.kill();
        console.log(`[FFmpeg] Terminated FFmpeg process for connection ${remoteAddress}.`);
    });
    
    ws.on('error', (error) => {
        console.error(`[WebSocket Error - ${remoteAddress}]`, error);
        ffmpeg.kill();
    });

    ffmpeg.on('close', (code) => {
        console.log(`[FFmpeg] Process for connection ${remoteAddress} exited with code ${code}`);
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    });
});

app.get('/', (req, res) => {
    res.send('Secure Stream server is running. You are likely seeing this page because you are accepting a self-signed certificate.');
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
    // Note: The server is now HTTPS/WSS
    console.log(`Secure Stream server (HTTPS & WSS) is running on port ${PORT}`);
});


const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const app = express();

// Allow all origins to simplify cross-origin issues in a development environment.
app.use(cors({ origin: '*' }));

const server = http.createServer(app);

// Attach the WebSocket server to the HTTP server.
const wss = new WebSocket.Server({ server });

// The correct RTSP address for the camera.
// Ensure the IP address and credentials here are correct.
const rtspUrl = 'rtsp://wang1567:15671567@192.168.88.101:554/stream1';

console.log(`[Config] Configured RTSP URL: ${rtspUrl}`);

// WebSocket connection handling.
wss.on('connection', (ws, req) => {
    const remoteAddress = req.socket.remoteAddress;
    console.log(`[${new Date().toLocaleTimeString()}] New WebSocket (WS) connection from ${remoteAddress}`);

    // For each new client connection, spawn a new FFmpeg process.
    const ffmpeg = spawn('ffmpeg', [
        '-rtsp_transport', 'tcp',        // Prioritize TCP transport for stability.
        '-i', rtspUrl,                   // Input RTSP stream.
        '-f', 'mpegts',                  // Output format is MPEG-TS.
        '-codec:v', 'mpeg1video',        // Output video codec is mpeg1.
        '-s', '1280x720',                // Output resolution.
        '-b:v', '1000k',                 // Video bitrate.
        '-bf', '0',                      // Disable B-frames to reduce latency.
        '-r', '30',                      // Frame rate.
        '-muxdelay', '0.001',            // Key: Very low multiplexing delay for real-time output.
        'pipe:1'                         // Pipe the output to standard output (stdout).
    ]);

    console.log(`[FFmpeg] Spawned new FFmpeg process for connection ${remoteAddress}.`);

    // Listen to FFmpeg's standard error output (for debugging).
    ffmpeg.stderr.on('data', (data) => {
        // This can be very verbose, so it's commented out by default.
        // console.log(`[FFmpeg stderr - ${remoteAddress}]`, data.toString());
    });
    
    // Listen to FFmpeg's standard output (which is the video data).
    ffmpeg.stdout.on('data', (data) => {
        // If the WebSocket is still open, send the data.
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });

    // When the WebSocket connection closes.
    ws.on('close', () => {
        console.log(`[WebSocket] Connection from ${remoteAddress} has closed.`);
        ffmpeg.kill(); // Terminate the corresponding FFmpeg process to free up resources.
        console.log(`[FFmpeg] Terminated FFmpeg process for connection ${remoteAddress}.`);
    });
    
    // When the WebSocket encounters an error.
    ws.on('error', (error) => {
        console.error(`[WebSocket Error - ${remoteAddress}]`, error);
        ffmpeg.kill();
    });

    // When the FFmpeg process exits.
    ffmpeg.on('close', (code) => {
        console.log(`[FFmpeg] Process for connection ${remoteAddress} exited with code ${code}`);
        // If the WebSocket is still open, close it.
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    });
});

app.get('/', (req, res) => {
    res.send('Stream server is running.');
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
    console.log(`Stream server (HTTP & WS) is running on port ${PORT}`);
});

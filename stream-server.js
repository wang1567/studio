
const express = require('express');
const cors = require('cors');
const http = require('http');
const { spawn } = require('child_process');

const app = express();
const port = 8082;

// --- Configuration ---
// 使用 ngrok 建立的公開 TCP 位址
const rtspUrl = 'rtsp://0.tcp.jp.ngrok.io:11783/stream1';
console.log(`[Config] Configured RTSP URL: ${rtspUrl}`);

app.use(cors());

app.get('/stream', (req, res) => {
  console.log('[Request] Received new stream request.');

  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=--ffmpeg-boundary',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const ffmpegCommand = [
    '-rtsp_transport', 'tcp',
    '-i', rtspUrl,
    '-f', 'mjpeg',
    '-q:v', '7', // Quality level, 2-31, lower is better
    '-r', '15', // Frame rate
    '-s', '640x480', // Video size
    'pipe:1'
  ];

  const ffmpeg = spawn('ffmpeg', ffmpegCommand);
  console.log('[FFmpeg] Spawning FFmpeg process...');

  ffmpeg.stdout.on('data', (data) => {
    res.write('--ffmpeg-boundary\r\n');
    res.write('Content-Type: image/jpeg\r\n');
    res.write(`Content-Length: ${data.length}\r\n`);
    res.write('\r\n');
    res.write(data, 'binary');
    res.write('\r\n');
  });

  ffmpeg.stderr.on('data', (data) => {
    // Log FFmpeg errors/warnings to the server console for debugging
    console.error(`[FFmpeg STDERR]: ${data.toString()}`);
  });

  ffmpeg.on('close', (code) => {
    console.log(`[FFmpeg] Process exited with code ${code}`);
    res.end();
  });

  req.on('close', () => {
    console.log('[Request] Client disconnected, killing FFmpeg process.');
    ffmpeg.kill();
  });
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`[Server] MJPEG Stream server is running on http://localhost:${port}`);
  console.log(`[Server] Access the stream at http://localhost:${port}/stream`);
});

server.on('error', (err) => {
    console.error('[Server Error]', err);
});

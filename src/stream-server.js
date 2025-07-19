
const express = require('express');
const cors = require('cors');
const http = require('http');
const { spawn } = require('child_process');

const app = express();
const port = 8082; // This server runs on your LOCAL machine now.

// --- LOCAL Configuration ---
// This URL points to your LOCAL camera's RTSP stream.
const rtspUrl = 'rtsp://192.168.88.101:554/stream1';
console.log(`[Config] Configured to connect to LOCAL RTSP URL: ${rtspUrl}`);

app.use(cors());

app.get('/stream', (req, res) => {
  console.log('[Request] Received new stream request.');

  res.writeHead(200, {
    // This Content-Type is for a Motion JPEG stream.
    'Content-Type': 'multipart/x-mixed-replace; boundary=--ffmpeg-boundary',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Pragma': 'no-cache',
    'Expires': '0',
  });

  const ffmpegCommand = [
    '-hide_banner',
    '-rtsp_transport', 'tcp',
    '-stimeout', '5000000',
    '-i', rtspUrl,
    '-f', 'mjpeg',
    '-q:v', '7',
    '-r', '15',
    '-s', '640x480',
    'pipe:1'
  ];

  const ffmpeg = spawn('ffmpeg', ffmpegCommand);
  console.log('[FFmpeg] Spawning FFmpeg process to connect to local camera...');

  ffmpeg.stdout.on('data', (data) => {
    res.write('--ffmpeg-boundary\r\n');
    res.write('Content-Type: image/jpeg\r\n');
    res.write(`Content-Length: ${data.length}\r\n`);
    res.write('\r\n');
    res.write(data, 'binary');
    res.write('\r\n');
  });

  ffmpeg.stderr.on('data', (data) => {
    console.error(`[FFmpeg STDERR]: ${data.toString()}`);
  });

  ffmpeg.on('close', (code) => {
    console.log(`[FFmpeg] Process exited with code ${code}`);
    if (!res.writableEnded) {
      res.end();
    }
  });

  req.on('close', () => {
    console.log('[Request] Client disconnected, killing FFmpeg process.');
    ffmpeg.kill();
  });
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`[Server] LOCAL MJPEG Stream server is running on http://localhost:${port}`);
  console.log(`[Instructions] Now, in another terminal, run: ngrok http ${port}`);
});

server.on('error', (err) => {
    console.error('[Server Error]', err);
});

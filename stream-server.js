
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const http = require('http');

const app = express();
app.use(cors({ origin: '*' }));

// The RTSP URL of your camera stream.
// Replace with your actual RTSP URL if different.
const rtspUrl = 'rtsp://wang1567:15671567@192.168.88.101:554/stream1';
console.log(`[Config] Configured RTSP URL: ${rtspUrl}`);

// Endpoint for the MJPEG stream
app.get('/', (req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] New stream request from ${req.socket.remoteAddress}`);

  // Set headers for MJPEG stream
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=--ffmpeg-boundary',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Pragma': 'no-cache',
  });

  // Spawn FFmpeg process
  const ffmpeg = spawn('ffmpeg', [
    '-rtsp_transport', 'tcp', // Use TCP for more reliable transport
    '-i', rtspUrl,           // Input from RTSP stream
    '-f', 'mjpeg',           // Output format: Motion JPEG
    '-q:v', '7',             // Video quality (2-31, lower is better)
    '-s', '1280x720',        // Output resolution
    '-r', '15',              // Frame rate
    '-'                      // Output to stdout
  ]);

  console.log(`[FFmpeg] Spawned new FFmpeg process for connection ${req.socket.remoteAddress}.`);
  
  // Pipe FFmpeg's output to the response
  ffmpeg.stdout.on('data', (data) => {
    // Write the boundary and the JPEG data
    res.write('--ffmpeg-boundary\r\n');
    res.write('Content-Type: image/jpeg\r\n');
    res.write(`Content-Length: ${data.length}\r\n`);
    res.write('\r\n');
    res.write(data, 'binary');
    res.write('\r\n');
  });

  ffmpeg.stderr.on('data', (data) => {
    // Log FFmpeg errors for debugging, but don't overwhelm the console
    // console.log(`[FFmpeg stderr - ${req.socket.remoteAddress}]`, data.toString());
  });

  // Handle client disconnect
  req.on('close', () => {
    console.log(`[HTTP] Connection from ${req.socket.remoteAddress} has closed.`);
    ffmpeg.kill();
    console.log(`[FFmpeg] Terminated FFmpeg process for connection ${req.socket.remoteAddress}.`);
  });

  // Handle FFmpeg process exit
  ffmpeg.on('close', (code) => {
    console.log(`[FFmpeg] Process for connection ${req.socket.remoteAddress} exited with code ${code}`);
    res.end();
  });
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
});

// Use a dedicated port for the MJPEG stream to avoid conflicts.
const PORT = 8082;
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`MJPEG Stream server is running on http://localhost:${PORT}`);
});

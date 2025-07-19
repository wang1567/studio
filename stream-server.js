
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const http = require('http');

const app = express();
app.use(cors({ origin: '*' }));

// The RTSP URL of your camera stream.
// It's HIGHLY recommended to use an environment variable for this.
// Your camera's RTSP URL must be accessible from where this server is running.
// If this server is in the cloud, a private IP (e.g., 192.168.x.x) will NOT work.
const rtspUrl = process.env.RTSP_URL || 'rtsp://wang1567:15671567@192.168.88.101:554/stream1';
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
  ], { detached: false });

  console.log(`[FFmpeg] Spawned new FFmpeg process (PID: ${ffmpeg.pid}) for connection ${req.socket.remoteAddress}.`);
  
  // Pipe FFmpeg's output to the response
  ffmpeg.stdout.on('data', (data) => {
    try {
      res.write('--ffmpeg-boundary\r\n');
      res.write('Content-Type: image/jpeg\r\n');
      res.write(`Content-Length: ${data.length}\r\n`);
      res.write('\r\n');
      res.write(data, 'binary');
      res.write('\r\n');
    } catch (error) {
      console.error(`[HTTP Write Error] Failed to write to response for ${req.socket.remoteAddress}. Client might have disconnected.`, error.message);
      ffmpeg.kill('SIGKILL');
    }
  });

  ffmpeg.stderr.on('data', (data) => {
    // Log FFmpeg errors for debugging. This is crucial for diagnosing RTSP issues.
    console.error(`[FFmpeg stderr - PID: ${ffmpeg.pid}] ${data.toString()}`);
  });

  // Handle client disconnect
  req.on('close', () => {
    console.log(`[HTTP] Connection from ${req.socket.remoteAddress} has closed.`);
    ffmpeg.kill('SIGKILL');
    console.log(`[FFmpeg] Terminated FFmpeg process (PID: ${ffmpeg.pid}) due to client disconnect.`);
  });

  // Handle FFmpeg process exit
  ffmpeg.on('close', (code, signal) => {
    console.log(`[FFmpeg] Process (PID: ${ffmpeg.pid}) exited with code ${code} and signal ${signal}`);
    if (!res.writableEnded) {
      res.end();
    }
  });

  ffmpeg.on('error', (err) => {
    console.error(`[FFmpeg] Failed to start subprocess (PID: ${ffmpeg.pid}).`, err);
     if (!res.writableEnded) {
      res.end();
    }
  });
});

process.on('uncaughtException', (error) => {
    console.error('[FATAL] Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('[FATAL] Unhandled Promise Rejection:', error);
});

// Use a dedicated port for the MJPEG stream to avoid conflicts.
const PORT = 8082;
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`MJPEG Stream server is running on http://localhost:${PORT}`);
    console.log(`Accessible from other devices at http://<YOUR_IP_ADDRESS>:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[FATAL] Port ${PORT} is already in use. Please stop the other process or choose a different port.`);
    process.exit(1);
  } else {
    console.error('[FATAL] Server error:', err);
  }
});

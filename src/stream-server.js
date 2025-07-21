// This file is now located at /pawsconnect/src/stream-server.js

// Import the necessary package.
const Stream = require('node-rtsp-stream');

// --- Configuration ---
const rtspUrl = 'rtsp://wang1567:15671567@192.168.88.103:554/stream1';
const streamPort = 8082; // The port for the new server.
const webSocketPort = 8083; // The WebSocket port required by the package.

// Create the stream instance.
const stream = new Stream({
  name: 'PawsConnect Stream',
  streamUrl: rtspUrl,
  wsPort: webSocketPort,
  // These are the ffmpeg options. We are explicitly setting the quality.
  ffmpegOptions: { 
    '-stats': '',
    '-r': 30, // 30 frames per second
    '-q:v': 7 // Video quality (lower is better, 7 is a good balance)
  }
});

console.log(`[Server] MJPEG Stream server is starting on port ${streamPort}`);
console.log(`[Config] Attempting to connect to LOCAL RTSP URL: ${rtspUrl.replace(/:.*@/, '://****:****@')}`);
console.log(`[Info] WebSocket server for the stream is on port ${webSocketPort}`);

// The stream object itself handles the HTTP server creation.
// When a client connects to http://localhost:8082/
// it will receive the MJPEG stream.

stream.on('camdata', (data) => {
  // This event is fired when video data is received from the camera.
  // We can leave this empty for now. The package handles the piping.
});

stream.on('exitWithError', () => {
    console.error('[FFmpeg Error] FFmpeg process exited with an error. This is often due to an incorrect RTSP URL, wrong credentials, or a network issue with the camera.');
    // Stop the stream to prevent further errors.
    stream.stop(); 
});


console.log("\n--- NGROK & USAGE INSTRUCTIONS ---");
console.log("1. This script now creates its own MJPEG server. You do NOT need a separate server file.");
console.log(`2. In another terminal, run: ngrok http ${streamPort} --host-header="localhost:${streamPort}"`);
console.log("3. Copy the 'Forwarding' URL from ngrok (e.g., https://abcd-1234.ngrok-free.app).");
console.log("4. *** CRITICAL STEP ***: The stream is now at the ROOT path. Open that URL directly in your BROWSER to authorize and test.");
console.log("   Example: https://abcd-1234.ngrok-free.app (NO /live_stream.mjpg at the end)");
console.log("5. After testing, you MUST update the frontend code to reflect this new URL structure.");
console.log("6. For now, let's just get the stream working in the browser first.\n");

const Stream = require('node-rtsp-stream');

// --- IMPORTANT ---
// Please ensure your camera's RTSP URL is correct, including username and password.
const rtspUrl = 'rtsp://wang1567:15671567@192.168.88.103:554/stream1';
const streamPort = 8082; // The port this server will listen on for WebSocket connections
const streamName = 'live_stream'; // A unique name for your stream

console.log(`[Config] Attempting to connect to LOCAL RTSP URL: ${rtspUrl.replace(/:.*@/, '://****:****@')}`);

const stream = new Stream({
  name: streamName,
  streamUrl: rtspUrl,
  wsPort: streamPort,
  ffmpegOptions: {
    '-stats': '', // Print encoding progress/statistics
    '-r': 30,    // Set frame rate
    '-q:v': 7,   // Set video quality (1-31, lower is better)
  },
});

stream.on('camdata', (data) => {
  // This event is triggered when video data is received from the camera.
  // We don't need to do anything here, the package handles the streaming.
});

stream.on('ffmpegError', (data) => {
  // This event is triggered when ffmpeg encounters an error.
  console.error('[FFmpeg Error]', data.toString());
});

console.log(`[Server] WebSocket/MJPEG stream server is starting on port ${streamPort}`);
console.log(`[Server] Once running, the MJPEG stream will be available at: http://localhost:${streamPort}/${streamName}.mjpg`);
console.log("\n--- NGROK INSTRUCTIONS ---");
console.log(`1. In another terminal, run: ngrok http ${streamPort} --host-header="localhost:${streamPort}"`);
console.log("2. Copy the 'Forwarding' URL (e.g., https://abcd-1234.ngrok-free.app).");
console.log("3. *** CRITICAL STEP ***: Open that URL + '/live_stream.mjpg' in your BROWSER to authorize and test.");
console.log("   Example: https://abcd-1234.ngrok-free.app/live_stream.mjpg");
console.log("4. After testing, copy the base URL (without the path) and paste it into the Supabase 'live_stream_url' field.");
console.log("5. Refresh the PawsConnect app. The stream should now work.\n");

// Note: The package automatically starts the stream and server.
// If you encounter issues, check the console for [FFmpeg Error] messages.

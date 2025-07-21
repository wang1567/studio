// This is the final, consolidated stream server.
// To run this server:
// 1. Open a terminal IN THIS FOLDER (stream-server).
// 2. Run 'npm install' ONE TIME to install dependencies.
// 3. Run 'npm start' to start the server.

const Stream = require('node-rtsp-stream');

// --- Configuration ---
// IMPORTANT: Replace with your actual camera's RTSP URL, including username and password.
const rtspUrl = 'rtsp://wang1567:15671567@192.168.88.103:554/stream1';

const streamPort = 8082;
const webSocketPort = 8083; // Required by the package, but we won't use it directly.

console.log(`[Config] Attempting to connect to LOCAL RTSP URL: ${rtspUrl.replace(/:.*@/, '://****:****@')}`);

const stream = new Stream({
    name: 'PawsConnect Live Stream',
    streamUrl: rtspUrl,
    wsPort: webSocketPort,
    // These are the ffmpeg options. We are explicitly setting the quality for stability.
    ffmpegOptions: {
        '-stats': '',
        '-r': 30, // 30 frames per second
        '-q:v': 7 // Video quality (lower is better, 7 is a good balance)
    }
});

stream.on('exitWithError', () => {
    console.error('[FFmpeg Error] The FFmpeg process exited with an error. This is often due to an incorrect RTSP URL, wrong credentials, or a network issue with the camera.');
    stream.stop();
});

console.log(`[Server] MJPEG Stream server is starting on port ${streamPort}`);
console.log(`[Info]   The stream will be available at http://localhost:${streamPort}`);
console.log(`[Info]   WebSocket server (for internal use) is on port ${webSocketPort}`);
console.log('\n--- NGROK & USAGE INSTRUCTIONS ---');
console.log("1. This script creates its own MJPEG server. You do NOT need a separate server file.");
console.log(`2. In another terminal, run: ngrok http ${streamPort} --host-header="localhost:${streamPort}"`);
console.log("3. Copy the 'Forwarding' URL from ngrok (e.g., https://abcd-1234.ngrok-free.app).");
console.log("4. *** CRITICAL STEP ***: Open that URL directly in your BROWSER to authorize and test.");
console.log("   Example: https://abcd-1234.ngrok-free.app (NO path at the end)");
console.log("5. After testing, update the 'live_stream_url' in your database to this new ngrok URL.");
console.log("6. Refresh the PawsConnect app. The video should now appear.");


const express = require('express');
const cors = require('cors');
const http = require('http');
const { spawn } = require('child_process');

const app = express();
const port = 8082; // This server runs on your LOCAL machine.

// --- LOCAL Configuration ---
// This URL points to your LOCAL camera's RTSP stream.
const rtspUrl = 'rtsp://wang1567:15671567@192.168.88.103:554/stream1';
console.log(`[Config] Attempting to connect to LOCAL RTSP URL: ${rtspUrl.replace(/:.*@/, '://****:****@')}`);

app.use(cors());

// This is the single endpoint that serves the MJPEG stream.
app.get('/live_stream.mjpg', (req, res) => {
    console.log('[Request] Received new stream request.');

    // Set the proper headers for an MJPEG stream.
    res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=--ffmpeg-boundary',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache', // Important for preventing caching
        'Expires': '0', // Important for preventing caching
    });

    // Spawn an FFmpeg process.
    // This is the most robust command:
    // -rtsp_transport tcp: Forces a more reliable connection method.
    // -i rtspUrl: Specifies the input stream.
    // -an: Disables audio.
    // -c:v mjpeg: Forces re-encoding to MJPEG format. This is the KEY FIX.
    // -q:v 7: Sets a reasonable video quality (lower is better).
    // -f mjpeg: Specifies the output container format.
    // pipe:1: Outputs the stream to stdout.
    const ffmpegCommand = [
        '-rtsp_transport', 'tcp',
        '-i', rtspUrl,
        '-an',
        '-c:v', 'mjpeg', // Force re-encoding to MJPEG
        '-q:v', '7',
        '-f', 'mjpeg',
        'pipe:1'
    ];

    const ffmpeg = spawn('ffmpeg', ffmpegCommand, { stdio: ['ignore', 'pipe', 'pipe'] });
    console.log('[FFmpeg] Spawning FFmpeg process...');

    // Pipe the FFmpeg's output (the video data) to the client's response.
    ffmpeg.stdout.on('data', (data) => {
        // This check is important. We only write if the connection is still open.
        if (!res.writableEnded) {
            res.write('--ffmpeg-boundary\r\n');
            res.write('Content-Type: image/jpeg\r\n');
            res.write(`Content-Length: ${data.length}\r\n`);
            res.write('\r\n');
            res.write(data, 'binary');
            res.write('\r\n');
        }
    });

    // Log any errors from FFmpeg to the console for debugging.
    ffmpeg.stderr.on('data', (data) => {
        console.error(`[FFmpeg STDERR]: ${data.toString()}`);
    });

    // When the FFmpeg process closes, end the response.
    ffmpeg.on('close', (code) => {
        console.log(`[FFmpeg] Process exited with code ${code}`);
        if (!res.writableEnded) {
            res.end();
        }
    });

    // If the client disconnects, make sure to kill the FFmpeg process.
    req.on('close', () => {
        console.log('[Request] Client disconnected, killing FFmpeg process.');
        ffmpeg.kill();
    });
});

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`[Server] CUSTOM MJPEG Stream server is running on http://localhost:${port}`);
    console.log("\n--- NGROK INSTRUCTIONS ---");
    console.log("1. In another terminal, run: ngrok http 8082 --host-header=\"localhost:8082\"");
    console.log("2. Copy the 'Forwarding' URL (e.g., https://abcd-1234.ngrok-free.app).");
    console.log("3. *** CRITICAL STEP ***: Open that URL + '/live_stream.mjpg' in your BROWSER to authorize and test.");
    console.log("   Example: https://abcd-1234.ngrok-free.app/live_stream.mjpg");
    console.log("4. After testing, copy the base URL (without the path) and paste it into the Supabase 'live_stream_url' field.");
    console.log("5. Refresh the PawsConnect app. The stream should now work.\n");
});

server.on('error', (err) => {
    console.error('[Server Error]', err);
});

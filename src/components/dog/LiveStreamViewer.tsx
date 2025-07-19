
"use client";

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, VideoOff } from 'lucide-react';

interface LiveStreamViewerProps {
  streamUrl: string; // Now receives the full public ngrok URL
}

export const LiveStreamViewer = ({ streamUrl }: LiveStreamViewerProps) => {
  const [streamStatus, setStreamStatus] = useState<'loading' | 'active' | 'error'>('loading');
  const [currentStreamUrl, setCurrentStreamUrl] = useState('');

  useEffect(() => {
    // The new server package provides the MJPEG stream at a specific path.
    // The default path is /[stream_name].mjpg
    // We also add a random query param to try and bypass caching.
    if (streamUrl) {
      const url = new URL(streamUrl);
      url.pathname = '/live_stream.mjpg'; // Use the stream name from the server
      url.search = `t=${Date.now()}`;
      setCurrentStreamUrl(url.toString());
    }
  }, [streamUrl]);

  const handleStreamError = () => {
    console.error("Stream error for URL:", currentStreamUrl);
    setStreamStatus('error');
  };
  
  const handleStreamLoad = () => {
    setStreamStatus('active');
  }

  if (!currentStreamUrl) {
     return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-card rounded-lg shadow-inner p-4 text-muted-foreground">
          <VideoOff className="w-8 h-8 mb-4" />
          <p className="text-lg font-semibold">未提供即時影像位址</p>
        </div>
      );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-card rounded-lg shadow-inner p-4">
      {streamStatus === 'loading' && (
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-lg font-semibold">正在連接影像...</p>
          <p className="text-sm">請稍候片刻。</p>
        </div>
      )}

      <img
        src={currentStreamUrl}
        alt="Live Stream"
        onError={handleStreamError}
        onLoad={handleStreamLoad}
        style={{ display: streamStatus === 'active' ? 'block' : 'none' }}
        className="w-full max-w-full max-h-full rounded-md object-contain"
      />

      {streamStatus === 'error' && (
        <Alert variant="destructive" className="max-w-md">
          <VideoOff className="h-4 w-4" />
          <AlertTitle>串流連線失敗</AlertTitle>
          <AlertDescription>
            <p>無法連接至即時影像。</p>
            <p className="mt-2">請確認您本地電腦上的 `node src/stream-server.js` 以及 `ngrok` 指令是否都正在執行中，並且已在瀏覽器中手動授權 ngrok 位址。</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

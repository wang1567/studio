
"use client";

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, VideoOff } from 'lucide-react';

interface LiveStreamViewerProps {
  streamUrl: string;
}

export const LiveStreamViewer = ({ streamUrl }: LiveStreamViewerProps) => {
  const [streamStatus, setStreamStatus] = useState<'loading' | 'active' | 'error'>('loading');

  const handleStreamError = () => {
    setStreamStatus('error');
  };
  
  const handleStreamLoad = () => {
    setStreamStatus('active');
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

      {/* The image tag is always present but hidden until loaded to handle events correctly */}
      <img
        src={streamUrl}
        alt="Live Stream"
        onError={handleStreamError}
        onLoad={handleStreamLoad}
        className={`w-full max-w-full max-h-full rounded-md object-contain ${streamStatus === 'active' ? 'block' : 'hidden'}`}
      />

      {streamStatus === 'error' && (
        <Alert variant="destructive" className="max-w-md">
          <VideoOff className="h-4 w-4" />
          <AlertTitle>串流連線失敗</AlertTitle>
          <AlertDescription>
            <p>無法連接至即時影像。</p>
            <p className="mt-2">這可能是因為後端 `stream-server.js` 服務未啟動，或 ngrok 隧道已中斷。請檢查終端機中的服務狀態。</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

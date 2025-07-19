
"use client";

import type { Dog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, Wifi, WifiOff } from 'lucide-react';
import React, { useRef, useEffect, useState } from 'react';

interface LiveStreamViewerProps {
  dog: Dog;
}

export const LiveStreamViewer = ({ dog }: LiveStreamViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  const originalWebSocketUrl = dog.liveStreamUrl;
  const isStreamAvailable = originalWebSocketUrl && (originalWebSocketUrl.startsWith('ws://') || originalWebSocketUrl.startsWith('wss://'));

  useEffect(() => {
    let player: any = null;
    setError(null);

    if (isStreamAvailable && originalWebSocketUrl && canvasRef.current && typeof window !== 'undefined') {
      import('jsmpeg-player').then((JSMpeg) => {
        const Player = JSMpeg.Player;
        let secureWebSocketUrl = originalWebSocketUrl;

        if (window.location.protocol === 'https:' && originalWebSocketUrl.startsWith('ws://')) {
          secureWebSocketUrl = originalWebSocketUrl.replace('ws://', 'wss://');
        }

        try {
          player = new Player(secureWebSocketUrl, {
            canvas: canvasRef.current,
            autoplay: true,
            audio: false,
            loop: true,
            onPlay: () => console.log('JSMpeg player started for:', secureWebSocketUrl),
            onStalled: () => console.warn('JSMpeg player stalled.'),
            onEnded: () => console.log('JSMpeg player ended.'),
            onSourceEstablished: () => console.log('JSMpeg source established.'),
          });
        } catch (e: any) {
          console.error("Failed to initialize JSMpeg player:", e);
          setError(`無法連接到串流。請確認串流伺服器正在執行且位址正確: ${secureWebSocketUrl} (錯誤: ${e.message})`);
        }
      });
    }

    return () => {
      if (player) {
        try {
          player.destroy();
        } catch (e) {
          console.error("Error destroying JSMpeg player:", e);
        }
      }
    };
  }, [isStreamAvailable, originalWebSocketUrl, dog.id]);


  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader className="bg-secondary/50 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-xl font-headline">
          <Video className="h-6 w-6 text-primary" />
          即時影像
        </CardTitle>
        <CardDescription>與 {dog.name} 進行視訊互動！</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4 flex-grow flex flex-col">
        <div 
          className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden w-full flex-grow relative"
          data-ai-hint="security camera"
        >
          {isStreamAvailable && (
            <canvas ref={canvasRef} className="w-full h-full object-cover" />
          )}
          {!isStreamAvailable && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-center p-4">
                  <WifiOff className="h-12 w-12 text-muted-foreground mb-4"/>
                  <h3 className="text-lg font-semibold">即時影像目前無法使用</h3>
                  <p className="text-sm text-muted-foreground">
                    此狗狗目前沒有設定有效的即時影像串流。
                  </p>
              </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/80 text-center p-4 rounded-md">
                <WifiOff className="h-12 w-12 text-destructive-foreground mb-4"/>
                <h3 className="text-lg font-semibold text-destructive-foreground">串流錯誤</h3>
                <p className="text-sm text-destructive-foreground/90">
                  {error}
                </p>
            </div>
          )}
        </div>
        <Alert>
            <Wifi className="h-4 w-4" />
            <AlertTitle>關於即時影像</AlertTitle>
            <AlertDescription>
              此功能透過後端服務將攝影機畫面轉碼並播放。請在資料庫中為狗狗設定有效的 live_stream_url (例如 'ws://192.168.1.10:8081') 來啟用此功能。
            </AlertDescription>
          </Alert>
      </CardContent>
    </Card>
  );
};

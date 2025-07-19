
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
  const playerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Directly connect to the fixed streaming server address.
  const fixedWebSocketUrl = 'ws://192.168.137.75:8081';

  useEffect(() => {
    // Reset state for the new dog
    setError(null);
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    if (canvasRef.current && typeof window !== 'undefined') {
      import('jsmpeg-player').then((JSMpeg) => {
        const Player = JSMpeg.Player;

        // Automatically switch to secure wss if the page is loaded over https
        let secureWebSocketUrl = fixedWebSocketUrl;
        if (window.location.protocol === 'https:' && fixedWebSocketUrl.startsWith('ws://')) {
          secureWebSocketUrl = fixedWebSocketUrl.replace('ws://', 'wss://');
          console.log(`[LiveStream] Page is secure, attempting to connect to: ${secureWebSocketUrl}`);
        }

        try {
          console.log(`[LiveStream] Initializing JSMpeg player for URL: ${secureWebSocketUrl}`);
          
          const player = new Player(secureWebSocketUrl, {
            canvas: canvasRef.current,
            autoplay: true,
            audio: false,
            loop: true,
            onPlay: () => console.log(`[LiveStream] Player started for: ${secureWebSocketUrl}`),
            onStalled: () => console.warn('[LiveStream] Player stalled.'),
            onEnded: () => console.log('[LiveStream] Player ended.'),
            onSourceEstablished: () => console.log('[LiveStream] Source established.'),
            onError: (e: any) => {
                console.error('[LiveStream] Player error:', e);
                setError(`播放器發生錯誤: ${e.message || '未知錯誤'}`);
            }
          });
          
          playerRef.current = player;

        } catch (e: any) {
          console.error("[LiveStream] Failed to initialize JSMpeg player:", e);
          setError(`無法建立播放器。請確認串流伺服器正在執行且位址正確。 (錯誤: ${e.message})`);
        }
      });
    }

    // Cleanup function to destroy the player when the component unmounts or the dog changes
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
          console.log('[LiveStream] JSMpeg player destroyed on cleanup.');
        } catch (e) {
          console.error("[LiveStream] Error destroying JSMpeg player during cleanup:", e);
        } finally {
          playerRef.current = null;
        }
      }
    };
  }, [dog.id]); // Re-run effect when the dog ID changes


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
          <canvas 
            ref={canvasRef} 
            className="w-full h-full object-cover"
            style={{ display: !error ? 'block' : 'none' }}
          />
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/80 text-center p-4 rounded-md">
                <WifiOff className="h-12 w-12 text-destructive-foreground mb-4"/>
                <h3 className="text-lg font-semibold text-destructive-foreground">串流錯誤</h3>
                <p className="text-sm text-destructive-foreground/90 max-w-full break-words px-2">
                  {error}
                </p>
            </div>
          )}
        </div>
        <Alert>
            <Wifi className="h-4 w-4" />
            <AlertTitle>關於即時影像</AlertTitle>
            <AlertDescription>
              此功能將嘗試連接至一個獨立的後端串流服務。請確保該服務正在運作，並且網路連線是通暢的。
            </AlertDescription>
          </Alert>
      </CardContent>
    </Card>
  );
};

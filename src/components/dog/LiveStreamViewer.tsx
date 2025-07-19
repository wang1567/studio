
"use client";

import type { Dog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, WifiOff, Loader2 } from 'lucide-react';
import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// We are dynamically importing jsmpeg-player only on the client-side.
let JSMpeg: any = null;
if (typeof window !== 'undefined') {
  import('jsmpeg-player').then(module => {
    JSMpeg = module.default || module;
  }).catch(err => {
    console.error("Failed to load jsmpeg-player:", err);
  });
}

interface LiveStreamViewerProps {
  dog: Dog;
}

export const LiveStreamViewer = ({ dog }: LiveStreamViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- 重要設定 ---
  // 這是在您本地網路上執行 stream-server.js 的電腦的 IP 位址。
  // 我們已經根據您的 `ipconfig` 輸出，將其設定為正確的值。
  const streamServerIp = '192.168.88.103'; 
  const streamServerPort = 8081;
  // --- 設定結束 ---

  useEffect(() => {
    // Reset state for the new dog
    setError(null);
    setIsLoading(true);

    const cleanup = () => {
      if (playerRef.current) {
        try {
          console.log('[LiveStream] Attempting to destroy player instance...');
          playerRef.current.destroy();
          playerRef.current = null;
          console.log('[LiveStream] JSMpeg player instance destroyed.');
        } catch (e) {
          console.error("[LiveStream] Failed to destroy player instance during cleanup:", e);
        }
      }
    };

    // If the library hasn't loaded yet, wait.
    if (!JSMpeg) {
        const timeoutId = setTimeout(() => {
            // Trigger a re-render to retry
            setIsLoading(prev => !prev); 
            setIsLoading(prev => !prev);
        }, 200);
        return () => clearTimeout(timeoutId);
    }
    
    // Check if canvas is ready
    if (!canvasRef.current) {
        console.warn("[LiveStream] Canvas ref is not ready yet.");
        return;
    }

    let webSocketUrl = `ws://${streamServerIp}:${streamServerPort}`;
    // If the page is loaded over HTTPS, we must use WSS.
    if (window.location.protocol === 'https:') {
      webSocketUrl = `wss://${streamServerIp}:${streamServerPort}`;
    }

    console.log(`[LiveStream] Preparing to initialize JSMpeg player for dog ${dog.id}. Target URL: ${webSocketUrl}`);
    
    try {
      // Ensure we have the correct constructor
      const Player = JSMpeg.Player;
      if (!Player) {
        throw new Error("JSMpeg.Player is not available. The module might not have loaded correctly.");
      }
      
      const player = new Player(webSocketUrl, {
        canvas: canvasRef.current,
        autoplay: true,
        audio: false,
        loop: true,
        onPlay: () => {
            console.log(`[LiveStream] Playback started for: ${webSocketUrl}`);
            setIsLoading(false);
            setError(null);
        },
        onStalled: () => {
            console.warn('[LiveStream] Player stalled. Waiting for data...');
            setIsLoading(true);
        },
        onEnded: () => {
            console.log('[LiveStream] Stream ended.');
        },
        onError: (e: any) => {
            const errorMessage = e?.message || '未知串流錯誤';
            console.error('[LiveStream] Player error:', errorMessage);
            setError(`無法播放串流。請檢查串流伺服器是否在 ${streamServerIp}:${streamServerPort} 正常運作，以及您的網路連線。`);
            setIsLoading(false);
        }
      });
      
      playerRef.current = player;
      
    } catch (e: any) {
      console.error("[LiveStream] Failed to initialize JSMpeg player:", e);
      setError(`建立播放器時發生錯誤: ${e.message}`);
      setIsLoading(false);
    }

    return cleanup;
  }, [dog.id]); // Re-run effect when the dog changes.

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
            className={cn(
                "w-full h-full object-contain transition-opacity duration-300",
                isLoading || error ? "opacity-0" : "opacity-100"
            )}
          />
          
          {isLoading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4"/>
                <h3 className="text-lg font-semibold text-primary">正在連接影像...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  請稍候片刻。
                </p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 text-center p-4 rounded-md">
                <WifiOff className="h-12 w-12 text-destructive mb-4"/>
                <h3 className="text-lg font-semibold text-destructive">串流錯誤</h3>
                <p className="text-sm text-destructive/90 max-w-full break-words px-2">
                  {error}
                </p>
            </div>
          )}
        </div>
        <Alert>
            <AlertTitle>關於即時影像</AlertTitle>
            <AlertDescription>
              此功能將嘗試連接至一個獨立的後端串流服務。請確保該服務正在運作，並且您的網路連線是通暢的。
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};


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

  // --- IMPORTANT CONFIGURATION ---
  // This must be the PUBLIC IP or domain name of the machine running stream-server.js
  const streamServerIp = '34.80.203.111'; 
  const streamServerPort = 8081;
  // --- CONFIGURATION END ---

  useEffect(() => {
    // Reset state for the new dog
    setError(null);
    setIsLoading(true);
    console.log(`[LiveStream] useEffect triggered for dog: ${dog.name} (${dog.id}). State reset.`);

    // ALWAYS use ws://. The browser might block it on an https site,
    // requiring the user to manually allow "insecure content".
    const webSocketUrl = `ws://${streamServerIp}:${streamServerPort}`;
    console.log(`[LiveStream] Attempting to connect to: ${webSocketUrl}`);

    const libraryLoadTimeout = setTimeout(() => {
        if (!JSMpeg) {
          console.error("[LiveStream] JSMpeg library failed to load after timeout.");
          setError("播放器程式庫載入失敗，請重新整理頁面。");
          setIsLoading(false);
        }
      }, 5000);

    if (!JSMpeg || !canvasRef.current) {
        console.warn("[LiveStream] JSMpeg library or canvas not ready yet.");
        return () => clearTimeout(libraryLoadTimeout);
    }

    clearTimeout(libraryLoadTimeout);
    
    let player: any;
    
    try {
      console.log(`[LiveStream] Initializing JSMpeg.Player...`);
      const Player = JSMpeg.Player;
      if (!Player) {
        throw new Error("JSMpeg.Player is not available. The module might not have loaded correctly.");
      }
      
      player = new Player(webSocketUrl, {
        canvas: canvasRef.current,
        autoplay: true,
        audio: false,
        loop: true,
        onPlay: () => {
            console.log(`[LiveStream] SUCCESS: Playback started for: ${webSocketUrl}`);
            setIsLoading(false);
            setError(null);
            playerRef.current = player; // Only assign on successful play
        },
        onStalled: () => {
            console.warn('[LiveStream] Player stalled. Waiting for data...');
            setIsLoading(true);
        },
        onEnded: () => {
            console.log('[LiveStream] Stream ended.');
        },
        onError: (e: any) => {
            const errorMessage = e?.message || (typeof e === 'string' ? e : '未知串流錯誤');
            console.error('[LiveStream] FATAL: Player reported an error:', errorMessage, e);
            setError(`無法連接至影像串流：${errorMessage}。請確認後端伺服器是否正常運作，或在瀏覽器設定中允許不安全的內容。`);
            setIsLoading(false);
        }
      });
      console.log("[LiveStream] JSMpeg.Player instance created. Waiting for 'onPlay' or 'onError' event...");
      
    } catch (e: any) {
      console.error("[LiveStream] FATAL: Failed to initialize JSMpeg player in try-catch block:", e);
      setError(`建立播放器時發生嚴重錯誤: ${e.message}`);
      setIsLoading(false);
    }

    return () => {
      console.log('[LiveStream] Cleanup function called.');
      // Final, most robust cleanup logic:
      // Only destroy the player if the ref was successfully set (meaning onPlay was called)
      // AND if its internal source object exists. This prevents the "Cannot read properties of null (reading 'close')" error.
      if (playerRef.current && playerRef.current.source) {
        try {
          console.log('[LiveStream] Attempting to destroy successfully referenced player instance...');
          playerRef.current.destroy();
          console.log('[LiveStream] Successfully referenced JSMpeg player instance destroyed.');
        } catch (e) {
          console.error("[LiveStream] Failed to destroy referenced player instance during cleanup:", e);
        } finally {
            playerRef.current = null;
        }
      } else {
         console.log("[LiveStream] No valid, referenced player to destroy. Cleanup finished.");
      }
    };
  }, [dog.id, dog.name]); 

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
                  請稍候片刻。若長時間無回應，請確認您的瀏覽器是否允許不安全的內容。
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
              此功能將嘗試使用 `ws://` 協定連接至串流伺服器。若您的網站使用 `https://`，您可能需要在瀏覽器網址列旁點擊「不安全」或鎖頭圖示，並手動**允許載入不安全的內容**。
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

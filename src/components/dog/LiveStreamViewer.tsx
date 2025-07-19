
"use client";

import type { Dog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, WifiOff, Loader2, ShieldAlert } from 'lucide-react';
import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTabsContext } from './TabsContext'; 
import Link from 'next/link';

// Dynamically import jsmpeg-player only on the client-side
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
  
  const { activeTab } = useTabsContext();
  const isTabActive = activeTab === 'live';

  const streamServerPort = 8081;

  useEffect(() => {
    if (!isTabActive || !JSMpeg) {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
            // It's safe to ignore errors during destruction on tab change.
        }
        playerRef.current = null;
      }
      return;
    }

    setError(null);
    setIsLoading(true);

    const streamServerIp = window.location.hostname;
    // --- Use Secure WebSocket (wss://) protocol ---
    const webSocketUrl = `wss://${streamServerIp}:${streamServerPort}`;

    let player: any;

    const timeoutId = setTimeout(() => {
      if (!canvasRef.current) {
          setError("Canvas element is not ready.");
          setIsLoading(false);
          return;
      }
      
      try {
        const Player = JSMpeg.Player;
        if (!Player) {
          throw new Error("JSMpeg.Player is not ready.");
        }
        
        player = new Player(webSocketUrl, {
          canvas: canvasRef.current,
          autoplay: true,
          audio: false,
          loop: true,
          onPlay: () => {
              setIsLoading(false);
              setError(null);
          },
          onStalled: () => {
              setIsLoading(true);
          },
          onError: (e: any) => {
              setError(`無法連接至安全的影像串流。這通常是因為瀏覽器不信任我們的「自我簽署」開發憑證。`);
              setIsLoading(false);
          }
        });
        
        playerRef.current = player;
        
      } catch (e: any) {
        setError(`建立播放器時發生錯誤: ${e.message}`);
        setIsLoading(false);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (playerRef.current && playerRef.current.source && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
           console.error("[LiveStream] Error destroying player during cleanup:", e);
        }
      }
      playerRef.current = null;
    };
  }, [dog.id, isTabActive]);

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader className="bg-secondary/50 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-xl font-headline">
          <Video className="h-6 w-6 text-primary" />
          Live Video
        </CardTitle>
        <CardDescription>與 {dog.name} 進行即時影像互動！</CardDescription>
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
                <h3 className="text-lg font-semibold text-primary">正在連接至安全影像...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  請稍候。如果長時間沒有回應，後端服務或攝影機可能已離線。
                </p>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 text-center p-4 rounded-md">
                <WifiOff className="h-12 w-12 text-destructive mb-4"/>
                <h3 className="text-lg font-semibold text-destructive">串流連線失敗</h3>
                <Alert variant="destructive" className="mt-4 text-left">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>需要您的操作！</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">{error}</p>
                    <p>
                      <strong>解決方法：</strong>
                      請在新分頁中點擊此連結 
                      <Link 
                        href={`https://${typeof window !== 'undefined' ? window.location.hostname : ''}:8081`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-bold text-destructive underline hover:text-destructive/80 mx-1"
                      >
                         信任憑證
                      </Link> 
                       ，在打開的頁面中點擊「進階」，然後選擇「繼續前往... (不安全)」。完成後，回到此頁面並重新整理即可。
                    </p>
                  </AlertDescription>
                </Alert>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};


"use client";

import type { Dog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, WifiOff, Loader2, ShieldAlert } from 'lucide-react';
import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTabsContext } from './TabsContext'; 

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

  const streamServerIp = '34.80.203.111'; 
  const streamServerPort = 8081;

  useEffect(() => {
    if (!isTabActive) {
      if (playerRef.current && playerRef.current.source) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore errors
        }
        playerRef.current = null;
      }
      return;
    }

    setError(null);
    setIsLoading(true);

    // --- 使用安全的 wss:// 協定 ---
    const webSocketUrl = `wss://${streamServerIp}:${streamServerPort}`;
    console.log(`[LiveStream] Attempting to connect to secure WebSocket: ${webSocketUrl}`);

    const libraryLoadTimeout = setTimeout(() => {
        if (!JSMpeg) {
          setError("播放器程式庫載入失敗，請重新整理頁面。");
          setIsLoading(false);
        }
      }, 5000);

    if (!JSMpeg || !canvasRef.current) {
        return () => clearTimeout(libraryLoadTimeout);
    }

    clearTimeout(libraryLoadTimeout);
    
    let player: any;
    
    try {
      const Player = JSMpeg.Player;
      if (!Player) {
        throw new Error("JSMpeg.Player is not available.");
      }
      
      player = new Player(webSocketUrl, {
        canvas: canvasRef.current,
        autoplay: true,
        audio: false,
        loop: true,
        onPlay: () => {
            setIsLoading(false);
            setError(null);
            playerRef.current = player;
        },
        onStalled: () => {
            setIsLoading(true);
        },
        onError: (e: any) => {
            const errorMessage = e?.message || (typeof e === 'string' ? e : '未知串流錯誤');
            console.error('[LiveStream] FATAL: Player reported an error:', errorMessage, e);
            setError(`無法連接至安全影像串流 (WSS)。這可能是因為您使用的是自我簽署憑證。`);
            setIsLoading(false);
        }
      });
      
    } catch (e: any) {
      console.error("[LiveStream] FATAL: Failed to initialize JSMpeg player:", e);
      setError(`建立播放器時發生嚴重錯誤: ${e.message}`);
      setIsLoading(false);
    }

    return () => {
      if (playerRef.current && playerRef.current.source) {
        try {
          playerRef.current.destroy();
        } catch (e) {
            console.error("[LiveStream] Failed to destroy referenced player instance during cleanup:", e);
        } finally {
            playerRef.current = null;
        }
      }
    };
  }, [dog.id, dog.name, isTabActive]);

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader className="bg-secondary/50 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-xl font-headline">
          <Video className="h-6 w-6 text-primary" />
          即時影像
        </CardTitle>
        <CardDescription>與 {dog.name} 進行安全視訊互動！</CardDescription>
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
                <h3 className="text-lg font-semibold text-primary">正在連接安全影像...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  請稍候片刻。第一次連線至使用自我簽署憑證的伺服器可能會需要一些時間。
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
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>關於安全連線 (WSS)</AlertTitle>
            <AlertDescription>
              此功能現在使用安全的 `wss://` 協定。由於我們在開發環境中使用的是**自我簽署憑證**，您的瀏覽器會將其標示為「不安全」。您需要**手動信任此憑證**才能觀看影像。
              <br/>
              **操作方法：**請在新分頁中開啟 <a href={`https://${streamServerIp}:${streamServerPort}`} target="_blank" rel="noopener noreferrer" className="font-bold underline">https://{streamServerIp}:{streamServerPort}</a>，在頁面上點擊「進階」並選擇「繼續前往... (不安全)」。完成後，回到此頁面重新整理即可。
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

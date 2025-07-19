
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
    console.error("無法載入 jsmpeg-player:", err);
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
    // 只有當分頁活躍且 JSMpeg 函式庫已載入時才執行
    if (!isTabActive || !JSMpeg) {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // 在銷毀時忽略錯誤是安全的
        }
        playerRef.current = null;
      }
      return;
    }

    setError(null);
    setIsLoading(true);

    const streamServerIp = window.location.hostname;
    const webSocketUrl = `ws://${streamServerIp}:${streamServerPort}`;

    let player: any;

    // 確保 canvas 已經準備好
    if (!canvasRef.current) {
        setError("Canvas 元素尚未準備好。");
        setIsLoading(false);
        return;
    }
    
    try {
      const Player = JSMpeg.Player;
      if (!Player) {
        throw new Error("JSMpeg.Player 尚未準備好。");
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
            const errorMessage = e?.message || (typeof e === 'string' ? e : '未知錯誤');
            setError(`無法連接至影像串流 (${errorMessage})。請確認後端伺服器是否正常運作，以及防火牆設定。`);
            setIsLoading(false);
        }
      });
      
      playerRef.current = player;
      
    } catch (e: any) {
      setError(`建立播放器時發生錯誤: ${e.message}`);
      setIsLoading(false);
    }

    // 清理函式
    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
           console.error("[LiveStream] 在清理期間銷毀播放器時發生錯誤:", e);
        } finally {
            playerRef.current = null;
        }
      }
    };
  }, [dog.id, isTabActive]);

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
                  請稍候片刻。如果長時間沒有反應，可能表示後端服務或攝影機離線。
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
            <AlertTitle>關於影像無法顯示 (混合內容警告)</AlertTitle>
            <AlertDescription>
              如果持續無法顯示影像，可能是因為您的瀏覽器安全設定阻擋了連線。請在網址列旁找到一個**鎖頭**或**「不安全」**圖示，點擊它，選擇**「網站設定」**，然後將**「不安全的內容」**設定為**「允許」**。完成後，重新整理此頁面即可。
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

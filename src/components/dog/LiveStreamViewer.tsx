
"use client";

import type { Dog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, WifiOff } from 'lucide-react';
import React, { useRef, useEffect, useState } from 'react';

// We are dynamically importing jsmpeg-player only on the client-side.
let JSMpeg: any = null;
if (typeof window !== 'undefined') {
  import('jsmpeg-player').then(module => {
    JSMpeg = module;
  });
}


interface LiveStreamViewerProps {
  dog: Dog;
}

export const LiveStreamViewer = ({ dog }: LiveStreamViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  // --- 重要設定 ---
  // 請將下面的 IP 位址替換成您那台執行 stream-server.js 的電腦的【實際區域網路 IP 位址】。
  // 您可以在該電腦的終端機或命令提示字元中，使用 `ipconfig` (Windows) 或 `ifconfig` (Mac/Linux) 指令來查詢。
  const streamServerIp = '<YOUR_COMPUTER_IP_HERE>'; // 範例: '192.168.1.10'
  // --- 設定結束 ---

  useEffect(() => {
    // 重設狀態，確保每次切換狗狗時都是乾淨的
    setError(null);

    // 清理函式會在 effect 執行前或元件卸載時呼叫
    const cleanup = () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
          console.log('[LiveStream] JSMpeg 播放器已在清理時銷毀。');
        } catch (e) {
          console.error("[LiveStream] 在清理時銷毀播放器失敗:", e);
        } finally {
          playerRef.current = null;
        }
      }
    };
    
    // 如果還沒載入 JSMpeg 模組，則稍後再試
    if (!JSMpeg) {
        const timeoutId = setTimeout(() => {
            // 這會觸發 effect 重新執行
            setError(prev => prev);
        }, 100);
        return () => clearTimeout(timeoutId);
    }
    
    if (streamServerIp === '<YOUR_COMPUTER_IP_HERE>') {
        setError("設定錯誤：請在 LiveStreamViewer.tsx 程式碼中，將 <YOUR_COMPUTER_IP_HERE> 替換成您串流伺服器的實際 IP 位址。");
        return cleanup;
    }

    if (canvasRef.current) {
      let webSocketUrl = `ws://${streamServerIp}:8081`;
      
      // 如果頁面是 HTTPS，自動切換到 WSS
      if (window.location.protocol === 'https:') {
        webSocketUrl = webSocketUrl.replace('ws://', 'wss://');
      }

      console.log(`[LiveStream] 準備初始化 JSMpeg 播放器，目標位址: ${webSocketUrl}`);
      try {
        const Player = JSMpeg.Player;
        if (!Player) {
             throw new Error("JSMpeg.Player is not available. The module might not have loaded correctly.");
        }
        
        const player = new Player(webSocketUrl, {
          canvas: canvasRef.current,
          autoplay: true,
          audio: false,
          loop: true,
          onPlay: () => console.log(`[LiveStream] 播放器已啟動: ${webSocketUrl}`),
          onStalled: () => console.warn('[LiveStream] 播放器停滯。'),
          onEnded: () => console.log('[LiveStream] 播放器已結束。'),
          onError: (e: any) => {
              const errorMessage = e?.message || '未知錯誤';
              console.error('[LiveStream] 播放器錯誤:', errorMessage);
              setError(`無法播放串流。請檢查串流伺服器是否在 ${streamServerIp}:8081 運作，以及防火牆設定。`);
          }
        });
        
        playerRef.current = player;
        
      } catch (e: any) {
        console.error("[LiveStream] 初始化 JSMpeg 播放器失敗:", e);
        setError(`無法建立播放器。錯誤: ${e.message}`);
      }
    }

    return cleanup;
  }, [dog.id, streamServerIp]); // 當 dog.id 或 IP 改變時，重新執行

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
            <AlertTitle>關於即時影像</AlertTitle>
            <AlertDescription>
              此功能將嘗試連接至一個獨立的後端串流服務。請確保該服務正在運作，並且您的網路連線是通暢的。
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};


"use client";

import type { Dog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, Wifi, WifiOff } from 'lucide-react';
import React, { useRef, useEffect } from 'react';

interface LiveStreamViewerProps {
  dog: Dog;
}

export const LiveStreamViewer = ({ dog }: LiveStreamViewerProps) => {
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  
  const webSocketUrl = dog.liveStreamUrl;
  const isStreamAvailable = webSocketUrl && (webSocketUrl.startsWith('ws://') || webSocketUrl.startsWith('wss://'));

  useEffect(() => {
    let player: any = null;
    
    if (isStreamAvailable && webSocketUrl && videoWrapperRef.current && typeof window !== 'undefined') {
      import('jsmpeg-player').then((JSMpeg) => {
        const Player = JSMpeg.default || JSMpeg.Player || JSMpeg;

        if (videoWrapperRef.current) {
          videoWrapperRef.current.innerHTML = '';
          try {
            player = new Player(webSocketUrl, { 
                canvas: videoWrapperRef.current.appendChild(document.createElement('canvas')),
                autoplay: true,
                audio: false,
                loop: true,
                onPlay: () => {
                   if (videoWrapperRef.current?.querySelector('.stream-error')) {
                     videoWrapperRef.current.querySelector('.stream-error')?.remove();
                   }
                }
            });

            if (player.canvas) {
              player.canvas.style.width = '100%';
              player.canvas.style.height = '100%';
              player.canvas.style.objectFit = 'cover';
            }
          } catch(e) {
            console.error("Failed to initialize JSMpeg player:", e);
             if (videoWrapperRef.current) {
                videoWrapperRef.current.innerHTML = `
                  <div class="stream-error absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-center p-4">
                      <h3 class="text-lg font-semibold text-destructive">無法連接到串流</h3>
                      <p class="text-sm text-muted-foreground">
                        請確認串流伺服器正在執行且位址正確: 
                      </p>
                      <p class="text-xs text-muted-foreground mt-1 bg-muted px-2 py-1 rounded-md font-mono">${webSocketUrl}</p>
                  </div>
                `;
            }
          }
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
      if (videoWrapperRef.current) {
        videoWrapperRef.current.innerHTML = '';
      }
    };
  }, [isStreamAvailable, webSocketUrl, dog.id]);


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
          ref={videoWrapperRef}
          className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden w-full flex-grow relative"
          data-ai-hint="security camera"
        >
          {!isStreamAvailable && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-center p-4">
                  <WifiOff className="h-12 w-12 text-muted-foreground mb-4"/>
                  <h3 className="text-lg font-semibold">即時影像目前無法使用</h3>
                  <p className="text-sm text-muted-foreground">
                    此狗狗目前沒有設定有效的即時影像串流。
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

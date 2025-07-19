
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
  
  // The stream is available only if a valid WebSocket URL is provided.
  const isStreamAvailable = dog.liveStreamUrl && (dog.liveStreamUrl.startsWith('ws://') || dog.live_stream_url.startsWith('wss://'));
  const webSocketUrl = dog.liveStreamUrl;

  useEffect(() => {
    let player: any = null;
    
    // Ensure this code only runs on the client and if the stream URL is valid.
    if (isStreamAvailable && webSocketUrl && videoWrapperRef.current && typeof window !== 'undefined') {
      import('jsmpeg-player').then((JSMpeg) => {
        const Player = JSMpeg.default || JSMpeg.Player || JSMpeg;

        if (videoWrapperRef.current) {
          // Clear previous canvas if any
          videoWrapperRef.current.innerHTML = '';
          try {
            player = new Player(webSocketUrl, { 
                canvas: videoWrapperRef.current.appendChild(document.createElement('canvas')),
                autoplay: true,
                audio: false,
                loop: true
            });
            // Style the canvas to fit the container
            if (player.canvas) {
              player.canvas.style.width = '100%';
              player.canvas.style.height = '100%';
              player.canvas.style.objectFit = 'cover';
            }
          } catch(e) {
            console.error("Failed to initialize JSMpeg player:", e);
            // Optionally, display an error in the UI
             if (videoWrapperRef.current) {
                videoWrapperRef.current.innerHTML = `
                  <div class="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-center p-4">
                      <h3 class="text-lg font-semibold text-destructive">無法連接到串流</h3>
                      <p class="text-sm text-muted-foreground">
                        請確認串流伺服器正在執行且位址正確: ${webSocketUrl}
                      </p>
                  </div>
                `;
            }
          }
        }
      });
    }

    // Cleanup on component unmount
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
              此功能透過後端服務將收容所的攝影機畫面轉碼，並以 WebSocket 串流播放。請在資料庫中為狗狗設定有效的 live_stream_url (例如 'ws://localhost:8081') 來啟用。
            </AlertDescription>
          </Alert>
      </CardContent>
    </Card>
  );
};


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
  
  const isStreamAvailable = dog.liveStreamUrl;
  const webSocketUrl = 'ws://localhost:8081'; // URL for the backend WebSocket stream server

  useEffect(() => {
    let player: any = null; // Use 'any' to avoid type issues with dynamic import
    
    // Ensure this code only runs on the client
    if (isStreamAvailable && videoWrapperRef.current && typeof window !== 'undefined') {
      import('jsmpeg-player').then((JSMpeg) => {
        // JSMpeg.default might be needed depending on the library's export structure
        const Player = JSMpeg.default || JSMpeg.Player || JSMpeg;

        if (videoWrapperRef.current) {
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
      // Also clean up the canvas element
      if (videoWrapperRef.current) {
        videoWrapperRef.current.innerHTML = '';
      }
    };
  }, [isStreamAvailable, webSocketUrl]);


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
                    此狗狗目前沒有設定即時影像串流。
                  </p>
              </div>
          )}
        </div>
        <Alert>
            <Wifi className="h-4 w-4" />
            <AlertTitle>關於即時影像</AlertTitle>
            <AlertDescription>
              此功能透過後端服務將收容所的 RTSP 攝影機畫面轉碼，並以 WebSocket 串流播放。
            </AlertDescription>
          </Alert>
      </CardContent>
    </Card>
  );
};

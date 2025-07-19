
"use client";

import type { Dog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, WifiOff, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTabsContext } from './TabsContext'; 

interface LiveStreamViewerProps {
  dog: Dog;
}

export const LiveStreamViewer = ({ dog }: LiveStreamViewerProps) => {
  const [streamState, setStreamState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const { activeTab } = useTabsContext();
  const isTabActive = activeTab === 'live';
  
  // The port the MJPEG stream server is running on.
  const streamServerPort = 8082;
  // Dynamically construct the URL using the current page's hostname.
  const streamUrl = isTabActive 
    ? `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:${streamServerPort}/`
    : '';

  // Reset state when tab becomes inactive or dog changes
  useEffect(() => {
    if (!isTabActive) {
      setStreamState('loading');
    } else {
      setStreamState('loading'); // Start loading when tab becomes active
    }
  }, [isTabActive, dog.id]);

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
          {isTabActive && (
            <img
              key={dog.id} // Add key to force re-render on dog change
              src={streamUrl}
              alt={`Live stream of ${dog.name}`}
              className={cn("w-full h-full object-contain transition-opacity duration-500", 
                streamState === 'loaded' ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setStreamState('loaded')}
              onError={() => setStreamState('error')}
            />
          )}
          
          {streamState === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4"/>
                <h3 className="text-lg font-semibold text-primary">正在連接影像...</h3>
            </div>
          )}
          
          {streamState === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 text-center p-4 rounded-md">
                <WifiOff className="h-12 w-12 text-destructive mb-4"/>
                <Alert variant="destructive" className="mt-4 text-left">
                  <AlertTitle>串流連線失敗</AlertTitle>
                  <AlertDescription>
                    <p>無法連接至即時影像。這通常是網路設定問題：</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>**後端服務未啟動**：請確認 `stream-server.js` 服務已在終端機中啟動且無錯誤。</li>
                      <li>**RTSP位址問題**：後端伺服器無法存取攝影機的RTSP位址。如果您的攝影機在私有內網 (如 `192.168.x.x`)，雲端開發環境將無法連接。您需要提供一個公開的RTSP位址。</li>
                      <li>**瀏覽器安全設定**：請確認瀏覽器已允許載入不安全的內容。</li>
                    </ul>
                  </AlertDescription>
                </Alert>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

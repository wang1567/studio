
"use client";

import type { Dog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, WifiOff, Loader2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
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
  const streamUrl = isTabActive 
    ? `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:${streamServerPort}/`
    : '';

  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isTabActive) {
      setStreamState('loading');
      return;
    }

    const img = imageRef.current;
    if (!img) return;

    const controller = new AbortController();
    const { signal } = controller;

    setStreamState('loading');

    // Use fetch to check if the stream is available.
    fetch(streamUrl, { mode: 'no-cors', signal })
      .then(response => {
        // no-cors means we can't inspect the response, but if it doesn't throw, the server is likely up.
        setStreamState('loaded');
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error("MJPEG stream connection error:", err);
          setStreamState('error');
        }
      });

    return () => {
      controller.abort();
    };
  }, [isTabActive, streamUrl]);

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
              ref={imageRef}
              src={streamUrl}
              alt={`Live stream of ${dog.name}`}
              className={cn("w-full h-full object-contain transition-opacity duration-500", 
                streamState === 'loaded' ? 'opacity-100' : 'opacity-0'
              )}
              // Inline error handling for the img tag itself
              onError={() => setStreamState('error')}
            />
          )}
          
          {streamState === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4"/>
                <h3 className="text-lg font-semibold text-primary">正在連接影像...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  請稍候。如果長時間沒有回應，請確認後端串流服務已啟動。
                </p>
            </div>
          )}
          
          {streamState === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 text-center p-4 rounded-md">
                <WifiOff className="h-12 w-12 text-destructive mb-4"/>
                <Alert variant="destructive" className="mt-4 text-left">
                  <AlertTitle>串流連線失敗</AlertTitle>
                  <AlertDescription>
                    <p>無法連接至即時影像。請確認後端 `stream-server.js` 服務是否已啟動並在運作中。</p>
                  </AlertDescription>
                </Alert>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

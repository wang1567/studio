
"use client";

import type { Dog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, Wifi, WifiOff } from 'lucide-react';
import Image from 'next/image';

interface LiveStreamViewerProps {
  dog: Dog;
}

export const LiveStreamViewer = ({ dog }: LiveStreamViewerProps) => {
  // Browsers do not support RTSP streams directly.
  // We will simulate the live stream view with a placeholder.
  // The actual implementation would require a media server to transcode RTSP to a web-friendly format like HLS or DASH.

  const isStreamAvailable = dog.liveStreamUrl && dog.liveStreamUrl.startsWith('rtsp://');

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
        <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden w-full flex-grow relative">
          {isStreamAvailable ? (
            <>
              {/* This is a placeholder. A real implementation would use a video player component (e.g., video.js, hls.js)
                  and a web-compatible stream URL (HLS/DASH) transcoded from the RTSP source. */}
              <Image 
                src={`https://placehold.co/1280x720.png?text=Tapo+C200+Live+Feed`} 
                alt={`${dog.name} 的即時影像`}
                layout="fill"
                objectFit="cover"
                data-ai-hint="security camera"
              />
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center p-4">
                  <Wifi className="h-12 w-12 text-white/80 mb-4"/>
                  <h3 className="text-lg font-semibold text-white">正在連接收容所攝影機...</h3>
                  <p className="text-sm text-white/70">
                    攝影機型號: Tapo C200
                  </p>
              </div>
            </>
          ) : (
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
              此功能旨在顯示收容所提供的即時攝影機畫面。請注意，由於技術限制，瀏覽器無法直接播放 RTSP 串流。此為功能示意。
            </AlertDescription>
          </Alert>
      </CardContent>
    </Card>
  );
};

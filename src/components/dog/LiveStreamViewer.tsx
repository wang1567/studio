
"use client";

import { useEffect, useRef, useState } from 'react';
import type { Dog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, CameraOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LiveStreamViewerProps {
  dog: Dog;
}

export const LiveStreamViewer = ({ dog }: LiveStreamViewerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setHasCameraPermission(null); 
    
    // Stop any existing stream tracks
    if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }

    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: '瀏覽器不支援',
          description: '您的瀏覽器不支援攝影機存取功能。',
        });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: '無法存取攝影機',
          description: '請在您的瀏覽器設定中啟用攝影機權限，以使用此功能。',
        });
      }
    };

    // Delay requesting permission slightly to allow the modal transition to complete
    const timer = setTimeout(() => {
      getCameraPermission();
    }, 300);

    return () => {
        clearTimeout(timer);
        // Cleanup: stop camera track when component unmounts or dog changes
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
    };
  }, [dog.id, toast]);

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
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
           {hasCameraPermission !== true && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-center p-4">
                  <CameraOff className="h-12 w-12 text-muted-foreground mb-4"/>
                  <h3 className="text-lg font-semibold">攝影機未啟用</h3>
                  <p className="text-sm text-muted-foreground">
                    {hasCameraPermission === null ? "正在請求權限..." : "請允許攝影機存取。"}
                  </p>
              </div>
           )}
        </div>
        {hasCameraPermission === false && (
          <Alert variant="destructive">
            <CameraOff className="h-4 w-4" />
            <AlertTitle>需要攝影機權限</AlertTitle>
            <AlertDescription>
              請允許此網站存取您的攝影機以觀看即時影像。您可能需要刷新頁面或在瀏覽器設定中調整權限。
            </AlertDescription>
          </Alert>
        )}
         {hasCameraPermission === null && (
             <Alert>
                <AlertTitle>正在請求攝影機權限...</AlertTitle>
                <AlertDescription>
                    請在瀏覽器跳出的提示中點擊「允許」。
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
};

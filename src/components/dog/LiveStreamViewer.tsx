
"use client";

import type { Dog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, WifiOff, Loader2 } from 'lucide-react';
import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTabsContext } from './TabsContext'; 

// Dynamically import jsmpeg-player only on the client-side
let JSMpeg: any = null;
if (typeof window !== 'undefined') {
  import('jsmpeg-player').then(module => {
    // The default export might be nested under another default property
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
  
  // Use the context to know if this tab is active
  const { activeTab } = useTabsContext();
  const isTabActive = activeTab === 'live';

  const streamServerPort = 8081;

  useEffect(() => {
    // Only run this effect if the tab is active and the JSMpeg library has loaded.
    if (!isTabActive || !JSMpeg) {
      // If the tab becomes inactive, ensure any existing player is destroyed.
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // It's safe to ignore errors during destruction on tab change.
        }
        playerRef.current = null;
      }
      return;
    }

    // Reset state for the new stream
    setError(null);
    setIsLoading(true);

    const streamServerIp = window.location.hostname;
    const webSocketUrl = `ws://${streamServerIp}:${streamServerPort}`;

    let player: any;

    // A small delay to ensure the canvas is ready after the tab switch
    const timeoutId = setTimeout(() => {
      if (!canvasRef.current) {
          setError("Canvas element is not ready.");
          setIsLoading(false);
          return;
      }
      
      try {
        const Player = JSMpeg.Player;
        if (!Player) {
          throw new Error("JSMpeg.Player is not ready.");
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
              setError(`Unable to connect to the video stream. Please ensure the backend service is running and firewall settings are correct.`);
              setIsLoading(false);
          }
        });
        
        playerRef.current = player;
        
      } catch (e: any) {
        setError(`Error creating player: ${e.message}`);
        setIsLoading(false);
      }
    }, 100); // 100ms delay

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      // **CRITICAL FIX**: Only attempt to destroy the player if it, and its source, were successfully created.
      // This prevents the "Cannot read properties of null (reading 'close')" error.
      if (playerRef.current && playerRef.current.source && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
           console.error("[LiveStream] Error destroying player during cleanup:", e);
        }
      }
      playerRef.current = null;
    };
  // Rerun this effect if the dog changes or if the tab becomes active/inactive
  }, [dog.id, isTabActive]);

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader className="bg-secondary/50 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-xl font-headline">
          <Video className="h-6 w-6 text-primary" />
          Live Video
        </CardTitle>
        <CardDescription>Interact with {dog.name} via video!</CardDescription>
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
                <h3 className="text-lg font-semibold text-primary">Connecting to video...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please wait. If this takes a long time, the backend service or camera may be offline.
                </p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 text-center p-4 rounded-md">
                <WifiOff className="h-12 w-12 text-destructive mb-4"/>
                <h3 className="text-lg font-semibold text-destructive">Stream Error</h3>
                <p className="text-sm text-destructive/90 max-w-full break-words px-2">
                  {error}
                </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

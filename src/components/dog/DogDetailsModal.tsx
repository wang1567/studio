
"use client";

import type { Dog } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { HealthRecordsDisplay } from './HealthRecordsDisplay';
import { Badge } from '@/components/ui/badge';
import { MapPin, Heart, X, Video, Link as LinkIcon, Webcam } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

// A simple in-memory store for signaling, not for production
const signalStore: { [key: string]: any } = {};

const translateGender = (gender: 'Male' | 'Female' | 'Unknown' | undefined): string => {
  switch (gender) {
    case 'Male': return '公';
    case 'Female': return '母';
    case 'Unknown': return '未知';
    default: return '未知';
  }
};


const LiveStreamViewer = ({ dog }: { dog: Dog }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [peer, setPeer] = useState<any>(null);
    const [connectionId, setConnectionId] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const { toast } = useToast();
    
    // Dynamically import simple-peer only on the client-side
    const Peer = useRef<any>(null);
    useEffect(() => {
        import('simple-peer').then(module => {
            Peer.current = module.default;
        });
    }, []);

    const connectToStream = () => {
        if (!Peer.current) {
            toast({ title: "Error", description: "Component not ready yet.", variant: "destructive" });
            return;
        }
        if (!connectionId) {
            toast({ title: "Error", description: "Please enter a Connection ID.", variant: "destructive" });
            return;
        }

        setIsConnecting(true);

        const newPeer = new Peer.current({ initiator: false });
        
        newPeer.on('signal', (data: any) => {
            signalStore[`answer-for-${connectionId}`] = data;
        });

        newPeer.on('stream', (stream: MediaStream) => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsConnected(true);
            setIsConnecting(false);
        });
        
        newPeer.on('connect', () => {
            toast({ title: "Connected!", description: "Successfully connected to the stream." });
        });
        
        newPeer.on('close', () => {
            toast({ title: "Stream Ended", description: "The broadcaster has ended the stream.", variant: "destructive" });
            if(videoRef.current) videoRef.current.srcObject = null;
            setIsConnected(false);
            setPeer(null);
        });
        
        newPeer.on('error', (err: Error) => {
            console.error('Peer error:', err);
            toast({ title: 'Connection Error', description: "Could not connect. Check the ID or the broadcaster's status.", variant: 'destructive' });
            setIsConnecting(false);
            setIsConnected(false);
        });

        const initiatorSignal = signalStore[connectionId];
        if (initiatorSignal) {
            newPeer.signal(initiatorSignal);
        } else {
             toast({ title: "Error", description: "Invalid Connection ID or broadcaster is offline.", variant: "destructive" });
             setIsConnecting(false);
             return;
        }
        
        setPeer(newPeer);
    };
    
     useEffect(() => {
        // Cleanup on component unmount
        return () => {
            if (peer) {
                peer.destroy();
            }
        };
    }, [peer]);

    return (
        <div className="space-y-4">
            <Alert>
                <Webcam className="h-4 w-4" />
                <AlertTitle>How to View Live Stream</AlertTitle>
                <AlertDescription>
                    1. The caregiver must go to the <Link href="/broadcast" target="_blank" className="font-bold text-primary hover:underline">Broadcast Page</Link> and start streaming to get a Connection ID.
                    <br />
                    2. Paste that ID here and click 'Connect'.
                </AlertDescription>
            </Alert>
            <div className="space-y-2">
                <Label htmlFor="connection-id">Broadcaster's Connection ID</Label>
                <div className="flex gap-2">
                    <Input
                        id="connection-id"
                        placeholder="Enter Connection ID from broadcaster"
                        value={connectionId}
                        onChange={(e) => setConnectionId(e.target.value)}
                        disabled={isConnecting || isConnected}
                    />
                    <Button onClick={connectToStream} disabled={isConnecting || isConnected}>
                        {isConnecting ? 'Connecting...' : (isConnected ? 'Connected' : 'Connect')}
                    </Button>
                </div>
            </div>
            <div className="rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center text-white">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                {!isConnected && <p>Stream will appear here</p>}
            </div>
        </div>
    );
}


export const DogDetailsModal = ({ dog, isOpen, onClose }: DogDetailsModalProps) => {
  if (!dog) return null;

  const dogPhotos = dog.photos && dog.photos.length > 0 ? dog.photos : ['https://placehold.co/600x400.png'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-3xl font-headline text-primary">{dog.name}</DialogTitle>
              <DialogDescription className="text-lg">{dog.breed} - {dog.age} 歲 - {translateGender(dog.gender)}</DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="關閉對話框">
                <X className="h-6 w-6" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-grow">
            <div className="p-6">
                <Tabs defaultValue="photos">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="photos">Photos & Info</TabsTrigger>
                        <TabsTrigger value="livestream">
                            <Video className="w-4 h-4 mr-2" /> Live Stream
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="photos" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <Carousel className="w-full rounded-lg overflow-hidden shadow-lg">
                                    <CarouselContent>
                                    {dogPhotos.map((photo, index) => (
                                        <CarouselItem key={index}>
                                        <div className="aspect-w-4 aspect-h-3">
                                            <Image
                                            src={photo || 'https://placehold.co/600x400.png'}
                                            alt={`${dog.name} 照片 ${index + 1}`}
                                            width={600}
                                            height={400}
                                            className="object-cover w-full h-full"
                                            data-ai-hint="dog"
                                            />
                                        </div>
                                        </CarouselItem>
                                    ))}
                                    </CarouselContent>
                                    {dogPhotos.length > 1 && (
                                    <>
                                        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                                        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                                    </>
                                    )}
                                </Carousel>
                                <div className="space-y-2">
                                    <p className="text-foreground/80">{dog.description}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <span>{dog.location}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                    {dog.personalityTraits && dog.personalityTraits.map(trait => (
                                        <Badge key={trait} variant="secondary" className="bg-accent/20 text-accent-foreground">{trait}</Badge>
                                    ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <HealthRecordsDisplay dog={dog} />
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="livestream" className="mt-4">
                        <LiveStreamViewer dog={dog} />
                    </TabsContent>
                </Tabs>
            </div>
        </ScrollArea>

        <div className="p-4 border-t bg-secondary/30 flex justify-end items-center gap-3 mt-auto">
            <Button variant="outline" onClick={onClose}>關閉</Button>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/adoption-info">
                <Heart className="mr-2 h-4 w-4" /> 表達領養意願
              </Link>
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

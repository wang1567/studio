
"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Video, Check } from 'lucide-react';

// A simple in-memory store for signaling, not for production
const signalStore: { [key: string]: any } = {};

const BroadcastPage = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [peer, setPeer] = useState<any>(null);
    const [initiatorId, setInitiatorId] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();
    
    // Dynamically import simple-peer only on the client-side
    const Peer = useRef<any>(null);
    useEffect(() => {
        import('simple-peer').then(module => {
            Peer.current = module.default;
        });
    }, []);

    const startBroadcasting = async () => {
        if (!Peer.current) {
            toast({ title: "Error", description: "Peer library not loaded yet.", variant: "destructive" });
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            const newPeer = new Peer.current({ initiator: true, stream: stream });
            const newId = `dog-cam-${Date.now().toString().slice(-6)}`;
            setInitiatorId(newId);
            setIsBroadcasting(true);
            
            newPeer.on('signal', (data: any) => {
                // In a real app, this would be sent to a signaling server (e.g., via WebSockets).
                // Here, we simulate it by storing it in a simple object.
                signalStore[newId] = data;
            });

            newPeer.on('connect', () => {
                toast({ title: "Viewer Connected!", description: "Someone is now watching your stream." });
            });
            
            newPeer.on('close', () => {
                 toast({ title: "Stream Closed", description: "The video stream has been closed.", variant: "destructive" });
                 setIsBroadcasting(false);
                 setInitiatorId('');
                 if(videoRef.current) videoRef.current.srcObject = null;
            });
            
             newPeer.on('error', (err: Error) => {
                console.error('Peer error:', err);
                toast({ title: 'Connection Error', description: err.message, variant: 'destructive' });
                setIsBroadcasting(false);
            });

            setPeer(newPeer);

            toast({ title: "Broadcasting Started!", description: "Share the Connection ID with a viewer." });

        } catch (error) {
            console.error('Error starting broadcast:', error);
            toast({
                title: "Camera Error",
                description: "Could not access the camera. Please check permissions.",
                variant: "destructive",
            });
        }
    };
    
    // Simulate signaling by checking for an answer
    useEffect(() => {
        if (!isBroadcasting || !initiatorId || !peer) return;

        const interval = setInterval(() => {
            if (signalStore[`answer-for-${initiatorId}`]) {
                peer.signal(signalStore[`answer-for-${initiatorId}`]);
                delete signalStore[`answer-for-${initiatorId}`]; // Clean up
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isBroadcasting, initiatorId, peer]);

    const handleCopy = () => {
        navigator.clipboard.writeText(initiatorId);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Video className="w-6 h-6 text-primary" />
                        PawsConnect Live Broadcast
                    </CardTitle>
                    <CardDescription>
                        Start a live video stream from your webcam. Share the generated ID with viewers to let them watch.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover"></video>
                    </div>

                    {!isBroadcasting ? (
                        <Button onClick={startBroadcasting} className="w-full">Start Broadcasting</Button>
                    ) : (
                         <div className="space-y-2">
                            <Label htmlFor="connectionId">Your Unique Connection ID</Label>
                            <div className="flex gap-2">
                                <Input id="connectionId" value={initiatorId} readOnly />
                                <Button variant="outline" size="icon" onClick={handleCopy}>
                                    {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default BroadcastPage;

// This is a simple receiver component that would be used on the viewer's side.
// We will integrate this logic into the DogDetailsModal.
export const ReceiverComponent = ({ connectionId }: { connectionId: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [peer, setPeer] = useState<any>(null);
    const { toast } = useToast();

    const connectToStream = () => {
        const Peer = require('simple-peer');
        const initiatorSignal = signalStore[connectionId];

        if (!initiatorSignal) {
            toast({ title: "Error", description: "Invalid Connection ID or broadcaster has not started.", variant: "destructive" });
            return;
        }

        const newPeer = new Peer({ initiator: false });
        setPeer(newPeer);
        
        newPeer.on('signal', (data: any) => {
            // Send answer back to the initiator via the simulated signal store
            signalStore[`answer-for-${connectionId}`] = data;
        });

        newPeer.on('stream', (stream: MediaStream) => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        });
        
        newPeer.on('connect', () => {
            toast({ title: "Connected!", description: "Successfully connected to the stream." });
        });
        
        newPeer.on('close', () => {
            toast({ title: "Stream Ended", description: "The broadcaster has ended the stream.", variant: "destructive" });
             if(videoRef.current) videoRef.current.srcObject = null;
        });
        
        newPeer.on('error', (err: Error) => {
            console.error('Peer error:', err);
            toast({ title: 'Connection Error', description: err.message, variant: 'destructive' });
        });
        
        // Signal the initiator
        newPeer.signal(initiatorSignal);
    };

    return (
       <div>
         {/* UI for receiver would go here */}
       </div>
    );
};

import type { Dog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Video } from 'lucide-react';

interface LiveStreamViewerProps {
  dog: Dog;
}

export const LiveStreamViewer = ({ dog }: LiveStreamViewerProps) => {
  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-secondary/50 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-xl font-headline">
          <Video className="h-6 w-6 text-primary" />
          Live Stream
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {dog.liveStreamUrl ? (
          <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
            {/* In a real app, this would be a video player component or iframe */}
            <Image 
                src={dog.liveStreamUrl} // Placeholder image for now
                alt={`${dog.name} live stream placeholder`} 
                width={600}
                height={338} // 16:9 aspect ratio
                className="object-cover w-full h-full"
                data-ai-hint="dog video"
            />
            {/* <p className="text-muted-foreground">Live stream of {dog.name}</p> */}
          </div>
        ) : (
          <p className="text-muted-foreground">Live stream is currently unavailable for {dog.name}.</p>
        )}
      </CardContent>
    </Card>
  );
};

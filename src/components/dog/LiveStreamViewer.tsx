
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
          即時影像
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {dog.liveStreamUrl ? (
          <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
            <Image 
                src={dog.liveStreamUrl}
                alt={`${dog.name} 即時影像預覽`} 
                width={600}
                height={338}
                className="object-cover w-full h-full"
                data-ai-hint="dog video"
            />
          </div>
        ) : (
          <p className="text-muted-foreground">{dog.name} 的即時影像目前無法觀看。</p>
        )}
      </CardContent>
    </Card>
  );
};

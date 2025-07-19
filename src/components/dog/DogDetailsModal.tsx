
"use client";

import type { Dog } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { HealthRecordsDisplay } from './HealthRecordsDisplay';
import { LiveStreamViewer } from './LiveStreamViewer';
import { Badge } from '@/components/ui/badge';
import { MapPin, Heart, Video, X, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { TabsContextProvider } from './TabsContext'; // Import provider

interface DogDetailsModalProps {
  dog: Dog | null;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'details' | 'live';
}

const translateGender = (gender: 'Male' | 'Female' | 'Unknown' | undefined): string => {
  switch (gender) {
    case 'Male': return '公';
    case 'Female': return '母';
    case 'Unknown': return '未知';
    default: return '未知';
  }
};

export const DogDetailsModal = ({ dog, isOpen, onClose, initialTab = 'details' }: DogDetailsModalProps) => {
  if (!dog) return null;

  const dogPhotos = dog.photos && dog.photos.length > 0 ? dog.photos : ['https://placehold.co/600x400.png'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b">
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
        
        {isOpen && ( // ** Conditional Rendering Added Here **
          <TabsContextProvider initialTab={initialTab}>
              <Tabs defaultValue={initialTab} key={dog.id} className="flex-grow flex flex-col min-h-0">
                  <TabsList className="grid w-full grid-cols-2 mx-auto sticky top-0 bg-background z-10 rounded-none border-b px-6 py-2 h-auto">
                      <TabsTrigger value="details" className="gap-2">
                          <FileText className="h-5 w-5"/> 詳細資料
                      </TabsTrigger>
                      <TabsTrigger value="live" className="gap-2">
                          <Video className="h-5 w-5"/> 即時影像
                      </TabsTrigger>
                  </TabsList>
                  
                  <ScrollArea className="flex-grow overflow-y-auto">
                      <TabsContent value="details" className="p-6 mt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Left Column: Photos and Basic Info */}
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

                              {/* Right Column: Records */}
                              <div className="space-y-6">
                                  <HealthRecordsDisplay dog={dog} />
                              </div>
                          </div>
                      </TabsContent>
                      
                      <TabsContent value="live" className="p-6 mt-0 h-full">
                          <LiveStreamViewer dog={dog} />
                      </TabsContent>
                  </ScrollArea>
              </Tabs>
          </TabsContextProvider>
        )}

        <div className="p-4 border-t bg-secondary/30 flex justify-end gap-3 mt-auto">
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

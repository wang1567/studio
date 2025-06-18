"use client";

import { useState } from 'react';
import { usePawsConnect } from '@/context/PawsConnectContext';
import type { Dog } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DogDetailsModal } from '@/components/dog/DogDetailsModal';
import { Heart, MessageSquare, Video, Info } from 'lucide-react';

export default function MatchesPage() {
  const { likedDogs, getDogById } = usePawsConnect();
  const [selectedDogDetails, setSelectedDogDetails] = useState<Dog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShowDetails = (dogId: string) => {
    const dog = getDogById(dogId);
    if (dog) {
      setSelectedDogDetails(dog);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDogDetails(null);
  };

  if (likedDogs.length === 0) {
    return (
      <div className="text-center py-10">
        <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-headline mb-2">No Matches Yet</h2>
        <p className="text-muted-foreground">Keep swiping to find your perfect furry match!</p>
        <Button onClick={() => window.location.href='/'} className="mt-6">Start Swiping</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary text-center">Your Matches</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {likedDogs.map((dog) => (
          <Card key={dog.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
            <CardHeader className="p-0">
              <div className="aspect-w-4 aspect-h-3">
                <Image
                  src={dog.photos[0]}
                  alt={dog.name}
                  width={400}
                  height={300}
                  className="object-cover w-full h-full"
                  data-ai-hint="dog"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <CardTitle className="text-2xl font-headline text-primary">{dog.name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">{dog.breed}, {dog.age} years</CardDescription>
              <p className="mt-2 text-sm line-clamp-2">{dog.description}</p>
            </CardContent>
            <CardFooter className="p-4 border-t grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => handleShowDetails(dog.id)} className="w-full">
                <Info className="mr-2 h-4 w-4" /> Details
              </Button>
              {dog.liveStreamUrl ? (
                <Button 
                  onClick={() => handleShowDetails(dog.id)} // Opens modal, which can show livestream
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Video className="mr-2 h-4 w-4" /> Live View
                </Button>
              ) : (
                 <Button variant="secondary" disabled className="w-full">
                  <Video className="mr-2 h-4 w-4" /> No Stream
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      <DogDetailsModal dog={selectedDogDetails} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}

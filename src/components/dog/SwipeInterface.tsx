"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Dog } from '@/types';
import { DogCard } from './DogCard';
import { DogDetailsModal } from './DogDetailsModal';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { usePawsConnect } from '@/context/PawsConnectContext';
import { AnimatePresence, motion } from 'framer-motion'; // Assuming framer-motion can be added or using Tailwind animations

export const SwipeInterface = () => {
  const { dogsToSwipe, likedDogs, likeDog, passDog, currentDogIndex, setCurrentDogIndex, setDogsToSwipe } = usePawsConnect();
  const [selectedDogDetails, setSelectedDogDetails] = useState<Dog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);

  const handleNextCard = useCallback(() => {
    setAnimationDirection(null); // Reset animation direction
    if (currentDogIndex < dogsToSwipe.length -1) {
        setCurrentDogIndex(prevIndex => prevIndex + 1);
    } else if (dogsToSwipe.length > 0 && currentDogIndex >= dogsToSwipe.length -1) {
        // Optional: Loop back or show "no more dogs"
        // For now, just stays on the last card or shows message below
    }
  }, [currentDogIndex, dogsToSwipe.length, setCurrentDogIndex]);

  const handleLike = (dogId: string) => {
    setAnimationDirection('right');
    likeDog(dogId);
    setTimeout(handleNextCard, 300); // Animation duration
  };

  const handlePass = (dogId: string) => {
    setAnimationDirection('left');
    passDog(dogId);
    setTimeout(handleNextCard, 300); // Animation duration
  };

  const handleShowDetails = (dog: Dog) => {
    setSelectedDogDetails(dog);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDogDetails(null);
  };

  const currentDisplayDog = dogsToSwipe[currentDogIndex];
  const nextDisplayDog = dogsToSwipe[currentDogIndex + 1];

  if (dogsToSwipe.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <h2 className="text-2xl font-headline mb-4">No More Dogs Here!</h2>
        <p className="text-muted-foreground mb-6">You've seen all available dogs for now. Check back later for new furry friends!</p>
        <p className="text-muted-foreground">You have <span className="font-bold text-primary">{likedDogs.length}</span> dog(s) in your matches.</p>
      </div>
    );
  }
  
  if (currentDogIndex >= dogsToSwipe.length && dogsToSwipe.length > 0) {
     return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <h2 className="text-2xl font-headline mb-4">That's Everyone for Now!</h2>
        <p className="text-muted-foreground mb-6">You've swiped through all available dogs. Great job!</p>
        <Button onClick={() => setCurrentDogIndex(0)} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" /> Restart Swiping
        </Button>
         <p className="text-muted-foreground mt-4">You have <span className="font-bold text-primary">{likedDogs.length}</span> dog(s) in your matches.</p>
      </div>
    );
  }


  const getAnimationClass = () => {
    if (animationDirection === 'left') return 'animate-card-swipe-out-left';
    if (animationDirection === 'right') return 'animate-card-swipe-out-right';
    return 'animate-card-fade-in'; // Default for new cards appearing
  };


  return (
    <div className="flex flex-col items-center justify-center relative h-[calc(100vh-200px)] min-h-[500px] overflow-hidden">
      <div className="relative w-full max-w-sm h-[calc(100%-80px)] min-h-[420px] flex items-center justify-center">
        {/* Next card placeholder for smoother transition feel (visually under current) */}
        {nextDisplayDog && (
           <DogCard
            key={nextDisplayDog.id + "-next"}
            dog={nextDisplayDog}
            onLike={() => {}}
            onPass={() => {}}
            onDetails={handleShowDetails}
            isTopCard={false}
          />
        )}
        {/* Current card */}
        {currentDisplayDog && (
          <DogCard
            key={currentDisplayDog.id}
            dog={currentDisplayDog}
            onLike={handleLike}
            onPass={handlePass}
            onDetails={handleShowDetails}
            isTopCard={true}
            animationClass={getAnimationClass()}
          />
        )}
      </div>

      <DogDetailsModal dog={selectedDogDetails} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

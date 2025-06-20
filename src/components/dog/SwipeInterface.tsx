
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Dog } from '@/types';
import { DogCard } from './DogCard';
import { DogDetailsModal } from './DogDetailsModal';
import { Button } from '@/components/ui/button';
import { RotateCcw, PawPrint } from 'lucide-react'; // Added PawPrint
import { usePawsConnect } from '@/context/PawsConnectContext';
// import { AnimatePresence, motion } from 'framer-motion'; // Assuming framer-motion can be added or using Tailwind animations

export const SwipeInterface = () => {
  const { 
    dogsToSwipe, 
    likedDogs, 
    likeDog, 
    passDog, 
    currentDogIndex, 
    setCurrentDogIndex,
    isLoadingDogs // Added
  } = usePawsConnect();
  
  const [selectedDogDetails, setSelectedDogDetails] = useState<Dog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);

  const handleNextCard = useCallback(() => {
    setAnimationDirection(null); 
    if (currentDogIndex < dogsToSwipe.length -1) {
        setCurrentDogIndex(prevIndex => prevIndex + 1);
    }
  }, [currentDogIndex, dogsToSwipe.length, setCurrentDogIndex]);

  const handleLike = (dogId: string) => {
    setAnimationDirection('right');
    likeDog(dogId);
    setTimeout(handleNextCard, 300); 
  };

  const handlePass = (dogId: string) => {
    setAnimationDirection('left');
    passDog(dogId);
    setTimeout(handleNextCard, 300); 
  };

  const handleShowDetails = (dog: Dog) => {
    setSelectedDogDetails(dog);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDogDetails(null);
  };

  if (isLoadingDogs) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <PawPrint className="w-16 h-16 text-primary animate-spin mb-4" />
        <h2 className="text-2xl font-headline">Fetching Pawtential Friends...</h2>
        <p className="text-muted-foreground">Please wait a moment.</p>
      </div>
    );
  }
  
  // This check should come after isLoadingDogs
  if (dogsToSwipe.length === 0 || currentDogIndex >= dogsToSwipe.length) {
     return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <h2 className="text-2xl font-headline mb-4">That's Everyone for Now!</h2>
        <p className="text-muted-foreground mb-6">You've swiped through all available dogs. Check back later for new furry friends!</p>
        {/* Optional: Restart Swiping if needed, but might be better to just show matches. */}
        {/* <Button onClick={() => setCurrentDogIndex(0)} variant="outline" disabled={dogsToSwipe.length === 0}>
          <RotateCcw className="mr-2 h-4 w-4" /> Restart Swiping
        </Button> */}
         <p className="text-muted-foreground mt-4">You have <span className="font-bold text-primary">{likedDogs.length}</span> dog(s) in your matches.</p>
      </div>
    );
  }

  const currentDisplayDog = dogsToSwipe[currentDogIndex];
  const nextDisplayDog = dogsToSwipe[currentDogIndex + 1];

  const getAnimationClass = () => {
    if (animationDirection === 'left') return 'animate-card-swipe-out-left';
    if (animationDirection === 'right') return 'animate-card-swipe-out-right';
    return 'animate-card-fade-in'; 
  };


  return (
    <div className="flex flex-col items-center justify-center relative h-[calc(100vh-200px)] min-h-[500px] overflow-hidden">
      <div className="relative w-full max-w-sm h-[calc(100%-80px)] min-h-[420px] flex items-center justify-center">
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


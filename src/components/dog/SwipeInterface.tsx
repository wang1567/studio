
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Dog } from '@/types';
import { DogCard } from './DogCard';
import { DogDetailsModal } from './DogDetailsModal';
import { Button } from '@/components/ui/button';
import { RotateCcw, PawPrint } from 'lucide-react';
import { usePawsConnect } from '@/context/PawsConnectContext';

export const SwipeInterface = () => {
  const { 
    dogsToSwipe, 
    likedDogs, 
    likeDog, 
    passDog, 
    currentDogIndex, 
    setCurrentDogIndex,
    isLoadingDogs
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
        <h2 className="text-2xl font-headline">正在尋找毛夥伴...</h2>
        <p className="text-muted-foreground">請稍候片刻。</p>
      </div>
    );
  }
  
  if (dogsToSwipe.length === 0 || currentDogIndex >= dogsToSwipe.length) {
     return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <h2 className="text-2xl font-headline mb-4">目前沒有更多狗狗了！</h2>
        <p className="text-muted-foreground mb-6">您已看過所有可配對的狗狗。請稍後再來看看有沒有新的毛孩朋友！</p>
         <p className="text-muted-foreground mt-4">您的配對清單中有 <span className="font-bold text-primary">{likedDogs.length}</span> 隻狗狗。</p>
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

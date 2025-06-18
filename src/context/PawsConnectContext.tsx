"use client";

import type { Dog } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { mockDogs } from '@/data/mockDogs';

interface PawsConnectContextType {
  dogsToSwipe: Dog[];
  likedDogs: Dog[];
  seenDogIds: Set<string>;
  likeDog: (dogId: string) => void;
  passDog: (dogId: string) => void;
  getDogById: (dogId: string) => Dog | undefined;
  currentDogIndex: number;
  setDogsToSwipe: React.Dispatch<React.SetStateAction<Dog[]>>;
  setCurrentDogIndex: React.Dispatch<React.SetStateAction<number>>;
}

const PawsConnectContext = createContext<PawsConnectContextType | undefined>(undefined);

export const PawsConnectProvider = ({ children }: { children: ReactNode }) => {
  const [dogsToSwipe, setDogsToSwipe] = useState<Dog[]>([]);
  const [likedDogs, setLikedDogs] = useState<Dog[]>([]);
  const [seenDogIds, setSeenDogIds] = useState<Set<string>>(new Set());
  const [currentDogIndex, setCurrentDogIndex] = useState(0);

  useEffect(() => {
    // Initialize with dogs that haven't been seen or liked yet
    // In a real app, this might involve fetching from an API and then filtering
    const initialDogs = mockDogs.filter(dog => !seenDogIds.has(dog.id) && !likedDogs.find(likedDog => likedDog.id === dog.id));
    setDogsToSwipe(initialDogs);
  }, [likedDogs, seenDogIds]);


  const likeDog = (dogId: string) => {
    const dog = dogsToSwipe.find(d => d.id === dogId);
    if (dog && !likedDogs.find(d => d.id === dogId)) {
      setLikedDogs(prevLikedDogs => [...prevLikedDogs, dog]);
    }
    setSeenDogIds(prevSeenDogIds => new Set(prevSeenDogIds).add(dogId));
    // setCurrentDogIndex(prevIndex => prevIndex + 1); // SwipeInterface handles this
  };

  const passDog = (dogId: string) => {
    setSeenDogIds(prevSeenDogIds => new Set(prevSeenDogIds).add(dogId));
    // setCurrentDogIndex(prevIndex => prevIndex + 1); // SwipeInterface handles this
  };
  
  const getDogById = (dogId: string): Dog | undefined => {
    return mockDogs.find(dog => dog.id === dogId) || likedDogs.find(dog => dog.id === dogId);
  };

  return (
    <PawsConnectContext.Provider value={{ 
        dogsToSwipe, 
        likedDogs, 
        seenDogIds,
        likeDog, 
        passDog, 
        getDogById,
        currentDogIndex,
        setDogsToSwipe,
        setCurrentDogIndex
    }}>
      {children}
    </PawsConnectContext.Provider>
  );
};

export const usePawsConnect = () => {
  const context = useContext(PawsConnectContext);
  if (context === undefined) {
    throw new Error('usePawsConnect must be used within a PawsConnectProvider');
  }
  return context;
};

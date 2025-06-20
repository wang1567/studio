
"use client";

import type { Dog, Profile, UserRole, HealthRecord, FeedingSchedule, VaccinationRecord } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { mockDogs } from '@/data/mockDogs'; // Import mock dogs

// Minimal user structure for local auth
interface LocalUser {
  id: string;
  email: string;
  createdAt: string;
}

interface PawsConnectContextType {
  dogsToSwipe: Dog[];
  likedDogs: Dog[];
  seenDogIds: Set<string>;
  likeDog: (dogId: string) => void;
  passDog: (dogId: string) => void;
  getDogById: (dogId: string) => Dog | undefined;
  currentDogIndex: number;
  setCurrentDogIndex: React.Dispatch<React.SetStateAction<number>>;
  isLoadingDogs: boolean;

  user: LocalUser | null;
  profile: Profile | null;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<{ user: LocalUser | null; error: string | null }>;
  signUp: (email: string, password: string, role: UserRole, fullName?: string | null) => Promise<{ user: LocalUser | null; error: string | null }>;
  logout: () => Promise<{ error: string | null }>;
}

const PawsConnectContext = createContext<PawsConnectContextType | undefined>(undefined);

const defaultHealthRecord: HealthRecord = {
  lastCheckup: '',
  conditions: ['無'],
  notes: '未提供記錄',
};

const defaultFeedingSchedule: FeedingSchedule = {
  foodType: '未指定',
  timesPerDay: 0,
  portionSize: '未指定',
  notes: '未提供記錄',
};

// Helper to ensure dog data has all necessary fields, even if from mock
const ensureDogDataIntegrity = (dog: any): Dog => {
  const photos = Array.isArray(dog.photos) ? dog.photos.filter(p => typeof p === 'string') : [];
  const personalityTraits = Array.isArray(dog.personalityTraits) ? dog.personalityTraits.filter(p => typeof p === 'string') : [];
  
  const dogGender = dog.gender === 'Male' || dog.gender === 'Female' ? dog.gender : 'Unknown';

  return {
    id: dog.id || Math.random().toString(36).substring(7),
    name: dog.name || '未命名狗狗',
    breed: dog.breed || '未知品種',
    age: typeof dog.age === 'number' ? dog.age : 0,
    gender: dogGender,
    photos: photos.length > 0 ? photos : ['https://placehold.co/600x400.png'],
    description: dog.description || '暫無描述。',
    healthRecords: dog.healthRecords || { ...defaultHealthRecord },
    feedingSchedule: dog.feedingSchedule || { ...defaultFeedingSchedule },
    vaccinationRecords: Array.isArray(dog.vaccinationRecords) ? dog.vaccinationRecords : [],
    liveStreamUrl: dog.liveStreamUrl ?? undefined,
    status: dog.status || 'Available',
    location: dog.location || '未知地點',
    personalityTraits: personalityTraits.length > 0 ? personalityTraits : ['個性溫和'],
  };
};


export const PawsConnectProvider = ({ children }: { children: ReactNode }) => {
  const [masterDogList, setMasterDogList] = useState<Dog[]>([]);
  const [dogsToSwipe, setDogsToSwipe] = useState<Dog[]>([]);
  const [likedDogs, setLikedDogs] = useState<Dog[]>([]);
  const [seenDogIds, setSeenDogIds] = useState<Set<string>>(new Set());
  const [currentDogIndex, setCurrentDogIndex] = useState(0);
  const [isLoadingDogs, setIsLoadingDogs] = useState(true);

  const [user, setUser] = useState<LocalUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Load initial state from localStorage
  useEffect(() => {
    setIsLoadingAuth(true);
    // Mock Auth
    const storedUser = localStorage.getItem('pawsConnectUser');
    const storedProfile = localStorage.getItem('pawsConnectProfile');
    if (storedUser && storedProfile) {
      setUser(JSON.parse(storedUser));
      setProfile(JSON.parse(storedProfile));
    }
    setIsLoadingAuth(false);

    // Dog data
    setIsLoadingDogs(true);
    const allDogs = mockDogs.map(ensureDogDataIntegrity);
    setMasterDogList(allDogs);

    const storedLikedDogIds = JSON.parse(localStorage.getItem('pawsConnectLikedDogIds') || '[]');
    const storedSeenDogIds = JSON.parse(localStorage.getItem('pawsConnectSeenDogIds') || '[]');
    
    const initialLikedDogs = allDogs.filter(dog => storedLikedDogIds.includes(dog.id));
    setLikedDogs(initialLikedDogs);
    setSeenDogIds(new Set(storedSeenDogIds));
    
    setCurrentDogIndex(0);
    setIsLoadingDogs(false);
  }, []);

  // Persist auth state to localStorage
  useEffect(() => {
    if (user && profile) {
      localStorage.setItem('pawsConnectUser', JSON.stringify(user));
      localStorage.setItem('pawsConnectProfile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('pawsConnectUser');
      localStorage.removeItem('pawsConnectProfile');
    }
  }, [user, profile]);

  // Persist dog interaction state to localStorage
  useEffect(() => {
    localStorage.setItem('pawsConnectLikedDogIds', JSON.stringify(likedDogs.map(d => d.id)));
    localStorage.setItem('pawsConnectSeenDogIds', JSON.stringify(Array.from(seenDogIds)));
  }, [likedDogs, seenDogIds]);


  useEffect(() => {
    if (isLoadingDogs) {
      setDogsToSwipe([]);
      return;
    }
    const dogsForSwiping = masterDogList.filter(dog =>
      !likedDogs.find(ld => ld.id === dog.id) &&
      !seenDogIds.has(dog.id)
    );
    setDogsToSwipe(dogsForSwiping);
  }, [masterDogList, likedDogs, seenDogIds, isLoadingDogs]);


  const likeDog = (dogId: string) => {
    const dog = masterDogList.find(d => d.id === dogId);
    if (!dog) return;

    if (!likedDogs.find(d => d.id === dogId)) {
      setLikedDogs(prevLikedDogs => [...prevLikedDogs, dog]);
    }
    setSeenDogIds(prevSeenIds => new Set(prevSeenIds).add(dogId));
  };

  const passDog = (dogId: string) => {
    setSeenDogIds(prevSeenDogIds => new Set(prevSeenDogIds).add(dogId));
  };
  
  const getDogById = (dogId: string): Dog | undefined => {
    return masterDogList.find(dog => dog.id === dogId);
  };

  const login = async (email: string, password: string): Promise<{ user: LocalUser | null; error: string | null }> => {
    setIsLoadingAuth(true);
    // Simulate login
    if (email && password) { // Basic check, replace with actual mock validation if needed
      const mockUser: LocalUser = { id: 'mock-' + email, email, createdAt: new Date().toISOString() };
      // Try to load profile from signup or use a default
      let mockProfile = JSON.parse(localStorage.getItem(`pawsConnectProfile_${email}`) || 'null') as Profile | null;
      if (!mockProfile) {
        mockProfile = { 
          id: mockUser.id, 
          role: 'adopter', 
          fullName: email.split('@')[0],
          updatedAt: new Date().toISOString(),
        };
      }
      
      setUser(mockUser);
      setProfile(mockProfile);
      setIsLoadingAuth(false);
      return { user: mockUser, error: null };
    }
    setIsLoadingAuth(false);
    return { user: null, error: '無效的電子郵件或密碼' };
  };

  const signUp = async (email: string, password: string, role: UserRole, fullName?: string | null): Promise<{ user: LocalUser | null; error: string | null }> => {
    setIsLoadingAuth(true);
    // Simulate signup
    if (email && password && role) {
      const mockUser: LocalUser = { id: 'mock-' + email, email, createdAt: new Date().toISOString() };
      const mockProfile: Profile = {
        id: mockUser.id,
        role,
        fullName: fullName || email.split('@')[0],
        updatedAt: new Date().toISOString(),
        avatarUrl: `https://placehold.co/100x100.png?text=${(fullName || email)[0].toUpperCase()}`
      };
      // Store this profile separately to be picked up by login
      localStorage.setItem(`pawsConnectProfile_${email}`, JSON.stringify(mockProfile));

      // For immediate use after signup, set it directly too
      setUser(mockUser);
      setProfile(mockProfile);
      
      setIsLoadingAuth(false);
      return { user: mockUser, error: null };
    }
    setIsLoadingAuth(false);
    return { user: null, error: '註冊失敗，請檢查輸入資料' };
  };

  const logout = async (): Promise<{ error: string | null }> => {
    setIsLoadingAuth(true);
    setUser(null);
    setProfile(null);
    // Clear only user-specific dog data if desired, or all for full reset
    setLikedDogs([]); 
    setSeenDogIds(new Set()); 
    // dogsToSwipe will re-filter based on cleared liked/seen
    setCurrentDogIndex(0);
    setIsLoadingAuth(false);
    return { error: null };
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
        setCurrentDogIndex,
        isLoadingDogs,
        user,
        profile,
        isLoadingAuth,
        login,
        signUp,
        logout
    }}>
      {children}
    </PawsConnectContext.Provider>
  );
};

export const usePawsConnect = () => {
  const context = useContext(PawsConnectContext);
  if (context === undefined) {
    throw new Error('usePawsConnect 必須在 PawsConnectProvider 內使用');
  }
  return context;
};

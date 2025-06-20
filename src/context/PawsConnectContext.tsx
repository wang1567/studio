
"use client";

import type { Dog, Profile, UserRole, HealthRecord, FeedingSchedule, VaccinationRecord } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

interface PawsConnectContextType {
  // Dog related state
  dogsToSwipe: Dog[];
  likedDogs: Dog[];
  seenDogIds: Set<string>;
  likeDog: (dogId: string) => Promise<void>;
  passDog: (dogId: string) => void;
  getDogById: (dogId: string) => Dog | undefined;
  currentDogIndex: number;
  setCurrentDogIndex: React.Dispatch<React.SetStateAction<number>>;
  isLoadingDogs: boolean;

  // Auth related state
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signUp: (email: string, password: string, role: UserRole, fullName?: string | null) => Promise<{ user: User | null; error: AuthError | null }>;
  logout: () => Promise<{ error: AuthError | null }>;
}

const PawsConnectContext = createContext<PawsConnectContextType | undefined>(undefined);

const defaultHealthRecord: HealthRecord = {
  lastCheckup: '',
  conditions: [],
  notes: '未提供記錄',
};

const defaultFeedingSchedule: FeedingSchedule = {
  foodType: '未指定',
  timesPerDay: 0,
  portionSize: '未指定',
  notes: '未提供記錄',
};

// Helper to map Supabase dog row to our Dog type
const mapDbDogToDogType = (dbDog: Database['public']['Tables']['dogs']['Row']): Dog => {
  const photos = Array.isArray(dbDog.photos) ? dbDog.photos : [];
  const personalityTraits = Array.isArray(dbDog.personality_traits) ? dbDog.personality_traits : [];

  let healthRecords: HealthRecord;
  try {
    const parsedHr = dbDog.health_records as unknown; // Parse as unknown first
    if (typeof parsedHr === 'object' && parsedHr !== null) {
      healthRecords = { // Reconstruct safely
        lastCheckup: (parsedHr as HealthRecord).lastCheckup || '',
        conditions: Array.isArray((parsedHr as HealthRecord).conditions) ? (parsedHr as HealthRecord).conditions : [],
        notes: (parsedHr as HealthRecord).notes || '未提供記錄',
      };
    } else {
      healthRecords = { ...defaultHealthRecord };
    }
  } catch (e) {
    console.error('Error parsing health_records:', e, dbDog.health_records);
    healthRecords = { ...defaultHealthRecord };
  }

  let feedingSchedule: FeedingSchedule;
  try {
    const parsedFs = dbDog.feeding_schedule as unknown;
     if (typeof parsedFs === 'object' && parsedFs !== null) {
        feedingSchedule = {
            foodType: (parsedFs as FeedingSchedule).foodType || '未指定',
            timesPerDay: typeof (parsedFs as FeedingSchedule).timesPerDay === 'number' ? (parsedFs as FeedingSchedule).timesPerDay : 0,
            portionSize: (parsedFs as FeedingSchedule).portionSize || '未指定',
            notes: (parsedFs as FeedingSchedule).notes || '未提供記錄',
        };
    } else {
      feedingSchedule = { ...defaultFeedingSchedule };
    }
  } catch (e) {
    console.error('Error parsing feeding_schedule:', e, dbDog.feeding_schedule);
    feedingSchedule = { ...defaultFeedingSchedule };
  }

  let vaccinationRecords: VaccinationRecord[];
  try {
    const parsedVr = dbDog.vaccination_records as unknown;
    if (Array.isArray(parsedVr)) {
      vaccinationRecords = parsedVr.map(vr => ({ // Reconstruct safely
        vaccineName: (vr as VaccinationRecord).vaccineName || '未指定疫苗',
        dateAdministered: (vr as VaccinationRecord).dateAdministered || '',
        nextDueDate: (vr as VaccinationRecord).nextDueDate || undefined,
      }));
    } else {
      vaccinationRecords = [];
    }
  } catch (e) {
    console.error('Error parsing vaccination_records:', e, dbDog.vaccination_records);
    vaccinationRecords = [];
  }
  
  const dogGender = dbDog.gender === 'Male' || dbDog.gender === 'Female' ? dbDog.gender : 'Unknown';

  return {
    id: dbDog.id,
    name: dbDog.name || '未命名狗狗',
    breed: dbDog.breed || '未知品種',
    age: typeof dbDog.age === 'number' ? dbDog.age : 0,
    gender: dogGender,
    photos: photos.length > 0 ? photos : ['https://placehold.co/600x400.png'],
    description: dbDog.description || '暫無描述。',
    healthRecords,
    feedingSchedule,
    vaccinationRecords,
    liveStreamUrl: dbDog.live_stream_url ?? undefined,
    status: dbDog.status || 'Available',
    location: dbDog.location || '未知地點',
    personalityTraits: personalityTraits.length > 0 ? personalityTraits : ['個性未知'],
  };
};


export const PawsConnectProvider = ({ children }: { children: ReactNode }) => {
  const [masterDogList, setMasterDogList] = useState<Dog[]>([]);
  const [dogsToSwipe, setDogsToSwipe] = useState<Dog[]>([]);
  const [likedDogs, setLikedDogs] = useState<Dog[]>([]);
  const [seenDogIds, setSeenDogIds] = useState<Set<string>>(new Set());
  const [currentDogIndex, setCurrentDogIndex] = useState(0);
  const [isLoadingDogs, setIsLoadingDogs] = useState(true);

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const fetchAndSetProfile = useCallback(async (currentUser: User | null) => {
    if (currentUser) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for a new user
        console.error('Error fetching profile:', profileError);
        setProfile(null);
      } else {
        setProfile(profileData as Profile | null);
      }
    } else {
      setProfile(null);
    }
  }, []);
  
  useEffect(() => {
    setIsLoadingAuth(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      await fetchAndSetProfile(session?.user ?? null);
      setIsLoadingAuth(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoadingAuth(true);
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await fetchAndSetProfile(currentUser);
      setIsLoadingAuth(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchAndSetProfile]);

  useEffect(() => {
    const loadInitialDogData = async () => {
      setIsLoadingDogs(true);

      const { data: dbDogs, error: dogsError } = await supabase
        .from('dogs')
        .select('*')
        .eq('status', 'Available');

      if (dogsError) {
        console.error('Error fetching dogs from Supabase:', dogsError);
        setMasterDogList([]);
        setLikedDogs([]);
        setIsLoadingDogs(false);
        return;
      }

      const formattedMasterDogs: Dog[] = dbDogs ? dbDogs.map(mapDbDogToDogType) : [];
      setMasterDogList(formattedMasterDogs);

      if (user && formattedMasterDogs.length > 0) {
        const { data: likedRecords, error: likedError } = await supabase
          .from('user_dog_likes')
          .select('dog_id')
          .eq('user_id', user.id);

        if (likedError) {
          console.error('Error fetching liked dog records:', likedError);
          setLikedDogs([]);
        } else {
          const userLikedDogIds = likedRecords.map(r => r.dog_id);
          const currentUserLikedDogs = formattedMasterDogs.filter(dog => userLikedDogIds.includes(dog.id));
          setLikedDogs(currentUserLikedDogs);
        }
      } else {
        setLikedDogs([]);
      }
      setCurrentDogIndex(0);
      setIsLoadingDogs(false);
    };

    loadInitialDogData();
  }, [user]); 

  useEffect(() => {
    if (isLoadingDogs) {
      setDogsToSwipe([]);
      return;
    }

    const currentLikedDogIds = likedDogs.map(d => d.id);
    const dogsForSwiping = masterDogList.filter(dog =>
      !currentLikedDogIds.includes(dog.id) &&
      !seenDogIds.has(dog.id)
    );
    setDogsToSwipe(dogsForSwiping);
  }, [masterDogList, likedDogs, seenDogIds, isLoadingDogs]);


  const likeDog = async (dogId: string) => {
    const dog = masterDogList.find(d => d.id === dogId);
    if (!dog) return;

    if (!likedDogs.find(d => d.id === dogId)) {
      setLikedDogs(prevLikedDogs => [...prevLikedDogs, dog]);
    }
    setSeenDogIds(prevSeenIds => new Set(prevSeenIds).add(dogId));

    if (user) {
      const { error } = await supabase
        .from('user_dog_likes')
        .insert({ user_id: user.id, dog_id: dogId });
      if (error) {
        console.error('Error saving like to Supabase:', error.message);
        setLikedDogs(prevLikedDogs => prevLikedDogs.filter(d => d.id !== dogId));
      }
    }
  };

  const passDog = (dogId: string) => {
    setSeenDogIds(prevSeenDogIds => new Set(prevSeenDogIds).add(dogId));
  };
  
  const getDogById = (dogId: string): Dog | undefined => {
    return masterDogList.find(dog => dog.id === dogId);
  };

  const login = async (email: string, password: string) => {
    setIsLoadingAuth(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data.user) {
        await fetchAndSetProfile(data.user);
    }
    setIsLoadingAuth(false);
    return { user: data.user, error };
  };

  const signUp = async (email: string, password: string, role: UserRole, fullName?: string | null) => {
    setIsLoadingAuth(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setIsLoadingAuth(false);
      return { user: null, error: authError };
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ 
            id: authData.user.id, 
            role, 
            full_name: fullName || null, // Ensure fullName is null if empty string or undefined
            updated_at: new Date().toISOString() 
        });
      
      if (profileError) {
        console.error("Error creating profile:", profileError);
      } else {
         await fetchAndSetProfile(authData.user);
      }
    }
    setIsLoadingAuth(false);
    return { user: authData.user, error: authError };
  };

  const logout = async () => {
    setIsLoadingAuth(true);
    const { error } = await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    
    setMasterDogList([]);
    setLikedDogs([]);
    setSeenDogIds(new Set());
    setDogsToSwipe([]);
    setCurrentDogIndex(0);
    
    setIsLoadingAuth(false);
    return { error };
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
        session,
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
    throw new Error('usePawsConnect must be used within a PawsConnectProvider');
  }
  return context;
};

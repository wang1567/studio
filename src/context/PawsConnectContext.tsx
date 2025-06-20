
"use client";

import type { Dog, Profile, UserRole, HealthRecord, FeedingSchedule, VaccinationRecord } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
// import { mockDogs } from '@/data/mockDogs'; // No longer using mockDogs directly for initial load
import { supabase } from '@/lib/supabaseClient';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

interface PawsConnectContextType {
  // Dog related state
  dogsToSwipe: Dog[];
  likedDogs: Dog[];
  seenDogIds: Set<string>;
  likeDog: (dogId: string) => Promise<void>; // Now async
  passDog: (dogId: string) => void;
  getDogById: (dogId: string) => Dog | undefined;
  currentDogIndex: number;
  setCurrentDogIndex: React.Dispatch<React.SetStateAction<number>>;
  isLoadingDogs: boolean; // New loading state for dogs

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

// Helper to map Supabase dog row to our Dog type
const mapDbDogToDogType = (dbDog: Database['public']['Tables']['dogs']['Row']): Dog => ({
  id: dbDog.id,
  name: dbDog.name,
  breed: dbDog.breed,
  age: dbDog.age,
  gender: dbDog.gender,
  photos: dbDog.photos || [], // Ensure photos is an array
  description: dbDog.description,
  healthRecords: dbDog.health_records as HealthRecord,
  feedingSchedule: dbDog.feeding_schedule as FeedingSchedule,
  vaccinationRecords: dbDog.vaccination_records as VaccinationRecord[],
  liveStreamUrl: dbDog.live_stream_url ?? undefined,
  status: dbDog.status,
  location: dbDog.location,
  personalityTraits: dbDog.personality_traits || [], // Ensure personalityTraits is an array
});


export const PawsConnectProvider = ({ children }: { children: ReactNode }) => {
  // Dog related state
  const [masterDogList, setMasterDogList] = useState<Dog[]>([]);
  const [dogsToSwipe, setDogsToSwipe] = useState<Dog[]>([]);
  const [likedDogs, setLikedDogs] = useState<Dog[]>([]);
  const [seenDogIds, setSeenDogIds] = useState<Set<string>>(new Set());
  const [currentDogIndex, setCurrentDogIndex] = useState(0);
  const [isLoadingDogs, setIsLoadingDogs] = useState(true);

  // Auth related state
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

      if (profileError && profileError.code !== 'PGRST116') {
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
      // If user changes, dog data also needs to be re-evaluated (handled by next useEffect)
      setIsLoadingAuth(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchAndSetProfile]);

  // Fetch dogs and user's likes
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
        // setDogsToSwipe([]); // will be handled by the derivation useEffect
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
        setLikedDogs([]); // No user, so no liked dogs from DB
      }
      setCurrentDogIndex(0); // Reset index for new set of dogs
      setIsLoadingDogs(false);
    };

    loadInitialDogData();
  }, [user]); // Reload when user changes

  // Derive dogsToSwipe from masterDogList, likedDogs, and seenDogIds
  useEffect(() => {
    if (isLoadingDogs) {
      setDogsToSwipe([]); // Don't show anything while master list is loading
      return;
    }

    const currentLikedDogIds = likedDogs.map(d => d.id);
    const dogsForSwiping = masterDogList.filter(dog =>
      !currentLikedDogIds.includes(dog.id) &&
      !seenDogIds.has(dog.id)
    );
    setDogsToSwipe(dogsForSwiping);
    // Do not reset currentDogIndex here, as it's managed by swipe actions
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
        // Revert optimistic update or show toast
        setLikedDogs(prevLikedDogs => prevLikedDogs.filter(d => d.id !== dogId));
        // SeenDogIds should not be reverted as the user did "see" and action it.
      }
    }
  };

  const passDog = (dogId: string) => {
    setSeenDogIds(prevSeenDogIds => new Set(prevSeenDogIds).add(dogId));
  };
  
  const getDogById = (dogId: string): Dog | undefined => {
    return masterDogList.find(dog => dog.id === dogId);
  };

  // Auth functions
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
            full_name: fullName,
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
    
    // Reset dog-related state on logout
    setMasterDogList([]);
    setLikedDogs([]);
    setSeenDogIds(new Set());
    setDogsToSwipe([]);
    setCurrentDogIndex(0);
    // isLoadingDogs will be handled by the useEffect for loadInitialDogData due to user change
    
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
        // setDogsToSwipe, // No longer directly settable from outside if derived
        setCurrentDogIndex,
        isLoadingDogs, // Added
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


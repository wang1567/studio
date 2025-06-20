
"use client";

import type { Dog, Profile, UserRole } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { mockDogs } from '@/data/mockDogs';
import { supabase } from '@/lib/supabaseClient';
import type { AuthError, Session, User } from '@supabase/supabase-js';

interface PawsConnectContextType {
  // Dog related state
  dogsToSwipe: Dog[];
  likedDogs: Dog[];
  seenDogIds: Set<string>;
  likeDog: (dogId: string) => void;
  passDog: (dogId: string) => void;
  getDogById: (dogId: string) => Dog | undefined;
  currentDogIndex: number;
  setDogsToSwipe: React.Dispatch<React.SetStateAction<Dog[]>>;
  setCurrentDogIndex: React.Dispatch<React.SetStateAction<number>>;

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

export const PawsConnectProvider = ({ children }: { children: ReactNode }) => {
  // Dog related state
  const [dogsToSwipe, setDogsToSwipe] = useState<Dog[]>([]);
  const [likedDogs, setLikedDogs] = useState<Dog[]>([]);
  const [seenDogIds, setSeenDogIds] = useState<Set<string>>(new Set());
  const [currentDogIndex, setCurrentDogIndex] = useState(0);

  // Auth related state
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Fetch profile and set user/profile state
  const fetchAndSetProfile = useCallback(async (currentUser: User | null) => {
    if (currentUser) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116: Row not found, which is fine if profile not created yet
        console.error('Error fetching profile:', profileError);
        setProfile(null);
      } else {
        setProfile(profileData as Profile | null);
      }
    } else {
      setProfile(null);
    }
  }, []);
  
  // Handle auth state changes
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
      setUser(session?.user ?? null);
      await fetchAndSetProfile(session?.user ?? null);
      setIsLoadingAuth(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchAndSetProfile]);


  // Dog-related logic (mostly unchanged)
  useEffect(() => {
    const initialDogs = mockDogs.filter(dog => !seenDogIds.has(dog.id) && !likedDogs.find(likedDog => likedDog.id === dog.id));
    setDogsToSwipe(initialDogs);
  }, [likedDogs, seenDogIds]);

  const likeDog = (dogId: string) => {
    const dog = dogsToSwipe.find(d => d.id === dogId);
    if (dog && !likedDogs.find(d => d.id === dogId)) {
      setLikedDogs(prevLikedDogs => [...prevLikedDogs, dog]);
      // TODO: Persist like to Supabase user_dog_likes table if user is logged in
    }
    setSeenDogIds(prevSeenDogIds => new Set(prevSeenDogIds).add(dogId));
  };

  const passDog = (dogId: string) => {
    setSeenDogIds(prevSeenDogIds => new Set(prevSeenDogIds).add(dogId));
  };
  
  const getDogById = (dogId: string): Dog | undefined => {
    return mockDogs.find(dog => dog.id === dogId) || likedDogs.find(dog => dog.id === dogId);
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
      options: {
        // Data passed here is stored in auth.users.raw_user_meta_data
        // It's generally better to store profile data in a separate 'profiles' table
      }
    });

    if (authError) {
      setIsLoadingAuth(false);
      return { user: null, error: authError };
    }

    if (authData.user) {
      // Create a profile for the new user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ 
            id: authData.user.id, 
            role, 
            full_name: fullName, // Ensure full_name is correctly passed
            updated_at: new Date().toISOString() 
        });
      
      if (profileError) {
        console.error("Error creating profile:", profileError);
        // For simplicity, we proceed, but in a real app, you might want to handle this more robustly.
      } else {
         await fetchAndSetProfile(authData.user); // Fetch the newly created profile
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
    // Reset dog-related state on logout if desired
    setLikedDogs([]);
    setSeenDogIds(new Set());
    setCurrentDogIndex(0);
    setDogsToSwipe(mockDogs); // Or refetch/clear
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
        setDogsToSwipe,
        setCurrentDogIndex,
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

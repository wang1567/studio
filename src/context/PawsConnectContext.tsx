
"use client";

import type { Dog, Profile, UserRole, HealthRecord, FeedingSchedule, VaccinationRecord } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

type DbDog = Database['public']['Tables']['dogs']['Row'];
type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbUserDogLike = Database['public']['Tables']['user_dog_likes']['Row'];


interface PawsConnectContextType {
  dogsToSwipe: Dog[];
  likedDogs: Dog[];
  seenDogIds: Set<string>;
  likeDog: (dogId: string) => Promise<void>;
  passDog: (dogId: string) => void;
  getDogById: (dogId: string) => Dog | undefined;
  currentDogIndex: number;
  setCurrentDogIndex: React.Dispatch<React.SetStateAction<number>>;
  isLoadingDogs: boolean;

  user: SupabaseUser | null;
  profile: Profile | null;
  session: SupabaseSession | null;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<{ session: SupabaseSession | null; error: string | null }>;
  signUp: (email: string, password: string, role: UserRole, fullName?: string | null) => Promise<{ user: SupabaseUser | null; error: string | null }>;
  logout: () => Promise<{ error: string | null }>;
}

const PawsConnectContext = createContext<PawsConnectContextType | undefined>(undefined);

const mapDbDogToDogType = (dbDog: DbDog): Dog => {
  const defaultHealthRecord: HealthRecord = { lastCheckup: '', conditions: ['無'], notes: '未提供記錄' };
  const defaultFeedingSchedule: FeedingSchedule = { foodType: '未指定', timesPerDay: 0, portionSize: '未指定', notes: '未提供記錄' };
  
  const photos = Array.isArray(dbDog.photos) ? dbDog.photos.filter((p): p is string => typeof p === 'string') : [];
  const personalityTraits = Array.isArray(dbDog.personality_traits) ? dbDog.personality_traits.filter((p): p is string => typeof p === 'string') : [];
  
  const healthRecordsData = dbDog.health_records as HealthRecord || defaultHealthRecord;
  const feedingScheduleData = dbDog.feeding_schedule as FeedingSchedule || defaultFeedingSchedule;
  const vaccinationRecordsData = (Array.isArray(dbDog.vaccination_records) ? dbDog.vaccination_records : []) as VaccinationRecord[];

  return {
    id: dbDog.id,
    name: dbDog.name || '未命名狗狗',
    breed: dbDog.breed || '未知品種',
    age: typeof dbDog.age === 'number' ? dbDog.age : 0,
    gender: dbDog.gender === 'Male' || dbDog.gender === 'Female' ? dbDog.gender : 'Unknown',
    photos: photos.length > 0 ? photos : ['https://placehold.co/600x400.png'],
    description: dbDog.description || '暫無描述。',
    healthRecords: {
      lastCheckup: healthRecordsData.lastCheckup || '',
      conditions: healthRecordsData.conditions && healthRecordsData.conditions.length > 0 ? healthRecordsData.conditions : ['無'],
      notes: healthRecordsData.notes || '未提供記錄',
    },
    feedingSchedule: {
      foodType: feedingScheduleData.foodType || '未指定',
      timesPerDay: typeof feedingScheduleData.timesPerDay === 'number' ? feedingScheduleData.timesPerDay : 0,
      portionSize: feedingScheduleData.portionSize || '未指定',
      notes: feedingScheduleData.notes || '未提供記錄',
    },
    vaccinationRecords: vaccinationRecordsData.map(vr => ({
      vaccineName: vr.vaccineName || '未指定疫苗',
      dateAdministered: vr.dateAdministered || '',
      nextDueDate: vr.nextDueDate || undefined,
    })),
    liveStreamUrl: dbDog.live_stream_url ?? undefined,
    status: dbDog.status === 'Available' || dbDog.status === 'Pending' || dbDog.status === 'Adopted' ? dbDog.status : 'Available',
    location: dbDog.location || '未知地點',
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

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoadingAuth(true);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single<DbProfile>();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for new users
          console.error('讀取個人資料時發生錯誤:', profileError);
          setProfile(null);
        } else if (profileData) {
          setProfile({
            id: profileData.id,
            role: profileData.role as UserRole,
            fullName: profileData.full_name,
            avatarUrl: profileData.avatar_url,
            updatedAt: profileData.updated_at,
          });
        } else {
          setProfile(null); // No profile found
        }
      } else {
        setProfile(null);
        setLikedDogs([]);
        setSeenDogIds(new Set());
        setCurrentDogIndex(0);
      }
      setIsLoadingAuth(false);
    });

    // Initial check for active session
    async function getInitialSession() {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', initialSession.user.id).single<DbProfile>();
            if (profileData) {
                 setProfile({
                    id: profileData.id,
                    role: profileData.role as UserRole,
                    fullName: profileData.full_name,
                    avatarUrl: profileData.avatar_url,
                    updatedAt: profileData.updated_at,
                });
            }
        }
        setIsLoadingAuth(false);
    }
    getInitialSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);


  const loadInitialDogData = useCallback(async () => {
    if (!user && !isLoadingAuth && !session) { 
      setIsLoadingDogs(true);
      try {
        const { data: dogsData, error: dogsError } = await supabase
          .from('dogs')
          .select('*')
          .eq('status', 'Available'); // Fetch only available dogs for non-logged in users

        if (dogsError) {
          console.error('Error fetching dogs from Supabase:', dogsError);
          setMasterDogList([]);
        } else if (dogsData) {
          const allDogsFromDb = dogsData.map(mapDbDogToDogType);
          setMasterDogList(allDogsFromDb);
        }
      } catch (error) {
        console.error('Error fetching dogs from Supabase:', error);
        setMasterDogList([]);
      } finally {
        setIsLoadingDogs(false);
      }
      return;
    }

    if (user || session) { // User is logged in or session exists
      setIsLoadingDogs(true);
      try {
        const { data: dogsData, error: dogsError } = await supabase
          .from('dogs')
          .select('*')
          .eq('status', 'Available'); // Fetch all available dogs

        if (dogsError) {
           console.error('Error fetching dogs from Supabase:', dogsError, 'Check RLS policies on `dogs` table.');
           setMasterDogList([]);
           setLikedDogs([]);
           setIsLoadingDogs(false);
           return;
        }
        
        const allDogsFromDb = dogsData ? dogsData.map(mapDbDogToDogType) : [];
        setMasterDogList(allDogsFromDb);

        if (user) { // Fetch liked dogs only if user object is fully available
            const { data: likedDogsData, error: likedDogsError } = await supabase
            .from('user_dog_likes')
            .select('dog_id')
            .eq('user_id', user.id);

            if (likedDogsError) {
                console.error('Error fetching liked dogs:', likedDogsError);
                setLikedDogs([]);
            } else if (likedDogsData) {
                const likedDogIdsSet = new Set(likedDogsData.map((like: {dog_id: string}) => like.dog_id));
                const userLikedDogs = allDogsFromDb.filter(dog => likedDogIdsSet.has(dog.id));
                setLikedDogs(userLikedDogs);
            }
        } else {
            setLikedDogs([]); // No user, no liked dogs
        }

      } catch (error) {
        console.error('Error fetching dogs or liked dogs from Supabase:', error);
        setMasterDogList([]);
        setLikedDogs([]);
      } finally {
        setIsLoadingDogs(false);
      }
    } else { 
       setIsLoadingDogs(true); 
    }
  }, [user, isLoadingAuth, session]);


  useEffect(() => {
    loadInitialDogData();
  }, [loadInitialDogData]); 


  useEffect(() => {
    if (isLoadingDogs || masterDogList.length === 0) {
      setDogsToSwipe([]);
      return;
    }
    const dogsForSwiping = masterDogList.filter(dog =>
      !likedDogs.find(ld => ld.id === dog.id) &&
      !seenDogIds.has(dog.id) 
    );
    setDogsToSwipe(dogsForSwiping);
    if (currentDogIndex >= dogsForSwiping.length && dogsForSwiping.length > 0) {
        setCurrentDogIndex(0);
    } else if (dogsForSwiping.length === 0) {
        setCurrentDogIndex(0);
    }

  }, [masterDogList, likedDogs, seenDogIds, isLoadingDogs, currentDogIndex]);


  const likeDog = async (dogId: string) => {
    if (!user) {
      console.log("使用者未登入。按讚記錄未保存至資料庫。");
      setSeenDogIds(prevSeenIds => new Set(prevSeenIds).add(dogId));
      return;
    }

    const dog = masterDogList.find(d => d.id === dogId);
    if (!dog) return;

    if (!likedDogs.find(d => d.id === dogId)) {
      setLikedDogs(prevLikedDogs => [...prevLikedDogs, dog]);
      try {
        const { error } = await supabase.from('user_dog_likes').insert({
          user_id: user.id,
          dog_id: dogId,
        });
        if (error) throw error;
      } catch (error) {
        console.error("儲存按讚記錄至 Supabase 時發生錯誤:", error);
        setLikedDogs(prevLikedDogs => prevLikedDogs.filter(d => d.id !== dogId));
      }
    }
    setSeenDogIds(prevSeenIds => new Set(prevSeenIds).add(dogId));
  };

  const passDog = (dogId: string) => {
    setSeenDogIds(prevSeenDogIds => new Set(prevSeenDogIds).add(dogId));
  };
  
  const getDogById = (dogId: string): Dog | undefined => {
    return masterDogList.find(dog => dog.id === dogId);
  };

  const login = async (email: string, password: string): Promise<{ session: SupabaseSession | null; error: string | null }> => {
    setIsLoadingAuth(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoadingAuth(false);
    if (error) return { session: null, error: error.message || '登入失敗。請檢查您的帳號密碼。' };
    return { session: data.session, error: null };
  };

  const signUp = async (email: string, password: string, role: UserRole, fullName?: string | null): Promise<{ user: SupabaseUser | null; error: string | null }> => {
    setIsLoadingAuth(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setIsLoadingAuth(false);
      return { user: null, error: authError.message || '註冊失敗。請稍後再試。' };
    }
    if (!authData.user) {
      setIsLoadingAuth(false);
      return { user: null, error: '註冊成功，但未取得使用者資訊。' };
    }
    
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      role,
      full_name: fullName || email.split('@')[0],
      avatar_url: `https://placehold.co/100x100.png?text=${(fullName || email)[0].toUpperCase()}`,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      setIsLoadingAuth(false);
      // Potentially delete the auth user if profile creation fails, or handle cleanup
      console.error('建立個人資料時發生錯誤:', profileError);
      return { user: authData.user, error: '註冊成功，但建立個人資料失敗: ' + profileError.message };
    }
    
    // Manually update profile state as onAuthStateChange might not pick it up immediately for new signups
    // This also ensures the profile is available right after signup.
     setProfile({
        id: authData.user.id,
        role,
        fullName: fullName || email.split('@')[0],
        avatarUrl: `https://placehold.co/100x100.png?text=${(fullName || email)[0].toUpperCase()}`,
        updatedAt: new Date().toISOString(),
      });

    setIsLoadingAuth(false);
    return { user: authData.user, error: null };
  };

  const logout = async (): Promise<{ error: string | null }> => {
    setIsLoadingAuth(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setIsLoadingAuth(false);
      return { error: error.message || '登出時發生錯誤。' };
    }
    // onAuthStateChange listener will handle clearing user, session, profile
    setMasterDogList([]);
    setLikedDogs([]);
    setSeenDogIds(new Set());
    setCurrentDogIndex(0);
    setDogsToSwipe([]);
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
        session,
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

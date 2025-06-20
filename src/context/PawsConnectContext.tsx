
"use client";

import type { Dog, Profile, UserRole, HealthRecord, FeedingSchedule, VaccinationRecord } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User as SupabaseUser, Session as SupabaseSession, PostgrestError } from '@supabase/supabase-js';
// Adjust the import to correctly type the 'dogs' view output.
// The 'DbDog' type will now represent a row from the 'dogs_for_adoption_view'.
type DbDog = Database['public']['Views']['dogs_for_adoption_view']['Row'];
type DbProfile = Database['public']['Tables']['profiles']['Row'];
import type { Database } from '@/types/supabase';


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

// This function maps a row from the `dogs_for_adoption_view` to the frontend `Dog` type.
const mapDbDogToDogType = (dbViewDog: DbDog): Dog => {
  const defaultHealthRecord: HealthRecord = { lastCheckup: '', conditions: ['無'], notes: '未提供記錄' };
  const defaultFeedingSchedule: FeedingSchedule = { foodType: '未指定', timesPerDay: 0, portionSize: '未指定', notes: '未提供記錄' };
  
  const photos = Array.isArray(dbViewDog.photos) ? dbViewDog.photos.filter((p): p is string => typeof p === 'string') : [];
  const personalityTraits = Array.isArray(dbViewDog.personality_traits) ? dbViewDog.personality_traits.filter((p): p is string => typeof p === 'string') : [];
  
  // The view should provide these as valid JSONB or null
  const healthRecordsData = dbViewDog.health_records as HealthRecord || defaultHealthRecord;
  const feedingScheduleData = dbViewDog.feeding_schedule as FeedingSchedule || defaultFeedingSchedule;
  const vaccinationRecordsData = (dbViewDog.vaccination_records ? (Array.isArray(dbViewDog.vaccination_records) ? dbViewDog.vaccination_records : []) : []) as VaccinationRecord[];

  return {
    id: dbViewDog.id,
    name: dbViewDog.name || '未命名狗狗',
    breed: dbViewDog.breed || '未知品種',
    age: typeof dbViewDog.age === 'number' ? dbViewDog.age : 0,
    gender: dbViewDog.gender === 'Male' || dbViewDog.gender === 'Female' ? dbViewDog.gender : 'Unknown',
    photos: photos.length > 0 ? photos : ['https://placehold.co/600x400.png?text=' + encodeURIComponent(dbViewDog.name || 'Dog')],
    description: dbViewDog.description || '暫無描述。',
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
    liveStreamUrl: dbViewDog.live_stream_url ?? undefined,
    status: dbViewDog.status === 'Available' || dbViewDog.status === 'Pending' || dbViewDog.status === 'Adopted' ? dbViewDog.status : 'Available',
    location: dbViewDog.location || '未知地點',
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

        if (profileError && profileError.code !== 'PGRST116') { 
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
          setProfile(null); 
        }
      } else {
        setProfile(null);
        setLikedDogs([]);
        setSeenDogIds(new Set());
        setCurrentDogIndex(0);
      }
      setIsLoadingAuth(false);
    });

    
    async function getInitialSession() {
        setIsLoadingAuth(true);
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
    // Query the 'dogs_for_adoption_view' instead of a 'dogs' table
    const sourceToQuery = 'dogs_for_adoption_view'; 
    setIsLoadingDogs(true);
    try {
      const { data: dogsData, error: dogsError } = await supabase
        .from(sourceToQuery)
        .select('*');

      if (dogsError) {
        // Check if dogsError is an empty object and dogsData is also effectively empty (null, undefined, or empty array)
        // This is a strong indicator of RLS issues or silent failures where no data is returned.
        if (dogsError && typeof dogsError === 'object' && Object.keys(dogsError).length === 0 && (dogsData === null || dogsData === undefined || (Array.isArray(dogsData) && dogsData.length === 0))) {
          console.error(
            `Error fetching dogs from Supabase view '${sourceToQuery}': Received an empty error object and no data. This often indicates that Row Level Security (RLS) policies on the view OR its underlying tables (pets, health_records, etc.) are preventing access for the current role (anon or authenticated), or there are no dogs matching the query.\n\n` +
            "【請檢查您的 Supabase 設定】:\n" +
            `1. '${sourceToQuery}' 檢視的 RLS 原則：確認 'anon' 和 'authenticated' 角色有 SELECT 權限。\n` +
            "2. 底層資料表 (pets, health_records, feeding_records, vaccine_records) 的 RLS 原則：執行檢視的角色也需要對這些底層資料表有 SELECT 權限。\n" +
            "3. 資料確認：確認您的 'pets' 表格中有資料，且符合檢視的篩選條件 (如果有的話)。\n",
            "原始錯誤物件:", dogsError
          );
        } else {
          console.error(`Error fetching dogs from Supabase view '${sourceToQuery}':`, dogsError);
        }
        setMasterDogList([]);
        setLikedDogs([]); // Also reset liked dogs if initial fetch fails
      } else if (dogsData) {
        const allDogsFromDb = dogsData.map(mapDbDogToDogType);
        setMasterDogList(allDogsFromDb);

        if (user) { 
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
            setLikedDogs([]); 
        }
      }
    } catch (error) {
      console.error(`Error fetching dogs from Supabase view '${sourceToQuery}' (catch block):`, error);
      setMasterDogList([]);
      setLikedDogs([]);
    } finally {
      setIsLoadingDogs(false);
    }
  }, [user, isLoadingAuth]);


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
      alert("請先登入才能按讚狗狗！");
      return;
    }

    const dog = masterDogList.find(d => d.id === dogId);
    if (!dog) return;

    if (!likedDogs.find(d => d.id === dogId)) {
      setLikedDogs(prevLikedDogs => [...prevLikedDogs, dog]);
      try {
        const { error } = await supabase.from('user_dog_likes').insert({
          user_id: user.id,
          dog_id: dogId, // This dogId comes from pets.id via the view
        });
        if (error) throw error;
      } catch (error) {
        console.error("儲存按讚記錄至 Supabase 時發生錯誤:", error);
        // Revert optimistic update
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
    if (data.session) await loadInitialDogData(); // Reload dogs after login
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
      console.error('建立個人資料時發生錯誤:', profileError);
      // User is signed up, but profile creation failed. Consider how to handle this.
      // Maybe sign them out and ask to retry? For now, just return the error.
      return { user: authData.user, error: '註冊成功，但建立個人資料失敗: ' + profileError.message };
    }
    
     setProfile({ // Optimistically set profile
        id: authData.user.id,
        role,
        fullName: fullName || email.split('@')[0],
        avatarUrl: `https://placehold.co/100x100.png?text=${(fullName || email)[0].toUpperCase()}`,
        updatedAt: new Date().toISOString(),
      });
    
    await loadInitialDogData(); // Reload dogs after sign up and profile creation
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
    // Reset state, dogs will be reloaded by loadInitialDogData based on new auth state
    setMasterDogList([]);
    setLikedDogs([]);
    setSeenDogIds(new Set());
    setCurrentDogIndex(0);
    setDogsToSwipe([]);
    // loadInitialDogData will be called by the useEffect listening to user/isLoadingAuth
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



"use client";

import type { Dog, Profile, UserRole, HealthRecord, FeedingSchedule, VaccinationRecord } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User as SupabaseUser, Session as SupabaseSession, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
type DbDog = Database['public']['Views']['dogs_for_adoption_view']['Row'];
type DbProfile = Database['public']['Tables']['profiles']['Row'];


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
  isUpdatingProfile: boolean;
  login: (email: string, password: string) => Promise<{ session: SupabaseSession | null; error: string | null }>;
  signUp: (email: string, password: string, role: UserRole, fullName?: string | null) => Promise<{ user: SupabaseUser | null; error: string | null }>;
  logout: () => Promise<{ error: string | null }>;
  updateProfile: (updates: { fullName?: string | null; avatarUrl?: string | null }) => Promise<{ success: boolean; error?: string | null; updatedProfile?: Profile | null }>;
}

const PawsConnectContext = createContext<PawsConnectContextType | undefined>(undefined);

const mapDbDogToDogType = (dbViewDog: DbDog): Dog => {
  const defaultHealthRecord: HealthRecord = { lastCheckup: '', conditions: ['無'], notes: '未提供記錄' };
  const defaultFeedingSchedule: FeedingSchedule = { foodType: '未指定', timesPerDay: 0, portionSize: '未指定', notes: '未提供記錄' };
  
  const photos = Array.isArray(dbViewDog.photos) ? dbViewDog.photos.filter((p): p is string => typeof p === 'string') : [];
  const personalityTraits = Array.isArray(dbViewDog.personality_traits) ? dbViewDog.personality_traits.filter((p): p is string => typeof p === 'string') : [];
  
  const healthRecordsData = (dbViewDog.health_records as unknown) as HealthRecord || defaultHealthRecord;
  const feedingScheduleData = (dbViewDog.feeding_schedule as unknown) as FeedingSchedule || defaultFeedingSchedule;
  const vaccinationRecordsData = (dbViewDog.vaccination_records ? (Array.isArray(dbViewDog.vaccination_records) ? dbViewDog.vaccination_records : []) : []) as VaccinationRecord[];

  return {
    id: dbViewDog.id,
    name: dbViewDog.name || '未命名狗狗',
    breed: dbViewDog.breed || '未知品種',
    age: typeof dbViewDog.age === 'number' ? dbViewDog.age : 0,
    gender: dbViewDog.gender === 'Male' || dbViewDog.gender === 'Female' || dbViewDog.gender === 'Unknown' ? dbViewDog.gender : 'Unknown',
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
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);


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
    const sourceToQuery = 'dogs_for_adoption_view'; 
    setIsLoadingDogs(true);
    try {
      const { data: dogsData, error: dogsError } = await supabase
        .from(sourceToQuery)
        .select('*');

      if (dogsError) {
        const isErrorAnEmptyObject = typeof dogsError === 'object' && dogsError !== null && Object.keys(dogsError).length === 0;
        if (isErrorAnEmptyObject) {
           console.error(
            `Error fetching dogs from Supabase view '${sourceToQuery}': Received an EMPTY error object. This STRONGLY indicates Row Level Security (RLS) policies or table/view permission issues.\n` +
            `Current dogsData (might be undefined/null/empty array, which is unusual with an empty error): ${JSON.stringify(dogsData)}\n\n` +
            "【請檢查您的 Supabase 設定】:\n" +
            `1. RLS policies on the VIEW '${sourceToQuery}'. Ensure the querying role ('anon' or 'authenticated') has SELECT permissions.\n` +
            "2. RLS policies on all UNDERLYING TABLES used by the view (e.g., 'pets', 'health_records', 'feeding_records', 'vaccine_records'). The querying role needs SELECT access on these too.\n" +
            "3. Data existence: Verify that data exists in the 'pets' table and related tables that would match the view's criteria and RLS.\n" +
            "4. Supabase Logs: Check the logs in your Supabase project dashboard (Database > Logs or Query Performance) for more detailed error messages from Postgres related to permission denials.\n" +
            "5. View Definition: Double-check the view's SQL definition for correctness and that it can properly access and join data from all underlying tables.\n",
            "原始錯誤物件:", dogsError
          );
        } else {
          console.error(`Error fetching dogs from Supabase view '${sourceToQuery}':`, dogsError);
        }
        setMasterDogList([]);
        setLikedDogs([]); // Also reset liked dogs if initial fetch fails
      } else if (dogsData && dogsData.length > 0) {
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
      } else {
        // No error, but dogsData is null, undefined, or empty
         console.warn(
            `Warning: Fetched no dogs from Supabase view '${sourceToQuery}' (data is null, undefined, or empty array) and no error was reported by Supabase. This might be due to:\n` +
            "1. Row Level Security (RLS) policies silently filtering all records from the view or its underlying tables.\n" +
            "2. The view or underlying tables being genuinely empty or having no records matching the view's criteria and RLS.\n\n" +
            "【請檢查您的 Supabase 設定】:\n" +
            `* RLS policies on the VIEW '${sourceToQuery}' and its UNDERLYING TABLES.\n` +
            "* Data existence in 'pets' and related tables that satisfies RLS conditions.\n"
        );
        setMasterDogList([]);
        setLikedDogs([]);
      }
    } catch (error) {
      console.error(`Unhandled error during dog data fetch from Supabase view '${sourceToQuery}':`, error);
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
          dog_id: dogId, 
        });
        if (error) throw error;
      } catch (error: any) {
        const isErrorAnEmptyObject = typeof error === 'object' && error !== null && Object.keys(error).length === 0;
        if (isErrorAnEmptyObject) {
          console.error(
            "儲存按讚記錄至 Supabase 時發生錯誤: 收到了空的錯誤物件。這通常表示 Supabase 的 Row Level Security (RLS) 政策阻止了此操作，或者資料表權限不足。\n\n" +
            "【請檢查您的 Supabase 設定】:\n" +
            "1. RLS 政策: 確認 'user_dog_likes' 資料表有允許 'authenticated' 角色 INSERT 操作的 RLS 政策。例如：\n" +
            "   CREATE POLICY \"Users can insert their own likes.\" ON public.user_dog_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);\n" +
            "2. 資料表權限: 在 Supabase Dashboard > Table Editor > 'user_dog_likes' > Table Privileges，確認 'authenticated' 角色有 INSERT 權限。\n" +
            "3. Supabase Logs: 查看 Supabase 專案儀表板中的日誌 (Database > Logs 或 Query Performance) 以獲取更詳細的錯誤訊息。\n",
            "原始錯誤物件:", error
          );
        } else {
          console.error("儲存按讚記錄至 Supabase 時發生錯誤:", error);
        }
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
    if (data.session) await loadInitialDogData(); 
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
      return { user: authData.user, error: '註冊成功，但建立個人資料失敗: ' + profileError.message };
    }
    
     setProfile({ 
        id: authData.user.id,
        role,
        fullName: fullName || email.split('@')[0],
        avatarUrl: `https://placehold.co/100x100.png?text=${(fullName || email)[0].toUpperCase()}`,
        updatedAt: new Date().toISOString(),
      });
    
    await loadInitialDogData(); 
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
    setMasterDogList([]);
    setLikedDogs([]);
    setSeenDogIds(new Set());
    setCurrentDogIndex(0);
    setDogsToSwipe([]);
    setIsLoadingAuth(false); 
    return { error: null };
  };

  const updateProfile = async (updates: { fullName?: string | null; avatarUrl?: string | null }): Promise<{ success: boolean; error?: string | null; updatedProfile?: Profile | null }> => {
    if (!user) {
      return { success: false, error: "使用者未登入。" };
    }
    setIsUpdatingProfile(true);
    try {
      const profileUpdateData: Partial<DbProfile> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.fullName !== undefined) {
        profileUpdateData.full_name = updates.fullName;
      }
      if (updates.avatarUrl !== undefined) {
        profileUpdateData.avatar_url = updates.avatarUrl;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', user.id)
        .select()
        .single<DbProfile>();

      if (error) throw error;

      if (data) {
        const newProfile: Profile = {
          id: data.id,
          role: data.role as UserRole,
          fullName: data.full_name,
          avatarUrl: data.avatar_url,
          updatedAt: data.updated_at,
        };
        setProfile(newProfile); // Update local context state
        return { success: true, updatedProfile: newProfile };
      }
      return { success: false, error: "更新個人資料失敗，未收到回傳資料。" };
    } catch (error: any) {
      console.error("更新個人資料時發生錯誤:", error);
      return { success: false, error: error.message || "更新個人資料時發生未預期的錯誤。" };
    } finally {
      setIsUpdatingProfile(false);
    }
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
        isUpdatingProfile,
        login,
        signUp,
        logout,
        updateProfile
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


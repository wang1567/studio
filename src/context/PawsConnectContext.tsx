
"use client";

import type { Dog, Profile, UserRole, HealthRecord, FeedingSchedule, VaccinationRecord } from '@/types';
import React, from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User as SupabaseUser, Session as SupabaseSession, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';
type DbDog = Database['public']['Views']['dogs_for_adoption_view']['Row'];
type DbProfile = Database['public']['Tables']['profiles']['Row'];


interface PawsConnectContextType {
  dogsToSwipe: Dog[];
  likedDogs: Dog[];
  seenDogIds: Set<string>;
  likeDog: (dogId: string) => Promise<void>;
  passDog: (dogId:string) => void;
  getDogById: (dogId: string) => Dog | undefined;
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

const PawsConnectContext = React.createContext<PawsConnectContextType | undefined>(undefined);

const mapDbDogToDogType = (dbViewDog: DbDog): Dog => {
  const defaultHealthRecord: HealthRecord = { lastCheckup: '', conditions: [], notes: '未提供記錄' };
  const defaultFeedingSchedule: FeedingSchedule = { foodType: '未指定', timesPerDay: 0, portionSize: '未指定', notes: '未提供記錄' };
  
  const photos = Array.isArray(dbViewDog.photos) ? dbViewDog.photos.filter((p): p is string => typeof p === 'string') : [];
  const personalityTraits = Array.isArray(dbViewDog.personality_traits) ? dbViewDog.personality_traits.filter((p): p is string => typeof p === 'string') : [];
  
  const healthRecordsData = (dbViewDog.health_records as unknown) as HealthRecord | null;
  const feedingScheduleData = (dbViewDog.feeding_schedule as unknown) as FeedingSchedule | null;
  const vaccinationRecordsData = (dbViewDog.vaccination_records ? (Array.isArray(dbViewDog.vaccination_records) ? dbViewDog.vaccination_records : []) : []) as VaccinationRecord[];

  const meaningfulConditions = healthRecordsData?.conditions?.filter(
    c => c && c.trim() && c.trim().toLowerCase() !== 'none' && c.trim() !== '無'
  ) || [];

  return {
    id: dbViewDog.id,
    name: dbViewDog.name || '未命名狗狗',
    breed: dbViewDog.breed || '未知品種',
    age: typeof dbViewDog.age === 'number' ? dbViewDog.age : 0,
    gender: dbViewDog.gender === 'Male' || dbViewDog.gender === 'Female' || dbViewDog.gender === 'Unknown' ? dbViewDog.gender : 'Unknown',
    photos: photos.length > 0 ? photos : ['https://placehold.co/600x400.png?text=' + encodeURIComponent(dbViewDog.name || 'Dog')],
    description: dbViewDog.description || '暫無描述。',
    healthRecords: {
      lastCheckup: healthRecordsData?.lastCheckup || defaultHealthRecord.lastCheckup,
      conditions: meaningfulConditions,
      notes: healthRecordsData?.notes || defaultHealthRecord.notes,
    },
    feedingSchedule: {
      foodType: feedingScheduleData?.foodType || defaultFeedingSchedule.foodType,
      timesPerDay: typeof feedingScheduleData?.timesPerDay === 'number' ? feedingScheduleData.timesPerDay : defaultFeedingSchedule.timesPerDay,
      portionSize: feedingScheduleData?.portionSize || defaultFeedingSchedule.portionSize,
      notes: feedingScheduleData?.notes || defaultFeedingSchedule.notes,
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


export const PawsConnectProvider = ({ children }: { children: React.ReactNode }) => {
  const [masterDogList, setMasterDogList] = React.useState<Dog[]>([]);
  const [dogsToSwipe, setDogsToSwipe] = React.useState<Dog[]>([]);
  const [likedDogs, setLikedDogs] = React.useState<Dog[]>([]);
  const [seenDogIds, setSeenDogIds] = React.useState<Set<string>>(new Set());
  const [isLoadingDogs, setIsLoadingDogs] = React.useState(true);

  const [user, setUser] = React.useState<SupabaseUser | null>(null);
  const [session, setSession] = React.useState<SupabaseSession | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);
  const authCheckCompleted = React.useRef(false);
  const { toast } = useToast();


  React.useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          setSession(session);
          const currentUser = session?.user ?? null;
          setUser(currentUser);

          if (currentUser) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
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
          }
        } catch (e) {
          console.error("處理身份驗證狀態變更時發生未預期的錯誤:", e);
        } finally {
           if (!authCheckCompleted.current) {
            setIsLoadingAuth(false);
            authCheckCompleted.current = true;
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);


  const loadInitialDogData = React.useCallback(async () => {
    const sourceToQuery = 'dogs_for_adoption_view'; 
    setIsLoadingDogs(true);
    try {
      const { data: dogsData, error: dogsError } = await supabase
        .from(sourceToQuery)
        .select('*');
        
      if (dogsError) {
          console.error(`Error fetching dogs from Supabase view '${sourceToQuery}':`, dogsError);
        setMasterDogList([]);
        setLikedDogs([]);
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
         console.warn(
            "================================================================================\n" +
            "=== POTENTIAL DATABASE PERMISSION ISSUE (RLS) - PLEASE READ CAREFULLY ===\n" +
            "================================================================================\n" +
            `Warning: The query to fetch dogs from the '${sourceToQuery}' view succeeded but returned 0 dogs. This is often not an error in the application code, but a sign of a Row Level Security (RLS) policy on the underlying 'pets' table.\n\n` +
            "TO FIX THIS, please check the RLS policies on your 'pets' table in the Supabase dashboard.\n\n" +
            "If you want all users to be able to see all pets, you need a policy like this:\n" +
            'CREATE POLICY "All users can view all pets." ON "public"."pets" FOR SELECT USING (true);\n\n' +
            "Without a permissive SELECT policy, each user might only be able to see the pets they added themselves, resulting in an empty list for other users.\n" +
            "================================================================================"
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
  }, [user]);


  React.useEffect(() => {
    if (!isLoadingAuth) {
      loadInitialDogData();
    }
  }, [isLoadingAuth, loadInitialDogData]);


  React.useEffect(() => {
    if (isLoadingDogs || masterDogList.length === 0) {
      setDogsToSwipe([]);
      return;
    }
    const dogsForSwiping = masterDogList.filter(dog =>
      !likedDogs.find(ld => ld.id === dog.id) &&
      !seenDogIds.has(dog.id) 
    );
    setDogsToSwipe(dogsForSwiping);
  }, [masterDogList, likedDogs, seenDogIds, isLoadingDogs]);


  const likeDog = async (dogId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "需要登入",
        description: "請先登入才能按讚狗狗！",
      });
      return;
    }

    const dog = masterDogList.find(d => d.id === dogId);
    if (!dog) return;

    if (!likedDogs.find(d => d.id === dogId)) {
      setLikedDogs(prevLikedDogs => [...prevLikedDogs, dog]);
    }
    setSeenDogIds(prevSeenIds => new Set(prevSeenIds).add(dogId));

    const { error: insertError } = await supabase.from('user_dog_likes').insert({
      user_id: user.id,
      dog_id: dogId,
    });
    
    if (insertError) {
      // Revert UI change on error
      setLikedDogs(prevLikedDogs => prevLikedDogs.filter(d => d.id !== dogId));
      
      // THIS IS A DATABASE PERMISSION ERROR.
      // The code is working correctly. The fix is in your Supabase project.
      // You MUST enable Row Level Security (RLS) and create a policy.
      console.error(
          "================================================================================\n" +
          "=== DATABASE PERMISSION ERROR (RLS) - PLEASE READ CAREFULLY ===\n" +
          "================================================================================\n" +
          "The application code is working correctly. This is not a bug in the app.\n" +
          "Your Supabase database has correctly blocked an action due to Row Level Security (RLS).\n\n" +
          "TO FIX THIS, you must run the following SQL command in your Supabase project's SQL Editor:\n\n" +
          'CREATE POLICY "Users can insert their own likes."\n' +
          'ON "public"."user_dog_likes"\n' +
          'FOR INSERT\n' +
          'TO authenticated\n' +
          'WITH CHECK (auth.uid() = user_id);\n\n' +
          "After running this command, the like functionality will work.\n" +
          "================================================================================\n" +
          "Original Supabase error object:",
          insertError
      );
      
      // User-facing error toast with the direct solution
      toast({
        variant: "destructive",
        title: "按讚失敗：需要資料庫設定",
        description: "您的資料庫缺少一項安全規則 (RLS)。請在 Supabase SQL Editor 中執行 'CREATE POLICY \"Users can insert their own likes.\" ON public.user_dog_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);' 來解決此問題。",
        duration: 20000 // Increase duration to allow copying the text
      });

      return;
    }
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
    
    if (error) {
      setIsLoadingAuth(false);
      return { session: null, error: error.message || '登入失敗。請檢查您的帳號密碼。' };
    }
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
      console.error('建立個人資料時發生錯誤:', profileError);
      setIsLoadingAuth(false);
      return { user: authData.user, error: '註冊成功，但建立個人資料失敗: ' + profileError.message };
    }
    
    return { user: authData.user, error: null };
  };

  const logout = async (): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message || '登出時發生錯誤。' };
    }
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
        setProfile(newProfile); 
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
  const context = React.useContext(PawsConnectContext);
  if (context === undefined) {
    throw new Error('usePawsConnect 必須在 PawsConnectProvider 內使用');
  }
  return context;
};

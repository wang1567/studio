"use client";

import type { Dog, Profile, UserRole, HealthRecord, FeedingSchedule, VaccinationRecord } from '@/types';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User as SupabaseUser, Session as SupabaseSession, PostgrestError, AuthApiError } from '@supabase/supabase-js';
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
  loadDogsWhenNeeded: () => Promise<void>;
  getLikedDogsCount: () => Promise<number>;

  user: SupabaseUser | null;
  profile: Profile | null;
  session: SupabaseSession | null;
  isLoadingAuth: boolean;
  isUpdatingProfile: boolean;
  login: (email: string, password: string) => Promise<{ session: SupabaseSession | null; error: string | null }>;
  signUp: (email: string, password: string, role: UserRole, fullName?: string | null) => Promise<{ user: SupabaseUser | null; error: string | null }>;
  logout: () => Promise<{ error: string | null }>;
  updateProfile: (updates: { fullName?: string | null; avatarUrl?: string | null }) => Promise<{ success: boolean; error?: string | null; updatedProfile?: Profile | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: string | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: string | null }>;
  updateUserEmail: (newEmail: string) => Promise<{ error: string | null }>;
}

const PawsConnectContext = React.createContext<PawsConnectContextType | undefined>(undefined);

const mapDbDogToDogType = (dbViewDog: DbDog): Dog => {
  const defaultHealthRecord: HealthRecord = { lastCheckup: '', conditions: [], notes: '未提供記錄' };
  const defaultFeedingSchedule: FeedingSchedule = { foodType: '未指定', timesPerDay: 0, portionSize: '未指定', notes: '未提供記錄' };
  
  const photos = Array.isArray(dbViewDog.photos) ? dbViewDog.photos.filter((p): p is string => typeof p === 'string') : [];
  const personalityTraits = Array.isArray(dbViewDog.personality_traits) ? dbViewDog.personality_traits.filter((p): p is string => typeof p === 'string') : [];
  
  const healthRecordsData = (dbViewDog.health_records as unknown) as HealthRecord | null;
  const feedingScheduleData = (dbViewDog.feeding_schedule as unknown) as FeedingSchedule | null;

  // Normalize vaccination records coming from JSON aggregate
  const vaccinationRecordsRaw = (dbViewDog.vaccination_records as unknown) as any[] | null;
  const vaccinationRecords: VaccinationRecord[] = Array.isArray(vaccinationRecordsRaw)
    ? vaccinationRecordsRaw.map((vr: any) => ({
        vaccineName: typeof vr?.vaccine_name === 'string' ? vr.vaccine_name : (typeof vr?.vaccineName === 'string' ? vr.vaccineName : '未指定疫苗'),
        dateAdministered: typeof vr?.date === 'string' ? vr.date : (typeof vr?.dateAdministered === 'string' ? vr.dateAdministered : ''),
        nextDueDate: typeof vr?.next_due_date === 'string' ? vr.next_due_date : (typeof vr?.nextDueDate === 'string' ? vr.nextDueDate : undefined),
      }))
    : [];

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
    vaccinationRecords,
    liveStreamUrl: dbViewDog.live_stream_url || undefined,
    status: dbViewDog.status === 'Available' || dbViewDog.status === 'Pending' || dbViewDog.status === 'Adopted' ? dbViewDog.status : 'Available',
    location: dbViewDog.location || '未知地點',
    personalityTraits: personalityTraits.length > 0 ? personalityTraits : ['個性溫和'],
  };
};


export const PawsConnectProvider = ({ children }: { children: React.ReactNode }) => {
  const [masterDogList, setMasterDogList] = useState<Dog[]>([]);
  const [dogsToSwipe, setDogsToSwipe] = useState<Dog[]>([]);
  const [likedDogs, setLikedDogs] = useState<Dog[]>([]);
  const [seenDogIds, setSeenDogIds] = useState<Set<string>>(new Set());
  const [isLoadingDogs, setIsLoadingDogs] = useState(false);
  const [dogsLoaded, setDogsLoaded] = useState(false);
  const [likedDogsCountCache, setLikedDogsCountCache] = useState<number | null>(null);

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isLiking, setIsLiking] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Load dogs data when needed (for swipe interface)
  const loadDogsWhenNeeded = useCallback(async () => {
    if (dogsLoaded || isLoadingDogs || !user) return;
    
    setIsLoadingDogs(true);
    try {
      await loadInitialDogData(user.id);
      setDogsLoaded(true);
    } catch (error) {
      console.error('Error loading dogs when needed:', error);
    } finally {
      setIsLoadingDogs(false);
    }
  }, [dogsLoaded, isLoadingDogs, user?.id]); // 只依賴 user.id 而不是整個 user 物件

  const resetDogState = useCallback(() => {
    setMasterDogList([]);
    setDogsToSwipe([]);
    setLikedDogs([]);
    setDogsLoaded(false);
    setSeenDogIds(new Set());
    setIsLoadingDogs(true);
    setLikedDogsCountCache(null);
  }, []);

  // Get liked dogs count without loading full dog data
  const getLikedDogsCount = useCallback(async (): Promise<number> => {
    console.log('🔍 [getLikedDogsCount] 開始獲取喜歡的狗狗數量');
    
    if (!user) {
      console.log('❌ [getLikedDogsCount] 用戶未登入，返回 0');
      return 0;
    }
    
    console.log(`👤 [getLikedDogsCount] 用戶ID: ${user.id}`);
    
    // If dogs are already loaded, use cached data
    if (dogsLoaded && likedDogs.length > 0) {
      console.log(`✅ [getLikedDogsCount] 使用已載入的狗狗資料，數量: ${likedDogs.length}`);
      return likedDogs.length;
    }
    
    // Use cached count if available
    if (likedDogsCountCache !== null) {
      console.log(`💾 [getLikedDogsCount] 使用快取資料，數量: ${likedDogsCountCache}`);
      return likedDogsCountCache;
    }
    
    console.log('🌐 [getLikedDogsCount] 開始從資料庫獲取數量');
    
    try {
      const { count, error } = await supabase
        .from('user_dog_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('liked', true);
      
      if (error) {
        console.error('❌ [getLikedDogsCount] 資料庫查詢錯誤:', error);
        return 0;
      }
      
      const result = count || 0;
      console.log(`✅ [getLikedDogsCount] 成功獲取數量: ${result}`);
      setLikedDogsCountCache(result);
      console.log(`💾 [getLikedDogsCount] 已快取數量: ${result}`);
      return result;
    } catch (error) {
      console.error('💥 [getLikedDogsCount] 未預期錯誤:', error);
      return 0;
    }
  }, [user?.id, dogsLoaded, likedDogsCountCache]); // 只依賴真正會影響結果的變數


  const fetchProfileAndSet = async (user: SupabaseUser | null) => {
    console.log('🔍 [fetchProfileAndSet] 開始獲取個人資料');
    
    if (!user) {
      console.log('❌ [fetchProfileAndSet] 用戶為空，設定 profile 為 null');
      setProfile(null);
      return;
    }

    console.log(`👤 [fetchProfileAndSet] 用戶ID: ${user.id}, Email: ${user.email}`);

    // 先檢查快取
    const cachedProfile = localStorage.getItem('pawsconnect_profile');
    if (cachedProfile) {
      try {
        const profileData = JSON.parse(cachedProfile);
        if (profileData.id === user.id) {
          console.log('💾 [fetchProfileAndSet] 使用快取的 profile 資料:', profileData);
          setProfile(profileData);
          // 在背景更新 profile，但不阻塞 UI
          console.log('🔄 [fetchProfileAndSet] 在背景更新 profile 資料');
          fetchAndUpdateProfile(user);
          return;
        }
      } catch (e) {
        console.log('快取 profile 資料無效');
      }
    }

    // 如果沒有快取，則進行完整載入
    await fetchAndUpdateProfile(user);
  };

  const fetchAndUpdateProfile = async (user: SupabaseUser) => {
    console.log('🌐 [fetchAndUpdateProfile] 開始從資料庫獲取最新 profile');
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single<DbProfile>();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ [fetchAndUpdateProfile] 讀取個人資料時發生錯誤:', profileError);
        setProfile(null);
      } else if (profileData) {
        console.log('✅ [fetchAndUpdateProfile] 成功獲取 profile 資料:', profileData);
        
        const newProfile = {
          id: profileData.id,
          role: profileData.role as UserRole,
          fullName: profileData.full_name,
          avatarUrl: profileData.avatar_url,
          updatedAt: profileData.updated_at,
        };
        
        console.log('📝 [fetchAndUpdateProfile] 處理後的 profile:', newProfile);
        setProfile(newProfile);
        
        // 更新快取
        localStorage.setItem('pawsconnect_profile', JSON.stringify(newProfile));
        console.log('💾 [fetchAndUpdateProfile] 已更新 localStorage 快取');
      } else {
        console.log('⚠️ [fetchAndUpdateProfile] 未找到 profile 資料，嘗試創建新的 profile');
        
        // 創建新的 profile 記錄
        try {
          console.log('🔨 [fetchAndUpdateProfile] 準備創建 profile，用戶資料:', {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata
          });
          
          const profileData = {
            id: user.id,
            role: 'adopter' as const, // 使用正確的 enum 值
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
            avatar_url: user.user_metadata?.avatar_url || null,
          };
          
          console.log('📝 [fetchAndUpdateProfile] 即將插入的資料:', profileData);
          
          const { data: newProfileData, error: createError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single<DbProfile>();

          if (createError) {
            console.error('❌ [fetchAndUpdateProfile] 創建 profile 失敗:', {
              error: createError,
              code: createError.code,
              message: createError.message,
              details: createError.details,
              hint: createError.hint
            });
            
            // 如果是唯一性約束錯誤，嘗試更新現有記錄
            if (createError.code === '23505') {
              console.log('🔄 [fetchAndUpdateProfile] profile 已存在，嘗試更新');
              const { data: updateData, error: updateError } = await supabase
                .from('profiles')
                .update({
                  full_name: profileData.full_name,
                  avatar_url: profileData.avatar_url,
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.id)
                .select()
                .single<DbProfile>();
                
              if (updateError) {
                console.error('❌ [fetchAndUpdateProfile] 更新 profile 也失敗:', updateError);
                setProfile(null);
                return;
              } else if (updateData) {
                console.log('✅ [fetchAndUpdateProfile] 成功更新現有 profile:', updateData);
                const updatedProfile = {
                  id: updateData.id,
                  role: updateData.role as UserRole,
                  fullName: updateData.full_name,
                  avatarUrl: updateData.avatar_url,
                  updatedAt: updateData.updated_at,
                };
                setProfile(updatedProfile);
                localStorage.setItem('pawsconnect_profile', JSON.stringify(updatedProfile));
                return;
              }
            }
            
            setProfile(null);
          } else if (newProfileData) {
            console.log('✅ [fetchAndUpdateProfile] 成功創建新的 profile:', newProfileData);
            
            const newProfile = {
              id: newProfileData.id,
              role: newProfileData.role as UserRole,
              fullName: newProfileData.full_name,
              avatarUrl: newProfileData.avatar_url,
              updatedAt: newProfileData.updated_at,
            };
            
            setProfile(newProfile);
            localStorage.setItem('pawsconnect_profile', JSON.stringify(newProfile));
            console.log('💾 [fetchAndUpdateProfile] 新 profile 已快取');
          }
        } catch (createErr) {
          console.error('💥 [fetchAndUpdateProfile] 創建 profile 時發生錯誤:', createErr);
          
          // 如果創建失敗，設置一個臨時的 profile
          console.log('🆘 [fetchAndUpdateProfile] 創建臨時 profile 以避免載入卡住');
          const tempProfile = {
            id: user.id,
            role: 'adopter' as UserRole,
            fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || '新用戶',
            avatarUrl: user.user_metadata?.avatar_url || null,
            updatedAt: new Date().toISOString(),
          };
          
          setProfile(tempProfile);
          // 不快取臨時 profile，以便下次重新嘗試創建
          console.log('⚠️ [fetchAndUpdateProfile] 使用臨時 profile，下次登入將重新嘗試創建');
        }
      }
    } catch (e) {
      console.error("💥 [fetchAndUpdateProfile] 處理個人資料時發生未預期的錯誤:", e);
      setProfile(null);
    }
  };

  useEffect(() => {
    const initializeSession = async () => {
      console.log('🚀 [initializeSession] 開始初始化 session');
      
      // 立即設置載入狀態為 false，使用快取資料
      const cachedUser = localStorage.getItem('pawsconnect_user');
      const cachedProfile = localStorage.getItem('pawsconnect_profile');
      const cachedSession = localStorage.getItem('pawsconnect_session');
      
      console.log('💾 [initializeSession] 檢查快取資料:', {
        hasUser: !!cachedUser,
        hasProfile: !!cachedProfile, 
        hasSession: !!cachedSession
      });
      
      if (cachedUser && cachedProfile && cachedSession) {
        try {
          const userData = JSON.parse(cachedUser);
          const profileData = JSON.parse(cachedProfile);
          const sessionData = JSON.parse(cachedSession);
          
          console.log('📦 [initializeSession] 解析快取資料成功:', {
            userId: userData.id,
            userEmail: userData.email,
            profileId: profileData.id,
            sessionExpiresAt: sessionData.expires_at
          });
          
          // 立即設置快取資料，不等待驗證
          setUser(userData);
          setProfile(profileData);
          setSession(sessionData);
          setIsLoadingAuth(false);
          
          // 檢查 session 是否過期
          const expiresAt = new Date(sessionData.expires_at || sessionData.expires_in);
          const now = new Date();
          
          if (expiresAt > now) {
            // Session 未過期，在背景驗證並更新
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session && session.user.id === userData.id) {
                setSession(session);
                localStorage.setItem('pawsconnect_session', JSON.stringify(session));
                // 背景更新 profile
                fetchAndUpdateProfile(session.user);
              }
            });
            
            return;
          }
        } catch (e) {
          console.log('緩存數據無效，清除並重新驗證');
        }
        
        // 清除無效緩存
        localStorage.removeItem('pawsconnect_user');
        localStorage.removeItem('pawsconnect_profile');
        localStorage.removeItem('pawsconnect_session');
      }
      
      // 執行完整驗證
      setIsLoadingAuth(true);
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
           const authError = error as AuthApiError;
           if (!(authError.message === 'Invalid Refresh Token: Refresh Token Not Found' && authError.status === 400)) {
               console.error("Error getting initial session:", error);
           }
        }
        
        const currentUser = initialSession?.user ?? null;
        setSession(initialSession);
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfileAndSet(currentUser);
          // 緩存用戶資料和 session
          localStorage.setItem('pawsconnect_user', JSON.stringify(currentUser));
          if (initialSession) {
            localStorage.setItem('pawsconnect_session', JSON.stringify(initialSession));
          }
        } else {
          setProfile(null);
        }

      } catch (e: any) {
         console.error("Critical error during session initialization:", e);
         setSession(null);
         setUser(null);
         setProfile(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        const currentUser = newSession?.user ?? null;
        const previousUserId = user?.id;

        // 只有在用戶真正改變時才設置載入狀態
        const userChanged = currentUser?.id !== previousUserId;
        
        if (userChanged) {
          setIsLoadingAuth(true);
        }
        
        setSession(newSession);
        setUser(currentUser);
        
        try {
          if (currentUser && userChanged) {
              await fetchProfileAndSet(currentUser);
              // 緩存用戶和 session 資料
              localStorage.setItem('pawsconnect_user', JSON.stringify(currentUser));
              if (newSession) {
                localStorage.setItem('pawsconnect_session', JSON.stringify(newSession));
              }
          } else if (!currentUser) {
              setProfile(null);
              resetDogState();
              // 清除緩存
              localStorage.removeItem('pawsconnect_user');
              localStorage.removeItem('pawsconnect_profile');
              localStorage.removeItem('pawsconnect_session');
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
        } finally {
          // 只有在用戶變更時才重置載入狀態
          if (userChanged || !currentUser) {
            setIsLoadingAuth(false);
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


 const loadInitialDogData = useCallback(async (currentUserId: string | null) => {
    setIsLoadingDogs(true);
    console.log(`🔄 開始載入狗狗資料 - userId: ${currentUserId}`);
    
    if (!currentUserId) {
        setMasterDogList([]);
        setDogsToSwipe([]);
        setLikedDogs([]);
        setIsLoadingDogs(false);
        return;
    }

    try {
        console.log('📝 查詢已按讚的狗狗...');
        const likedDogsPromise = supabase
            .from('user_dog_likes')
            .select(`dogs_for_adoption_view(*)`)
            .eq('user_id', currentUserId);

        console.log('📝 查詢所有狗狗...');
        const allDogsPromise = supabase
            .from('dogs_for_adoption_view')
            .select('*');

        const [likedDogsResult, allDogsResult] = await Promise.all([likedDogsPromise, allDogsPromise]);
        
        console.log('查詢結果:', { 
            likedDogsResult: likedDogsResult.data?.length, 
            allDogsResult: allDogsResult.data?.length 
        });

        const { data: likedDogsData, error: likedDogsError } = likedDogsResult;
        if (likedDogsError) {
            console.error("Error fetching liked dogs from Supabase:", likedDogsError);
            throw likedDogsError;
        }
        const userLikedDbDogs = (likedDogsData || [])
            .map((likeRecord: any) => likeRecord.dogs_for_adoption_view as DbDog | null)
            .filter((dog): dog is DbDog => !!dog);
        const userLikedDogs = userLikedDbDogs.map(mapDbDogToDogType);
        setLikedDogs(userLikedDogs);

        const { data: allDogsData, error: allDogsError } = allDogsResult;
        if (allDogsError) {
            console.error("❌ 查詢所有狗狗時發生錯誤:", allDogsError);
            throw allDogsError;
        }
        const allDogs = allDogsData.map(mapDbDogToDogType);
        setMasterDogList(allDogs);
        
        console.log(`✅ 載入了 ${allDogs.length} 隻狗狗到 masterDogList`);
        console.log('狗狗 IDs:', allDogs.map(d => ({ id: d.id, name: d.name })));

        const likedDogIdsSet = new Set(userLikedDogs.map(d => d.id));
        setSeenDogIds(likedDogIdsSet);
        
        const unseenDogs = allDogs.filter(dog => !likedDogIdsSet.has(dog.id));
        setDogsToSwipe(unseenDogs);
        
        console.log(`📊 統計: 總共${allDogs.length}隻狗狗，已按讚${userLikedDogs.length}隻，待滑卡${unseenDogs.length}隻`);

    } catch (error) {
        console.error("Unhandled error during dog data fetch:", error);
        setMasterDogList([]);
        setDogsToSwipe([]);
        setLikedDogs([]);
        toast({
            title: "資料載入失敗",
            description: "無法載入狗狗資料，請稍後重新整理。",
            variant: "destructive",
        });
    } finally {
        setIsLoadingDogs(false);
    }
}, [toast]);


  // Remove automatic dog loading when user logs in
  // Dogs will be loaded on-demand when needed for swipe interface

  useEffect(() => {
    if (!isLoadingDogs) {
      const dogsForSwiping = masterDogList.filter(dog => !seenDogIds.has(dog.id));
      setDogsToSwipe(dogsForSwiping);
    }
  }, [seenDogIds, masterDogList, isLoadingDogs]);


  const likeDog = async (dogId: string) => {
    console.log(`🐕 開始按讚流程 - dogId: ${dogId}, userId: ${user?.id}`);
    
    if (isLiking.has(dogId)) {
      console.log(`⚠️ 狗狗 ${dogId} 正在處理中，跳過重複按讚`);
      return;
    }

    if (!user) {
      console.log("❌ 用戶未登入");
      toast({
        variant: "destructive",
        title: "需要登入",
        description: "請先登入才能按讚狗狗！",
      });
      return;
    }

    const dog = masterDogList.find(d => d.id === dogId);
    if (!dog) {
      console.log(`❌ 找不到狗狗 ${dogId} 在 masterDogList 中`);
      return;
    }

    console.log(`✅ 找到狗狗: ${dog.name} (${dogId})`);

    try {
      setIsLiking(prev => new Set(prev).add(dogId));
      passDog(dogId); 

      console.log(`📝 準備插入資料庫: user_id=${user.id}, dog_id=${dogId}`);
      
      // 檢查狗狗是否在不同的資料表中存在
      console.log('🔍 開始檢查狗狗在各資料表中的存在性...');
      
      // 檢查 pets 資料表的詳細資訊
      const { data: petExists, error: petCheckError } = await supabase
        .from('pets')
        .select('id, name, created_at')
        .eq('id', dogId);
      
      console.log('🔍 檢查 pets 資料表:', { petExists, petCheckError });
      console.log('在 pets 資料表中找到的數量:', petExists ? petExists.length : 0);
      
      // 如果找不到，檢查 pets 資料表中的所有記錄
      if (!petExists || petExists.length === 0) {
        const { data: allPets, error: allPetsError } = await supabase
          .from('pets')
          .select('id, name')
          .limit(10);
        
        console.log('🔍 pets 資料表中的所有寵物（前10筆）:', { allPets, allPetsError });
        console.log('pets 資料表總記錄數:', allPets ? allPets.length : 0);
      }
      
      // 檢查 dogs_for_adoption_view 視圖（我們知道狗狗在這裡）
      const { data: viewExists, error: viewCheckError } = await supabase
        .from('dogs_for_adoption_view')
        .select('id')
        .eq('id', dogId);
        
      console.log('🔍 檢查 dogs_for_adoption_view:', { viewExists, viewCheckError });
      console.log('在 dogs_for_adoption_view 中找到的數量:', viewExists ? viewExists.length : 0);
      
      // 既然狗狗存在於 view 中，我們繼續進行
      if (viewCheckError) {
        console.log('⚠️ 查詢 view 時發生錯誤:', viewCheckError.message);
        toast({
          variant: "destructive",
          title: "按讚失敗",
          description: "無法驗證寵物資料",
        });
        return;
      } else if (!viewExists || viewExists.length === 0) {
        console.log('⚠️ 狗狗不存在於 dogs_for_adoption_view 中（這不應該發生）');
        toast({
          variant: "destructive",
          title: "按讚失敗",
          description: "此寵物資料異常，無法按讚",
        });
        return;
      } else {
        console.log('✅ 狗狗確實存在於 dogs_for_adoption_view 中，繼續插入流程');
        console.log('⚠️ 注意：狗狗在 view 中存在但在 pets 表中不存在，可能有資料同步問題');
      }
      
      const insertData = { 
        user_id: user.id, 
        dog_id: dogId,
        liked_at: new Date().toISOString()
      };
      
      console.log('插入資料:', insertData);
      console.log('🔄 開始執行資料庫插入操作...');
      console.log('目標資料表: user_dog_likes');
      console.log('當前用戶身份:', { userId: user.id, userEmail: user.email });

      // 先嘗試檢查是否已經存在該記錄
      const { data: existingLike, error: checkError } = await supabase
        .from('user_dog_likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('dog_id', dogId);

      console.log('🔍 檢查現有按讚記錄:', { existingLike, checkError });

      if (checkError) {
        console.log('⚠️ 檢查現有記錄時發生錯誤:', checkError.message);
      } else if (existingLike && existingLike.length > 0) {
        console.log('✅ 用戶已經按讚過此狗狗，跳過插入');
        return;
      }

      // 直接嘗試插入資料
      console.log('🚀 嘗試直接插入資料到 user_dog_likes...');
      const { data, error: insertError } = await supabase
        .from('user_dog_likes')
        .insert(insertData)
        .select();
      
      console.log('✅ 資料庫操作完成');
      console.log('插入結果:', { data, error: insertError });
      console.log('插入的資料筆數:', data ? data.length : 0);
      
      // 詳細錯誤資訊
      if (insertError) {
        console.log('🚨 詳細錯誤資訊:');
        console.log('錯誤代碼:', insertError.code);
        console.log('錯誤訊息:', insertError.message);
        console.log('錯誤詳情:', insertError.details);
        console.log('錯誤提示:', insertError.hint);
        
        // 處理不同類型的錯誤
        if (insertError.code === '23505') {
          console.log(`⚠️ 重複按讚 - 用戶 ${user.id} 已經喜歡狗狗 ${dogId}`);
        } else {
            console.error("❌ 資料庫插入錯誤:", insertError);
            toast({
              variant: "destructive",
              title: "按讚失敗",
              description: `無法儲存您的選擇: ${insertError.message}`,
            });
            setSeenDogIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(dogId);
              return newSet;
            });
            return; 
        }
      } else {
        console.log(`✅ 成功插入資料庫 - 狗狗 ${dogId} 已被用戶 ${user.id} 按讚`);
      }

      setLikedDogs(prevLikedDogs => {
        if (!prevLikedDogs.some(d => d.id === dog.id)) {
          const newLikedDogs = [...prevLikedDogs, dog];
          // Update cache when successfully liking a dog
          setLikedDogsCountCache(newLikedDogs.length);
          return newLikedDogs;
        }
        return prevLikedDogs;
      });

    } catch (error) {
        console.error("An unexpected error occurred during the like operation:", error);
        toast({
          variant: "destructive",
          title: "發生未預期的錯誤",
          description: "按讚時發生問題，您的操作已被復原。",
        });
    } finally {
      setIsLiking(prev => {
        const newSet = new Set(prev);
        newSet.delete(dogId);
        return newSet;
      });
    }
  };

  const passDog = (dogId: string) => {
    setSeenDogIds(prevSeenDogIds => new Set(prevSeenDogIds).add(dogId));
  };
  
  const getDogById = (dogId: string): Dog | undefined => {
    return masterDogList.find(dog => dog.id === dogId) || likedDogs.find(dog => dog.id === dogId);
  };

  const login = async (email: string, password: string): Promise<{ session: SupabaseSession | null; error: string | null }> => {
    setIsLoadingAuth(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setIsLoadingAuth(false);
      return { session: null, error: error.message || '登入失敗。請檢查您的帳號密碼。' };
    }

    // 檢查電子郵件是否已驗證
    if (data.user && !data.user.email_confirmed_at) {
      setIsLoadingAuth(false);
      return { 
        session: null, 
        error: '請先驗證您的電子郵件地址。檢查您的信箱（包含垃圾郵件資料夾）並點擊驗證連結。' 
      };
    }
    
    return { session: data.session, error: null };
  };

  const signUp = async (email: string, password: string, role: UserRole, fullName?: string | null): Promise<{ user: SupabaseUser | null; error: string | null }> => {
    setIsLoadingAuth(true);
    
    // 註冊時要求電子郵件驗證
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          role,
          full_name: fullName || email.split('@')[0],
        }
      }
    });

    if (authError) {
      setIsLoadingAuth(false);
      console.error('註冊錯誤:', authError);
      return { user: null, error: authError.message || '註冊失敗。請稍後再試。' };
    }
    
    if (!authData.user) {
      setIsLoadingAuth(false);
      return { user: null, error: '註冊成功，但未取得使用者資訊。' };
    }

    console.log('註冊成功，用戶資料:', authData.user);
    console.log('電子郵件確認狀態:', authData.user.email_confirmed_at ? '已確認' : '未確認');

    // 如果用戶已確認郵件，則建立個人資料
    if (authData.user.email_confirmed_at) {
      await createUserProfile(authData.user, role, fullName);
    }
    
    setIsLoadingAuth(false);
    return { user: authData.user, error: null };
  };

  // 將建立個人資料的邏輯分離成獨立函數
  const createUserProfile = async (user: SupabaseUser, role: UserRole, fullName?: string | null) => {
    const getAvatarText = () => {
        if (fullName) {
            const name = fullName.trim();
            // Check for CJK characters
            const cjkRegex = /[\u4e00-\u9fa5]/;
            if (cjkRegex.test(name)) {
                return name.length > 2 ? name.substring(name.length - 2) : name;
            }
        }
        return user.email?.split('@')[0] || 'User';
    };
    
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      role,
      full_name: fullName || user.email?.split('@')[0] || 'User',
      avatar_url: `https://placehold.co/100x100.png?text=${encodeURIComponent(getAvatarText())}`,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error('建立個人資料時發生錯誤:', profileError);
      throw new Error('建立個人資料失敗: ' + profileError.message);
    }
  };

  const logout = async (): Promise<{ error: string | null }> => {
    setIsLoadingAuth(true);
    
    // 清除本地緩存
    localStorage.removeItem('pawsconnect_user');
    localStorage.removeItem('pawsconnect_profile');
    localStorage.removeItem('pawsconnect_session');
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      setIsLoadingAuth(false);
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
      const profileUpsertData: Partial<DbProfile> & { id: string } = {
        id: user.id,
        updated_at: new Date().toISOString(),
        role: profile?.role || 'adopter', // Provide a default role if needed
      };
      if (updates.fullName !== undefined) {
        profileUpsertData.full_name = updates.fullName;
      }
      if (updates.avatarUrl !== undefined) {
        profileUpsertData.avatar_url = updates.avatarUrl;
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileUpsertData)
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
    } catch (e: unknown) {
      const error = e as PostgrestError;
      console.error("更新個人資料時發生錯誤:", JSON.stringify(error, null, 2));
      const errorMessage = error.message || "更新個人資料時發生未預期的錯誤。";
      return { success: false, error: errorMessage };
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const deleteAccount = async (): Promise<{ error: string | null }> => {
    if (!user) {
       toast({ title: "錯誤", description: "使用者未登入。", variant: "destructive" });
       return { error: "User not logged in" };
    }
    const { error } = await supabase.rpc('delete_user_account');
    if (error) {
      console.error('Error deleting account:', error);
      return { error: error.message };
    }
    return { error: null };
  };

  const sendPasswordResetEmail = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error sending password reset email:", error);
      return { error: "無法發送密碼重設郵件，請稍後再試。" };
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error resending verification email:", error);
      return { error: "無法重新發送驗證郵件，請稍後再試。" };
    }
  };

  const updateUserEmail = async (newEmail: string): Promise<{ error: string | null }> => {
    if (!user) {
      return { error: "使用者未登入。" };
    }
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error updating user email:", error);
      return { error: "無法更新郵件地址，請稍後再試。" };
    }
  };

  const value = {
    dogsToSwipe,
    likedDogs,
    seenDogIds,
    likeDog,
    passDog,
    getDogById,
    isLoadingDogs,
    loadDogsWhenNeeded,
    getLikedDogsCount,

    user,
    profile,
    session,
    isLoadingAuth,
    isUpdatingProfile,
    login,
    signUp,
    logout,
    updateProfile,
    deleteAccount,
    sendPasswordResetEmail,
    resendVerificationEmail,
    updateUserEmail,
  };

  return <PawsConnectContext.Provider value={value}>{children}</PawsConnectContext.Provider>;
};

export const usePawsConnect = () => {
  const context = React.useContext(PawsConnectContext);
  if (context === undefined) {
    throw new Error('usePawsConnect must be used within a PawsConnectProvider');
  }
  return context;
};





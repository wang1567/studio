
"use client";

import type { Dog, Profile, UserRole, HealthRecord, FeedingSchedule, VaccinationRecord } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  type User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // Firebase app instance

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

  user: FirebaseUser | null;
  profile: Profile | null;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<{ user: FirebaseUser | null; error: string | null }>;
  signUp: (email: string, password: string, role: UserRole, fullName?: string | null) => Promise<{ user: FirebaseUser | null; error: string | null }>;
  logout: () => Promise<{ error: string | null }>;
}

const PawsConnectContext = createContext<PawsConnectContextType | undefined>(undefined);

const mapFirestoreDocToDog = (docData: any, id: string): Dog => {
  const defaultHealthRecord: HealthRecord = { lastCheckup: '', conditions: ['無'], notes: '未提供記錄' };
  const defaultFeedingSchedule: FeedingSchedule = { foodType: '未指定', timesPerDay: 0, portionSize: '未指定', notes: '未提供記錄' };
  
  const photos = Array.isArray(docData.photos) ? docData.photos.filter((p: any) => typeof p === 'string') : [];
  const personalityTraits = Array.isArray(docData.personalityTraits) ? docData.personalityTraits.filter((p: any) => typeof p === 'string') : [];
  
  const mapTimestampToDateString = (timestamp: any): string => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toISOString().split('T')[0]; // YYYY-MM-DD
    }
    if (typeof timestamp === 'string') return timestamp;
    return '';
  };

  const mapVaccinationRecords = (records: any[]): VaccinationRecord[] => {
    if (!Array.isArray(records)) return [];
    return records.map(record => ({
      vaccineName: record.vaccineName || '未指定疫苗',
      dateAdministered: mapTimestampToDateString(record.dateAdministered),
      nextDueDate: record.nextDueDate ? mapTimestampToDateString(record.nextDueDate) : undefined,
    }));
  };
  
  const healthRecordsData = docData.healthRecords || {};
  const feedingScheduleData = docData.feedingSchedule || {};

  return {
    id: id,
    name: docData.name || '未命名狗狗',
    breed: docData.breed || '未知品種',
    age: typeof docData.age === 'number' ? docData.age : 0,
    gender: docData.gender === 'Male' || docData.gender === 'Female' ? docData.gender : 'Unknown',
    photos: photos.length > 0 ? photos : ['https://placehold.co/600x400.png'],
    description: docData.description || '暫無描述。',
    healthRecords: {
      lastCheckup: mapTimestampToDateString(healthRecordsData.lastCheckup),
      conditions: Array.isArray(healthRecordsData.conditions) && healthRecordsData.conditions.length > 0 ? healthRecordsData.conditions : ['無'],
      notes: healthRecordsData.notes || '未提供記錄',
    },
    feedingSchedule: {
      foodType: feedingScheduleData.foodType || '未指定',
      timesPerDay: typeof feedingScheduleData.timesPerDay === 'number' ? feedingScheduleData.timesPerDay : 0,
      portionSize: feedingScheduleData.portionSize || '未指定',
      notes: feedingScheduleData.notes || '未提供記錄',
    },
    vaccinationRecords: mapVaccinationRecords(docData.vaccinationRecords),
    liveStreamUrl: docData.liveStreamUrl ?? undefined,
    status: docData.status === 'Available' || docData.status === 'Pending' || docData.status === 'Adopted' ? docData.status : 'Available',
    location: docData.location || '未知地點',
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

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoadingAuth(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch profile from Firestore
        const profileDocRef = doc(db, 'profiles', firebaseUser.uid);
        const profileDocSnap = await getDoc(profileDocRef);
        if (profileDocSnap.exists()) {
          const profileData = profileDocSnap.data();
          setProfile({
            id: firebaseUser.uid,
            role: profileData.role || 'adopter',
            fullName: profileData.fullName || null,
            avatarUrl: profileData.avatarUrl || null,
            updatedAt: profileData.updatedAt instanceof Timestamp ? profileData.updatedAt.toDate().toISOString() : new Date().toISOString(),
          });
        } else {
          // Profile doesn't exist, could be a new signup flow error or needs creation
          setProfile(null); 
        }
      } else {
        setUser(null);
        setProfile(null);
        // Clear user-specific dog data on logout
        setLikedDogs([]);
        // SeenDogIds is local, can persist or clear based on preference. For now, clear.
        setSeenDogIds(new Set()); 
        setCurrentDogIndex(0);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const loadInitialDogData = useCallback(async () => {
    if (!user && !isLoadingAuth) { // No user logged in, don't load liked dogs yet.
      setIsLoadingDogs(true);
      try {
        const dogsCollectionRef = collection(db, 'dogs');
        // Potentially filter for 'Available' status if desired
        // const q = query(dogsCollectionRef, where('status', '==', 'Available'));
        const dogsSnapshot = await getDocs(dogsCollectionRef);
        const allDogsFromDb = dogsSnapshot.docs.map(docSnap => mapFirestoreDocToDog(docSnap.data(), docSnap.id));
        setMasterDogList(allDogsFromDb);
      } catch (error) {
        console.error('Error fetching dogs from Firestore:', error);
        setMasterDogList([]);
      } finally {
        setIsLoadingDogs(false);
      }
      return;
    }

    if (user) { // User is logged in, load their liked dogs
      setIsLoadingDogs(true);
      try {
        // Fetch all dogs
        const dogsCollectionRef = collection(db, 'dogs');
        const dogsSnapshot = await getDocs(dogsCollectionRef);
        const allDogsFromDb = dogsSnapshot.docs.map(docSnap => mapFirestoreDocToDog(docSnap.data(), docSnap.id));
        setMasterDogList(allDogsFromDb);

        // Fetch user's liked dogs
        const likedDogsQuery = query(collection(db, 'user_dog_likes'), where('userId', '==', user.uid));
        const likedDogsSnapshot = await getDocs(likedDogsQuery);
        const likedDogIds = new Set(likedDogsSnapshot.docs.map(docSnap => docSnap.data().dogId));
        
        const userLikedDogs = allDogsFromDb.filter(dog => likedDogIds.has(dog.id));
        setLikedDogs(userLikedDogs);

      } catch (error) {
        console.error('Error fetching dogs or liked dogs from Firestore:', error);
        setMasterDogList([]);
        setLikedDogs([]);
      } finally {
        setIsLoadingDogs(false);
      }
    } else { // No user and auth is still loading, wait
       setIsLoadingDogs(true); // Keep loading until auth state is clear
    }
  }, [user, isLoadingAuth]);


  useEffect(() => {
    loadInitialDogData();
  }, [loadInitialDogData]); // Re-run when user logs in/out


  useEffect(() => {
    if (isLoadingDogs || masterDogList.length === 0) {
      setDogsToSwipe([]);
      return;
    }
    // Filter master list for swiping: not liked and not in local 'seenDogIds'
    // SeenDogIds is still local to the session for simplicity
    const dogsForSwiping = masterDogList.filter(dog =>
      !likedDogs.find(ld => ld.id === dog.id) &&
      !seenDogIds.has(dog.id) 
    );
    setDogsToSwipe(dogsForSwiping);
    // Reset index if the list changes significantly, e.g., after logout/login
    if (currentDogIndex >= dogsForSwiping.length && dogsForSwiping.length > 0) {
        setCurrentDogIndex(0);
    } else if (dogsForSwiping.length === 0) {
        setCurrentDogIndex(0);
    }

  }, [masterDogList, likedDogs, seenDogIds, isLoadingDogs, currentDogIndex]);


  const likeDog = async (dogId: string) => {
    if (!user) {
      // Handle case where user is not logged in, e.g., show login prompt or store locally
      console.log("User not logged in. Like not persisted to DB.");
      // Add to local seen so it's removed from swipe
      setSeenDogIds(prevSeenIds => new Set(prevSeenIds).add(dogId));
      return;
    }

    const dog = masterDogList.find(d => d.id === dogId);
    if (!dog) return;

    if (!likedDogs.find(d => d.id === dogId)) {
      setLikedDogs(prevLikedDogs => [...prevLikedDogs, dog]);
      // Persist like to Firestore
      try {
        const likeDocRef = doc(db, 'user_dog_likes', `${user.uid}_${dogId}`);
        await setDoc(likeDocRef, {
          userId: user.uid,
          dogId: dogId,
          likedAt: Timestamp.now(),
        });
      } catch (error) {
        console.error("Error saving like to Firestore:", error);
        // Optionally revert local state change if DB write fails
        setLikedDogs(prevLikedDogs => prevLikedDogs.filter(d => d.id !== dogId));
      }
    }
    // Add to seenDogIds anyway to remove from current swipe session
    setSeenDogIds(prevSeenIds => new Set(prevSeenIds).add(dogId));
  };

  const passDog = (dogId: string) => {
    // 'pass' is a local-only action for the current swipe session
    setSeenDogIds(prevSeenDogIds => new Set(prevSeenDogIds).add(dogId));
  };
  
  const getDogById = (dogId: string): Dog | undefined => {
    return masterDogList.find(dog => dog.id === dogId);
  };

  const login = async (email: string, password: string): Promise<{ user: FirebaseUser | null; error: string | null }> => {
    setIsLoadingAuth(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setIsLoadingAuth(false);
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      setIsLoadingAuth(false);
      return { user: null, error: error.message || '登入失敗。請檢查您的帳號密碼。' };
    }
  };

  const signUp = async (email: string, password: string, role: UserRole, fullName?: string | null): Promise<{ user: FirebaseUser | null; error: string | null }> => {
    setIsLoadingAuth(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create profile document in Firestore
      const profileData: Profile = {
        id: firebaseUser.uid,
        role,
        fullName: fullName || email.split('@')[0],
        avatarUrl: `https://placehold.co/100x100.png?text=${(fullName || email)[0].toUpperCase()}`,
        updatedAt: Timestamp.now().toDate().toISOString(),
      };
      await setDoc(doc(db, 'profiles', firebaseUser.uid), {
        role: profileData.role,
        fullName: profileData.fullName,
        avatarUrl: profileData.avatarUrl,
        updatedAt: Timestamp.now() // Store as Firestore Timestamp
      });
      
      setProfile(profileData); // Update local profile state immediately
      setIsLoadingAuth(false);
      return { user: firebaseUser, error: null };
    } catch (error: any) {
      setIsLoadingAuth(false);
      return { user: null, error: error.message || '註冊失敗。請稍後再試。' };
    }
  };

  const logout = async (): Promise<{ error: string | null }> => {
    setIsLoadingAuth(true); // Set loading before async operation
    try {
      await signOut(auth);
      // Auth state listener will clear user and profile
      // Clear local dog states
      setMasterDogList([]);
      setLikedDogs([]);
      setSeenDogIds(new Set());
      setCurrentDogIndex(0);
      setDogsToSwipe([]); // Ensure swipe interface resets
      // setIsLoadingDogs(true); // Trigger re-fetch for non-logged-in state if desired or handled by auth change
      setIsLoadingAuth(false);
      return { error: null };
    } catch (error: any) {
      setIsLoadingAuth(false);
      return { error: error.message || '登出時發生錯誤。' };
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

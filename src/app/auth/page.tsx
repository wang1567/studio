
"use client";

import { AuthForm } from '@/components/auth/AuthForm';
import { usePawsConnect } from '@/context/PawsConnectContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthPage() {
  const { session, isLoadingAuth } = usePawsConnect();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth && session) {
      router.replace('/profile'); 
    }
  }, [session, isLoadingAuth, router]);

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p>載入中...</p>
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p>您已登入。正在重定向...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <div className="w-full max-w-md">
        <AuthForm />
      </div>
    </div>
  );
}

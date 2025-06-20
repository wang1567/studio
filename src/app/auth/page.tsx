
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
      router.replace('/profile'); // Or a role-based dashboard
    }
  }, [session, isLoadingAuth, router]);

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p>Loading...</p>
      </div>
    );
  }

  if (session) {
    // Already redirected by useEffect, but as a fallback:
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p>You are already logged in. Redirecting...</p>
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

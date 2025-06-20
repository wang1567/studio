
"use client";

import { usePawsConnect } from '@/context/PawsConnectContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Settings, LogOut, UserCircle2, PawPrint } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user: authUser, profile, isLoadingAuth, likedDogs, logout } = usePawsConnect();
  const router = useRouter();
  const [formattedJoinDate, setFormattedJoinDate] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoadingAuth && !authUser) {
      router.replace('/auth');
    }
  }, [authUser, isLoadingAuth, router]);

  useEffect(() => {
    if (authUser?.created_at) {
      setFormattedJoinDate(new Date(authUser.created_at).toLocaleDateString());
    }
  }, [authUser?.created_at]);

  const handleLogout = async () => {
    await logout();
    router.push('/'); // Redirect to home after logout
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  if (isLoadingAuth || (!authUser && !profile)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <PawPrint className="w-12 h-12 text-primary animate-spin" />
        <p className="mt-4 text-lg text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!authUser) {
     // This case should ideally be handled by the useEffect redirect,
     // but as a fallback:
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-lg text-muted-foreground">Please log in to view your profile.</p>
        <Button onClick={() => router.push('/auth')} className="mt-4">Login</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="text-center">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">My Profile</h1>
      </header>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-primary/10 to-background rounded-t-lg">
          <Avatar className="w-24 h-24 mb-4 border-4 border-primary/50">
            <AvatarImage src={profile?.avatarUrl || undefined} alt={profile?.fullName || authUser.email || 'User'} data-ai-hint="person avatar" />
            <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                {getInitials(profile?.fullName) || <UserCircle2 size={40}/>}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-headline">{profile?.fullName || 'PawsConnect User'}</CardTitle>
          <p className="text-muted-foreground">{authUser.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Joined: {formattedJoinDate || 'Loading date...'}
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{likedDogs.length}</p>
              <p className="text-sm text-muted-foreground">Dogs Liked</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">Adoptions Pending</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/matches">
                <Heart className="mr-2 h-4 w-4 text-primary" /> View My Matches
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Settings className="mr-2 h-4 w-4 text-primary" /> Account Settings (soon)
            </Button>
            <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>Thank you for using PawsConnect to find your furry friend!</p>
      </div>
    </div>
  );
}

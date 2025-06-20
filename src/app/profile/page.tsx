
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
      // 使用台灣時區及日期格式
      setFormattedJoinDate(new Date(authUser.created_at).toLocaleDateString('zh-TW'));
    }
  }, [authUser?.created_at]);

  const handleLogout = async () => {
    await logout();
    router.push('/'); 
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return '';
    // For Chinese names, taking the last two characters might be more common for an initial-like representation,
    // or just the first character if it's a single character name.
    // This is a simple approach; more sophisticated handling might be needed for diverse name formats.
    if (name.length <= 2) return name;
    const nameParts = name.split(' ');
    if (nameParts.length > 1) { // Likely Western name
        return nameParts.map(n => n[0]).join('').toUpperCase();
    }
    return name.substring(name.length - 2); // Last two chars for CJK names typically
  }

  if (isLoadingAuth || (!authUser && !profile)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <PawPrint className="w-12 h-12 text-primary animate-spin" />
        <p className="mt-4 text-lg text-muted-foreground">載入個人資料...</p>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-lg text-muted-foreground">請登入以查看您的個人資料。</p>
        <Button onClick={() => router.push('/auth')} className="mt-4">登入</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="text-center">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">我的個人資料</h1>
      </header>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-primary/10 to-background rounded-t-lg">
          <Avatar className="w-24 h-24 mb-4 border-4 border-primary/50">
            <AvatarImage src={profile?.avatarUrl || undefined} alt={profile?.fullName || authUser.email || '使用者'} data-ai-hint="person avatar" />
            <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                {getInitials(profile?.fullName) || <UserCircle2 size={40}/>}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-headline">{profile?.fullName || 'PawsConnect 使用者'}</CardTitle>
          <p className="text-muted-foreground">{authUser.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            加入日期: {formattedJoinDate || '載入日期中...'}
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{likedDogs.length}</p>
              <p className="text-sm text-muted-foreground">喜歡的狗狗</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">待領養</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/matches">
                <Heart className="mr-2 h-4 w-4 text-primary" /> 查看我的配對
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Settings className="mr-2 h-4 w-4 text-primary" /> 帳戶設定 (即將推出)
            </Button>
            <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> 登出
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>感謝您使用 PawsConnect 尋找您的毛茸茸夥伴！</p>
      </div>
    </div>
  );
}

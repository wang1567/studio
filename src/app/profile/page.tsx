
"use client";

import { usePawsConnect } from '@/context/PawsConnectContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Settings, LogOut, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const { likedDogs } = usePawsConnect();
  const [formattedJoinDate, setFormattedJoinDate] = useState<string | null>(null);

  // Mock user data
  const user = {
    name: "Alex Pawson",
    email: "alex.pawson@example.com",
    avatarUrl: "https://placehold.co/100x100.png?text=AP",
    joinDate: "2023-01-15",
  };

  useEffect(() => {
    if (user.joinDate) {
      setFormattedJoinDate(new Date(user.joinDate).toLocaleDateString());
    }
  }, [user.joinDate]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="text-center">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">My Profile</h1>
      </header>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-primary/10 to-background rounded-t-lg">
          <Avatar className="w-24 h-24 mb-4 border-4 border-primary/50">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person avatar" />
            <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                {user.name.split(' ').map(n => n[0]).join('') || <UserCircle2 size={40}/>}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-headline">{user.name}</CardTitle>
          <p className="text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Joined: {formattedJoinDate || 'Loading...'}
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
            <Button variant="outline" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4 text-primary" /> Account Settings
            </Button>
            <Button variant="destructive" className="w-full justify-start">
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

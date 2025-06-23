"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
         <Button variant="outline" size="icon" asChild>
            <Link href="/profile">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Profile</span>
            </Link>
          </Button>
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">帳戶設定</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>通知設定</CardTitle>
          <CardDescription>管理您希望如何收到通知。</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">此功能即將推出。</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>帳戶管理</CardTitle>
           <CardDescription>管理您的帳戶資料。</CardDescription>
        </Header>
        <CardContent className="space-y-4">
           <div>
             <h3 className="font-semibold">更改密碼</h3>
             <p className="text-sm text-muted-foreground mb-2">我們將寄送一封密碼重設郵件給您。</p>
             <Button variant="outline" disabled>寄送重設郵件 (即將推出)</Button>
           </div>
            <div>
             <h3 className="font-semibold text-destructive">刪除帳戶</h3>
             <p className="text-sm text-muted-foreground mb-2">此操作無法復原。所有您的資料將會被永久刪除。</p>
             <Button variant="destructive" disabled>刪除我的帳戶 (即將推出)</Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}

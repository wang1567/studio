
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePawsConnect } from "@/context/PawsConnectContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, deleteAccount } = usePawsConnect();
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) {
      toast({ title: "錯誤", description: "使用者未登入。", variant: "destructive" });
      return;
    }
    
    setIsDeleting(true);
    try {
      const { error } = await deleteAccount();
      if (error) {
        throw new Error(error);
      }
      toast({ title: "帳戶已刪除", description: "您的所有資料已被成功移除。" });
      router.push('/welcome');
    } catch (e: any) {
      toast({
        title: "刪除失敗",
        description: e.message || "刪除帳戶時發生錯誤，請稍後再試。",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };


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
        </CardHeader>
        <CardContent className="space-y-4">
           <div>
             <h3 className="font-semibold">更改密碼</h3>
             <p className="text-sm text-muted-foreground mb-2">我們將寄送一封密碼重設郵件給您。</p>
             <Button variant="outline" disabled>寄送重設郵件 (即將推出)</Button>
           </div>
            <div>
             <h3 className="font-semibold text-destructive">刪除帳戶</h3>
             <p className="text-sm text-muted-foreground mb-2">此操作無法復原。所有您的資料將會被永久刪除。</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">刪除我的帳戶</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>您確定要刪除您的帳戶嗎？</AlertDialogTitle>
                    <AlertDialogDescription>
                      這個操作將會永久刪除您的帳戶以及所有相關資料，包含您的個人資料和按讚記錄。
                      <strong className="mt-2 block">此操作無法復原。</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isDeleting ? "刪除中..." : "是，刪除我的帳戶"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, RefreshCw } from 'lucide-react';
import { usePawsConnect } from '@/context/PawsConnectContext';
import { useToast } from '@/hooks/use-toast';

interface EmailVerificationPromptProps {
  email?: string;
  onResend?: () => void;
}

export const EmailVerificationPrompt = ({ email: initialEmail, onResend }: EmailVerificationPromptProps) => {
  const [email, setEmail] = useState(initialEmail || '');
  const [isResending, setIsResending] = useState(false);
  const { resendVerificationEmail } = usePawsConnect();
  const { toast } = useToast();

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: '請輸入電子郵件',
        description: '請輸入您的電子郵件地址以重新發送驗證郵件。',
        variant: 'destructive',
      });
      return;
    }

    setIsResending(true);
    try {
      const result = await resendVerificationEmail(email);
      if (result.error) {
        toast({
          title: '發送失敗',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: '驗證郵件已發送',
          description: '請檢查您的電子郵件信箱（包含垃圾郵件資料夾）。',
        });
        onResend?.();
      }
    } catch (error) {
      toast({
        title: '發送失敗',
        description: '發生未預期的錯誤，請稍後再試。',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Mail className="h-12 w-12 text-primary" />
        </div>
        <CardTitle>驗證您的電子郵件</CardTitle>
        <CardDescription>
          我們已發送驗證連結到您的電子郵件地址。請點擊連結以完成註冊。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verification-email">電子郵件地址</Label>
          <Input
            id="verification-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="請輸入您的電子郵件"
          />
        </div>
        
        <Button
          onClick={handleResendVerification}
          disabled={isResending || !email}
          className="w-full"
          variant="outline"
        >
          {isResending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              發送中...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              重新發送驗證郵件
            </>
          )}
        </Button>
        
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>沒有收到郵件嗎？</p>
          <p>• 請檢查垃圾郵件資料夾</p>
          <p>• 確認電子郵件地址正確</p>
          <p>• 等待幾分鐘後再試</p>
        </div>
      </CardContent>
    </Card>
  );
};

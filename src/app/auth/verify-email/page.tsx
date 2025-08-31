"use client";

import { useSearchParams } from 'next/navigation';
import { EmailVerificationPrompt } from '@/components/auth/EmailVerificationPrompt';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <EmailVerificationPrompt 
          email={email}
          onResend={() => {
            // 可以在這裡添加額外的邏輯，比如顯示成功訊息
          }}
        />
        
        <div className="text-center">
          <Button variant="ghost" asChild>
            <Link href="/auth">返回登入頁面</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

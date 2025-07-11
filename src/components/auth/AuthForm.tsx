
"use client";

import * as React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { usePawsConnect } from '@/context/PawsConnectContext';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';


const loginSchema = z.object({
  email: z.string().email({ message: '無效的電子郵件地址' }),
  password: z.string().min(6, { message: '密碼長度至少需6個字元' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const signupSchema = z.object({
  email: z.string().email({ message: '無效的電子郵件地址' }),
  password: z.string().min(6, { message: '密碼長度至少需6個字元' }),
  confirmPassword: z.string(),
  role: z.enum(['adopter', 'caregiver']),
  fullName: z.string().min(2, { message: '全名至少需2個字元' }).optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "密碼不相符",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;


export const AuthForm = () => {
  const { toast } = useToast();
  const { login, signUp, isLoadingAuth } = usePawsConnect();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('adopter');

  const currentSchema = authMode === 'login' ? loginSchema : signupSchema;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LoginFormValues | SignupFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: authMode === 'login' ? { email: '', password: ''} : { email: '', password: '', confirmPassword: '', role: 'adopter', fullName: ''},
  });
  
  React.useEffect(() => {
    reset(authMode === 'login' ? { email: '', password: ''} : { email: '', password: '', confirmPassword: '', role: selectedRole, fullName: ''});
  }, [authMode, selectedRole, reset]);


  const onSubmit = async (data: LoginFormValues | SignupFormValues) => {
    try {
      if (authMode === 'login') {
        const { email, password } = data as LoginFormValues;
        await login(email, password);
        toast({ title: '登入成功', description: "歡迎回來！" });
        router.push('/');
      } else {
        const { email, password, role, fullName } = data as SignupFormValues;
        await signUp(email, password, role, fullName);
        toast({ title: '註冊成功', description: '歡迎！請檢查您的電子郵件以驗證您的帳戶。' });
        setAuthMode('login'); 
      }
    } catch (error: any) {
      toast({
        title: '驗證錯誤',
        description: error.message || '發生未預期的錯誤。',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full shadow-2xl bg-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline text-primary">
          {authMode === 'login' ? '歡迎回來！' : '加入我們'}
        </CardTitle>
        <CardDescription>
          {authMode === 'login' ? '登入以繼續您的 PawsConnect 旅程。' : '建立帳戶來尋找或幫助毛茸茸的朋友。'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">電子郵件</Label>
            <Input id="email" type="email" {...register('email')} placeholder="you@example.com" />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">密碼</Label>
            <Input id="password" type="password" {...register('password')} placeholder="••••••••" />
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
          </div>

          {authMode === 'signup' && (
            <>
              <div>
                <Label htmlFor="confirmPassword">確認密碼</Label>
                <Input id="confirmPassword" type="password" {...register('confirmPassword')} placeholder="••••••••" />
                {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
              </div>
              <div>
                <Label htmlFor="fullName">全名 (選填)</Label>
                <Input id="fullName" type="text" {...register('fullName')} placeholder="您的姓名" />
                {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <Label>我的身份是...</Label>
                 <Tabs defaultValue="adopter" onValueChange={(value) => setSelectedRole(value as UserRole)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="adopter">潛在領養者</TabsTrigger>
                    <TabsTrigger value="caregiver">收容所照顧者</TabsTrigger>
                  </TabsList>
                </Tabs>
                <input type="hidden" {...register('role')} value={selectedRole} />
                 {errors.role && <p className="text-xs text-destructive mt-1">{errors.role.message}</p>}
              </div>
            </>
          )}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoadingAuth}>
            {isLoadingAuth ? (authMode === 'login' ? '登入中...' : '註冊中...') : (authMode === 'login' ? '登入' : '註冊')}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 p-6 pt-0">
        <Button variant="link" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-sm text-primary">
          {authMode === 'login' ? "還沒有帳戶嗎？立即註冊" : '已經有帳戶了？立即登入'}
        </Button>
        {authMode === 'login' && (
          <Link href="#" className="text-xs text-muted-foreground hover:text-primary">
            忘記密碼？
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};

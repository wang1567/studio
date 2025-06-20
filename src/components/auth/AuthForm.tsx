
"use client";

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
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Placeholder for signup schema, can be expanded later
const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
  role: z.enum(['adopter', 'caregiver']),
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters' }).optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
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
        toast({ title: 'Login Successful', description: "Welcome back!" });
        router.push('/profile');
      } else {
        const { email, password, role, fullName } = data as SignupFormValues;
        await signUp(email, password, role, fullName);
        toast({ title: 'Signup Successful', description: 'Welcome! Please check your email to verify your account.' });
        setAuthMode('login'); // Switch to login after successful signup or prompt for verification
      }
    } catch (error: any) {
      toast({
        title: 'Authentication Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline text-primary">
          {authMode === 'login' ? 'Welcome Back!' : 'Create Account'}
        </CardTitle>
        <CardDescription>
          {authMode === 'login' ? 'Login to continue your PawsConnect journey.' : 'Join PawsConnect to find or help furry friends.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="you@example.com" />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} placeholder="••••••••" />
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
          </div>

          {authMode === 'signup' && (
            <>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" {...register('confirmPassword')} placeholder="••••••••" />
                {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
              </div>
              <div>
                <Label htmlFor="fullName">Full Name (Optional)</Label>
                <Input id="fullName" type="text" {...register('fullName')} placeholder="Your Name" />
                {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <Label>I am a...</Label>
                 <Tabs defaultValue="adopter" onValueChange={(value) => setSelectedRole(value as UserRole)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="adopter">Potential Adopter</TabsTrigger>
                    <TabsTrigger value="caregiver">Shelter Caregiver</TabsTrigger>
                  </TabsList>
                </Tabs>
                <input type="hidden" {...register('role')} value={selectedRole} />
                 {errors.role && <p className="text-xs text-destructive mt-1">{errors.role.message}</p>}
              </div>
            </>
          )}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoadingAuth}>
            {isLoadingAuth ? (authMode === 'login' ? 'Logging in...' : 'Signing up...') : (authMode === 'login' ? 'Login' : 'Sign Up')}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 p-6 pt-0">
        <Button variant="link" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-sm text-primary">
          {authMode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
        </Button>
        {authMode === 'login' && (
          <Link href="#" className="text-xs text-muted-foreground hover:text-primary">
            Forgot password?
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};

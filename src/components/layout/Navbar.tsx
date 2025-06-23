"use client";

import Link from 'next/link';
import { Dog, Heart, UserCircle, LogIn, LogOut, UserCircle2, Sun, Moon, Settings } from 'lucide-react'; // Added Settings
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePawsConnect } from '@/context/PawsConnectContext';
import { useTheme } from '@/context/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, logout, isLoadingAuth } = usePawsConnect();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { href: '/', label: '滑卡配對', icon: <Dog className="h-5 w-5" />, requiresAuth: false },
    { href: '/matches', label: '我的配對', icon: <Heart className="h-5 w-5" />, requiresAuth: true },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return '';
    if (name.length <= 2) return name;
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
        return nameParts.map(n => n[0]).join('').toUpperCase();
    }
    return name.substring(name.length - 2);
  }

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Dog className="h-8 w-8" />
          <h1 className="text-2xl font-headline font-bold">PawsConnect</h1>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            if (item.requiresAuth && !user) return null;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 h-auto sm:h-10",
                    pathname === item.href ? "text-primary font-semibold" : "text-foreground/70 hover:text-primary"
                  )}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {item.icon}
                  <span className="text-xs sm:text-sm">{item.label}</span>
                </Button>
              </Link>
            );
          })}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 sm:h-10 sm:w-10 text-foreground/70 hover:text-primary focus-visible:ring-primary"
            aria-label={theme === 'dark' ? "切換至淺色模式" : "切換至深色模式"}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {isLoadingAuth ? (
            <div className="h-10 w-20 flex items-center justify-center">
               <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : user && profile ? ( 
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatarUrl || undefined} alt={profile?.fullName || user?.email || '使用者'} data-ai-hint="person avatar" />
                    <AvatarFallback className="bg-primary/20 text-primary">
                       {getInitials(profile?.fullName) || <UserCircle2 size={20}/>}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-medium truncate">{profile?.fullName || user?.email || '使用者'}</div>
                  <div className="text-xs text-muted-foreground capitalize">{profile?.role === 'adopter' ? '領養者' : profile?.role === 'caregiver' ? '照顧者' : '無'}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    個人資料
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    帳戶設定
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  登出
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            null
          )}
        </div>
      </nav>
    </header>
  );
};

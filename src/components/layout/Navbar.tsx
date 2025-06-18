
"use client";

import Link from 'next/link';
import { Dog, Users, Heart, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export const Navbar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Swipe', icon: <Dog className="h-5 w-5" /> },
    { href: '/matches', label: 'Matches', icon: <Heart className="h-5 w-5" /> },
    { href: '/profile', label: 'Profile', icon: <UserCircle className="h-5 w-5" /> },
  ];

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Dog className="h-8 w-8" />
          <h1 className="text-2xl font-headline font-bold">PawsConnect</h1>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {navItems.map((item) => (
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
          ))}
        </div>
      </nav>
    </header>
  );
};

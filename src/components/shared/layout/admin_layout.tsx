'use client';

import {
  Briefcase,
  ClipboardList,
  CreditCard,
  Euro,
  FileText,
  LayoutDashboard,
  LogOut,
  MenuIcon,
  MessageSquare,
  Users,
  Heart, // For Feedback
} from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';

import { BrandLogo } from '@/components/shared/brand/brand-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/shared/use-mobile';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

type UserProfile = Database['public']['Tables']['profiles']['Row'];

interface AdminLayoutProps {
  user: UserProfile; // Admin user is also a profile
  logoutAction?: () => Promise<void>; // Make optional since we'll handle it internally
  children: React.ReactNode;
}

export default function AdminLayout({
  user: adminUser,
  children,
}: AdminLayoutProps) {
  const isMobile = useIsMobile();
  const [isLoggingOut, startLogoutTransition] = useTransition();

  const handleLogout = () => {
    startLogoutTransition(async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }

        // Redirect manually after successful logout
        window.location.href = '/';
      } catch (error) {
        console.error('Logout failed:', error);
      }
    });
  };

  const adminNavLinks = [
    { href: '/admin', label: 'Hallintapaneeli', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Käyttäjähallinta', icon: Users },
    {
      href: '/admin/tasker-applications',
      label: 'Tekijähakemukset',
      icon: Briefcase,
    },
    { href: '/admin/tasks', label: 'Tehtävävalvonta', icon: ClipboardList },
    { href: '/admin/payments', label: 'Maksuhallinta', icon: Euro },
    { href: '/admin/categories', label: 'Kategoriat', icon: FileText },
    { href: '/admin/withdrawals', label: 'Nostopyynnöt', icon: CreditCard },
    {
      href: '/admin/support-tickets',
      label: 'Tukipalvelupyynnöt',
      icon: MessageSquare,
    },
    { href: '/admin/feedback', label: 'Käyttäjäpalautteet', icon: Heart },
    // { href: "/admin/settings", label: "Asetukset", icon: Settings }, // Can be added later
  ];

  return (
    <div className="flex min-h-screen bg-muted/50">
      <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 bg-sidebar text-sidebar-foreground">
        <div className="p-4 flex items-center gap-3 h-16 border-b border-sidebar-border">
          <span className="rounded-md bg-white px-2 py-1 shadow-sm">
            <BrandLogo
              variant="wordmark"
              className="h-7 w-auto max-w-[142px]"
              sizes="142px"
            />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/70">Admin</span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {adminNavLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              asChild
            >
              <Link href={link.href}>
                <link.icon className="mr-2 h-5 w-5" />
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarImage src={adminUser.avatar_url || '/placeholder.svg?height=40&width=40'} alt={adminUser.first_name || 'Admin'} />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                {adminUser.first_name?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{adminUser.first_name || 'Admin'} {adminUser.last_name || ''}</p>
              <p className="text-xs text-sidebar-foreground/70 capitalize">Admin</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? 'Kirjaudutaan ulos...' : 'Kirjaudu Ulos'}
          </Button>
        </div>
      </aside>

      {isMobile && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden fixed top-3 left-3 z-50 bg-background border-border">
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Avaa valikko</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-sidebar text-sidebar-foreground p-0 w-64 flex flex-col max-w-[80vw]">
            <div className="p-4 flex items-center gap-3 h-16 border-b border-sidebar-border">
              <span className="rounded-md bg-white px-2 py-1 shadow-sm">
                <BrandLogo
                  variant="wordmark"
                  className="h-7 w-auto max-w-[142px]"
                  sizes="142px"
                />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/70">Admin</span>
            </div>
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              {adminNavLinks.map((link) => (
                <Button key={link.href} variant="ghost" className="w-full justify-start text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild>
                  <Link href={link.href}>
                    <link.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                </Button>
              ))}
            </nav>
            <div className="p-3 pb-6 border-t border-sidebar-border mt-auto">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={adminUser.avatar_url || undefined} alt={adminUser.first_name || 'Admin'} />
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-sm">
                    {adminUser.first_name?.[0]?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{adminUser.first_name} {adminUser.last_name}</p>
                  <p className="text-xs text-sidebar-foreground/70 capitalize truncate">Admin</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut} className="w-full text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent text-xs mb-2">
                <LogOut className="mr-2 h-3 w-3" />
                {isLoggingOut ? 'Kirjaudutaan ulos...' : 'Kirjaudu Ulos'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      <main className="flex-1 md:ml-64 flex flex-col bg-muted/50">
        <div className={`flex-1 p-4 sm:p-6 md:p-8 ${isMobile ? 'pt-16' : ''} transition-all duration-300`}>
          {children}
        </div>
        <footer className="mt-auto border-t border-border bg-background/80 backdrop-blur-sm">
          <div className="px-4 md:px-8 py-3">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
              <p className="text-muted-foreground">&copy; {new Date().getFullYear()} Duunex Admin</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-muted-foreground text-xs">Ylläpitäjä</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

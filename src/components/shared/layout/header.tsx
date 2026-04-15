'use client';

import { BrandLogo } from '@/components/shared/brand/brand-logo';
import { useAuth } from '@/components/shared/providers/query-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useUnreadMessages } from '@/hooks/chat/use-unread-messages'; // Import the new hook
import { useIsMobile } from '@/hooks/shared/use-mobile'; // Assuming this hook exists
import { useToast } from '@/hooks/shared/use-toast'; // Import useToast for potential feedback
import { createClient } from '@/lib/supabase/client';
import {
  ListChecks,
  LogIn,
  Menu,
  MessageSquare,
  PlusCircle,
  UserCircle,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Added usePathname
import { useTransition } from 'react'; // Import useTransition

export function Header() {
  const { user, profile } = useAuth();
  const [isPending, startTransition] = useTransition(); // Add transition state
  const { toast } = useToast(); // Initialize toast
  const pathname = usePathname();
  const unreadMessages = useUnreadMessages(); // Get unread messages count

  const isAuthenticated = !!user;
  const userName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : user?.email || '';
  const userRole = profile?.role || 'user'; // IMPORTANT: Read role from profiles table
  const userId = user?.id;
  const isMobile = useIsMobile();

  // Hide visitor navigation in dashboard
  const isDashboard = pathname.startsWith('/dashboard');

  // Base visitor navigation (left side primary links)
  const navItems = [
    { label: 'Etusivu', href: '/' },
    { label: 'Julkaise tehtävä', href: '/dashboard/tasks/new' }, // Always visible for visitors
    { label: 'Yhteystiedot', href: '/yhteystiedot' }, // Always visible
    ...(!isAuthenticated ? [
      { label: 'Ryhdy Tekijäksi', href: '/signup/tasker' }
    ] : []),
  ];

  const handleLogout = () => {
    startTransition(async () => {
      try {
        // Use client-side logout to ensure immediate state update
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }

        // Redirect manually after successful logout
        window.location.href = '/';
      } catch (error) {
        console.error('Logout failed:', error);
        toast({
          title: 'Virhe',
          description: 'Uloskirjautuminen epäonnistui. Yritä uudelleen.',
          variant: 'destructive',
        });
      }
    });
  };

  const AuthButtons = () => {
    if (isAuthenticated && userId) {
      // Fiverr-like right side icon bar
      return (
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Messages */}
          <Link
            href="/dashboard/messages"
            className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Viestit"
          >
            <MessageSquare className="h-5 w-5" />
            {unreadMessages.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold h-5 min-w-[1.1rem] px-1">
                {unreadMessages.unreadCount}
              </span>
            )}
          </Link>
          {/* Quick Task Action */}
          {userRole === 'user' && (
            <Link
              href="/dashboard/tasks/new"
              className="hidden md:flex items-center gap-1 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-3 py-2 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Uusi Tehtävä</span>
            </Link>
          )}
          {userRole === 'tasker' && (
            <Link
              href="/dashboard/open-tasks"
              className="hidden md:flex items-center gap-1 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-3 py-2 transition-colors"
            >
              <ListChecks className="h-4 w-4" />
              <span>Avoimet</span>
            </Link>
          )}
          {/* Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring group pl-1 pr-3 h-10 bg-background hover:bg-muted border border-border"
              >
                <Avatar className="h-8 w-8 ring-1 ring-border transition">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={userName} />
                  <AvatarFallback className="bg-muted text-foreground font-medium">
                    {userName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium text-foreground max-w-[110px] truncate">
                  {userName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 ring-1 ring-border">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={userName} />
                    <AvatarFallback className="bg-muted text-foreground font-medium">
                      {userName?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userRole === 'tasker' ? 'Tekijä' : userRole === 'admin' ? 'Ylläpitäjä' : 'Käyttäjä'}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={userRole === 'admin' ? '/admin' : '/dashboard'}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Hallintapaneeli</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/messages">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Viestit</span>
                  {unreadMessages.unreadCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold h-5 min-w-[1.1rem] px-1">
                      {unreadMessages.unreadCount}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={isPending}>
                {isPending ? 'Kirjaudutaan...' : 'Kirjaudu Ulos'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }
    // Unauthenticated (original)
    return (
      <div className="flex flex-row items-center gap-1 sm:gap-3 min-w-0 flex-shrink-0">
        <Button
          variant="outline"
          asChild
          size="sm"
          className="flex-shrink-0 rounded-md px-2 sm:px-4 py-2 border-border text-foreground hover:bg-muted text-xs sm:text-sm touch-manipulation"
        >
          <Link href="/login">
            <LogIn className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sm:hidden">Kirj.</span>
            <span className="hidden sm:inline">Kirjaudu Sisään</span>
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="flex-shrink-0 rounded-md px-2 sm:px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm touch-manipulation"
        >
          <Link href="/signup">
            <UserPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sm:hidden">Rek.</span>
            <span className="hidden sm:inline">Rekisteröidy</span>
          </Link>
        </Button>
      </div>
    );
  };

  // Don't render header at all on dashboard pages
  if (isDashboard) {
    return null;
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="h-14 sm:h-16 flex items-center gap-2 sm:gap-4 overflow-hidden">
            {/* Left cluster */}
            <div className="flex items-center gap-2 sm:gap-6 min-w-0 flex-shrink-0">
              <Link href="/" className="flex items-center gap-2 font-semibold text-foreground hover:opacity-90 transition-opacity flex-shrink-0 touch-manipulation">
                <BrandLogo
                  variant="wordmark"
                  className="h-7 w-auto max-w-[132px] sm:h-8 sm:max-w-[148px]"
                  priority
                  sizes="148px"
                />
              </Link>
              {!isMobile && (
                <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  {navItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-3 py-2 rounded-md hover:text-foreground hover:bg-muted transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
            {/* Right cluster */}
            <div className="ml-auto flex items-center gap-1 sm:gap-2 min-w-fit">
              {isMobile && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-md h-10 w-10 touch-manipulation">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Valikko</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] max-w-[90vw] p-0">
                    <SheetTitle className="sr-only">Duunex Navigaatiovalikko</SheetTitle>
                    <div className="p-6 border-b border-border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <BrandLogo
                          variant="wordmark"
                          className="h-8 w-auto max-w-[150px]"
                          sizes="150px"
                        />
                      </div>
                    </div>
                    <nav className="p-4 flex flex-col gap-1">
                      {navItems.map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="px-4 py-3 rounded-md hover:bg-muted text-sm font-medium text-foreground touch-manipulation"
                        >
                          {item.label}
                        </Link>
                      ))}
                      <div className="mt-4 pt-4 border-t border-border space-y-2">
                        <AuthButtons />
                      </div>
                    </nav>
                  </SheetContent>
                </Sheet>
              )}
              {!isMobile && <AuthButtons />}
              {isMobile && !isAuthenticated && <AuthButtons />}
            </div>
          </div>
        </div>
      </header>
      <div aria-hidden className="h-14 sm:h-16" />
    </>
  );
}

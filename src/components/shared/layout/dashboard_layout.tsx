'use client';

// SmartTaskLabel removed - using simple text
import {
  BellRing,
  HelpCircle,
  History,
  LayoutGrid,
  ListChecks,
  LogOut,
  MenuIcon,
  MessageSquare,
  PlusSquare,
  Search,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useUnreadMessages } from '@/hooks/chat/use-unread-messages';
import { useIsMobile } from '@/hooks/shared/use-mobile';
import { useUnreadTaskRequests } from '@/hooks/tasks/use-unread-task-requests';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { useRouter } from 'next/navigation';

type UserProfile = Database['public']['Tables']['profiles']['Row'];

interface DashboardLayoutProps {
  user: UserProfile | null; // Allow user to be null
  logoutAction?: () => Promise<void>;
  children: React.ReactNode;
  /** Optional layout variant. 'chat' removes footer & padding for immersive messaging UI */
  variant?: 'default' | 'chat';
}

export default function DashboardLayout({
  user: passedUser,
  children,
  variant = 'default',
}: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const [isLoggingOut, startLogoutTransition] = useTransition();
  const { unreadCount } = useUnreadMessages();
  const { unreadCount: unreadTaskRequestsCount } = useUnreadTaskRequests();
  const router = useRouter();

  // If user is not available (e.g., during session re-establishment),
  // you can show a loading state or a restricted view.
  // For now, we'll redirect to login if the user is null after a short delay.
  if (!passedUser) {
    // You might want to show a loading spinner here instead of a blank screen
    // This prevents a flash of the login page if the session is loading slowly.
    // However, for the immediate fix, we can return a minimal layout or null.
    // A full redirect might be too aggressive if the session is just loading.
    // Let's render the main content area, which might have its own loading state.
    return (
      <main className="flex-1 flex flex-col bg-gray-100">
        <div className="flex-1 p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    );
  }

  // Define theme colors based on user role
  const getThemeColors = () => {
    if (passedUser.role === 'tasker') {
      return {
        sidebarBg: 'bg-emerald-700',
        sidebarText: 'text-emerald-50',
        borderColor: 'border-emerald-600',
        logoTextColor: 'text-emerald-100',
        buttonHover: 'hover:bg-emerald-600',
        secondaryText: 'text-emerald-300',
      };
    }
    // Default theme for users and others
    return {
      sidebarBg: 'bg-slate-800',
      sidebarText: 'text-slate-100',
      borderColor: 'border-slate-700',
      logoTextColor: 'text-slate-200',
      buttonHover: 'hover:bg-slate-700',
      secondaryText: 'text-slate-400',
    };
  };

  const theme = getThemeColors();

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

  const profileLabel =
    passedUser.role === 'user'
      ? 'Asiakasprofiili'
      : passedUser.role === 'tasker'
        ? 'Tekijäprofiili'
        : 'Oma Profiili';

  // Define navigation items based on user role
  const baseNavItems = [
    { href: '/dashboard', label: 'Yleisnäkymä', icon: LayoutGrid },
    { href: '/dashboard/messages', label: 'Viestit', icon: MessageSquare },
  ];

  const userNavItems = [
    ...baseNavItems,
    ...(passedUser.role === 'user'
      ? [
        {
          href: '/dashboard/tasks/new',
          label: "Uusi tehtävä",
          icon: PlusSquare,
        },
      ]
      : []),
    {
      href: `/dashboard/profile/${passedUser.id}?tab=settings`,
      label: 'Asetukset',
      icon: Settings,
    },
  ];

  const taskerNavItems = [
    ...baseNavItems,
    ...(passedUser.role === 'tasker'
      ? [
        {
          href: '/dashboard/open-tasks',
          label: 'Avoimet tehtävät',
          icon: Search,
        },
        {
          href: '/dashboard/task-requests',
          label: 'Tehtäväpyynnöt',
          icon: BellRing,
        },
        {
          href: '/dashboard?view=active',
          label: 'Aktiiviset Tehtävät',
          icon: ListChecks,
        },
        {
          href: '/dashboard?view=history',
          label: 'Työhistoria',
          icon: History,
        },
      ]
      : []),
    {
      href: `/dashboard/profile/${passedUser.id}?tab=settings`,
      label: 'Asetukset',
      icon: Settings,
    },
  ];

  const navLinks = passedUser.role === 'user' ? userNavItems : taskerNavItems;

  const isChat = variant === 'chat';

  return (
    <div className={`flex min-h-screen bg-gray-100 ${isChat ? 'overflow-hidden' : ''}`}>
      {/* Sidebar for desktop */}
      <aside
        className={`hidden md:flex md:w-64 flex-col fixed inset-y-0 ${theme.sidebarBg} ${theme.sidebarText}`}
      >
        <div
          className={`p-4 flex items-center gap-2 h-16 border-b ${theme.borderColor}`}
        >
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">
              TM
            </div>
            <span className="text-xl font-semibold">TaskMVP</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              className={`w-full justify-start ${theme.logoTextColor} ${theme.buttonHover} hover:text-white`}
              asChild
            >
              <Link href={link.href}>
                <link.icon className="mr-2 h-5 w-5" />
                {link.label}
                {link.href === '/dashboard/messages' && unreadCount > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[1.25rem] h-5">
                    {unreadCount}
                  </span>
                )}
                {link.href === '/dashboard/task-requests' &&
                  unreadTaskRequestsCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[1.25rem] h-5">
                      {unreadTaskRequestsCount}
                    </span>
                  )}
              </Link>
            </Button>
          ))}
        </nav>

        <div className={`p-4 border-t ${theme.borderColor}`}>
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarImage
                src={
                  passedUser.avatar_url || '/placeholder.svg?height=40&width=40'
                }
                alt={passedUser.first_name || passedUser.email?.split('@')[0] || 'Käyttäjä'}
              />
              <AvatarFallback>
                {(passedUser.first_name?.charAt(0) || passedUser.email?.charAt(0))?.toUpperCase() || 'K'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {passedUser.first_name && passedUser.last_name
                  ? `${passedUser.first_name} ${passedUser.last_name}`
                  : passedUser.first_name
                    ? passedUser.first_name
                    : passedUser.email?.split('@')[0] || 'Käyttäjä'
                }
              </p>
              <p className={`text-xs ${theme.secondaryText}`}>
                {passedUser.role === 'user' ? 'Käyttäjä' :
                  passedUser.role === 'tasker' ? 'Tekijä' :
                    passedUser.role === 'admin' ? 'Ylläpitäjä' : 'Käyttäjä'}
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={`w-full justify-start ${theme.logoTextColor} ${theme.buttonHover} hover:text-white mb-2`}
          >
            <Link href="/dashboard/tuki">
              <HelpCircle className="mr-2 h-4 w-4" />
              Tuki
            </Link>
          </Button>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="ghost"
            size="sm"
            className={`w-full justify-start ${theme.logoTextColor} ${theme.buttonHover} hover:text-white`}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? 'Kirjaudutaan ulos...' : 'Kirjaudu Ulos'}
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar Trigger & Sheet */}
      {isMobile && (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden fixed top-3 left-3 z-50 bg-white/95 backdrop-blur-sm shadow-lg border-gray-200"
            >
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Avaa valikko</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className={`${theme.sidebarBg} ${theme.sidebarText} p-0 w-64 flex flex-col max-w-[80vw]`}
          >
            <SheetTitle className="sr-only">Dashboard navigaatiovalikko</SheetTitle>
            <div
              className={`p-4 flex items-center gap-2 h-16 border-b ${theme.borderColor}`}
            >
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                  TM
                </div>
                <span className="text-lg sm:text-xl font-semibold">TaskMVP</span>
              </Link>
            </div>

            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  className={`w-full justify-start text-sm ${theme.logoTextColor} ${theme.buttonHover} hover:text-white`}
                  asChild
                >
                  <Link href={link.href}>
                    <link.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{link.label}</span>
                    {link.href === '/dashboard/messages' && unreadCount > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[1.25rem] h-5 flex-shrink-0">
                        {unreadCount}
                      </span>
                    )}
                    {link.href === '/dashboard/task-requests' &&
                      unreadTaskRequestsCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[1.25rem] h-5 flex-shrink-0">
                          {unreadTaskRequestsCount}
                        </span>
                      )}
                  </Link>
                </Button>
              ))}
            </nav>

            <div className={`p-3 pb-6 border-t ${theme.borderColor} mt-auto`}>
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      passedUser.avatar_url ||
                      '/placeholder.svg?height=40&width=40'
                    }
                    alt={passedUser.first_name || passedUser.email?.split('@')[0] || 'Käyttäjä'}
                  />
                  <AvatarFallback className="text-sm">
                    {(passedUser.first_name?.charAt(0) || passedUser.email?.charAt(0))?.toUpperCase() || 'K'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {passedUser.first_name && passedUser.last_name
                      ? `${passedUser.first_name} ${passedUser.last_name}`
                      : passedUser.first_name
                        ? passedUser.first_name
                        : passedUser.email?.split('@')[0] || 'Käyttäjä'
                    }
                  </p>
                  <p
                    className={`text-xs ${theme.secondaryText} truncate`}
                  >
                    {passedUser.role === 'user' ? 'Käyttäjä' :
                      passedUser.role === 'tasker' ? 'Tekijä' :
                        passedUser.role === 'admin' ? 'Ylläpitäjä' : 'Käyttäjä'}
                  </p>
                </div>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={`w-full justify-start text-sm ${theme.logoTextColor} ${theme.buttonHover} hover:text-white mb-2`}
              >
                <Link href="/dashboard/tuki">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Tuki
                </Link>
              </Button>
              <Button
                onClick={handleLogout}
                disabled={isLoggingOut}
                variant="ghost"
                size="sm"
                className={`w-full justify-start text-sm ${theme.logoTextColor} ${theme.buttonHover} hover:text-white mb-2`}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? 'Kirjaudutaan ulos...' : 'Kirjaudu Ulos'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main content */}
      <main className={`flex-1 md:ml-64 flex flex-col bg-gray-100 ${isChat ? 'h-screen md:h-auto' : ''}`}>
        <div
          className={`flex-1 ${isChat ? 'p-0 md:pt-0 md:pr-0 md:pb-0 md:pl-0' : 'p-4 sm:p-6 md:p-8'} ${isMobile ? 'pt-16' : ''} transition-all duration-300 flex flex-col`}
        >
          {children}
        </div>

        {/* Dashboard Footer (hidden in chat variant for immersive layout) */}
        {!isChat && (
          <footer className="mt-auto border-t bg-white/80 backdrop-blur-sm">
            <div className="px-4 md:px-8 py-3">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
                <div className="flex items-center gap-4">
                  <p className="text-gray-600">
                    &copy; {new Date().getFullYear()} TaskMVP
                  </p>
                  <div className="flex gap-3">
                    <Link
                      href="/terms"
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Käyttöehdot
                    </Link>
                    <Link
                      href="/privacy"
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Tietosuoja
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${passedUser.role === 'tasker' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  ></div>
                  <span className="text-gray-500 text-xs">
                    {passedUser.role === 'user' ? 'Käyttäjä' :
                      passedUser.role === 'tasker' ? 'Tekijä' :
                        passedUser.role === 'admin' ? 'Ylläpitäjä' : 'Käyttäjä'}{' '}
                    -dashboard
                  </span>
                </div>
              </div>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}
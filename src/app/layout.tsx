import CookieConsentBanner from '@/components/shared/cookie/CookieConsentBanner';
import { ConditionalFooter } from '@/components/shared/layout/conditional-footer';
import { ConditionalHeader } from '@/components/shared/layout/conditional-header';
import {
  AuthProvider,
  QueryProvider,
} from '@/components/shared/providers/query-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Duunex - Löydä apua tai tarjoa osaamistasi',
  description:
    'Duunex yhdistää avun tarvitsijat ja paikalliset tekijät Suomessa.',
  icons: {
    icon: '/images/brand/duunex-icon.png',
    apple: '/images/brand/duunex-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          GeistSans.variable,
          GeistMono.variable
        )}
      >
        <AuthProvider>
          <QueryProvider>
            <div className="relative flex min-h-screen flex-col">
              <ConditionalHeader />
              {/* Reverted: Removed padding-top from main layout */}
              <main className="flex-1">{children}</main>
              <ConditionalFooter />
            </div>
            {/* Cookie consent banner */}
            <CookieConsentBanner />
            {/* Floating feedback button - TEMPORARILY DISABLED per Product Owner request */}
            {/* TODO: Re-enable after fixing overlap with form buttons - see issues.md */}
            {/* <FeedbackProvider /> */}
            <Toaster />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

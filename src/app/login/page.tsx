"use client"; // Make it a client component

import { LoginForm } from '@/components/features/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Component to hold the UI structure for the login page
function LoginPageContent({ signupHref }: { signupHref: string }) {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Kirjaudu sisään</CardTitle>
          <CardDescription>
            Tervetuloa takaisin!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* LoginForm itself is also wrapped in Suspense because it uses useSearchParams */}
          <Suspense fallback={<p>Ladataan lomake...</p>}> 
            <LoginForm />
          </Suspense>
          <div className="mt-6 text-center text-sm">
            Eikö sinulla ole tunnusta?{' '}
            <Link href={signupHref} className="font-medium text-primary hover:underline">
              Rekisteröidy tästä
            </Link>
          </div>
           <div className="mt-4 text-center text-sm">
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:underline">
              Unohtuiko salasana?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component to contain logic using useSearchParams for the login page
function LoginLogicContainer() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirectPath = searchParams.get('redirect');
    const categorySlug = searchParams.get('categorySlug');
    
    if (redirectPath) {
      let fullRedirectUrl = redirectPath;
      if (categorySlug) {
        fullRedirectUrl += `?category=${categorySlug}`;
      }
      try {
        localStorage.setItem('postLoginRedirect', fullRedirectUrl);
        console.log('LoginLogicContainer: Stored postLoginRedirect:', fullRedirectUrl);
      } catch (error) {
        console.error("LoginLogicContainer: Error setting localStorage", error);
      }
    }
  }, [searchParams]);

  const redirectParam = searchParams.get('redirect');
  const categorySlugParam = searchParams.get('categorySlug');
  
  let signupHref = "/signup";
  if (redirectParam) {
    signupHref += `?redirect=${encodeURIComponent(redirectParam)}`;
    if (categorySlugParam) {
      signupHref += `&categorySlug=${encodeURIComponent(categorySlugParam)}`;
    }
  } else if (categorySlugParam) { // In case categorySlug is present without redirect
    signupHref += `?categorySlug=${encodeURIComponent(categorySlugParam)}`;
  }

  return <LoginPageContent signupHref={signupHref} />;
}

// The actual page component, which sets up the Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<p>Ladataan sivu...</p>}> {/* Fallback for the main page logic */}
      <LoginLogicContainer />
    </Suspense>
  );
}

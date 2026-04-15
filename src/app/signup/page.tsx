"use client"; // Make it a client component

import { SignUpForm } from '@/components/features/auth/signup-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// This component remains the same, holding the UI structure
function SignUpPageContent({ loginHref }: { loginHref: string }) {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Luo Duunex-tili</CardTitle>
          <CardDescription>
            Liity yhteisöön ja ala löytämään apua tai tarjoamaan osaamistasi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
          <div className="mt-6 text-center text-sm">
            Onko sinulla jo tili?{' '}
            <Link href={loginHref} className="font-medium text-primary hover:underline">
              Kirjaudu sisään tästä
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// New component to contain logic using useSearchParams
function SignupLogicContainer() {
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
        console.log('SignUpPageLogic: Stored postLoginRedirect:', fullRedirectUrl);
      } catch (error) {
        console.error("SignUpPageLogic: Error setting localStorage", error);
      }
    }
  }, [searchParams]);

  const redirectParam = searchParams.get('redirect');
  const categorySlugParam = searchParams.get('categorySlug');
  
  let loginHref = "/login";
  if (redirectParam) {
    loginHref += `?redirect=${encodeURIComponent(redirectParam)}`;
    if (categorySlugParam) {
      loginHref += `&categorySlug=${encodeURIComponent(categorySlugParam)}`;
    }
  } else if (categorySlugParam) { // In case categorySlug is present without redirect
    loginHref += `?categorySlug=${encodeURIComponent(categorySlugParam)}`;
  }

  return <SignUpPageContent loginHref={loginHref} />;
}

// The actual page component, which sets up the Suspense boundary
export default function SignUpPage() {
  return (
    <Suspense fallback={<p>Ladataan sivua...</p>}> {/* Or a more sophisticated loader */}
      <SignupLogicContainer />
    </Suspense>
  );
}

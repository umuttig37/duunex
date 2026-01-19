'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // Client component supabase
import { Loader2 } from 'lucide-react';

export default function AuthCallbackClientPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Vahvistetaan istuntoa, odota hetki...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let anErrorOccurred = false; // Flag to prevent double redirect on error

    const handleAuthRedirect = async () => {
      // Supabase client initializes session automatically based on cookies set by route.ts
      // We just need to wait a bit for it to be potentially ready
      // A more robust way is to listen to onAuthStateChange, but a small delay often works for this specific callback page.
      
      // Give a moment for the session to be potentially established by Supabase client
      await new Promise(resolve => setTimeout(resolve, 100)); 

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.warn('AuthCallbackPage: Error fetching session or no session found.', sessionError);
        if (!anErrorOccurred) {
            anErrorOccurred = true;
            setError('Istunnon vahvistaminen epäonnistui. Yritä kirjautua uudelleen.');
            setTimeout(() => router.replace('/login'), 3000);
        }
        return;
      }

      // Session exists, now fetch profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error("AuthCallbackPage: Error fetching profile for role check", profileError);
        // Decide on fallback behavior if profile fetch fails but session exists
        if (!anErrorOccurred) {
            anErrorOccurred = true;
            setError('Profiilin lataus epäonnistui. Yritä kirjautua uudelleen.');
            setTimeout(() => router.replace('/login'), 3000);
        }
        return;
      }

      if (profile?.role === 'admin') {
        console.log('AuthCallbackPage: Admin user detected, redirecting to /admin.');
        router.replace('/admin');
        return;
      }

      // Not an admin, proceed with intended redirect or default for other users
      let intendedRedirectUrl = null;
      try {
        intendedRedirectUrl = localStorage.getItem('postLoginRedirect');
        if (intendedRedirectUrl) {
          console.log('AuthCallbackPage: Found postLoginRedirect in localStorage:', intendedRedirectUrl);
          localStorage.removeItem('postLoginRedirect'); // Clean up
          router.replace(intendedRedirectUrl);
        } else {
          console.log('AuthCallbackPage: No postLoginRedirect in localStorage, redirecting to dashboard for non-admin.');
          router.replace('/dashboard'); // Default redirect for non-admin users
        }
      } catch (e) {
        console.error("AuthCallbackPage: Error accessing localStorage or redirecting", e);
        if (!anErrorOccurred) {
            anErrorOccurred = true;
            setError('Istunnon palautuksessa tapahtui virhe. Yritä kirjautua uudelleen.');
            // Fallback redirect to login on critical error
            setTimeout(() => router.replace('/login'), 3000);
        }
      }
    };

    handleAuthRedirect();

  }, [router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-xl font-semibold text-destructive mb-4">Virhe</h1>
        <p className="text-destructive">{error}</p>
        <p className="mt-4 text-sm text-muted-foreground">Sinut ohjataan pian kirjautumissivulle...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
      <h1 className="text-xl font-semibold text-foreground mb-2">Hetkinen...</h1>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
} 
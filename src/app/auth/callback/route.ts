import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers'; // Use the direct import

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  // const next = requestUrl.searchParams.get('next') || '/'; // next param not directly used for redirect decision here

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              // console.error('Failed to set all cookies in Supabase client config:', error);
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Successful exchange, Supabase server has set HttpOnly session cookies.
      // Redirect to the client-side page to handle localStorage redirect.
      return NextResponse.redirect(`${requestUrl.origin}/auth/callback-complete`);
    }
    console.error('Auth callback error exchanging code:', error);
    // Fall through to error redirect if exchangeCodeForSession fails
  }

  // If there's an error, no code, or exchange failed, redirect to login with error
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('error', 'auth_callback_failed');
  loginUrl.searchParams.set('error_description', code ? 'Failed to exchange code for session.' : 'Missing authentication code.');
  return NextResponse.redirect(loginUrl);
} 
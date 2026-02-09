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

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.session) {
      // Ensure profile exists for OAuth users (trigger may not run or RLS can block it)
      const user = sessionData.session.user;
      const meta = user.user_metadata || {};
      const fullName = (meta.full_name ?? meta.name ?? '') as string;
      const firstName = (meta.given_name ?? (fullName ? fullName.split(' ')[0] : '') ?? '') as string;
      const lastName = (meta.family_name ?? (fullName ? fullName.split(' ').slice(1).join(' ') : '') ?? '') as string;
      await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email ?? (meta.email as string | undefined) ?? null,
          first_name: firstName || null,
          last_name: lastName || null,
          avatar_url: (meta.avatar_url ?? meta.picture) as string | undefined ?? null,
          role: 'user',
        },
        { onConflict: 'id' }
      );
      // Successful exchange, Supabase server has set HttpOnly session cookies.
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
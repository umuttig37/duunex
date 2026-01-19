import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession();

  // Role-based protected routes logic
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Define protected routes by role
  const protectedRoutes = [
    { path: '/tasks', roles: ['user', 'tasker', 'admin'] },
    { path: '/profile', roles: ['user', 'tasker', 'admin'] },
    { path: '/admin', roles: ['admin'] },
    { path: '/tasker', roles: ['tasker', 'admin'] },
    // Add more as needed
  ];

  // Define routes only accessible to unauthenticated users
  const authRoutes = ['/login', '/signup'];

  // Helper to fetch user profile and role from Supabase
  async function getUserRole(userId: string | undefined) {
    if (!userId) return undefined;
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Error fetching user role in middleware:', error);
      return undefined;
    }
    return data?.role;
  }

  if (user) {
    const userId = user.id;
    const userRole = await getUserRole(userId);
    
    const effectiveUserRole = userRole || null;

    // IMPORTANT: Redirect admin users to admin routes when they visit regular routes
    if (effectiveUserRole === 'admin') {
      // Define routes that admin should be redirected from to /admin
      const adminRedirectRoutes = ['/dashboard', '/tasks', '/profile'];
      
      if (adminRedirectRoutes.some(route => pathname.startsWith(route)) && !pathname.startsWith('/admin')) {
        console.log('Middleware: Redirecting admin user from', pathname, 'to /admin');
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        url.searchParams.set('message', 'Ohjattiin admin-hallintapaneeliin');
        return NextResponse.redirect(url);
      }
    }

    const protectedRoute = protectedRoutes.find(r => pathname.startsWith(r.path));
    if (protectedRoute && (!effectiveUserRole || !protectedRoute.roles.includes(effectiveUserRole))) {
      // Redirect to home if user does not have required role
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    // Prevent authenticated users from accessing login/signup
    if (authRoutes.some(path => pathname.startsWith(path))) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  } else {
    // Not authenticated: block protected routes, but allow /tasks/new
    if (pathname.startsWith('/tasks/new')) {
      // Allow access to /tasks/new and /tasks/new?category=... for unauthenticated users
      // Proceed without redirecting to login for this specific path
    } else {
      const protectedRoute = protectedRoutes.find(r => pathname.startsWith(r.path));
      if (protectedRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirectedFrom', pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

/*
When calling supabase.auth.signUp, make sure to include data: { role, full_name } in the options, so the metadata is available for the trigger.
*/
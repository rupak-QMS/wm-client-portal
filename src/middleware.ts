import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/forgot-password'];

const ROLE_ROUTES: Record<string, string[]> = {
  manager:         ['/manager'],
  account_manager: ['/account'],
  client:          ['/client'],
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:  () => request.cookies.getAll(),
        setAll: (cs) => {
          cs.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith('/api/auth'))) {
    return response;
  }

  // Not logged in → redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Fetch role from public.users
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role as string | undefined;

  if (role) {
    for (const [r, prefixes] of Object.entries(ROLE_ROUTES)) {
      if (r !== role && prefixes.some(p => pathname.startsWith(p))) {
        const dashPath =
          role === 'manager'         ? '/manager/dashboard' :
          role === 'account_manager' ? '/account/dashboard' :
                                       '/client/dashboard';
        return NextResponse.redirect(new URL(dashPath, request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg).*)'],
};
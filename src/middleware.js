import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();

  // Check if we're on a protected route (any route under the (app) group)
  // We don't need to check the pathname here as the layout component handles authentication
  
  // If the user is authenticated and trying to access auth pages
  if (session && (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register'))) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

// Specify the paths that this middleware should run on
export const config = {
  matcher: ['/login', '/register'],
}; 
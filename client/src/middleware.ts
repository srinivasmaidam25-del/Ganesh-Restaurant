import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Scaffolding for admin route protection
  // In a cookie-based Supabase session flow, you would verify sessions here.
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

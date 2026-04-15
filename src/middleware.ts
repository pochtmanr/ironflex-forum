import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://tarnovsky.ru')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/api')) {
    const response = NextResponse.next();

    // Admin endpoints are same-origin only — no CORS headers at all.
    const isAdmin = pathname.startsWith('/api/admin');

    if (!isAdmin) {
      const origin = request.headers.get('origin') || '';
      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
      response.headers.set('Vary', 'Origin');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Max-Age', '86400');
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
};

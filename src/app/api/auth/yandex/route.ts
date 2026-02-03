import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const YANDEX_CLIENT_ID = process.env.YANDEX_CLIENT_ID!;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Yandex ID OAuth (NOT Yandex Cloud)
const YANDEX_AUTH_URL = 'https://oauth.yandex.ru/authorize';

// GET: Redirect user to Yandex login page
export async function GET(request: NextRequest) {
  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: YANDEX_CLIENT_ID,
    redirect_uri: `${BASE_URL}/api/auth/yandex/callback`,
    state,
  });

  const response = NextResponse.redirect(`${YANDEX_AUTH_URL}?${params.toString()}`);
  response.cookies.set('yandex_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}

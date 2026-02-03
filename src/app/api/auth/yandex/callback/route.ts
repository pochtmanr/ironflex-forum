import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateTokens } from '@/lib/auth';

const YANDEX_CLIENT_ID = process.env.YANDEX_CLIENT_ID!;
const YANDEX_CLIENT_SECRET = process.env.YANDEX_CLIENT_SECRET!;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Yandex ID OAuth endpoints (NOT Yandex Cloud)
const YANDEX_TOKEN_URL = 'https://oauth.yandex.ru/token';
const YANDEX_USERINFO_URL = 'https://login.yandex.ru/info?format=json';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Yandex auth error:', error, searchParams.get('error_description'));
      return NextResponse.redirect(`${BASE_URL}/login?error=yandex_denied`);
    }

    if (!code) {
      return NextResponse.redirect(`${BASE_URL}/login?error=no_code`);
    }

    // Verify state
    const savedState = request.cookies.get('yandex_oauth_state')?.value;
    if (!savedState || savedState !== state) {
      console.error('Yandex auth: state mismatch');
      return NextResponse.redirect(`${BASE_URL}/login?error=state_mismatch`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch(YANDEX_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: YANDEX_CLIENT_ID,
        client_secret: YANDEX_CLIENT_SECRET,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('Yandex token exchange failed:', errText);
      return NextResponse.redirect(`${BASE_URL}/login?error=token_exchange`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Yandex ID API
    const userInfoResponse = await fetch(YANDEX_USERINFO_URL, {
      headers: {
        'Authorization': `OAuth ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      const errText = await userInfoResponse.text();
      console.error('Yandex userinfo failed:', errText);
      return NextResponse.redirect(`${BASE_URL}/login?error=userinfo_failed`);
    }

    const yandexUser = await userInfoResponse.json();
    // Yandex ID returns: id, login, client_id, display_name, real_name,
    // first_name, last_name, sex, default_email, emails, default_avatar_id, is_avatar_empty
    const yandexId = yandexUser.id;
    const email = yandexUser.default_email || (yandexUser.emails && yandexUser.emails[0]) || null;
    const displayName = yandexUser.display_name || yandexUser.real_name || yandexUser.login || '';
    const avatarId = yandexUser.default_avatar_id;
    const photoUrl = avatarId && !yandexUser.is_avatar_empty
      ? `https://avatars.yandex.net/get-yapic/${avatarId}/islands-200`
      : null;

    if (!yandexId) {
      console.error('Yandex auth: no id in userinfo', yandexUser);
      return NextResponse.redirect(`${BASE_URL}/login?error=no_user_id`);
    }

    // Find existing user by yandex_id
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('yandex_id', yandexId)
      .single();

    let user;

    if (!existingUser) {
      // Check if a user with this email already exists (link accounts)
      let linkedUser = null;
      if (email) {
        const { data: emailUser } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
        linkedUser = emailUser;
      }

      if (linkedUser) {
        // Link Yandex account to existing user
        await supabaseAdmin
          .from('users')
          .update({
            yandex_id: yandexId,
            photo_url: linkedUser.photo_url || photoUrl,
            last_login: new Date().toISOString(),
          })
          .eq('id', linkedUser.id);
        user = { ...linkedUser, yandex_id: yandexId };
      } else {
        // Create new user
        const username = `ya_${yandexId}_${Math.random().toString(36).substr(2, 5)}`;
        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            email: email || `yandex_${yandexId}@yandex.placeholder.com`,
            username,
            display_name: displayName,
            photo_url: photoUrl,
            yandex_id: yandexId,
            is_verified: true,
            is_admin: false,
            is_active: true,
          })
          .select()
          .single();

        if (insertError || !newUser) {
          console.error('Yandex user creation error:', insertError);
          return NextResponse.redirect(`${BASE_URL}/login?error=user_creation`);
        }
        user = newUser;
      }
    } else {
      // Update last login
      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', existingUser.id);
      user = existingUser;
    }

    // Generate JWT tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.is_admin,
    });

    // Store refresh token
    await supabaseAdmin
      .from('users')
      .update({ refresh_token: tokens.refreshToken })
      .eq('id', user.id);

    // Redirect to frontend with tokens
    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      photoURL: user.photo_url,
      isAdmin: user.is_admin,
    }));

    const redirectUrl = `${BASE_URL}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&user=${userData}`;

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('yandex_oauth_state');

    return response;
  } catch (error) {
    console.error('Yandex callback error:', error);
    return NextResponse.redirect(`${BASE_URL}/login?error=server_error`);
  }
}

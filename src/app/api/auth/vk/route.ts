import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateTokens } from '@/lib/auth';

const VK_APP_ID = process.env.VK_APP_ID || '54219432';
const VK_SECRET_KEY = process.env.VK_SECRET_KEY || 'qN5oY1IJe9uUFsxxRTil';
const VK_SERVICE_KEY = process.env.VK_SERVICE_KEY || 'e60b849ae60b849ae60b849a0ee530d632ee60be60b849a8eedd4c410c10ed625908ed1';
const VK_REDIRECT_URI = process.env.NEXT_PUBLIC_SITE_URL || 'https://tarnovsky.ru';

// Suppress unused variable warnings for VK config used in commented-out code
void VK_APP_ID; void VK_SECRET_KEY; void VK_SERVICE_KEY; void VK_REDIRECT_URI;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, deviceId, accessToken: vkAccessToken } = body;

    let accessToken = vkAccessToken;
    let userId = null;

    // If we have code and deviceId, exchange them for an access token
    if (code && deviceId && !accessToken) {
      try {
        console.error('VK auth: received code instead of access_token - client should exchange code');
        return NextResponse.json(
          { error: 'VK authentication incomplete - client should exchange code for token' },
          { status: 400 }
        );
      } catch (error) {
        console.error('Error handling VK code:', error);
        return NextResponse.json(
          { error: 'Failed to process VK authentication' },
          { status: 500 }
        );
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'VK access token is required' },
        { status: 400 }
      );
    }

    // Get user info from VK API
    try {
      const userInfoResponse = await fetch(
        `https://api.vk.com/method/users.get?access_token=${accessToken}&v=5.131&fields=photo_200,city,country`
      );

      if (!userInfoResponse.ok) {
        console.error('VK API error:', await userInfoResponse.text());
        return NextResponse.json(
          { error: 'Failed to fetch VK user info' },
          { status: 400 }
        );
      }

      const userInfoData = await userInfoResponse.json();

      if (userInfoData.error) {
        console.error('VK API error:', userInfoData.error);
        return NextResponse.json(
          { error: userInfoData.error.error_msg || 'VK API error' },
          { status: 400 }
        );
      }

      const vkUser = userInfoData.response[0];
      const vkUserId = userId || vkUser.id.toString();

      // Find or create user in our database
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('vk_id', vkUserId)
        .single();

      let user;

      if (!existingUser) {
        // Create new user
        const username = `vk_${vkUserId}_${Math.random().toString(36).substr(2, 5)}`;
        const displayName = `${vkUser.first_name} ${vkUser.last_name}`.trim();

        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            email: `vk_${vkUserId}@vk.placeholder.com`,
            username,
            display_name: displayName,
            photo_url: vkUser.photo_200 || null,
            city: vkUser.city?.title || null,
            country: vkUser.country?.title || null,
            vk_id: vkUserId,
            is_verified: true,
            is_admin: false,
            is_active: true,
          })
          .select()
          .single();

        if (insertError || !newUser) {
          console.error('VK user creation error:', insertError);
          return NextResponse.json(
            { error: 'Failed to create VK user' },
            { status: 500 }
          );
        }

        user = newUser;
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

      // Store refresh token in database
      await supabaseAdmin
        .from('users')
        .update({ refresh_token: tokens.refreshToken })
        .eq('id', user.id);

      return NextResponse.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.display_name,
          photoURL: user.photo_url,
          isAdmin: user.is_admin,
        },
      });
    } catch (error) {
      console.error('Error fetching VK user info:', error);
      return NextResponse.json(
        { error: 'Failed to fetch VK user information' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('VK authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

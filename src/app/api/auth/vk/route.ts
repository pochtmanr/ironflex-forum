import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateTokens } from '@/lib/auth';

const VK_APP_ID = process.env.VK_APP_ID || '54219432';
const VK_SECRET_KEY = process.env.VK_SECRET_KEY || 'qN5oY1IJe9uUFsxxRTil';
const VK_SERVICE_KEY = process.env.VK_SERVICE_KEY || 'e60b849ae60b849ae60b849a0ee530d632ee60be60b849a8eedd4c410c10ed625908ed1';
// VK requires exact redirect URL match - no trailing slash
const VK_REDIRECT_URI = process.env.NEXT_PUBLIC_SITE_URL || 'https://tarnovsky.ru';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { code, deviceId, accessToken: vkAccessToken } = body;

    console.log('VK auth request:', { code, deviceId, hasAccessToken: !!vkAccessToken });

    let accessToken = vkAccessToken;
    let userId = null;

    // If we have code and deviceId, exchange them for an access token
    if (code && deviceId && !accessToken) {
      try {
        // VK ID SDK handles the code exchange on the client side
        // We should receive the access_token directly from the client
        // If we're here, something went wrong - return error
        console.error('VK auth: received code instead of access_token - client should exchange code');
        return NextResponse.json(
          { error: 'VK authentication incomplete - client should exchange code for token' },
          { status: 400 }
        );
        
        /* 
        // Note: VK ID SDK uses PKCE and exchanges the code on the client side
        // The client should send us the access_token directly after exchanging the code
        // Server-side code exchange requires code_verifier which is generated on client
        const tokenResponse = await fetch('https://id.vk.com/oauth2/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            device_id: deviceId,
            redirect_uri: VK_REDIRECT_URI,
            client_id: VK_APP_ID,
            // code_verifier is required but we don't have it server-side
          }),
        });
        */
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

      console.log('VK user info:', vkUser);

      // Find or create user in our database
      let user = await User.findOne({ vkId: vkUserId });

      if (!user) {
        // Try to find by email if available
        // Note: VK doesn't always provide email without special permissions
        // Create new user
        const username = `vk_${vkUserId}_${Math.random().toString(36).substr(2, 5)}`;
        const displayName = `${vkUser.first_name} ${vkUser.last_name}`.trim();

        user = await User.create({
          email: `vk_${vkUserId}@vk.placeholder.com`, // VK doesn't always provide email
          username,
          displayName,
          photoURL: vkUser.photo_200 || null,
          city: vkUser.city?.title || null,
          country: vkUser.country?.title || null,
          vkId: vkUserId,
          isVerified: true, // VK users are considered verified
          isAdmin: false,
          isActive: true,
        });

        console.log('Created new VK user:', user._id);
      } else {
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        console.log('Existing VK user logged in:', user._id);
      }

      // Generate JWT tokens
      const tokens = generateTokens({
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
      });

      // Store refresh token in database
      user.refreshToken = tokens.refreshToken;
      await user.save();

      return NextResponse.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isAdmin: user.isAdmin,
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


import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    console.log('Debug - Auth header:', authHeader)
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'No Bearer token found',
        authHeader: authHeader
      }, { status: 400 })
    }

    const token = authHeader.substring(7)
    console.log('Debug - Extracted token:', token.substring(0, 20) + '...')
    
    const userPayload = verifyAccessToken(token)
    console.log('Debug - User payload:', userPayload)
    
    if (!userPayload) {
      return NextResponse.json({
        error: 'Token verification failed',
        tokenLength: token.length,
        tokenStart: token.substring(0, 20),
        jwtSecret: process.env.JWT_SECRET ? 'Present' : 'Missing'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      userPayload,
      tokenValid: true
    })

  } catch (error) {
    console.error('Debug token error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { verifyAccessToken } from '@/lib/auth'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const userPayload = verifyAccessToken(token)
    
    if (!userPayload || !userPayload.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Check if we're in production (on VPS)
    const isProduction = process.env.NODE_ENV === 'production'
    
    if (!isProduction) {
      return NextResponse.json(
        { error: 'Deployment is only available in production environment' },
        { status: 400 }
      )
    }

    console.log('Starting deployment...')

    // Execute deployment script
    const { stdout, stderr } = await execAsync('cd /root/iron-blog && bash deploy.sh', {
      timeout: 300000, // 5 minutes timeout
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    })

    console.log('Deployment output:', stdout)
    if (stderr) {
      console.log('Deployment stderr:', stderr)
    }

    return NextResponse.json({
      success: true,
      message: 'Deployment completed successfully',
      output: stdout,
      errors: stderr || null
    })

  } catch (error) {
    console.error('Deployment error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Deployment failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get deployment status
export async function GET() {
  try {
    // Always assume we're in Docker for production
    // The deploy endpoint is not meant to be used from within the container
    return NextResponse.json({
      success: true,
      environment: 'docker',
      nodeEnv: process.env.NODE_ENV,
      hostname: process.env.HOSTNAME,
      timestamp: new Date().toISOString(),
      message: 'Running in Docker container. To deploy, SSH to server and run: cd /root/iron-blog && git pull && docker-compose up -d --build'
    })

  } catch (error) {
    console.error('Status check error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get deployment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


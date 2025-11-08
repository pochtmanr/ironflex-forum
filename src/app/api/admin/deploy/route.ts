import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Check if we're in production (on VPS)
    const isProduction = process.env.NODE_ENV === 'production'
    
    if (!isProduction) {
      return NextResponse.json(
        { error: 'Deployment is only available in production environment' },
        { status: 400 }
      )
    }

    // Execute deployment script
    const { stdout, stderr } = await execAsync('cd /root/iron-blog && ./deploy.sh', {
      timeout: 300000 // 5 minutes timeout
    })

    return NextResponse.json({
      success: true,
      message: 'Deployment initiated successfully',
      output: stdout,
      errors: stderr || null
    })

  } catch (error) {
    console.error('Deployment error:', error)
    
    return NextResponse.json(
      { 
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
    // Get git info
    const { stdout: gitInfo } = await execAsync('cd /root/iron-blog && git log -1 --pretty=format:"%h - %s (%cr)" 2>/dev/null || echo "unknown"')
    
    // Get container status
    const { stdout: containerStatus } = await execAsync('docker ps --format "{{.Names}}: {{.Status}}"')
    
    return NextResponse.json({
      success: true,
      lastCommit: gitInfo.trim(),
      containers: containerStatus.trim().split('\n'),
      timestamp: new Date().toISOString()
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


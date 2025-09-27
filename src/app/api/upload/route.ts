import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Forward the request to the fileserver
    const fileserverResponse = await fetch('http://fileserver:3001/upload', {
      method: 'POST',
      body: formData
    })

    if (!fileserverResponse.ok) {
      const error = await fileserverResponse.json().catch(() => ({ error: 'Upload failed' }))
      return NextResponse.json(error, { status: fileserverResponse.status })
    }

    const result = await fileserverResponse.json()
    
    // Update the file URL to be accessible from the frontend
    const updatedResult = {
      ...result,
      file_url: result.file_url.replace('http://fileserver:3001', '')
    }

    return NextResponse.json(updatedResult)
  } catch (error) {
    console.error('Upload proxy error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

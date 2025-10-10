import { NextRequest, NextResponse } from 'next/server'

// Get fileserver URL from environment or use defaults
const FILESERVER_URL = process.env.FILESERVER_URL || 'http://fileserver:3001'
const FILESERVER_FALLBACK = process.env.FILESERVER_FALLBACK || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API: Received request');
    const formData = await request.formData()
    
    // Check if file exists in form data
    const file = formData.get('file');
    if (!file) {
      console.log('Upload API: No file in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log('Upload API: File found, forwarding to fileserver');
    
    // Forward the request to the fileserver
    console.log(`Upload API: Attempting to connect to fileserver at ${FILESERVER_URL}...`);
    
    // Try primary fileserver URL first, then fallback
    let fileserverResponse;
    try {
      fileserverResponse = await fetch(`${FILESERVER_URL}/upload`, {
        method: 'POST',
        body: formData
      });
    } catch (primaryError: any) {
      console.log(`Upload API: Primary connection failed, trying fallback at ${FILESERVER_FALLBACK}...`);
      try {
        fileserverResponse = await fetch(`${FILESERVER_FALLBACK}/upload`, {
          method: 'POST',
          body: formData
        });
      } catch (fallbackError: any) {
        console.log('Upload API: Both connection attempts failed');
        throw new Error(`Upload API: Connection failed: Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
      }
    }

    console.log('Upload API: Fileserver response status:', fileserverResponse.status);

    if (!fileserverResponse.ok) {
      const error = await fileserverResponse.json().catch(() => ({ error: 'Upload failed' }))
      console.log('Upload API: Fileserver error:', error);
      return NextResponse.json(error, { status: fileserverResponse.status })
    }

    const result = await fileserverResponse.json()
    console.log('Upload API: Success, result:', result);
    
    // Update the file URL to be accessible from the frontend
    // Remove internal Docker hostname or localhost references
    let fileUrl = result.file_url;
    if (fileUrl) {
      fileUrl = fileUrl
        .replace('http://fileserver:3001', '')
        .replace('http://localhost:3001', '')
        .replace('http://95.163.180.91:3001', '');
    }
    
    const updatedResult = {
      ...result,
      file_url: fileUrl,
      url: fileUrl  // Add 'url' field for consistency
    }

    return NextResponse.json(updatedResult)
  } catch (error) {
    console.error('Upload proxy error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

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
    console.log('Upload API: Attempting to connect to fileserver...');
    
    // Try internal Docker hostname first, then fallback to server IP
    let fileserverResponse;
    try {
      fileserverResponse = await fetch('http://fileserver:3001/upload', {
        method: 'POST',
        body: formData
      });
    } catch (dockerError) {
      console.log('Upload API: Docker internal connection failed, trying server IP...');
      try {
        fileserverResponse = await fetch('http://95.163.180.91:3001/upload', {
          method: 'POST',
          body: formData
        });
      } catch (ipError) {
        console.log('Upload API: Both connection attempts failed');
        throw new Error(`Connection failed: Docker: ${dockerError.message}, IP: ${ipError.message}`);
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
    const updatedResult = {
      ...result,
      file_url: result.file_url.replace('http://fileserver:3001', '')
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

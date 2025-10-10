import { NextRequest, NextResponse } from 'next/server';

// Get fileserver URL from environment or use defaults
const FILESERVER_URL = process.env.FILESERVER_URL || 'http://fileserver:3001'
const FILESERVER_FALLBACK = process.env.FILESERVER_FALLBACK || 'http://localhost:3001'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = path.join('/');
    console.log('File proxy: Requesting file:', filePath);

    // Try to fetch from fileserver
    let fileResponse;
    try {
      // Try primary fileserver URL
      console.log(`File proxy: Trying ${FILESERVER_URL}/${filePath}`);
      fileResponse = await fetch(`${FILESERVER_URL}/${filePath}`);
    } catch (primaryError) {
      console.log(`File proxy: Primary connection failed, trying fallback at ${FILESERVER_FALLBACK}...`);
      try {
        // Fallback to alternative URL
        fileResponse = await fetch(`${FILESERVER_FALLBACK}/${filePath}`);
      } catch (fallbackError) {
        console.log('File proxy: Both connection attempts failed');
        return NextResponse.json(
          { error: 'File server unavailable' },
          { status: 503 }
        );
      }
    }

    if (!fileResponse.ok) {
      console.log('File proxy: File not found:', filePath);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Get the file content and content type
    const fileBuffer = await fileResponse.arrayBuffer();
    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';

    console.log('File proxy: Successfully served file:', filePath);

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('File proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}


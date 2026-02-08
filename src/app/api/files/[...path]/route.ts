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

    // Try to fetch from fileserver
    let fileResponse;
    try {
      // Try primary fileserver URL
      fileResponse = await fetch(`${FILESERVER_URL}/${filePath}`);
    } catch (primaryError) {
      try {
        // Fallback to alternative URL
        fileResponse = await fetch(`${FILESERVER_FALLBACK}/${filePath}`);
      } catch (fallbackError) {
        return NextResponse.json(
          { error: 'File server unavailable' },
          { status: 503 }
        );
      }
    }

    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Get the file content and content type
    const fileBuffer = await fileResponse.arrayBuffer();
    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';


    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}


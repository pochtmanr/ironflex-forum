import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const file = formData.get('file') as Blob | null
    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Generate unique filename to avoid collisions
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const originalName = (file as unknown as { name?: string }).name || 'upload'
    const extension = originalName.split('.').pop() || 'bin'
    const fileName = `${timestamp}-${randomStr}.${extension}`

    // Convert to Buffer for Node.js 18 compatibility
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage "Forum" bucket
    const { data, error } = await supabaseAdmin.storage
      .from('Forum')
      .upload(fileName, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      })

    if (error) {
      console.error('Supabase storage upload error:', error)
      return NextResponse.json(
        { error: 'Upload failed', details: error.message },
        { status: 500 }
      )
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseAdmin.storage
      .from('Forum')
      .getPublicUrl(data.path)

    const fileUrl = urlData.publicUrl

    return NextResponse.json({
      success: true,
      file_url: fileUrl,
      url: fileUrl,
      filename: fileName,
      path: data.path
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

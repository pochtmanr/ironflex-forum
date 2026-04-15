import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAccessToken } from '@/lib/auth'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/avif': 'avif'
}

export async function POST(request: NextRequest) {
  try {
    // Require authenticated user (prevents anonymous bucket abuse)
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const payload = verifyAccessToken(authHeader.substring(7))
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as Blob | null
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Size limit — fail fast before reading into memory
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 413 })
    }

    // MIME allowlist — derive extension from server-trusted MIME, not client filename
    const mime = (file.type || '').toLowerCase()
    const extension = MIME_TO_EXT[mime]
    if (!extension) {
      return NextResponse.json(
        { error: 'Unsupported file type. Allowed: PNG, JPEG, WebP, GIF, HEIC, AVIF' },
        { status: 415 }
      )
    }

    // Sanitized random filename — never trust client-provided name
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 10)
    const fileName = `${payload.id}/${timestamp}-${randomStr}.${extension}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error } = await supabaseAdmin.storage
      .from('Forum')
      .upload(fileName, buffer, {
        contentType: mime,
        upsert: false
      })

    if (error) {
      console.error('Supabase storage upload error:', error)
      return NextResponse.json(
        { error: 'Upload failed', details: error.message },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('Forum')
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      file_url: urlData.publicUrl,
      url: urlData.publicUrl,
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

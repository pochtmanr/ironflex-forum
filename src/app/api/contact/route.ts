import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmailSecure } from '@/lib/email'

// Simple in-memory rate limit: max 3 submissions per IP per 10 minutes
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 10 * 60 * 1000
const RATE_LIMIT_MAX = 3

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (rateLimitMap.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW)
  rateLimitMap.set(ip, timestamps)
  if (timestamps.length >= RATE_LIMIT_MAX) return true
  timestamps.push(now)
  return false
}

function sanitize(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Слишком много обращений. Попробуйте позже.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, email, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения.' },
        { status: 400 }
      )
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof subject !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ error: 'Некорректные данные.' }, { status: 400 })
    }

    if (name.length > 100 || email.length > 200 || subject.length > 300 || message.length > 5000) {
      return NextResponse.json(
        { error: 'Превышена допустимая длина полей.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Некорректный формат email.' },
        { status: 400 }
      )
    }

    // Fetch recipient email from Supabase (never hardcoded in application code logs)
    const { data: setting } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'contact_recipient_email')
      .single()

    const recipientEmail = setting?.value
    if (!recipientEmail) {
      console.error('[CONTACT] Recipient email not configured in site_settings')
      return NextResponse.json(
        { error: 'Сервис временно недоступен.' },
        { status: 500 }
      )
    }

    // Sanitize all user input before embedding in HTML template
    const safeName = sanitize(name)
    const safeEmail = sanitize(email)
    const safeSubject = sanitize(subject)
    const safeMessage = sanitize(message)

    const sent = await sendEmailSecure(
      recipientEmail,
      `Обращение: ${safeSubject}`,
      'contact_form',
      {
        name: safeName,
        email: safeEmail,
        subject: safeSubject,
        message: safeMessage,
      }
    )

    if (!sent) {
      return NextResponse.json(
        { error: 'Не удалось отправить сообщение. Попробуйте позже.' },
        { status: 500 }
      )
    }

    // Log only that it happened, never the recipient
    console.log(`[CONTACT] Form submission sent successfully from ${safeEmail}`)

    return NextResponse.json({ message: 'Сообщение отправлено.' })
  } catch (error) {
    console.error('[CONTACT] Unexpected error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Произошла ошибка. Попробуйте позже.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAccessToken } from '@/lib/auth'

const MAX_CONSECUTIVE_MESSAGES = 5
const MESSAGE_MAX_LENGTH = 500
const DEFAULT_LIMIT = 50

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT)), 100)
    const before = searchParams.get('before') // cursor-based pagination

    let query = supabaseAdmin
      .from('conversation_messages')
      .select('id, user_id, user_name, content, created_at, media_links, reply_to, users:user_id(photo_url)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data: messages, error } = await query

    if (error) throw error

    // Flatten the joined user data
    const flatMessages = (messages || []).map((msg: Record<string, unknown>) => ({
      id: msg.id,
      user_id: msg.user_id,
      user_name: msg.user_name,
      content: msg.content,
      created_at: msg.created_at,
      media_links: (msg.media_links as string[]) || [],
      user_photo_url: (msg.users as Record<string, unknown> | null)?.photo_url || null,
      reply_to: (msg.reply_to as { id: string; author_name: string; excerpt: string } | null) || null,
    }))

    // hasMore = we fetched a full page, so there may be older messages
    return NextResponse.json({
      messages: flatMessages.reverse(),
      hasMore: flatMessages.length === limit
    })
  } catch (error) {
    console.error('Conversation fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)
    const payload = verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const content = (body.content || '').trim()
    const mediaLinks: string[] = Array.isArray(body.mediaLinks) ? body.mediaLinks.slice(0, 3) : []
    const replyTo: { id: string; author_name: string; excerpt: string } | null = body.replyTo || null

    if (!content && mediaLinks.length === 0) {
      return NextResponse.json(
        { error: 'Сообщение не может быть пустым' },
        { status: 400 }
      )
    }

    if (content.length > MESSAGE_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Максимальная длина сообщения ${MESSAGE_MAX_LENGTH} символов` },
        { status: 400 }
      )
    }

    // Check if user is banned from chat
    const { data: activeBan } = await supabaseAdmin
      .from('chat_user_bans')
      .select('id, reason, expires_at')
      .eq('user_id', payload.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (activeBan) {
      // Check if temporary ban has expired
      if (activeBan.expires_at && new Date(activeBan.expires_at) < new Date()) {
        // Auto-deactivate expired ban
        await supabaseAdmin
          .from('chat_user_bans')
          .update({ is_active: false })
          .eq('id', activeBan.id)
      } else {
        const reason = activeBan.reason ? `: ${activeBan.reason}` : ''
        return NextResponse.json(
          { error: `Вы заблокированы в чате${reason}` },
          { status: 403 }
        )
      }
    }

    // Check content against word blacklist
    if (content) {
      const { data: blacklistedWords } = await supabaseAdmin
        .from('chat_word_blacklist')
        .select('word')

      if (blacklistedWords && blacklistedWords.length > 0) {
        const contentLower = content.toLowerCase()
        const foundWord = blacklistedWords.find(({ word }) =>
          contentLower.includes(word.toLowerCase().trim())
        )
        if (foundWord) {
          return NextResponse.json(
            { error: 'Сообщение содержит запрещённое слово' },
            { status: 400 }
          )
        }
      }
    }

    // Anti-spam: allow up to MAX_CONSECUTIVE_MESSAGES consecutive messages.
    // After that, user must wait for someone else to post.
    const { data: recentMessages } = await supabaseAdmin
      .from('conversation_messages')
      .select('user_id')
      .order('created_at', { ascending: false })
      .limit(MAX_CONSECUTIVE_MESSAGES)

    if (recentMessages && recentMessages.length >= MAX_CONSECUTIVE_MESSAGES) {
      const allFromSameUser = recentMessages.every(
        (m: { user_id: string }) => m.user_id === payload.id
      )
      if (allFromSameUser) {
        return NextResponse.json(
          { error: 'Вы отправили 5 сообщений подряд. Дождитесь ответа другого участника.' },
          { status: 429 }
        )
      }
    }

    // Get user info for display name and photo
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('username, display_name, photo_url')
      .eq('id', payload.id)
      .single()

    const userName = user?.display_name || user?.username || payload.username

    // Insert message
    const { data: message, error } = await supabaseAdmin
      .from('conversation_messages')
      .insert({
        user_id: payload.id,
        user_name: userName,
        content: content || '',
        media_links: mediaLinks,
        reply_to: replyTo,
      })
      .select('id, user_id, user_name, content, created_at, media_links, reply_to')
      .single()

    if (error) throw error

    return NextResponse.json({
      message: {
        ...message,
        media_links: message.media_links || [],
        user_photo_url: user?.photo_url || null,
        reply_to: message.reply_to || null,
      }
    })
  } catch (error) {
    console.error('Conversation post error:', error)
    return NextResponse.json(
      { error: 'Не удалось отправить сообщение' },
      { status: 500 }
    )
  }
}

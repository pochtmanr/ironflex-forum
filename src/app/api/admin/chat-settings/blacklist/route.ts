import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

// GET - list all blacklisted words
export async function GET(request: NextRequest) {
  try {
    const result = await requireAdmin(request)
    if (result instanceof NextResponse) return result

    const { data, error } = await supabaseAdmin
      .from('chat_word_blacklist')
      .select('id, word, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ words: data || [] })
  } catch (error) {
    console.error('Blacklist fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch blacklist' }, { status: 500 })
  }
}

// POST - add a word to the blacklist
export async function POST(request: NextRequest) {
  try {
    const result = await requireAdmin(request)
    if (result instanceof NextResponse) return result
    const admin = result

    const body = await request.json()
    const word = (body.word || '').trim().toLowerCase()

    if (!word || word.length < 2) {
      return NextResponse.json({ error: 'Слово должно содержать минимум 2 символа' }, { status: 400 })
    }

    if (word.length > 100) {
      return NextResponse.json({ error: 'Слово слишком длинное' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('chat_word_blacklist')
      .insert({ word, created_by: admin.userId })
      .select('id, word, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Это слово уже в чёрном списке' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ word: data })
  } catch (error) {
    console.error('Blacklist add error:', error)
    return NextResponse.json({ error: 'Failed to add word' }, { status: 500 })
  }
}

// DELETE - remove a word from the blacklist (by id in query param)
export async function DELETE(request: NextRequest) {
  try {
    const result = await requireAdmin(request)
    if (result instanceof NextResponse) return result

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing word id' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('chat_word_blacklist')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Blacklist delete error:', error)
    return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 })
  }
}

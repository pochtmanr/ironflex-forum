import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Test DB endpoint called')

    // Test read
    console.log('Testing read operation...')
    const { count: userCount, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      throw new Error(`Read test failed: ${countError.message}`)
    }
    console.log('User count:', userCount)

    // Test write (create a test user)
    console.log('Testing write operation...')
    const { data: testUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        email: `test-${Date.now()}@test.com`,
        username: `testuser${Date.now()}`,
        password_hash: 'test-hash',
        display_name: 'Test User',
        is_active: true,
        is_admin: false
      })
      .select('id')
      .single()

    if (insertError || !testUser) {
      throw new Error(`Write test failed: ${insertError?.message}`)
    }
    console.log('Test user created:', testUser.id)

    // Clean up test user
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', testUser.id)
    console.log('Test user deleted')

    return NextResponse.json({
      success: true,
      userCount,
      message: 'Database read/write test successful'
    })

  } catch (error) {
    console.error('Test DB error:', error)
    return NextResponse.json(
      {
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

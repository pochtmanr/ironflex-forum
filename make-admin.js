#!/usr/bin/env node

/**
 * Make a user admin by email (Supabase).
 * Usage: node make-admin.js <email>
 * Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const email = process.argv[2]
if (!email) {
  console.error('Usage: node make-admin.js <email>')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
})

;(async () => {
  const { data, error } = await supabase
    .from('users')
    .update({ is_admin: true, is_verified: true })
    .eq('email', email)
    .select('id, email, is_admin')
    .single()

  if (error) {
    console.error('Update failed:', error.message)
    process.exit(1)
  }
  if (!data) {
    console.error('User not found:', email)
    process.exit(1)
  }
  console.log('User is now admin:', data)
})()

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL is not set')
}

// Client-side: uses anon key (subject to RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side: uses service role key (bypasses RLS)
// Use this in all API routes. Only created when the key is available (server-side).
// On the client, supabaseServiceKey is empty because it lacks the NEXT_PUBLIC_ prefix.
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : (null as unknown as ReturnType<typeof createClient>)

export default supabaseAdmin

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anon) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
}
if (typeof window === 'undefined' && !service) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required server-side')
}

// Client-side: uses anon key (subject to RLS)
export const supabase = createClient(url, anon)

// Server-side: uses service role key (bypasses RLS)
// Use this in all API routes. Only created when the key is available (server-side).
// On the client, service is undefined because it lacks the NEXT_PUBLIC_ prefix.
export const supabaseAdmin = service
  ? createClient(url, service)
  : (null as unknown as ReturnType<typeof createClient>)

export default supabaseAdmin

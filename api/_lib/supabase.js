// api/_lib/supabase.js
// Shared Supabase client for all serverless functions
import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars')
}

// Use the service role key (bypasses RLS) — safe because this runs server-side only
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

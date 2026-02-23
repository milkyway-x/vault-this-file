// api/files/confirm.js
// After client uploads directly to Supabase Storage, call this to mark files confirmed
import { supabase } from '../_lib/supabase.js'
import { requireAuth, handleCors, err } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return err(res, 405, 'Method not allowed')

  let user
  try { user = await requireAuth(req) } catch (e) { return err(res, e.status, e.message) }

  const { fileIds } = req.body || {}
  if (!fileIds?.length) return err(res, 400, 'fileIds required.')

  const { data: files, error } = await supabase
    .from('files')
    .update({ confirmed: true })
    .in('id', fileIds)
    .eq('owner_id', user.id)
    .select('id, name, original_name, mime_type, size_bytes, download_count, created_at')

  if (error) return err(res, 500, error.message)
  return res.json({ files })
}

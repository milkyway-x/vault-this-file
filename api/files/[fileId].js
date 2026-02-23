// api/files/[fileId].js
import { supabase } from '../_lib/supabase.js'
import { requireAuth, handleCors, err } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'DELETE') return err(res, 405, 'Method not allowed')

  let user
  try { user = await requireAuth(req) } catch (e) { return err(res, e.status, e.message) }

  const { fileId } = req.query

  const { data: file } = await supabase
    .from('files')
    .select('id, storage_path')
    .eq('id', fileId)
    .eq('owner_id', user.id)
    .single()

  if (!file) return err(res, 404, 'File not found.')

  // Delete from Supabase Storage
  if (file.storage_path) {
    await supabase.storage.from('vault-files').remove([file.storage_path])
  }

  await supabase.from('files').delete().eq('id', fileId)

  return res.json({ message: 'File deleted.' })
}

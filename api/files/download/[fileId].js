// api/files/download/[fileId].js
// Returns a signed 15-minute download URL from Supabase Storage — no Cloudflare needed
import { supabase } from '../../_lib/supabase.js'
import { handleCors, err } from '../../_lib/auth.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return err(res, 405, 'Method not allowed')

  const { fileId } = req.query

  const { data: file, error: fileErr } = await supabase
    .from('files')
    .select('id, original_name, mime_type, size_bytes, storage_path, vault_id, confirmed')
    .eq('id', fileId)
    .single()

  if (fileErr || !file) return err(res, 404, 'File not found.')
  if (!file.confirmed) return err(res, 404, 'File upload not complete.')

  // Generate signed URL (15 minutes)
  const { data: signed, error: urlErr } = await supabase.storage
    .from('vault-files')
    .createSignedUrl(file.storage_path, 900, {
      download: file.original_name,
    })

  if (urlErr) return err(res, 500, 'Could not generate download URL.')

  // Increment download counts
  await supabase.from('files').update({ download_count: file.download_count + 1 }).eq('id', fileId)
  await supabase.from('vaults').update({ download_count: supabase.raw('download_count + 1') }).eq('id', file.vault_id)

  return res.json({
    downloadUrl: signed.signedUrl,
    fileName: file.original_name,
    mimeType: file.mime_type,
    sizeBytes: file.size_bytes,
  })
}

// api/files/upload/[vaultId].js
// Uses Supabase Storage — no Cloudflare needed, no domain needed.
// Flow: client sends file metadata → server creates signed upload URL →
//       client uploads directly to Supabase Storage → client confirms → server saves record
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../../_lib/supabase.js'
import { requireAuth, handleCors, err } from '../../_lib/auth.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return err(res, 405, 'Method not allowed')

  let user
  try { user = await requireAuth(req) } catch (e) { return err(res, e.status, e.message) }

  const { vaultId } = req.query

  // Verify vault ownership
  const { data: vault } = await supabase
    .from('vaults')
    .select('id')
    .eq('id', vaultId)
    .eq('owner_id', user.id)
    .single()

  if (!vault) return err(res, 404, 'Vault not found.')

  const { files } = req.body || {}  // array of { name, size, mimeType }
  if (!files || !files.length) return err(res, 400, 'No file metadata provided.')

  // Generate signed upload URLs for each file
  const results = []
  for (const file of files) {
    const ext  = file.name.split('.').pop()
    const path = `${user.id}/${vaultId}/${uuidv4()}.${ext}`

    const { data: signedData, error: signError } = await supabase.storage
      .from('vault-files')
      .createSignedUploadUrl(path)

    if (signError) return err(res, 500, signError.message)

    // Pre-register the file record (confirm=true after upload completes)
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        vault_id: vaultId,
        owner_id: user.id,
        name: file.name,
        original_name: file.name,
        mime_type: file.mimeType || 'application/octet-stream',
        size_bytes: file.size || 0,
        storage_path: path,
        confirmed: false,
      })
      .select('id, name, original_name, mime_type, size_bytes, storage_path, created_at')
      .single()

    if (dbError) return err(res, 500, dbError.message)

    results.push({
      fileId: fileRecord.id,
      fileName: file.name,
      uploadUrl: signedData.signedUrl,
      storagePath: path,
      token: signedData.token,
    })
  }

  return res.status(201).json({ uploads: results })
}

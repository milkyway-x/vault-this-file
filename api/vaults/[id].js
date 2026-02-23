// api/vaults/[id].js
import bcrypt from 'bcryptjs'
import { supabase } from '../_lib/supabase.js'
import { requireAuth, handleCors, err } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  let user
  try { user = await requireAuth(req) } catch (e) { return err(res, e.status, e.message) }

  const { id } = req.query

  // ── GET: single vault + its files ──────────────────────────────
  if (req.method === 'GET') {
    const { data: vault, error } = await supabase
      .from('vaults')
      .select('id, name, description, visibility, share_code, download_count, created_at')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()

    if (error || !vault) return err(res, 404, 'Vault not found.')

    const { data: files } = await supabase
      .from('files')
      .select('id, name, original_name, mime_type, size_bytes, download_count, created_at')
      .eq('vault_id', id)
      .order('created_at', { ascending: false })

    return res.json({ vault, files: files || [] })
  }

  // ── PATCH: update vault ─────────────────────────────────────────
  if (req.method === 'PATCH') {
    const { name, description, visibility, password } = req.body || {}

    const updates = {}
    if (name) updates.name = name.trim()
    if (description !== undefined) updates.description = description?.trim() || null
    if (visibility) updates.visibility = visibility
    if (visibility === 'private' && password) updates.password_hash = await bcrypt.hash(password, 10)
    if (visibility === 'public') updates.password_hash = null

    const { data: vault, error } = await supabase
      .from('vaults')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select('id, name, description, visibility, share_code, download_count, created_at')
      .single()

    if (error || !vault) return err(res, 404, 'Vault not found.')
    return res.json({ vault })
  }

  // ── DELETE ──────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    // Get file storage keys first so we can delete from Supabase Storage
    const { data: files } = await supabase
      .from('files')
      .select('storage_path')
      .eq('vault_id', id)

    if (files?.length) {
      const paths = files.map(f => f.storage_path).filter(Boolean)
      if (paths.length) {
        await supabase.storage.from('vault-files').remove(paths)
      }
    }

    const { error } = await supabase
      .from('vaults')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id)

    if (error) return err(res, 500, error.message)
    return res.json({ message: 'Vault deleted.' })
  }

  return err(res, 405, 'Method not allowed')
}

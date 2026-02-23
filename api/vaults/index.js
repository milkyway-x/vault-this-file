// api/vaults/index.js
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../_lib/supabase.js'
import { requireAuth, handleCors, err } from '../_lib/auth.js'

const generateShareCode = () => Math.random().toString(36).substr(2, 8).toUpperCase()

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  let user
  try { user = await requireAuth(req) } catch (e) { return err(res, e.status, e.message) }

  // ── GET: list my vaults ─────────────────────────────────────────
  if (req.method === 'GET') {
    const { data: vaults, error } = await supabase
      .from('vaults')
      .select(`
        id, name, description, visibility, share_code,
        download_count, created_at,
        files(count, size_bytes)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return err(res, 500, error.message)

    // Flatten file aggregates
    const result = vaults.map(v => ({
      ...v,
      file_count: v.files?.length ?? 0,
      total_size: v.files?.reduce((acc, f) => acc + (f.size_bytes || 0), 0) ?? 0,
      files: undefined,
    }))

    return res.json({ vaults: result })
  }

  // ── POST: create vault ──────────────────────────────────────────
  if (req.method === 'POST') {
    const { name, description, visibility = 'public', password } = req.body || {}
    if (!name?.trim()) return err(res, 400, 'Vault name is required.')
    if (visibility === 'private' && !password) return err(res, 400, 'Private vaults require a password.')

    const share_code = generateShareCode()
    const password_hash = visibility === 'private' ? await bcrypt.hash(password, 10) : null

    const { data: vault, error } = await supabase
      .from('vaults')
      .insert({ owner_id: user.id, name: name.trim(), description: description?.trim() || null, visibility, password_hash, share_code })
      .select('id, name, description, visibility, share_code, download_count, created_at')
      .single()

    if (error) return err(res, 500, error.message)
    return res.status(201).json({ vault })
  }

  return err(res, 405, 'Method not allowed')
}

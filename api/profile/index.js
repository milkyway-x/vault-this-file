// api/profile/index.js
import bcrypt from 'bcryptjs'
import { supabase } from '../_lib/supabase.js'
import { requireAuth, handleCors, err } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return

  let user
  try { user = await requireAuth(req) } catch (e) { return err(res, e.status, e.message) }

  // ── GET profile ─────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, bio, avatar_url, two_fa_enabled, created_at')
      .eq('id', user.id)
      .single()
    if (error) return err(res, 500, error.message)
    return res.json({ user: data })
  }

  // ── PATCH: update profile ───────────────────────────────────────
  if (req.method === 'PATCH') {
    const { name, phone, bio, avatarUrl, currentPassword, newPassword } = req.body || {}

    // Password change
    if (currentPassword && newPassword) {
      if (newPassword.length < 6) return err(res, 400, 'New password must be at least 6 characters.')
      const { data: row } = await supabase.from('users').select('password_hash').eq('id', user.id).single()
      const ok = await bcrypt.compare(currentPassword, row.password_hash)
      if (!ok) return err(res, 401, 'Current password is incorrect.')
      const password_hash = await bcrypt.hash(newPassword, 12)
      await supabase.from('users').update({ password_hash }).eq('id', user.id)
      return res.json({ message: 'Password updated.' })
    }

    // Profile info update
    const updates = {}
    if (name !== undefined) updates.name = name?.trim()
    if (phone !== undefined) updates.phone = phone?.trim()
    if (bio !== undefined) updates.bio = bio?.trim()
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl

    const { data: updated, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('id, name, email, phone, bio, avatar_url, two_fa_enabled')
      .single()

    if (error) return err(res, 500, error.message)
    return res.json({ user: updated })
  }

  // ── DELETE: delete account ──────────────────────────────────────
  if (req.method === 'DELETE') {
    const { password } = req.body || {}
    const { data: row } = await supabase.from('users').select('password_hash').eq('id', user.id).single()
    const ok = await bcrypt.compare(password, row.password_hash)
    if (!ok) return err(res, 401, 'Incorrect password.')

    // Delete all storage files for this user first
    const { data: files } = await supabase
      .from('files')
      .select('storage_path')
      .eq('owner_id', user.id)

    if (files?.length) {
      const paths = files.map(f => f.storage_path).filter(Boolean)
      if (paths.length) await supabase.storage.from('vault-files').remove(paths)
    }

    await supabase.from('users').delete().eq('id', user.id)
    return res.json({ message: 'Account deleted. Goodbye.' })
  }

  return err(res, 405, 'Method not allowed')
}

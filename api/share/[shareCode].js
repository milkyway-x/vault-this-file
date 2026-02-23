// api/share/[shareCode].js
import bcrypt from 'bcryptjs'
import QRCode from 'qrcode'
import { supabase } from '../_lib/supabase.js'
import { handleCors, err } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return

  const { shareCode, action } = req.query
  const appUrl = process.env.VITE_APP_URL || 'https://your-app.vercel.app'

  // ── GET: fetch vault info ───────────────────────────────────────
  if (req.method === 'GET') {
    // ?action=qr → return QR code
    if (action === 'qr') {
      const shareUrl = `${appUrl}/share/${shareCode}`
      const qrCode = await QRCode.toDataURL(shareUrl, { width: 300, margin: 2 })
      return res.json({ qrCode, shareUrl })
    }

    const { data: vault, error } = await supabase
      .from('vaults')
      .select('id, name, description, visibility, share_code, download_count, created_at, users(name)')
      .eq('share_code', shareCode)
      .single()

    if (error || !vault) return err(res, 404, 'Vault not found. Maybe the link is wrong?')

    // Private vault — don't reveal files yet
    if (vault.visibility === 'private') {
      return res.json({
        vault: { ...vault, users: undefined, owner_name: vault.users?.name },
        locked: true,
      })
    }

    // Public vault — return files
    const { data: files } = await supabase
      .from('files')
      .select('id, original_name, mime_type, size_bytes, download_count, created_at')
      .eq('vault_id', vault.id)
      .eq('confirmed', true)
      .order('created_at', { ascending: false })

    return res.json({
      vault: { ...vault, users: undefined, owner_name: vault.users?.name },
      files: files || [],
      locked: false,
    })
  }

  // ── POST: unlock private vault ──────────────────────────────────
  if (req.method === 'POST') {
    const { password, fileId } = req.body || {}

    const { data: vault } = await supabase
      .from('vaults')
      .select('id, name, description, visibility, password_hash, share_code, download_count')
      .eq('share_code', shareCode)
      .single()

    if (!vault) return err(res, 404, 'Vault not found.')

    // Verify password for private vaults
    if (vault.visibility === 'private') {
      if (!password) return err(res, 400, 'Password required.')
      const ok = await bcrypt.compare(password, vault.password_hash)
      if (!ok) return err(res, 401, 'Wrong password. Nice try.')
    }

    // If fileId provided → return download URL for that file
    if (fileId) {
      const { data: file } = await supabase
        .from('files')
        .select('id, original_name, mime_type, size_bytes, storage_path, download_count')
        .eq('id', fileId)
        .eq('vault_id', vault.id)
        .eq('confirmed', true)
        .single()

      if (!file) return err(res, 404, 'File not found.')

      const { data: signed } = await supabase.storage
        .from('vault-files')
        .createSignedUrl(file.storage_path, 900, { download: file.original_name })

      // Increment counts
      await supabase.from('files').update({ download_count: file.download_count + 1 }).eq('id', fileId)
      await supabase.from('vaults').update({ download_count: vault.download_count + 1 }).eq('id', vault.id)

      return res.json({
        downloadUrl: signed.signedUrl,
        fileName: file.original_name,
        mimeType: file.mime_type,
        sizeBytes: file.size_bytes,
      })
    }

    // Otherwise return the files list (after unlock)
    const { data: files } = await supabase
      .from('files')
      .select('id, original_name, mime_type, size_bytes, download_count, created_at')
      .eq('vault_id', vault.id)
      .eq('confirmed', true)
      .order('created_at', { ascending: false })

    return res.json({
      vault: { id: vault.id, name: vault.name, description: vault.description, visibility: vault.visibility, share_code: vault.share_code },
      files: files || [],
      unlocked: true,
    })
  }

  return err(res, 405, 'Method not allowed')
}

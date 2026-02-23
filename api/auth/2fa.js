// api/auth/2fa.js  — handles setup, verify, disable via ?action= query param
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import bcrypt from 'bcryptjs'
import { supabase } from '../_lib/supabase.js'
import { requireAuth, handleCors, err } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return err(res, 405, 'Method not allowed')

  let user
  try { user = await requireAuth(req) } catch (e) { return err(res, e.status, e.message) }

  const { action } = req.query  // ?action=setup|verify|disable

  // ── SETUP ──────────────────────────────────────────────────────
  if (action === 'setup') {
    const secret = speakeasy.generateSecret({
      name: `VaultThisFile (${user.email})`,
      length: 20,
    })
    await supabase.from('users').update({ two_fa_secret: secret.base32 }).eq('id', user.id)
    const qrCode = await QRCode.toDataURL(secret.otpauth_url)
    return res.json({ secret: secret.base32, qrCode, otpauthUrl: secret.otpauth_url })
  }

  // ── VERIFY & ENABLE ────────────────────────────────────────────
  if (action === 'verify') {
    const { token } = req.body || {}
    const { data } = await supabase.from('users').select('two_fa_secret').eq('id', user.id).single()
    if (!data?.two_fa_secret) return err(res, 400, 'Run setup first.')
    const verified = speakeasy.totp.verify({
      secret: data.two_fa_secret, encoding: 'base32', token, window: 2,
    })
    if (!verified) return err(res, 400, 'Invalid code — check your authenticator clock.')
    await supabase.from('users').update({ two_fa_enabled: true }).eq('id', user.id)
    return res.json({ message: '2FA enabled successfully.' })
  }

  // ── DISABLE ────────────────────────────────────────────────────
  if (action === 'disable') {
    const { password } = req.body || {}
    const { data } = await supabase.from('users').select('password_hash').eq('id', user.id).single()
    const ok = await bcrypt.compare(password, data.password_hash)
    if (!ok) return err(res, 401, 'Incorrect password.')
    await supabase.from('users').update({ two_fa_enabled: false, two_fa_secret: null }).eq('id', user.id)
    return res.json({ message: '2FA disabled.' })
  }

  return err(res, 400, 'Unknown action. Use ?action=setup|verify|disable')
}

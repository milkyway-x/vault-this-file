// api/auth/login.js
import bcrypt from 'bcryptjs'
import speakeasy from 'speakeasy'
import { supabase } from '../_lib/supabase.js'
import { signToken, handleCors, err } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return err(res, 405, 'Method not allowed')

  const { email, password, totpCode } = req.body || {}
  if (!email || !password) return err(res, 400, 'Email and password are required.')

  const { data: user } = await supabase
    .from('users')
    .select('id, name, email, password_hash, avatar_url, two_fa_enabled, two_fa_secret')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!user) return err(res, 401, 'Invalid email or password.')

  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) return err(res, 401, 'Invalid email or password.')

  // 2FA check
  if (user.two_fa_enabled) {
    if (!totpCode) {
      return res.status(206).json({ requiresTwoFA: true, message: '2FA code required.' })
    }
    const verified = speakeasy.totp.verify({
      secret: user.two_fa_secret,
      encoding: 'base32',
      token: totpCode,
      window: 2,
    })
    if (!verified) return err(res, 401, 'Invalid 2FA code.')
  }

  const token = signToken(user.id)
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url, two_fa_enabled: user.two_fa_enabled },
  })
}

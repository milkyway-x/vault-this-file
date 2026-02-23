// api/auth/register.js
import bcrypt from 'bcryptjs'
import { supabase } from '../_lib/supabase.js'
import { signToken, handleCors, err } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return err(res, 405, 'Method not allowed')

  const { name, email, password } = req.body || {}
  if (!name || !email || !password) return err(res, 400, 'Name, email and password are required.')
  if (password.length < 6) return err(res, 400, 'Password must be at least 6 characters.')

  // Check existing
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (existing) return err(res, 409, 'An account with this email already exists.')

  const password_hash = await bcrypt.hash(password, 12)

  const { data: user, error } = await supabase
    .from('users')
    .insert({ name: name.trim(), email: email.toLowerCase().trim(), password_hash })
    .select('id, name, email, avatar_url, two_fa_enabled, created_at')
    .single()

  if (error) return err(res, 500, error.message)

  const token = signToken(user.id)
  return res.status(201).json({ token, user })
}

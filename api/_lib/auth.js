// api/_lib/auth.js
import jwt from 'jsonwebtoken'
import { supabase } from './supabase.js'

export async function requireAuth(req) {
  const header = req.headers['authorization'] || ''
  if (!header.startsWith('Bearer ')) {
    throw { status: 401, message: 'No token provided.' }
  }
  const token = header.split(' ')[1]
  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch (e) {
    throw { status: 401, message: e.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.' }
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, two_fa_enabled')
    .eq('id', decoded.userId)
    .single()

  if (error || !user) throw { status: 401, message: 'User not found.' }
  return user
}

export function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// Standardised error response
export function err(res, status, message) {
  return res.status(status).json({ error: message })
}

// CORS preflight helper — call at top of every handler
export function handleCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true   // caller should return immediately
  }
  return false
}

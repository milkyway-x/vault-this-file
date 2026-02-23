// api/auth/me.js
import { requireAuth, handleCors, err } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return err(res, 405, 'Method not allowed')
  try {
    const user = await requireAuth(req)
    return res.json({ user })
  } catch (e) {
    return err(res, e.status || 401, e.message)
  }
}

// api/vaults/stats.js
import { supabase } from '../_lib/supabase.js'
import { requireAuth, handleCors, err } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return err(res, 405, 'Method not allowed')

  let user
  try { user = await requireAuth(req) } catch (e) { return err(res, e.status, e.message) }

  const { data: vaults } = await supabase
    .from('vaults')
    .select('id, download_count')
    .eq('owner_id', user.id)

  const vaultIds = (vaults || []).map(v => v.id)
  const total_vaults = vaultIds.length
  const total_downloads = (vaults || []).reduce((acc, v) => acc + (v.download_count || 0), 0)

  let total_files = 0
  let total_size = 0

  if (vaultIds.length > 0) {
    const { data: files } = await supabase
      .from('files')
      .select('size_bytes')
      .in('vault_id', vaultIds)

    total_files = files?.length ?? 0
    total_size  = files?.reduce((acc, f) => acc + (f.size_bytes || 0), 0) ?? 0
  }

  return res.json({ stats: { total_vaults, total_files, total_size, total_downloads } })
}

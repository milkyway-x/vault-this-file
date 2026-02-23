import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

// ── Supabase client (frontend) — used for direct-to-storage uploads ──
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ── Axios API client → Vercel serverless functions ──────────────────
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vtf_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/share')) {
      localStorage.removeItem('vtf_token')
      localStorage.removeItem('vtf_user')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ─────────────────────────────────────────────────────────────
export const authApi = {
  register:  (data) => api.post('/auth/register', data),
  login:     (data) => api.post('/auth/login', data),
  me:        ()     => api.get('/auth/me'),
  setup2FA:  ()     => api.post('/auth/2fa?action=setup'),
  verify2FA: (token) => api.post('/auth/2fa?action=verify', { token }),
  disable2FA:(password) => api.post('/auth/2fa?action=disable', { password }),
}

// ── Vaults ───────────────────────────────────────────────────────────
export const vaultApi = {
  list:   ()          => api.get('/vaults'),
  stats:  ()          => api.get('/vaults/stats'),
  get:    (id)        => api.get(`/vaults/${id}`),
  create: (data)      => api.post('/vaults', data),
  update: (id, data)  => api.patch(`/vaults/${id}`, data),
  delete: (id)        => api.delete(`/vaults/${id}`),
}

// ── Files — direct-to-Supabase-Storage upload flow ───────────────────
export const fileApi = {
  /**
   * Full upload flow:
   * 1. Ask API for signed upload URLs
   * 2. Upload each file directly to Supabase Storage (bypasses Vercel 4.5MB limit)
   * 3. Confirm uploads with API
   */
  upload: async (vaultId, files, onProgress) => {
    // Step 1: get signed upload URLs
    const metadata = files.map(f => ({ name: f.name, size: f.size, mimeType: f.type }))
    const { data } = await api.post(`/files/upload/${vaultId}`, { files: metadata })
    const uploads = data.uploads

    // Step 2: upload each file directly to Supabase Storage
    const fileIds = []
    let done = 0
    for (const [i, upload] of uploads.entries()) {
      const file = files[i]
      const { error } = await supabase.storage
        .from('vault-files')
        .uploadToSignedUrl(upload.storagePath, upload.token, file, {
          contentType: file.type || 'application/octet-stream',
        })
      if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`)
      fileIds.push(upload.fileId)
      done++
      onProgress?.(Math.round((done / uploads.length) * 100))
    }

    // Step 3: confirm
    const confirmed = await api.post('/files/confirm', { fileIds })
    return confirmed.data
  },

  getDownloadUrl: (fileId) => api.get(`/files/download/${fileId}`),
  delete:         (fileId) => api.delete(`/files/${fileId}`),
}

// ── Share (public, no auth) ───────────────────────────────────────────
export const shareApi = {
  getVault: (code)             => api.get(`/share/${code}`),
  unlock:   (code, password)   => api.post(`/share/${code}`, { password }),
  getQR:    (code)             => api.get(`/share/${code}?action=qr`),
  download: (code, fileId, password) =>
    api.post(`/share/${code}`, { fileId, password }),
}

// ── Profile ───────────────────────────────────────────────────────────
export const profileApi = {
  get:            ()     => api.get('/profile'),
  update:         (data) => api.patch('/profile', data),
  updateAvatar:   (avatarUrl) => api.patch('/profile', { avatarUrl }),
  changePassword: (data) => api.patch('/profile', data),
  delete:         (password) => api.delete('/profile', { data: { password } }),
}

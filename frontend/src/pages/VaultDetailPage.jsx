import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { vaultApi, fileApi } from '../api'
import UploadModal from '../components/Modals/UploadModal'
import ShareModal from '../components/Modals/ShareModal'
import styles from './VaultDetailPage.module.css'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024, sizes = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getExt(name) {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop().toUpperCase().slice(0, 5) : 'FILE'
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function VaultDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vault, setVault] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    vaultApi.get(id)
      .then(({ data }) => { setVault(data.vault); setFiles(data.files) })
      .catch(() => { toast.error('Vault not found'); navigate('/vaults') })
      .finally(() => setLoading(false))
  }, [id])

  const handleDownload = async (file) => {
    setDownloading(file.id)
    try {
      const { data } = await fileApi.getDownloadUrl(file.id)
      const a = document.createElement('a')
      a.href = data.downloadUrl
      a.download = data.fileName
      a.target = '_blank'
      a.click()
      toast.success(`Downloading ${data.fileName}`)
      // Update local count
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, download_count: f.download_count + 1 } : f))
    } catch (err) {
      toast.error('Download failed')
    } finally {
      setDownloading(null)
    }
  }

  const handleDeleteFile = async (file) => {
    if (!window.confirm(`Delete "${file.original_name || file.name}"?`)) return
    try {
      await fileApi.delete(file.id)
      setFiles(prev => prev.filter(f => f.id !== file.id))
      toast.success('File deleted')
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh' }}>
      <span className="spinner spinner-lg" />
    </div>
  )

  if (!vault) return null
  const isPrivate = vault.visibility === 'private'

  return (
    <div>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <button onClick={() => navigate('/vaults')}>My Vaults</button>
        <span>/</span>
        <span className={styles.breadcrumbCurrent}>{vault.name}</span>
      </div>

      {/* Vault Header */}
      <div className={styles.vaultHeader}>
        <div className={`${styles.vaultHeaderIcon} ${isPrivate ? styles.headerPrivate : styles.headerPublic}`}>
          {isPrivate ? '🔒' : '🔓'}
        </div>
        <div className={styles.vaultHeaderInfo}>
          <h2>{vault.name}</h2>
          {vault.description && <p>{vault.description}</p>}
          <div className={styles.vaultMeta}>
            <span className={`badge ${isPrivate ? 'badge-private' : 'badge-public'}`}>
              {isPrivate ? '🔒 Private' : '🔓 Public'}
            </span>
            <span className="badge badge-accent">📁 {files.length} files</span>
            <span className="badge badge-accent">⬇️ {vault.download_count} downloads</span>
          </div>
        </div>
        <div className={styles.vaultHeaderActions}>
          <button className="btn btn-outline btn-sm" onClick={() => setShowShare(true)}>📤 Share</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(true)}>+ Upload</button>
        </div>
      </div>

      {/* Files */}
      <div className={styles.filesSection}>
        <h3>Files</h3>
        {files.length === 0 ? (
          <div className="empty-state">
            <span className="icon">📁</span>
            <h3>No Files Yet</h3>
            <p>Upload your first file to this vault.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowUpload(true)}>Upload Files</button>
          </div>
        ) : (
          <div className={styles.fileList}>
            {files.map(file => (
              <div key={file.id} className={styles.fileItem}>
                <div className={styles.fileExt}>{getExt(file.original_name || file.name)}</div>
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{file.original_name || file.name}</div>
                  <div className={styles.fileMeta}>
                    {formatBytes(file.size_bytes)} · {formatDate(file.created_at)} · {file.download_count} downloads
                  </div>
                </div>
                <div className={styles.fileActions}>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleDownload(file)}
                    disabled={downloading === file.id}
                  >
                    {downloading === file.id ? <span className="spinner" /> : '⬇️'} Download
                  </button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteFile(file)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          vaultId={vault.id}
          onClose={() => setShowUpload(false)}
          onUploaded={(newFiles) => setFiles(prev => [...newFiles, ...prev])}
        />
      )}
      {showShare && <ShareModal vault={vault} onClose={() => setShowShare(false)} />}
    </div>
  )
}

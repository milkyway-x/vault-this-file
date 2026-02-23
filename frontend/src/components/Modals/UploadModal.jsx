import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { fileApi } from '../../api'
import styles from './Modal.module.css'
import uploadStyles from './UploadModal.module.css'

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
function getExt(name) {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop().toUpperCase().slice(0, 5) : 'FILE'
}

export default function UploadModal({ vaultId, onClose, onUploaded }) {
  const [files, setFiles]       = useState([])
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [currentFile, setCurrentFile] = useState('')

  const onDrop = useCallback((accepted) => setFiles(prev => [...prev, ...accepted]), [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50 MB (Supabase free: 50 MB per file)
    onDropRejected: (rej) => toast.error(`File too large (max 50 MB): ${rej[0]?.file?.name}`),
  })

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i))

  const handleUpload = async () => {
    if (!files.length) { toast.error('Select some files first'); return }
    setUploading(true)
    try {
      const data = await fileApi.upload(vaultId, files, (pct) => {
        setProgress(pct)
        setCurrentFile(files[Math.floor((pct / 100) * files.length)]?.name || '')
      })
      toast.success(`${data.files.length} file(s) uploaded! ✅`)
      onUploaded?.(data.files)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth: 520 }}>
        <div className={styles.header}>
          <div>
            <h3>Upload Files</h3>
            <p className={styles.headerSub}>Max 50 MB per file · Uploads directly to Supabase Storage</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} disabled={uploading}>✕</button>
        </div>
        <div className={styles.body}>
          <div {...getRootProps()} className={`${uploadStyles.dropzone} ${isDragActive ? uploadStyles.dropzoneActive : ''}`}>
            <input {...getInputProps()} />
            <span className={uploadStyles.dropIcon}>📁</span>
            <div className={uploadStyles.dropText}>
              {isDragActive ? "Drop it like it's hot 🔥" : 'Drop files here or click to browse'}
            </div>
            <div className={uploadStyles.dropSub}>Drag folders too — all file types accepted</div>
          </div>

          {files.length > 0 && (
            <div className={uploadStyles.fileList}>
              <div className={uploadStyles.fileListHeader}>
                <span>{files.length} file{files.length > 1 ? 's' : ''} selected ({formatBytes(files.reduce((a,f) => a+f.size, 0))})</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setFiles([])} disabled={uploading}>Clear all</button>
              </div>
              {files.map((file, i) => (
                <div key={i} className={uploadStyles.fileItem}>
                  <div className={uploadStyles.fileExt}>{getExt(file.name)}</div>
                  <div className={uploadStyles.fileInfo}>
                    <div className={uploadStyles.fileName}>{file.name}</div>
                    <div className={uploadStyles.fileMeta}>{formatBytes(file.size)}</div>
                  </div>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeFile(i)} disabled={uploading}>✕</button>
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <div className={uploadStyles.progressSection}>
              <div className={uploadStyles.progressLabel}>
                Uploading to Supabase... {progress}%
                {currentFile && <span style={{ color:'var(--text3)', marginLeft:8 }}>({currentFile})</span>}
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            </div>
          )}
        </div>
        <div className={styles.footer}>
          <button className="btn btn-outline" onClick={onClose} disabled={uploading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || !files.length}>
            {uploading ? <><span className="spinner" /> Uploading {progress}%</> : `Upload ${files.length ? files.length + ' File(s)' : 'Files'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

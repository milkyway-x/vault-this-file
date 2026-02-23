import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { shareApi } from '../api'
import styles from './SharePage.module.css'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024, sizes = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
function getExt(name) {
  const parts = (name || '').split('.')
  return parts.length > 1 ? parts.pop().toUpperCase().slice(0, 5) : 'FILE'
}

export default function SharePage() {
  const { shareCode } = useParams()
  const [vault, setVault] = useState(null)
  const [files, setFiles] = useState([])
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [password, setPassword] = useState('')
  const [pinVal, setPinVal] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [pinError, setPinError] = useState('')
  const [downloading, setDownloading] = useState(null)
  const [showPwd, setShowPwd] = useState(false)

  useEffect(() => {
    shareApi.getVault(shareCode)
      .then(({ data }) => {
        setVault(data.vault)
        setFiles(data.files || [])
        setLocked(data.locked)
      })
      .catch(() => setError('Vault not found or link is invalid.'))
      .finally(() => setLoading(false))
  }, [shareCode])

  const handleUnlock = async (pwd = null) => {
    const pass = pwd || password
    if (!pass) { setPinError('Enter a password'); return }
    setUnlocking(true)
    setPinError('')
    try {
      const { data } = await shareApi.unlock(shareCode, pass)
      setFiles(data.files)
      setLocked(false)
      toast.success('Vault unlocked! 🔓')
    } catch (err) {
      setPinError(err.response?.data?.error || 'Incorrect password')
      setPinVal('')
    } finally {
      setUnlocking(false)
    }
  }

  const pinPress = (digit) => {
    if (pinVal.length >= 4) return
    const next = pinVal + digit
    setPinVal(next)
    if (next.length === 4) setTimeout(() => handleUnlock(next), 300)
  }

  const pinBack = () => setPinVal(v => v.slice(0, -1))

  const handleDownload = async (file) => {
    setDownloading(file.id)
    try {
      const { data } = await shareApi.download(shareCode, file.id, locked ? password : undefined)
      const a = document.createElement('a')
      a.href = data.downloadUrl
      a.download = data.fileName
      a.target = '_blank'
      a.click()
      toast.success(`Downloading ${data.fileName} ⬇️`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Download failed')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh' }}>
      <span className="spinner spinner-lg" />
    </div>
  )

  if (error) return (
    <div className={styles.page}>
      <div className="empty-state">
        <span className="icon">🔗</span>
        <h3>Vault Not Found</h3>
        <p>{error}</p>
      </div>
    </div>
  )

  const isPrivate = vault?.visibility === 'private'

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.vaultInfo}>
          <span className={styles.vaultEmoji}>{isPrivate ? '🔒' : '🔓'}</span>
          <h2 className={styles.vaultName}>{vault?.name}</h2>
          {vault?.description && <p className={styles.vaultDesc}>{vault.description}</p>}
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:8, flexWrap:'wrap' }}>
            <span className={`badge ${isPrivate ? 'badge-private' : 'badge-public'}`}>
              {isPrivate ? '🔒 Private' : '🔓 Public'}
            </span>
            {!locked && <span className="badge badge-accent">📁 {files.length} files</span>}
          </div>
        </div>

        {locked ? (
          <div className={styles.lockBox}>
            <div className={styles.lockTitle}>This vault is password protected</div>
            <div className={styles.lockSub}>Enter the password to access and download files</div>

            {/* PIN Dots */}
            <div className={styles.pinDots}>
              {[0,1,2,3].map(i => (
                <div key={i} className={`${styles.pinDot} ${i < pinVal.length ? styles.pinDotFilled : ''}`} />
              ))}
            </div>

            {pinError && <div className={styles.pinError}>{pinError}</div>}

            {/* PIN Keypad */}
            <div className={styles.pinKeypad}>
              {['1','2','3','4','5','6','7','8','9'].map(d => (
                <button key={d} className={styles.pinKey} onClick={() => pinPress(d)}>{d}</button>
              ))}
              <button className={styles.pinKey} style={{ visibility:'hidden' }} />
              <button className={styles.pinKey} onClick={() => pinPress('0')}>0</button>
              <button className={styles.pinKey} onClick={pinBack}>⌫</button>
            </div>

            <div className={styles.dividerRow}><span>or enter text password</span></div>

            <div style={{ display:'flex', gap:8, width:'100%', maxWidth:320 }}>
              <div style={{ position:'relative', flex:1 }}>
                <input
                  className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter vault password..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                  style={{ paddingRight: 40 }}
                />
                <button style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16 }} onClick={() => setShowPwd(v=>!v)}>
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              <button className="btn btn-primary" onClick={() => handleUnlock()} disabled={unlocking}>
                {unlocking ? <span className="spinner" /> : '🔓 Unlock'}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.fileSection}>
            <div className={styles.fileSectionHeader}>
              <span>📁 Files in this vault</span>
              <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
            </div>
            {files.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <span className="icon" style={{ fontSize: 36 }}>📭</span>
                <h3 style={{ fontSize: 16 }}>Empty Vault</h3>
                <p>No files have been uploaded to this vault yet.</p>
              </div>
            ) : (
              <div className={styles.fileList}>
                {files.map(file => (
                  <div key={file.id} className={styles.fileItem}>
                    <div className={styles.fileExt}>{getExt(file.name)}</div>
                    <div className={styles.fileInfo}>
                      <div className={styles.fileName}>{file.name}</div>
                      <div className={styles.fileMeta}>{formatBytes(file.size_bytes)}</div>
                    </div>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleDownload(file)}
                      disabled={downloading === file.id}
                    >
                      {downloading === file.id ? <span className="spinner" /> : '⬇️'} Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.branding}>
          <a href="/">Powered by <strong>Vault This File</strong> 🔐</a>
        </div>
      </div>
    </div>
  )
}

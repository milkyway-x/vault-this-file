import { useState } from 'react'
import toast from 'react-hot-toast'
import { vaultApi } from '../../api'
import styles from './Modal.module.css'

export default function CreateVaultModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Vault name is required'); return }
    if (visibility === 'private' && !password) { toast.error('Private vaults need a password'); return }
    setLoading(true)
    try {
      const { data } = await vaultApi.create({ name, description: desc, visibility, password })
      toast.success(`"${name}" vault created! 🔐`)
      onCreated?.(data.vault)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create vault')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth: 500 }}>
        <div className={styles.header}>
          <div>
            <h3>Create New Vault</h3>
            <p className={styles.headerSub}>Your new digital lockbox awaits</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Vault Name</label>
              <input className="form-input" type="text" placeholder="My Awesome Vault" value={name} onChange={e => setName(e.target.value)} required maxLength={200} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Description (optional)</label>
              <textarea className="form-input form-textarea" placeholder="What's in this vault?" value={desc} onChange={e => setDesc(e.target.value)} maxLength={500} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Visibility</label>
              <div className={styles.toggleGroup}>
                <button type="button" className={`${styles.toggleOption} ${visibility === 'public' ? styles.toggleActive : ''}`} onClick={() => setVisibility('public')}>🔓 Public</button>
                <button type="button" className={`${styles.toggleOption} ${visibility === 'private' ? styles.toggleActive : ''}`} onClick={() => setVisibility('private')}>🔒 Private</button>
              </div>
            </div>
            {visibility === 'private' && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Vault Password / PIN</label>
                <div className={styles.inputWrapper}>
                  <input className="form-input" type={showPwd ? 'text' : 'password'} placeholder="Enter a password or numeric PIN (e.g. 1234)" value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" className={styles.pwdToggle} onClick={() => setShowPwd(v => !v)}>{showPwd ? '🙈' : '👁️'}</button>
                </div>
                <div className={styles.hint}>Anyone with the share link will need this password to download files.</div>
              </div>
            )}
          </div>
          <div className={styles.footer}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Creating...</> : 'Create Vault 🔐'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

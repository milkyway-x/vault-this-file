import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { shareApi } from '../../api'
import styles from './Modal.module.css'
import shareStyles from './ShareModal.module.css'

export default function ShareModal({ vault, onClose }) {
  const [qrData, setQrData] = useState(null)
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
  const shareUrl = `${appUrl}/share/${vault.share_code}`

  useEffect(() => {
    shareApi.getQR(vault.share_code)
      .then(({ data }) => setQrData(data))
      .catch(() => {}) // QR still renders via qrcode.react as fallback
  }, [vault.share_code])

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied! 📋')
  }

  const downloadQR = () => {
    if (!qrData?.qrCode) { toast.error('QR not ready yet'); return }
    const a = document.createElement('a')
    a.href = qrData.qrCode
    a.download = `${vault.name}-qr.png`
    a.click()
    toast.success('QR Code downloaded! 📱')
  }

  const isPrivate = vault.visibility === 'private'

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth: 480 }}>
        <div className={styles.header}>
          <div>
            <h3>Share Vault</h3>
            <p className={styles.headerSub}>{vault.name}</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>
          <div className={shareStyles.section}>
            <div className={shareStyles.sectionLabel}>Share Link</div>
            <div className={shareStyles.linkRow}>
              <input className={shareStyles.linkInput} readOnly value={shareUrl} />
              <button className="btn btn-outline btn-sm" onClick={copyLink}>📋 Copy</button>
            </div>
          </div>

          <div className={shareStyles.qrSection}>
            <div className={shareStyles.sectionLabel}>QR Code</div>
            <div className={shareStyles.qrWrapper}>
              <QRCodeSVG
                value={shareUrl}
                size={180}
                bgColor="#ffffff"
                fgColor="#0a0a0f"
                level="M"
                includeMargin
              />
            </div>
            <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={downloadQR}>⬇️ Download QR</button>
          </div>

          <div className={shareStyles.notice}>
            <span>{isPrivate ? '🔒' : '🔓'}</span>
            <span>
              {isPrivate
                ? 'Anyone with this link will need the vault password to download files.'
                : 'Anyone with this link can download files — no account required.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

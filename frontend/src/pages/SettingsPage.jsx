import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { profileApi } from '../api'
import styles from './SettingsPage.module.css'

function Toggle({ checked, onChange, label, sub }) {
  return (
    <div className={styles.switchRow}>
      <div>
        <div className={styles.switchLabel}>{label}</div>
        {sub && <div className={styles.switchSub}>{sub}</div>}
      </div>
      <label className={styles.switch}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className={styles.slider} />
      </label>
    </div>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [emailDownload, setEmailDownload] = useState(true)
  const [emailSecurity, setEmailSecurity] = useState(true)
  const [defaultPrivate, setDefaultPrivate] = useState(false)
  const [autoQR, setAutoQR] = useState(true)

  const handleDeleteAccount = async () => {
    const pwd = window.prompt('Enter your password to permanently delete your account:')
    if (!pwd) return
    if (!window.confirm('Are you ABSOLUTELY sure? This deletes everything permanently.')) return
    try {
      await profileApi.delete(pwd)
      toast.success('Account deleted. Goodbye 👋')
      logout()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed')
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <h2>Settings</h2>
        <p className={styles.sub}>App preferences and defaults</p>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionCard}>
          <h4>Default Vault Settings</h4>
          <p className={styles.cardSub}>Applied when creating new vaults</p>
          <Toggle checked={defaultPrivate} onChange={setDefaultPrivate} label="Default to Private" sub="New vaults will require a password by default" />
          <Toggle checked={autoQR} onChange={setAutoQR} label="Auto-generate QR Code" sub="Automatically display QR codes on vault share page" />
        </div>

        <div className={styles.sectionCard}>
          <h4>Notifications</h4>
          <p className={styles.cardSub}>Choose what you want to be notified about</p>
          <Toggle checked={emailDownload} onChange={setEmailDownload} label="Download Notifications" sub="Get emailed when someone downloads from your vault" />
          <Toggle checked={emailSecurity} onChange={setEmailSecurity} label="Security Alerts" sub="Failed login attempts and new sign-in locations" />
        </div>

        <div className={styles.sectionCard}>
          <h4>Appearance</h4>
          <p className={styles.cardSub}>UI preferences</p>
          <div className={styles.switchRow}>
            <div>
              <div className={styles.switchLabel}>Theme</div>
              <div className={styles.switchSub}>Dark mode is the only mode. We're not animals.</div>
            </div>
            <span className="badge badge-accent">🌙 Dark</span>
          </div>
        </div>

        <div className={styles.dangerCard}>
          <h4 style={{ color: 'var(--danger)' }}>Danger Zone</h4>
          <p className={styles.cardSub}>Irreversible actions. Think twice (at least).</p>
          <div className={styles.dangerActions}>
            <button className="btn btn-danger" onClick={handleDeleteAccount}>
              💀 Delete Account
            </button>
          </div>
          <p style={{ fontSize:12, color:'var(--text3)', marginTop:12, lineHeight:1.6 }}>
            Deleting your account will permanently remove all vaults, files, and data.
            Files stored in Cloudflare R2 will also be deleted. This cannot be undone.
          </p>
        </div>
      </div>
    </div>
  )
}

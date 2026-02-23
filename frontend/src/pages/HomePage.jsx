import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/Modals/AuthModal'
import styles from './HomePage.module.css'

const FEATURES = [
  { icon: '🔓', title: 'Public Vaults', desc: 'Share files with anyone. No account, no friction. Just paste the link.' },
  { icon: '🔒', title: 'Private Vaults', desc: 'Set a PIN or password. Only people with the secret can download.' },
  { icon: '📱', title: 'QR Code Sharing', desc: 'Every vault gets a QR code. Point and shoot. It\'s not magic, it\'s engineering.' },
  { icon: '⚡', title: 'Instant Downloads', desc: 'No loading screens, no "preparing download" lies. Files, immediately.' },
  { icon: '🗂️', title: 'Folder Uploads', desc: 'Drag a whole folder in. No zipping like some kind of caveman.' },
  { icon: '🛡️', title: 'Secure by Design', desc: 'Upload requires an account. Download doesn\'t. 2FA available. We tried.' },
]

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [authModal, setAuthModal] = useState(false)
  const [authTab, setAuthTab] = useState('register')

  const openAuth = (tab) => { setAuthTab(tab); setAuthModal(true) }

  return (
    <div className={styles.hero}>
      <div className={styles.badge}>
        <span className={styles.dot} />
        Now in Open Beta — and yes, it actually works
      </div>

      <h1 className={styles.heading}>
        Your Files,{' '}
        <span className={styles.gradient}>Vaulted.</span>
      </h1>

      <p className={styles.sub}>No account needed to download. No drama. Just links.</p>

      <p className={styles.desc}>
        Create public or private vaults. Set a PIN. Share a link or QR code.
        Anyone can download — no sign-up required. Finally, file sharing that doesn't hate you.
      </p>

      <div className={styles.cta}>
        {user ? (
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
            🚀 Go to Dashboard
          </button>
        ) : (
          <>
            <button className="btn btn-primary btn-lg" onClick={() => openAuth('register')}>
              🔐 Create Your First Vault
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => openAuth('login')}>
              Sign In
            </button>
          </>
        )}
      </div>

      <div className={styles.features}>
        {FEATURES.map((f, i) => (
          <div key={f.title} className={styles.card} style={{ animationDelay: `${i * 0.07}s` }}>
            <span className={styles.cardIcon}>{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      {authModal && <AuthModal defaultTab={authTab} onClose={() => setAuthModal(false)} />}
    </div>
  )
}

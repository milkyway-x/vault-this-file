import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import styles from './Modal.module.css'

export default function AuthModal({ defaultTab = 'login', onClose }) {
  const [tab, setTab] = useState(defaultTab)
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPwd, setLoginPwd] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [needs2FA, setNeeds2FA] = useState(false)

  // Register state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPwd, setRegPwd] = useState('')
  const [regPwd2, setRegPwd2] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login({ email: loginEmail, password: loginPwd, totpCode: needs2FA ? totpCode : undefined })
      toast.success('Welcome back! 👋')
      onClose()
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed'
      if (err.response?.status === 206) {
        setNeeds2FA(true)
        toast('Enter your 2FA code', { icon: '🔐' })
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (regPwd !== regPwd2) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await register({ name: regName, email: regEmail, password: regPwd })
      toast.success('Account created! Welcome to Vault This File 🎉')
      onClose()
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth: 420 }}>
        <div className={styles.header}>
          <div>
            <h3>{tab === 'login' ? 'Welcome back' : 'Create Account'}</h3>
            <p className={styles.headerSub}>
              {tab === 'login' ? 'Sign in to manage your vaults' : 'Start vaulting your files today'}
            </p>
          </div>
          <button className={`btn btn-ghost btn-icon ${styles.closeBtn}`} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.authTabs}>
            <button className={`${styles.authTab} ${tab === 'login' ? styles.authTabActive : ''}`} onClick={() => setTab('login')}>Sign In</button>
            <button className={`${styles.authTab} ${tab === 'register' ? styles.authTabActive : ''}`} onClick={() => setTab('register')}>Create Account</button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input className="form-input" type="email" placeholder="email@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrapper}>
                  <input className="form-input" type={showPwd ? 'text' : 'password'} placeholder="Your password" value={loginPwd} onChange={e => setLoginPwd(e.target.value)} required />
                  <button type="button" className={styles.pwdToggle} onClick={() => setShowPwd(v => !v)}>{showPwd ? '🙈' : '👁️'}</button>
                </div>
              </div>
              {needs2FA && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>2FA Code</label>
                  <input className="form-input" type="text" placeholder="6-digit code" maxLength={6} value={totpCode} onChange={e => setTotpCode(e.target.value)} />
                </div>
              )}
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Name</label>
                <input className="form-input" type="text" placeholder="Your name" value={regName} onChange={e => setRegName(e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input className="form-input" type="email" placeholder="email@example.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrapper}>
                  <input className="form-input" type={showPwd ? 'text' : 'password'} placeholder="At least 6 characters" value={regPwd} onChange={e => setRegPwd(e.target.value)} required />
                  <button type="button" className={styles.pwdToggle} onClick={() => setShowPwd(v => !v)}>{showPwd ? '🙈' : '👁️'}</button>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm Password</label>
                <input className="form-input" type="password" placeholder="Repeat password" value={regPwd2} onChange={e => setRegPwd2(e.target.value)} required />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <><span className="spinner" /> Creating...</> : '🚀 Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

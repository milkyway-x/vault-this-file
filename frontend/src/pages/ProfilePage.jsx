import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../context/AuthContext'
import { profileApi, authApi } from '../api'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const [tab, setTab] = useState('info')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Info form
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  // Password form
  const [curPwd, setCurPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confPwd, setConfPwd] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  // 2FA
  const [twoFAData, setTwoFAData] = useState(null)
  const [otpInput, setOtpInput] = useState('')
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [disablePwd, setDisablePwd] = useState('')

  useEffect(() => {
    profileApi.get()
      .then(({ data }) => {
        setProfile(data.user)
        setName(data.user.name || '')
        setPhone(data.user.phone || '')
        setBio(data.user.bio || '')
        setTwoFAEnabled(data.user.two_fa_enabled)
      })
      .finally(() => setLoading(false))
  }, [])

  const saveInfo = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await profileApi.update({ name, phone, bio })
      setProfile(data.user)
      updateUser({ name: data.user.name, avatar_url: data.user.avatar_url })
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const url = ev.target.result
      try {
        await profileApi.updateAvatar(url)
        setProfile(prev => ({ ...prev, avatar_url: url }))
        updateUser({ avatar_url: url })
        toast.success('Avatar updated!')
      } catch { toast.error('Avatar update failed') }
    }
    reader.readAsDataURL(file)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (newPwd !== confPwd) { toast.error('New passwords do not match'); return }
    setPwdLoading(true)
    try {
      await profileApi.changePassword({ currentPassword: curPwd, newPassword: newPwd })
      toast.success('Password updated! 🔑')
      setCurPwd(''); setNewPwd(''); setConfPwd('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password change failed')
    } finally {
      setPwdLoading(false)
    }
  }

  const setup2FA = async () => {
    setTwoFALoading(true)
    try {
      const { data } = await authApi.setup2FA()
      setTwoFAData(data)
    } catch { toast.error('2FA setup failed') }
    finally { setTwoFALoading(false) }
  }

  const verify2FA = async () => {
    if (otpInput.length !== 6) { toast.error('Enter all 6 digits'); return }
    setTwoFALoading(true)
    try {
      await authApi.verify2FA(otpInput)
      setTwoFAEnabled(true)
      setTwoFAData(null)
      setOtpInput('')
      updateUser({ two_fa_enabled: true })
      toast.success('2FA enabled! You\'re extra secure now 🛡️')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code')
    } finally {
      setTwoFALoading(false)
    }
  }

  const disable2FA = async () => {
    if (!disablePwd) { toast.error('Enter your password to disable 2FA'); return }
    setTwoFALoading(true)
    try {
      await authApi.disable2FA(disablePwd)
      setTwoFAEnabled(false)
      setDisablePwd('')
      updateUser({ two_fa_enabled: false })
      toast.success('2FA disabled')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to disable 2FA')
    } finally {
      setTwoFALoading(false)
    }
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><span className="spinner spinner-lg" /></div>

  return (
    <div>
      <div className={styles.header}>
        <h2>Profile</h2>
        <p className={styles.sub}>Manage your account information and security</p>
      </div>

      <div className={styles.layout}>
        {/* Profile Card */}
        <div className={styles.profileCard}>
          <label className={styles.avatarWrapper} title="Click to change photo">
            <input type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarChange} />
            <div className={styles.avatar}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt={profile.name} />
                : <span>{(profile?.name || 'V')[0].toUpperCase()}</span>
              }
              <div className={styles.avatarOverlay}>📷</div>
            </div>
          </label>
          <div className={styles.profileName}>{profile?.name}</div>
          <div className={styles.profileEmail}>{profile?.email}</div>
          {twoFAEnabled && <span className="badge badge-accent" style={{ marginTop: 8 }}>🛡️ 2FA Active</span>}
        </div>

        {/* Tabs */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.tabs}>
            {['info','security','2fa'].map(t => (
              <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
                {t === 'info' ? '👤 Info' : t === 'security' ? '🔑 Security' : '🛡️ 2FA'}
              </button>
            ))}
          </div>

          {tab === 'info' && (
            <div className={styles.card}>
              <h4>Personal Information</h4>
              <p className={styles.cardSub}>Update your personal details</p>
              <form onSubmit={saveInfo}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Display Name</label>
                  <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input className="form-input" type="email" value={profile?.email || ''} disabled style={{ opacity:0.6, cursor:'not-allowed' }} />
                  <p style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>Email cannot be changed</p>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone Number</label>
                  <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Bio</label>
                  <textarea className="form-input form-textarea" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself (optional)" />
                </div>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving...</> : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {tab === 'security' && (
            <div className={styles.card}>
              <h4>Change Password</h4>
              <p className={styles.cardSub}>Keep your account secure</p>
              <form onSubmit={handlePasswordChange}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Current Password</label>
                  <input className="form-input" type="password" value={curPwd} onChange={e => setCurPwd(e.target.value)} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>New Password</label>
                  <input className="form-input" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={6} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Confirm New Password</label>
                  <input className="form-input" type="password" value={confPwd} onChange={e => setConfPwd(e.target.value)} required />
                </div>
                <button className="btn btn-primary" type="submit" disabled={pwdLoading}>
                  {pwdLoading ? <><span className="spinner" /> Updating...</> : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {tab === '2fa' && (
            <div className={styles.card}>
              <h4>Two-Factor Authentication</h4>
              <p className={styles.cardSub}>
                Status: <span className={`badge ${twoFAEnabled ? 'badge-public' : 'badge-neutral'}`}>
                  {twoFAEnabled ? '✓ Enabled' : 'Not Enabled'}
                </span>
              </p>

              {!twoFAEnabled && !twoFAData && (
                <button className="btn btn-primary" onClick={setup2FA} disabled={twoFALoading}>
                  {twoFALoading ? <><span className="spinner" /> Setting up...</> : '🔐 Enable 2FA'}
                </button>
              )}

              {twoFAData && (
                <div className={styles.twoFASetup}>
                  <div className={styles.twoFAStep}>
                    <div className={styles.stepNum}>1</div>
                    <p>Install <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app on your phone.</p>
                  </div>
                  <div className={styles.twoFAStep}>
                    <div className={styles.stepNum}>2</div>
                    <div>
                      <p style={{ marginBottom: 12 }}>Scan this QR code with your authenticator app:</p>
                      <div className={styles.qrWrapper}>
                        <QRCodeSVG value={twoFAData.otpauthUrl} size={160} bgColor="#fff" fgColor="#000" includeMargin />
                      </div>
                      <p style={{ fontSize:12, color:'var(--text3)', marginTop:8 }}>Or enter manually:</p>
                      <code style={{ fontSize:13, color:'var(--accent)', letterSpacing:3 }}>{twoFAData.secret}</code>
                    </div>
                  </div>
                  <div className={styles.twoFAStep}>
                    <div className={styles.stepNum}>3</div>
                    <div style={{ width: '100%' }}>
                      <p style={{ marginBottom:10 }}>Enter the 6-digit code from your app:</p>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        <input
                          className="form-input"
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          value={otpInput}
                          onChange={e => setOtpInput(e.target.value.replace(/\D/g,''))}
                          style={{ maxWidth:160, letterSpacing:6, fontSize:18, textAlign:'center' }}
                        />
                        <button className="btn btn-primary" onClick={verify2FA} disabled={twoFALoading || otpInput.length !== 6}>
                          {twoFALoading ? <span className="spinner" /> : 'Verify & Enable'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {twoFAEnabled && (
                <div className={styles.disableSection}>
                  <p style={{ fontSize:13, color:'var(--text3)', marginBottom:12 }}>
                    To disable 2FA, enter your account password:
                  </p>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <input className="form-input" type="password" placeholder="Your password" value={disablePwd} onChange={e => setDisablePwd(e.target.value)} style={{ maxWidth:240 }} />
                    <button className="btn btn-danger" onClick={disable2FA} disabled={twoFALoading}>
                      {twoFALoading ? <span className="spinner" /> : 'Disable 2FA'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

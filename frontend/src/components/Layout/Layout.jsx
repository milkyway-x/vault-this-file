import { useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../Modals/AuthModal'
import styles from './Layout.module.css'

const NAV_ITEMS = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/vaults', icon: '🗄️', label: 'My Vaults' },
  { path: '/profile', icon: '👤', label: 'Profile' },
  { path: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [authModal, setAuthModal] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const openAuth = (tab = 'login') => { setAuthTab(tab); setAuthModal(true) }

  const handleLogout = () => {
    logout()
    navigate('/')
    setUserMenuOpen(false)
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const showSidebar = user && location.pathname !== '/' && !location.pathname.startsWith('/share')

  return (
    <div className={styles.root}>
      {/* NAVBAR */}
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          {showSidebar && (
            <button className={`btn btn-ghost btn-icon hide-desktop ${styles.menuBtn}`} onClick={() => setSidebarOpen(v => !v)}>
              ☰
            </button>
          )}
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIcon}>🔐</div>
            <div>
              <div className={styles.logoText}>Vault This File</div>
              <div className={styles.logoSub}>totally not Google Drive</div>
            </div>
          </Link>
        </div>

        <div className={styles.navRight}>
          {!user ? (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => openAuth('login')}>Sign In</button>
              <button className="btn btn-primary btn-sm" onClick={() => openAuth('register')}>🚀 Get Started</button>
            </>
          ) : (
            <div className={styles.userMenu}>
              <button className="btn btn-ghost btn-sm hide-mobile" onClick={() => navigate('/dashboard')}>Dashboard</button>
              <div className={styles.avatarWrapper}>
                <button className={styles.avatar} onClick={() => setUserMenuOpen(v => !v)}>
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt={user.name} />
                    : <span>{(user.name || 'V')[0].toUpperCase()}</span>
                  }
                </button>
                {userMenuOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownUser}>
                      <div className={styles.dropdownName}>{user.name}</div>
                      <div className={styles.dropdownEmail}>{user.email}</div>
                    </div>
                    <div className={styles.dropdownDivider} />
                    {NAV_ITEMS.map(item => (
                      <button key={item.path} className={styles.dropdownItem} onClick={() => { navigate(item.path); setUserMenuOpen(false) }}>
                        <span>{item.icon}</span> {item.label}
                      </button>
                    ))}
                    <div className={styles.dropdownDivider} />
                    <button className={`${styles.dropdownItem} ${styles.dropdownDanger}`} onClick={handleLogout}>
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className={styles.body}>
        {/* SIDEBAR */}
        {showSidebar && (
          <>
            {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
              <div className={styles.sidebarNav}>
                <div className={styles.sidebarLabel}>Navigation</div>
                {NAV_ITEMS.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${styles.sidebarItem} ${isActive(item.path) ? styles.sidebarItemActive : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className={styles.sidebarIcon}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className={styles.sidebarBottom}>
                <div className={styles.sidebarLabel}>Storage</div>
                <div className={styles.storageInfo}>
                  <div className={styles.storageText}>
                    <span>Used</span>
                    <span className={styles.storageVal}>0 MB / 10 GB</span>
                  </div>
                  <div className="progress-bar" style={{ marginTop: 6 }}>
                    <div className="progress-fill" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}

        {/* PAGE CONTENT */}
        <main className={`${styles.main} ${showSidebar ? styles.mainWithSidebar : ''}`}>
          <Outlet />
        </main>
      </div>

      {authModal && <AuthModal defaultTab={authTab} onClose={() => setAuthModal(false)} />}
    </div>
  )
}

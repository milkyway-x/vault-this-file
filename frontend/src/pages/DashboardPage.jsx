import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { vaultApi } from '../api'
import CreateVaultModal from '../components/Modals/CreateVaultModal'
import VaultCard from '../components/Vault/VaultCard'
import styles from './DashboardPage.module.css'

function StatCard({ value, label, icon }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statIcon}>{icon}</span>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [vaults, setVaults] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    Promise.all([vaultApi.list(), vaultApi.stats()])
      .then(([vRes, sRes]) => {
        setVaults(vRes.data.vaults.slice(0, 6))
        setStats(sRes.data.stats)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleVaultCreated = (vault) => {
    setVaults(prev => [vault, ...prev])
    setStats(prev => prev ? { ...prev, total_vaults: prev.total_vaults + 1 } : prev)
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2>Dashboard</h2>
          <p className={styles.welcome}>Welcome back, <strong>{user?.name}</strong> 👋</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Vault</button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <StatCard icon="🗄️" value={loading ? '—' : stats?.total_vaults ?? 0} label="Total Vaults" />
        <StatCard icon="📁" value={loading ? '—' : stats?.total_files ?? 0} label="Files Stored" />
        <StatCard icon="⬇️" value={loading ? '—' : stats?.total_downloads ?? 0} label="Downloads" />
        <StatCard icon="💾" value={loading ? '—' : formatBytes(stats?.total_size)} label="Storage Used" />
      </div>

      {/* Recent Vaults */}
      <div className={styles.sectionHeader}>
        <h3>Recent Vaults</h3>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/vaults')}>View All</button>
      </div>

      {loading ? (
        <div className={styles.vaultGrid}>
          {[...Array(3)].map((_, i) => <div key={i} className={`skeleton ${styles.skeletonCard}`} />)}
        </div>
      ) : vaults.length === 0 ? (
        <div className="empty-state">
          <span className="icon">🗄️</span>
          <h3>No Vaults Yet</h3>
          <p>Create your first vault to start storing and sharing files.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
            Create First Vault
          </button>
        </div>
      ) : (
        <div className={styles.vaultGrid}>
          {vaults.map(vault => (
            <VaultCard key={vault.id} vault={vault} onClick={() => navigate(`/vaults/${vault.id}`)} />
          ))}
        </div>
      )}

      {showCreate && <CreateVaultModal onClose={() => setShowCreate(false)} onCreated={handleVaultCreated} />}
    </div>
  )
}

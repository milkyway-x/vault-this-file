import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { vaultApi } from '../api'
import VaultCard from '../components/Vault/VaultCard'
import CreateVaultModal from '../components/Modals/CreateVaultModal'
import ShareModal from '../components/Modals/ShareModal'
import styles from './VaultsPage.module.css'

export default function VaultsPage() {
  const navigate = useNavigate()
  const [vaults, setVaults] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [shareVault, setShareVault] = useState(null)

  useEffect(() => {
    vaultApi.list()
      .then(({ data }) => setVaults(data.vaults))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (vault) => {
    if (!window.confirm(`Delete "${vault.name}"? This is permanent.`)) return
    try {
      await vaultApi.delete(vault.id)
      setVaults(prev => prev.filter(v => v.id !== vault.id))
      toast.success('Vault deleted')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed')
    }
  }

  const filtered = vaults.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2>My Vaults</h2>
          <p className={styles.sub}>All your digital lockboxes ({vaults.length})</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
            <input placeholder="Search vaults..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Vault</button>
        </div>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="icon">{search ? '🔍' : '🗄️'}</span>
          <h3>{search ? `No results for "${search}"` : 'No Vaults Yet'}</h3>
          <p>{search ? 'Try a different search term.' : 'Create your first vault to get started.'}</p>
          {!search && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>Create First Vault</button>}
        </div>
      ) : (
        <div className={styles.grid}>
          <button className={styles.newCard} onClick={() => setShowCreate(true)}>
            <span className={styles.plus}>+</span>
            <span>New Vault</span>
          </button>
          {filtered.map(vault => (
            <VaultCard
              key={vault.id}
              vault={vault}
              onClick={() => navigate(`/vaults/${vault.id}`)}
              onShare={() => setShareVault(vault)}
              onDelete={() => handleDelete(vault)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateVaultModal
          onClose={() => setShowCreate(false)}
          onCreated={(v) => setVaults(prev => [v, ...prev])}
        />
      )}
      {shareVault && <ShareModal vault={shareVault} onClose={() => setShareVault(null)} />}
    </div>
  )
}

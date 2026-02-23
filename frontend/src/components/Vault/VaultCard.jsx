import styles from './VaultCard.module.css'

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function VaultCard({ vault, onClick, onShare, onDelete }) {
  const isPrivate = vault.visibility === 'private'

  const handleShare = (e) => { e.stopPropagation(); onShare?.(vault) }
  const handleDelete = (e) => { e.stopPropagation(); onDelete?.(vault) }

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.cardHeader}>
        <div className={`${styles.vaultIcon} ${isPrivate ? styles.private : styles.public}`}>
          {isPrivate ? '🔒' : '🔓'}
        </div>
        <div className={styles.vaultInfo}>
          <div className={styles.vaultName}>{vault.name}</div>
          <span className={`badge ${isPrivate ? 'badge-private' : 'badge-public'}`}>
            {isPrivate ? '🔒 Private' : '🔓 Public'}
          </span>
        </div>
      </div>

      {vault.description && (
        <p className={styles.desc}>{vault.description}</p>
      )}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statVal}>{vault.file_count ?? 0}</span>
          <span className={styles.statLab}>files</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal}>{vault.download_count ?? 0}</span>
          <span className={styles.statLab}>downloads</span>
        </div>
        {vault.total_size !== undefined && (
          <div className={styles.stat}>
            <span className={styles.statVal}>{formatBytes(vault.total_size)}</span>
            <span className={styles.statLab}>size</span>
          </div>
        )}
      </div>

      {(onShare || onDelete) && (
        <div className={styles.actions} onClick={e => e.stopPropagation()}>
          {onShare && (
            <button className="btn btn-outline btn-sm" onClick={handleShare}>📤 Share</button>
          )}
          {onDelete && (
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑️</button>
          )}
        </div>
      )}

      <div className={styles.date}>{formatDate(vault.created_at)}</div>
    </div>
  )
}

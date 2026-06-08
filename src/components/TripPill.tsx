import { useState, useRef, useEffect } from 'react'
import { useVoyage } from '../context/VoyageContext'
import styles from './TripPill.module.css'

function getDaysBadge(depart: string): number {
  const today = new Date()
  const departDate = new Date(depart)
  return Math.floor((today.getTime() - departDate.getTime()) / (1000 * 60 * 60 * 24))
}

export default function TripPill() {
  const { voyage, availableVoyages, activeFile, switchVoyage, locateUser } = useVoyage()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  if (!voyage) return null

  const days = getDaysBadge(voyage.depart)
  const badgeLabel = days >= 0 ? `J+${days}` : `J${days}`

  return (
    <div className={styles.pill}>
      <i className="ti ti-route" style={{ color: 'var(--gold)', fontSize: 15 }} />
      <div className={styles.info}>
        <span className={styles.title}>{voyage.nom}</span>
        <span className={styles.meta}>{voyage.duree_jours} jours · {voyage.pays}</span>
      </div>
      <span className={styles.badge}>{badgeLabel}</span>

      <div className={styles.menuWrap} ref={menuRef}>
        <button
          className={styles.menuBtn}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
        >
          <i className="ti ti-dots" />
        </button>

        {menuOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropSection}>Itinéraire</div>
            {availableVoyages.map(v => (
              <button
                key={v.file}
                className={`${styles.dropItem} ${v.file === activeFile ? styles.dropItemActive : ''}`}
                onClick={() => { switchVoyage(v.file); setMenuOpen(false) }}
              >
                <span>{v.emoji} {v.nom}</span>
                {v.file === activeFile && <i className="ti ti-check" style={{ fontSize: 12, color: 'var(--gold)' }} />}
              </button>
            ))}
              <div className={styles.dropDivider} />
              <button
                className={styles.dropItem}
                onClick={() => { locateUser(); setMenuOpen(false) }}
              >
                <span><i className="ti ti-current-location" style={{ marginRight: 6 }} />Me localiser</span>
              </button>
            </div>
        )}
      </div>
    </div>
  )
}

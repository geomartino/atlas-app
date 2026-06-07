import { useVoyage } from '../context/VoyageContext'
import styles from './TripPill.module.css'

function getDaysBadge(depart: string): number {
  const today = new Date()
  const departDate = new Date(depart)
  const diff = Math.floor((today.getTime() - departDate.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function TripPill() {
  const { voyage } = useVoyage()
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
    </div>
  )
}

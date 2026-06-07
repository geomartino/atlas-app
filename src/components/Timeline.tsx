import { useVoyage } from '../context/VoyageContext'
import { getStatut } from '../lib/statut'
import styles from './Timeline.module.css'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const BADGE_LABELS: Record<string, string> = {
  termine: 'Terminé',
  en_cours: 'En cours',
  a_venir: 'À venir',
}

export default function Timeline({ onSelectStep }: { onSelectStep: (idx: number) => void }) {
  const { etapes } = useVoyage()

  return (
    <div className={styles.timeline}>
      {etapes.map((etape, idx) => {
        const statut = getStatut(etape)
        const isLast = idx === etapes.length - 1
        return (
          <button
            key={etape.id}
            className={`${styles.item} ${styles[statut]}`}
            onClick={() => onSelectStep(idx)}
          >
            <div className={styles.lineCol}>
              <div className={`${styles.dot} ${styles[`dot_${statut}`]}`} />
              {!isLast && <div className={styles.line} />}
            </div>
            <div className={styles.body}>
              <div className={styles.row}>
                <span className={styles.ville}>{etape.titre}</span>
                <span className={`${styles.badge} ${styles[`badge_${statut}`]}`}>
                  {BADGE_LABELS[statut]}
                </span>
              </div>
              <span className={styles.dates}>
                {formatDate(etape.date_arrivee)}
                {etape.nuits > 0 && ` → ${formatDate(etape.date_depart)} · ${etape.nuits} nuit${etape.nuits > 1 ? 's' : ''}`}
              </span>
              {etape.distance_km !== null && etape.distance_km > 0 && (
                <span className={styles.dist}>
                  <i className="ti ti-car" style={{ fontSize: 11 }} />
                  {etape.distance_km} km
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

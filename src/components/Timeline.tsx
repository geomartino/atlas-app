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

function isComplete(statut: string, id: string, completedIds: Set<string>): boolean {
  return statut === 'termine' || statut === 'en_cours' || completedIds.has(id)
}

export default function Timeline({ onSelectStep }: { onSelectStep: (idx: number) => void }) {
  const { etapes, completedIds, toggleCompleted } = useVoyage()

  return (
    <div className={styles.timeline}>
      {etapes.map((etape, idx) => {
        const statut = getStatut(etape)
        const isLast = idx === etapes.length - 1
        const manuellementComplete = statut === 'a_venir' && completedIds.has(etape.id)

        const dotClass = manuellementComplete
          ? `${styles.dot} ${styles.dot_a_venir_completed}`
          : `${styles.dot} ${styles[`dot_${statut}`]}`

        const nextEtape = etapes[idx + 1]
        const nextStatut = nextEtape ? getStatut(nextEtape) : null
        const lineGold = !isLast
          && isComplete(statut, etape.id, completedIds)
          && nextEtape !== undefined
          && nextStatut !== null
          && isComplete(nextStatut, nextEtape.id, completedIds)

        return (
          <div key={etape.id} className={`${styles.item} ${styles[statut]}`}>
            <div className={styles.lineCol}>
              <div className={dotClass} />
              {!isLast && <div className={`${styles.line}${lineGold ? ` ${styles.line_gold}` : ''}`} />}
            </div>
            <div className={styles.body}>
              <div className={styles.row}>
                <button className={styles.titre} onClick={() => onSelectStep(idx)}>
                  {etape.titre}
                </button>
                {statut === 'a_venir' ? (
                  <button
                    className={`${styles.btn_complete} ${manuellementComplete ? styles.done : ''}`}
                    onClick={() => toggleCompleted(etape.id)}
                  >
                    {manuellementComplete ? '✓ Complété' : 'Complété'}
                  </button>
                ) : (
                  <span className={`${styles.badge} ${styles[`badge_${statut}`]}`}>
                    {BADGE_LABELS[statut]}
                  </span>
                )}
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
          </div>
        )
      })}
    </div>
  )
}

import { useRef, useEffect } from 'react'
import { useVoyage } from '../context/VoyageContext'
import { getStatut } from '../lib/statut'
import styles from './StepsCarousel.module.css'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function StepsCarousel() {
  const { etapes, selectedIndex, selectStep } = useVoyage()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const card = container.children[selectedIndex] as HTMLElement | undefined
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [selectedIndex])

  return (
    <div className={styles.carousel} ref={scrollRef}>
      {etapes.map((etape, idx) => {
        const statut = getStatut(etape)
        const isActive = idx === selectedIndex
        return (
          <button
            key={etape.id}
            className={`${styles.card} ${styles[statut]} ${isActive ? styles.active : ''}`}
            onClick={() => selectStep(idx)}
          >
            <span className={styles.num}>{etape.numero}</span>
            <span className={styles.ville}>{etape.titre.split('→')[etape.titre.includes('→') ? 1 : 0]?.trim() ?? etape.titre}</span>
            <span className={styles.date}>{formatDate(etape.date_arrivee)}</span>
          </button>
        )
      })}
    </div>
  )
}

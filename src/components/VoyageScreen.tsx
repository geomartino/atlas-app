import { useVoyage } from '../context/VoyageContext'
import TripPill from './TripPill'
import Timeline from './Timeline'
import TabBar from './TabBar'
import type { ActiveScreen } from '../App'
import styles from './VoyageScreen.module.css'

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface Props {
  activeScreen: ActiveScreen
  onTabChange: (screen: ActiveScreen) => void
}

export default function VoyageScreen({ activeScreen, onTabChange }: Props) {
  const { voyage, selectStep } = useVoyage()
  if (!voyage) return null

  function handleSelectStep(idx: number) {
    selectStep(idx)
    onTabChange(null)
  }

  return (
    <div className={styles.overlay}>
      <TripPill />
      <div className={styles.body}>
        <div className={styles.header}>
          <h1 className={styles.title}>Itinéraire</h1>
          <p className={styles.sub}>
            Départ {formatDateLong(voyage.depart)} · Retour {formatDateLong(voyage.retour)} · {voyage.duree_jours} jours
          </p>
        </div>
        <div className={styles.scroll}>
          <Timeline onSelectStep={handleSelectStep} />
          <div className={styles.hint}>
            <i className="ti ti-hand-finger" style={{ color: 'var(--gold)', fontSize: 16 }} />
            <span>Taper une étape pour revenir à la carte</span>
          </div>
        </div>
      </div>
      <TabBar activeScreen={activeScreen} onTabChange={onTabChange} />
    </div>
  )
}

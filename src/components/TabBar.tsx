import type { ActiveScreen } from '../App'
import styles from './TabBar.module.css'

interface Props {
  activeScreen: ActiveScreen
  onTabChange: (screen: ActiveScreen) => void
}

export default function TabBar({ activeScreen, onTabChange }: Props) {
  function toggle(tab: 'voyage' | 'detail') {
    onTabChange(activeScreen === tab ? null : tab)
  }

  return (
    <div className={styles.tabbar}>
      <button
        className={`${styles.tab} ${activeScreen === 'detail' ? styles.active : ''}`}
        onClick={() => toggle('detail')}
      >
        <i className="ti ti-file-description" />
        <span>Détail</span>
      </button>
      <button
        className={`${styles.tab} ${activeScreen === 'voyage' ? styles.active : ''}`}
        onClick={() => toggle('voyage')}
      >
        <i className="ti ti-list" />
        <span>Voyage</span>
      </button>
    </div>
  )
}

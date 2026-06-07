import { useRef, useState, useCallback } from 'react'
import CurrentStep from './CurrentStep'
import StepsCarousel from './StepsCarousel'
import TabBar from './TabBar'
import type { ActiveScreen } from '../App'
import styles from './BottomSheet.module.css'

type SheetState = 'open' | 'collapsed'

interface Props {
  activeScreen: ActiveScreen
  onTabChange: (screen: ActiveScreen) => void
}

export default function BottomSheet({ activeScreen, onTabChange }: Props) {
  const [state, setState] = useState<SheetState>('open')
  const startY = useRef(0)
  const isDragging = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0]!.clientY
    isDragging.current = true
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    const delta = e.changedTouches[0]!.clientY - startY.current
    if (delta > 40) setState('collapsed')
    else if (delta < -40) setState('open')
  }, [])

  const toggle = useCallback(() => {
    setState(s => s === 'open' ? 'collapsed' : 'open')
  }, [])

  return (
    <div className={`${styles.sheet} ${state === 'collapsed' ? styles.collapsed : ''}`}>
      <div
        className={styles.handleArea}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={toggle}
      >
        <div className={styles.handle} />
        <div className={styles.hint}>
          <i className="ti ti-chevron-down" style={{ fontSize: 10 }} />
          <span>Glisser pour voir la carte entière</span>
        </div>
      </div>
      <div className={styles.content}>
        <CurrentStep />
        <div className={styles.divider} />
        <div className={styles.rowLabel}>ÉTAPES</div>
        <StepsCarousel />
        <TabBar activeScreen={activeScreen} onTabChange={onTabChange} />
      </div>
    </div>
  )
}

import { useState } from 'react'
import { VoyageProvider } from './context/VoyageContext'
import MapView from './components/MapView'
import TripPill from './components/TripPill'
import BottomSheet from './components/BottomSheet'
import VoyageScreen from './components/VoyageScreen'
import DetailScreen from './components/DetailScreen'
import styles from './App.module.css'

export type ActiveScreen = 'voyage' | 'detail' | null

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(null)

  return (
    <VoyageProvider>
      <div className={styles.app}>
        <TripPill />
        <MapView />
        {activeScreen === 'voyage' && (
          <VoyageScreen
            activeScreen={activeScreen}
            onTabChange={setActiveScreen}
          />
        )}
        {activeScreen === 'detail' && (
          <DetailScreen
            activeScreen={activeScreen}
            onTabChange={setActiveScreen}
          />
        )}
        <BottomSheet activeScreen={activeScreen} onTabChange={setActiveScreen} />
      </div>
    </VoyageProvider>
  )
}

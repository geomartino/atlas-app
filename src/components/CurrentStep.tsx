import { useEffect, useState } from 'react'
import { useVoyage } from '../context/VoyageContext'
import { fetchMeteo, wxIcon } from '../lib/meteo'
import type { Meteo } from '../types'
import styles from './CurrentStep.module.css'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function CurrentStep() {
  const { etapes, selectedIndex } = useVoyage()
  const etape = etapes[selectedIndex]
  const [meteo, setMeteo] = useState<Meteo | null>(null)

  useEffect(() => {
    if (!etape) return
    setMeteo(null)
    fetchMeteo(etape.coords.lat, etape.coords.lng)
      .then(setMeteo)
      .catch(() => null)
  }, [etape?.id])

  if (!etape) return null

  const nuitsTxt = etape.nuits === 0
    ? 'Jour de départ'
    : `${formatDate(etape.date_arrivee)} → ${formatDate(etape.date_depart)} · ${etape.nuits} nuit${etape.nuits > 1 ? 's' : ''}`

  return (
    <div className={styles.cur}>
      <div className={styles.icon}>
        <i className="ti ti-map-pin" style={{ color: 'var(--gold)', fontSize: 18 }} />
      </div>
      <div className={styles.info}>
        <span className={styles.tag}>ÉTAPE {etape.numero}</span>
        <span className={styles.city}>{etape.titre}</span>
        <span className={styles.sub}>{nuitsTxt}</span>
      </div>
      {meteo && (
        <div className={styles.wx}>
          <i className={`ti ${wxIcon(meteo.weathercode)}`} style={{ fontSize: 14 }} />
          <strong>{meteo.temperature}°</strong>
        </div>
      )}
    </div>
  )
}

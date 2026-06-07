import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Voyage, Etape, VoyageData } from '../types'
import { seedDB, getAllEtapes } from '../lib/db'
import { getEtapeEnCours } from '../lib/statut'

interface VoyageContextValue {
  voyage: Voyage | null
  etapes: Etape[]
  selectedIndex: number
  selectStep: (index: number) => void
  loading: boolean
}

const VoyageContext = createContext<VoyageContextValue | null>(null)

export function VoyageProvider({ children }: { children: ReactNode }) {
  const [voyage, setVoyage] = useState<Voyage | null>(null)
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const configRes = await fetch('/config.json')
        const config = await configRes.json() as { voyage_actif: string }

        const voyageRes = await fetch(`/voyages/${config.voyage_actif}`)
        const data = await voyageRes.json() as VoyageData

        await seedDB(data.etapes)
        const stored = await getAllEtapes()

        setVoyage(data.voyage)
        setEtapes(stored)

        const enCours = getEtapeEnCours(stored)
        const idx = enCours ? stored.findIndex(e => e.id === enCours.id) : 0
        setSelectedIndex(idx >= 0 ? idx : 0)
      } catch (err) {
        console.error('Erreur chargement voyage:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <VoyageContext.Provider value={{ voyage, etapes, selectedIndex, selectStep: setSelectedIndex, loading }}>
      {children}
    </VoyageContext.Provider>
  )
}

export function useVoyage(): VoyageContextValue {
  const ctx = useContext(VoyageContext)
  if (!ctx) throw new Error('useVoyage must be used inside VoyageProvider')
  return ctx
}

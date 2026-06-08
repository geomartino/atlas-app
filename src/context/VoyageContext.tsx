import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import type maplibregl from 'maplibre-gl'
import type { Voyage, Etape, VoyageData } from '../types'
import { seedDB, getAllEtapes, clearDB, updateEtapeNotes } from '../lib/db'
import { getEtapeEnCours } from '../lib/statut'

const LS_COMPLETED = 'atlas-completed-steps'
const LS_VOYAGE    = 'atlas-voyage-actif'

function loadCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_COMPLETED)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch { return new Set() }
}

function saveCompleted(ids: Set<string>) {
  localStorage.setItem(LS_COMPLETED, JSON.stringify([...ids]))
}

export interface VoyageMeta {
  file: string
  nom: string
  pays: string
  emoji: string
}

interface VoyageContextValue {
  voyage: Voyage | null
  etapes: Etape[]
  selectedIndex: number
  selectStep: (index: number) => void
  loading: boolean
  completedIds: Set<string>
  toggleCompleted: (id: string) => void
  updateNotes: (id: string, notes: string) => void
  availableVoyages: VoyageMeta[]
  activeFile: string
  switchVoyage: (file: string) => void
  mapRef: React.MutableRefObject<maplibregl.Map | null>
  geolocateRef: React.MutableRefObject<maplibregl.GeolocateControl | null>
  locateUser: () => void
}

const VoyageContext = createContext<VoyageContextValue | null>(null)

export function VoyageProvider({ children }: { children: ReactNode }) {
  const [voyage, setVoyage]           = useState<Voyage | null>(null)
  const [etapes, setEtapes]           = useState<Etape[]>([])
  const [selectedIndex, setSelected]  = useState(0)
  const [loading, setLoading]         = useState(true)
  const [completedIds, setCompleted]  = useState<Set<string>>(loadCompleted)
  const [availableVoyages, setAvailable] = useState<VoyageMeta[]>([])
  const [activeFile, setActiveFile]   = useState<string>('')
  const mapRef = useRef<maplibregl.Map | null>(null)
  const geolocateRef = useRef<maplibregl.GeolocateControl | null>(null)

  function locateUser() {
    geolocateRef.current?.trigger()
  }

  function toggleCompleted(id: string) {
    setCompleted(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveCompleted(next)
      return next
    })
  }

  async function updateNotes(id: string, notes: string) {
    await updateEtapeNotes(id, notes)
    setEtapes(prev => prev.map(e => e.id === id ? { ...e, notes } : e))
  }

  const loadVoyage = useCallback(async (file: string) => {
    setLoading(true)
    try {
      const base = import.meta.env.BASE_URL
      const res  = await fetch(`${base}voyages/${file}`)
      const data = await res.json() as VoyageData

      await clearDB()
      await seedDB(data.etapes)
      const stored = await getAllEtapes()

      setVoyage(data.voyage)
      setEtapes(stored)
      setActiveFile(file)

      const enCours = getEtapeEnCours(stored)
      const idx = enCours ? stored.findIndex(e => e.id === enCours.id) : 0
      setSelected(idx >= 0 ? idx : 0)
    } catch (err) {
      console.error('Erreur chargement voyage:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  function switchVoyage(file: string) {
    localStorage.setItem(LS_VOYAGE, file)
    loadVoyage(file)
  }

  useEffect(() => {
    async function init() {
      const base = import.meta.env.BASE_URL

      // Charger l'index des voyages disponibles
      try {
        const idxRes = await fetch(`${base}voyages/index.json`)
        const idx    = await idxRes.json() as VoyageMeta[]
        setAvailable(idx)
      } catch (err) {
        console.error('Erreur chargement index voyages:', err)
      }

      // Déterminer le voyage actif (localStorage > config.json)
      let file = localStorage.getItem(LS_VOYAGE) ?? ''
      if (!file) {
        try {
          const cfgRes = await fetch(`${base}config.json`)
          const cfg    = await cfgRes.json() as { voyage_actif: string }
          file = cfg.voyage_actif
        } catch { file = 'bapteme-islandais-2026.json' }
      }

      await loadVoyage(file)
    }
    init()
  }, [loadVoyage])

  return (
    <VoyageContext.Provider value={{
      voyage, etapes, selectedIndex, selectStep: setSelected,
      loading, completedIds, toggleCompleted, updateNotes,
      availableVoyages, activeFile, switchVoyage,
      mapRef, geolocateRef, locateUser,
    }}>
      {children}
    </VoyageContext.Provider>
  )
}

export function useVoyage(): VoyageContextValue {
  const ctx = useContext(VoyageContext)
  if (!ctx) throw new Error('useVoyage must be used inside VoyageProvider')
  return ctx
}

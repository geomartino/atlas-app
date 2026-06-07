import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useVoyage } from '../context/VoyageContext'
import { getStatut } from '../lib/statut'
import type { Etape } from '../types'
import styles from './MapView.module.css'

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined
const hasValidKey = !!MAPTILER_KEY && MAPTILER_KEY !== 'your_maptiler_key_here'

const CARTO_DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [{ id: 'carto-dark', type: 'raster', source: 'carto' }],
}

const MAP_STYLE = hasValidKey
  ? `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`
  : CARTO_DARK_STYLE

function markerEl(etape: Etape, isSelected: boolean): HTMLElement {
  const statut = getStatut(etape)
  const el = document.createElement('div')
  el.className = `marker marker-${statut}${isSelected ? ' marker-selected' : ''}`

  if (statut === 'en_cours' || isSelected) {
    el.style.cssText = `
      width: 14px; height: 14px; border-radius: 50%;
      background: #C9A96E;
      box-shadow: 0 0 0 4px rgba(201,169,110,0.25), 0 0 12px rgba(201,169,110,0.4);
      cursor: pointer;
    `
  } else if (statut === 'termine') {
    el.style.cssText = `
      width: 11px; height: 11px; border-radius: 50%;
      background: #2E4055; cursor: pointer;
    `
  } else {
    el.style.cssText = `
      width: 11px; height: 11px; border-radius: 50%;
      background: transparent;
      border: 1.5px solid #2E4055;
      cursor: pointer;
    `
  }
  return el
}

export default function MapView() {
  const { etapes, selectedIndex, selectStep, loading } = useVoyage()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (loading || !mapContainerRef.current || etapes.length === 0) return

    const selected = etapes[selectedIndex]
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [selected.coords.lng, selected.coords.lat],
      zoom: 7,
      attributionControl: false,
    })

    mapRef.current = map

    map.on('load', () => {
      // Route layer
      const coords = etapes.map(e => [e.coords.lng, e.coords.lat])
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: coords },
        },
      })
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#C9A96E',
          'line-width': 1.5,
          'line-dasharray': [2, 4],
          'line-opacity': 0.6,
        },
      })

      // Markers
      etapes.forEach((etape, idx) => {
        const el = markerEl(etape, idx === selectedIndex)
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([etape.coords.lng, etape.coords.lat])
          .addTo(map)
        el.addEventListener('click', () => selectStep(idx))
        markersRef.current.push(marker)
      })
    })

    return () => {
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [loading, etapes])

  // Fly to selected step & refresh markers
  useEffect(() => {
    const map = mapRef.current
    if (!map || etapes.length === 0) return

    const selected = etapes[selectedIndex]
    map.flyTo({ center: [selected.coords.lng, selected.coords.lat], zoom: 8, duration: 800 })

    markersRef.current.forEach((marker, idx) => {
      const el = markerEl(etapes[idx]!, idx === selectedIndex)
      marker.getElement().replaceWith(el)
      // Re-attach click since we replaced the element
      el.addEventListener('click', () => selectStep(idx))
      // MapLibre marker keeps its position; we just swapped the DOM element
      ;(marker as unknown as { _element: HTMLElement })._element = el
    })
  }, [selectedIndex])

  return <div ref={mapContainerRef} className={styles.map} />
}

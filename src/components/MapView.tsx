import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useVoyage } from '../context/VoyageContext'
import { getStatut } from '../lib/statut'
import type { Etape } from '../types'
import styles from './MapView.module.css'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright'

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
      background: #94A3B8; cursor: pointer;
    `
  } else {
    el.style.cssText = `
      width: 11px; height: 11px; border-radius: 50%;
      background: transparent;
      border: 1.5px solid #94A3B8;
      cursor: pointer;
    `
  }
  return el
}

export default function MapView() {
  const { etapes, selectedIndex, selectStep, loading, mapRef, geolocateRef } = useVoyage()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (loading || !mapContainerRef.current || etapes.length === 0) return

    const lngs = etapes.map(e => e.coords.lng)
    const lats = etapes.map(e => e.coords.lat)
    const bounds: maplibregl.LngLatBoundsLike = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ]

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [lngs.reduce((a, b) => a + b, 0) / lngs.length, lats.reduce((a, b) => a + b, 0) / lats.length],
      zoom: 5,
      attributionControl: false,
    })

    mapRef.current = map

    map.on('load', () => {
      const geolocate = new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      })
      map.addControl(geolocate, 'bottom-right')
      geolocateRef.current = geolocate

      map.fitBounds(bounds, {
        padding: { top: 110, bottom: 320, left: 60, right: 60 },
        maxZoom: 12,
        duration: 0,
      })

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
        layout: { 'line-join': 'round', 'line-cap': 'butt' },
        paint: {
          'line-color': '#DC2626',
          'line-width': 2,
          'line-dasharray': [4, 3],
          'line-opacity': 0.85,
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
    const lngs = etapes.map(e => e.coords.lng)
    const span = Math.max(...lngs) - Math.min(...lngs)
    const flyZoom = span < 1 ? 13 : span < 5 ? 10 : 8
    map.flyTo({ center: [selected.coords.lng, selected.coords.lat], zoom: flyZoom, duration: 800 })

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

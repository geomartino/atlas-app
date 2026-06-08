import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useVoyage } from '../context/VoyageContext'
import { getStatut } from '../lib/statut'
import type { Etape } from '../types'
import styles from './MapView.module.css'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright'

function buildMarkersGeoJSON(etapes: Etape[], selectedIndex: number) {
  return {
    type: 'FeatureCollection' as const,
    features: etapes.map((e, idx) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [e.coords.lng, e.coords.lat] },
      properties: {
        idx,
        statut: getStatut(e),
        isSelected: idx === selectedIndex ? 1 : 0,
      },
    })),
  }
}

export default function MapView() {
  const { etapes, selectedIndex, selectStep, loading, mapRef, geolocateRef } = useVoyage()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapLoadedRef = useRef(false)

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
    mapLoadedRef.current = false

    map.on('load', () => {
      mapLoadedRef.current = true

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

      // Route line
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

      // Step markers as GeoJSON circles — same WebGL engine as the route line,
      // pixel-perfect alignment guaranteed.
      map.addSource('markers', {
        type: 'geojson',
        data: buildMarkersGeoJSON(etapes, selectedIndex),
      })

      // Glow ring for active / selected
      map.addLayer({
        id: 'markers-glow',
        type: 'circle',
        source: 'markers',
        filter: ['any', ['==', ['get', 'isSelected'], 1], ['==', ['get', 'statut'], 'en_cours']],
        paint: {
          'circle-radius': 14,
          'circle-color': 'rgba(201,169,110,0.18)',
          'circle-blur': 0.6,
        },
      })

      // Stroke ring for "à venir"
      map.addLayer({
        id: 'markers-stroke',
        type: 'circle',
        source: 'markers',
        filter: ['all',
          ['==', ['get', 'statut'], 'a_venir'],
          ['==', ['get', 'isSelected'], 0],
        ],
        paint: {
          'circle-radius': 6,
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#4A6080',
        },
      })

      // Fill dot for terminé / en_cours / selected
      map.addLayer({
        id: 'markers-fill',
        type: 'circle',
        source: 'markers',
        filter: ['any',
          ['==', ['get', 'statut'], 'termine'],
          ['==', ['get', 'statut'], 'en_cours'],
          ['==', ['get', 'isSelected'], 1],
        ],
        paint: {
          'circle-radius': [
            'case',
            ['any', ['==', ['get', 'isSelected'], 1], ['==', ['get', 'statut'], 'en_cours']], 8,
            5,
          ],
          'circle-color': [
            'case',
            ['any', ['==', ['get', 'isSelected'], 1], ['==', ['get', 'statut'], 'en_cours']], '#C9A96E',
            '#3A5070',
          ],
        },
      })

      const handleClick = (e: maplibregl.MapLayerMouseEvent) => {
        const feat = e.features?.[0]
        if (feat) {
          const idx = feat.properties?.idx as number
          if (typeof idx === 'number') selectStep(idx)
        }
      }

      map.on('click', 'markers-fill', handleClick)
      map.on('click', 'markers-stroke', handleClick)
      map.on('mouseenter', 'markers-fill', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'markers-fill', () => { map.getCanvas().style.cursor = '' })
      map.on('mouseenter', 'markers-stroke', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'markers-stroke', () => { map.getCanvas().style.cursor = '' })
    })

    return () => {
      mapLoadedRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [loading, etapes])

  // Update selected marker highlight + fly to step
  useEffect(() => {
    const map = mapRef.current
    if (!map || etapes.length === 0 || !mapLoadedRef.current) return

    const src = map.getSource('markers') as maplibregl.GeoJSONSource | undefined
    src?.setData(buildMarkersGeoJSON(etapes, selectedIndex))

    const selected = etapes[selectedIndex]
    const lngs = etapes.map(e => e.coords.lng)
    const span = Math.max(...lngs) - Math.min(...lngs)
    const flyZoom = span < 1 ? 13 : span < 5 ? 10 : 8
    map.flyTo({ center: [selected.coords.lng, selected.coords.lat], zoom: flyZoom, duration: 800 })
  }, [selectedIndex])

  return <div ref={mapContainerRef} className={styles.map} />
}

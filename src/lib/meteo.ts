import type { Meteo } from '../types'

export async function fetchMeteo(lat: number, lng: number): Promise<Meteo> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error('meteo fetch failed')
  const data = await res.json() as { current: { temperature_2m: number; weathercode: number } }
  return {
    temperature: Math.round(data.current.temperature_2m),
    weathercode: data.current.weathercode,
  }
}

export function wxIcon(code: number): string {
  if (code === 0) return 'ti-sun'
  if (code <= 3) return 'ti-cloud'
  if (code <= 67) return 'ti-cloud-rain'
  if (code <= 77) return 'ti-snowflake'
  if (code <= 99) return 'ti-cloud-storm'
  return 'ti-cloud'
}

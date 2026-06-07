import type { Etape, Statut } from '../types'

export function getStatut(etape: Etape): Statut {
  const today = new Date()
  const arrivee = new Date(etape.date_arrivee)
  const depart = new Date(etape.date_depart)
  if (today >= depart) return 'termine'
  if (today >= arrivee && today < depart) return 'en_cours'
  return 'a_venir'
}

export function getEtapeEnCours(etapes: Etape[]): Etape | undefined {
  return etapes.find(e => getStatut(e) === 'en_cours') ?? etapes[0]
}

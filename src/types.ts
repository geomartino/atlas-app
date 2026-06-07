export interface Coords {
  lat: number
  lng: number
}

export interface Hebergement {
  nom: string
  type: string
  chambre: string
  petit_dejeuner: boolean
  adresse: string
  coords: Coords
  site_web: string | null
  telephone: string | null
  confirmation: string | null
  lien_reservation: string | null
}

export interface Activite {
  id: string
  nom: string
  type: string
  description: string
  coords: Coords
  duree: string
  lien_navigation: string | null
  sauvegarde: boolean
}

export interface Restaurant {
  id: string
  nom: string
  type: string
  coords: Coords
}

export interface Favori {
  id: string
  nom: string
  coords: Coords
}

export type EtapeType = 'libre' | 'guidee' | 'depart'
export type Statut = 'termine' | 'en_cours' | 'a_venir'

export interface Etape {
  id: string
  numero: number
  titre: string
  type: EtapeType
  date_arrivee: string
  date_depart: string
  nuits: number
  distance_km: number | null
  coords: Coords
  description: string
  infos_pratiques: Record<string, unknown>
  hebergement: Hebergement | null
  activites: Activite[]
  restaurants: Restaurant[]
  favoris: Favori[]
  notes: string
}

export interface VoyageLogistique {
  vehicule?: {
    type: string
    prise_en_charge: string
    restitution: string
    duree_jours: number
    assurance: string
    kilometrage: string
  }
}

export interface Voyage {
  id: string
  nom: string
  pays: string
  depart: string
  retour: string
  duree_jours: number
  description: string
  logistique: VoyageLogistique
}

export interface VoyageData {
  meta: { version: string; created_at: string; updated_at: string }
  voyage: Voyage
  etapes: Etape[]
}

export interface Meteo {
  temperature: number
  weathercode: number
}

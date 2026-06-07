# CLAUDE.md — Briefing pour Claude Code

Ce fichier décrit le projet Atlas en détail pour permettre à Claude Code de contribuer sans perte de contexte. Lis-le entièrement avant d'écrire la moindre ligne de code.

---

## Contexte du projet

Application mobile PWA de voyage. La carte est l'élément central et permanent. L'app charge un fichier JSON au démarrage qui contient tout l'itinéraire d'un voyage. Chaque déploiement Vercel = un voyage. Pas d'auth, pas de backend, pas de multi-utilisateurs.

**Objectif Phase 1 :** coder l'Écran 1 (Carte) et l'Écran 2 (Voyage) en respectant exactement les maquettes de référence.

---

## Référence UI obligatoire

**Avant d'écrire du code de composant, consulte `docs/maquettes/atlas_maquettes.html`.**

Ce fichier contient les maquettes interactives de référence. Reproduis exactement :
- Les couleurs, typographies et espacements
- Tous les composants (TripPill, BottomSheet, StepCard, TabBar, Timeline...)
- Les états visuels des étapes (active, terminée, à venir)
- Les transitions et comportements

### Tokens de design

```css
/* Couleurs */
--gold: #C9A96E
--gold-dim: rgba(201,169,110,0.15)
--gold-border: rgba(201,169,110,0.3)
--bg: #080C12
--surface: #0D1117
--card: #111820
--card2: #1A2535
--border: #1E2A3A
--border2: #2A3545
--text: #E8E2D5
--text2: #A8B8CC
--text3: #6A7A90
--text4: #3E5068
--text5: #2E3D50
--blue: #378ADD
--green: #1D9E75

/* Typographies */
font-family: 'Syne', sans-serif      /* titres, chiffres */
font-family: 'DM Sans', sans-serif   /* corps, UI */

/* Google Fonts à importer */
Syne: wght@700;800
DM Sans: wght@300;400;500

/* Icônes */
@tabler/icons — outline uniquement, jamais -filled
```

### États visuels des étapes

```
Terminée  → point gris plein  #2E4055  · texte #4A5F74  · badge "Terminé"  bg #151F2C
En cours  → point doré #C9A96E · glow rgba(201,169,110,0.18) · badge "En cours" bg gold/12%
À venir   → cercle vide border #2E4055 · texte #8A9DB8  · badge "À venir"  bg card
```

---

## Stack technique

```
React 18 + Vite
MapLibre GL JS         — carte
Maptiler               — tuiles (clé API dans .env)
Open-Meteo             — météo (pas de clé)
Overpass API           — lieux découverte (pas de clé)
Dexie.js               — IndexedDB
```

### Variables d'environnement

```
VITE_MAPTILER_KEY=      ← clé Maptiler (compte gratuit)
```

---

## Chargement des données

Au démarrage l'app :
1. Fetch `public/config.json` → récupère `voyage_actif`
2. Fetch `public/voyages/{voyage_actif}` → charge le JSON du voyage
3. Initialise Dexie avec les données si IndexedDB est vide
4. Si IndexedDB existe déjà → utilise IndexedDB (modifications locales prioritaires)

```js
// public/config.json
{ "voyage_actif": "bapteme-islandais-2026.json" }
```

### Fichier de test

`public/voyages/bapteme-islandais-2026.json` — voyage en Islande, 10 étapes, données réelles.

### Schéma d'une étape

```ts
type Etape = {
  id: string
  numero: number
  titre: string
  type: 'libre' | 'guidee' | 'depart'
  date_arrivee: string   // YYYY-MM-DD
  date_depart: string
  nuits: number
  distance_km: number | null
  coords: { lat: number; lng: number }
  description: string
  infos_pratiques: Record<string, any>
  hebergement: Hebergement | null
  activites: Activite[]
  restaurants: Restaurant[]
  favoris: Favori[]
  notes: string
}
```

### Calcul du statut d'une étape

```ts
function getStatut(etape: Etape): 'termine' | 'en_cours' | 'a_venir' {
  const today = new Date()
  const arrivee = new Date(etape.date_arrivee)
  const depart = new Date(etape.date_depart)
  if (today >= depart) return 'termine'
  if (today >= arrivee && today < depart) return 'en_cours'
  return 'a_venir'
}
```

---

## Architecture des composants

```
App
├── TripPill              — barre supérieure, présente sur tous les écrans
├── MapView               — carte MapLibre, fond permanent Écran 1
│   └── RouteLayer        — ligne pointillée dorée entre les étapes
│   └── StepMarkers       — pins sur la carte
└── BottomSheet           — panneau glissable sur la carte
    ├── CurrentStep       — étape en cours avec météo
    ├── StepsCarousel     — scroll horizontal des étapes
    └── TabBar            — onglets Détail / Voyage
        ├── DetailScreen  — Écran 3 (Phase 2)
        └── VoyageScreen  — Écran 2
            └── Timeline  — liste verticale des étapes
```

---

## Écran 1 — Carte

### TripPill
- Toujours visible en haut, présent sur tous les écrans
- Contenu : icône route · nom du voyage · durée totale · badge J+X
- Badge J+X = nombre de jours depuis `voyage.depart`
- Menu `⋯` → À propos + Export JSON (Phase 2)

### MapLibre
- Style sombre Maptiler : `https://api.maptiler.com/maps/streets-v2-dark/style.json?key={KEY}`
- Centré sur l'étape en cours au chargement
- Ligne de route en pointillés dorés (#C9A96E) entre toutes les étapes
- Pins : dorée animée = en cours · grise pleine = terminée · cercle vide = à venir
- Tap sur pin → sélectionne l'étape (même comportement que tap card carousel)

### BottomSheet
- Position par défaut : ouverte (bottom sheet visible)
- Swipe down → réduit, carte plein écran
- Swipe up → bottom sheet réouverte
- Hint discret sous le handle : "Glisser pour voir la carte entière"

### CurrentStep
- Icône map-pin dans carré doré
- Tag "ÉTAPE EN COURS" en petit caps doré
- Ville en Syne 800, sous-titre dates/nuits en DM Sans
- Chip météo à droite : icône + température (Open-Meteo, coordonnées de l'étape)

### StepsCarousel
- Scroll horizontal, pas de scrollbar
- Cards 116px min-width, border-radius 16px
- Card active : border gold, numéro doré, ville blanche
- Card terminée : numéro et ville grisés
- Card à venir : tout grisé sombre
- Tap card → `selectStep(index)` → recentre carte + met à jour CurrentStep

### TabBar
- 2 onglets : Détail (ti-file-description) · Voyage (ti-list)
- Onglet actif : border-top 1.5px gold + icône et label dorés
- Tap Voyage → affiche VoyageScreen par-dessus (overlay, pas de navigation)
- Tap Détail → affiche DetailScreen par-dessus (Phase 2)

---

## Écran 2 — Voyage

Overlay par-dessus la carte, même phone frame.

### TripPill
- Identique à l'Écran 1

### Header
- Titre "Itinéraire" en Syne 800 26px
- Sous-titre : "Départ [date] · Retour [date] · [N] jours"

### Timeline
- Liste verticale de toutes les étapes
- Chaque étape : point coloré + ligne verticale + bloc info + badge statut
- Point : 11px, styles selon statut (voir tokens)
- Ligne : 1.5px #1A2535, s'arrête sur la dernière étape
- Ville : 15px/500, couleur selon statut
- Dates : 11px, color text4
- Badge : border-radius 11px, styles selon statut
- Tap étape → ferme overlay + recentre carte sur cette étape

### Hint
- Encadré card avec icône ti-hand-finger doré
- "Taper une étape pour revenir à la carte"

### TabBar
- Identique, onglet Voyage actif

---

## Météo — Open-Meteo

```js
// Pas de clé API requise
const url = `https://api.open-meteo.com/v1/forecast
  ?latitude=${lat}
  &longitude=${lng}
  &current=temperature_2m,weathercode
  &timezone=auto`

// weathercode → icône Tabler
const wxIcon = (code) => {
  if (code === 0) return 'ti-sun'                    // Ciel dégagé
  if (code <= 3) return 'ti-cloud'                   // Nuageux
  if (code <= 67) return 'ti-cloud-rain'             // Pluie
  if (code <= 77) return 'ti-snowflake'              // Neige
  if (code <= 99) return 'ti-cloud-storm'            // Orage
  return 'ti-cloud'
}
```

---

## Conventions de code

- **Langue** : français pour les labels UI, anglais pour le code (variables, fonctions, composants)
- **Composants** : un fichier par composant dans `src/components/`
- **State global** : React Context (pas de Redux) — `VoyageContext` contient le voyage et l'étape sélectionnée
- **CSS** : CSS Modules ou styled-components — pas de Tailwind
- **Typage** : TypeScript si possible, sinon JSDoc
- **Pas de** : Axios (fetch natif), lodash, moment.js

---

## Ce qui est fait

- [x] Maquettes UI complètes (`docs/maquettes/atlas_maquettes.html`)
- [x] JSON de voyage Islande (`public/voyages/bapteme-islandais-2026.json`)
- [x] Structure du projet définie

## Phase 1 — À coder

- [ ] Setup Vite + React + MapLibre
- [ ] VoyageContext — chargement config.json + voyage.json + Dexie
- [ ] TripPill
- [ ] MapView + RouteLayer + StepMarkers
- [ ] BottomSheet (swipe gesture)
- [ ] CurrentStep + météo Open-Meteo
- [ ] StepsCarousel
- [ ] TabBar
- [ ] VoyageScreen (Timeline)

## Phase 2 — À coder plus tard

- [ ] DetailScreen (sections accordéon, notes, édition inline)
- [ ] Export JSON / Google Drive / OneDrive

## Phase 3 — À coder plus tard

- [ ] DiscoveryScreen (carte, pins, filtres, Overpass API)

---

## Notes importantes

- L'étape de type `libre` n'a pas d'hébergement → ne pas afficher de section hébergement vide
- L'étape de type `depart` a `nuits: 0` → afficher différemment dans la timeline
- Le voyage de test démarre le 9 août 2026 → pour tester les statuts, mocker `new Date()` ou modifier les dates du JSON
- `hebergement: null` est valide — toujours vérifier avant d'accéder aux propriétés

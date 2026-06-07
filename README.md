# Atlas — Application mobile de voyage

Application mobile PWA destinée aux voyageurs, conçue pour planifier des itinéraires à l'avance et encourager la découverte spontanée sur place. La carte est l'élément central et permanent de l'interface.

---

## Stack technique

| Rôle | Technologie | Coût |
|------|-------------|------|
| Framework | React + Vite | Gratuit |
| Carte | MapLibre GL JS | Gratuit |
| Tuiles de carte | Maptiler | Gratuit (50k vues/mois) |
| Météo | Open-Meteo | Gratuit |
| Lieux à proximité | Overpass API (OpenStreetMap) | Gratuit |
| Persistance locale | Dexie.js (IndexedDB) | Gratuit |
| Hébergement | Vercel | Gratuit |
| CI/CD | GitHub Actions | Gratuit |

**Budget total : 0$**

---

## Architecture des données

### Chargement au démarrage

```
public/config.json          → indique quel voyage charger
public/voyages/[nom].json   → données complètes du voyage
```

L'app lit `config.json` au démarrage, charge le JSON du voyage actif, et initialise IndexedDB avec ces données. Les modifications faites dans l'app (notes, restaurants, favoris) sont persistées dans IndexedDB. Le JSON original reste la source de vérité initiale.

### Schéma du voyage

```json
{
  "meta": { "version", "created_at", "updated_at" },
  "voyage": {
    "id", "nom", "pays", "depart", "retour", "duree_jours",
    "description", "logistique": { "vehicule": { ... } }
  },
  "etapes": [
    {
      "id", "numero", "titre",
      "type": "libre | guidee | depart",
      "date_arrivee", "date_depart", "nuits",
      "distance_km", "coords": { "lat", "lng" },
      "description", "infos_pratiques",
      "hebergement": { "nom", "type", "chambre", "petit_dejeuner",
                       "adresse", "coords", "site_web",
                       "telephone", "confirmation", "lien_reservation" },
      "activites": [ { "id", "nom", "type", "description",
                       "coords", "duree", "lien_navigation", "sauvegarde" } ],
      "restaurants": [],
      "favoris": [],
      "notes": ""
    }
  ]
}
```

### Types d'étapes

- `libre` — séjour sans structure (ex: séjour libre à Reykjavík) — pas d'hébergement prédéfini
- `guidee` — étape avec programme, hébergement et activités
- `depart` — dernière étape, restitution véhicule, nuits = 0

### Persistance

```
voyage.json (public/)   →   import initial au démarrage
                                    ↓
                            IndexedDB (Dexie.js)
                            modifications en temps réel
                                    ↓
                            Export JSON   →   téléchargement local
                                          →   Google Drive
                                          →   OneDrive
```

---

## Architecture des écrans

### Écran 1 — Carte *(Phase 1)*
Écran racine permanent. Carte plein écran + bottom sheet glissable.

**Composants :**
- Trip pill (haut) : nom du voyage · durée · J+X · menu ⋯ (À propos)
- Bottom sheet glissable (swipe down = carte pleine)
  - Étape en cours : ville, pays, dates, nuits, météo automatique
  - Carousel horizontal des étapes avec statuts visuels
  - 2 onglets : **Détail** · **Voyage**

**Comportements :**
- Tap card carousel → carte recentrée + bottom sheet mis à jour
- Étapes terminées restent consultables
- Pin dorée = étape en cours · pins grises pleines = terminées · cercles vides = à venir

### Écran 2 — Voyage *(Phase 1)*
Vue liste complète de l'itinéraire.

**Composants :**
- Trip pill identique à l'Écran 1
- Timeline verticale : point coloré + ligne + ville + dates + badge statut
- Hint "Taper une étape pour revenir à la carte"
- 2 onglets : **Détail** · **Voyage** (actif)

**Comportements :**
- Tap étape → retour Écran 1, carte recentrée

### Écran 3 — Détail *(Phase 2)*
Fiche complète d'une étape.

**Composants :**
- Trip pill + flèche ← retour carte
- Chips météo + délai avant arrivée
- Sections accordéon fermées par défaut : Hébergement · Restaurants · Activités
  - Crayon → bascule en formulaire inline (Annuler / Enregistrer)
  - Lien GPS si adresse localisable présente
- Zone Notes — texte libre, toujours visible
- Bouton Découverte autour de [Ville]

### Écran 4 — Découverte *(Phase 3)*
Lieux à proximité, contextualisé par étape active.

**Composants :**
- Carte avec pins bleues (suggestions) et dorées (sauvegardés)
- Cercle de proximité
- Filtres : Tous · Sauvegardés · Restaurants · Culture · Parcs · Commerces
- Liste des lieux avec bouton bookmark

---

## Workflow de navigation

```
┌─────────────────────────────────────────────┐
│           Écran 1 — Carte                   │  ← Écran racine
│  carte permanente + bottom sheet glissable  │
└──────────┬──────────────────────────────────┘
           │ Onglet Détail      │ Onglet Voyage
           ▼                    ▼
┌─────────────────┐   ┌──────────────────────┐
│ Écran 3 — Détail│   │  Écran 2 — Voyage    │
│                 │   │                      │
│ ← retour carte  │   │  Tap étape           │
│                 │   │  → Écran 1 recentré  │
│ Bouton          │   └──────────────────────┘
│ Découverte      │
└────────┬────────┘
         ▼
┌──────────────────────┐
│  Écran 4 — Découverte│
└──────────────────────┘
```

**Règles :**
- La carte est toujours accessible en 1 tap maximum
- Les onglets Détail et Voyage sont permanents sur tous les écrans
- Trip pill présent sur tous les écrans

---

## Export du voyage

Accessible via `⋯` dans le trip pill et dans le header de l'Écran 2 :

- Télécharger JSON (local)
- Exporter vers Google Drive
- Exporter vers OneDrive

---

## Phases de développement

**Phase 1 — MVP** *(en cours)*
- [ ] Écran 1 : Carte + bottom sheet + carousel + météo
- [ ] Écran 2 : Vue Voyage — timeline verticale

**Phase 2**
- [ ] Écran 3 : Détail d'une étape (sections, notes, édition inline)

**Phase 3**
- [ ] Écran 4 : Découverte (carte, pins, filtres, sauvegarde)

**Phase 4**
- [ ] Notifications / rappels avant une étape
- [ ] Partage d'itinéraire
- [ ] Export enrichi (PDF, partage)

---

## Reste à définir / maquetter

- [ ] Comportement visuel des étapes terminées dans le carousel
- [ ] Ajout d'une nouvelle étape à l'itinéraire
- [ ] Section vide dans Détail — état + bouton "+ Ajouter"
- [ ] Plusieurs entrées par section (ex: 2 restaurants)
- [ ] Lien navigation GPS depuis une adresse — comportement exact
- [ ] Retour vers la carte depuis l'Écran Détail
- [ ] Écran Découverte complet (version finale)
- [ ] Notifications / rappels
- [ ] Partage d'itinéraire

---

## Structure du projet

```
/
├── public/
│   ├── config.json                          ← voyage actif
│   └── voyages/
│       └── bapteme-islandais-2026.json      ← données de test
├── src/
│   ├── components/
│   ├── App.jsx
│   └── main.jsx
├── docs/
│   └── maquettes/
│       └── atlas_maquettes.html             ← référence UI interactive
├── README.md
├── CLAUDE.md
├── vite.config.js
├── package.json
└── index.html
```

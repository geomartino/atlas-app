import { useState, useEffect, type ReactNode } from 'react'
import { useVoyage } from '../context/VoyageContext'
import { getStatut } from '../lib/statut'
import { fetchMeteo, wxIcon } from '../lib/meteo'
import TripPill from './TripPill'
import TabBar from './TabBar'
import type { ActiveScreen } from '../App'
import type { Meteo } from '../types'
import styles from './DetailScreen.module.css'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function wxLabel(code: number): string {
  if (code === 0) return 'Dégagé'
  if (code <= 3) return 'Nuageux'
  if (code <= 67) return 'Pluvieux'
  if (code <= 77) return 'Neige'
  if (code <= 99) return 'Orageux'
  return 'Nuageux'
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  const d = new Date(dateStr)
  return Math.ceil((d.getTime() - now.getTime()) / 86400000)
}

const STATUT_LABELS: Record<string, string> = {
  termine: 'Terminé',
  en_cours: 'En cours',
  a_venir: 'À venir',
}

// ── Section accordéon ──────────────────────────────────────────────────────
interface SectionProps {
  icon: string
  iconColor: string
  iconBg: string
  iconBorder: string
  title: string
  count: number
  open: boolean
  onToggle: () => void
  children: ReactNode
}

function Section({ icon, iconColor, iconBg, iconBorder, title, count, open, onToggle, children }: SectionProps) {
  const countTxt = count === 0 ? 'Vide' : `${count} entrée${count > 1 ? 's' : ''}`
  return (
    <div className={styles.section}>
      <button className={styles.secHeader} onClick={onToggle}>
        <div className={styles.secIco} style={{ background: iconBg, border: `0.5px solid ${iconBorder}` }}>
          <i className={`ti ${icon}`} style={{ fontSize: 16, color: iconColor }} />
        </div>
        <span className={styles.secName}>{title}</span>
        <span className={styles.secCount}>{countTxt}</span>
        <i className={`ti ti-chevron-down ${styles.secChev} ${open ? styles.secChevOpen : ''}`} />
      </button>
      {open && count > 0 && (
        <div className={styles.secBody}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Item dans une section ──────────────────────────────────────────────────
interface ItemProps {
  title: string
  sub?: string
  extra?: string
}

function SectionItem({ title, sub, extra }: ItemProps) {
  return (
    <div className={styles.secItem}>
      <span className={styles.itemTitle}>{title}</span>
      {sub && <span className={styles.itemSub}>{sub}</span>}
      {extra && <span className={styles.itemExtra}>{extra}</span>}
    </div>
  )
}

// ── DetailScreen ───────────────────────────────────────────────────────────
interface Props {
  activeScreen: ActiveScreen
  onTabChange: (screen: ActiveScreen) => void
}

export default function DetailScreen({ activeScreen, onTabChange }: Props) {
  const { etapes, selectedIndex, updateNotes } = useVoyage()
  const etape = etapes[selectedIndex]
  const [meteo, setMeteo] = useState<Meteo | null>(null)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())
  const [notesValue, setNotesValue] = useState('')

  useEffect(() => {
    if (!etape) return
    setMeteo(null)
    setNotesValue(etape.notes)
    setOpenSections(new Set())
    fetchMeteo(etape.coords.lat, etape.coords.lng)
      .then(setMeteo)
      .catch(() => null)
  }, [etape?.id])

  if (!etape) return null

  const statut = getStatut(etape)
  const datesTxt = etape.nuits === 0
    ? formatDate(etape.date_arrivee)
    : `${formatDate(etape.date_arrivee)} — ${formatDate(etape.date_depart)} · ${etape.nuits} nuit${etape.nuits > 1 ? 's' : ''}`

  function toggleSection(key: string) {
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function handleNotesBlur() {
    if (notesValue !== etape.notes) {
      updateNotes(etape.id, notesValue)
    }
  }

  const days = daysUntil(etape.date_arrivee)

  return (
    <div className={styles.overlay}>
      <TripPill />
      <div className={styles.body}>
        <div className={styles.scroll}>

          {/* Header */}
          <div className={styles.header}>
            <button className={styles.back} onClick={() => onTabChange(null)}>
              <i className="ti ti-chevron-left" />
            </button>
            <div className={styles.titleBlock}>
              <span className={styles.etapeLabel}>
                Étape {String(etape.numero).padStart(2, '0')} · {STATUT_LABELS[statut]}
              </span>
              <h1 className={styles.city}>{etape.titre}</h1>
              <p className={styles.sub}>{datesTxt}</p>
            </div>
          </div>

          {/* Chips météo + statut */}
          <div className={styles.chips}>
            {meteo && (
              <div className={styles.chip}>
                <i className={`ti ${wxIcon(meteo.weathercode)}`} style={{ color: '#85B7EB', fontSize: 13 }} />
                <strong>{meteo.temperature}°</strong>
                <span>{wxLabel(meteo.weathercode)}</span>
              </div>
            )}
            {statut === 'en_cours' && (
              <div className={styles.chip}>
                <i className="ti ti-clock" style={{ fontSize: 13, color: 'var(--gold)' }} />
                <span style={{ color: 'var(--gold)' }}>En cours</span>
              </div>
            )}
            {statut === 'a_venir' && days > 0 && (
              <div className={styles.chip}>
                <i className="ti ti-clock" style={{ fontSize: 13 }} />
                <span>Arrivée dans <strong>{days} jour{days > 1 ? 's' : ''}</strong></span>
              </div>
            )}
            {statut === 'termine' && (
              <div className={styles.chip}>
                <i className="ti ti-check" style={{ fontSize: 13, color: 'var(--green)' }} />
                <span style={{ color: 'var(--green)' }}>Terminé</span>
              </div>
            )}
          </div>

          <div className={styles.divider} />
          <p className={styles.secLabel}>Informations</p>

          {/* Hébergement — masqué si null */}
          {etape.hebergement && (
            <Section
              icon="ti-bed"
              iconColor="#C9A96E"
              iconBg="rgba(201,169,110,0.1)"
              iconBorder="rgba(201,169,110,0.2)"
              title="Hébergement"
              count={1}
              open={openSections.has('hebergement')}
              onToggle={() => toggleSection('hebergement')}
            >
              <SectionItem
                title={etape.hebergement.nom}
                sub={[etape.hebergement.type, etape.hebergement.chambre].filter(Boolean).join(' · ')}
                extra={[
                  etape.hebergement.adresse,
                  etape.hebergement.petit_dejeuner ? 'Petit-déjeuner inclus' : null,
                  etape.hebergement.confirmation ? `Réf: ${etape.hebergement.confirmation}` : null,
                ].filter(Boolean).join(' · ') || undefined}
              />
            </Section>
          )}

          {/* Restaurants */}
          <Section
            icon="ti-tools-kitchen-2"
            iconColor="#378ADD"
            iconBg="rgba(55,138,221,0.1)"
            iconBorder="rgba(55,138,221,0.2)"
            title="Restaurants"
            count={etape.restaurants.length}
            open={openSections.has('restaurants')}
            onToggle={() => toggleSection('restaurants')}
          >
            {etape.restaurants.map(r => (
              <SectionItem key={r.id} title={r.nom} sub={r.type} />
            ))}
          </Section>

          {/* Activités */}
          <Section
            icon="ti-mountain"
            iconColor="#1D9E75"
            iconBg="rgba(29,158,117,0.1)"
            iconBorder="rgba(29,158,117,0.2)"
            title="Activités"
            count={etape.activites.length}
            open={openSections.has('activites')}
            onToggle={() => toggleSection('activites')}
          >
            {etape.activites.map(a => (
              <SectionItem key={a.id} title={a.nom} sub={[a.type, a.duree].filter(Boolean).join(' · ')} />
            ))}
          </Section>

          <div style={{ height: 8 }} />
          <div className={styles.divider} />
          <p className={styles.secLabel}>Notes</p>
          <div className={styles.notesBlock}>
            <textarea
              className={styles.notesArea}
              value={notesValue}
              onChange={e => setNotesValue(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Ajouter des notes..."
              rows={3}
            />
          </div>

          <button className={styles.discBtn} disabled>
            <i className="ti ti-sparkles" style={{ fontSize: 15, color: 'var(--gold)' }} />
            Découverte autour de {etape.titre}
          </button>

          <div style={{ height: 12 }} />
        </div>
      </div>
      <TabBar activeScreen={activeScreen} onTabChange={onTabChange} />
    </div>
  )
}

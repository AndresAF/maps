import { getCategoryById } from '../utils/storage'
import './PlaceCard.css'

// Rich descriptions & extra facts per landmark id
const DETAILS = {
  'default-1':  { extra: 'Built in the late 19th century, this ornate kiosk is the social heart of Coyoacán. Weekend crowds fill the square with music and street food.' },
  'default-2':  { extra: 'Flanked by colonial arcades and colorful facades, the plaza hosts artisan markets every Saturday and Sunday.' },
  'default-3':  { extra: 'Known as the Casa de Cortés, this palace-turned-city-hall dates to the 1500s and sits on the former Aztec ceremonial center.' },
  'default-4':  { extra: 'Trotsky lived here from 1939 until his assassination in 1940. His study, fortress walls, and personal belongings remain intact.' },
  'default-5':  { extra: 'Set inside a 16th-century hacienda, this cultural center runs free workshops, art exhibitions, and open-air concerts year-round.' },
  'default-6':  { extra: 'The only museum in Mexico dedicated exclusively to watercolor art, with over 2 000 works spanning Mexican masters and international artists.' },
  'default-7':  { extra: 'Housed in the Ex-Convento de Churubusco, this museum covers eight foreign interventions on Mexican soil — from Spanish conquest to the 20th century.' },
  'default-8':  { extra: 'A small gem tucked inside a restored colonial inn, featuring rotating exhibitions on Coyoacán\'s artistic and bohemian history.' },
  'default-9':  { extra: 'Legend says a ghost haunts this narrow cobblestone alley at night. By day it is one of the most photographed streets in the neighborhood.' },
  'default-10': { extra: 'Founded in 1522 — just one year after the fall of Tenochtitlan — this convent and its dramatic arches predate almost every other building in the district.' },
  'default-11': { extra: 'Part of the UNAM campus — a UNESCO World Heritage Site. MUAC shows cutting-edge Mexican and Latin American art across 10 000 m².' },
  'default-12': { extra: 'Mexico\'s largest science museum with interactive exhibits on biodiversity, cosmos, technology, and human evolution. Great for all ages.' },
  'default-13': { extra: 'A vintage-style electric tram that loops through Coyoacán\'s historic streets, narrating colonial history along the way. Departs from the main plaza.' },
  'default-14': { extra: 'One of the few neighborhoods in Mexico City that retains its pre-Hispanic street grid. Home to Frida Kahlo, Diego Rivera, and countless writers.' },
}

export default function PlaceCard({ landmark, onClose, onDirections }) {
  if (!landmark) return null
  const cat = getCategoryById(landmark.category)
  const detail = DETAILS[landmark.id] || {}

  return (
    <div className="place-card-overlay fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="place-card slide-up">
        <div className="pc-drag-handle" />

        {/* Color band */}
        <div className="pc-band" style={{ background: cat.color }}>
          <span className="pc-band-emoji">{cat.emoji}</span>
          <button className="pc-close" onClick={onClose}>✕</button>
        </div>

        <div className="pc-body">
          <span className="pc-cat-label" style={{ color: cat.color }}>{cat.label}</span>
          <h2 className="pc-title">{landmark.title}</h2>

          {landmark.description && (
            <p className="pc-desc">{landmark.description}</p>
          )}

          {detail.extra && (
            <p className="pc-extra">{detail.extra}</p>
          )}

          {landmark.tags?.length > 0 && (
            <div className="pc-tags">
              {landmark.tags.map(t => <span key={t} className="pc-tag">#{t}</span>)}
            </div>
          )}

          <div className="pc-coords">
            <span>📍</span>
            <span>{landmark.lat.toFixed(5)}° N, {Math.abs(landmark.lng).toFixed(5)}° W</span>
          </div>
        </div>

        <div className="pc-footer">
          <button className="pc-btn-dir" onClick={() => { onDirections(landmark); onClose() }}>
            <span>🧭</span> Get directions
          </button>
        </div>
      </div>
    </div>
  )
}

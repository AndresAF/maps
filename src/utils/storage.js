const KEY = 'landmarks_v2'

export const DEFAULT_LANDMARKS = [
  { id: 'default-1',  title: 'Coyoacán Kiosk',                                lat: 19.3494, lng: -99.1621, category: 'historical',  description: 'Iconic kiosk in the heart of Coyoacán.',            tags: ['plaza','coyoacan'], images: [], createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 'default-2',  title: 'Coyoacán Plaza',                                lat: 19.3489, lng: -99.1618, category: 'culture',     description: 'Main square and tourist hub of Coyoacán.',          tags: ['plaza','tourist'], images: [], createdAt: '2024-01-01T00:00:01.000Z' },
  { id: 'default-3',  title: "Hernán Cortés' House",                           lat: 19.3495, lng: -99.1620, category: 'historical',  description: 'Colonial-era landmark tied to the conquest.',       tags: ['colonial','history'], images: [], createdAt: '2024-01-01T00:00:02.000Z' },
  { id: 'default-4',  title: "Leon Trotsky's House Museum",                    lat: 19.3466, lng: -99.1617, category: 'culture',     description: 'Former home and final refuge of Leon Trotsky.',     tags: ['museum','history'], images: [], createdAt: '2024-01-01T00:00:03.000Z' },
  { id: 'default-5',  title: 'Jesús Reyes Heroles Cultural Center',            lat: 19.3490, lng: -99.1670, category: 'culture',     description: 'Cultural center with exhibitions and events.',      tags: ['culture','art'], images: [], createdAt: '2024-01-01T00:00:04.000Z' },
  { id: 'default-6',  title: 'Alfredo Guati Rojo National Watercolor Museum',  lat: 19.3487, lng: -99.1594, category: 'culture',     description: 'Dedicated to Mexican watercolor painting.',         tags: ['museum','art'], images: [], createdAt: '2024-01-01T00:00:05.000Z' },
  { id: 'default-7',  title: 'National Museum of Interventions',               lat: 19.3460, lng: -99.1518, category: 'historical',  description: 'Covers foreign interventions in Mexican history.',  tags: ['museum','history'], images: [], createdAt: '2024-01-01T00:00:06.000Z' },
  { id: 'default-8',  title: 'Coyoacán Posada Museum',                        lat: 19.3482, lng: -99.1602, category: 'culture',     description: 'Charming museum inside a colonial posada.',         tags: ['museum','colonial'], images: [], createdAt: '2024-01-01T00:00:07.000Z' },
  { id: 'default-9',  title: 'Callejón del Aguacate',                          lat: 19.3508, lng: -99.1653, category: 'historical',  description: 'Picturesque historic alley in Coyoacán.',           tags: ['alley','historic'], images: [], createdAt: '2024-01-01T00:00:08.000Z' },
  { id: 'default-10', title: 'Arcos of the Ex-Convent of San Juan Bautista',     lat: 19.3500, lng: -99.1647, category: 'historical',  description: '16th-century convent arches, a colonial gem.',      tags: ['colonial','architecture'], images: [], createdAt: '2024-01-01T00:00:09.000Z' },
  { id: 'default-11', title: 'University Museum of Contemporary Art',          lat: 19.3147, lng: -99.1859, category: 'culture',     description: 'Contemporary art at UNAM campus.',                  tags: ['museum','contemporary','unam'], images: [], createdAt: '2024-01-01T00:00:10.000Z' },
  { id: 'default-12', title: 'Universum',                                      lat: 19.3113, lng: -99.1806, category: 'culture',     description: 'Science museum on the UNAM campus.',                tags: ['museum','science','unam'], images: [], createdAt: '2024-01-01T00:00:11.000Z' },
  { id: 'default-13', title: 'Coyoacán Tram',                                 lat: 19.3492, lng: -99.1620, category: 'viewpoint',   description: 'Hop-on tourist tram touring Coyoacán.',             tags: ['tourist','tour'], images: [], createdAt: '2024-01-01T00:00:12.000Z' },
  { id: 'default-14', title: 'Coyoacán Historic District',                     lat: 19.3500, lng: -99.1620, category: 'historical',  description: 'One of the best-preserved colonial districts in CDMX.', tags: ['district','colonial'], images: [], createdAt: '2024-01-01T00:00:13.000Z' },
]

export const loadLandmarks = () => {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Return defaults if stored data is empty or invalid
      if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
        return DEFAULT_LANDMARKS
      }
      return parsed
    }
  } catch {}
  return DEFAULT_LANDMARKS
}

export const saveLandmarks = (landmarks) => {
  try { localStorage.setItem(KEY, JSON.stringify(landmarks)) } catch {}
}


export const CATEGORIES = [
  { id: 'viewpoint',   label: 'Viewpoint',     emoji: '🏔️',  color: '#01a0e0' },
  { id: 'food',        label: 'Food & Drink',  emoji: '🍜',  color: '#feb615' },
  { id: 'culture',     label: 'Culture',       emoji: '🏛️',  color: '#704e9f' },
  { id: 'nature',      label: 'Nature',        emoji: '🌿',  color: '#52d68a' },
  { id: 'adventure',   label: 'Adventure',     emoji: '🧗',  color: '#e91e2c' },
  { id: 'hidden',      label: 'Hidden Gem',    emoji: '💎',  color: '#01a0e0' },
  { id: 'historical',  label: 'Historical',    emoji: '🏰',  color: '#e91e2c' },
  { id: 'other',       label: 'Other',         emoji: '📍',  color: '#90a4ae' },
]

export const getCategoryLabel = (categoryId, t) => {
  const cat = CATEGORIES.find(c => c.id === categoryId)
  if (!cat) return 'Other'
  return t[categoryId] || cat.label
}

export const getCategoryById = (id) =>
  CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]

export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

import { divIcon } from 'leaflet'
import { Marker } from 'react-leaflet'
import { getCategoryById } from '../utils/storage'
import './LandmarkMarker.css'

function createMarkerIcon(landmark, isSelected, translatedTitle, hasEvent) {
  const cat = getCategoryById(landmark.category)
  const sel = isSelected ? 'selected' : ''
  const title = translatedTitle || landmark.title
  const label = title.length > 18 ? title.slice(0, 16) + '…' : title
  const eventBadge = hasEvent
    ? '<div class="marker-event-dot"><div class="marker-event-ring"></div></div>'
    : ''

  const html = `
    <div class="marker-wrap ${sel}">
      <div class="marker-bubble" style="background:${cat.color}">
        <span class="marker-glyph">${cat.emoji}</span>
        ${eventBadge}
      </div>
      <div class="marker-stem"></div>
      <div class="marker-label">${label}</div>
    </div>`

  const w = isSelected ? 130 : 124
  const h = isSelected ? 88 : 80
  return divIcon({
    html,
    className: '',
    iconSize: [w, h],
    iconAnchor: [w / 2, isSelected ? 62 : 54],
    popupAnchor: [0, -60],
  })
}

export default function LandmarkMarker({ landmark, isSelected, onSelect, translatedTitle, hasEvent }) {
  return (
    <Marker
      position={[landmark.lat, landmark.lng]}
      icon={createMarkerIcon(landmark, isSelected, translatedTitle, hasEvent)}
      eventHandlers={{ click: () => onSelect(landmark) }}
      zIndexOffset={isSelected ? 1000 : 0}
    />
  )
}

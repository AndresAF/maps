import { divIcon } from 'leaflet'
import { Marker } from 'react-leaflet'
import { getCategoryById } from '../utils/storage'
import './LandmarkMarker.css'

function createMarkerIcon(landmark, isSelected, translatedTitle) {
  const cat = getCategoryById(landmark.category)
  const sel = isSelected ? 'selected' : ''
  // Short label — first 18 chars
  const title = translatedTitle || landmark.title
  const label = title.length > 18 ? title.slice(0, 16) + '…' : title

  const html = `
    <div class="marker-wrap ${sel}">
      <div class="marker-bubble" style="background:${cat.color}">
        <span class="marker-glyph">${cat.emoji}</span>
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

export default function LandmarkMarker({ landmark, isSelected, onSelect, translatedTitle }) {
  return (
    <Marker
      position={[landmark.lat, landmark.lng]}
      icon={createMarkerIcon(landmark, isSelected, translatedTitle)}
      eventHandlers={{ click: () => onSelect(landmark) }}
      zIndexOffset={isSelected ? 1000 : 0}
    />
  )
}

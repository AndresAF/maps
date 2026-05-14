import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, useMap, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLandmarks } from './hooks/useLandmarks'
import LandmarkMarker from './components/LandmarkMarker'
import Sidebar from './components/Sidebar'
import DirectionsPanel from './components/DirectionsPanel'
import PlaceCard from './components/PlaceCard'
import './App.css'

function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 16), { duration: 1.2 })
  }, [target])
  return null
}

function FitBoundsControl({ landmarks }) {
  const map = useMap()
  return (
    <button
      className="btn-fit"
      title="Fit all landmarks"
      onClick={() => {
        const bounds = L.latLngBounds(landmarks.map(l => [l.lat, l.lng]))
        map.flyToBounds(bounds, { padding: [60, 80], duration: 1.5 })
      }}
    >⊡</button>
  )
}

const userDotIcon = L.divIcon({
  html: `<div class="user-dot"><div class="user-pulse"></div></div>`,
  className: '', iconSize: [20, 20], iconAnchor: [10, 10]
})

export default function App() {
  const { landmarks } = useLandmarks()
  const [selectedLandmark, setSelectedLandmark] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [flyTarget, setFlyTarget] = useState(null)
  const [directionsTo, setDirectionsTo] = useState(null)
  const [userPos, setUserPos] = useState(null)
  const [routeCoords, setRouteCoords] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported')
      return
    }
    const id = navigator.geolocation.watchPosition(
      pos => {
        console.log('Location updated:', [pos.coords.latitude, pos.coords.longitude])
        setUserPos([pos.coords.latitude, pos.coords.longitude])
      },
      err => {
        console.error('Geolocation error:', err.message)
      },
      { enableHighAccuracy: true }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  const handleSelect = useCallback((landmark) => {
    setSelectedLandmark(landmark)
    setFlyTarget({ ...landmark, ts: Date.now() })
    setDirectionsTo(null)
    setRouteCoords(null)
  }, [])

  const handleSelectFromSidebar = useCallback((landmark) => {
    setSelectedLandmark(landmark)
    setFlyTarget({ ...landmark, ts: Date.now() })
    setDirectionsTo(null)
    setRouteCoords(null)
  }, [])

  const handleDirections = useCallback((landmark) => {
    if (!userPos) {
      alert('Enable location access to get directions from your current position.')
      return
    }
    setDirectionsTo(landmark)
    setSelectedLandmark(null)
    setRouteCoords(null)
    // Fly to user location when directions start
    setFlyTarget({ lat: userPos[0], lng: userPos[1], ts: Date.now() })
  }, [userPos])

  const handleCloseDirections = useCallback(() => {
    setDirectionsTo(null)
    setRouteCoords(null)
  }, [])

  const fromCoords = useMemo(() => 
    userPos ? { lat: userPos[0], lng: userPos[1] } : null
  , [userPos])

  return (
    <div className="app">
      <header className="topbar">
        <button className="topbar-menu" onClick={() => setSidebarOpen(true)}>
          <span /><span /><span />
        </button>
        <div className="topbar-brand">
          <span className="topbar-logo">◈</span>
          <span className="topbar-name">Coyoacán</span>
        </div>
        <span className="topbar-counter">{landmarks.length} places</span>
      </header>

      <div className="map-wrapper">
        <MapContainer
          center={[19.34915, -99.16178]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          attributionControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          {flyTarget && <FlyTo target={flyTarget} />}

          {routeCoords && (
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: '#4285f4', weight: 5, opacity: 0.9 }}
            />
          )}

          {userPos && (
            <Marker position={userPos} icon={userDotIcon} zIndexOffset={2000} />
          )}

          {landmarks.map(l => (
            <LandmarkMarker
              key={l.id}
              landmark={l}
              isSelected={selectedLandmark?.id === l.id}
              onSelect={handleSelect}
            />
          ))}

          <FitBoundsControl landmarks={landmarks} />
        </MapContainer>

        {/* Place info card */}
        {selectedLandmark && !directionsTo && (
          <PlaceCard
            landmark={selectedLandmark}
            onClose={() => setSelectedLandmark(null)}
            onDirections={handleDirections}
          />
        )}

        {/* Directions panel */}
        {directionsTo && fromCoords && (
          <DirectionsPanel
            from={fromCoords}
            to={directionsTo}
            onClose={handleCloseDirections}
            onRouteReady={setRouteCoords}
            userPos={userPos}
          />
        )}
      </div>

      <Sidebar
        landmarks={landmarks}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectLandmark={handleSelectFromSidebar}
        onDirections={handleDirections}
      />
    </div>
  )
}

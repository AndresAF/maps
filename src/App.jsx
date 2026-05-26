import { useState, useRef, useCallback, useEffect, useMemo, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MapContainer, TileLayer, Polyline, useMap, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLandmarks } from './hooks/useLandmarks'
import { loadLandmarks } from './utils/storage'
import LandmarkMarker from './components/LandmarkMarker'
import Sidebar from './components/Sidebar'
import DirectionsPanel from './components/DirectionsPanel'
import PlaceCard from './components/PlaceCard'
import InboxPanel from './components/InboxPanel'
import AdminPage from './pages/AdminPage'
import { translations } from './utils/translations'
import './App.css'
import logoCoyoacan from './assets/logocoyoacan.png'
import lightModeIcon from './assets/light-mode.png'
import darkModeIcon from './assets/night.png'

const LanguageContext = createContext()

export const useLanguage = () => useContext(LanguageContext)

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

function LocateControl({ userPos }) {
  const map = useMap()
  if (!userPos) return null
  return (
    <button
      className="btn-locate"
      title="Go to my location"
      onClick={() => {
        map.flyTo([userPos[0], userPos[1]], 17, { duration: 1.2 })
      }}
    >◎</button>
  )
}

const userDotIcon = L.divIcon({
  html: `<div class="user-dot"><div class="user-pulse"></div></div>`,
  className: '', iconSize: [20, 20], iconAnchor: [10, 10]
})

export default function App() {
  const { landmarks } = useLandmarks()
  const [landmarksState, setLandmarksState] = useState(landmarks || [])
  const [selectedLandmark, setSelectedLandmark] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [flyTarget, setFlyTarget] = useState(null)
  const [directionsTo, setDirectionsTo] = useState(null)
  const [userPos, setUserPos] = useState(null)
  const [routeCoords, setRouteCoords] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [language, setLanguage] = useState('es')

  const t = translations[language]

  // Sync landmarks state when landmarks from hook changes
  useEffect(() => {
    if (landmarks && landmarks.length > 0) {
      setLandmarksState(landmarks)
    }
  }, [landmarks])

  useEffect(() => {
    // Apply theme class to root element
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

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
      alert(t.enableLocation)
      return
    }
    setDirectionsTo(landmark)
    setSelectedLandmark(null)
    setRouteCoords(null)
    // Fly to user location when directions start
    setFlyTarget({ lat: userPos[0], lng: userPos[1], ts: Date.now() })
  }, [userPos, t])

  const handleCloseDirections = useCallback(() => {
    setDirectionsTo(null)
    setRouteCoords(null)
  }, [])

  const fromCoords = useMemo(() => 
    userPos ? { lat: userPos[0], lng: userPos[1] } : null
  , [userPos])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <Routes>
        <Route path="/" element={
          <div className="app">
            <header className="topbar">
              <button className="topbar-menu" onClick={() => setSidebarOpen(true)}>
                <span /><span /><span />
              </button>
              <div className="topbar-brand">
                <img src={logoCoyoacan} alt="Coyoacán" className="topbar-logo-img" />
              </div>
              <select 
                className="topbar-lang-select" 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                title="Select language"
              >
                <option value="en">EN</option>
                <option value="es">ES</option>
              </select>
              <InboxPanel 
                landmarks={landmarksState}
                onFlyTo={(landmarkId) => { 
                  const lm = landmarksState.find(l => l.id === landmarkId); 
                  if (lm) handleSelect(lm); 
                  setSidebarOpen(false); 
                }}
              />
              <button className="topbar-theme" onClick={() => setIsDarkMode(!isDarkMode)} title="Toggle theme">
                <img src={isDarkMode ? lightModeIcon : darkModeIcon} alt={isDarkMode ? 'Light mode' : 'Dark mode'} className="topbar-theme-icon" />
              </button>
              <span className="topbar-counter">{landmarksState.length} {t.places}</span>
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
                  key={isDarkMode ? 'dark' : 'light'}
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url={isDarkMode 
                    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  }
                  maxZoom={19}
                />
                {flyTarget && <FlyTo target={flyTarget} />}

                {routeCoords && (
                  <Polyline
                    positions={routeCoords}
                    pathOptions={{ color: '#01a0e0', weight: 5, opacity: 0.9 }}
                  />
                )}

                {userPos && (
                  <Marker position={userPos} icon={userDotIcon} zIndexOffset={2000} />
                )}

                {landmarksState.map(l => (
                  <LandmarkMarker
                    key={`${l.id}-${l.title}`}
                    landmark={l}
                    isSelected={selectedLandmark?.id === l.id}
                    onSelect={handleSelect}
                    translatedTitle={t[`${l.id}-title`] || l.title}
                  />
                ))}

                <FitBoundsControl landmarks={landmarksState} />
                <LocateControl userPos={userPos} />
              </MapContainer>

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

            {/* Place info card */}
            {selectedLandmark && !directionsTo && (
              <PlaceCard
                landmark={selectedLandmark}
                onClose={() => setSelectedLandmark(null)}
                onDirections={handleDirections}
              />
            )}

            <Sidebar
              landmarks={landmarksState}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              onSelectLandmark={handleSelectFromSidebar}
              onDirections={handleDirections}
            />
          </div>
        } />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </LanguageContext.Provider>
  )
}

import { useState, useRef, useCallback, useEffect, useMemo, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MapContainer, TileLayer, Polyline, useMap, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { gsap } from 'gsap'
import { useLandmarks } from './hooks/useLandmarks'
import { isExpired } from './utils/notifications'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import IntroAnimation from './components/IntroAnimation'
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

function calculateBearing(from, to) {
  const lat1 = from[0] * Math.PI / 180
  const lat2 = to[0] * Math.PI / 180
  const dLng = (to[1] - from[1]) * Math.PI / 180
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

function NavigationFollower({ userPos, isNavigating }) {
  const map = useMap()
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!isNavigating) { initializedRef.current = false; return }
    if (!userPos) return
    if (!initializedRef.current) {
      map.flyTo(userPos, Math.max(map.getZoom(), 17), { duration: 1.2 })
      initializedRef.current = true
    } else {
      map.panTo(userPos, { animate: true, duration: 0.8 })
    }
  }, [userPos, isNavigating])

  return null
}

export default function App() {
  const { landmarks } = useLandmarks()
  const [landmarksState, setLandmarksState] = useState(landmarks || [])
  const [showIntro, setShowIntro] = useState(true)
  const [selectedLandmark, setSelectedLandmark] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [flyTarget, setFlyTarget] = useState(null)
  const [directionsTo, setDirectionsTo] = useState(null)
  const [userPos, setUserPos] = useState(null)
  const [routeCoords, setRouteCoords] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [language, setLanguage] = useState('es')
  const [eventLandmarkIds, setEventLandmarkIds] = useState(new Set())
  const [isNavigating, setIsNavigating] = useState(false)
  const [heading, setHeading] = useState(null)
  const prevUserPosRef = useRef(null)
  const topbarRef = useRef(null)

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
    const unsub = onSnapshot(collection(db, 'notifications'), (snap) => {
      const notifs = snap.docs.map(d => d.data())
      const ids = new Set(notifs.filter(n => !isExpired(n) && n.landmarkId).map(n => n.landmarkId))
      setEventLandmarkIds(ids)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported')
      return
    }
    const id = navigator.geolocation.watchPosition(
      pos => {
        const newPos = [pos.coords.latitude, pos.coords.longitude]
        if (prevUserPosRef.current) {
          const h = calculateBearing(prevUserPosRef.current, newPos)
          setHeading(h)
        }
        prevUserPosRef.current = newPos
        setUserPos(newPos)
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
    setIsNavigating(false)
  }, [])

  const userIcon = useMemo(() => {
    if (isNavigating) {
      const angle = heading ?? 0
      return L.divIcon({
        html: `<div class="user-nav-arrow" style="transform:rotate(${angle}deg)">
          <svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 2L20 24L11 18L2 24L11 2Z" fill="#4fc3f7" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
          </svg>
        </div>`,
        className: '',
        iconSize: [22, 28],
        iconAnchor: [11, 14],
      })
    }
    return userDotIcon
  }, [isNavigating, heading])

  const fromCoords = useMemo(() =>
    userPos ? { lat: userPos[0], lng: userPos[1] } : null
  , [userPos])

  useEffect(() => {
    if (!showIntro && topbarRef.current) {
      gsap.fromTo(
        Array.from(topbarRef.current.children),
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' }
      )
    }
  }, [showIntro])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <Routes>
        
        <Route path="/" element={
          
         <>
  {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}
  <div className="app">
    <header className="topbar" ref={topbarRef}>
      <button className="topbar-menu" onClick={() => setSidebarOpen(true)}>
        <span /><span /><span />
      </button>
      <div className="topbar-brand">
        <img src={logoCoyoacan} alt="Coyoacán" className="topbar-logo-img" />
      </div>
      <div className="topbar-lang">
        <select className="lang-select" value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="es">ES</option>
          <option value="en">EN</option>
        </select>
      </div>
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
          <Marker position={userPos} icon={userIcon} zIndexOffset={2000} />
        )}

        <NavigationFollower userPos={userPos} isNavigating={isNavigating} />

        {landmarksState.map(l => (
          <LandmarkMarker
            key={`${l.id}-${l.title}`}
            landmark={l}
            isSelected={selectedLandmark?.id === l.id}
            onSelect={handleSelect}
            translatedTitle={l.customTitle ? l.title : (t[`${l.id}-title`] || l.title)}
            hasEvent={eventLandmarkIds.has(l.id)}
          />
        ))}

        <FitBoundsControl landmarks={landmarksState} />
        <LocateControl userPos={userPos} />
      </MapContainer>

      {directionsTo && fromCoords && (
        <DirectionsPanel
          from={fromCoords}
          to={directionsTo}
          onClose={handleCloseDirections}
          onRouteReady={setRouteCoords}
          userPos={userPos}
          isNavigating={isNavigating}
          onToggleNavigation={() => setIsNavigating(n => !n)}
        />
      )}
    </div>

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
</>
        } />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </LanguageContext.Provider>
  )
}

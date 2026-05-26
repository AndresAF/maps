import { useState, useEffect } from 'react'
import { useLanguage } from '../App'
import './DirectionsPanel.css'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1'

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function parseSteps(legs, t) {
  const steps = []
  for (const leg of legs) {
    for (const step of leg.steps) {
      const name = step.name || ''
      const maneuver = step.maneuver
      const type = maneuver.type
      const modifier = maneuver.modifier || ''
      steps.push({
        instruction: buildInstruction(type, modifier, name, t),
        distance: step.distance,
        icon: getIcon(type, modifier),
      })
    }
  }
  return steps.filter(s => s.distance > 0 || s.instruction)
}

function buildInstruction(type, modifier, name, t) {
  const street = name ? ` ${t.dirOnto} ${name}` : ''
  const on = name ? ` ${t.dirOn} ${name}` : ''
  switch (type) {
    case 'depart':         return `${t.dirStart}${on}`
    case 'arrive':         return t.dirArrive
    case 'turn':
      if (modifier === 'left')        return `${t.dirTurnLeft}${street}`
      if (modifier === 'right')       return `${t.dirTurnRight}${street}`
      if (modifier === 'slight left') return `${t.dirSlightLeft}${street}`
      if (modifier === 'slight right')return `${t.dirSlightRight}${street}`
      if (modifier === 'sharp left')  return `${t.dirSharpLeft}${street}`
      if (modifier === 'sharp right') return `${t.dirSharpRight}${street}`
      if (modifier === 'uturn')       return t.dirUTurn
      return `${t.dirTurn}${street}`
    case 'new name':       return `${t.dirContinue}${on}`
    case 'continue':       return `${t.dirContinueStraight}${on}`
    case 'merge':          return `${t.dirMerge}${street}`
    case 'on ramp':        return `${t.dirTakeRamp}${street}`
    case 'off ramp':       return `${t.dirTakeExit}${street}`
    case 'fork':
      if (modifier?.includes('left'))  return `Keep left${street}`
      if (modifier?.includes('right')) return `Keep right${street}`
      return `${t.dirFork}${street}`
    case 'end of road':
      if (modifier === 'left')  return `${t.dirTurnLeft} at end of road${street}`
      if (modifier === 'right') return `${t.dirTurnRight} at end of road${street}`
      return `End of road${street}`
    case 'roundabout':
    case 'rotary':         return `${t.dirRoundabout}${street}`
    case 'exit roundabout':return `Exit ${t.dirRoundabout}${street}`
    default:               return name ? `${t.dirContinue} ${t.dirOn} ${name}` : t.dirContinue
  }
}

function getIcon(type, modifier) {
  if (type === 'depart')  return '🚩'
  if (type === 'arrive')  return '🏁'
  if (type === 'roundabout' || type === 'rotary') return '🔄'
  if (type === 'exit roundabout') return '↗️'
  switch (modifier) {
    case 'left':        return '⬅️'
    case 'right':       return '➡️'
    case 'slight left': return '↖️'
    case 'slight right':return '↗️'
    case 'sharp left':  return '↩️'
    case 'sharp right': return '↪️'
    case 'uturn':       return '🔁'
    default:            return '⬆️'
  }
}

function getIconFromSign(sign) {
  if (!sign) return '⬆️'
  const signLower = sign.toLowerCase()
  if (signLower.includes('left')) return '⬅️'
  if (signLower.includes('right')) return '➡️'
  if (signLower.includes('uturn')) return '🔁'
  if (signLower.includes('roundabout')) return '🔄'
  if (signLower.includes('keep')) return '⬆️'
  if (signLower.includes('slight')) return signLower.includes('left') ? '↖️' : '↗️'
  if (signLower.includes('sharp')) return signLower.includes('left') ? '↩️' : '↪️'
  return '⬆️'
}

export default function DirectionsPanel({ from, to, onClose, onRouteReady, userPos }) {
  const { t } = useLanguage()
  const [mode, setMode] = useState('walking')
  const [steps, setSteps] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isLive, setIsLive] = useState(false)
  const [lastUserPos, setLastUserPos] = useState(null)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    if (!from || !to) return
    setIsLive(true)
    fetchRoute()
  }, [from, to, mode])

  // Auto-refresh route when user position changes significantly
  useEffect(() => {
    if (!userPos || !from || !to) return
    
    // Only refetch if position changed by more than 10 meters
    if (lastUserPos) {
      const R = 6371000
      const φ1 = lastUserPos[0] * Math.PI / 180
      const φ2 = userPos[0] * Math.PI / 180
      const Δφ = (userPos[0] - lastUserPos[0]) * Math.PI / 180
      const Δλ = (userPos[1] - lastUserPos[1]) * Math.PI / 180
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      const distance = R * c
      
      if (distance < 10) return // Don't refetch for small movements
    }
    
    setLastUserPos(userPos)
    // Update from coords and refetch
    fetchRoute()
  }, [userPos, from, to, mode])

  const fetchRoute = async () => {
    setLoading(true)
    setError(null)
    setSteps([])
    setSummary(null)
    try {
      const profile = mode === 'walking' ? 'foot' : 'car'
      // Use current user position if available, otherwise use initial from
      const currentFrom = userPos ? { lat: userPos[0], lng: userPos[1] } : from
      const url = `${OSRM_BASE}/${profile}/${currentFrom.lng},${currentFrom.lat};${to.lng},${to.lat}?steps=true&overview=full&geometries=geojson`
      console.log('Fetching route:', url)
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      console.log('Route response:', data)
      
      if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found')
      const route = data.routes[0]
      setSummary({ distance: route.distance, duration: route.duration })
      setSteps(parseSteps(route.legs, t))
      onRouteReady?.(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]))
    } catch (e) {
      console.error('Route fetch error:', e)
      // Fallback: show straight line if routing fails
      const straightLine = [[from.lat, from.lng], [to.lat, to.lng]]
      onRouteReady?.(straightLine)
      
      // Calculate approximate distance using Haversine formula
      const R = 6371000 // Earth's radius in meters
      const φ1 = from.lat * Math.PI / 180
      const φ2 = to.lat * Math.PI / 180
      const Δφ = (to.lat - from.lat) * Math.PI / 180
      const Δλ = (to.lng - from.lng) * Math.PI / 180
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      const distance = R * c
      
      setSummary({ distance, duration: distance / (mode === 'walking' ? 1.4 : 8.3) }) // Approximate speeds
      setSteps([
        { instruction: t.startLocation, distance: 0, icon: '🚩' },
        { instruction: `${t.headDirectlyTo} ${to.title}`, distance: distance, icon: '⬆️' },
        { instruction: t.arriveDestination, distance: 0, icon: '🏁' }
      ])
      
      if (e.name === 'AbortError') {
        setError(t.routingUnavailable)
      } else {
        setError(t.straightLineFallback)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`dir-panel slide-up ${isMinimized ? 'minimized' : ''}`}>
      <div className="dir-header">
        <div className="dir-title-row">
          <span className="dir-icon">🧭</span>
          <div className="dir-titles">
            <span className="dir-label">{t.directionsTo}</span>
            <span className="dir-dest">{to?.title}</span>
          </div>
          <button className="dir-minimize" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? '▲' : '▼'}
          </button>
          <button className="dir-end" onClick={() => { onClose(); onRouteReady?.(null); }}>
            {t.end}
          </button>
        </div>

        {!isMinimized && (
          <>
            <div className="dir-mode-row">
              {isLive && <span className="live-indicator">{t.live}</span>}
              <button
                className={`mode-btn ${mode === 'walking' ? 'active' : ''}`}
                onClick={() => setMode('walking')}
              >{t.walking}</button>
              <button
                className={`mode-btn ${mode === 'driving' ? 'active' : ''}`}
                onClick={() => setMode('driving')}
              >{t.driving}</button>
            </div>

            {summary && (
              <div className="dir-summary">
                <span className="summary-chip">📏 {formatDistance(summary.distance)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {!isMinimized && (
        <div className="dir-body">
          {loading && (
            <div className="dir-loading">
              <div className="dir-spinner" />
              <span>{t.findingRoute}</span>
            </div>
          )}
          {error && <div className="dir-error">{error}</div>}
          {steps.map((step, i) => (
            <div key={i} className={`dir-step ${step.icon === '🏁' ? 'last' : ''}`}>
              <span className="step-icon">{step.icon}</span>
              <div className="step-info">
                <span className="step-text">{step.instruction}</span>
                {step.distance > 0 && (
                  <span className="step-dist">{formatDistance(step.distance)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

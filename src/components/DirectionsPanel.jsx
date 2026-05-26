import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useLanguage } from '../App'
import './DirectionsPanel.css'

const OSRM_BASES = {
  walking: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
  driving: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function formatDuration(seconds) {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h ${m % 60}m`
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
  if (type === 'depart')  return '▶'
  if (type === 'arrive')  return '★'
  if (type === 'roundabout' || type === 'rotary') return '↻'
  if (type === 'exit roundabout') return '↗'
  switch (modifier) {
    case 'left':        return '←'
    case 'right':       return '→'
    case 'slight left': return '↖'
    case 'slight right':return '↗'
    case 'sharp left':  return '↩'
    case 'sharp right': return '↪'
    case 'uturn':       return '↺'
    default:            return '↑'
  }
}

export default function DirectionsPanel({ from, to, onClose, onRouteReady, userPos, isNavigating, onToggleNavigation }) {
  const { t } = useLanguage()
  const [mode, setMode] = useState('walking')
  const [steps, setSteps] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isLive, setIsLive] = useState(false)
  const [lastUserPos, setLastUserPos] = useState(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [stepsVisible, setStepsVisible] = useState(false)

  const panelRef = useRef(null)

  useEffect(() => {
    if (panelRef.current) {
      gsap.fromTo(panelRef.current,
        { y: '100%' },
        { y: 0, duration: 0.5, ease: 'expo.out' }
      )
    }
  }, [])

  useEffect(() => {
    if (!from || !to) return
    setIsLive(true)
    fetchRoute()
  }, [from, to, mode])

  useEffect(() => {
    if (!userPos || !from || !to) return
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
      if (R * c < 10) return
    }
    setLastUserPos(userPos)
    fetchRoute()
  }, [userPos, from, to, mode])

  const fetchRoute = async () => {
    setLoading(true)
    setError(null)
    setSteps([])
    setSummary(null)
    try {
      const currentFrom = userPos ? { lat: userPos[0], lng: userPos[1] } : from
      const url = `${OSRM_BASES[mode]}/${currentFrom.lng},${currentFrom.lat};${to.lng},${to.lat}?steps=true&overview=full&geometries=geojson`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found')
      const route = data.routes[0]
      setSummary({ distance: route.distance, duration: route.duration })
      setSteps(parseSteps(route.legs, t))
      onRouteReady?.(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]))
    } catch (e) {
      const straightLine = [[from.lat, from.lng], [to.lat, to.lng]]
      onRouteReady?.(straightLine)
      const R = 6371000
      const φ1 = from.lat * Math.PI / 180
      const φ2 = to.lat * Math.PI / 180
      const Δφ = (to.lat - from.lat) * Math.PI / 180
      const Δλ = (to.lng - from.lng) * Math.PI / 180
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      const distance = R * c
      setSummary({ distance, duration: distance / (mode === 'walking' ? 1.4 : 8.3) })
      setSteps([
        { instruction: t.startLocation, distance: 0, icon: '▶' },
        { instruction: `${t.headDirectlyTo} ${to.title}`, distance, icon: '↑' },
        { instruction: t.arriveDestination, distance: 0, icon: '★' }
      ])
      if (e.name === 'AbortError') setError(t.routingUnavailable)
      else setError(t.straightLineFallback)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    gsap.to(panelRef.current, {
      y: '100%', duration: 0.3, ease: 'power3.in',
      onComplete: () => { onClose(); onRouteReady?.(null) }
    })
  }

  return (
    <div
      className={`dir-panel${isMinimized ? ' minimized' : ''}`}
      ref={panelRef}
      style={{ transform: 'translateY(100%)' }}
    >
      <div className="dir-handle" />

      <div className="dir-header">

        {/* Destination + live indicator */}
        <div className="dir-top-row">
          <div className="dir-dest-info">
            <span className="dir-label">{t.directionsTo}</span>
            <h3 className="dir-dest">{to?.title}</h3>
          </div>
          {isLive && <span className="dir-live-dot" title={t.live} />}
        </div>

        {/* Navigation status bar */}
        {isNavigating && (
          <div className="dir-nav-status">
            <span className="dir-nav-status-dot" />
            <span>{t.navigating}</span>
          </div>
        )}

        {/* Mode + summary — hidden when minimized */}
        {!isMinimized && (
          <>
            <div className="dir-mode-row">
              <button
                className={`mode-btn${mode === 'walking' ? ' active walking' : ''}`}
                onClick={() => setMode('walking')}
              >
                {t.walking}
              </button>
              <button
                className={`mode-btn${mode === 'driving' ? ' active driving' : ''}`}
                onClick={() => setMode('driving')}
              >
                {t.driving}
              </button>
            </div>

            {summary && (
              <div className="dir-summary">
                <div className="summary-chip dist">
                  <strong>{formatDistance(summary.distance)}</strong>
                </div>
                <div className="summary-chip time">
                  <strong>{formatDuration(summary.duration)}</strong>
                </div>
              </div>
            )}
          </>
        )}

        {/* Action button row — always visible */}
        <div className="dir-btn-row">
          <button
            className={`dir-action-btn dir-action-nav${isNavigating ? ' active' : ''}`}
            onClick={onToggleNavigation}
          >
            <span className="dir-action-icon">{isNavigating ? '■' : '▶'}</span>
            {isNavigating ? t.stopNavigation : t.navigate}
          </button>
          <button
            className="dir-action-btn dir-action-hide"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <span className="dir-action-icon">{isMinimized ? '▲' : '▽'}</span>
            {isMinimized ? t.show : t.hide}
          </button>
          <button className="dir-action-btn dir-action-close" onClick={handleClose}>
            <span className="dir-action-icon">✕</span>
            {t.close}
          </button>
        </div>

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

          {steps.length > 0 && (
            <div className="dir-steps-row">
              <button
                className="dir-steps-toggle"
                onClick={() => setStepsVisible(v => !v)}
              >
                <span>{stepsVisible ? t.hideSteps : t.showSteps}</span>
                <span className="dir-steps-toggle-arrow">{stepsVisible ? '▲' : '▼'}</span>
              </button>
            </div>
          )}

          {stepsVisible && (
            <div className="dir-steps">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`dir-step${i === 0 ? ' first' : ''}${i === steps.length - 1 ? ' last' : ''}`}
                >
                  <div className="step-bubble">{step.icon}</div>
                  <div className="step-content">
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
      )}
    </div>
  )
}

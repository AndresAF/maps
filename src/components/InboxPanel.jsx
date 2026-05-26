import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { loadNotifications, isExpired } from '../utils/notifications'
import { useLanguage } from '../App'
import notifLight from '../assets/not-light.png'
import notifDark from '../assets/not-dark.png'
import locLight from '../assets/loc-brigth.png'
import locDark from '../assets/loc-dark.png'
import './InboxPanel.css'

export default function InboxPanel({ landmarks, onFlyTo }) {
  const { t, language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [selectedNotif, setSelectedNotif] = useState(null)
  const trayRef = useRef(null)
  const cardOverlayRef = useRef(null)
  const cardRef = useRef(null)

  useEffect(() => {
    setNotifications(loadNotifications())
    const handleStorageChange = (e) => {
      if (e.key === 'notifications' || e.key === null) setNotifications(loadNotifications())
    }
    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(() => setNotifications(loadNotifications()), 2000)
    return () => { window.removeEventListener('storage', handleStorageChange); clearInterval(interval) }
  }, [])

  const activeNotifications = notifications.filter(n => !isExpired(n))

  useEffect(() => {
    if (isOpen && trayRef.current) {
      gsap.fromTo(trayRef.current,
        { opacity: 0, y: -10, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power3.out' }
      )
    }
  }, [isOpen])

  const handleCloseTray = () => {
    if (!trayRef.current) { setIsOpen(false); return }
    gsap.to(trayRef.current, {
      opacity: 0, y: -8, scale: 0.96, duration: 0.18, ease: 'power2.in',
      onComplete: () => setIsOpen(false)
    })
  }

  useEffect(() => {
    if (selectedNotif && cardOverlayRef.current && cardRef.current) {
      gsap.fromTo(cardOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: 'power2.out' })
      gsap.fromTo(cardRef.current,
        { opacity: 0, scale: 0.85, y: 28 },
        { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: 'back.out(1.5)' }
      )
    }
  }, [selectedNotif])

  const handleCloseCard = () => {
    if (!cardRef.current) { setSelectedNotif(null); return }
    gsap.to(cardOverlayRef.current, { opacity: 0, duration: 0.2 })
    gsap.to(cardRef.current, {
      opacity: 0, scale: 0.9, y: 16, duration: 0.2, ease: 'power2.in',
      onComplete: () => setSelectedNotif(null)
    })
  }

  const handleOpenNotif = (notif) => {
    setIsOpen(false)
    setSelectedNotif(notif)
  }

  const handleSeeLocation = (landmarkId) => {
    handleCloseCard()
    setTimeout(() => onFlyTo(landmarkId), 250)
  }

  const formatExpiry = (expiresAt) => {
    const locale = language === 'es' ? 'es-MX' : 'en-US'
    const date = new Date(expiresAt)
    const diff = date - Date.now()
    const hours = Math.ceil(diff / (1000 * 60 * 60))
    const dateStr = date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    const timeStr = date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
    if (hours < 1) return `${t.inboxExpiresSoon} · ${dateStr} ${timeStr}`
    if (hours < 24) return `${t.inboxExpiresIn} ${hours}h · ${timeStr}`
    return `${t.inboxExpires} ${dateStr} ${t.inboxAt} ${timeStr}`
  }

  const linkedLandmark = selectedNotif?.landmarkId
    ? landmarks.find(l => l.id === selectedNotif.landmarkId)
    : null

  return (
    <>
      <div className="inbox-container">
        <button
          className="inbox-bell"
          onClick={() => isOpen ? handleCloseTray() : setIsOpen(true)}
          title="Notifications"
        >
          <img src={notifLight} alt="Notifications" className="inbox-bell-icon light-only" />
          <img src={notifDark} alt="Notifications" className="inbox-bell-icon dark-only" />
          {activeNotifications.length > 0 && !isOpen && (
            <span className="inbox-badge">{activeNotifications.length}</span>
          )}
        </button>

        {isOpen && (
          <div className="inbox-tray" ref={trayRef}>
            <div className="inbox-tray-header">
              <span className="inbox-tray-title">{t.notifications}</span>
              <button className="inbox-tray-close" onClick={handleCloseTray}>✕</button>
            </div>
            {activeNotifications.length === 0 ? (
              <div className="inbox-empty">{t.inboxNoNotifications}</div>
            ) : (
              <div className="inbox-tray-list">
                {activeNotifications.map(n => {
                  const linked = n.landmarkId ? landmarks.find(l => l.id === n.landmarkId) : null
                  return (
                    <button key={n.id} className="inbox-tray-item" onClick={() => handleOpenNotif(n)}>
                      <div className="inbox-tray-item-top">
                        <span className="inbox-tray-item-title">{n.title}</span>
                        <span className="inbox-tray-item-arrow">›</span>
                      </div>
                      <p className="inbox-tray-item-msg">{n.message}</p>
                      {linked && (
                        <div className="inbox-tray-item-loc">
                          <img src={locLight} className="inbox-tray-loc light-only" alt="" />
                          <img src={locDark} className="inbox-tray-loc dark-only" alt="" />
                          <span>{linked.customTitle ? linked.title : (t[`${linked.id}-title`] || linked.title)}</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedNotif && (
        <div className="notif-overlay" ref={cardOverlayRef} onClick={handleCloseCard}>
          <div className="notif-card" ref={cardRef} onClick={e => e.stopPropagation()}>
            <div className="notif-card-header">
              <img src={notifDark} alt="" className="notif-card-icon" />
              <h3 className="notif-card-title">{selectedNotif.title}</h3>
              <button className="notif-card-close" onClick={handleCloseCard}>✕</button>
            </div>
            <div className="notif-card-body">
              <p className="notif-card-message">{selectedNotif.message}</p>
              <p className="notif-card-expiry">{formatExpiry(selectedNotif.expiresAt)}</p>
              {linkedLandmark && (
                <button
                  className="notif-loc-btn"
                  onClick={() => handleSeeLocation(selectedNotif.landmarkId)}
                >
                  <img src={locLight} alt="" className="notif-loc-icon light-only" />
                  <img src={locDark} alt="" className="notif-loc-icon dark-only" />
                  {t.inboxViewLocation} {linkedLandmark.customTitle ? linkedLandmark.title : (t[`${linkedLandmark.id}-title`] || linkedLandmark.title)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

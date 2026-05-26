import { useState, useEffect } from 'react'
import { loadNotifications, isExpired } from '../utils/notifications'
import { getCategoryById } from '../utils/storage'
import notificationIcon from '../assets/notification.png'
import './InboxPanel.css'

export default function InboxPanel({ landmarks, onFlyTo }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    setNotifications(loadNotifications())
    
    // Listen for localStorage changes to update notifications in real-time
    const handleStorageChange = (e) => {
      if (e.key === 'notifications' || e.key === null) {
        setNotifications(loadNotifications())
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also poll for changes every 2 seconds as a fallback
    const interval = setInterval(() => {
      setNotifications(loadNotifications())
    }, 2000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const activeNotifications = notifications.filter(n => !isExpired(n))

  const formatExpiry = (expiresAt) => {
    const date = new Date(expiresAt)
    return `Expires ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  }

  const handleSeeLocation = (landmarkId) => {
    onFlyTo(landmarkId)
    setIsOpen(false)
  }

  return (
    <div className="inbox-container">
      <button
        className="inbox-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <img src={notificationIcon} alt="Notifications" className="inbox-bell-icon" />
        {activeNotifications.length > 0 && !isOpen && (
          <span className="inbox-badge">{activeNotifications.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="inbox-panel open">
          <div className="inbox-header">
            <h3>Notifications</h3>
            <button className="inbox-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="inbox-content">
            {activeNotifications.length === 0 ? (
              <div className="inbox-empty">
                <p>No notifications right now</p>
              </div>
            ) : (
              activeNotifications.map(n => (
                <div key={n.id} className="inbox-card">
                  <h4 className="inbox-card-title">{n.title}</h4>
                  <p className="inbox-card-message">{n.message}</p>
                  <p className="inbox-card-expiry">{formatExpiry(n.expiresAt)}</p>
                  {n.landmarkId && (
                    <button 
                      className="inbox-card-btn"
                      onClick={() => handleSeeLocation(n.landmarkId)}
                    >
                      See location
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

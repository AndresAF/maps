import { useState, useEffect } from 'react'
import { loadNotifications, saveNotifications, generateNotifId } from '../utils/notifications'
import { loadLandmarks, saveLandmarks, CATEGORIES } from '../utils/storage'
import { translations } from '../utils/translations'
import lightModeIcon from '../assets/light-mode.png'
import darkModeIcon from '../assets/night.png'
import logoCoyoacan from '../assets/logocoyoacan.png'
import locLight from '../assets/loc-brigth.png'
import locDark from '../assets/loc-dark.png'
import './AdminPage.css'

const generateLandmarkId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export default function AdminPage() {
  const [landmarks, setLandmarks] = useState([])
  const [notifications, setNotifications] = useState([])
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [activeTab, setActiveTab] = useState('notifications')
  const [language, setLanguage] = useState('es')
  const [isDarkMode, setIsDarkMode] = useState(false)

  const t = translations[language]

  useEffect(() => {
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  }, [])
  
  const getDefaultDate = () => {
    const d = new Date(); d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }
  const todayStr = new Date().toISOString().split('T')[0]

  // Notification form state
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifExpiryDate, setNotifExpiryDate] = useState(getDefaultDate())
  const [notifExpiryTime, setNotifExpiryTime] = useState('23:59')
  const [notifLandmarkId, setNotifLandmarkId] = useState('')
  
  // Landmark form state
  const [lmTitle, setLmTitle] = useState('')
  const [lmDescription, setLmDescription] = useState('')
  const [lmCategory, setLmCategory] = useState('culture')
  const [lmLat, setLmLat] = useState('')
  const [lmLng, setLmLng] = useState('')
  const [lmTags, setLmTags] = useState('')
  const [lmImages, setLmImages] = useState('')
  const [editingLandmark, setEditingLandmark] = useState(null)

  useEffect(() => {
    setLandmarks(loadLandmarks())
    setNotifications(loadNotifications())
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const handlePinSubmit = (e) => {
    e.preventDefault()
    if (pin === '1522') {
      setIsUnlocked(true)
      setPinError('')
    } else {
      setPinError('Incorrect PIN')
    }
  }

  const handleNotifSubmit = (e) => {
    e.preventDefault()
    if (!notifTitle || !notifMessage) return

    const expiresAt = new Date(`${notifExpiryDate}T${notifExpiryTime}:00`).toISOString()

    const newNotif = {
      id: generateNotifId(),
      title: notifTitle,
      message: notifMessage,
      createdAt: new Date().toISOString(),
      expiresAt,
      landmarkId: notifLandmarkId || null,
    }

    saveNotifications([...notifications, newNotif])
    setNotifications([...notifications, newNotif])
    setNotifTitle('')
    setNotifMessage('')
    setNotifExpiryDate(getDefaultDate())
    setNotifExpiryTime('23:59')
    setNotifLandmarkId('')
  }

  const handleNotifDelete = (id) => {
    const updated = notifications.filter(n => n.id !== id)
    saveNotifications(updated)
    setNotifications(updated)
  }

  const handleLandmarkSubmit = (e) => {
    e.preventDefault()
    if (!lmTitle || !lmDescription || !lmLat || !lmLng) return

    const tagsArray = lmTags.split(',').map(t => t.trim()).filter(t => t)
    const imagesArray = lmImages.split(',').map(img => img.trim()).filter(img => img)

    if (editingLandmark) {
      const updated = landmarks.map(l =>
        l.id === editingLandmark.id
          ? {
              ...l,
              title: lmTitle,
              description: lmDescription,
              category: lmCategory,
              lat: parseFloat(lmLat),
              lng: parseFloat(lmLng),
              tags: tagsArray,
              images: imagesArray,
              customTitle: true,
            }
          : l
      )
      saveLandmarks(updated)
      setLandmarks(updated)
      setEditingLandmark(null)
    } else {
      const newLandmark = {
        id: generateLandmarkId(),
        title: lmTitle,
        description: lmDescription,
        category: lmCategory,
        lat: parseFloat(lmLat),
        lng: parseFloat(lmLng),
        tags: tagsArray,
        images: imagesArray,
        createdAt: new Date().toISOString()
      }
      saveLandmarks([...landmarks, newLandmark])
      setLandmarks([...landmarks, newLandmark])
    }

    setLmTitle('')
    setLmDescription('')
    setLmCategory('culture')
    setLmLat('')
    setLmLng('')
    setLmTags('')
    setLmImages('')
  }

  const handleLandmarkEdit = (landmark) => {
    setEditingLandmark(landmark)
    setLmTitle(landmark.title)
    setLmDescription(landmark.description)
    setLmCategory(landmark.category)
    setLmLat(landmark.lat.toString())
    setLmLng(landmark.lng.toString())
    setLmTags(landmark.tags?.join(', ') || '')
    setLmImages(landmark.images?.join(', ') || '')
    setActiveTab('landmarks')
  }

  const handleLandmarkDelete = (id) => {
    const updated = landmarks.filter(l => l.id !== id)
    saveLandmarks(updated)
    setLandmarks(updated)
  }

  const handleLandmarkCancel = () => {
    setEditingLandmark(null)
    setLmTitle('')
    setLmDescription('')
    setLmCategory('culture')
    setLmLat('')
    setLmLng('')
    setLmTags('')
    setLmImages('')
  }

  const handleBack = () => {
    window.location.href = '/'
  }

  if (!isUnlocked) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <div className="admin-login-hero">
            <img src={logoCoyoacan} alt="Coyoacán" className="admin-login-logo" />
            <h2 className="admin-login-title">Coyoacán</h2>
            <p className="admin-login-subtitle">Admin Panel</p>
            <div className="admin-login-divider" />
          </div>
          <div className="admin-login-body">
            <p className="admin-login-label">{t.adminAccess}</p>
            <form onSubmit={handlePinSubmit}>
              <input
                type="password"
                placeholder={t.enterPin}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="admin-pin-input"
              />
              {pinError && <p className="admin-error">{pinError}</p>}
              <button type="submit" className="admin-login-btn">{t.unlock}</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-header-brand">
            <span className="admin-header-emoji">🗺️</span>
            <div>
              <h3 className="admin-header-title">{t.adminPanel}</h3>
              <p className="admin-header-sub">Coyoacán</p>
            </div>
          </div>
          <div className="admin-header-actions">
            <select
              className="admin-lang-select"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              <option value="es">ES</option>
              <option value="en">EN</option>
            </select>
            <button className="admin-theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)} title="Toggle theme">
              <img src={isDarkMode ? lightModeIcon : darkModeIcon} alt="" className="admin-theme-icon" />
            </button>
            <button className="admin-back" onClick={handleBack}>← {t.back}</button>
          </div>
        </div>

        <div className="admin-tabs">
          <button
            className={`admin-tab${activeTab === 'notifications' ? ' active notif' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <span className="tab-dot" />
            {t.notifications}
          </button>
          <button
            className={`admin-tab${activeTab === 'landmarks' ? ' active land' : ''}`}
            onClick={() => setActiveTab('landmarks')}
          >
            <span className="tab-dot" />
            {t.landmarks}
          </button>
        </div>

        <div className="admin-content">
          {activeTab === 'notifications' && (
            <div className="admin-section">
              <form className="admin-form" onSubmit={handleNotifSubmit}>
                <h4>{t.createNotification}</h4>
                <div className="admin-form-group">
                  <label>{t.title}</label>
                  <input
                    className="admin-input"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder={t.notificationTitle}
                  />
                </div>
                <div className="admin-form-group">
                  <label>{t.message}</label>
                  <textarea
                    className="admin-textarea"
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder={t.notificationMessage}
                  />
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>{t.expiryDate || 'Expiry Date'}</label>
                    <input
                      className="admin-input"
                      type="date"
                      value={notifExpiryDate}
                      min={todayStr}
                      onChange={(e) => setNotifExpiryDate(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>{t.expiryTime || 'Expiry Time'}</label>
                    <input
                      className="admin-input"
                      type="time"
                      value={notifExpiryTime}
                      onChange={(e) => setNotifExpiryTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Location (optional)</label>
                  <select
                    className="admin-select"
                    value={notifLandmarkId}
                    onChange={(e) => setNotifLandmarkId(e.target.value)}
                  >
                    <option value="">— No location —</option>
                    {landmarks.map(lm => (
                      <option key={lm.id} value={lm.id}>{lm.title}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="admin-submit">{t.createNotification}</button>
              </form>

              <div className="admin-notifications-list">
                <h4>{t.notifications} ({notifications.length})</h4>
                {notifications.length === 0 ? (
                  <p className="admin-empty">{t.noNotificationsYet}</p>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="admin-notif-item">
                      <div className="admin-notif-info">
                        <h5>{notif.title}</h5>
                        <p>{notif.message}</p>
                        {notif.landmarkId && (
                          <small className="admin-notif-loc">
                            <img src={locLight} alt="" className="admin-loc-icon light-only" />
                            <img src={locDark} alt="" className="admin-loc-icon dark-only" />
                            {landmarks.find(l => l.id === notif.landmarkId)?.title || notif.landmarkId}
                          </small>
                        )}
                        <small>{new Date(notif.createdAt).toLocaleDateString()}</small>
                      </div>
                      <button
                        className="admin-delete-btn"
                        onClick={() => handleNotifDelete(notif.id)}
                      >
                        {t.delete}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'landmarks' && (
            <div className="admin-section">
              <form className="admin-form" onSubmit={handleLandmarkSubmit}>
                <h4>{editingLandmark ? t.editLandmark : t.addLandmark}</h4>
                <div className="admin-form-group">
                  <label>{t.title}</label>
                  <input
                    className="admin-input"
                    value={lmTitle}
                    onChange={(e) => setLmTitle(e.target.value)}
                    placeholder={t.landmarkTitle}
                  />
                </div>
                <div className="admin-form-group">
                  <label>{t.description}</label>
                  <textarea
                    className="admin-textarea"
                    value={lmDescription}
                    onChange={(e) => setLmDescription(e.target.value)}
                    placeholder={t.landmarkDescription}
                  />
                </div>
                <div className="admin-form-group">
                  <label>{t.category}</label>
                  <select
                    className="admin-select"
                    value={lmCategory}
                    onChange={(e) => setLmCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>{t.latitude}</label>
                    <input
                      className="admin-input"
                      type="number"
                      step="any"
                      value={lmLat}
                      onChange={(e) => setLmLat(e.target.value)}
                      placeholder="19.3494"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>{t.longitude}</label>
                    <input
                      className="admin-input"
                      type="number"
                      step="any"
                      value={lmLng}
                      onChange={(e) => setLmLng(e.target.value)}
                      placeholder="-99.1621"
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>{t.tagsComma}</label>
                  <input
                    className="admin-input"
                    value={lmTags}
                    onChange={(e) => setLmTags(e.target.value)}
                    placeholder="culture, historic, museum"
                  />
                </div>
                <div className="admin-form-group">
                  <label>{t.imageUrlsComma}</label>
                  <input
                    className="admin-input"
                    value={lmImages}
                    onChange={(e) => setLmImages(e.target.value)}
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  />
                </div>
                <div className="admin-form-buttons">
                  <button type="submit" className="admin-submit">
                    {editingLandmark ? t.updateLandmark : t.addLandmark}
                  </button>
                  {editingLandmark && (
                    <button type="button" className="admin-cancel" onClick={handleLandmarkCancel}>
                      {t.cancel}
                    </button>
                  )}
                </div>
              </form>

              <div className="admin-landmarks-list">
                <h4>{t.landmarks} ({landmarks.length})</h4>
                {landmarks.map(landmark => (
                  <div key={landmark.id} className="admin-landmark-item">
                    <div className="admin-landmark-info">
                      <h5>{landmark.title}</h5>
                      <p>{landmark.description}</p>
                      <small>{landmark.category} • {landmark.lat}, {landmark.lng}</small>
                    </div>
                    <div className="admin-landmark-actions">
                      <button
                        className="admin-edit-btn"
                        onClick={() => handleLandmarkEdit(landmark)}
                      >
                        {t.edit}
                      </button>
                      <button
                        className="admin-delete-btn"
                        onClick={() => handleLandmarkDelete(landmark.id)}
                      >
                        {t.delete}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

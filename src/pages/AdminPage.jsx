import { useState, useEffect } from 'react'
import { loadNotifications, saveNotifications, generateNotifId } from '../utils/notifications'
import { loadLandmarks, saveLandmarks, CATEGORIES } from '../utils/storage'
import { translations } from '../utils/translations'
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

  const t = translations[language]
  
  // Notification form state
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifExpiryHours, setNotifExpiryHours] = useState('24')
  
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

    const hours = parseInt(notifExpiryHours) || 24
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()

    const newNotif = {
      id: generateNotifId(),
      title: notifTitle,
      message: notifMessage,
      createdAt: new Date().toISOString(),
      expiresAt
    }

    saveNotifications([...notifications, newNotif])
    setNotifications([...notifications, newNotif])
    setNotifTitle('')
    setNotifMessage('')
    setNotifExpiryHours('24')
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
              images: imagesArray
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
          <h2>{t.adminAccess}</h2>
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
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <button className="admin-back" onClick={handleBack}>← {t.back}</button>
          <h3>{t.adminPanel}</h3>
          <select
            className="admin-lang-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>
        </div>

        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            {t.notifications}
          </button>
          <button
            className={`admin-tab ${activeTab === 'landmarks' ? 'active' : ''}`}
            onClick={() => setActiveTab('landmarks')}
          >
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
                <div className="admin-form-group">
                  <label>{t.expiryHours}</label>
                  <input
                    className="admin-input"
                    type="number"
                    min="1"
                    max="720"
                    value={notifExpiryHours}
                    onChange={(e) => setNotifExpiryHours(e.target.value)}
                    placeholder="24"
                  />
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

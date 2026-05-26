import { useState, useEffect } from 'react'
import { loadNotifications, saveNotifications, generateNotifId } from '../utils/notifications'
import { loadLandmarks, saveLandmarks, CATEGORIES } from '../utils/storage'
import './AdminPanel.css'

const generateLandmarkId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export default function AdminPanel({ landmarks, setAdminOpen }) {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('adminUnlocked') === 'true'
  })
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [notifications, setNotifications] = useState([])
  const [activeTab, setActiveTab] = useState('notifications')
  
  // Notification form state
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [expiryTime, setExpiryTime] = useState('')
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
    setNotifications(loadNotifications())
  }, [])

  const handlePinSubmit = (e) => {
    e.preventDefault()
    if (pin === '1234') {
      setIsUnlocked(true)
      sessionStorage.setItem('adminUnlocked', 'true')
      setPinError('')
    } else {
      setPinError('Incorrect PIN')
    }
  }

  const handleNotifSubmit = (e) => {
    e.preventDefault()
    if (!notifTitle || !notifMessage || !expiryDate || !expiryTime) return

    const expiresAt = new Date(`${expiryDate}T${expiryTime}`).toISOString()
    const newNotif = {
      id: generateNotifId(),
      title: notifTitle,
      message: notifMessage,
      expiresAt,
      landmarkId: notifLandmarkId || null,
      createdAt: new Date().toISOString()
    }

    saveNotifications([...notifications, newNotif])
    setNotifications([...notifications, newNotif])
    setNotifTitle('')
    setNotifMessage('')
    setExpiryDate('')
    setExpiryTime('')
    setNotifLandmarkId('')
  }

  const handleNotifDelete = (id) => {
    const updated = notifications.filter(n => n.id !== id)
    setNotifications(updated)
    saveNotifications(updated)
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
    }

    setLmTitle('')
    setLmDescription('')
    setLmCategory('culture')
    setLmLat('')
    setLmLng('')
    setLmTags('')
    setLmImages('')
    
    // Close admin panel to trigger landmark reload
    setAdminOpen(false)
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
    // Close admin panel to trigger landmark reload
    setAdminOpen(false)
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

  const formatExpiry = (expiresAt) => {
    const date = new Date(expiresAt)
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  }

  if (!isUnlocked) {
    return (
      <div className="admin-overlay">
        <div className="admin-pin-panel">
          <h3>Admin Panel</h3>
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="admin-pin-input"
              maxLength={4}
            />
            {pinError && <p className="admin-pin-error">{pinError}</p>}
            <button type="submit" className="admin-pin-submit">Unlock</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <h3>Admin Panel</h3>
          <button className="admin-close" onClick={() => setAdminOpen(false)}>✕</button>
        </div>
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button 
            className={`admin-tab ${activeTab === 'landmarks' ? 'active' : ''}`}
            onClick={() => setActiveTab('landmarks')}
          >
            Landmarks
          </button>
        </div>
        <div className="admin-content">
          {activeTab === 'notifications' ? (
            <>
              <form onSubmit={handleNotifSubmit} className="admin-form">
                <h4>Create Notification</h4>
                <div className="admin-form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    required
                    className="admin-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Message *</label>
                  <textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    required
                    className="admin-textarea"
                    rows={3}
                  />
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Expiry Date *</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      required
                      className="admin-input"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Expiry Time *</label>
                    <input
                      type="time"
                      value={expiryTime}
                      onChange={(e) => setExpiryTime(e.target.value)}
                      required
                      className="admin-input"
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Linked Location</label>
                  <select
                    value={notifLandmarkId}
                    onChange={(e) => setNotifLandmarkId(e.target.value)}
                    className="admin-select"
                  >
                    <option value="">None</option>
                    {landmarks.map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="admin-submit">Create Notification</button>
              </form>

              <div className="admin-notifications-list">
                <h4>All Notifications</h4>
                {notifications.length === 0 ? (
                  <p className="admin-empty">No notifications created yet</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="admin-notif-item">
                      <div className="admin-notif-info">
                        <h5>{n.title}</h5>
                        <p>Expires: {formatExpiry(n.expiresAt)}</p>
                        {n.landmarkId && (
                          <p>Location: {landmarks.find(l => l.id === n.landmarkId)?.title || 'Unknown'}</p>
                        )}
                      </div>
                      <button 
                        className="admin-delete-btn"
                        onClick={() => handleNotifDelete(n.id)}
                      >
                        🗑
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleLandmarkSubmit} className="admin-form">
                <h4>{editingLandmark ? 'Edit Landmark' : 'Add Landmark'}</h4>
                <div className="admin-form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={lmTitle}
                    onChange={(e) => setLmTitle(e.target.value)}
                    required
                    className="admin-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Description *</label>
                  <textarea
                    value={lmDescription}
                    onChange={(e) => setLmDescription(e.target.value)}
                    required
                    className="admin-textarea"
                    rows={3}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Category *</label>
                  <select
                    value={lmCategory}
                    onChange={(e) => setLmCategory(e.target.value)}
                    className="admin-select"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={lmLat}
                      onChange={(e) => setLmLat(e.target.value)}
                      required
                      className="admin-input"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={lmLng}
                      onChange={(e) => setLmLng(e.target.value)}
                      required
                      className="admin-input"
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={lmTags}
                    onChange={(e) => setLmTags(e.target.value)}
                    className="admin-input"
                    placeholder="e.g., museum, history, art"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Images (comma-separated URLs)</label>
                  <textarea
                    value={lmImages}
                    onChange={(e) => setLmImages(e.target.value)}
                    className="admin-textarea"
                    rows={2}
                    placeholder="e.g., https://example.com/image1.jpg, https://example.com/image2.jpg"
                  />
                </div>
                <div className="admin-form-row">
                  <button type="submit" className="admin-submit">
                    {editingLandmark ? 'Update Landmark' : 'Add Landmark'}
                  </button>
                  {editingLandmark && (
                    <button type="button" className="admin-submit" onClick={handleLandmarkCancel}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="admin-notifications-list">
                <h4>All Landmarks</h4>
                {landmarks.length === 0 ? (
                  <p className="admin-empty">No landmarks created yet</p>
                ) : (
                  landmarks.map(l => (
                    <div key={l.id} className="admin-notif-item">
                      <div className="admin-notif-info">
                        <h5>{l.title}</h5>
                        <p>{l.description}</p>
                        <p>Category: {CATEGORIES.find(c => c.id === l.category)?.label || l.category}</p>
                        <p>Coords: {l.lat}, {l.lng}</p>
                        {l.tags?.length > 0 && <p>Tags: {l.tags.join(', ')}</p>}
                        {l.images?.length > 0 && <p>Images: {l.images.length}</p>}
                      </div>
                      <div className="admin-notif-actions">
                        <button 
                          className="admin-edit-btn"
                          onClick={() => handleLandmarkEdit(l)}
                        >
                          ✏️
                        </button>
                        <button 
                          className="admin-delete-btn"
                          onClick={() => handleLandmarkDelete(l.id)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

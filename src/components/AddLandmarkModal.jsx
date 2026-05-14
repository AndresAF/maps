import { useState, useEffect } from 'react'
import { CATEGORIES } from '../utils/storage'
import './Modal.css'

const EMPTY = { title: '', description: '', category: 'viewpoint', tags: '' }

export default function AddLandmarkModal({ isOpen, onClose, onSave, editData, coords }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (editData) {
      setForm({ ...editData, tags: editData.tags?.join(', ') || '' })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
  }, [editData, isOpen])

  if (!isOpen) return null

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Name is required'
    return e
  }

  const handleSave = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    const tags = form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    onSave({ ...form, tags, lat: coords?.lat, lng: coords?.lng })
    onClose()
  }

  return (
    <div className="modal-overlay fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet slide-up">
        <div className="modal-drag-handle" />
        <div className="modal-header">
          <h2 className="modal-title">{editData ? 'Edit Landmark' : 'New Landmark'}</h2>
          {coords && !editData && (
            <p className="modal-coords">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
          )}
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Name *</label>
            <input
              className={errors.title ? 'error' : ''}
              placeholder="e.g. Hidden waterfall viewpoint"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              autoFocus
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label>Category</label>
            <div className="category-grid">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`cat-btn ${form.category === cat.id ? 'active' : ''}`}
                  style={{ '--cat': cat.color }}
                  onClick={() => set('category', cat.id)}
                  type="button"
                >
                  <span className="cat-emoji">{cat.emoji}</span>
                  <span className="cat-label">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              placeholder="What makes this place special?"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Tags <span className="label-hint">(comma separated)</span></label>
            <input
              placeholder="sunset, hiking, must-see"
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>
            {editData ? 'Save changes' : 'Add landmark'}
          </button>
        </div>
      </div>
    </div>
  )
}

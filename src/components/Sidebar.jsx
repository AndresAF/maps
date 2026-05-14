import { useState } from 'react'
import { CATEGORIES, getCategoryById } from '../utils/storage'
import './Sidebar.css'

export default function Sidebar({ landmarks, isOpen, onClose, onSelectLandmark, onDirections }) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [sortBy, setSortBy] = useState('alpha')

  const filtered = landmarks
    .filter(l => {
      const q = search.toLowerCase()
      const matchSearch = !q || l.title.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.tags?.some(t => t.includes(q))
      const matchCat = filterCat === 'all' || l.category === filterCat
      return matchSearch && matchCat
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
      return a.title.localeCompare(b.title)
    })

  const catCounts = landmarks.reduce((acc, l) => {
    acc[l.category] = (acc[l.category] || 0) + 1; return acc
  }, {})

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title-row">
            <h1 className="sidebar-title">Coyoacán</h1>
            <span className="sidebar-count">{landmarks.length}</span>
            <button className="sidebar-close" onClick={onClose}>✕</button>
          </div>
          <input
            className="sidebar-search"
            placeholder="🔍  Search places…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="sidebar-filters">
          <div className="cat-filter-row">
            <button
              className={`cat-filter-btn ${filterCat === 'all' ? 'active' : ''}`}
              onClick={() => setFilterCat('all')}
            >All</button>
            {CATEGORIES.filter(c => catCounts[c.id]).map(cat => (
              <button
                key={cat.id}
                className={`cat-filter-btn ${filterCat === cat.id ? 'active' : ''}`}
                style={{ '--cat': cat.color }}
                onClick={() => setFilterCat(cat.id)}
              >{cat.emoji} {catCounts[cat.id]}</button>
            ))}
          </div>
          <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="alpha">A–Z</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        <div className="sidebar-list">
          {filtered.length === 0 && (
            <div className="sidebar-empty">
              <span className="empty-icon">🔍</span>
              <p>No results</p>
              <p className="empty-sub">Try a different search or filter</p>
            </div>
          )}
          {filtered.map(l => {
            const cat = getCategoryById(l.category)
            return (
              <div key={l.id} className="landmark-item" onClick={() => { onSelectLandmark(l); onClose() }}>
                <span className="item-emoji">{cat.emoji}</span>
                <div className="item-info">
                  <span className="item-title">{l.title}</span>
                  <span className="item-cat" style={{ color: cat.color }}>{cat.label}</span>
                  {l.description && <span className="item-desc">{l.description}</span>}
                  {l.tags?.length > 0 && (
                    <div className="item-tags">
                      {l.tags.slice(0, 3).map(t => <span key={t} className="item-tag">#{t}</span>)}
                    </div>
                  )}
                </div>
                <div className="item-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className="item-btn dir"
                    onClick={() => { onDirections(l); onClose() }}
                    title="Directions"
                  >🧭</button>
                </div>
              </div>
            )
          })}
        </div>
      </aside>
    </>
  )
}

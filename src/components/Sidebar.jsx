import { useState } from 'react'
import { CATEGORIES, getCategoryById, getCategoryLabel } from '../utils/storage'
import { useLanguage } from '../App'
import { translations } from '../utils/translations'
import './Sidebar.css'

export default function Sidebar({ landmarks, isOpen, onClose, onSelectLandmark, onDirections }) {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [sortBy, setSortBy] = useState('alpha')
  const [filterTag, setFilterTag] = useState(null)

  const filtered = landmarks
    .filter(l => {
      const q = search.toLowerCase()
      const enTitle = l.customTitle ? l.title : (translations.en[`${l.id}-title`] || l.title)
      const esTitle = l.customTitle ? l.title : (translations.es[`${l.id}-title`] || l.title)
      const enDesc = translations.en[`${l.id}-desc`] || l.description
      const esDesc = translations.es[`${l.id}-desc`] || l.description
      const enTags = l.tags?.map(tag => translations.en[`tag-${tag}`] || tag) || []
      const esTags = l.tags?.map(tag => translations.es[`tag-${tag}`] || tag) || []
      
      const matchSearch = !q ||
        l.title.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.tags?.some(t => t.includes(q)) ||
        enTitle.toLowerCase().includes(q) ||
        esTitle.toLowerCase().includes(q) ||
        enDesc?.toLowerCase().includes(q) ||
        esDesc?.toLowerCase().includes(q) ||
        enTags.some(t => t.toLowerCase().includes(q)) ||
        esTags.some(t => t.toLowerCase().includes(q))
      const matchCat = filterCat === 'all' || l.category === filterCat
      const matchTag = !filterTag || l.tags?.includes(filterTag)
      return matchSearch && matchCat && matchTag
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
            <h1 className="sidebar-title">{t.appTitle}</h1>
            <span className="sidebar-count">{landmarks.length}</span>
            <button className="sidebar-close" onClick={onClose}>{t.close}</button>
          </div>
          <input
            className="sidebar-search"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="sidebar-filters">
          <div className="cat-filter-row">
            <button
              className={`cat-filter-btn ${filterCat === 'all' ? 'active' : ''}`}
              onClick={() => setFilterCat('all')}
            >{t.all}</button>
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
            <option value="newest">{t.newest}</option>
            <option value="oldest">{t.oldest}</option>
          </select>
        </div>

        <div className="sidebar-list">
          {filtered.length === 0 && (
            <div className="sidebar-empty">
              <span className="empty-icon">🔍</span>
              <p>{t.noResults}</p>
              <p className="empty-sub">{t.noResultsSub}</p>
            </div>
          )}
          {filtered.map(l => {
            const cat = getCategoryById(l.category)
            return (
              <div key={l.id} className="landmark-item" onClick={() => { onSelectLandmark(l); onClose() }}>
                <span className="item-emoji">{cat.emoji}</span>
                <div className="item-info">
                  <span className="item-title">{l.customTitle ? l.title : (t[`${l.id}-title`] || l.title)}</span>
                  <span className="item-cat" style={{ color: cat.color }}>{getCategoryLabel(cat.id, t)}</span>
                  {l.description && <span className="item-desc">{t[`${l.id}-desc`] || l.description}</span>}
                  {l.tags?.length > 0 && (
                    <div className="item-tags">
                      {l.tags.slice(0, 3).map(tag => (
                        <span 
                          key={tag} 
                          className={`item-tag ${filterTag === tag ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); setFilterTag(filterTag === tag ? null : tag) }}
                        >#{t[`tag-${tag}`] || tag}</span>
                      ))}
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

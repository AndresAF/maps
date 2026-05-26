const KEY = 'notifications_v1'

export const loadNotifications = () => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export const saveNotifications = (list) => {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch {}
}

export const isExpired = (n) => new Date(n.expiresAt) < new Date()

export const generateNotifId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

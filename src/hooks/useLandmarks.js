import { useState, useEffect, useRef } from 'react'
import { collection, onSnapshot, doc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { DEFAULT_LANDMARKS } from '../utils/storage'

export function useLandmarks() {
  const [landmarks, setLandmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const seededRef = useRef(false)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'landmarks'), async (snap) => {
      if (snap.empty && !seededRef.current) {
        seededRef.current = true
        const batch = writeBatch(db)
        DEFAULT_LANDMARKS.forEach(lm => batch.set(doc(db, 'landmarks', lm.id), lm))
        await batch.commit()
        return
      }
      const sorted = snap.docs
        .map(d => d.data())
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      setLandmarks(sorted)
      setLoading(false)
    })
    return unsub
  }, [])

  return { landmarks, loading }
}

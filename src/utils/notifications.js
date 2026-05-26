import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'

export const addNotificationToFirestore = (notification) =>
  setDoc(doc(db, 'notifications', notification.id), notification)

export const deleteNotificationFromFirestore = (id) =>
  deleteDoc(doc(db, 'notifications', id))

export const isExpired = (n) => new Date(n.expiresAt) < new Date()

export const generateNotifId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyA9IV2adYjXOISrpKI4ZrUr1Zo89WybGXs",
  authDomain: "coyoacan-map.firebaseapp.com",
  projectId: "coyoacan-map",
  storageBucket: "coyoacan-map.firebasestorage.app",
  messagingSenderId: "570771395837",
  appId: "1:570771395837:web:b76d13497b7f9762695a94"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

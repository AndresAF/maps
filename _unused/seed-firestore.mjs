import { initializeApp } from 'firebase/app'
import { getFirestore, writeBatch, doc, collection, getDocs } from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyA9IV2adYjXOISrpKI4ZrUr1Zo89WybGXs",
  authDomain: "coyoacan-map.firebaseapp.com",
  projectId: "coyoacan-map",
  storageBucket: "coyoacan-map.firebasestorage.app",
  messagingSenderId: "570771395837",
  appId: "1:570771395837:web:b76d13497b7f9762695a94"
}

const DEFAULT_LANDMARKS = [
  { id: 'default-1',  title: 'Coyoacán Kiosk',                                lat: 19.3494, lng: -99.1621, category: 'historical',  description: 'Iconic kiosk in the heart of Coyoacán.',            tags: ['plaza','coyoacan'], images: ['https://picsum.photos/seed/coyoacan-kiosk/800/450','https://picsum.photos/seed/coyoacan-kiosk-2/800/450'], createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 'default-2',  title: 'Coyoacán Plaza',                                lat: 19.3489, lng: -99.1618, category: 'culture',     description: 'Main square and tourist hub of Coyoacán.',          tags: ['plaza','tourist'], images: ['https://picsum.photos/seed/coyoacan-plaza/800/450','https://picsum.photos/seed/coyoacan-plaza-2/800/450'], createdAt: '2024-01-01T00:00:01.000Z' },
  { id: 'default-3',  title: "Hernán Cortés' House",                          lat: 19.3495, lng: -99.1620, category: 'historical',  description: 'Colonial-era landmark tied to the conquest.',       tags: ['colonial','history'], images: ['https://picsum.photos/seed/cortes-house/800/450'], createdAt: '2024-01-01T00:00:02.000Z' },
  { id: 'default-4',  title: "Leon Trotsky's House Museum",                   lat: 19.3466, lng: -99.1617, category: 'culture',     description: 'Former home and final refuge of Leon Trotsky.',     tags: ['museum','history'], images: ['https://picsum.photos/seed/trotsky-house/800/450','https://picsum.photos/seed/trotsky-house-2/800/450'], createdAt: '2024-01-01T00:00:03.000Z' },
  { id: 'default-5',  title: 'Jesús Reyes Heroles Cultural Center',           lat: 19.3490, lng: -99.1670, category: 'culture',     description: 'Cultural center with exhibitions and events.',      tags: ['culture','art'], images: ['https://picsum.photos/seed/reyes-heroles/800/450'], createdAt: '2024-01-01T00:00:04.000Z' },
  { id: 'default-6',  title: 'Alfredo Guati Rojo National Watercolor Museum', lat: 19.3487, lng: -99.1594, category: 'culture',     description: 'Dedicated to Mexican watercolor painting.',         tags: ['museum','art'], images: ['https://picsum.photos/seed/watercolor-museum/800/450','https://picsum.photos/seed/watercolor-museum-2/800/450'], createdAt: '2024-01-01T00:00:05.000Z' },
  { id: 'default-7',  title: 'National Museum of Interventions',              lat: 19.3460, lng: -99.1518, category: 'historical',  description: 'Covers foreign interventions in Mexican history.',  tags: ['museum','history'], images: ['https://picsum.photos/seed/museum-interventions/800/450'], createdAt: '2024-01-01T00:00:06.000Z' },
  { id: 'default-8',  title: 'Coyoacán Posada Museum',                       lat: 19.3482, lng: -99.1602, category: 'culture',     description: 'Charming museum inside a colonial posada.',         tags: ['museum','colonial'], images: ['https://picsum.photos/seed/posada-museum/800/450'], createdAt: '2024-01-01T00:00:07.000Z' },
  { id: 'default-9',  title: 'Callejón del Aguacate',                         lat: 19.3508, lng: -99.1653, category: 'historical',  description: 'Picturesque historic alley in Coyoacán.',           tags: ['alley','historic'], images: ['https://picsum.photos/seed/callejon-aguacate/800/450','https://picsum.photos/seed/callejon-aguacate-2/800/450'], createdAt: '2024-01-01T00:00:08.000Z' },
  { id: 'default-10', title: 'Arcos of the Ex-Convent of San Juan Bautista',  lat: 19.3500, lng: -99.1647, category: 'historical',  description: '16th-century convent arches, a colonial gem.',      tags: ['colonial','architecture'], images: ['https://picsum.photos/seed/ex-convent-arcos/800/450'], createdAt: '2024-01-01T00:00:09.000Z' },
  { id: 'default-11', title: 'University Museum of Contemporary Art',         lat: 19.3147, lng: -99.1859, category: 'culture',     description: 'Contemporary art at UNAM campus.',                  tags: ['museum','contemporary','unam'], images: ['https://picsum.photos/seed/muac-unam/800/450','https://picsum.photos/seed/muac-unam-2/800/450'], createdAt: '2024-01-01T00:00:10.000Z' },
  { id: 'default-12', title: 'Universum',                                     lat: 19.3113, lng: -99.1806, category: 'culture',     description: 'Science museum on the UNAM campus.',                tags: ['museum','science','unam'], images: ['https://picsum.photos/seed/universum-unam/800/450'], createdAt: '2024-01-01T00:00:11.000Z' },
  { id: 'default-13', title: 'Coyoacán Tram',                                 lat: 19.3492, lng: -99.1620, category: 'viewpoint',   description: 'Hop-on tourist tram touring Coyoacán.',             tags: ['tourist','tour'], images: ['https://picsum.photos/seed/coyoacan-tram/800/450'], createdAt: '2024-01-01T00:00:12.000Z' },
  { id: 'default-14', title: 'Coyoacán Historic District',                    lat: 19.3500, lng: -99.1620, category: 'historical',  description: 'One of the best-preserved colonial districts in CDMX.', tags: ['district','colonial'], images: ['https://picsum.photos/seed/coyoacan-district/800/450','https://picsum.photos/seed/coyoacan-district-2/800/450'], createdAt: '2024-01-01T00:00:13.000Z' },
]

const [,, email, password] = process.argv
if (!email || !password) {
  console.error('Usage: node scripts/seed-firestore.mjs <email> <password>')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

console.log('Signing in...')
await signInWithEmailAndPassword(auth, email, password)
console.log('Authenticated.')

const existing = await getDocs(collection(db, 'landmarks'))
if (!existing.empty) {
  console.log(`Firestore already has ${existing.size} landmarks — skipping seed.`)
  process.exit(0)
}

const batch = writeBatch(db)
DEFAULT_LANDMARKS.forEach(lm => batch.set(doc(db, 'landmarks', lm.id), lm))
await batch.commit()
console.log(`Seeded ${DEFAULT_LANDMARKS.length} landmarks successfully.`)
process.exit(0)

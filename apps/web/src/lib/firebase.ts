import { initializeApp, FirebaseApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore'
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth'
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage'

// Development configuration for emulators
const devConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'localhost',
  projectId: 'spektif-agency-dev',
  storageBucket: 'spektif-agency-dev.appspot.com',
  messagingSenderId: '000000000000',
  appId: 'demo-app-id',
}

// Production configuration from environment variables
const prodConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Use dev config in development, prod config in production
const isDev = process.env.NODE_ENV === 'development'
const firebaseConfig = isDev ? devConfig : prodConfig

// Initialize Firebase
let app: FirebaseApp
let db: Firestore
let auth: Auth
let storage: FirebaseStorage
let emulatorsConnected = false

try {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  auth = getAuth(app)
  storage = getStorage(app)

  // Connect to emulators in development (only once)
  if (isDev && typeof window !== 'undefined' && !emulatorsConnected) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080)
      connectAuthEmulator(auth, 'http://localhost:9099')
      connectStorageEmulator(storage, 'localhost', 9199)
      emulatorsConnected = true
      console.log('🔥 Connected to Firebase Emulators')
    } catch (error) {
      // Emulators already connected or not running
      console.log('Firebase emulators connection skipped:', (error as Error).message)
    }
  }
} catch (error) {
  console.error('Firebase initialization error:', error)
  // Create placeholder instances
  app = {} as FirebaseApp
  db = {} as Firestore
  auth = {} as Auth
  storage = {} as FirebaseStorage
}

export { db, auth, storage }
export default app

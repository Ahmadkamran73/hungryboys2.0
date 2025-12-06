import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";

// Firebase configuration using Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings to prevent offline issues
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  experimentalForceLongPolling: false, // Use WebChannel for better performance
  ignoreUndefinedProperties: true,
});

// Try to enable offline persistence, but don't crash if it fails
try {
  enableIndexedDbPersistence(db, {
    forceOwnership: false // Allow multiple tabs
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not available in this browser');
    } else {
      console.error('Firestore persistence error:', err);
    }
  });
} catch (err) {
  console.warn('Offline persistence setup failed:', err);
}

export const auth = getAuth(app);
export const storage = getStorage(app); // ✅ Required for screenshot uploads

// Set auth persistence to session only
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    
  })
  .catch((error) => {
    console.error("Failed to set session persistence:", error);
  });

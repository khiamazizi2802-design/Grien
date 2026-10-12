import { initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Web App's Firebase configuration keys from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCZzCk54nJNYdN9y62FIh0qJpldZZikoQE",
  authDomain: "green-2efb0.firebaseapp.com",
  projectId: "green-2efb0",
  storageBucket: "green-2efb0.firebasestorage.app",
  messagingSenderId: "48618746281",
  appId: "1:48618746281:web:e7b5dae01cb52c78a6d4b8",
  measurementId: "G-FSNFDG4T8Y"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize and export core Firebase services with Capacitor-compatible persistence fallbacks
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence]
});
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

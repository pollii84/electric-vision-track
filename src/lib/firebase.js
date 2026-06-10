import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

const isE2ETest = typeof window !== 'undefined' && 
  (window.__E2E_TESTING__ || 
   (window.navigator && window.navigator.webdriver) || 
   (window.navigator && (/HeadlessChrome|Playwright/i).test(window.navigator.userAgent)));

if (typeof window !== 'undefined') {
  console.log('🔥 Firebase isE2ETest detection:', isE2ETest, 'navigator.webdriver:', window.navigator.webdriver, 'userAgent:', window.navigator.userAgent);
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

let db;
if (!getApps().length) {
  db = initializeFirestore(app, isE2ETest ? { experimentalForceLongPolling: true } : {});
} else {
  db = getFirestore(app);
}

const storage = getStorage(app);

export { app, auth, googleProvider, db, storage };

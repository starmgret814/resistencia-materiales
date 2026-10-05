import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBuHiDaNFsryCyFDjqUtdymTYH93oqltg0",
  authDomain: "resistencia-materiales.firebaseapp.com",
  projectId: "resistencia-materiales",
  storageBucket: "resistencia-materiales.firebasestorage.app",
  messagingSenderId: "721587919055",
  appId: "1:721587919055:web:c6bf064ea1a84ab8bc3fba",
  measurementId: "G-1WN89EY4V4"
};

// Evitar inicializar múltiples veces en Next.js
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

// Firebase app + Auth only. The root layout (AuthProvider) imports this, so every page pays
// only for Auth here; Firestore and Storage live in lib/firebase.js and load with the pages
// and features that use them (a first-time visitor on the landing or legal pages never
// downloads the Firestore SDK).
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDwVdR5oVYSXQbWL4jqNSNx9cqKuKxqt6c",
  authDomain: "gavana-boxing-89a22.firebaseapp.com",
  projectId: "gavana-boxing-89a22",
  storageBucket: "gavana-boxing-89a22.firebasestorage.app",
  messagingSenderId: "1062689232574",
  appId: "1:1062689232574:web:1c362a4577072e51c9f0ef",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Explicit LOCAL persistence — survives page reloads and OAuth redirects (mobile redirect sign-in).
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

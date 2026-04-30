import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDwVdR5oVYSXQbWL4jqNSNx9cqKuKxqt6c",
  authDomain: "gavana-boxing-89a22.firebaseapp.com",
  projectId: "gavana-boxing-89a22",
  storageBucket: "gavana-boxing-89a22.firebasestorage.app",
  messagingSenderId: "1062689232574",
  appId: "1:1062689232574:web:1c362a4577072e51c9f0ef",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
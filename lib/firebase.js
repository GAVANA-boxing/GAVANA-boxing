// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDwVdR5oVYSXQbWL4jqNSNx9cqKuKxqt6c",
  authDomain: "gavana-boxing-89a22.firebaseapp.com",
  projectId: "gavana-boxing-89a22",
  storageBucket: "gavana-boxing-89a22.firebasestorage.app",
  messagingSenderId: "1062689232574",
  appId: "1:1062689232574:web:1c362a4577072e51c9f0ef",
  measurementId: "G-4SW64TETY9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
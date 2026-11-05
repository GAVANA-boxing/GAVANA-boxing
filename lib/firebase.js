import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence, signInAnonymously } from "firebase/auth";
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

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Explicit LOCAL persistence — survives page reloads and OAuth redirects.
// Called once at module load, before any sign-in operation.
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

export const db = getFirestore(app);
export const storage = getStorage(app);

// Persist auth across redirects (critical for signInWithRedirect on mobile)
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}
let guestSignIn;

export async function getTrainingFeedbackToken() {
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser.getIdToken();

  // Keep guest feedback credentials separate from the app's account session.
  const guestApp = initializeApp(app.options, "training-feedback");
  const guestAuth = getAuth(guestApp);
  await guestAuth.authStateReady();

  if (!guestAuth.currentUser) {
    guestSignIn ??= signInAnonymously(guestAuth).finally(() => {
      guestSignIn = undefined;
    });
    const { user } = await guestSignIn;
    return user.getIdToken();
  }

  return guestAuth.currentUser.getIdToken();
}

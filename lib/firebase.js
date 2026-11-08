import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { app, auth } from "@/lib/firebaseApp";

// App + Auth come from lib/firebaseApp.js (loaded by the root layout); this module adds
// Firestore and Storage for the pages that use them.
export { app, auth };
export const db = getFirestore(app);
export const storage = getStorage(app);

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

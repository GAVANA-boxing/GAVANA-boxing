import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "ЧИНИЙ_API_KEY",
  authDomain: "ЧИНИЙ_AUTH_DOMAIN",
  projectId: "ЧИНИЙ_PROJECT_ID",
  storageBucket: "ЧИНИЙ_STORAGE_BUCKET",
  messagingSenderId: "ЧИНИЙ_SENDER_ID",
  appId: "ЧИНИЙ_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
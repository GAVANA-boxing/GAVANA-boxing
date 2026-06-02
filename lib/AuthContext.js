"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const AUTH_REDIRECT_FLAG = "gavana_auth_redirect";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // loading stays true until BOTH onAuthStateChanged AND any pending redirect resolve
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If a redirect was in flight, wait for BOTH onAuthStateChanged AND
    // getRedirectResult before declaring loading=false. Without this gate,
    // onAuthStateChanged fires null first → login page flashes → user confused.
    const hasPendingRedirect =
      typeof window !== "undefined" && !!localStorage.getItem(AUTH_REDIRECT_FLAG);

    let authResolved = false;
    let redirectResolved = !hasPendingRedirect;

    function tryFinish() {
      if (authResolved && redirectResolved) setLoading(false);
    }

    // If a redirect is in flight, process it before releasing the loading gate.
    if (hasPendingRedirect) {
      getRedirectResult(auth)
        .then((cred) => {
          if (cred?.user) setUser(cred.user);
        })
        .catch((err) => {
          console.error("[AuthContext] getRedirectResult error:", err.code, err.message);
        })
        .finally(() => {
          if (typeof window !== "undefined") localStorage.removeItem(AUTH_REDIRECT_FLAG);
          redirectResolved = true;
          tryFinish();
        });
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      authResolved = true;
      tryFinish();
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

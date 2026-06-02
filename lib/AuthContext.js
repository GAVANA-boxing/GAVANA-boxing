"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

const REDIRECT_FLAG = "gavana_auth_redirect";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // loading stays true until BOTH onAuthStateChanged AND any pending redirect resolve
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasPendingRedirect =
      typeof window !== "undefined" && !!localStorage.getItem(REDIRECT_FLAG);

    let authResolved = false;
    let redirectResolved = !hasPendingRedirect;

    function tryFinish() {
      if (authResolved && redirectResolved) setLoading(false);
    }

    // If a redirect is in flight, process it before releasing the loading gate.
    // getRedirectResult is consumed here once; login/page.js checks the same call
    // only for post-auth routing (onboarding vs home) — Firebase returns the
    // credential to the first caller and null to subsequent callers on the same load.
    if (hasPendingRedirect) {
      getRedirectResult(auth)
        .then((cred) => {
          if (cred?.user) setUser(cred.user);
        })
        .catch(() => {})
        .finally(() => {
          if (typeof window !== "undefined") localStorage.removeItem(REDIRECT_FLAG);
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

// Exported so login page can set/clear without duplicating the key string
export const AUTH_REDIRECT_FLAG = REDIRECT_FLAG;

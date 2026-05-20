"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";

function getFriendlyAuthError(error, isSignUp, t) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return t("loginErrInvalidCred");
    case "auth/user-not-found":
      return t("loginErrNotFound");
    case "auth/email-already-in-use":
      return t("loginErrEmailInUse");
    case "auth/weak-password":
      return t("loginErrWeakPassword");
    case "auth/invalid-email":
      return t("loginErrInvalidEmail");
    default:
      return isSignUp ? t("loginErrCreateAccount") : t("loginErrSignIn");
  }
}

export default function LoginPage() {
  const params       = useParams();
  const locale       = getLocale(params?.locale);
  const t            = (key) => translate(locale, key);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const initialMode   = searchParams.get("mode");
  const redirectTo    = redirectParam?.startsWith(`/${locale}/`) ? redirectParam : `/${locale}/reels`;

  const { user, loading: authLoading } = useAuth();
  const [displayName,     setDisplayName]     = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp,        setIsSignUp]        = useState(initialMode === "signup");
  const [loading,         setLoading]         = useState(false);
  const [googleLoading,   setGoogleLoading]   = useState(false);
  const [error,           setError]           = useState("");

  // Onboarding URL preserves the original redirect so fighters land back at the challenge
  const onboardingUrl = redirectParam
    ? `/${locale}/onboarding?redirect=${encodeURIComponent(redirectParam)}`
    : `/${locale}/onboarding`;

  useEffect(() => {
    if (!authLoading && user) router.replace(redirectTo);
  }, [authLoading, user, router, redirectTo]);

  useEffect(() => {
    setIsSignUp(initialMode === "signup");
  }, [initialMode]);

  if (authLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.loadingText}>{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <p style={{ margin: 0, color: GOLD, letterSpacing: 2, fontSize: 12, fontWeight: 800 }}>
              GAVANA BOXING
            </p>
            <h1 style={{ margin: "10px 0 0", fontSize: 28, fontWeight: 900, color: "#fff" }}>
              {t("loginAlreadyLoggedIn")}
            </h1>
          </div>
          <p style={styles.loadingText}>{t("loginRedirecting")}</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user) return;
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        if (!displayName.trim()) { setError(t("loginErrNameRequired")); setLoading(false); return; }
        if (password.length < 6)  { setError(t("loginErrWeakPassword"));  setLoading(false); return; }
        if (password !== confirmPassword) { setError(t("loginErrPasswordMismatch")); setLoading(false); return; }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid), {
          email: cred.user.email,
          username: cred.user.email.split("@")[0],
          displayName: displayName.trim(),
          bio: "",
          photoURL: "",
          profileImageUrl: "",
          role: "boxer",
          onboardingComplete: false,
          createdAt: new Date().toISOString(),
        });
        router.push(onboardingUrl);
        return;
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push(redirectTo);
    } catch (err) {
      console.error("Auth error:", err);
      setError(getFriendlyAuthError(err, isSignUp, t));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (googleLoading) return;
    setError("");
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const { uid, email: gEmail, displayName: gName, photoURL: gPhoto } = cred.user;

      // Check if user doc already exists
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        await setDoc(doc(db, "users", uid), {
          email: gEmail || "",
          username: (gEmail || uid).split("@")[0],
          displayName: gName || "",
          bio: "",
          photoURL: gPhoto || "",
          profileImageUrl: gPhoto || "",
          role: "boxer",
          onboardingComplete: false,
          createdAt: new Date().toISOString(),
        });
        router.push(onboardingUrl);
        return;
      }

      // Existing user — go to destination
      const userData = snap.data();
      if (!userData.onboardingComplete) {
        router.push(onboardingUrl);
      } else {
        router.push(redirectTo);
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError(t("loginGoogleError"));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={{ ...styles.card, ...(isSignUp ? styles.signUpCard : {}) }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ ...styles.modeBadge, ...(isSignUp ? styles.signUpBadge : {}) }}>
            {isSignUp ? t("loginNewFighter") : t("loginMemberAccess")}
          </div>
          <p style={{ margin: 0, color: GOLD, letterSpacing: 2, fontSize: 12, fontWeight: 800 }}>
            GAVANA BOXING
          </p>
          <h1 style={{ margin: "10px 0 0", fontSize: 28, fontWeight: 900, color: "#fff" }}>
            {isSignUp ? t("loginSignUp") : t("login")}
          </h1>
          <p style={styles.helperText}>
            {isSignUp ? t("loginCreateProfile") : t("loginWelcomeBack")}
          </p>
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          style={styles.googleBtn}
        >
          {googleLoading ? (
            <span style={{ opacity: 0.6 }}>{t("loading")}</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              {t("loginContinueWithGoogle")}
            </>
          )}
        </button>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>{t("loginOrSeparator")}</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Email/Password form */}
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
          {isSignUp && (
            <div style={{ display: "grid", gap: 8 }}>
              <label style={styles.fieldLabel}>{t("loginDisplayName")}</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required={isSignUp} maxLength={40} style={styles.input} placeholder={t("loginDisplayNamePlaceholder")} />
            </div>
          )}

          <div style={{ display: "grid", gap: 8 }}>
            <label style={styles.fieldLabel}>{t("loginEmail")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} placeholder="your@email.com" />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={styles.fieldLabel}>{t("loginPassword")}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={isSignUp ? 6 : undefined} style={styles.input} placeholder="••••••••" />
          </div>

          {isSignUp && (
            <div style={{ display: "grid", gap: 8 }}>
              <label style={styles.fieldLabel}>{t("loginConfirmPassword")}</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required={isSignUp} minLength={6} style={styles.input} placeholder="••••••••" />
            </div>
          )}

          {error && <div style={styles.errorBox}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: loading ? "#4d1117" : RED, color: "#fff", fontSize: 15, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 0.2, boxShadow: loading ? "none" : `0 16px 42px ${redAlpha(0.28)}`, transition: "transform 0.18s ease, background 0.2s ease" }}
          >
            {loading ? t("loading") : (isSignUp ? t("loginSignUp") : t("login"))}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            onClick={() => { setError(""); setIsSignUp(!isSignUp); }}
            style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14, textDecoration: "underline" }}
          >
            {isSignUp ? t("loginAlreadyHaveAccount") : t("loginNeedAccount")}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: `radial-gradient(circle at 50% 0%, ${redAlpha(0.22)}, transparent 30%), radial-gradient(circle at 15% 85%, ${goldAlpha(0.12)}, transparent 24%), linear-gradient(180deg, #070707 0%, #0B0B0B 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "sans-serif",
  },
  card: {
    background: "#0B0B0B",
    border: "1px solid #171717",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 24px 80px rgba(0,0,0,0.42)",
  },
  signUpCard: {
    border: `1px solid ${goldAlpha(0.26)}`,
    boxShadow: `0 18px 60px ${redAlpha(0.18)}, 0 14px 40px rgba(0,0,0,0.18)`,
  },
  modeBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#AAAAAA",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  signUpBadge: {
    background: `${goldAlpha(0.1)}`,
    border: `1px solid ${goldAlpha(0.24)}`,
    color: GOLD,
  },
  helperText: {
    margin: "10px 0 0",
    color: "#AAAAAA",
    fontSize: 14,
    lineHeight: 1.45,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#888",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "#131313",
    border: "1px solid #222",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 14,
    outline: "none",
  },
  loadingText: { color: "#fff", textAlign: "center", margin: 0 },
  errorBox: {
    background: "#3a0a0a",
    border: `1px solid ${redAlpha(0.5)}`,
    color: "#ff8b8b",
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "13px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 0,
    transition: "background 0.15s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "20px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "rgba(255,255,255,0.08)",
  },
  dividerText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
};

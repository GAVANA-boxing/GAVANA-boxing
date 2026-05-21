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
import { RED, GOLD, redAlpha } from "@/lib/tokens";

function getFriendlyAuthError(error, isSignUp, t) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":   return t("loginErrInvalidCred");
    case "auth/user-not-found":   return t("loginErrNotFound");
    case "auth/email-already-in-use": return t("loginErrEmailInUse");
    case "auth/weak-password":    return t("loginErrWeakPassword");
    case "auth/invalid-email":    return t("loginErrInvalidEmail");
    default: return isSignUp ? t("loginErrCreateAccount") : t("loginErrSignIn");
  }
}

export default function LoginPage() {
  const params        = useParams();
  const locale        = getLocale(params?.locale);
  const t             = (key) => translate(locale, key);
  const router        = useRouter();
  const searchParams  = useSearchParams();
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
  const [focusedField,    setFocusedField]    = useState(null);

  const onboardingUrl = redirectParam
    ? `/${locale}/onboarding?redirect=${encodeURIComponent(redirectParam)}`
    : `/${locale}/onboarding`;

  useEffect(() => {
    if (!authLoading && user) router.replace(redirectTo);
  }, [authLoading, user, router, redirectTo]);

  useEffect(() => { setIsSignUp(initialMode === "signup"); }, [initialMode]);

  if (authLoading) return (
    <div style={S.page} className="grain-overlay">
      <div className="scanline" />
      <div style={S.loadingWrap}>
        <p style={{ color: GOLD, letterSpacing: 3, fontSize: 11, fontWeight: 900 }}>GAVANA BOXING</p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{t("loading")}</p>
      </div>
    </div>
  );

  if (user) return (
    <div style={S.page} className="grain-overlay">
      <div className="scanline" />
      <div style={S.loadingWrap}>
        <p style={{ color: GOLD, letterSpacing: 3, fontSize: 11, fontWeight: 900 }}>GAVANA BOXING</p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{t("loginAlreadyLoggedIn")}</p>
      </div>
    </div>
  );

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
          bio: "", photoURL: "", profileImageUrl: "",
          role: "boxer", onboardingComplete: false,
          createdAt: new Date().toISOString(),
        });
        router.push(onboardingUrl);
        return;
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push(redirectTo);
    } catch (err) {
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
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        await setDoc(doc(db, "users", uid), {
          email: gEmail || "", username: (gEmail || uid).split("@")[0],
          displayName: gName || "", bio: "",
          photoURL: gPhoto || "", profileImageUrl: gPhoto || "",
          role: "boxer", onboardingComplete: false,
          createdAt: new Date().toISOString(),
        });
        router.push(onboardingUrl);
        return;
      }
      const userData = snap.data();
      router.push(!userData.onboardingComplete ? onboardingUrl : redirectTo);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") setError(t("loginGoogleError"));
    } finally {
      setGoogleLoading(false);
    }
  };

  const inputStyle = (field) => ({
    ...S.input,
    borderColor: focusedField === field ? "rgba(193,18,31,0.7)" : "rgba(255,255,255,0.1)",
    boxShadow: focusedField === field
      ? "0 0 0 1px rgba(193,18,31,0.35), 0 0 20px rgba(193,18,31,0.15)"
      : "none",
  });

  return (
    <div style={S.page} className="grain-overlay">
      {/* Animated scan line */}
      <div className="scanline" />

      {/* Background ambient orbs */}
      <div style={S.orb1} />
      <div style={S.orb2} />

      {/* Top system label */}
      <div style={S.systemBar}>
        <span style={S.systemDot} />
        <span style={S.systemText}>GAVANA COMBAT SYSTEM v2.0</span>
        <span style={{ ...S.systemDot, background: GOLD }} />
      </div>

      {/* HUD card */}
      <div style={S.cardWrap}>
        {/* Corner accents */}
        <div style={S.cornerTL} />
        <div style={S.cornerBR} />

        <div style={S.card}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <p style={S.arenaLabel}>
              {isSignUp
                ? (locale === "mn" ? "БҮРТГҮҮЛЭХ" : locale === "ko" ? "등록하기" : "FIGHTER REGISTRATION")
                : (locale === "mn" ? "ТУЛААНД НЭВТРЭХ" : locale === "ko" ? "아레나 입장" : "ENTER THE ARENA")}
            </p>
            <h1 style={S.mainTitle}>
              {isSignUp ? t("loginSignUp") : t("login")}
            </h1>
            <p style={S.helperText}>
              {isSignUp ? t("loginCreateProfile") : t("loginWelcomeBack")}
            </p>
          </div>

          {/* Google */}
          <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading || loading} style={S.googleBtn}>
            {googleLoading ? (
              <span style={{ opacity: 0.5 }}>{t("loading")}</span>
            ) : (
              <>
                <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                {t("loginContinueWithGoogle")}
              </>
            )}
          </button>

          {/* Divider */}
          <div style={S.divider}>
            <div style={S.dividerLine} />
            <span style={S.dividerText}>{t("loginOrSeparator")}</span>
            <div style={S.dividerLine} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
            {isSignUp && (
              <div style={S.fieldGroup}>
                <label style={S.label}>{t("loginDisplayName")}</label>
                <input
                  className="combat-input"
                  type="text" value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  required={isSignUp} maxLength={40}
                  style={inputStyle("name")}
                  placeholder={t("loginDisplayNamePlaceholder")}
                />
              </div>
            )}

            <div style={S.fieldGroup}>
              <label style={S.label}>{t("loginEmail")}</label>
              <input
                className="combat-input"
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                required
                style={inputStyle("email")}
                placeholder="your@email.com"
              />
            </div>

            <div style={S.fieldGroup}>
              <label style={S.label}>{t("loginPassword")}</label>
              <input
                className="combat-input"
                type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("pass")}
                onBlur={() => setFocusedField(null)}
                required minLength={isSignUp ? 6 : undefined}
                style={inputStyle("pass")}
                placeholder="••••••••"
              />
            </div>

            {isSignUp && (
              <div style={S.fieldGroup}>
                <label style={S.label}>{t("loginConfirmPassword")}</label>
                <input
                  className="combat-input"
                  type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField("confirm")}
                  onBlur={() => setFocusedField(null)}
                  required={isSignUp} minLength={6}
                  style={inputStyle("confirm")}
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && <div style={S.errorBox}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...S.submitBtn,
                background: loading
                  ? "rgba(255,59,48,0.3)"
                  : "#FF3B30",
                boxShadow: loading ? "none" : `0 12px 36px rgba(255,59,48,0.3), 0 0 0 1px rgba(255,59,48,0.2) inset`,
              }}
            >
              {loading ? (
                <span style={{ opacity: 0.6 }}>{t("loading")}</span>
              ) : (
                <span style={{ letterSpacing: 1.5, fontSize: 13 }}>
                  {isSignUp ? t("loginSignUp").toUpperCase() : t("login").toUpperCase()} →
                </span>
              )}
            </button>
          </form>

          <button
            onClick={() => { setError(""); setIsSignUp(!isSignUp); }}
            style={S.switchBtn}
          >
            {isSignUp ? t("loginAlreadyHaveAccount") : t("loginNeedAccount")}
          </button>
        </div>
      </div>

      {/* Bottom system text */}
      <div style={S.bottomSystem}>
        <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>
          GAVANA © 2026 — SECURE CHANNEL
        </span>
      </div>
    </div>
  );
}

const S = {
  page: {
    position: "relative",
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 20px",
    overflow: "hidden",
    background: `
      radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,59,48,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 20% 80%, rgba(255,59,48,0.06) 0%, transparent 50%),
      #0B0B0C
    `,
  },
  orb1: {
    position: "absolute",
    top: "-15%", left: "50%",
    transform: "translateX(-50%)",
    width: 480, height: 320,
    borderRadius: "50%",
    background: "radial-gradient(ellipse, rgba(193,18,31,0.22) 0%, transparent 70%)",
    filter: "blur(40px)",
    animation: "float-drift 14s ease-in-out infinite",
    pointerEvents: "none",
  },
  orb2: {
    position: "absolute",
    bottom: "5%", right: "-10%",
    width: 280, height: 200,
    borderRadius: "50%",
    background: "radial-gradient(ellipse, rgba(193,18,31,0.10) 0%, transparent 70%)",
    filter: "blur(60px)",
    animation: "float-drift 18s ease-in-out infinite reverse",
    pointerEvents: "none",
  },
  systemBar: {
    position: "absolute",
    top: 20,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  systemDot: {
    width: 5, height: 5,
    borderRadius: "50%",
    background: RED,
    boxShadow: `0 0 6px rgba(193,18,31,0.8)`,
    animation: "ambient-pulse 2s ease-in-out infinite",
  },
  systemText: {
    fontSize: 9,
    fontWeight: 900,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  cardWrap: {
    position: "relative",
    width: "100%",
    maxWidth: 420,
    zIndex: 10,
  },
  cornerTL: {
    position: "absolute",
    top: -1, left: -1,
    width: 22, height: 22,
    borderTop: `2px solid rgba(193,18,31,0.8)`,
    borderLeft: `2px solid rgba(193,18,31,0.8)`,
    borderRadius: "4px 0 0 0",
    zIndex: 2,
    animation: "hud-flicker 0.5s ease both",
  },
  cornerBR: {
    position: "absolute",
    bottom: -1, right: -1,
    width: 22, height: 22,
    borderBottom: `2px solid rgba(193,18,31,0.8)`,
    borderRight: `2px solid rgba(193,18,31,0.8)`,
    borderRadius: "0 0 4px 0",
    zIndex: 2,
    animation: "hud-flicker 0.5s ease 0.15s both",
  },
  card: {
    background: "rgba(9,7,9,0.90)",
    backdropFilter: "blur(32px) saturate(140%)",
    WebkitBackdropFilter: "blur(32px) saturate(140%)",
    border: "1px solid rgba(193,18,31,0.18)",
    borderRadius: 16,
    padding: "32px 28px 28px",
    boxShadow: `
      0 0 0 1px rgba(255,255,255,0.04) inset,
      0 40px 100px rgba(0,0,0,0.7),
      0 0 80px rgba(193,18,31,0.07)
    `,
  },
  arenaLabel: {
    margin: "0 0 8px",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 4,
    color: RED,
    textTransform: "uppercase",
    textShadow: "0 0 12px rgba(193,18,31,0.6)",
  },
  mainTitle: {
    margin: "0 0 8px",
    fontSize: 30,
    fontWeight: 900,
    color: "#fff",
    letterSpacing: -0.5,
  },
  helperText: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.38)",
    lineHeight: 1.45,
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "13px 16px",
    borderRadius: 11,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.2s, border-color 0.2s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "18px 0",
  },
  dividerLine: { flex: 1, height: 1, background: "rgba(255,255,255,0.07)" },
  dividerText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  fieldGroup: { display: "grid", gap: 7 },
  label: {
    fontSize: 10,
    fontWeight: 900,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: "13px 15px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  errorBox: {
    background: "rgba(193,18,31,0.12)",
    border: "1px solid rgba(193,18,31,0.35)",
    color: "#ff8b8b",
    padding: "11px 14px",
    borderRadius: 9,
    fontSize: 13,
    lineHeight: 1.4,
  },
  submitBtn: {
    width: "100%",
    padding: "15px",
    borderRadius: 12,
    border: "none",
    color: "#fff",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.15s, box-shadow 0.2s",
    letterSpacing: 0.5,
  },
  switchBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.3)",
    cursor: "pointer",
    fontSize: 13,
    textDecoration: "underline",
    textDecorationColor: "rgba(255,255,255,0.15)",
    display: "block",
    margin: "20px auto 0",
    padding: 0,
  },
  loadingWrap: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "center",
    zIndex: 10,
  },
  bottomSystem: {
    position: "absolute",
    bottom: 16,
    textAlign: "center",
  },
};

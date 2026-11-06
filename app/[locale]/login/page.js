"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth, AUTH_REDIRECT_FLAG } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";
import { getStoredRef, clearStoredRef } from "@/lib/referral";
import AuthLoadingScreen  from "@/components/auth/AuthLoadingScreen";
import LoginPageBackground from "@/components/auth/LoginPageBackground";
import AuthCardHeader     from "@/components/auth/AuthCardHeader";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import AuthEmailForm      from "@/components/auth/AuthEmailForm";
import AuthModeSwitch     from "@/components/auth/AuthModeSwitch";
import LoginPageFooter    from "@/components/auth/LoginPageFooter";
import { CORE_MODE } from "@/lib/coreRoutes";
import { funnel, FUNNEL } from "@/lib/funnel";
import { savePrivateEmail } from "@/lib/privateProfile";
import { glass, glassCard, pageBackground } from "@/components/ui/brand";

// Only true in-app browsers that CANNOT open popups at all need redirect.
// Regular iOS Safari supports signInWithPopup in Firebase 9.9+ — using redirect
// there causes a blank white page due to iOS ITP blocking cookies on firebaseapp.com.
function needsRedirectFlow() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Instagram, Facebook, TikTok, Twitter, Line in-app browsers
  if (/Instagram|FBAN|FBAV|Twitter\/|Line\/|TikTok/.test(ua)) return true;
  // Android WebView (embedded browser in apps)
  if (/Android/.test(ua) && /wv/.test(ua)) return true;
  return false;
}

function getFriendlyGoogleError(code, t) {
  switch (code) {
    case "auth/popup-blocked":
    case "auth/operation-not-supported-in-this-environment":
      return t("loginErrPopupBlocked");
    case "auth/unauthorized-domain":
      return t("loginErrUnauthorizedDomain");
    case "auth/network-request-failed":
    case "auth/internal-error":
      return t("loginErrNetwork");
    case "auth/too-many-requests":
      return t("loginErrTooMany");
    default:
      return t("loginGoogleError");
  }
}

function getFriendlyAuthError(error, isSignUp, t) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":        return t("loginErrInvalidCred");
    case "auth/user-not-found":        return t("loginErrNotFound");
    case "auth/email-already-in-use":  return t("loginErrEmailInUse");
    case "auth/weak-password":         return t("loginErrWeakPassword");
    case "auth/invalid-email":         return t("loginErrInvalidEmail");
    case "auth/network-request-failed":
    case "auth/internal-error":        return t("loginErrNetwork") || "Network error — check your connection and try again.";
    case "auth/too-many-requests":     return t("loginErrTooMany") || "Too many attempts. Please wait a moment.";
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
  const redirectTo    = redirectParam?.startsWith(`/${locale}/`) ? redirectParam : `/${locale}/${CORE_MODE ? "home" : "reels"}`;

  const { user, loading: authLoading } = useAuth();
  const [displayName,     setDisplayName]     = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp,        setIsSignUp]        = useState(initialMode === "signup");
  const [loading,         setLoading]         = useState(false);
  const [googleLoading,   setGoogleLoading]   = useState(false);
  const [error,           setError]           = useState("");
  const [errorCode,       setErrorCode]       = useState("");
  const [focusedField,    setFocusedField]    = useState(null);

  const showError = (msg, code = "") => { setError(msg); setErrorCode(code); };

  const onboardingUrl = redirectParam
    ? `/${locale}/onboarding?redirect=${encodeURIComponent(redirectParam)}`
    : `/${locale}/onboarding`;

  useEffect(() => {
    if (!authLoading && user) router.replace(redirectTo);
  }, [authLoading, user, router, redirectTo]);

  useEffect(() => { setIsSignUp(initialMode === "signup"); }, [initialMode]);

  // Handle Google redirect result — fires after signInWithRedirect returns.
  // AuthContext also calls getRedirectResult to gate loading; this call handles
  // post-auth routing (onboarding vs home). Firebase returns the credential to
  // the first consumer and null to subsequent ones within the same page load.
  useEffect(() => {
    let active = true;
    getRedirectResult(auth)
      .then(async (cred) => {
        // Always clear the flag — AuthContext may have consumed the credential first
        if (typeof window !== "undefined") localStorage.removeItem(AUTH_REDIRECT_FLAG);
        if (!active || !cred) return;
        if (typeof window !== "undefined") localStorage.removeItem(AUTH_REDIRECT_FLAG);
        const { uid, email: gEmail, displayName: gName, photoURL: gPhoto } = cred.user;
        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists()) {
          await setDoc(doc(db, "users", uid), {
            username: (gEmail || uid).split("@")[0],
            displayName: gName || "", bio: "",
            photoURL: gPhoto || "", profileImageUrl: gPhoto || "",
            role: "boxer", onboardingComplete: false, referredBy: getStoredRef() || null,
            createdAt: new Date().toISOString(),
          });
          savePrivateEmail(uid, gEmail).catch(() => {});
          funnel(FUNNEL.AUTH_COMPLETED, { locale, meta: "google:new" });
          router.push(onboardingUrl);
          return;
        }
        const userData = snap.data();
        funnel(FUNNEL.AUTH_COMPLETED, { locale, meta: "google:returning" });
        router.push(!userData.onboardingComplete ? onboardingUrl : redirectTo);
      })
      .catch((err) => {
        if (typeof window !== "undefined") localStorage.removeItem(AUTH_REDIRECT_FLAG);
        if (!active) return;
        if (typeof window !== "undefined") localStorage.removeItem(AUTH_REDIRECT_FLAG);
        console.error("[Google redirect result]", err.code, err.message);
        if (err.code && err.code !== "auth/popup-closed-by-user") {
          showError(getFriendlyGoogleError(err.code, t), err.code);
        }
      });
    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // AuthContext holds loading=true until both onAuthStateChanged AND any pending
  // redirect resolve — so authLoading alone prevents the blank-form flash.
  if (authLoading) {
    const redirectMsg =
      typeof window !== "undefined" && localStorage.getItem(AUTH_REDIRECT_FLAG)
        ? (locale === "mn" ? "Google-ээр нэвтэрч байна..." : locale === "ko" ? "Google로 로그인 중..." : "Signing in with Google...")
        : t("loading");
    return <AuthLoadingScreen message={redirectMsg} />;
  }

  if (user) {
    return <AuthLoadingScreen message={t("loginAlreadyLoggedIn")} />;
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
          username: cred.user.email.split("@")[0],
          displayName: displayName.trim(),
          bio: "", photoURL: "", profileImageUrl: "",
          role: "boxer", onboardingComplete: false, referredBy: getStoredRef() || null,
          createdAt: new Date().toISOString(),
        });
        savePrivateEmail(cred.user.uid, cred.user.email).catch(() => {});
        funnel(FUNNEL.AUTH_COMPLETED, { locale, meta: "email:new" });
        router.push(onboardingUrl);
        return;
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        funnel(FUNNEL.AUTH_COMPLETED, { locale, meta: "email:returning" });
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
    setErrorCode("");
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    // iOS Safari and in-app browsers (Instagram, Facebook, etc.) block popups —
    // use redirect flow directly on those environments.
    // FLAG must be set BEFORE the call so the returning page knows a redirect is
    // in flight and keeps showing loading instead of flashing the login form.
    if (needsRedirectFlow()) {
      try {
        if (typeof window !== "undefined") localStorage.setItem(AUTH_REDIRECT_FLAG, "1");
        await signInWithRedirect(auth, provider);
      } catch (redirectErr) {
        if (typeof window !== "undefined") localStorage.removeItem(AUTH_REDIRECT_FLAG);
        setGoogleLoading(false);
        console.error("[Google redirect error]", redirectErr.code, redirectErr.message);
        showError(getFriendlyGoogleError(redirectErr.code, t), redirectErr.code);
      }
      return;
    }

    try {
      const cred = await signInWithPopup(auth, provider);
      const { uid, email: gEmail, displayName: gName, photoURL: gPhoto } = cred.user;
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        await setDoc(doc(db, "users", uid), {
          username: (gEmail || uid).split("@")[0],
          displayName: gName || "", bio: "",
          photoURL: gPhoto || "", profileImageUrl: gPhoto || "",
          role: "boxer", onboardingComplete: false, referredBy: getStoredRef() || null,
          createdAt: new Date().toISOString(),
        });
        savePrivateEmail(uid, gEmail).catch(() => {});
          funnel(FUNNEL.AUTH_COMPLETED, { locale, meta: "google:new" });
        router.push(onboardingUrl);
        return;
      }
      const userData = snap.data();
      funnel(FUNNEL.AUTH_COMPLETED, { locale, meta: "google:returning" });
      router.push(!userData.onboardingComplete ? onboardingUrl : redirectTo);
    } catch (err) {
      console.error("[Google sign-in error]", err.code, err.message);
      if (err.code === "auth/popup-blocked" || err.code === "auth/operation-not-supported-in-this-environment") {
        // Popup blocked on desktop — fall back to redirect
        try {
          if (typeof window !== "undefined") localStorage.setItem(AUTH_REDIRECT_FLAG, "1");
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirErr) {
          if (typeof window !== "undefined") localStorage.removeItem(AUTH_REDIRECT_FLAG);
          console.error("[Google redirect fallback error]", redirErr.code, redirErr.message);
          showError(getFriendlyGoogleError(redirErr.code, t), redirErr.code);
        }
      } else if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        showError(
          locale === "mn" ? "Google popup хаагдлаа. Дахин оролдоно уу."
            : locale === "ko" ? "Google 팝업이 닫혔습니다. 다시 시도하세요."
            : "Google popup was closed. Please try again.",
          err.code,
        );
      } else {
        showError(getFriendlyGoogleError(err.code, t), err.code);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <LoginPageBackground locale={locale} />

      <div style={S.cardWrap}>
        <div style={S.card}>
          <AuthCardHeader
            isSignUp={isSignUp}
            locale={locale}
            titleText={isSignUp ? t("loginSignUp") : t("login")}
            subtitleText={isSignUp ? t("loginCreateProfile") : t("loginWelcomeBack")}
          />

          <GoogleSignInButton
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            loading={googleLoading}
            labelText={t("loginContinueWithGoogle")}
            loadingText={t("loading")}
            dividerText={t("loginOrSeparator")}
          />

          <AuthEmailForm
            isSignUp={isSignUp}
            loading={loading}
            displayName={displayName}       onDisplayNameChange={setDisplayName}
            email={email}                   onEmailChange={setEmail}
            password={password}             onPasswordChange={setPassword}
            confirmPassword={confirmPassword} onConfirmPasswordChange={setConfirmPassword}
            focusedField={focusedField}
            onFocus={setFocusedField}
            onBlur={() => setFocusedField(null)}
            error={error}
            errorCode={errorCode}
            onSubmit={handleSubmit}
            labels={{
              displayName:     t("loginDisplayName"),
              email:           t("loginEmail"),
              password:        t("loginPassword"),
              confirmPassword: t("loginConfirmPassword"),
            }}
            placeholders={{ displayName: t("loginDisplayNamePlaceholder") }}
            submitLabel={isSignUp ? t("loginSignUp") : t("login")}
            loadingText={t("loading")}
          />

          <AuthModeSwitch
            isSignUp={isSignUp}
            onClick={() => { setError(""); setErrorCode(""); setIsSignUp(!isSignUp); }}
            signInLabel={t("loginAlreadyHaveAccount")}
            signUpLabel={t("loginNeedAccount")}
          />
        </div>

        {/* No account needed to try it: the strongest door in */}
        <button type="button" onClick={() => router.push(`/${locale}/train?autostart=1`)} style={S.tryBtn}>
          <span style={{ display: "block", fontSize: 15.5, fontWeight: 600, color: "#fff" }}>
            {locale === "mn" ? "Бүртгэлгүйгээр туршиж үзэх" : locale === "ko" ? "계정 없이 체험하기" : "Try it without an account"} →
          </span>
          <span style={{ display: "block", marginTop: 3, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
            {locale === "mn" ? "60 секундийн раунд · оноо шууд" : locale === "ko" ? "60초 라운드 · 바로 점수" : "A 60-second round · instant score"}
          </span>
        </button>
      </div>

      <LoginPageFooter locale={locale} />
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
    padding: "calc(76px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))",
    overflow: "hidden",
    color: "#fff",
    background: pageBackground,
  },
  cardWrap: {
    position: "relative",
    width: "100%",
    maxWidth: 420,
    zIndex: 1,
  },
  card: {
    ...glassCard,
    padding: "28px 22px 24px",
    boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
  },
  tryBtn: {
    ...glass,
    width: "100%",
    marginTop: 12,
    padding: "14px 18px",
    borderRadius: 20,
    textAlign: "center",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

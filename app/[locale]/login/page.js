"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";

function getFriendlyAuthError(error, isSignUp) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/user-not-found":
      return "Account not found, please sign up";
    case "auth/email-already-in-use":
      return "This email is already registered. Please sign in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters";
    case "auth/invalid-email":
      return "Please enter a valid email address";
    default:
      return isSignUp
        ? "Could not create account. Please try again"
        : "Could not sign in. Please try again";
  }
}

export default function LoginPage() {
  const params = useParams();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const initialMode = searchParams.get("mode");
  const redirectTo = redirectParam?.startsWith(`/${locale}/`) ? redirectParam : `/${locale}/reels`;
  const { user, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTo);
    }
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
            <p style={{ margin: 0, color: "#D4AF37", letterSpacing: 2, fontSize: 12, fontWeight: 800 }}>
              GAVANA BOXING
            </p>
            <h1 style={{ margin: "10px 0 0", fontSize: 28, fontWeight: 900, color: "#fff" }}>
              You are already logged in
            </h1>
          </div>
          <p style={styles.loadingText}>Redirecting to reels...</p>
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
        if (!displayName.trim()) {
          setError("Display name is required.");
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError("Password should be at least 6 characters");
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create user document
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          username: userCredential.user.email.split("@")[0],
          displayName: displayName.trim(),
          bio: "",
          photoURL: "",
          profileImageUrl: "",
          role: "boxer",
          createdAt: new Date().toISOString(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push(redirectTo);
    } catch (err) {
      console.error("Auth error:", err);
      setError(getFriendlyAuthError(err, isSignUp));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={{
        ...styles.card,
        ...(isSignUp ? styles.signUpCard : {})
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            ...styles.modeBadge,
            ...(isSignUp ? styles.signUpBadge : {})
          }}>
            {isSignUp ? "New fighter" : "Member access"}
          </div>
          <p style={{ margin: 0, color: "#D4AF37", letterSpacing: 2, fontSize: 12, fontWeight: 800 }}>
            GAVANA BOXING
          </p>
          <h1 style={{ margin: "10px 0 0", fontSize: 28, fontWeight: 900, color: "#fff" }}>
            {isSignUp ? "Sign Up" : t("login")}
          </h1>
          <p style={styles.helperText}>
            {isSignUp ? "Create your fighter profile" : "Welcome back to Gavana Boxing"}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
          {isSignUp && (
            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#888", letterSpacing: 1.2, textTransform: "uppercase" }}>
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required={isSignUp}
                maxLength={40}
                style={styles.input}
                placeholder="Your fighter name"
              />
            </div>
          )}

          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#888", letterSpacing: 1.2, textTransform: "uppercase" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="your@email.com"
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#888", letterSpacing: 1.2, textTransform: "uppercase" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isSignUp ? 6 : undefined}
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          {isSignUp && (
            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#888", letterSpacing: 1.2, textTransform: "uppercase" }}>
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={isSignUp}
                minLength={6}
                style={styles.input}
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              {error}
          </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 12,
              border: "none",
              background: loading ? "#4d1117" : "#C1121F",
              color: "#fff",
              fontSize: 15,
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: 0.2,
              boxShadow: loading ? "none" : "0 16px 42px rgba(193,18,31,0.28)",
              transition: "transform 0.18s ease, background 0.2s ease"
            }}
          >
            {loading ? t("loading") : (isSignUp ? "Sign Up" : t("login"))}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            onClick={() => {
              setError("");
              setIsSignUp(!isSignUp);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              cursor: "pointer",
              fontSize: 14,
              textDecoration: "underline"
            }}
          >
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 50% 0%, rgba(193,18,31,0.22), transparent 30%), radial-gradient(circle at 15% 85%, rgba(212,175,55,0.12), transparent 24%), linear-gradient(180deg, #070707 0%, #0B0B0B 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "sans-serif"
  },
  card: {
    background: "#0B0B0B",
    border: "1px solid #171717",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 24px 80px rgba(0,0,0,0.42)"
  },
  signUpCard: {
    border: "1px solid rgba(212,175,55,0.26)",
    boxShadow: "0 18px 60px rgba(193,18,31,0.18), 0 14px 40px rgba(0,0,0,0.18)",
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
    background: "rgba(212,175,55,0.1)",
    border: "1px solid rgba(212,175,55,0.24)",
    color: "#D4AF37",
  },
  helperText: {
    margin: "10px 0 0",
    color: "#AAAAAA",
    fontSize: 14,
    lineHeight: 1.45,
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
  loadingText: {
    color: "#fff",
    textAlign: "center",
    margin: 0,
  },
  signedInBox: {
    background: "#131313",
    border: "1px solid #222",
    borderRadius: 12,
    padding: 16,
  },
  errorBox: {
    background: "#3a0a0a",
    border: "1px solid rgba(193,18,31,0.5)",
    color: "#ff8b8b",
    padding: 12,
    borderRadius: 8,
    fontSize: 14
  },
  primaryButton: {
    width: "100%",
    padding: "16px",
    borderRadius: 12,
    border: "none",
    background: "#C1121F",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    border: "1px solid #333",
    background: "transparent",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
};

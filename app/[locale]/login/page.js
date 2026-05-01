"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

function getFriendlyAuthError(error, isSignUp) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Incorrect email or password";
    case "auth/user-not-found":
      return "Account not found, please sign up";
    case "auth/email-already-in-use":
      return "An account with this email already exists";
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
  const { locale } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(`/${locale}/reels`);
    }
  }, [authLoading, user, router, locale]);

  if (authLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.loadingText}>Loading...</p>
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create user document
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          username: userCredential.user.email.split("@")[0],
          role: "Боксч",
          createdAt: new Date().toISOString(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push(`/${locale}/reels`);
    } catch (err) {
      console.error("Auth error:", err);
      setError(getFriendlyAuthError(err, isSignUp));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ margin: 0, color: "#D4AF37", letterSpacing: 2, fontSize: 12, fontWeight: 800 }}>
            GAVANA BOXING
          </p>
          <h1 style={{ margin: "10px 0 0", fontSize: 28, fontWeight: 900, color: "#fff" }}>
            {isSignUp ? "Sign Up" : "Sign In"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#888", letterSpacing: 1.2, textTransform: "uppercase" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                background: "#131313",
                border: "1px solid #222",
                borderRadius: 12,
                padding: 14,
                color: "#fff",
                fontSize: 14,
                outline: "none"
              }}
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
              style={{
                width: "100%",
                background: "#131313",
                border: "1px solid #222",
                borderRadius: 12,
                padding: 14,
                color: "#fff",
                fontSize: 14,
                outline: "none"
              }}
              placeholder="••••••••"
            />
          </div>

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
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s ease"
            }}
          >
            {loading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
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
    background: "linear-gradient(180deg, #070707 0%, #0B0B0B 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "sans-serif"
  },
  card: {
    background: "#0B0B0B",
    border: "1px solid rgba(212,175,55,0.16)",
    border: "1px solid #171717",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 14px 40px rgba(0,0,0,0.15)"
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

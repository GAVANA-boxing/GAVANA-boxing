"use client";

export default function OfflinePage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #070707 0%, #0b0b0b 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "sans-serif",
      textAlign: "center",
      color: "#fff",
    }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🥊</div>
      <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 900, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
        GAVANA BOXING
      </p>
      <h1 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 900 }}>
        You&apos;re Offline
      </h1>
      <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.55, maxWidth: 280 }}>
        Check your connection and try again. Your training data is saved.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{ marginTop: 32, padding: "14px 32px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
      >
        Retry
      </button>
    </main>
  );
}

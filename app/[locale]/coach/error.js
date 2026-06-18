"use client";

export default function CoachError({ reset }) {
  return (
    <main style={{
      minHeight: "100dvh",
      background: "#090709",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 0,
      color: "#fff",
      textAlign: "center",
      padding: "0 32px",
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: "rgba(200,16,46,0.1)",
        border: "1px solid rgba(200,16,46,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
      }}>
        <span style={{ fontSize: 28 }}>🥊</span>
      </div>

      <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 900, letterSpacing: 3, color: "rgba(200,16,46,0.7)", textTransform: "uppercase" }}>
        GAVANA // COACH
      </p>
      <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>
        COACH OFFLINE
      </h2>
      <p style={{ margin: "0 0 28px", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.55, maxWidth: 240 }}>
        The AI coach couldn&apos;t load. Check your connection and tap retry.
      </p>

      <button
        onClick={() => reset()}
        style={{
          padding: "13px 32px",
          borderRadius: 12,
          border: "none",
          background: "linear-gradient(135deg, #C8102E, #a00f25)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 900,
          letterSpacing: 1,
          cursor: "pointer",
          marginBottom: 12,
        }}
      >
        ↺ &nbsp;RETRY
      </button>

      <button
        onClick={() => { window.history.back(); }}
        style={{
          padding: "13px 32px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "transparent",
          color: "rgba(255,255,255,0.5)",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ← Go Back
      </button>
    </main>
  );
}

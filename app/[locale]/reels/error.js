"use client";

export default function ReelsError({ reset }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100vh", background: "#000",
      color: "#fff", textAlign: "center", padding: 24,
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🥊</div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Feed ачааллахад алдаа гарлаа</h2>
      <p style={{ fontSize: 13, color: "#aaa", marginBottom: 24 }}>Интернэт холболтоо шалгаад дахин оролдоно уу</p>
      <button
        onClick={() => reset()}
        style={{
          background: "#C8102E", color: "#fff", border: "none",
          borderRadius: 8, padding: "12px 28px", fontWeight: 700,
          fontSize: 14, cursor: "pointer",
        }}
      >
        Дахин оролдох
      </button>
    </div>
  );
}

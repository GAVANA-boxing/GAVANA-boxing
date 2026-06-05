export default function Loading() {
  return (
    <div style={{ height: "100dvh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.55)", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
    </div>
  );
}

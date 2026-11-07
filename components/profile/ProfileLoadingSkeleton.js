"use client";

import { pageBackground } from "@/components/ui/brand";

// Mirrors ProfileView's layout (top buttons, centred avatar, name, tags,
// stat pills, edit button, rank card, achievement tiles, session grid) so the
// page doesn't jump when the data arrives.
const bar = (w, h, extra = {}) => ({ width: w, height: h, borderRadius: h / 2, ...extra });

export default function ProfileLoadingSkeleton() {
  return (
    <div aria-busy="true" style={{ minHeight: "100dvh", background: pageBackground, padding: "calc(14px + env(safe-area-inset-top)) 16px 40px" }} className="page-enter">
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <div className="shimmer" style={bar(42, 42)} />
          <div className="shimmer" style={bar(42, 42)} />
        </div>

        <div style={{ display: "grid", justifyItems: "center", gap: 12, marginTop: 36 }}>
          <div className="shimmer" style={bar(112, 112)} />
          <div className="shimmer" style={bar(190, 30, { marginTop: 8 })} />
          <div className="shimmer" style={bar(110, 14)} />
          <div className="shimmer" style={bar(240, 14)} />
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            {[96, 92, 96].map((w, i) => <div key={i} className="shimmer" style={bar(w, 36)} />)}
          </div>
          <div className="shimmer" style={{ width: "100%", height: 46, borderRadius: 14, marginTop: 6 }} />
        </div>

        <div className="shimmer" style={{ height: 118, borderRadius: 24, marginTop: 24 }} />

        <div style={{ display: "flex", gap: 10, marginTop: 26, overflow: "hidden" }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="shimmer" style={{ flex: "0 0 70px", height: 82, borderRadius: 26 }} />)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 34 }}>
          <div className="shimmer" style={{ gridColumn: "span 2", aspectRatio: "2 / 1", borderRadius: 22 }} />
          {[1, 2, 3, 4].map((i) => <div key={i} className="shimmer" style={{ aspectRatio: "1 / 1", borderRadius: 22 }} />)}
        </div>
      </div>
    </div>
  );
}

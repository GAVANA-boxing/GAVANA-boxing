"use client";
import { useState, useEffect } from "react";
import { GOLD } from "@/lib/tokens";
import { COACHES } from "@/lib/reelConstants";
import d from "@/components/reels/reelsDashboardStyles";

const ACCENT_COLORS = [GOLD, "#A855F7", "#3B82F6", "#10B981", "#F97316", "#EC4899"];
const BG_COLORS = [
  "linear-gradient(160deg,#2d1e00 0%,#100b00 100%)",
  "linear-gradient(160deg,#1e0833 0%,#0a0315 100%)",
  "linear-gradient(160deg,#0a1e3d 0%,#030a18 100%)",
  "linear-gradient(160deg,#00200f 0%,#000d06 100%)",
  "linear-gradient(160deg,#2d1000 0%,#100600 100%)",
  "linear-gradient(160deg,#2d0027 0%,#100010 100%)",
];

export default function CoachSection({ router, currentLocale }) {
  const [coaches, setCoaches] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { db } = await import("@/lib/firebase");
        const { collection, query, where, limit, getDocs } = await import("firebase/firestore");
        if (!db) { setCoaches(COACHES); return; }
        const snap = await getDocs(query(collection(db, "users"), where("isCoach", "==", true), limit(6))).catch(() => ({ docs: [] }));
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCoaches(data.length ? data : COACHES);
      } catch {
        setCoaches(COACHES);
      }
    }
    load();
  }, []);

  return (
    <div style={d.rightCard}>
      <div style={d.rightCardHeader}>
        <div style={{ ...d.liveDot, background: GOLD, boxShadow: `0 0 7px ${GOLD}` }} />
        <span style={d.rightCardTitle}>САНАЛ БОЛГОХ КОАЧ</span>
      </div>

      <div className="no-scrollbar" style={d.hScroll}>
        {coaches === null ? (
          [0,1,2].map((i) => (
            <div key={i} style={{ ...d.hCardWide, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ ...d.skeletonPulse, height: 9, width: "60%", borderRadius: 5, marginBottom: 6 }} />
              <div style={{ ...d.skeletonPulse, height: 11, width: "80%", borderRadius: 5, marginBottom: 4 }} />
              <div style={{ ...d.skeletonPulse, height: 9, width: "55%", borderRadius: 5 }} />
            </div>
          ))
        ) : coaches.map((coach, i) => {
          const accent = coach.accent || ACCENT_COLORS[i % ACCENT_COLORS.length];
          const bg = coach.bg || BG_COLORS[i % BG_COLORS.length];
          const name = (coach.displayName || coach.username || coach.name || "КОАЧ").toUpperCase();
          const sub = coach.coachSpecialties?.[0] || coach.sub || "Тренер";
          const rating = coach.rating || "5.0";
          return (
            <button
              key={coach.id}
              className="featured-card"
              style={{ ...d.hCardWide, background: bg }}
              onClick={() => router.push(`/${currentLocale}/coach/${coach.id}`)}
            >
              <div style={{ ...d.hCardBadge, color: accent, borderColor: accent + "40", background: accent + "18" }}>
                КОАЧ
              </div>
              <div style={{ ...d.hCardStat, color: accent }}>★ {rating}</div>
              <div style={d.hCardName}>{name}</div>
              <div style={d.hCardSub}>{sub}</div>
              <div style={{ ...d.hCardLine, background: accent + "60" }} />
            </button>
          );
        })}
      </div>

      <button style={d.viewAllBtn} onClick={() => router.push(`/${currentLocale}/coach`)}>
        БҮГДИЙГ ХАРАХ →
      </button>
    </div>
  );
}

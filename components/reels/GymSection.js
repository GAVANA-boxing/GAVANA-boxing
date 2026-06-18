"use client";
import { useState, useEffect } from "react";
import { RED, GOLD } from "@/lib/tokens";
import { GYMS } from "@/lib/reelConstants";
import d from "@/components/reels/reelsDashboardStyles";

const GYM_ACCENTS = [RED, "#3B82F6", "#10B981", GOLD, "#A855F7", "#F97316"];
const GYM_BGS = [
  "linear-gradient(160deg,#3d0007 0%,#150002 100%)",
  "linear-gradient(160deg,#0a1e3d 0%,#030a18 100%)",
  "linear-gradient(160deg,#00200f 0%,#000d06 100%)",
  "linear-gradient(160deg,#2d1e00 0%,#100b00 100%)",
  "linear-gradient(160deg,#1e0833 0%,#0a0315 100%)",
  "linear-gradient(160deg,#2d1000 0%,#100600 100%)",
];

export default function GymSection({ router, currentLocale }) {
  const [gyms, setGyms] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { db } = await import("@/lib/firebase");
        const { collection, query, limit, getDocs, orderBy } = await import("firebase/firestore");
        if (!db) { setGyms(GYMS); return; }
        const snap = await getDocs(query(collection(db, "gyms"), orderBy("memberCount", "desc"), limit(6))).catch(() => ({ docs: [] }));
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setGyms(data.length ? data : GYMS);
      } catch {
        setGyms(GYMS);
      }
    }
    load();
  }, []);

  return (
    <div style={d.rightCard}>
      <div style={d.rightCardHeader}>
        <span style={{ ...d.liveDot, background: GOLD, boxShadow: `0 0 7px ${GOLD}` }} />
        <span style={d.rightCardTitle}>ОНЦЛОХ ЗААЛ</span>
      </div>

      <div className="no-scrollbar" style={d.hScroll}>
        {gyms === null ? (
          [0,1,2].map((i) => (
            <div key={i} style={{ ...d.hCardWide, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ ...d.skeletonPulse, height: 9, width: "60%", borderRadius: 5, marginBottom: 6 }} />
              <div style={{ ...d.skeletonPulse, height: 11, width: "80%", borderRadius: 5, marginBottom: 4 }} />
              <div style={{ ...d.skeletonPulse, height: 9, width: "55%", borderRadius: 5 }} />
            </div>
          ))
        ) : gyms.map((gym, i) => {
          const accent = gym.accent || GYM_ACCENTS[i % GYM_ACCENTS.length];
          const bg = gym.bg || GYM_BGS[i % GYM_BGS.length];
          const name = (gym.name || gym.gymName || "ЗААЛ").toUpperCase();
          const city = gym.city || gym.location || "";
          const members = gym.memberCount || gym.members || 0;
          return (
            <button
              key={gym.id}
              className="featured-card"
              style={{ ...d.hCardWide, background: bg }}
              onClick={() => router.push(`/${currentLocale}/gyms/${gym.id}`)}
            >
              <div style={{ ...d.hCardBadge, color: accent, borderColor: accent + "40", background: accent + "18" }}>
                ЗААЛ
              </div>
              <div style={{ ...d.hCardStat, color: accent }}>{members} гишүүн</div>
              <div style={d.hCardName}>{name}</div>
              <div style={d.hCardSub}>{city}</div>
              <div style={{ ...d.hCardLine, background: accent + "60" }} />
            </button>
          );
        })}
      </div>

      <button style={d.viewAllBtn} onClick={() => router.push(`/${currentLocale}/gyms`)}>
        БҮГДИЙГ ХАРАХ →
      </button>
    </div>
  );
}

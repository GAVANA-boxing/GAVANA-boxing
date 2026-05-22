"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppSidebar from "./AppSidebar";
import { RED, RED_DARK, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import { useAuth } from "@/lib/AuthContext";
import { getFighterRank } from "@/lib/xp";

// ─── Right panel: quick-access widgets ───────────────────────────────────────
function RightPanel({ locale }) {
  const { user } = useAuth();
  const router = useRouter();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    (async () => {
      try {
        const { db } = await import("@/lib/firebase");
        const { doc, getDoc, collection, query, where, getDocs, orderBy, limit } = await import("firebase/firestore");
        const [userSnap, sessSnap] = await Promise.all([
          getDoc(doc(db, "users", user.uid)),
          getDocs(query(collection(db, "training_sessions"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(4))),
        ]);
        if (cancelled) return;
        if (userSnap.exists()) {
          const d = userSnap.data();
          setXp(Number(d.xp) || 0);
          setStreak(Number(d.streakCount || d.dailyStreak) || 0);
        }
        setRecentSessions(sessSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoaded(true);
      } catch { setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const rank = getFighterRank(xp);
  const now = new Date();
  const timeLabel = now.getHours() < 12 ? "MORNING" : now.getHours() < 17 ? "AFTERNOON" : "EVENING";

  return (
    <aside style={rp.panel}>

      {/* ── Time greeting ── */}
      <div style={rp.greeting}>
        <div style={rp.greetTime}>{timeLabel} SESSION</div>
        <div style={rp.greetDate}>{now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
      </div>

      {/* ── Quick stats ── */}
      <div style={rp.statsGrid}>
        <div style={rp.statCard}>
          <div style={{ ...rp.statVal, color: "#FB923C" }}>{streak}d</div>
          <div style={rp.statLbl}>STREAK</div>
        </div>
        <div style={rp.statCard}>
          <div style={{ ...rp.statVal, color: rank.color }}>{xp >= 1000 ? `${(xp/1000).toFixed(1)}k` : xp}</div>
          <div style={rp.statLbl}>XP</div>
        </div>
        <div style={rp.statCard}>
          <div style={{ ...rp.statVal, color: GOLD }}>{recentSessions.length > 0 ? Number(Math.max(...recentSessions.map(s => Number(s.score) || 0))).toFixed(1) : "—"}</div>
          <div style={rp.statLbl}>BEST</div>
        </div>
      </div>

      {/* ── Rank badge ── */}
      <button
        onClick={() => router.push(`/${locale}/rank`)}
        style={rp.rankCard}
        className="tap-bounce"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ ...rp.rankIcon, background: `${rank.color}18`, border: `1px solid ${rank.color}40` }}>
            <span style={{ fontSize: 18 }}>{rank.emoji || "🥊"}</span>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, textTransform: "uppercase" }}>Current Rank</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: rank.color, letterSpacing: 0.3 }}>{rank.label || "Rookie"}</div>
          </div>
        </div>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {/* ── Recent sessions ── */}
      {loaded && recentSessions.length > 0 && (
        <div style={rp.section}>
          <div style={rp.sectionLabel}>RECENT</div>
          {recentSessions.map(s => {
            const score = Number(s.score);
            const color = score >= 7 ? "#4ade80" : score >= 5 ? GOLD : "#f87171";
            return (
              <div key={s.id} style={rp.sessionRow}>
                <div style={{ ...rp.sessionScore, color, background: `${color}10`, border: `1px solid ${color}22` }}>
                  {Number.isFinite(score) ? score.toFixed(1) : "—"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.reelId ? `Reel ${String(s.reelId).slice(0,6)}…` : "Free Training"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick actions ── */}
      <div style={rp.actions}>
        <button style={{ ...rp.actionBtn, background: `linear-gradient(135deg, ${RED}, ${RED_DARK})`, border: `1px solid ${redAlpha(0.4)}`, boxShadow: `0 4px 16px ${redAlpha(0.3)}` }} onClick={() => router.push(`/${locale}/reels`)} className="tap-bounce">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Train Now
        </button>
        <button style={{ ...rp.actionBtn, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} onClick={() => router.push(`/${locale}/sparring`)} className="tap-bounce">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/></svg>
          Sparring
        </button>
      </div>

    </aside>
  );
}

// ─── Main layout ──────────────────────────────────────────────────────────────
export default function DashboardLayout({ children, currentLocale }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const locale = currentLocale || pathname?.split("/")?.[1] || "mn";

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const h = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  if (!mounted || !isDesktop) return <>{children}</>;

  return (
    <div style={s.shell}>
      <AppSidebar currentLocale={locale} />
      <div className="dash-center" style={s.center}>
        {children}
      </div>
      <RightPanel locale={locale} />
    </div>
  );
}

// ─── Shell styles ─────────────────────────────────────────────────────────────
const s = {
  shell: {
    display: "flex",
    height: "100dvh",
    overflow: "hidden",
    background: `radial-gradient(ellipse 50% 35% at 30% 0%, ${redAlpha(0.09)} 0%, transparent 55%), #0B0B0C`,
    color: "#fff",
  },
  center: {
    flex: 1,
    overflowY: "auto",
    scrollbarWidth: "none",
    minWidth: 0,
  },
};

// ─── Right panel styles ───────────────────────────────────────────────────────
const rp = {
  panel: {
    width: 256,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "20px 12px 16px",
    borderLeft: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(14,14,16,0.96)",
    height: "100dvh",
    overflowY: "auto",
    scrollbarWidth: "none",
    boxShadow: "-1px 0 0 rgba(255,255,255,0.02)",
  },
  greeting: {
    padding: "4px 4px 8px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    marginBottom: 4,
  },
  greetTime: {
    fontSize: 9,
    fontWeight: 900,
    color: "rgba(255,255,255,0.2)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  greetDate: {
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(255,255,255,0.5)",
    marginTop: 3,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 6,
  },
  statCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: "10px 8px",
    textAlign: "center",
  },
  statVal: {
    fontSize: 18,
    fontWeight: 900,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    lineHeight: 1,
    marginBottom: 4,
  },
  statLbl: {
    fontSize: 8,
    fontWeight: 800,
    color: "rgba(255,255,255,0.28)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  rankCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.06)",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
  },
  rankIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  section: { display: "flex", flexDirection: "column", gap: 2 },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 900,
    color: "rgba(255,255,255,0.2)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
    paddingLeft: 2,
  },
  sessionRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 4px",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
  sessionScore: {
    width: 34,
    height: 34,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 900,
    flexShrink: 0,
  },
  actions: { display: "flex", flexDirection: "column", gap: 7, marginTop: "auto" },
  actionBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    width: "100%",
    padding: "11px",
    borderRadius: 10,
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 0.3,
  },
};

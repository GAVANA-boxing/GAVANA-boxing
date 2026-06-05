"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname } from "@/lib/i18n";
import { RED, GOLD } from "@/lib/tokens";

const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || "").split(",").filter(Boolean);

function label(locale, en, mn, ko) {
  if (locale === "mn") return mn;
  if (locale === "ko") return ko;
  return en;
}

function StatCard({ value, sublabel, color = "#fff" }) {
  return (
    <div style={{ flex: "1 1 calc(50% - 6px)", minWidth: 0, padding: "16px 12px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 28, fontWeight: 1000, color, fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>{value ?? "—"}</div>
      <div style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.2 }}>{sublabel}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth + admin check
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push(`/${locale}/login`); return; }

    async function checkAdmin() {
      let admin = ADMIN_UIDS.includes(user.uid) || user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      if (!admin) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          admin = snap.data()?.isAdmin === true;
        } catch (_) {}
      }
      if (!admin) { router.push(`/${locale}/`); return; }
      setIsAdmin(true);
      setChecking(false);
    }
    checkAdmin();
  }, [authLoading, user, router, locale]);

  // Establish admin session cookie
  useEffect(() => {
    if (!isAdmin || !user) return;
    user.getIdToken().then((token) => {
      fetch("/api/admin/session", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    });
  }, [isAdmin, user]);

  // Load stats
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;

    async function load() {
      setLoading(true);
      try {
        // Users (up to 500)
        const usersSnap = await getDocs(query(collection(db, "users"), limit(500)));
        const totalUsers = usersSnap.size;
        const tiers = { fan: 0, pro: 0, champion: 0, other: 0 };
        usersSnap.docs.forEach((d) => {
          const tier = d.data().subscriptionTier || "fan";
          if (tier === "pro") tiers.pro++;
          else if (tier === "champion") tiers.champion++;
          else if (tier === "fan") tiers.fan++;
          else tiers.other++;
        });

        // Analytics events (last 20)
        let eventsData = [];
        try {
          const evSnap = await getDocs(query(collection(db, "analytics_events"), orderBy("ts", "desc"), limit(20)));
          eventsData = evSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch (_) {}

        // 7-day counts from analytics_events
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        let sessionCount7d = 0;
        let dnaUnlocked7d = 0;
        eventsData.forEach((ev) => {
          const ts = ev.ts?.toMillis ? ev.ts.toMillis() : (ev.ts?.seconds ? ev.ts.seconds * 1000 : 0);
          if (ts >= sevenDaysAgo) {
            if (ev.event === "session_start" || ev.event === "session_complete") sessionCount7d++;
            if (ev.event === "dna_unlocked" || ev.event === "dna_complete") dnaUnlocked7d++;
          }
        });

        if (!active) return;
        setStats({ totalUsers, tiers, sessionCount7d, dnaUnlocked7d });
        setEvents(eventsData);
      } catch (err) {
        // silently fail
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [isAdmin]);

  if (authLoading || checking) {
    return <div style={{ minHeight: "100dvh", background: "#0B0B0C" }} />;
  }

  const pageTitle = label(locale, "PLATFORM STATS", "ПЛАТФОРМЫН МЭДЭЭЛЭЛ", "플랫폼 통계");

  return (
    <div style={{ minHeight: "100dvh", background: "#0B0B0C", color: "#fff", paddingBottom: 40 }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(11,11,12,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" onClick={() => router.push(`/${locale}/`)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase" }}>Admin</p>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff" }}>{pageTitle}</h1>
        </div>
      </header>

      <div style={{ padding: "16px 16px 0" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[120, 80, 200].map((h, i) => (
              <div key={i} style={{ height: h, borderRadius: 14, background: "rgba(255,255,255,0.05)" }} className="shimmer" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <StatCard
                value={stats?.totalUsers}
                sublabel={label(locale, "Total Users", "Нийт хэрэглэгч", "전체 사용자")}
                color="#fff"
              />
              <StatCard
                value={stats?.tiers.pro}
                sublabel={label(locale, "Pro Members", "Про гишүүд", "프로 멤버")}
                color={GOLD}
              />
              <StatCard
                value={stats?.tiers.champion}
                sublabel={label(locale, "Champion", "Чемпион", "챔피언")}
                color={RED}
              />
              <StatCard
                value={stats?.tiers.fan}
                sublabel={label(locale, "Fan (Free)", "Фан (Үнэгүй)", "팬 (무료)")}
                color="rgba(255,255,255,0.55)"
              />
              <StatCard
                value={stats?.sessionCount7d}
                sublabel={label(locale, "Sessions (7d)", "Дасгал (7 хоног)", "세션 (7일)")}
                color="#34D399"
              />
              <StatCard
                value={stats?.dnaUnlocked7d}
                sublabel={label(locale, "DNA Unlocked (7d)", "ДНХ нээгдсэн (7 хоног)", "DNA 활성화 (7일)")}
                color="#818CF8"
              />
            </div>

            {/* Admin links */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/admin/moderation`)}
                style={{ flex: 1, padding: "12px 10px", borderRadius: 12, border: `1px solid rgba(255,59,48,0.3)`, background: "rgba(255,59,48,0.07)", color: RED, fontSize: 12, fontWeight: 900, cursor: "pointer" }}
              >
                {label(locale, "Moderation", "Хяналт", "관리")}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/admin/featured-creators`)}
                style={{ flex: 1, padding: "12px 10px", borderRadius: 12, border: `1px solid rgba(245,196,81,0.3)`, background: "rgba(245,196,81,0.07)", color: GOLD, fontSize: 12, fontWeight: 900, cursor: "pointer" }}
              >
                {label(locale, "Featured", "Онцлох", "추천")}
              </button>
            </div>

            {/* Recent events */}
            {events.length > 0 && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 10 }}>
                  {label(locale, "Recent Events", "Сүүлийн үйлдлүүд", "최근 이벤트")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {events.map((ev, i) => {
                    const ts = ev.ts?.toDate ? ev.ts.toDate() : ev.ts?.seconds ? new Date(ev.ts.seconds * 1000) : null;
                    const timeStr = ts
                      ? ts.toLocaleString(locale === "ko" ? "ko-KR" : locale === "mn" ? "mn-MN" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "";
                    const url = ev.url || ev.page || "";
                    const shortUrl = url.replace(/^https?:\/\/[^/]+/, "").slice(0, 40) || "—";
                    return (
                      <div key={ev.id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: GOLD, minWidth: 110, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ev.event || ev.type || "event"}
                        </span>
                        <span style={{ flex: 1, fontSize: 10, color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {shortUrl}
                        </span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{timeStr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {events.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {label(locale, "No analytics events yet", "Аналитик мэдээлэл алга байна", "분석 이벤트 없음")}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

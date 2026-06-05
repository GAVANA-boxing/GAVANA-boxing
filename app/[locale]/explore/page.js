"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocale } from "@/lib/i18n";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query, where, Timestamp } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import { RED, GOLD } from "@/lib/tokens";

const TABS = [
  { key: "discover", en: "Discover",  mn: "Нээх",    ko: "탐색" },
  { key: "events",   en: "Events",    mn: "Арга хэмжээ", ko: "이벤트" },
  { key: "programs", en: "Programs",  mn: "Хөтөлбөр", ko: "프로그램" },
];

const TYPE_META = {
  boxing:     { mn: "Бокс",     ko: "복싱",    en: "Boxing",      color: RED,      emoji: "🥊" },
  mma:        { mn: "MMA",      ko: "MMA",     en: "MMA",         color: "#8B5CF6", emoji: "⚔️" },
  muay_thai:  { mn: "Муай Тай", ko: "무에타이", en: "Muay Thai",   color: "#F97316", emoji: "🦵" },
  sparring:   { mn: "Спарринг", ko: "스파링",   en: "Sparring",    color: "#34D399", emoji: "🤜" },
  tournament: { mn: "Тэмцээн",  ko: "토너먼트", en: "Tournament",  color: GOLD,     emoji: "🏆" },
  seminar:    { mn: "Семинар",   ko: "세미나",   en: "Seminar",    color: "#60A5FA", emoji: "📚" },
};

const LEVEL_COLOR = { beginner: "#34D399", intermediate: GOLD, advanced: RED };

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ height: 72, borderRadius: 14, background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  );
}

function EmptyCard({ label }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 700 }}>
      {label}
    </div>
  );
}

export default function ExplorePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale = getLocale(params?.locale);

  const [activeTab, setActiveTab] = useState("discover");
  const [reels, setReels] = useState([]);
  const [events, setEvents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const L = (en, mn, ko) => locale === "mn" ? mn : locale === "ko" ? ko : en;

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        if (activeTab === "discover") {
          const snap = await getDocs(query(collection(db, "reels"), orderBy("likeCount", "desc"), limit(15)));
          if (active) setReels(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } else if (activeTab === "events") {
          const now = Timestamp.now();
          const snap = await getDocs(query(collection(db, "events"), where("date", ">=", now), orderBy("date", "asc"), limit(20)));
          if (active) setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } else if (activeTab === "programs") {
          const snap = await getDocs(query(collection(db, "programs"), limit(20)));
          if (active) setPrograms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch { /* silent */ }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [activeTab]);

  return (
    <div style={{ minHeight: "100dvh", background: "#09090b", color: "#fff", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: "max(env(safe-area-inset-top), 16px) 16px 0", background: "rgba(9,9,11,0.95)", position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(16px)" }}>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5, marginBottom: 12 }}>
          {L("Explore", "Нээх", "탐색")}
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flexShrink: 0,
                  padding: "7px 18px",
                  borderRadius: 20,
                  border: isActive ? `1px solid ${RED}55` : "1px solid rgba(255,255,255,0.1)",
                  background: isActive ? `${RED}18` : "rgba(255,255,255,0.04)",
                  color: isActive ? RED : "rgba(255,255,255,0.5)",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  transition: "all 160ms ease",
                }}
              >
                {locale === "mn" ? tab.mn : locale === "ko" ? tab.ko : tab.en}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 16px" }}>
        {loading ? <Skeleton /> : (

          activeTab === "discover" ? (
            reels.length === 0 ? <EmptyCard label={L("No content yet", "Контент алга", "콘텐츠 없음")} /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {reels.map((reel) => (
                  <div
                    key={reel.id}
                    onClick={() => router.push(`/${locale}/feed`)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: "rgba(255,255,255,0.08)", flexShrink: 0, overflow: "hidden" }}>
                      {reel.thumbnailUrl && <img src={reel.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {reel.caption || reel.description || L("Training reel", "Дасгал рийл", "훈련 릴")}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                        ❤️ {reel.likeCount || 0}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/feed`)}
                  style={{ width: "100%", padding: "12px 0", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 800, cursor: "pointer", marginTop: 4 }}
                >
                  {L("Open Full Feed →", "Фийд нээх →", "전체 피드 →")}
                </button>
              </div>
            )
          ) : activeTab === "events" ? (
            events.length === 0 ? <EmptyCard label={L("No upcoming events", "Удахгүй болох арга хэмжээ алга", "예정된 이벤트 없음")} /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {events.map((ev) => {
                  const meta = TYPE_META[ev.type] || { color: RED, emoji: "🥊", en: ev.type, mn: ev.type, ko: ev.type };
                  const dateStr = ev.date?.toDate ? ev.date.toDate().toLocaleDateString(locale === "ko" ? "ko-KR" : locale === "mn" ? "mn-MN" : "en-US", { month: "short", day: "numeric" }) : "";
                  return (
                    <div
                      key={ev.id}
                      onClick={() => router.push(`/${locale}/events`)}
                      style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1px solid ${meta.color}22`, cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 16 }}>{meta.emoji}</span>
                        <span style={{ fontSize: 11, fontWeight: 900, color: meta.color, textTransform: "uppercase", letterSpacing: 1 }}>
                          {locale === "mn" ? meta.mn : locale === "ko" ? meta.ko : meta.en}
                        </span>
                        {dateStr && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: "auto" }}>{dateStr}</span>}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                        {ev.title || L("Upcoming Event", "Арга хэмжээ", "이벤트")}
                      </div>
                      {ev.location && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>📍 {ev.location}</div>}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/events`)}
                  style={{ width: "100%", padding: "12px 0", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 800, cursor: "pointer", marginTop: 4 }}
                >
                  {L("See All Events →", "Бүх арга хэмжээ →", "전체 이벤트 →")}
                </button>
              </div>
            )
          ) : (
            programs.length === 0 ? <EmptyCard label={L("No programs yet", "Хөтөлбөр алга", "프로그램 없음")} /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {programs.map((prog) => {
                  const lvlColor = LEVEL_COLOR[prog.level] || RED;
                  return (
                    <div
                      key={prog.id}
                      onClick={() => router.push(`/${locale}/programs`)}
                      style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1px solid ${lvlColor}22`, cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: lvlColor, textTransform: "uppercase", letterSpacing: 1, background: `${lvlColor}18`, padding: "2px 8px", borderRadius: 8 }}>
                          {prog.level || L("All Levels", "Бүх түвшин", "전체")}
                        </span>
                        {prog.duration && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: "auto" }}>{prog.duration}</span>}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                        {prog.title || L("Program", "Хөтөлбөр", "프로그램")}
                      </div>
                      {prog.description && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{prog.description}</div>}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/programs`)}
                  style={{ width: "100%", padding: "12px 0", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 800, cursor: "pointer", marginTop: 4 }}
                >
                  {L("See All Programs →", "Бүх хөтөлбөр →", "전체 프로그램 →")}
                </button>
              </div>
            )
          )
        )}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="explore" />
    </div>
  );
}

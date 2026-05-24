"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { buildCoachSnapshot, buildCoachContext } from "@/lib/buildCoachContext";
import { RED, GOLD, redAlpha, goldAlpha, RADIUS } from "@/lib/tokens";

const AREAS = ["Power", "Speed", "Timing", "Footwork", "Guard", "Accuracy"];
const AREA_COLOR = {
  Power: RED, Speed: "#FB923C", Timing: GOLD,
  Footwork: "#60A5FA", Guard: "#A78BFA", Accuracy: "#34D399",
};
const DRILL_TYPES = [
  { key: "shadow", labelEn: "Shadow", labelMn: "Сүүдэр" },
  { key: "bag", labelEn: "Bag Work", labelMn: "Уут" },
  { key: "conditioning", labelEn: "Conditioning", labelMn: "Дасгал" },
];

const DIFF_COLOR = { Beginner: "#34D399", Intermediate: GOLD, Advanced: RED };
const DIFF_MN = { Beginner: "Эхлэгч", Intermediate: "Дунд", Advanced: "Ахисан" };

function cacheKey(userId, area, type) {
  return `gavana_drills_${userId}_${area}_${type}`;
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { drills, ts } = JSON.parse(raw);
    if (Date.now() - ts > 24 * 3600 * 1000) return null;
    return drills;
  } catch { return null; }
}

function writeCache(key, drills) {
  try { localStorage.setItem(key, JSON.stringify({ drills, ts: Date.now() })); } catch { /* */ }
}

export default function DrillsPage() {
  const { locale } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const mn = locale === "mn";
  const ko = locale === "ko";

  const [coachSnapshot, setCoachSnapshot] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedType, setSelectedType] = useState("shadow");
  const [drills, setDrills] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load sessions + build snapshot
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const q = query(
          collection(db, "training_sessions"),
          where("userId", "==", user.uid),
          where("type", "==", "training"),
          orderBy("createdAt", "desc"),
          limit(40),
        );
        const snap = await getDocs(q);
        const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (!active) return;
        const snapshot = buildCoachSnapshot({ sessions });
        setCoachSnapshot(snapshot);
        // Auto-select weakest area
        if (snapshot?.weakAreas?.[0]?.[0]) {
          setSelectedArea(snapshot.weakAreas[0][0]);
        } else {
          setSelectedArea("Power");
        }
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, [user?.uid]);

  const generate = useCallback(async () => {
    if (!selectedArea || !selectedType || !user?.uid) return;
    const key = cacheKey(user.uid, selectedArea, selectedType);
    const cached = readCache(key);
    if (cached) { setDrills(cached); return; }

    setLoading(true);
    setError(null);
    setDrills(null);

    const contextStr = coachSnapshot ? buildCoachContext({ snapshot: coachSnapshot, locale }) : "";
    const prompt = `${contextStr ? contextStr + "\n\n" : ""}Generate exactly 5 boxing drills for the area: ${selectedArea}, drill type: ${selectedType}.
Return ONLY valid JSON array, no markdown, no explanation:
[{"name":"...","difficulty":"Beginner|Intermediate|Advanced","duration":"...","steps":["step1","step2","step3"]}]`;

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ message: prompt, persona: "analyst", locale }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const text = data.reply || data.message || "";
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Bad response");
      const parsed = JSON.parse(match[0]);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty drills");
      writeCache(key, parsed);
      setDrills(parsed);
    } catch {
      setError(mn ? "Алдаа гарлаа. Дахин оролдоно уу." : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedArea, selectedType, user, coachSnapshot, locale, mn]);

  // Re-trigger when area/type changes if drills already shown
  useEffect(() => {
    if (drills) setDrills(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArea, selectedType]);

  const accent = AREA_COLOR[selectedArea] || RED;

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0a0b", paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(10,10,11,0.9)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "14px 16px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 480, margin: "0 auto" }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "4px 2px", lineHeight: 1 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: redAlpha(0.65), letterSpacing: 2.5, textTransform: "uppercase" }}>
              {mn ? "GAVANA · ДАСГАЛ" : ko ? "GAVANA · 드릴" : "GAVANA · DRILLS"}
            </p>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
              {mn ? "AI Дасгал үүсгэгч" : ko ? "AI 드릴 생성기" : "AI Drill Generator"}
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 0" }}>
        {/* Weak area hint */}
        {coachSnapshot?.weakAreas?.[0]?.[0] && (
          <div style={{
            marginBottom: 16,
            padding: "9px 13px",
            borderRadius: 11,
            background: redAlpha(0.08),
            border: `1px solid ${redAlpha(0.2)}`,
            borderLeft: `3px solid ${RED}`,
          }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
              {mn ? "🎯 Хамгийн сул тал: " : "🎯 Weakest area: "}
            </span>
            <span style={{ fontSize: 11, fontWeight: 900, color: AREA_COLOR[coachSnapshot.weakAreas[0][0]] || RED }}>
              {coachSnapshot.weakAreas[0][0]}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>
              {mn ? "— автоматаар сонгогдлоо" : "— auto-selected"}
            </span>
          </div>
        )}

        {/* Area chips */}
        <p style={{ margin: "0 0 8px", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase" }}>
          {mn ? "Чиглэл" : "Area"}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
          {AREAS.map((area) => {
            const col = AREA_COLOR[area];
            const active = selectedArea === area;
            return (
              <button
                key={area}
                type="button"
                onClick={() => setSelectedArea(area)}
                style={{
                  padding: "7px 14px",
                  borderRadius: RADIUS.full,
                  background: active ? `${col}22` : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${active ? col + "66" : "rgba(255,255,255,0.08)"}`,
                  color: active ? col : "rgba(255,255,255,0.45)",
                  fontSize: 12, fontWeight: 800, cursor: "pointer",
                  transition: "all 150ms ease",
                }}
              >
                {area}
              </button>
            );
          })}
        </div>

        {/* Type chips */}
        <p style={{ margin: "0 0 8px", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase" }}>
          {mn ? "Дасгалын төрөл" : "Drill Type"}
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {DRILL_TYPES.map((t) => {
            const active = selectedType === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelectedType(t.key)}
                style={{
                  flex: 1, padding: "9px 0",
                  borderRadius: 11,
                  background: active ? goldAlpha(0.12) : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${active ? goldAlpha(0.4) : "rgba(255,255,255,0.07)"}`,
                  color: active ? GOLD : "rgba(255,255,255,0.4)",
                  fontSize: 12, fontWeight: 800, cursor: "pointer",
                  transition: "all 150ms ease",
                }}
              >
                {mn ? t.labelMn : t.labelEn}
              </button>
            );
          })}
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={generate}
          disabled={loading || !selectedArea}
          style={{
            width: "100%", padding: "14px 0",
            borderRadius: 13,
            background: loading ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            border: "none",
            color: loading ? "rgba(255,255,255,0.3)" : "#fff",
            fontSize: 14, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: 0.3,
            boxShadow: loading ? "none" : `0 4px 20px ${accent}44`,
            transition: "all 200ms ease",
            marginBottom: 28,
          }}
        >
          {loading
            ? (mn ? "Үүсгэж байна..." : "Generating...")
            : (mn ? "⚡ Дасгал үүсгэх" : ko ? "⚡ 드릴 생성" : "⚡ Generate Drills")}
        </button>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 20, padding: "12px 14px", borderRadius: 11,
            background: redAlpha(0.08), border: `1px solid ${redAlpha(0.25)}`,
            color: RED, fontSize: 12, fontWeight: 700,
          }}>
            {error}
          </div>
        )}

        {/* Drill cards */}
        {drills && drills.map((drill, i) => (
          <DrillCard key={i} drill={drill} index={i} locale={locale} accent={accent} />
        ))}

        {/* Empty state */}
        {!drills && !loading && !error && (
          <div style={{ textAlign: "center", padding: "32px 0 16px" }}>
            <p style={{ margin: "0 0 8px", fontSize: 32 }}>🥊</p>
            <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.45)" }}>
              {mn ? "Дасгалаа сонгоод үүсгэ" : "Select an area and generate"}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.22)", lineHeight: 1.5 }}>
              {mn ? "AI танд тохирсон 5 дасгал үүсгэнэ" : "AI will create 5 personalized drills for you"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DrillCard({ drill, index, locale, accent }) {
  const [open, setOpen] = useState(index === 0);
  const mn = locale === "mn";
  const diff = drill.difficulty || "Intermediate";
  const diffColor = DIFF_COLOR[diff] || GOLD;

  return (
    <div style={{
      marginBottom: 10,
      borderRadius: 14,
      background: "rgba(255,255,255,0.025)",
      border: `1px solid ${index === 0 ? accent + "28" : "rgba(255,255,255,0.06)"}`,
      borderLeft: `3px solid ${index === 0 ? accent : "rgba(255,255,255,0.1)"}`,
      overflow: "hidden",
    }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", textAlign: "left", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 14px",
          background: "none", border: "none",
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: `${accent}18`,
          border: `1px solid ${accent}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 900, color: accent,
        }}>
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
            {drill.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: diffColor }}>
              {mn ? (DIFF_MN[diff] || diff) : diff}
            </span>
            {drill.duration && (
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
                · {drill.duration}
              </span>
            )}
          </div>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms ease", flexShrink: 0 }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {open && drill.steps && drill.steps.length > 0 && (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 12 }} />
          {drill.steps.map((step, si) => (
            <div key={si} style={{ display: "flex", gap: 10, marginBottom: si < drill.steps.length - 1 ? 10 : 0 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                background: `${accent}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 900, color: accent,
              }}>
                {si + 1}
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                {step}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

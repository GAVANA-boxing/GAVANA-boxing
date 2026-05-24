"use client";

import { useEffect, useState, useRef } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildCoachSnapshot } from "@/lib/buildCoachContext";
import { RED, GOLD, goldAlpha, redAlpha, whiteAlpha } from "@/lib/tokens";

const AREA_COLOR = {
  Power: RED, Speed: "#FB923C", Timing: GOLD,
  Footwork: "#60A5FA", Guard: "#A78BFA", Accuracy: "#34D399",
};

const IDENTITY_TIPS = {
  pressure: {
    en: ["Stay in tight, smother counters before they land", "Control range — don't let them reset", "Watch for straight counters when you walk in"],
    mn: ["Ойрхон байж эсрэгийг дарж бай", "Зай барь — буцахыг бүү зөвшөөр", "Орж ирэхдээ шулуун хариу цохилтоос болгоомжил"],
  },
  counter: {
    en: ["Create angles after slipping to open counters", "Don't chase — make them commit first", "Guard tight on the jab, explode on the cross"],
    mn: ["Зугтааснаа дараа өнцөг үүсгэж цохь", "Мөшгихгүй — эхлээд тэднийг байрлуулах", "Жэб дээр хамгаалаад, кросс дээр цохь"],
  },
  technical: {
    en: ["Use feints to break their rhythm before entering", "Control pace — don't get dragged into brawling", "Footwork is your weapon; never stay flat-footed"],
    mn: ["Ритмийг нь эвдэхийн тулд хуурамч хөдөлгөөн хэрэглэ", "Хурдыг барь — тулалдаанд татагдаж болохгүй", "Хөл нь зэвсэг чинь; хэзээ ч хөдөлгөөнгүй зогсож болохгүй"],
  },
  brawler: {
    en: ["Trade on your terms — time your exchanges", "Tire them out with body work first", "Keep hands up — brawlers eat counter shots"],
    mn: ["Өөрийн нөхцлөөр солилц — цохилтоо цагтай нь цохь", "Эхлээд биед цохиж ядраа", "Гараа өндөр байлга — тулалдагч хариу цохилт идэх нь элбэг"],
  },
};

const DEFAULT_TIPS = {
  en: ["Stay disciplined — sparring is training, not ego", "Focus on one thing each round", "Reset after every exchange"],
  mn: ["Сахилгатай бай — спарринг бол дасгал, ego биш", "Раунд бүрд нэг зүйлд анхаар", "Солилт болгоны дараа reset хий"],
};

export default function SparringIntelligence({ user, locale }) {
  const mn = locale === "mn";
  const [snapshot, setSnapshot] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (!user?.uid || loaded.current) return;
    loaded.current = true;
    (async () => {
      try {
        const q = query(
          collection(db, "training_sessions"),
          where("userId", "==", user.uid),
          where("type", "==", "training"),
          orderBy("createdAt", "desc"),
          limit(30),
        );
        const snap = await getDocs(q);
        const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSnapshot(buildCoachSnapshot({ sessions }));
      } catch { /* ignore */ }
    })();
  }, [user?.uid]);

  const identity = snapshot?.identity?.primary || null;
  const weakAreas = snapshot?.weakAreas?.slice(0, 2) || [];
  const strongAreas = snapshot?.strongAreas?.slice(0, 1) || [];

  const tips = IDENTITY_TIPS[identity]?.[mn ? "mn" : "en"] || DEFAULT_TIPS[mn ? "mn" : "en"];

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: `2.5px solid ${GOLD}`,
      borderRadius: "3px 16px 16px 3px",
      marginBottom: 20,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px 8px",
        borderBottom: collapsed ? "none" : "1px solid rgba(255,255,255,0.045)",
        background: "rgba(0,0,0,0.18)",
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD, boxShadow: `0 0 7px ${GOLD}` }} />
        <span style={{ fontSize: 10, fontWeight: 900, flex: 1, color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          {mn ? "Спарринг тагнуул" : "Sparring Intelligence"}
        </span>
        {identity && !collapsed && (
          <span style={{ fontSize: 9, fontWeight: 900, color: GOLD, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {identity}
          </span>
        )}
        <button type="button" onClick={() => setCollapsed((c) => !c)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.22)", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>
          {collapsed ? "+" : "−"}
        </button>
      </div>

      {!collapsed && (
        <div style={{ padding: "12px 14px 14px" }}>
          {/* Weak areas to defend */}
          {weakAreas.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 7px", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: 1.8, textTransform: "uppercase" }}>
                {mn ? "Хамгаалах талууд" : "Protect These"}
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                {weakAreas.map(([area, score]) => (
                  <div key={area} style={{
                    padding: "5px 11px", borderRadius: 20,
                    background: `${AREA_COLOR[area] || RED}15`,
                    border: `1px solid ${AREA_COLOR[area] || RED}30`,
                    fontSize: 11.5, fontWeight: 900, color: AREA_COLOR[area] || RED,
                  }}>
                    {area} <span style={{ opacity: 0.6, fontSize: 10 }}>{score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strong areas to use */}
          {strongAreas.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 7px", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: 1.8, textTransform: "uppercase" }}>
                {mn ? "Давуу тал" : "Your Weapon"}
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                {strongAreas.map(([area, score]) => (
                  <div key={area} style={{
                    padding: "5px 11px", borderRadius: 20,
                    background: `${AREA_COLOR[area] || GOLD}15`,
                    border: `1px solid ${AREA_COLOR[area] || GOLD}30`,
                    fontSize: 11.5, fontWeight: 900, color: AREA_COLOR[area] || GOLD,
                  }}>
                    {area} <span style={{ opacity: 0.6, fontSize: 10 }}>{score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tactical tips */}
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: 1.8, textTransform: "uppercase" }}>
              {mn ? "Тактикийн зөвлөмж" : "Tactical Tips"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "8px 11px", borderRadius: 10, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: GOLD, marginTop: 1, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {!snapshot && (
            <p style={{ margin: "10px 0 0", fontSize: 11, color: "rgba(255,255,255,0.25)", fontStyle: "italic", textAlign: "center" }}>
              {mn ? "Дасгал хийснийхээ дараа персонал зөвлөмж гарна" : "Complete training sessions for personalized advice"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { GOLD } from "@/lib/tokens";

const PRO_L = {
  en: {
    eyebrow:  "GAVANA PRO",
    title:    "Unlock Fighter Intelligence",
    perks:    [
      "📊 Weekly DNA report",
      "🧊 Streak freeze — 2 / month",
      "⚔️ Advanced fighter comparisons",
      "🔔 Streak-at-risk alerts",
    ],
    cta:      "Upgrade to Pro →",
    price:    "From $7.99 / month",
  },
  mn: {
    eyebrow:  "GAVANA PRO",
    title:    "Тулаанчийн тагнуулыг нээх",
    perks:    [
      "📊 7 хоног тутмын ДНХ тайлан",
      "🧊 Streak freeze — сард 2 удаа",
      "⚔️ Ахисан тулаанч харьцуулалт",
      "🔔 Streak эрсдлийн мэдэгдэл",
    ],
    cta:      "Pro болох →",
    price:    "Сарын $7.99-аас",
  },
  ko: {
    eyebrow:  "GAVANA PRO",
    title:    "파이터 인텔리전스 잠금 해제",
    perks:    [
      "📊 주간 DNA 리포트",
      "🧊 스트릭 프리즈 — 월 2회",
      "⚔️ 고급 파이터 비교",
      "🔔 스트릭 위험 알림",
    ],
    cta:      "Pro 업그레이드 →",
    price:    "월 $7.99부터",
  },
};

export default function ProUpgradePanel({ locale, router }) {
  const L = PRO_L[locale] || PRO_L.en;
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleUpgrade() {
    setLoading(true);
    setErr("");
    try {
      const { getAuth } = await import("firebase/auth");
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) {
        setErr(locale === "mn" ? "Эхлээд нэвтэрнэ үү" : locale === "ko" ? "먼저 로그인하세요" : "Please sign in first");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tierId: "pro",
          successUrl: `${window.location.origin}/${locale}/fighter-profile?subscribed=1`,
          cancelUrl: window.location.href,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) { window.location.href = data.url; return; }
      setErr(data.error || `Checkout failed (${res.status})`);
    } catch (e) {
      setErr(e?.message || "Network error");
    }
    setLoading(false);
  }

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", background: `linear-gradient(155deg, rgba(6,6,8,0.97) 0%, ${GOLD}0e 100%)`, border: `1px solid ${GOLD}28`, marginBottom: 8 }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${GOLD}88, transparent)` }} />
      <div style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 2.5, color: GOLD, textTransform: "uppercase", marginBottom: 10 }}>
          ⭐ {L.eyebrow}
        </div>
        <div style={{ fontSize: 18, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display,'Anton',sans-serif)", textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: 14 }}>
          {L.title}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
          {L.perks.map((p, i) => (
            <div key={i} style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>{p}</div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
            background: loading ? `${GOLD}40` : `linear-gradient(135deg, ${GOLD}, #F59E0B)`,
            color: "#000", fontSize: 13, fontWeight: 900, cursor: loading ? "default" : "pointer", letterSpacing: 0.5,
          }}
        >
          {loading ? "…" : L.cta}
        </button>
        <p style={{ margin: "8px 0 0", fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.55)", textAlign: "center" }}>
          {L.price}
        </p>
        {err && (
          <p style={{ margin: "8px 0 0", fontSize: 10, fontWeight: 700, color: "#F87171", textAlign: "center", lineHeight: 1.4, wordBreak: "break-word" }}>
            {err}
          </p>
        )}
      </div>
    </div>
  );
}

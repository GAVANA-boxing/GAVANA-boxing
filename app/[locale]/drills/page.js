"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { buildCoachSnapshot, buildCoachContext } from "@/lib/buildCoachContext";
import { RED } from "@/lib/tokens";
import { AREA_COLOR, cacheKey, readCache, writeCache } from "@/components/drills/drillsConstants";
import DrillsHeader from "@/components/drills/DrillsHeader";
import WeakAreaHint from "@/components/drills/WeakAreaHint";
import AreaChips from "@/components/drills/AreaChips";
import TypeChips from "@/components/drills/TypeChips";
import GenerateButton from "@/components/drills/GenerateButton";
import DrillCard from "@/components/drills/DrillCard";
import DrillsEmptyState from "@/components/drills/DrillsEmptyState";

export default function DrillsPage() {
  const { locale } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const mn = locale === "mn";

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
      let idToken;
      try {
        idToken = await user.getIdToken();
      } catch (tokenErr) {
        console.error("[DrillsPage] getIdToken failed:", tokenErr);
        throw new Error(mn ? "Нэвтрэх токен авахад алдаа гарлаа. Дахин нэвтэрнэ үү." : "Auth token error — please sign in again.");
      }

      console.log("[DrillsPage] generate →", { area: selectedArea, type: selectedType, promptLen: prompt.length });
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], persona: "analyst", locale }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(`[DrillsPage] HTTP ${res.status}:`, errText);
        if (res.status === 429) throw new Error(mn ? "Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу." : "Rate limited — wait a moment and retry.");
        if (res.status === 401) throw new Error(mn ? "Эрх хүрэхгүй байна. Дахин нэвтэрнэ үү." : "Unauthorized — please sign in again.");
        throw new Error(`HTTP ${res.status}${errText ? ": " + errText.slice(0, 120) : ""}`);
      }

      const data = await res.json();
      console.log("[DrillsPage] API response keys:", Object.keys(data));

      if (data.aiError) {
        console.error("[DrillsPage] aiError from API:", data.message);
        throw new Error(data.message || (mn ? "AI коуч боломжгүй байна." : "AI coach unavailable."));
      }

      const text = data.message || "";
      console.log("[DrillsPage] response text (first 200):", text.slice(0, 200));

      const match = text.match(/\[[\s\S]*\]/);
      if (!match) {
        console.error("[DrillsPage] No JSON array in response. Full text:", text);
        throw new Error(mn ? "AI буруу формат буцаалаа. Дахин оролдоно уу." : "AI returned unexpected format — retry.");
      }

      let parsed;
      try {
        parsed = JSON.parse(match[0]);
      } catch (parseErr) {
        console.error("[DrillsPage] JSON.parse failed:", parseErr, "match:", match[0].slice(0, 200));
        throw new Error(mn ? "AI-н хариултыг задлахад алдаа гарлаа." : "Failed to parse AI response.");
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        console.error("[DrillsPage] Parsed result is not a non-empty array:", parsed);
        throw new Error(mn ? "AI дасгал үүсгэж чадсангүй. Дахин оролдоно уу." : "AI returned no drills — try again.");
      }

      console.log("[DrillsPage] success — drills:", parsed.length);
      writeCache(key, parsed);
      setDrills(parsed);
    } catch (err) {
      console.error("[DrillsPage] generate error:", err);
      const msg = err?.message || String(err);
      const isGeneric = msg === "[object Object]" || msg === "Error";
      setError(isGeneric
        ? (mn ? "Алдаа гарлаа. Дахин оролдоно уу." : "Something went wrong. Please try again.")
        : msg
      );
    } finally {
      setLoading(false);
    }
  }, [selectedArea, selectedType, user, coachSnapshot, locale, mn]);

  // Reset drills when area/type changes
  useEffect(() => {
    if (drills) setDrills(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArea, selectedType]);

  const accent = AREA_COLOR[selectedArea] || RED;
  const weakAreaName = coachSnapshot?.weakAreas?.[0]?.[0] ?? null;

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0a0b", paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}>
      <DrillsHeader locale={locale} onBack={() => router.back()} />

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 0" }}>
        <WeakAreaHint weakAreaName={weakAreaName} locale={locale} />

        <AreaChips selectedArea={selectedArea} onSelect={setSelectedArea} locale={locale} />

        <TypeChips selectedType={selectedType} onSelect={setSelectedType} locale={locale} />

        <GenerateButton
          loading={loading}
          disabled={!selectedArea}
          accent={accent}
          locale={locale}
          onClick={generate}
        />

        {/* Error banner */}
        {error && (
          <div style={{
            marginBottom: 20, padding: "12px 14px", borderRadius: 11,
            background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)",
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
          <DrillsEmptyState locale={locale} />
        )}
      </div>
    </div>
  );
}

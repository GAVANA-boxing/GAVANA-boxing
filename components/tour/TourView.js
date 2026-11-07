"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { loc } from "@/lib/loc";
import { RANK_TIERS } from "@/lib/xp";
import { TOUR_STOPS, tourProgress, localTime, solarHour, sunElevation, skyFor, weatherFor } from "@/lib/worldTour";
import { BRAND, btnPrimary, card, displayTitle, kickerDot, kickerPill, sectionLabel } from "@/components/ui/brand";

const TourScene = dynamic(() => import("@/components/tour/TourScene"), { ssr: false });

const WEATHER = {
  clear: { icon: "☀", night: "☾", label: ["Цэлмэг", "맑음", "Clear"] },
  cloud: { icon: "☁", night: "☁", label: ["Үүлэрхэг", "흐림", "Cloudy"] },
  rain: { icon: "☂", night: "☂", label: ["Бороо", "비", "Rain"] },
  snow: { icon: "❄", night: "❄", label: ["Цас", "눈", "Snow"] },
};
const PHASE = {
  day: ["Өдөр", "낮", "Day"],
  dawn: ["Үүр", "새벽", "Dawn"],
  dusk: ["Үдэш", "해질녘", "Dusk"],
  night: ["Шөнө", "밤", "Night"],
};

/**
 * World Tour screen body: the city the fighter's rank has reached, live in 3D
 * (its real local time, sun and today's weather), the journey of all cities,
 * and how much XP until the next one.
 */
export default function TourView({ xp = 0, locale = "en", now = new Date(), go = () => {}, sceneHeight = 340 }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const pick = (a) => loc(locale, a[0], a[1], a[2]);
  const progress = useMemo(() => tourProgress(xp), [xp]);
  const [viewIndex, setViewIndex] = useState(progress.index);
  const stop = TOUR_STOPS[viewIndex] || progress.stop;

  const env = useMemo(() => {
    const lt = localTime(stop.tz, now);
    const solar = solarHour(stop.lon, now);
    const elevation = sunElevation(stop.lat, lt.dayOfYear, solar);
    return { lt, solar, elevation, sky: skyFor(elevation, solar), weather: weatherFor(stop, lt) };
  }, [stop, now]);
  const w = WEATHER[env.weather.kind];
  const isHere = viewIndex === progress.index;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ ...kickerPill, alignSelf: "flex-start" }}><span style={kickerDot} />World Tour</p>

      <div>
        <h1 data-testid="tour-city" style={{ ...displayTitle, margin: 0, fontSize: 40 }}>{pick(stop.name)}</h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: BRAND.muted, lineHeight: 1.5 }}>
          🥊 {pick(stop.arena)}
          {isHere ? ` · ${L("Та энд байна", "현재 위치", "You are here")}` : ""}
        </p>
      </div>

      {/* Live conditions in that city */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          ["🕒", `${env.lt.label} · ${pick(PHASE[env.sky.phase])}`],
          [env.sky.phase === "night" ? w.night : w.icon, pick(w.label)],
          [env.elevation > 0 ? "↑" : "↓", `${L("Нар", "태양", "Sun")} ${Math.round(env.elevation)}°`],
        ].map(([icon, text]) => (
          <span key={text} style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 32, padding: "4px 12px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13, fontWeight: 600, color: "#fff" }}>
            <span aria-hidden="true">{icon}</span>{text}
          </span>
        ))}
      </div>

      <TourScene
        key={stop.id}
        stop={stop} sky={env.sky} elevation={env.elevation} hour={env.solar} weather={env.weather}
        height={sceneHeight}
        failText={L("Энэ төхөөрөмж 3D дүрслэлийг дэмжихгүй байна.", "이 기기는 3D 표시를 지원하지 않습니다.", "This device can't show 3D.")}
      />
      <p style={{ margin: "-6px 0 0", fontSize: 12, color: BRAND.faint }}>
        {L("Бодит цаг, нар, улирал — тухайн хотын яг одоо. Чирж эргүүл.", "실제 시간·태양·계절 — 그 도시의 지금. 드래그해서 회전.", "Real local time, sun and season — that city right now. Drag to rotate.")}
      </p>

      {/* Next city */}
      <section style={{ ...card, padding: "16px 18px" }}>
        {progress.next ? (
          <>
            <p style={sectionLabel}>{L("Дараагийн хот", "다음 도시", "Next city")}</p>
            <p style={{ margin: "6px 0 10px", fontSize: 17, fontWeight: 700, color: BRAND.text }}>
              {pick(progress.next.name)} · {L(`${progress.xpToNext.toLocaleString()} XP үлдлээ`, `${progress.xpToNext.toLocaleString()} XP 남음`, `${progress.xpToNext.toLocaleString()} XP to go`)}
            </p>
            <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ width: `${Math.round(progress.pct * 100)}%`, height: "100%", background: `linear-gradient(90deg, ${BRAND.red}, ${BRAND.gold})` }} />
            </div>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{L("Аялал дууссан — Вегасын од!", "투어 완주 — 베가스의 스타!", "Tour complete — a Vegas headliner!")}</p>
        )}
        <button type="button" onClick={() => go("/train")} style={{ ...btnPrimary, marginTop: 14, fontFamily: "inherit" }}>
          {L("Бэлтгэл хийж XP цуглуул", "훈련하고 XP 모으기", "Train to earn XP")}
        </button>
      </section>

      {/* The journey */}
      <section>
        <p style={{ ...sectionLabel, marginBottom: 8 }}>{L("Аялал", "여정", "The journey")}</p>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
          {TOUR_STOPS.map((s, i) => {
            const open = progress.unlocked[i];
            const active = i === viewIndex;
            return (
              <li key={s.id}>
                <button
                  type="button" disabled={!open} aria-pressed={active} onClick={() => setViewIndex(i)}
                  style={{
                    width: "100%", minHeight: 48, display: "flex", alignItems: "center", gap: 12, padding: "8px 14px",
                    borderRadius: 14, cursor: open ? "pointer" : "default", fontFamily: "inherit", textAlign: "left",
                    border: `1px solid ${active ? "rgba(255,59,48,0.55)" : "rgba(255,255,255,0.08)"}`,
                    background: active ? "rgba(255,59,48,0.12)" : "rgba(255,255,255,0.03)", color: "#fff",
                  }}
                >
                  <span aria-hidden="true" style={{ width: 26, height: 26, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 900, background: open ? (i === progress.index ? BRAND.red : "rgba(52,211,153,0.2)") : "rgba(255,255,255,0.06)", color: open ? "#fff" : "rgba(255,255,255,0.6)" }}>
                    {open ? (i === progress.index ? "●" : "✓") : "🔒"}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: open ? "#fff" : "rgba(255,255,255,0.65)" }}>{pick(s.name)}</span>
                    <span style={{ display: "block", fontSize: 12, color: BRAND.faint }}>{pick(s.arena)}</span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: open ? "rgba(255,255,255,0.6)" : BRAND.gold, fontVariantNumeric: "tabular-nums" }}>
                    {RANK_TIERS[i].minXP.toLocaleString()} XP
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

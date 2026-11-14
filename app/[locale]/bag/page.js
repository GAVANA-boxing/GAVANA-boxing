"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useUserProfile } from "@/context/UserProfileProvider";
import { getLocale } from "@/lib/i18n";
import { loc } from "@/lib/loc";
import { usePoseDetection } from "@/hooks/usePoseDetection";
import { useLatest } from "@/hooks/useLatest";
import { createBagStats } from "@/lib/heavyBag";
import { detectRenderCaps, qualityFor } from "@/lib/three/renderCaps";
import { funnel } from "@/lib/funnel";
import { btnPrimary, btnSecondary, displayTitle, kickerDot, kickerPill, pageBackground } from "@/components/ui/brand";
import { RED, GOLD, RADIUS, FONT_SIZE, FONT_WEIGHT, whiteAlpha, blackAlpha } from "@/lib/tokens";

const HeavyBagScene = dynamic(() => import("@/components/bag/HeavyBagScene"), { ssr: false });
const ROUND_S = 30;
const TYPE_NAME = { jab: ["Жэб", "잽", "Jab"], cross: ["Кросс", "크로스", "Cross"], hook: ["Хук", "훅", "Hook"], uppercut: ["Апперкот", "어퍼컷", "Uppercut"], punch: ["Цохилт", "펀치", "Punch"] };

/**
 * Heavy bag — punch at the camera and a physics heavy bag takes the shot:
 * it swings on its chain, dents and ripples where you hit. Tap the bag to hit
 * it without a camera. A 30 s round with power, swing and pace; nothing saved.
 */
export default function HeavyBagPage() {
  const params = useParams();
  const router = useRouter();
  const locale = getLocale(params?.locale);
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const pick = (a) => loc(locale, a[0], a[1], a[2]);
  const { profile } = useUserProfile();

  const [stance, setStance] = useState("orthodox");
  useEffect(() => {
    let s = profile?.stance;
    if (s !== "orthodox" && s !== "southpaw") { try { s = localStorage.getItem("gavana_stance"); } catch { s = null; } }
    if (s === "orthodox" || s === "southpaw") setStance(s);
  }, [profile?.stance]);

  const [quality, setQuality] = useState(null);
  useEffect(() => { detectRenderCaps().then((c) => setQuality(qualityFor(c))).catch(() => setQuality(qualityFor({}))); }, []);

  const [phase, setPhase] = useState("intro"); // intro | round | result
  const [camera, setCamera] = useState("off"); // off | on | denied
  const [left, setLeft] = useState(ROUND_S);
  const [last, setLast] = useState(null);      // { power, type, n }
  const [swing, setSwing] = useState(0);
  const [count, setCount] = useState(0);
  const [summary, setSummary] = useState(null);

  const controlRef = useRef(null);
  const statsRef = useRef(createBagStats());
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { getDebugInfo, poseStatus } = usePoseDetection({ videoRef, isActive: phase === "round" && camera === "on", stance, load: camera === "on" });
  // Read through a ref: getDebugInfo gets a new identity when the model finishes loading, and
  // the round clock must not restart because of it.
  const debug = useLatest(getDebugInfo);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);
  useEffect(() => stopCamera, [stopCamera]);

  const start = async () => {
    statsRef.current = createBagStats();
    setCount(0); setLast(null); setSwing(0); setLeft(ROUND_S); setSummary(null);
    try {
      if (!streamRef.current) streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setCamera("on");
    } catch {
      setCamera("denied"); // tap the bag instead
    }
    setPhase("round");
    funnel("bag_started", { locale });
  };

  useEffect(() => {
    if (phase === "round" && camera === "on" && videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play?.().catch(() => {});
    }
  }, [phase, camera]);

  const onHit = useCallback(({ power, type }) => {
    statsRef.current.add(type, power);
    setCount((c) => c + 1);
    setLast((p) => ({ power, type, n: (p?.n || 0) + 1 }));
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(18);
  }, []);
  const onSwing = useCallback((deg) => { statsRef.current.swing(deg); setSwing(deg); }, []);

  const finish = useCallback((elapsed) => {
    setSummary(statsRef.current.summary(elapsed));
    setPhase("result");
    stopCamera();
    funnel("bag_completed", { locale });
  }, [stopCamera, locale]);

  const finishRef = useLatest(finish);

  // Round clock + camera punches → bag hits.
  useEffect(() => {
    if (phase !== "round") return undefined;
    const t0 = performance.now();
    let lastCount = null;
    const id = setInterval(() => {
      const elapsed = (performance.now() - t0) / 1000;
      setLeft(Math.max(0, Math.ceil(ROUND_S - elapsed)));
      if (camera === "on") {
        const info = debug.current();
        const c = info.punchCount || 0;
        if (lastCount !== null) {
          for (let k = lastCount; k < c; k++) controlRef.current?.hit({ type: info.lastPunchType || "punch", hand: info.lastPunchHand, snapVelocity: info.lastSnapVelocity });
        }
        lastCount = c;
      }
      if (elapsed >= ROUND_S) { clearInterval(id); finishRef.current(ROUND_S); }
    }, 80);
    return () => clearInterval(id);
  }, [phase, camera, debug, finishRef]);

  const exit = () => { stopCamera(); router.push(`/${locale}/train`); };

  if (phase === "intro") {
    return (
      <main style={{ minHeight: "100dvh", background: pageBackground, color: "#fff", padding: "calc(20px + env(safe-area-inset-top)) 16px 32px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ ...kickerPill, alignSelf: "flex-start" }}><span style={kickerDot} />{L("Тоглоомын горим", "게임 모드", "Game mode")}</p>
          <h1 style={{ ...displayTitle, margin: 0, fontSize: 40 }}>{L("Хүнд уут", "헤비백", "Heavy bag")}</h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: whiteAlpha(0.75) }}>
            {L("Камерын өмнө цохь — 35 кг уут цохилт бүрт гинжиндээ савлаж, цохисон газраа хонхойно. Камергүй бол уут руу дар. 30 секунд.",
              "카메라 앞에서 치세요 — 35kg 백이 체인에 매달려 흔들리고 맞은 곳이 들어갑니다. 카메라 없이 백을 탭해도 됩니다. 30초.",
              "Punch at the camera — a 35 kg bag swings on its chain and dents where you land. No camera? Tap the bag. 30 seconds.")}
          </p>
          <div style={{ height: 300, borderRadius: 22, overflow: "hidden", border: `1px solid ${whiteAlpha(0.08)}` }}>
            {quality && <HeavyBagScene stance={stance} quality={quality} controlRef={controlRef} onHit={() => {}} />}
          </div>
          <p style={{ margin: "-6px 0 0", fontSize: 12, color: whiteAlpha(0.55) }}>
            {L("Туршаад үз: уутны зүүн/баруун тал руу дар.", "해 보세요: 백의 왼쪽/오른쪽을 탭.", "Try it: tap the left or right side of the bag.")}
          </p>
          <button type="button" data-testid="bag-start" onClick={start} style={{ ...btnPrimary, fontFamily: "inherit" }}>{L("Раунд эхлүүлэх · 30 сек →", "라운드 시작 · 30초 →", "Start round · 30 s →")}</button>
          <button type="button" onClick={exit} style={{ ...btnSecondary, fontFamily: "inherit", color: whiteAlpha(0.8) }}>{L("Бэлтгэл рүү буцах", "훈련으로", "Back to Train")}</button>
        </div>
      </main>
    );
  }

  if (phase === "round") {
    return (
      <main style={{ position: "fixed", inset: 0, background: "#0b0b0d", color: "#fff" }}>
        <HeavyBagScene stance={stance} quality={quality} controlRef={controlRef} onHit={onHit} onSwing={onSwing} />
        {camera === "on" && (
          <video ref={videoRef} playsInline muted autoPlay style={{ position: "absolute", right: 12, bottom: "calc(16px + env(safe-area-inset-bottom))", width: 96, height: 128, objectFit: "cover", borderRadius: 14, border: `1px solid ${whiteAlpha(0.25)}`, transform: "scaleX(-1)" }} />
        )}
        <div style={{ position: "absolute", top: "calc(12px + env(safe-area-inset-top))", left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, pointerEvents: "none" }}>
          <span data-testid="bag-clock" style={{ padding: "6px 12px", borderRadius: RADIUS.full, background: blackAlpha(0.6), fontWeight: FONT_WEIGHT.black, fontSize: FONT_SIZE.md, fontVariantNumeric: "tabular-nums" }}>0:{String(left).padStart(2, "0")}</span>
          <button type="button" onClick={() => finish(ROUND_S - left)} style={{ pointerEvents: "auto", minHeight: 44, padding: "6px 16px", borderRadius: RADIUS.full, border: `1px solid ${whiteAlpha(0.3)}`, background: blackAlpha(0.5), color: "#fff", fontSize: FONT_SIZE.sm, cursor: "pointer", fontFamily: "inherit" }}>{L("Дуусгах", "종료", "Finish")}</button>
          <span style={{ padding: "6px 12px", borderRadius: RADIUS.full, background: blackAlpha(0.6), fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm, fontVariantNumeric: "tabular-nums" }}>🥊 {count}</span>
        </div>
        {/* Power of the last hit + current swing */}
        <div style={{ position: "absolute", left: 12, right: camera === "on" ? 120 : 12, bottom: "calc(16px + env(safe-area-inset-bottom))", padding: "10px 12px", borderRadius: 16, background: blackAlpha(0.6), border: `1px solid ${whiteAlpha(0.12)}`, pointerEvents: "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: whiteAlpha(0.75) }}>
            <span>{last ? pick(TYPE_NAME[last.type] || TYPE_NAME.punch) : L("Цохиж эхэл", "치기 시작", "Start punching")}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{L("Савлалт", "흔들림", "Swing")} {Math.round(swing)}°</span>
          </div>
          <div style={{ marginTop: 6, height: 10, borderRadius: 5, background: whiteAlpha(0.1), overflow: "hidden" }}>
            <div key={last?.n} style={{ width: `${last?.power || 0}%`, height: "100%", borderRadius: 5, background: `linear-gradient(90deg, ${GOLD}, ${RED})`, transition: "width 0.12s" }} />
          </div>
          {camera === "denied" && (
            <div style={{ marginTop: 6, fontSize: 12, color: whiteAlpha(0.7) }}>{L("Камергүй горим — уут руу дарж цохь.", "카메라 없음 — 백을 탭해서 치세요.", "No camera — tap the bag to punch.")}</div>
          )}
          {/* Until the pose model is ready the camera can't count punches — say so, and the bag still takes taps. */}
          {camera === "on" && poseStatus !== "ready" && (
            <div role="status" data-testid="bag-pose-status" style={{ marginTop: 6, fontSize: 12, color: whiteAlpha(0.7) }}>
              {poseStatus === "failed"
                ? L("Камерын AI ачаалагдсангүй — уут руу дарж цохь.", "카메라 AI를 불러오지 못했어요 — 백을 탭해서 치세요.", "The camera AI didn't load — tap the bag to punch.")
                : L("AI ачаалж байна… түр уут руу дарж цохь.", "AI 로딩 중… 그동안 백을 탭하세요.", "Loading AI… tap the bag meanwhile.")}
            </div>
          )}
        </div>
      </main>
    );
  }

  const s = summary;
  return (
    <main style={{ minHeight: "100dvh", background: pageBackground, color: "#fff", padding: "calc(20px + env(safe-area-inset-top)) 16px 32px" }}>
      <div data-testid="bag-result" style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ ...kickerPill, alignSelf: "flex-start" }}><span style={kickerDot} />{L("Хүнд уут · үр дүн", "헤비백 · 결과", "Heavy bag · result")}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ ...displayTitle, fontSize: 64, color: GOLD }}>{s.punches}</span>
          <span style={{ fontSize: 15, color: whiteAlpha(0.7) }}>{L("цохилт", "펀치", "punches")} · {s.perMinute}/{L("мин", "분", "min")}</span>
        </div>
        {/* Counted punches, pace and how far the simulated bag swung. No "power" tiles: that
            number was a formula per punch type, not a measurement. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {[[L("Минутад", "분당", "Per minute"), s.perMinute], [L("Уутны их савлалт", "백 최대 흔들림", "Biggest swing"), `${s.maxSwingDeg}°`]].map(([label, value]) => (
            <div key={label} style={{ padding: "12px 10px", borderRadius: 16, background: whiteAlpha(0.04), border: `1px solid ${whiteAlpha(0.08)}` }}>
              <div style={{ fontSize: 12, color: whiteAlpha(0.6) }}>{label}</div>
              <div style={{ marginTop: 4, fontSize: 20, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{value}</div>
            </div>
          ))}
        </div>
        {Object.keys(s.byType).length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(s.byType).map(([type, n]) => (
              <span key={type} style={{ padding: "6px 12px", borderRadius: 999, background: whiteAlpha(0.06), border: `1px solid ${whiteAlpha(0.1)}`, fontSize: 13, fontWeight: 700 }}>{pick(TYPE_NAME[type] || TYPE_NAME.punch)} {n}</span>
            ))}
          </div>
        )}
        <button type="button" onClick={() => setPhase("intro")} style={{ ...btnPrimary, fontFamily: "inherit" }}>{L("Дахин раунд", "다시 라운드", "Another round")}</button>
        <button type="button" onClick={exit} style={{ ...btnSecondary, fontFamily: "inherit", color: whiteAlpha(0.8) }}>{L("Бэлтгэл рүү буцах", "훈련으로", "Back to Train")}</button>
      </div>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserProfile } from "@/context/UserProfileProvider";
import { getLocale } from "@/lib/i18n";
import { loc } from "@/lib/loc";
import { cameraPermissionHelp } from "@/lib/cameraHelp";
import { usePoseDetection } from "@/hooks/usePoseDetection";
import { buildSchedule, judgeRound, summarizeRound, callAt, LEVELS } from "@/lib/mittDrill";
import { funnel } from "@/lib/funnel";
import MittCall from "@/components/mitts/MittCall";
import MittResult from "@/components/mitts/MittResult";
import { btnPrimary, btnSecondary, displayTitle, kickerDot, kickerPill, pageBackground } from "@/components/ui/brand";
import { RADIUS, FONT_SIZE, FONT_WEIGHT, whiteAlpha, redAlpha, blackAlpha } from "@/lib/tokens";

const ROUND_MS = 30_000;

/**
 * Mitt drill — a 30 s reaction round. The screen calls "1", "2", "1-2", "1-1",
 * "slip" or "roll"; answer with the right hand(s) or head movement before the
 * ring runs out. Uses the same pose detection as Train; nothing is saved.
 */
export default function MittDrillPage() {
  const params = useParams();
  const router = useRouter();
  const locale = getLocale(params?.locale);
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const { profile } = useUserProfile();

  const [stance, setStance] = useState("orthodox");
  useEffect(() => {
    let s = profile?.stance;
    if (s !== "orthodox" && s !== "southpaw") { try { s = localStorage.getItem("gavana_stance"); } catch { s = null; } }
    if (s === "orthodox" || s === "southpaw") setStance(s);
  }, [profile?.stance]);

  const [level, setLevel] = useState("normal");
  const [phase, setPhase] = useState("intro"); // intro | countdown | round | result
  const [count, setCount] = useState(3);
  const [camError, setCamError] = useState(null);
  const [seed, setSeed] = useState(1);
  const [now, setNow] = useState(0);           // ms since the round started
  const [feedback, setFeedback] = useState(null);
  const [summary, setSummary] = useState(null);

  const schedule = useMemo(() => buildSchedule({ seed, durationMs: ROUND_MS, level }), [seed, level]);
  const actionsRef = useRef([]);
  const elapsedRef = useRef(0); // ms into the round, for an early finish
  const [judged, setJudged] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { getDebugInfo, poseStatus } = usePoseDetection({ videoRef, isActive: phase === "round", stance });

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);
  useEffect(() => stopCamera, [stopCamera]);

  // A short beep on every call (the audio context is opened inside the start tap).
  const audioRef = useRef(null);
  const beep = useCallback((high) => {
    const ctx = audioRef.current;
    if (!ctx) return;
    try {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = high ? 1046 : 784;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
      o.connect(g).connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.15);
    } catch { /* audio is optional */ }
  }, []);

  const start = async () => {
    setCamError(null);
    try {
      if (!audioRef.current && typeof window !== "undefined") {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioRef.current = new AC();
      }
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      }
      setSeed(Math.floor(Math.random() * 1e9));
      setSummary(null);
      setFeedback(null);
      setCount(3);
      setPhase("countdown");
      funnel("mitts_started", { locale, meta: level });
    } catch (err) {
      setCamError(String(err?.name || "error"));
    }
  };

  useEffect(() => {
    if ((phase === "countdown" || phase === "round") && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) videoRef.current.srcObject = streamRef.current;
      videoRef.current.play?.().catch(() => {});
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "countdown") return undefined;
    if (count <= 0) { setPhase("round"); return undefined; }
    const id = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(id);
  }, [phase, count]);

  const finish = useCallback(() => {
    // Only calls that were actually shown count (an early finish skips the rest).
    const shown = schedule.filter((c) => c.at <= elapsedRef.current);
    const results = judgeRound(shown, actionsRef.current, { stance, level });
    const s = summarizeRound(results);
    setSummary(s);
    setPhase("result");
    stopCamera();
    funnel("mitts_completed", { locale, meta: level, score: Math.round(s.accuracy * 100) / 10 });
  }, [schedule, stance, level, stopCamera, locale]);

  // Round loop: clock, collect what the camera saw, judge each call as its window closes.
  useEffect(() => {
    if (phase !== "round") return undefined;
    const t0 = performance.now();
    actionsRef.current = [];
    elapsedRef.current = 0;
    setJudged(0);
    let judgedCount = 0;
    let lastPunches = null, lastSlips = null, lastBobs = null, lastCall = -1;
    const winMs = LEVELS[level].window;
    const id = setInterval(() => {
      const t = performance.now() - t0;
      elapsedRef.current = t;
      setNow(t);
      const info = getDebugInfo();
      const punches = info.punchCount || 0;
      const slips = info.defenseStats?.slipCount || 0;
      const bobs = info.defenseStats?.bobCount || 0;
      // First poll sets the baseline; afterwards each increase is an action at this moment.
      if (lastPunches !== null) {
        for (let k = lastPunches; k < punches; k++) actionsRef.current.push({ t, kind: "punch", hand: info.lastPunchHand });
        for (let k = lastSlips; k < slips; k++) actionsRef.current.push({ t, kind: "slip" });
        for (let k = lastBobs; k < bobs; k++) actionsRef.current.push({ t, kind: "roll" });
      }
      lastPunches = punches; lastSlips = slips; lastBobs = bobs;

      const cur = callAt(schedule, t, { level });
      if (cur && cur.i !== lastCall) { lastCall = cur.i; beep(cur.call === "slip" || cur.call === "roll"); }

      // Judge calls whose window has closed.
      const closed = schedule.filter((c) => c.at + winMs < t).length;
      if (closed > judgedCount) {
        const results = judgeRound(schedule.slice(0, closed), actionsRef.current, { stance, level });
        const last = results[results.length - 1];
        judgedCount = closed;
        setJudged(closed);
        setFeedback({ outcome: last.outcome, reactionMs: last.reactionMs, until: t + 900 });
      }
      if (t >= ROUND_MS) { clearInterval(id); finish(); }
    }, 80);
    return () => clearInterval(id);
  }, [phase, schedule, level, stance, getDebugInfo, beep, finish]);

  const exit = () => { stopCamera(); router.push(`/${locale}/train`); };

  // ── INTRO ──────────────────────────────────────────────────────────────
  if (phase === "intro") {
    const leadSide = stance === "southpaw" ? L("баруун", "오른", "right") : L("зүүн", "왼", "left");
    return (
      <main style={{ minHeight: "100dvh", background: pageBackground, color: "#fff", padding: "calc(20px + env(safe-area-inset-top)) 16px 32px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ ...kickerPill, alignSelf: "flex-start" }}><span style={kickerDot} />{L("Шинэ дасгал", "새 드릴", "New drill")}</p>
          <h1 style={{ ...displayTitle, margin: 0, fontSize: 40 }}>{L("Mitt дасгал", "미트 드릴", "Mitt drill")}</h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: whiteAlpha(0.75) }}>
            {L("Дасгалжуулагч шиг дэлгэц дуудна — цагираг дуусахаас өмнө зөв гараар цохь эсвэл толгойгоо хөдөлгө. 30 секунд.",
              "코치처럼 화면이 콜합니다 — 링이 끝나기 전에 맞는 손으로 치거나 머리를 움직이세요. 30초.",
              "The screen calls like a coach — answer with the right hand or head movement before the ring runs out. 30 seconds.")}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {[
              ["1", L(`Жэб (${leadSide} гар)`, `잽 (${leadSide}손)`, `Jab (${leadSide} hand)`), "#60A5FA"],
              ["2", L("Кросс (хойд гар)", "크로스 (뒷손)", "Cross (rear hand)"), "#FF3B30"],
              ["1-2", L("Жэб, дараа нь кросс", "잽 다음 크로스", "Jab then cross"), "#F5C451"],
              ["⇆", L("Slip — толгой хажуу тийш", "슬립 — 머리를 옆으로", "Slip — head to the side"), "#67e8f9"],
            ].map(([k, label, color]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 14, background: whiteAlpha(0.04), border: `1px solid ${whiteAlpha(0.08)}` }}>
                <span style={{ minWidth: 34, height: 34, flexShrink: 0, padding: "0 6px", borderRadius: 17, display: "grid", placeItems: "center", whiteSpace: "nowrap", background: `${color}33`, border: `2px solid ${color}`, fontWeight: 900, fontSize: 12 }}>{k}</span>
                <span style={{ fontSize: 13, lineHeight: 1.35, color: whiteAlpha(0.85) }}>{label}</span>
              </div>
            ))}
          </div>

          <div role="radiogroup" aria-label={L("Түвшин", "난이도", "Level")} style={{ display: "flex", gap: 6, padding: 4, borderRadius: 14, background: whiteAlpha(0.04), border: `1px solid ${whiteAlpha(0.08)}` }}>
            {[["easy", L("Хялбар", "쉬움", "Easy")], ["normal", L("Дунд", "보통", "Normal")], ["hard", L("Хэцүү", "어려움", "Hard")]].map(([k, label]) => (
              <button key={k} type="button" role="radio" aria-checked={level === k} onClick={() => setLevel(k)} style={{
                flex: 1, minHeight: 40, borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700,
                background: level === k ? redAlpha(0.18) : "transparent", boxShadow: level === k ? `inset 0 0 0 1px ${redAlpha(0.55)}` : "none",
                color: level === k ? "#fff" : whiteAlpha(0.65),
              }}>{label}</button>
            ))}
          </div>

          <button type="button" data-testid="mitts-start" onClick={start} style={{ ...btnPrimary, fontFamily: "inherit" }}>
            {L("Эхлэх · 30 сек →", "시작 · 30초 →", "Start · 30 s →")}
          </button>
          <button type="button" onClick={exit} style={{ ...btnSecondary, fontFamily: "inherit", color: whiteAlpha(0.8) }}>
            {L("Train руу буцах", "트레이닝으로", "Back to Train")}
          </button>

          {camError && (
            <div role="alert" style={{ padding: 12, borderRadius: RADIUS.md, background: `linear-gradient(${redAlpha(0.18)}, ${redAlpha(0.18)}), #141012`, border: `1px solid ${redAlpha(0.5)}`, color: "#fff", fontSize: FONT_SIZE.sm, lineHeight: 1.45 }}>
              {camError === "NotAllowedError" || camError === "SecurityError"
                ? cameraPermissionHelp(typeof navigator !== "undefined" ? navigator.userAgent : "", locale, L("Эхлэх", "시작", "Start"))
                : L("Камер олдсонгүй эсвэл өөр апп ашиглаж байна. Хаагаад дахин оролдоно уу.", "카메라를 찾을 수 없거나 다른 앱이 사용 중입니다. 닫고 다시 시도하세요.", "No camera found, or another app is using it. Close it and try again.")}
            </div>
          )}
        </div>
      </main>
    );
  }

  // ── COUNTDOWN / ROUND ─────────────────────────────────────────────────
  if (phase === "countdown" || phase === "round") {
    const current = phase === "round" ? callAt(schedule, now, { level }) : null;
    const secs = Math.max(0, Math.ceil((ROUND_MS - now) / 1000));
    return (
      <main style={{ position: "fixed", inset: 0, background: "#000", color: "#fff" }}>
        <video ref={videoRef} playsInline muted autoPlay style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
        <div style={{ position: "absolute", top: "calc(12px + env(safe-area-inset-top))", left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ padding: "6px 12px", borderRadius: RADIUS.full, background: blackAlpha(0.6), fontWeight: FONT_WEIGHT.black, fontSize: FONT_SIZE.md, fontVariantNumeric: "tabular-nums" }}>
            {phase === "round" ? `0:${String(secs).padStart(2, "0")}` : "—"}
          </span>
          {phase === "round" && (
            <button type="button" onClick={finish} style={{ minHeight: 40, padding: "6px 14px", borderRadius: RADIUS.full, border: `1px solid ${whiteAlpha(0.3)}`, background: blackAlpha(0.5), color: "#fff", fontSize: FONT_SIZE.sm, cursor: "pointer", fontFamily: "inherit" }}>
              {L("Дуусгах", "종료", "Finish")}
            </button>
          )}
          <span style={{ padding: "6px 12px", borderRadius: RADIUS.full, background: blackAlpha(0.6), fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm, fontVariantNumeric: "tabular-nums" }}>
            🥊 {judged}/{schedule.length}
          </span>
        </div>

        {phase === "round" && <MittCall current={current} stance={stance} locale={locale} feedback={feedback && now < feedback.until ? feedback : null} />}

        {phase === "countdown" && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: blackAlpha(0.35) }}>
            <div style={{ textAlign: "center", padding: 16 }}>
              <div style={{ fontSize: 96, fontWeight: FONT_WEIGHT.ultra, lineHeight: 1 }}>{count > 0 ? count : "GO"}</div>
              <div style={{ marginTop: 10, fontSize: FONT_SIZE.base, color: whiteAlpha(0.85) }}>
                {poseStatus === "ready"
                  ? L("1.5–2 метр ухарч, хамгаалалтаа өргө", "1.5–2m 뒤로, 가드 올리고", "Step back 1.5–2 m, hands up")
                  : L("AI ачаалж байна…", "AI 로딩 중…", "Loading AI…")}
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // ── RESULT ────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100dvh", background: pageBackground, color: "#fff", padding: "calc(20px + env(safe-area-inset-top)) 16px 32px" }}>
      {summary && <MittResult summary={summary} locale={locale} onAgain={() => setPhase("intro")} onExit={exit} />}
    </main>
  );
}

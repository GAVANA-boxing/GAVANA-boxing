"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserProfile } from "@/context/UserProfileProvider";
import { getLocale } from "@/lib/i18n";
import { loc } from "@/lib/loc";
import { cameraPermissionHelp } from "@/lib/cameraHelp";
import { usePoseDetection } from "@/hooks/usePoseDetection";
import { buildJabCrossReference } from "@/lib/ghost/reference";
import { analyzeGhostRound } from "@/lib/ghost/analyze";
import { funnel } from "@/lib/funnel";
import MotionReplay3D from "@/components/train/MotionReplay3D";
import GhostCanvas2D from "@/components/ghost/GhostCanvas2D";
import { btnPrimary, btnSecondary, displayTitle, kickerDot, kickerPill, pageBackground, sectionLabel } from "@/components/ui/brand";
import { RED, GOLD, GREEN, RADIUS, FONT_SIZE, FONT_WEIGHT, whiteAlpha, redAlpha, blackAlpha } from "@/lib/tokens";

const ROUND_SECONDS = 30;

/**
 * Ghost Round — watch a 3D ghost throw a jab–cross, mirror it for one 30s
 * round on camera, then get a match score and ONE thing to fix, with a
 * side-by-side 3D comparison. v1: one combo, one round, no saving.
 */
export default function GhostRoundPage() {
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

  const ghost = useMemo(() => buildJabCrossReference({ stance, cycles: 3 }), [stance]);

  const [phase, setPhase] = useState("watch"); // watch | countdown | round | result
  const [count, setCount] = useState(3);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [camError, setCamError] = useState(null);
  const [punches, setPunches] = useState(0);
  const [cue, setCue] = useState(null);
  const [result, setResult] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { getDebugInfo, getMotionReplay, poseStatus } = usePoseDetection({
    videoRef,
    isActive: phase === "round",
    stance,
  });

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);
  useEffect(() => stopCamera, [stopCamera]);

  // Camera is requested inside the user's tap (best for iOS permissions/audio).
  const startRound = async () => {
    setCamError(null);
    setResult(null);
    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      }
      setPhase("countdown");
      setCount(3);
      funnel("ghost_round_started", { locale, meta: stance });
    } catch (err) {
      setCamError(String(err?.name || "error"));
    }
  };

  // Attach the stream whenever the video element is on screen.
  useEffect(() => {
    if ((phase === "countdown" || phase === "round") && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) videoRef.current.srcObject = streamRef.current;
      videoRef.current.play?.().catch(() => {});
    }
  }, [phase]);

  // 3-2-1
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count <= 0) { setSecondsLeft(ROUND_SECONDS); setPunches(0); setPhase("round"); return; }
    const id = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(id);
  }, [phase, count]);

  const finish = useCallback(() => {
    const replay = getMotionReplay();
    const analysis = analyzeGhostRound(replay, ghost, stance);
    setResult({ replay, analysis });
    setPhase("result");
    stopCamera();
    funnel("ghost_round_completed", { locale, meta: analysis.tip, score: analysis.match / 10 });
  }, [getMotionReplay, ghost, stance, stopCamera, locale]);

  // Round clock + live punch count + framing cue
  useEffect(() => {
    if (phase !== "round") return;
    const endAt = Date.now() + ROUND_SECONDS * 1000;
    let misses = 0;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setSecondsLeft(left);
      const info = getDebugInfo();
      setPunches(info.punchCount || 0);
      if (info.status === "ready" && !info.landmarksDetected) {
        misses += 1;
        setCue(misses >= 6 ? L("Ухарч зогс — биеийг чинь харахгүй байна", "뒤로 물러서세요 — 몸이 보이지 않아요", "Step back — we can't see you") : null);
      } else { misses = 0; setCue(null); }
      if (left <= 0) { clearInterval(id); finish(); }
    }, 400);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const exit = () => { stopCamera(); router.push(`/${locale}/train`); };

  // ── WATCH ─────────────────────────────────────────────────────────────
  if (phase === "watch") {
    return (
      <>
        <MotionReplay3D
          replay={ghost}
          locale={locale}
          onClose={exit}
          title={L("Ghost Round · Jab–Cross", "고스트 라운드 · 잽–크로스", "Ghost Round · Jab–Cross")}
          subtitle={
            <>
              {L(
                "Ажигла: jab-ийн үед хойд гар эрүүндээ, cross-д мөр урагшаа эргэнэ",
                "보세요: 잽 때 뒷손은 턱에, 크로스 때 어깨가 앞으로 회전",
                "Watch: rear hand stays on the chin during the jab; shoulders turn on the cross",
              )}
              <span style={{ display: "block", marginTop: 3, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                {L("GAVANA дасгалжуулагчийн бодит хөдөлгөөн", "GAVANA 코치의 실제 동작", "Real motion of a GAVANA coach")}
              </span>
            </>
          }
          action={{ label: L(`Дагаж хий · ${ROUND_SECONDS} сек →`, `따라 하기 · ${ROUND_SECONDS}초 →`, `Copy it · ${ROUND_SECONDS}s round →`), onClick: startRound }}
        />
        {camError && (
          <div role="alert" style={{ position: "fixed", left: 16, right: 16, bottom: 110, zIndex: 1300, padding: 12, borderRadius: RADIUS.md, background: `linear-gradient(${redAlpha(0.18)}, ${redAlpha(0.18)}), #141012`, border: `1px solid ${redAlpha(0.5)}`, boxShadow: `0 10px 30px ${blackAlpha(0.5)}`, color: "#fff", fontSize: FONT_SIZE.sm, lineHeight: 1.45 }}>
            {camError === "NotAllowedError" || camError === "SecurityError"
              ? cameraPermissionHelp(typeof navigator !== "undefined" ? navigator.userAgent : "", locale, L("Дагаж хий", "따라 하기", "Copy it"))
              : L("Камер олдсонгүй эсвэл өөр апп ашиглаж байна. Хаагаад дахин оролдоно уу.", "카메라를 찾을 수 없거나 다른 앱이 사용 중입니다. 닫고 다시 시도하세요.", "No camera found, or another app is using it. Close it and try again.")}
          </div>
        )}
      </>
    );
  }

  // ── COUNTDOWN / ROUND ─────────────────────────────────────────────────
  if (phase === "countdown" || phase === "round") {
    return (
      <main style={{ position: "fixed", inset: 0, background: "#000", color: "#fff" }}>
        <video ref={videoRef} playsInline muted autoPlay style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
        <div style={{ position: "absolute", top: "calc(12px + env(safe-area-inset-top))", left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ padding: "6px 12px", borderRadius: RADIUS.full, background: blackAlpha(0.6), fontWeight: FONT_WEIGHT.black, fontSize: FONT_SIZE.md, fontVariantNumeric: "tabular-nums" }}>
            {phase === "round" ? `0:${String(secondsLeft).padStart(2, "0")}` : "—"}
          </span>
          <span style={{ padding: "6px 12px", borderRadius: RADIUS.full, background: blackAlpha(0.6), fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm }}>
            👊 {punches}
          </span>
        </div>
        {/* Ghost in the corner — copy it */}
        <div style={{ position: "absolute", right: 10, bottom: "calc(20px + env(safe-area-inset-bottom))", padding: 6, borderRadius: RADIUS.md, background: blackAlpha(0.45), border: "1px solid rgba(103,232,249,0.35)" }}>
          <GhostCanvas2D replay={ghost} size={120} />
          <div style={{ textAlign: "center", fontSize: 11, fontWeight: FONT_WEIGHT.black, color: "#67e8f9", letterSpacing: 1 }}>GHOST</div>
        </div>
        {phase === "countdown" && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: blackAlpha(0.35) }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 96, fontWeight: FONT_WEIGHT.ultra, lineHeight: 1 }}>{count > 0 ? count : "GO"}</div>
              <div style={{ marginTop: 10, fontSize: FONT_SIZE.base, color: whiteAlpha(0.8) }}>
                {poseStatus === "ready"
                  ? L("1.5–2 метр ухарч, бүх биеэ харуул", "1.5–2m 뒤로, 전신이 보이게", "Step back 1.5–2 m, full body in view")
                  : L("AI ачаалж байна…", "AI 로딩 중…", "Loading AI…")}
              </div>
            </div>
          </div>
        )}
        {cue && phase === "round" && (
          <div role="status" style={{ position: "absolute", left: 16, right: 150, bottom: "calc(30px + env(safe-area-inset-bottom))", padding: "10px 12px", borderRadius: RADIUS.md, background: redAlpha(0.85), fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm }}>
            {cue}
          </div>
        )}
        {phase === "round" && (
          <button type="button" onClick={finish} style={{ position: "absolute", left: 16, top: "calc(60px + env(safe-area-inset-top))", padding: "6px 12px", borderRadius: RADIUS.full, border: `1px solid ${whiteAlpha(0.3)}`, background: blackAlpha(0.5), color: "#fff", fontSize: FONT_SIZE.sm, cursor: "pointer" }}>
            {L("Дуусгах", "종료", "Finish")}
          </button>
        )}
      </main>
    );
  }

  // ── RESULT ────────────────────────────────────────────────────────────
  const a = result?.analysis;
  const noData = !result?.replay;
  const fmt = (x, d = 1) => (x == null ? "—" : Number(x).toFixed(d));
  const pct = (x) => (x == null ? "—" : `${Math.round(x * 100)}%`);
  const rows = a ? [
    [L("Jab–cross комбо", "잽–크로스 콤보", "Jab–cross combos"), a.you.combos, a.ref.combos],
    [L("Jab үед хойд гар дээр", "잽 때 뒷손 가드", "Rear hand up on jab"), pct(a.you.rearGuardOnJab), pct(a.ref.rearGuardOnJab)],
    [L("Cross-ийн мөрний эргэлт", "크로스 어깨 회전", "Cross shoulder turn"), a.you.crossRotation == null ? "—" : `${Math.round(a.you.crossRotation)}°`, `${Math.round(a.ref.crossRotation)}°`],
    [L("Jab сунгалт", "잽 리치", "Jab reach"), fmt(a.you.jabReach), fmt(a.ref.jabReach)],
    [L("Cross сунгалт", "크로스 리치", "Cross reach"), fmt(a.you.crossReach), fmt(a.ref.crossReach)],
  ] : [];

  return (
    <main style={{ minHeight: "100dvh", background: pageBackground, color: "#fff", padding: "calc(20px + env(safe-area-inset-top)) 16px 32px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ ...kickerPill, alignSelf: "flex-start" }}><span style={kickerDot} />{L("Ghost Round · Jab–Cross", "고스트 라운드 · 잽–크로스", "Ghost Round · Jab–Cross")}</p>

        {noData ? (
          <p style={{ margin: 0, fontSize: FONT_SIZE.md, color: whiteAlpha(0.8), lineHeight: 1.5 }}>
            {L("Камер биеийг чинь хангалттай харсангүй. 1.5–2 метр ухарч, гэрэлтэй газар дахин оролдоорой.",
              "카메라가 몸을 충분히 보지 못했어요. 1.5–2m 뒤로, 밝은 곳에서 다시 해 보세요.",
              "The camera couldn't see you well enough. Step back 1.5–2 m in good light and try again.")}
          </p>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ ...displayTitle, fontSize: 64, color: a.match >= 75 ? GREEN : a.match >= 50 ? GOLD : RED }}>{a.match}%</span>
              <span style={{ fontSize: FONT_SIZE.base, color: whiteAlpha(0.6) }}>{L("Ghost-той таарсан", "고스트와 일치", "match with the ghost")}</span>
            </div>

            <div style={{ padding: 16, borderRadius: 20, background: redAlpha(0.1), border: `1px solid ${redAlpha(0.35)}` }}>
              <div style={{ ...sectionLabel, color: "#ff7a72", marginBottom: 8 }}>
                {a.tip === "great" ? L("Дараагийн алхам", "다음 단계", "Next step") : L("Эхлээд үүнийг засна", "먼저 이것부터", "Fix this first")}
              </div>
              <div style={{ fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, lineHeight: 1.45 }}>{loc(locale, a.tipText.mn, a.tipText.ko, a.tipText.en)}</div>
            </div>

            <div style={{ borderRadius: 20, border: `1px solid ${whiteAlpha(0.08)}`, overflow: "hidden", background: whiteAlpha(0.03) }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 64px 64px", padding: "10px 14px", fontSize: 12.5, fontWeight: 600, color: whiteAlpha(0.5), background: whiteAlpha(0.03) }}>
                <span />
                <span style={{ textAlign: "right" }}>{L("Чи", "나", "You")}</span>
                <span style={{ textAlign: "right", color: "#67e8f9" }}>Ghost</span>
              </div>
              {rows.map(([label, you, ref]) => (
                <div key={label} style={{ display: "grid", gridTemplateColumns: "1fr 64px 64px", padding: "11px 14px", borderTop: `1px solid ${whiteAlpha(0.06)}`, fontSize: 14 }}>
                  <span style={{ color: whiteAlpha(0.75) }}>{label}</span>
                  <span style={{ textAlign: "right", fontWeight: FONT_WEIGHT.bold, fontVariantNumeric: "tabular-nums" }}>{you}</span>
                  <span style={{ textAlign: "right", color: "#67e8f9", fontVariantNumeric: "tabular-nums" }}>{ref}</span>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => setCompareOpen(true)} style={{ ...btnSecondary, border: "1px solid rgba(103,232,249,0.45)", background: "rgba(103,232,249,0.1)", color: "#67e8f9", fontFamily: "inherit" }}>
              🧊 {L("3D-ээр Ghost-той харьцуулах", "3D로 고스트와 비교", "Compare with the ghost in 3D")}
            </button>
          </>
        )}

        <button type="button" onClick={() => { setPhase("watch"); setResult(null); }} style={{ ...btnPrimary, fontFamily: "inherit" }}>
          {L("Дахин раунд", "다시 라운드", "Another round")}
        </button>
        <button type="button" onClick={exit} style={{ ...btnSecondary, fontFamily: "inherit", color: whiteAlpha(0.75) }}>
          {L("Train руу буцах", "트레이닝으로", "Back to Train")}
        </button>
      </div>

      {compareOpen && result?.replay && (
        <MotionReplay3D replay={result.replay} ghost={ghost} locale={locale} onClose={() => setCompareOpen(false)} />
      )}
    </main>
  );
}

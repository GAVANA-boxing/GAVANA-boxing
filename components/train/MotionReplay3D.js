"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loc } from "@/lib/loc";
import { RED, GOLD, GREEN, RADIUS, FONT_SIZE, FONT_WEIGHT, whiteAlpha, redAlpha, blackAlpha } from "@/lib/tokens";
import { nextPunchAfter, isPunchMoment, guardState, guardDropRatio, floorY } from "@/lib/motionReplay";
import { refineReplay, sampleFrame } from "@/lib/motionRefine";
import { createFighterAvatar, createRingFloor } from "@/lib/three/fighterAvatar";
import { createModelFighter, AVATAR_MODELS } from "@/lib/three/modelFighter";
import { useUserProfile } from "@/context/UserProfileProvider";
import { fighterStyle, sanitizeStylePrefs, SKIN_TONES, HAIR_STYLES, BUILDS } from "@/lib/avatar/fighterStyle";

const AVATAR_KEY = "gavana_avatar";
const readAvatar = () => {
  try { const v = localStorage.getItem(AVATAR_KEY); return v === "female" || v === "classic" ? v : "male"; } catch { return "male"; }
};

// "classic" = the procedural fighter, now personal ("Mine"): skin / hair / build
// chosen here, rank colour on gloves and waistband. Stored on this device only.
const STYLE_KEY = "gavana_fighter_style";
const readStylePrefs = () => {
  try { return sanitizeStylePrefs(JSON.parse(localStorage.getItem(STYLE_KEY) || "{}")); } catch { return {}; }
};

const SPEEDS = [0.25, 0.5, 1];
const FOCUS_PAD_MS = 250; // show a little before and after a focused punch
const VIEWS = {
  // 3/4 view: punches toward the camera are foreshortened from the front,
  // so the default angle shows reach and shoulder turn.
  angle: [1.55, 0.2, 2.1],
  front: [0, -0.1, 2.6],
  side: [2.6, -0.1, 0],
  top: [0, 2.6, 0.4],
};

// World landmarks: x to the subject's side, y down, z toward the camera is negative.
// Display: mirror x (selfie view), flip y (three.js is y-up), keep depth readable.
const toV = (p, i) => [-p[i * 3], -p[i * 3 + 1], -p[i * 3 + 2]];

/**
 * The user's own session as an interactive 3D skeleton: drag to rotate,
 * slow motion, jump to each punch. Wrists are green when the guard is up and
 * red when a hand is down outside a punch — computed from their real data.
 */
/**
 * Optional (Punch Teardown):
 * - focus: { startT, endT } — loop just this window in slow motion.
 * - hud(t, seek): React nodes drawn over the 3D view for the current time;
 *   seek(t) jumps there and pauses.
 * - extra: React nodes between the 3D view and the controls.
 */
export default function MotionReplay3D({ replay: rawReplay, ghost = null, locale, onClose, title, subtitle, action = null, focus = null, hud = null, extra = null, fighter = null }) {
  // Smoothed, knees fixed, feet planted — the raw camera data is jittery at ~10–20 fps.
  const replay = useMemo(() => refineReplay(rawReplay), [rawReplay]);
  const mountRef = useRef(null);
  const stateRef = useRef({ t: 0, playing: true, speed: 0.5 });
  // Focused window (a single punch): jump there and play it at quarter speed.
  const focusRef = useRef(focus);
  useEffect(() => {
    focusRef.current = focus;
    if (focus) {
      Object.assign(stateRef.current, { t: focus.startT - FOCUS_PAD_MS, playing: true, speed: 0.25 });
      setUi((u) => ({ ...u, t: focus.startT - FOCUS_PAD_MS, playing: true, speed: 0.25 }));
    }
  }, [focus?.startT, focus?.endT]); // eslint-disable-line react-hooks/exhaustive-deps
  const apiRef = useRef(null);
  const [ui, setUi] = useState({ t: 0, playing: true, speed: 0.5 });
  const [failed, setFailed] = useState(false);
  const [avatar, setAvatar] = useState("male");
  useEffect(() => { setAvatar(readAvatar()); }, []);
  const chooseAvatar = (v) => { setAvatar(v); try { localStorage.setItem(AVATAR_KEY, v); } catch { /* private mode */ } };
  const [stylePrefs, setStylePrefs] = useState({});
  useEffect(() => { setStylePrefs(readStylePrefs()); }, []);
  const setStyle = (patch) => setStylePrefs((prev) => {
    const next = sanitizeStylePrefs({ ...prev, ...patch });
    try { localStorage.setItem(STYLE_KEY, JSON.stringify(next)); } catch { /* private mode */ }
    return next;
  });
  // Rank (gloves / waistband colour) and seed from the signed-in profile unless given.
  const { profile } = useUserProfile();
  const fxp = Number(fighter?.xp ?? profile?.xp) || 0;
  const fseed = String(fighter?.seed ?? profile?.uid ?? "");
  const style = useMemo(() => fighterStyle({ xp: fxp, seed: fseed, prefs: stylePrefs }), [fxp, fseed, stylePrefs]);
  const styleKey = avatar === "classic" ? JSON.stringify(style) : "";

  const dropPct = Math.round(guardDropRatio(replay) * 100);
  const L = (mn, ko, en) => loc(locale, mn, ko, en);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      let THREE, OrbitControls;
      try {
        THREE = await import("three");
        ({ OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js"));
      } catch {
        if (!disposed) setFailed(true);
        return;
      }
      const el = mountRef.current;
      if (disposed || !el) return;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        setFailed(true); // no WebGL on this device
        return;
      }
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.05, 50);
      // Two figures side by side need a wider shot to fit a portrait phone.
      const zoom = ghost ? 1.6 : 1;
      const viewPos = (name) => VIEWS[name].map((c) => c * zoom);
      camera.position.set(...viewPos("angle"));
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.target.set(0, -0.1, 0);
      controls.minDistance = 1.2;
      controls.maxDistance = 8;

      // Studio light: soft sky/ground fill, a warm key that casts shadows, a red rim from behind.
      scene.add(new THREE.HemisphereLight(0xdfe7ff, 0x1a1012, 0.9));
      const key = new THREE.DirectionalLight(0xfff3e6, 2.2);
      key.position.set(1.6, 3, 2.2);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.near = 0.5; key.shadow.camera.far = 8;
      key.shadow.camera.left = -1.6; key.shadow.camera.right = 1.6; key.shadow.camera.top = 1.6; key.shadow.camera.bottom = -1.6;
      key.shadow.bias = -0.0005;
      key.shadow.radius = 4;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xff3b30, 2.4);
      rim.position.set(-2, 1.4, -2.4);
      scene.add(rim);
      const fill = new THREE.DirectionalLight(0x9fb7ff, 0.5);
      fill.position.set(-2, 0.5, 2);
      scene.add(fill);

      const floor = -floorY(replay) - 0.02;
      const ring = createRingFloor(THREE, { radius: ghost ? 2.2 : 1.6 });
      ring.position.y = floor;
      scene.add(ring);

      const toScene = (p, i, offsetX, out) => {
        const q = toV(p, i);
        return out.set(q[0] + offsetX, q[1], q[2]);
      };
      // Procedural fighter right away; swap in the rigged model (male/female) once it loads.
      const makeFighter = ({ offsetX = 0, look = "you" }) => {
        let current = createFighterAvatar(THREE, { look, style: look === "ghost" ? null : style });
        scene.add(current.group);
        if (avatar !== "classic" && AVATAR_MODELS[avatar]) {
          createModelFighter(THREE, { url: AVATAR_MODELS[avatar], look })
            .then((m) => {
              if (disposed) { m.dispose(); return; }
              current.dispose();
              current = m;
              scene.add(m.group);
            })
            .catch(() => { /* keep the procedural fighter */ });
        }
        const cache = Array.from({ length: 33 }, () => new THREE.Vector3());
        const scratch = new Float32Array(33 * 3);
        const draw = (rep, t) => {
          // Interpolated between recorded frames: smooth at 60 fps and in slow motion.
          const p = sampleFrame(rep, t, scratch);
          if (!p) return;
          current.update((i) => toScene(p, i, offsetX, cache[i]), {
            punching: isPunchMoment(rep, t),
            guard: guardState(p),
          });
        };
        draw.dispose = () => current.dispose();
        return draw;
      };

      // With a ghost: you on the left, the ghost on the right (it loops on its own clock).
      const drawYou = makeFighter({ offsetX: ghost ? -0.5 : 0 });
      const drawGhost = ghost ? makeFighter({ offsetX: 0.5, look: "ghost" }) : null;
      const draw = (t) => {
        drawYou(replay, t);
        if (drawGhost) drawGhost(ghost, t % Math.max(ghost.duration, 1));
      };

      let raf, last = performance.now(), uiTick = 0;
      const loop = (now) => {
        const s = stateRef.current;
        const dt = now - last;
        last = now;
        if (s.playing) {
          s.t += dt * s.speed;
          const f = focusRef.current;
          if (f) {
            if (s.t > f.endT + FOCUS_PAD_MS || s.t < f.startT - FOCUS_PAD_MS) s.t = f.startT - FOCUS_PAD_MS;
          } else if (s.t > replay.duration) s.t = 0; // loop
        }
        draw(s.t);
        controls.update();
        renderer.render(scene, camera);
        if (now - uiTick > 100) { uiTick = now; setUi({ t: s.t, playing: s.playing, speed: s.speed }); }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      const onResize = () => {
        const W = el.clientWidth, H = el.clientHeight;
        renderer.setSize(W, H);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      apiRef.current = {
        view: (name) => { camera.position.set(...viewPos(name)); controls.target.set(0, -0.1, 0); },
      };

      cleanup = () => {
        cancelAnimationFrame(raf);
        drawYou.dispose?.();
        drawGhost?.dispose?.();
        window.removeEventListener("resize", onResize);
        controls.dispose();
        scene.traverse((o) => { o.geometry?.dispose?.(); o.material?.map?.dispose?.(); o.material?.dispose?.(); });
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();
    return () => { disposed = true; cleanup(); };
  }, [replay, ghost, avatar, styleKey]); // eslint-disable-line react-hooks/exhaustive-deps -- style is read via styleKey

  const set = (patch) => { Object.assign(stateRef.current, patch); setUi((u) => ({ ...u, ...patch })); };
  const jumpNext = () => {
    const pk = nextPunchAfter(replay, stateRef.current.t) || replay.punches[0];
    if (pk) set({ t: Math.max(0, pk.t - 350), playing: true, speed: 0.25 });
  };
  const secs = (ms) => `${(ms / 1000).toFixed(1)}s`;

  const btn = (active) => ({
    minHeight: 40, padding: "0 12px", borderRadius: RADIUS.sm, cursor: "pointer", fontFamily: "inherit",
    fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold,
    border: `1px solid ${active ? redAlpha(0.55) : whiteAlpha(0.12)}`,
    background: active ? redAlpha(0.16) : whiteAlpha(0.04),
    color: active ? RED : whiteAlpha(0.8),
  });

  return (
    <div role="dialog" aria-label="3D replay" style={{ position: "fixed", inset: 0, zIndex: 1200, background: blackAlpha(0.92), display: "flex", flexDirection: "column", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(12px + env(safe-area-inset-top)) 16px 8px" }}>
        <div>
          <div style={{ fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.black, letterSpacing: 1.6, color: whiteAlpha(0.6), textTransform: "uppercase" }}>
            {title || L("3D техник задлал", "3D 기술 분석", "3D technique breakdown")}
          </div>
          <div style={{ fontSize: FONT_SIZE.sm, color: whiteAlpha(0.6), marginTop: 2 }}>
            {subtitle || (
              <>
                {L("Чирж эргүүл · ", "드래그해서 회전 · ", "Drag to rotate · ")}
                {replay.punches.length} {L("цохилт", "펀치", "punches")}
                {ghost && <span style={{ color: "#67e8f9" }}> · {L("баруун талд Ghost", "오른쪽은 고스트", "ghost on the right")}</span>}
              </>
            )}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" style={{ ...btn(false), fontSize: 18, padding: "4px 12px" }}>×</button>
      </div>

      <div ref={mountRef} style={{ flex: 1, minHeight: 240, position: "relative", touchAction: "none" }}>
        {hud && <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{hud(ui.t, (t) => set({ t, playing: false }))}</div>}
        {failed && (
          <p style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: whiteAlpha(0.6), fontSize: FONT_SIZE.base, padding: 24, textAlign: "center" }}>
            {L("Энэ төхөөрөмж 3D дүрслэлийг дэмжихгүй байна.", "이 기기는 3D 표시를 지원하지 않습니다.", "This device can't show 3D.")}
          </p>
        )}
      </div>

      <div style={{ padding: "10px 16px calc(14px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 10 }}>
        {extra}
        {!focus && <div style={{ fontSize: FONT_SIZE.sm, color: whiteAlpha(0.75), display: "flex", gap: 14, flexWrap: "wrap" }}>
          <span><span style={{ color: GREEN }}>●</span> {L("Хамгаалалт дээр", "가드 업", "Guard up")}</span>
          <span><span style={{ color: RED }}>●</span> {L("Гар доошилсон", "손 내려감", "Hand down")}</span>
          <span><span style={{ color: GOLD }}>●</span> {L("Цохилт", "펀치", "Punch")}</span>
          <span style={{ marginLeft: "auto", color: dropPct > 25 ? RED : whiteAlpha(0.6) }}>
            {L("Гар доошилсон", "손 내려간 시간", "Guard down")}: {dropPct}%
          </span>
        </div>}

        {/* Timeline with punch markers */}
        <div style={{ position: "relative", height: 26 }}>
          <input
            type="range"
            min={focus ? Math.round(focus.startT - FOCUS_PAD_MS) : 0}
            max={focus ? Math.round(focus.endT + FOCUS_PAD_MS) : Math.round(replay.duration)}
            value={Math.round(ui.t)}
            onChange={(e) => set({ t: Number(e.target.value), playing: false })}
            aria-label="Timeline"
            style={{ width: "100%", accentColor: RED }}
          />
          {!focus && replay.punches.map((pk, i) => (
            <span key={i} style={{ position: "absolute", top: 0, left: `${(pk.t / replay.duration) * 100}%`, width: 2, height: 8, background: GOLD, pointerEvents: "none" }} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" style={btn(false)} onClick={() => set({ playing: !ui.playing })}>
            {ui.playing ? "❚❚" : "▶"}
          </button>
          {SPEEDS.map((s) => (
            <button key={s} type="button" style={btn(ui.speed === s)} onClick={() => set({ speed: s })}>{s}×</button>
          ))}
          {!focus && (
            <button type="button" style={btn(false)} onClick={jumpNext} disabled={!replay.punches.length}>
              {L("Дараагийн цохилт →", "다음 펀치 →", "Next punch →")}
            </button>
          )}
          <span style={{ marginLeft: "auto", fontSize: FONT_SIZE.sm, color: whiteAlpha(0.5), fontVariantNumeric: "tabular-nums" }}>
            {secs(ui.t)} / {secs(replay.duration)}
          </span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {[["angle", L("Ташуу", "대각", "3/4")], ["front", L("Урдаас", "정면", "Front")], ["side", L("Хажуугаас", "측면", "Side")], ["top", L("Дээрээс", "위", "Top")]].map(([k, label]) => (
            <button key={k} type="button" style={{ ...btn(false), flex: 1 }} onClick={() => apiRef.current?.view(k)}>{label}</button>
          ))}
        </div>

        {!focus && <div role="radiogroup" aria-label={L("Дүр", "캐릭터", "Character")} style={{ display: "flex", gap: 6 }}>
          {[["male", L("Эрэгтэй", "남성", "Male")], ["female", L("Эмэгтэй", "여성", "Female")], ["classic", L("Миний", "내 파이터", "Mine")]].map(([k, label]) => (
            <button key={k} type="button" role="radio" aria-checked={avatar === k} style={{ ...btn(avatar === k), flex: 1 }} onClick={() => chooseAvatar(k)}>{label}</button>
          ))}
        </div>}

        {!focus && avatar === "classic" && (
          <div data-testid="fighter-style" style={{ display: "grid", gap: 8 }}>
            <div role="radiogroup" aria-label={L("Арьсны өнгө", "피부 톤", "Skin tone")} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SKIN_TONES.map((c, i) => {
                const on = style.skin === c;
                return (
                  <button key={c} type="button" role="radio" aria-checked={on} aria-label={`${L("Арьсны өнгө", "피부 톤", "Skin tone")} ${i + 1}`} onClick={() => setStyle({ skin: i })}
                    style={{ width: 40, height: 40, borderRadius: RADIUS.full, cursor: "pointer", background: c, border: on ? `3px solid ${RED}` : `2px solid ${whiteAlpha(0.18)}` }} />
                );
              })}
            </div>
            <div role="radiogroup" aria-label={L("Үс", "헤어", "Hair")} style={{ display: "flex", gap: 6 }}>
              {HAIR_STYLES.map((h) => {
                const label = { none: L("Үсгүй", "없음", "None"), buzz: L("Тайруул", "버즈컷", "Buzz"), short: L("Богино", "짧게", "Short"), bun: L("Боодол", "번", "Bun") }[h];
                return <button key={h} type="button" role="radio" aria-checked={style.hair === h} style={{ ...btn(style.hair === h), flex: 1, padding: "0 6px" }} onClick={() => setStyle({ hair: h })}>{label}</button>;
              })}
            </div>
            <div role="radiogroup" aria-label={L("Биеийн галбир", "체형", "Build")} style={{ display: "flex", gap: 6 }}>
              {Object.keys(BUILDS).map((b) => {
                const label = { lean: L("Туранхай", "슬림", "Lean"), medium: L("Дунд", "보통", "Medium"), heavy: L("Том", "헤비", "Heavy") }[b];
                return <button key={b} type="button" role="radio" aria-checked={style.buildKey === b} style={{ ...btn(style.buildKey === b), flex: 1 }} onClick={() => setStyle({ build: b })}>{label}</button>;
              })}
            </div>
          </div>
        )}

        {action && (
          <button type="button" onClick={action.onClick} style={{
            width: "100%", padding: "13px", borderRadius: RADIUS.md, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, ${RED}, #cc2820)`, color: "#fff",
            fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.black,
          }}>
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

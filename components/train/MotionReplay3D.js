"use client";

import { useEffect, useRef, useState } from "react";
import { loc } from "@/lib/loc";
import { RED, GOLD, GREEN, RADIUS, FONT_SIZE, FONT_WEIGHT, whiteAlpha, redAlpha, blackAlpha } from "@/lib/tokens";
import {
  BONES, ARM_BONES, LM, frameIndexAt, nextPunchAfter, isPunchMoment, guardState, guardDropRatio, floorY,
} from "@/lib/motionReplay";

const SPEEDS = [0.25, 0.5, 1];
const VIEWS = {
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
export default function MotionReplay3D({ replay, locale, onClose }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ t: 0, playing: true, speed: 0.5 });
  const apiRef = useRef(null);
  const [ui, setUi] = useState({ t: 0, playing: true, speed: 0.5 });
  const [failed, setFailed] = useState(false);

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
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.05, 50);
      camera.position.set(...VIEWS.front);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.target.set(0, -0.1, 0);
      controls.minDistance = 1.2;
      controls.maxDistance = 6;

      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const dir = new THREE.DirectionalLight(0xffffff, 0.9);
      dir.position.set(1, 2, 2);
      scene.add(dir);

      const floor = -floorY(replay) - 0.02;
      const grid = new THREE.GridHelper(4, 16, 0x553333, 0x2a2a2e);
      grid.position.y = floor;
      scene.add(grid);

      // Bones as solid cylinders (WebGL ignores line width, so thin lines read
      // as a sketch). Each is a unit-height cylinder stretched between joints.
      const boneGeoShared = new THREE.CylinderGeometry(1, 1, 1, 10);
      const boneMeshes = BONES.map(([a, b]) => {
        const arm = ARM_BONES.has(`${a}-${b}`);
        const r = arm ? 0.024 : a >= 23 || b >= 23 ? 0.03 : 0.026;
        const m = new THREE.Mesh(boneGeoShared, new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.6 }));
        m.userData = { a, b, r, arm };
        scene.add(m);
        return m;
      });
      const Y = new THREE.Vector3(0, 1, 0), A = new THREE.Vector3(), B = new THREE.Vector3(), D = new THREE.Vector3();

      const sphere = (r, color) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshStandardMaterial({ color }));
        scene.add(m);
        return m;
      };
      const head = sphere(0.075, 0xdddddd);
      const lWrist = sphere(0.045, 0x22c55e);
      const rWrist = sphere(0.045, 0x22c55e);
      const joints = [LM.L_SHOULDER, LM.R_SHOULDER, LM.L_ELBOW, LM.R_ELBOW, LM.L_HIP, LM.R_HIP, LM.L_KNEE, LM.R_KNEE]
        .map((i) => ({ i, m: sphere(0.028, 0x9ca3af) }));

      const white = new THREE.Color(0xd1d5db), hot = new THREE.Color(RED), gold = new THREE.Color(GOLD);
      const up = new THREE.Color(GREEN), down = new THREE.Color(RED);

      const draw = (t) => {
        const fr = replay.frames[Math.max(0, frameIndexAt(replay, t))];
        if (!fr) return;
        const p = fr.p;
        const punching = isPunchMoment(replay, t);
        for (const m of boneMeshes) {
          const { a, b, r, arm } = m.userData;
          A.set(...toV(p, a)); B.set(...toV(p, b));
          D.subVectors(B, A);
          const len = D.length() || 0.0001;
          m.position.copy(A).addScaledVector(D, 0.5);
          m.quaternion.setFromUnitVectors(Y, D.divideScalar(len));
          m.scale.set(r, len, r);
          m.material.color.copy(punching && arm ? hot : white);
        }

        head.position.set(...toV(p, LM.NOSE));
        lWrist.position.set(...toV(p, LM.L_WRIST));
        rWrist.position.set(...toV(p, LM.R_WRIST));
        const g = guardState(p);
        lWrist.material.color.copy(punching ? gold : g.left === "up" ? up : down);
        rWrist.material.color.copy(punching ? gold : g.right === "up" ? up : down);
        joints.forEach(({ i, m }) => m.position.set(...toV(p, i)));
      };

      let raf, last = performance.now(), uiTick = 0;
      const loop = (now) => {
        const s = stateRef.current;
        const dt = now - last;
        last = now;
        if (s.playing) {
          s.t += dt * s.speed;
          if (s.t > replay.duration) s.t = 0; // loop
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
        view: (name) => { camera.position.set(...VIEWS[name]); controls.target.set(0, -0.1, 0); },
      };

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        controls.dispose();
        scene.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();
    return () => { disposed = true; cleanup(); };
  }, [replay]);

  const set = (patch) => { Object.assign(stateRef.current, patch); setUi((u) => ({ ...u, ...patch })); };
  const jumpNext = () => {
    const pk = nextPunchAfter(replay, stateRef.current.t) || replay.punches[0];
    if (pk) set({ t: Math.max(0, pk.t - 350), playing: true, speed: 0.25 });
  };
  const secs = (ms) => `${(ms / 1000).toFixed(1)}s`;

  const btn = (active) => ({
    padding: "7px 11px", borderRadius: RADIUS.sm, cursor: "pointer",
    fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold,
    border: `1px solid ${active ? redAlpha(0.55) : whiteAlpha(0.12)}`,
    background: active ? redAlpha(0.16) : whiteAlpha(0.04),
    color: active ? RED : whiteAlpha(0.8),
  });

  return (
    <div role="dialog" aria-label="3D replay" style={{ position: "fixed", inset: 0, zIndex: 1200, background: blackAlpha(0.92), display: "flex", flexDirection: "column", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(12px + env(safe-area-inset-top)) 16px 8px" }}>
        <div>
          <div style={{ fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.black, letterSpacing: 1.6, color: whiteAlpha(0.4), textTransform: "uppercase" }}>
            {L("3D техник задлал", "3D 기술 분석", "3D technique breakdown")}
          </div>
          <div style={{ fontSize: FONT_SIZE.sm, color: whiteAlpha(0.6), marginTop: 2 }}>
            {L("Чирж эргүүл · ", "드래그해서 회전 · ", "Drag to rotate · ")}
            {replay.punches.length} {L("цохилт", "펀치", "punches")}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" style={{ ...btn(false), fontSize: 18, padding: "4px 12px" }}>×</button>
      </div>

      <div ref={mountRef} style={{ flex: 1, minHeight: 240, position: "relative", touchAction: "none" }}>
        {failed && (
          <p style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: whiteAlpha(0.6), fontSize: FONT_SIZE.base, padding: 24, textAlign: "center" }}>
            {L("Энэ төхөөрөмж 3D дүрслэлийг дэмжихгүй байна.", "이 기기는 3D 표시를 지원하지 않습니다.", "This device can't show 3D.")}
          </p>
        )}
      </div>

      <div style={{ padding: "10px 16px calc(14px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: FONT_SIZE.sm, color: whiteAlpha(0.75), display: "flex", gap: 14, flexWrap: "wrap" }}>
          <span><span style={{ color: GREEN }}>●</span> {L("Хамгаалалт дээр", "가드 업", "Guard up")}</span>
          <span><span style={{ color: RED }}>●</span> {L("Гар доошилсон", "손 내려감", "Hand down")}</span>
          <span><span style={{ color: GOLD }}>●</span> {L("Цохилт", "펀치", "Punch")}</span>
          <span style={{ marginLeft: "auto", color: dropPct > 25 ? RED : whiteAlpha(0.6) }}>
            {L("Гар доошилсон", "손 내려간 시간", "Guard down")}: {dropPct}%
          </span>
        </div>

        {/* Timeline with punch markers */}
        <div style={{ position: "relative", height: 26 }}>
          <input
            type="range" min={0} max={Math.round(replay.duration)} value={Math.round(ui.t)}
            onChange={(e) => set({ t: Number(e.target.value), playing: false })}
            aria-label="Timeline"
            style={{ width: "100%", accentColor: RED }}
          />
          {replay.punches.map((pk, i) => (
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
          <button type="button" style={btn(false)} onClick={jumpNext} disabled={!replay.punches.length}>
            {L("Дараагийн цохилт →", "다음 펀치 →", "Next punch →")}
          </button>
          <span style={{ marginLeft: "auto", fontSize: FONT_SIZE.sm, color: whiteAlpha(0.5), fontVariantNumeric: "tabular-nums" }}>
            {secs(ui.t)} / {secs(replay.duration)}
          </span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {[["front", L("Урдаас", "정면", "Front")], ["side", L("Хажуугаас", "측면", "Side")], ["top", L("Дээрээс", "위", "Top")]].map(([k, label]) => (
            <button key={k} type="button" style={{ ...btn(false), flex: 1 }} onClick={() => apiRef.current?.view(k)}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

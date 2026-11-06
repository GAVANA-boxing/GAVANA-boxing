"use client";

import { useEffect, useRef, useState } from "react";

// Landing hero, upgraded: the rigged boxer (public/models) throws jab / hook /
// uppercut inside the phone, with GAVANA's AI skeleton drawn over the body —
// "this is what the camera sees". Loaded after the page is idle and only when
// visible; skipped for reduced motion, data saver and low-memory devices (the
// SVG preview underneath stays). Pauses off-screen.

const MODELS = ["/models/boxer_male.glb", "/models/boxer_female.glb"];
// Mixamo mocap clips retargeted for these rigs (scripts: see the JSON's _note).
const ANIMS_URL = "/models/anims/boxing.json";
const FADE_S = 0.22;
const ANIM_ORDER = ["Jab_Cross", "Boxing_5", "Boxing_4", "Jab_Cross", "Boxing_3", "Boxing_6"];
const CLIP_LABEL = [
  [/jab|straight/i, "JAB"],
  [/uppercut/i, "UPPERCUT"],
  [/hook/i, "HOOK"],
];
const LABEL_COLOR = { JAB: "#60A5FA", CROSS: "#FF3B30", HOOK: "#F5C451", UPPERCUT: "#A78BFA" };
// Bones (Mixamo names, sanitized) for the tracking overlay.
const SKELETON = [
  ["LeftArm", "LeftForeArm"], ["LeftForeArm", "LeftHand"], ["RightArm", "RightForeArm"], ["RightForeArm", "RightHand"],
  ["LeftArm", "RightArm"], ["LeftUpLeg", "RightUpLeg"], ["LeftArm", "LeftUpLeg"], ["RightArm", "RightUpLeg"],
  ["LeftUpLeg", "LeftLeg"], ["LeftLeg", "LeftFoot"], ["RightUpLeg", "RightLeg"], ["RightLeg", "RightFoot"],
];

function shouldLoad() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  const c = navigator.connection;
  if (c?.saveData || /(^|-)2g$/.test(c?.effectiveType || "")) return false;
  if (navigator.deviceMemory && navigator.deviceMemory < 2) return false;
  return true;
}

export default function HeroBoxer3D({ labels, onReady }) {
  const wrapRef = useRef(null);
  const glRef = useRef(null);
  const fxRef = useRef(null);
  const [hud, setHud] = useState({ label: null, count: 0, score: 0.62 });

  useEffect(() => {
    if (!shouldLoad()) return;
    let disposed = false, cleanup = () => {};
    const start = async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const url = MODELS[Math.floor(Math.random() * MODELS.length)];
      const [gltf, anims] = await Promise.all([
        new GLTFLoader().loadAsync(url),
        fetch(ANIMS_URL).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      const wrap = wrapRef.current, glCanvas = glRef.current, fx = fxRef.current;
      if (disposed || !wrap || !glCanvas || !fx) return;

      const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: true });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 2 / 3, 0.05, 30);
      scene.add(new THREE.HemisphereLight(0xdfe7ff, 0x1a1012, 1.1));
      const key = new THREE.DirectionalLight(0xfff3e6, 2.4); key.position.set(1.5, 3, 2.5); scene.add(key);
      const rim = new THREE.DirectionalLight(0xff3b30, 3); rim.position.set(-2, 1.6, -2.5); scene.add(rim);

      const model = gltf.scene;
      model.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; if (o.material) { o.material.roughness = Math.max(o.material.roughness ?? 0.7, 0.6); o.material.metalness = 0; } } });
      scene.add(model);
      const bone = (n) => { let b = null; model.traverse((o) => { if (!b && o.isBone && o.name.replace(/[^a-z0-9]/gi, "").endsWith(n)) b = o; }); return b; };
      const bones = Object.fromEntries([...new Set(SKELETON.flat()), "Head"].map((n) => [n, bone(n)]));

      // Sequence of { clip, events: [{ t, label }] }. Prefer the Mixamo mocap set;
      // fall back to the in-place punch clips that ship inside the model.
      let order = [];
      const hips = bone("Hips");
      if (anims?.clips?.length && hips) {
        const rest = hips.position.clone();
        const k = rest.y / 1.0427; // source rig (Mixamo Y Bot) hips height → this model
        const byName = {};
        for (const c of anims.clips) {
          const clip = THREE.AnimationClip.parse({
            name: c.name, duration: c.duration,
            tracks: c.tracks.map((t) => (/Hips\.position$/.test(t.name)
              ? { ...t, values: t.values.map((v, i) => (i % 3 === 0 ? rest.x : i % 3 === 1 ? rest.y + v * k : rest.z)) }
              : t)),
          });
          byName[c.name] = { clip, events: c.events || [] };
        }
        order = ANIM_ORDER.map((n) => byName[n]).filter(Boolean);
      }
      if (!order.length) {
        const own = gltf.animations
          .map((c) => ({ clip: c, label: CLIP_LABEL.find(([re]) => re.test(c.name))?.[1] }))
          .filter((c) => c.label && !/knee|step|practice|warmup/i.test(c.clip.name));
        for (const { clip } of own) {
          for (const tr of clip.tracks) {
            if (!/Hips\.position$/.test(tr.name)) continue;
            for (let i = 0; i < tr.values.length; i += 3) { tr.values[i] = tr.values[0]; tr.values[i + 2] = tr.values[2]; }
          }
        }
        const ev = (c) => ({ clip: c.clip, events: [{ t: c.clip.duration * 0.38, label: c.label }] });
        order = [...own.filter((c) => c.label === "JAB"), ...own.filter((c) => c.label === "JAB"), ...own.filter((c) => c.label !== "JAB")].map(ev);
      }
      if (!order.length) return;
      // Own clip copy per slot: a repeated clip must not share one action, or
      // cross-fading it into itself leaves the fighter in the bind (T) pose.
      order = order.map((o, i) => { const clip = o.clip.clone(); clip.name = `${clip.name}#${i}`; return { ...o, clip }; });
      const mixer = new THREE.AnimationMixer(model);
      let idx = 0, action = null, clipStart = 0, count = 0, nextEv = 0, hideAt = 0;
      const play = (now) => {
        const next = mixer.clipAction(order[idx % order.length].clip);
        next.reset();
        next.setLoop(THREE.LoopRepeat, Infinity);   // never "finishes" mid-fade
        next.enabled = true;
        next.setEffectiveWeight(1);
        next.play();
        if (action && action !== next) action.crossFadeTo(next, FADE_S, false);
        action = next;
        clipStart = now;
        nextEv = 0;
      };

      const fit = () => {
        const w = wrap.clientWidth, h = wrap.clientHeight;
        renderer.setSize(w, h, false);
        fx.width = w * dpr; fx.height = h * dpr;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      fit();
      const ro = new ResizeObserver(fit); ro.observe(wrap);

      const ctx = fx.getContext("2d");
      const v = new THREE.Vector3();
      const toScreen = (b) => { b.getWorldPosition(v).project(camera); return [(v.x * 0.5 + 0.5) * fx.width, (-v.y * 0.5 + 0.5) * fx.height]; };
      const drawSkeleton = () => {
        ctx.clearRect(0, 0, fx.width, fx.height);
        ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 1.6 * dpr;
        ctx.shadowColor = "rgba(255,59,48,0.9)";
        ctx.shadowBlur = 6 * dpr;
        for (const [a, b] of SKELETON) {
          if (!bones[a] || !bones[b]) continue;
          const [x1, y1] = toScreen(bones[a]), [x2, y2] = toScreen(bones[b]);
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
        ctx.fillStyle = "#FF3B30";
        for (const n of new Set(SKELETON.flat())) {
          if (!bones[n]) continue;
          const [x, y] = toScreen(bones[n]);
          ctx.beginPath(); ctx.arc(x, y, 2.6 * dpr, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
      };

      let raf = 0, visible = true, last = performance.now();
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
      io.observe(wrap);
      const loop = (now) => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (!visible || document.hidden) return;
        if (!action) play(now);
        mixer.update(dt);
        const cur = order[idx % order.length];
        const tIn = (now - clipStart) / 1000;
        // Each punch moment: label + counter + score tick, like the live round.
        const ev = cur.events[nextEv];
        if (ev && tIn >= ev.t) {
          nextEv += 1;
          count += 1;
          hideAt = now + 450;
          setHud((h) => ({ label: ev.label, count, score: Math.min(0.95, h.score + 0.025) }));
        }
        if (hideAt && now > hideAt) { hideAt = 0; setHud((h) => (h.label ? { ...h, label: null } : h)); }
        // Start the next clip while this one is still moving, so the fade blends two poses.
        if (tIn >= cur.clip.duration - FADE_S) { idx += 1; play(now); }
        // Slow orbit around the fighter.
        // The boxing stance turns the body ~60°: orbit in front of the chest, not the side.
        const ang = -0.35 + Math.sin(now / 4200) * 0.3;
        camera.position.set(Math.sin(ang) * 4.1, 1.3, Math.cos(ang) * 4.1);
        camera.lookAt(0, 0.92, 0);
        renderer.render(scene, camera);
        drawSkeleton();
      };
      raf = requestAnimationFrame(loop);
      onReady?.();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect(); io.disconnect();
        mixer.stopAllAction();
        scene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { x.map?.dispose?.(); x.dispose?.(); }); });
        renderer.dispose();
      };
    };

    // After first paint, when the browser is idle.
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
    const cancelIdle = window.cancelIdleCallback || clearTimeout;
    const handle = idle(() => { start().catch(() => { /* keep the SVG preview */ }); });
    return () => { disposed = true; cancelIdle(handle); cleanup(); };
  }, [onReady]);

  return (
    <div ref={wrapRef} style={{ position: "absolute", inset: 10, borderRadius: 26, overflow: "hidden", background: "radial-gradient(ellipse 80% 60% at 50% 35%, rgba(255,59,48,0.22), transparent 70%), #0b0b0d" }} aria-hidden="true">
      <canvas ref={glRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <canvas ref={fxRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {/* HUD — same language as the live round */}
      <div style={{ position: "absolute", top: 12, left: 14, right: 14, display: "flex", justifyContent: "space-between", font: "600 10px var(--stack-mono)", letterSpacing: "0.08em", color: "rgba(255,255,255,0.75)" }}>
        <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#FF3B30", marginRight: 6, boxShadow: "0 0 8px #FF3B30" }} />REC</span>
        <span>{labels.round}</span>
      </div>
      {hud.label && (
        <div key={hud.count} style={{ position: "absolute", top: 38, left: "50%", transform: "translateX(-50%)", padding: "4px 12px", borderRadius: 999, background: LABEL_COLOR[hud.label], color: hud.label === "HOOK" ? "#1a1405" : "#fff", font: "700 12px var(--stack-sans)", letterSpacing: "0.1em", animation: "lpPop 220ms ease-out" }}>
          {hud.label}
        </div>
      )}
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, color: "#fff" }}>
          <span style={{ font: "700 26px var(--font-display)" }}>{hud.count}<span style={{ font: "600 11px var(--stack-sans)", color: "rgba(255,255,255,0.6)", marginLeft: 6 }}>{labels.punches}</span></span>
          <span style={{ font: "600 10px var(--stack-mono)", letterSpacing: "0.08em", color: "rgba(255,255,255,0.7)" }}>{labels.score}</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.round(hud.score * 100)}%`, background: "linear-gradient(90deg,#FF3B30,#F5C451)", transition: "width 0.4s ease" }} />
        </div>
      </div>
      <style>{"@keyframes lpPop{from{transform:translateX(-50%) scale(.7);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}"}</style>
    </div>
  );
}

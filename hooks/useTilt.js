"use client";

import { useEffect, useRef } from "react";

/**
 * useTilt — premium 3D tilt interaction for a card.
 *
 * Follows mouse (desktop), touch-drag (mobile), and device gyroscope.
 * When idle, drifts gently on its own. Fully disabled under
 * prefers-reduced-motion. Writes transform directly to the DOM node
 * (no per-frame React re-render) for 60fps smoothness.
 *
 * Usage:
 *   const tiltRef = useTilt();
 *   <div ref={tiltRef} style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
 *
 * @param {{ max?: number, perspective?: number, idleAmp?: number, idleMs?: number }} opts
 * @returns React ref to attach to the tilting element.
 */
export default function useTilt({ max = 9, perspective = 900, idleAmp = 0.42, idleMs = 5000 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let targetRx = 0, targetRy = 0;   // desired rotation
    let curRx = 0, curRy = 0;         // eased current rotation
    let interacting = false;
    let idleT = Math.random() * 10;   // phase offset so cards don't sync
    let raf = 0;
    let idleTimer = null;

    const setTransform = () => {
      el.style.transform =
        `perspective(${perspective}px) rotateX(${curRx.toFixed(2)}deg) rotateY(${curRy.toFixed(2)}deg)`;
    };

    const loop = () => {
      if (!interacting) {
        idleT += 0.016;
        targetRy = Math.sin(idleT * 0.8) * max * idleAmp;
        targetRx = Math.cos(idleT * 0.6) * max * idleAmp * 0.6;
      }
      curRx += (targetRx - curRx) * 0.08;
      curRy += (targetRy - curRy) * 0.08;
      setTransform();
      raf = requestAnimationFrame(loop);
    };

    const fromPoint = (clientX, clientY) => {
      const r = el.getBoundingClientRect();
      const px = (clientX - r.left) / r.width;
      const py = (clientY - r.top) / r.height;
      targetRy = (px - 0.5) * 2 * max;
      targetRx = -(py - 0.5) * 2 * max;
      interacting = true;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { interacting = false; }, idleMs);
    };

    const onMouseMove = (e) => fromPoint(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      const tch = e.touches?.[0];
      if (tch) fromPoint(tch.clientX, tch.clientY);
    };
    const onLeave = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { interacting = false; }, 600);
    };

    const clamp = (v) => Math.max(-max, Math.min(max, v));
    const onOrient = (e) => {
      if (e.beta == null || e.gamma == null) return;
      interacting = true;
      clearTimeout(idleTimer);
      targetRy = clamp((e.gamma / 45) * max);         // left-right tilt
      targetRx = clamp((-(e.beta - 40) / 45) * max);  // front-back tilt (40° neutral hold)
      idleTimer = setTimeout(() => { interacting = false; }, idleMs);
    };

    // iOS 13+ needs an explicit permission request from a user gesture
    const requestGyro = () => {
      if (typeof DeviceOrientationEvent !== "undefined" &&
          typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission().catch(() => {});
      }
    };

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onLeave);
    el.addEventListener("touchstart", requestGyro, { once: true });
    window.addEventListener("deviceorientation", onOrient);

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idleTimer);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onLeave);
      el.removeEventListener("touchstart", requestGyro);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [max, perspective, idleAmp, idleMs]);

  return ref;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import HeroBoxer3D from "@/components/landing/HeroBoxer3D";

// Landing hero: a phone showing what a GAVANA round looks like — a tracked
// skeleton throwing a jab–cross, the punch labels the detector produces, and a
// score. Pure SVG (SMIL), no video or images. Respects prefers-reduced-motion
// by freezing on the jab.

const LOOP = "2.6s";
const KT = "0;0.1;0.2;0.32;1";            // keyTimes for the jab arm
const KT2 = "0;0.4;0.5;0.62;1";           // keyTimes for the cross arm

// Points: shoulder → elbow → wrist (viewBox 0 0 200 300). Fighter faces the camera.
const JAB_GUARD = "72,104 74,140 87,96";
const JAB_OUT = "72,104 52,86 30,66";
const CROSS_GUARD = "128,104 126,140 113,96";
const CROSS_OUT = "128,104 100,90 70,74";

const pts = (a, b) => `${a};${a};${b};${a};${a}`;
const wrist = (p) => p.split(" ")[2].split(",").map(Number);
const SPLINES = "0 0 1 1;0.2 0.8 0.3 1;0.5 0 0.5 1;0 0 1 1";

/** Glove that follows the wrist of an arm animated between `guard` and `out`. */
function Glove({ guard, out, kt, fill }) {
  const [gx, gy] = wrist(guard), [ox, oy] = wrist(out);
  return (
    <circle cx={gx} cy={gy} r="7.5" fill={fill} stroke="#0b0b0d" strokeWidth="2">
      <animate attributeName="cx" dur={LOOP} repeatCount="indefinite" keyTimes={kt} values={pts(gx, ox)} calcMode="spline" keySplines={SPLINES} />
      <animate attributeName="cy" dur={LOOP} repeatCount="indefinite" keyTimes={kt} values={pts(gy, oy)} calcMode="spline" keySplines={SPLINES} />
    </circle>
  );
}

export default function HeroPreview({ labels }) {
  const svgRef = useRef(null);
  // The SVG plays first; the 3D boxer fades in on top once it has loaded.
  const [ready3d, setReady3d] = useState(false);
  const onReady = useCallback(() => setReady3d(true), []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (mq.matches) { svg.pauseAnimations?.(); svg.setCurrentTime?.(0.52); }
      else svg.unpauseAnimations?.();
    };
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  return (
    <div className="lp-phone" aria-hidden="true">
      <div className="lp-phone-notch" />
      <svg ref={svgRef} viewBox="0 0 200 300" className="lp-svg" role="presentation" style={{ opacity: ready3d ? 0 : 1, transition: "opacity 0.6s ease" }}>
        <defs>
          <radialGradient id="lpGlow" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,59,48,0.22)" />
            <stop offset="100%" stopColor="rgba(255,59,48,0)" />
          </radialGradient>
          <linearGradient id="lpScore" x1="0" x2="1">
            <stop offset="0%" stopColor="#FF3B30" />
            <stop offset="100%" stopColor="#F5C451" />
          </linearGradient>
        </defs>
        <rect width="200" height="300" fill="#0b0b0d" />
        <rect width="200" height="300" fill="url(#lpGlow)" />
        {/* floor grid */}
        {[230, 248, 270, 296].map((y, i) => (
          <line key={y} x1="0" x2="200" y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={0.6 + i * 0.2} />
        ))}

        {/* HUD: rec + timer */}
        <circle cx="16" cy="18" r="3.2" fill="#FF3B30">
          <animate attributeName="opacity" values="1;0.25;1" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <text x="24" y="21" className="lp-hud">REC · 00:42</text>
        <text x="184" y="21" textAnchor="end" className="lp-hud">{labels.round}</text>

        {/* tracking corners */}
        <path d="M34 40 v-10 h10 M166 40 v-10 h-10 M34 272 v10 h10 M166 272 v10 h-10" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" fill="none" />

        {/* head first, so a cross crossing the face is drawn in front of it */}
        <circle cx="100" cy="70" r="13" fill="#0b0b0d" stroke="rgba(255,255,255,0.85)" strokeWidth="4" />

        {/* skeleton */}
        <g stroke="rgba(255,255,255,0.85)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* torso + legs */}
          <polyline points="72,104 128,104" />
          <polyline points="72,104 84,176 116,176 128,104" />
          <polyline points="84,176 74,224 64,270" />
          <polyline points="116,176 128,222 140,270" />
          {/* jab arm (fighter's right, image left) */}
          <polyline points={JAB_GUARD}>
            <animate attributeName="points" dur={LOOP} repeatCount="indefinite" keyTimes={KT} values={pts(JAB_GUARD, JAB_OUT)} calcMode="spline" keySplines={SPLINES} />
          </polyline>
          {/* cross arm (fighter's left, image right) */}
          <polyline points={CROSS_GUARD}>
            <animate attributeName="points" dur={LOOP} repeatCount="indefinite" keyTimes={KT2} values={pts(CROSS_GUARD, CROSS_OUT)} calcMode="spline" keySplines={SPLINES} />
          </polyline>
        </g>
        <Glove guard={JAB_GUARD} out={JAB_OUT} kt={KT} fill="#FF3B30" />
        <Glove guard={CROSS_GUARD} out={CROSS_OUT} kt={KT2} fill="#F5C451" />
        {/* keypoints */}
        {[[72, 104], [128, 104], [84, 176], [116, 176], [74, 224], [128, 222], [64, 270], [140, 270]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3.4" fill="#FF3B30" />
        ))}

        {/* impact flashes at full extension */}
        <circle cx="30" cy="66" r="4" fill="none" stroke="#FF3B30" strokeWidth="2" opacity="0">
          <animate attributeName="r" dur={LOOP} repeatCount="indefinite" keyTimes="0;0.2;0.32;1" values="4;4;20;20" />
          <animate attributeName="opacity" dur={LOOP} repeatCount="indefinite" keyTimes="0;0.19;0.2;0.32;1" values="0;0;1;0;0" />
        </circle>
        <circle cx="70" cy="74" r="4" fill="none" stroke="#F5C451" strokeWidth="2" opacity="0">
          <animate attributeName="r" dur={LOOP} repeatCount="indefinite" keyTimes="0;0.5;0.62;1" values="4;4;20;20" />
          <animate attributeName="opacity" dur={LOOP} repeatCount="indefinite" keyTimes="0;0.49;0.5;0.62;1" values="0;0;1;0;0" />
        </circle>

        {/* punch labels */}
        <g opacity="0">
          <animate attributeName="opacity" dur={LOOP} repeatCount="indefinite" keyTimes="0;0.17;0.2;0.4;0.43;1" values="0;0;1;1;0;0" />
          <rect x="14" y="40" width="48" height="18" rx="9" fill="#FF3B30" />
          <text x="38" y="52.5" textAnchor="middle" className="lp-pill">JAB</text>
        </g>
        <g opacity="0">
          <animate attributeName="opacity" dur={LOOP} repeatCount="indefinite" keyTimes="0;0.47;0.5;0.64;0.67;1" values="0;0;1;1;0;0" />
          <rect x="128" y="40" width="58" height="18" rx="9" fill="#F5C451" />
          <text x="157" y="52.5" textAnchor="middle" className="lp-pill lp-pill-dark">CROSS</text>
        </g>
        <g opacity="0">
          <animate attributeName="opacity" dur={LOOP} repeatCount="indefinite" keyTimes="0;0.7;0.74;0.94;0.98;1" values="0;0;1;1;0;0" />
          <rect x="60" y="40" width="80" height="18" rx="9" fill="rgba(245,196,81,0.14)" stroke="#F5C451" strokeWidth="1" />
          <text x="100" y="52.5" textAnchor="middle" className="lp-combo">{labels.combo}</text>
        </g>

        {/* bottom HUD: score bar */}
        <rect x="16" y="282" width="168" height="5" rx="2.5" fill="rgba(255,255,255,0.08)" />
        <rect x="16" y="282" width="10" height="5" rx="2.5" fill="url(#lpScore)">
          <animate attributeName="width" dur={LOOP} repeatCount="indefinite" keyTimes="0;0.2;0.5;0.95;1" values="96;112;138;138;96" />
        </rect>
        <text x="16" y="276" className="lp-hud">{labels.score}</text>
      </svg>
      <div style={{ opacity: ready3d ? 1 : 0, transition: "opacity 0.6s ease" }}>
        <HeroBoxer3D labels={labels} onReady={onReady} />
      </div>
    </div>
  );
}

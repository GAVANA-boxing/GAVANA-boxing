"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// GAVANA cinematic intro: the Blender-rendered 3D video (tools/blender/intro.py)
// plays muted on its own; "Play with sound" restarts it with the synthesized
// soundtrack (lib/intro/introAudio.js) in sync. "BOXING" and the tagline are
// drawn here, over the video, so they're crisp and in the visitor's language.

const LOGO_T = 7.22;
const SRC = { mp4: "/intro/gavana-intro.mp4", webm: "/intro/gavana-intro.webm", poster: "/intro/gavana-intro-poster.jpg" };

export default function CinematicIntro({ labels }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);   // the lazily-loaded audio module
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [withSound, setWithSound] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const rm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setReduced(!!rm);
    const v = videoRef.current;
    if (!v || rm) return;
    // Silent autoplay once it scrolls into view (browsers allow muted autoplay).
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && v.paused && !v.ended && v.currentTime === 0) v.play().catch(() => {});
    }, { threshold: 0.5 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  // Video time drives the overlay (rAF while playing).
  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    const tick = () => { setT(videoRef.current?.currentTime || 0); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  useEffect(() => () => { audioRef.current?.stopIntroSound(); }, []);

  const playWithSound = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    const audio = audioRef.current || (audioRef.current = await import("@/lib/intro/introAudio"));
    v.pause();
    v.currentTime = 0;
    setEnded(false);
    audio.setIntroMuted(false);
    setMuted(false);
    // Start the picture first; schedule the sound for the same moment.
    try { await v.play(); } catch { return; }
    audio.playIntroSound(0.02);
    setWithSound(true);
  }, []);

  const togglePause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); audioRef.current?.resumeIntroSound(); }
    else { v.pause(); audioRef.current?.pauseIntroSound(); }
  };

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    audioRef.current?.setIntroMuted(m);
  };

  const lock = t >= LOGO_T;
  const letterIn = (i) => Math.max(0, Math.min(1, (t - 7.28 - i * 0.05) / 0.4));
  const tagIn = Math.max(0, Math.min(1, (t - 7.62) / 0.5));
  const lineIn = Math.max(0, Math.min(1, (t - LOGO_T) / 0.55));
  const showOverlay = lock || ended || reduced;

  return (
    <section aria-label={labels.region} style={{ position: "relative", maxWidth: 1100, margin: "8px auto 0", padding: "0 16px" }}>
      <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", background: "#050506", aspectRatio: "16 / 9", boxShadow: "0 30px 80px rgba(0,0,0,0.55)" }}>
        <video
          ref={videoRef}
          muted
          playsInline
          preload="metadata"
          poster={SRC.poster}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setEnded(true); setT(8.4); }}
          aria-label={labels.video}
          style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
        >
          <source src={SRC.webm} type="video/webm" />
          <source src={SRC.mp4} type="video/mp4" />
        </video>

        {/* Lockup: "BOXING" between two crimson lines, then the tagline. */}
        <div aria-hidden={!showOverlay} style={{ position: "absolute", left: 0, right: 0, bottom: "9%", display: "grid", justifyItems: "center", gap: 8, pointerEvents: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ height: 2, width: `${(showOverlay ? 1 : lineIn) * 70}px`, background: "linear-gradient(270deg, rgba(222,26,48,0.95), rgba(222,26,48,0))" }} />
            <span style={{ display: "flex", gap: "0.4em", fontWeight: 700, fontSize: "clamp(18px, 3.4vw, 34px)", letterSpacing: "0.12em", color: "#eceef1" }}>
              {"BOXING".split("").map((ch, i) => {
                const a = showOverlay && !lock ? 1 : letterIn(i);
                return <span key={i} style={{ opacity: a, transform: `translateY(${(1 - a) * 9}px)` }}>{ch}</span>;
              })}
            </span>
            <span style={{ height: 2, width: `${(showOverlay ? 1 : lineIn) * 70}px`, background: "linear-gradient(90deg, rgba(222,26,48,0.95), rgba(222,26,48,0))" }} />
          </div>
          <div style={{ opacity: showOverlay && !lock ? 1 : tagIn, fontSize: "clamp(11px, 1.5vw, 14px)", letterSpacing: "0.3em", color: "rgba(236,237,241,0.72)", fontWeight: 600, textAlign: "center", padding: "0 12px" }}>
            {labels.tagline}
          </div>
        </div>

        {/* Controls */}
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
          {withSound && !ended && (
            <>
              <button type="button" onClick={togglePause} aria-label={playing ? labels.pause : labels.play} style={btn}>{playing ? "❚❚" : "▶"}</button>
              <button type="button" onClick={toggleMute} aria-label={muted ? labels.unmute : labels.mute} style={btn}>{muted ? "🔇" : "🔊"}</button>
            </>
          )}
        </div>
        {(!withSound || ended) && (
          <button type="button" onClick={playWithSound} style={{ ...btn, position: "absolute", left: 12, bottom: 12, width: "auto", padding: "0 14px", gap: 8, display: "inline-flex", alignItems: "center", fontSize: 13, fontWeight: 700 }}>
            <span aria-hidden="true">{ended ? "↻" : "🔊"}</span>{ended ? labels.replay : labels.withSound}
          </button>
        )}
      </div>
    </section>
  );
}

const btn = {
  minWidth: 40, height: 40, borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(10,10,12,0.6)", color: "#fff", cursor: "pointer", fontFamily: "inherit",
  backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
};

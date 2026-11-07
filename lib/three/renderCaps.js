// What the device can draw, and how hard the 3D scenes should push it.
//
// WebGPU is detected (navigator.gpu + an adapter) and reported, but the scenes
// still render with WebGL2: our custom GLSL shaders (sky, water, the bag's
// impact ripple) are GLSL ShaderMaterials, which three's WebGPU renderer does
// not run, and iPhones only got WebGPU in iOS 26. A WebGPU-capable device is
// treated as a strong GPU when choosing the quality tier.

/** Browser probe (client only). */
export async function detectRenderCaps() {
  if (typeof window === "undefined") return { webgpu: false, webgl2: false };
  let webgpu = false;
  try {
    if (navigator.gpu) webgpu = !!(await navigator.gpu.requestAdapter());
  } catch { webgpu = false; }
  let webgl2 = false;
  try { webgl2 = !!document.createElement("canvas").getContext("webgl2"); } catch { webgl2 = false; }
  return {
    webgpu,
    webgl2,
    cores: navigator.hardwareConcurrency || 4,
    memoryGb: navigator.deviceMemory || 4,
    dpr: window.devicePixelRatio || 1,
    mobile: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || ""),
    reducedMotion: !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  };
}

/**
 * Pure: settings for a capability report.
 * high   — WebGPU-class or a strong desktop: full pixel ratio, 2k shadows, all particles
 * medium — typical phone: pixel ratio ≤ 2, 1k shadows, 60 % particles
 * low    — no WebGL2 / ≤ 2 GB / ≤ 4 cores on mobile: pixel ratio 1, no shadows, 25 % particles
 */
export function qualityFor(caps = {}) {
  const { webgpu, webgl2 = true, cores = 4, memoryGb = 4, dpr = 1, mobile = false, reducedMotion = false } = caps;
  let tier = "medium";
  if (!webgl2 || memoryGb <= 2 || (mobile && cores <= 4)) tier = "low";
  else if (webgpu || (!mobile && cores >= 8 && memoryGb >= 8)) tier = "high";
  const table = {
    high: { pixelRatio: Math.min(dpr, 2.5), shadows: true, shadowMapSize: 2048, particles: 1, antialias: true },
    medium: { pixelRatio: Math.min(dpr, 2), shadows: true, shadowMapSize: 1024, particles: 0.6, antialias: true },
    low: { pixelRatio: 1, shadows: false, shadowMapSize: 512, particles: 0.25, antialias: false },
  };
  return { tier, ...table[tier], motion: !reducedMotion, webgpu: !!webgpu };
}

#!/usr/bin/env node
/**
 * Copies @mediapipe/tasks-vision runtime files to public/mediapipe/
 * so they can be served as local static assets — no CDN dependency.
 *
 * Runs automatically via postinstall (npm install) and prebuild (next build).
 * Files are .gitignored; this script regenerates them on every install.
 */
const { copyFileSync, mkdirSync, existsSync } = require("fs");
const { join } = require("path");

const ROOT = join(__dirname, "..");
const SRC  = join(ROOT, "node_modules", "@mediapipe", "tasks-vision");
const DST  = join(ROOT, "public", "mediapipe");

if (!existsSync(SRC)) {
  console.warn("[mediapipe] node_modules/@mediapipe/tasks-vision not found — skipping copy");
  process.exit(0);
}

mkdirSync(join(DST, "wasm"), { recursive: true });

const FILES = [
  { from: "vision_bundle.mjs",                      to: "vision_bundle.mjs" },
  { from: join("wasm", "vision_wasm_internal.js"),   to: join("wasm", "vision_wasm_internal.js") },
  { from: join("wasm", "vision_wasm_internal.wasm"), to: join("wasm", "vision_wasm_internal.wasm") },
  { from: join("wasm", "vision_wasm_nosimd_internal.js"),   to: join("wasm", "vision_wasm_nosimd_internal.js") },
  { from: join("wasm", "vision_wasm_nosimd_internal.wasm"), to: join("wasm", "vision_wasm_nosimd_internal.wasm") },
];

for (const { from, to } of FILES) {
  const src = join(SRC, from);
  const dst = join(DST, to);
  if (!existsSync(src)) {
    console.warn(`[mediapipe] missing: ${src}`);
    continue;
  }
  copyFileSync(src, dst);
}

console.log("[mediapipe] runtime files copied to public/mediapipe/");

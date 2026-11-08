# GAVANA Boxing

AI boxing training with your phone camera. Prop the phone up, box a round, and GAVANA counts every
punch (jab / cross / hook), reads your guard and rhythm, scores the round and tells you the one thing
to fix next. Camera analysis runs on the device (MediaPipe); the video is not uploaded.
Interface in Mongolian, Korean and English.

**Core loop:** Train → Score → AI feedback → Progress. Other areas of the codebase (feed, reels,
gyms, sparring, …) are hidden while `NEXT_PUBLIC_CORE_MODE` is on (the default) — see
`lib/coreRoutes.js`.

## Stack

Next.js (App Router) · React 19 · Firebase (Auth, Firestore, Storage, Cloud Functions) ·
MediaPipe Tasks Vision · three.js / React Three Fiber · OpenAI (AI coach) · Stripe (GAVANA Pro) ·
Vercel.

## Run it

```bash
npm ci          # also copies the MediaPipe files into public/mediapipe
cp .env.example .env.local   # fill in Firebase (and optional OpenAI / Stripe) keys
npm run dev
```

## Checks

```bash
npm test                 # unit tests (Vitest)
npm run test:visual      # screenshots + 3D playtests (Playwright)
npm run test:rules       # Firestore + Storage security rules on the emulators
npm run evolve:check -- --task "…" [--visual] [--rules]   # the full gate used for every change
```

## Where things are

- `app/[locale]/` — pages (`train`, `progress`, `coach`, `pro`, …); `app/api/` — server routes
- `hooks/usePoseDetection.js`, `lib/punchPhaseDetector.js` — camera → punches
- `lib/domain/` — server-authoritative XP / progression; `lib/pro.js` — GAVANA Pro plan and perks
- `lib/archetypes.js` — the fighting styles; `lib/site.js` — the public address
- `firestore.rules`, `storage.rules` — security rules (tests in `scripts/rules-test/`)
- `docs/` — engineering rules, backlog, known issues, changelog, audit

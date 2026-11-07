# AI engineering rules — GAVANA Boxing

Read this (and CLAUDE.md) before every change. Keep it short and current.

## Stack and shape
- Next.js 16 App Router (`app/[locale]/…`, locales mn / ko / en), React 19, Firebase Auth + Firestore,
  Vercel. Tests: Vitest (`tests/*.test.*`), visual regression with Playwright (`tests/visual`).
- `CORE_MODE` (`lib/coreRoutes.js`) hides everything outside Train → Score → Progress
  (feed, reels, gyms, sparring, …); `proxy.js` redirects those routes. Don't polish hidden routes.
- One XP number (`getAccountXp`, server-written sources only) and one rank ladder (`lib/xp.js`).
- Score / XP are written by `/api/score/session` (anti-cheat in `lib/domain/scoreGuard.js`).

## Protected — do not change without the owner's explicit OK
- `lib/punchPhaseDetector.js` (punch detection / lead hook / uppercut) — paused.
- `firestore.rules`, auth, XP / rank math, the training-session data model, push sending.
  (If rules change: run `scripts/rules-test` on the emulator.)

## Design system
- `components/ui/brand.js`: BRAND, btnPrimary, btnSecondary, glass, glassCard, pageBackground,
  displayTitle, kickerPill, kickerDot, sectionLabel. Shared: BrandHeader, PromptBanner, ErrorScreen.
- Text ≥ 11 px; text colour on the dark background ≥ 4.5:1 (BRAND.faint = white 50 % = 5.3:1);
  tap targets ≥ 40 px; no horizontal overflow at 360 px; every string in MN / KO / EN (`loc()`).
- `html, body { overflow-x: clip }` — never `hidden` (it silently breaks every `position: sticky`).
- Error boundaries read the locale from `usePathname()` (reading `document` causes hydration errors).

## Every change
1. `npm run lint` (0 errors) → `npm test` → `npx next build`.
2. UI change → `npm run test:visual`. If a screenshot diff is an intended change, look at it, then
   `npm run test:visual:update` and commit the new baselines in the same commit.
3. Never commit `app/[locale]/zz-eval/`, `public/zz-eval/`, `test-results/`, secrets, personal
   recordings or model IDs.

## Automation (15-minute cycles)
- A cycle does not have to commit. If nothing worth fixing is found, a fix needs approval, or a
  test fails and can't be fixed safely: change nothing, report, and note it in AI_KNOWN_ISSUES.md.
- One problem per cycle, smallest change, at most two fix attempts.

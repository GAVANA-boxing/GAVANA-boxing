# Phase 17 — UX Simplification & Premium Polish

## Summary

11 targeted UX/UI improvements. No features removed. No Firestore schema changes.

---

## Changes

### 1. Onboarding Intro Screen
**File:** `app/[locale]/onboarding/page.js`, `hooks/useOnboardingActions.js`

Shows a value-prop screen before profile-building steps. Four cards (Train / Learn / Sparring / Watch) let the user pick their primary interest. Tapping a card saves `primaryInterest` to Firestore and localStorage, then proceeds to the main flow.

---

### 2. Feed Caption Fix — `[more]` Hint
**File:** `components/reels/reelInfoStyles.js`, `components/reels/ReelItem.js`

- Fixed `display: "block"` → `display: "-webkit-box"` so `WebkitLineClamp: 2` actually truncates long captions (previously silently disabled).
- Added `[more]` tap hint for captions longer than 60 characters.
- Added `captionMore` locale key to all 3 locales (en/mn/ko).

---

### 3. Academy Content Compression
**File:** `components/knowledge/AcademyLessonCard.js`

Three lesson sections now collapsed by default:
- **What You Should Feel** — collapsed, gold accent
- **Common Mistake** — collapsed, red accent
- **Coach Cue** — collapsed, gold accent

Reduces scroll fatigue on the lesson detail view.

---

### 4. AI Analysis GOOD/FIX/NEXT Block
**File:** `components/train/TrainResultModal.js`

New `ActionSummary` component renders a 3-row card above the detailed `CoachReviewCard`:
- **GOOD ✓** — top strength from AI review
- **FIX ✗** — top fix from AI review
- **NEXT →** — recommended drill

Only renders when pose data is available and enough punches were detected.

---

### 5. Upload Loading Stages
**File:** `app/[locale]/upload/page.js`

Replaced single progress bar with 4-stage overlay:
1. Compressing video
2. Uploading video
3. Generating thumbnail
4. Publishing reel

Shows current stage highlighted, completed stages with gold checkmark, pending stages dimmed. Overall RED→GOLD gradient progress bar at bottom.

---

### 6. Sparring Empty State — Demo Fighters
**File:** `components/SparringPage.js`, `components/sparring/SparringCards.js`

When no real users are in the sparring pool (and no filter is active), shows 3 demo fighters (Pressure / Counter / Technical archetypes) with a "Demo Fighters" label. Demo fighters:
- Show "Demo" badge (top-right)
- Use neutral accent color (no rank glow)
- Show disabled CTA instead of request button

---

### 7. Localization — `captionMore` Key
**Files:** `lib/locales/en.js`, `lib/locales/mn.js`, `lib/locales/ko.js`

Added missing `captionMore` key: "more" / "дэлгэрэнгүй" / "더 보기"

---

### 8. Calm Combat Mode V2 — Blue → Gold
**Files:** `components/train/TrainResultModal.js`, `components/knowledge/AcademyLessonCard.js`

Replaced blue (`#93C5FD`, `rgba(96,165,250,...)`, `#60A5FA`) with gold (`GOLD`, `goldAlpha(...)`) in:
- Next Session Goal block in CoachReviewCard
- Tactical profile label chip
- Tactical cues block
- "Ask Coach" button in Academy lesson

---

### 9. Follow Button Visibility
**File:** `components/reels/ReelItem.js`

- Following state: gold color + gold background (was plain white)
- Not-following: slight white background for contrast
- Responder badge: changed from green (#34D399) to gold

---

### 10. Performance — Remove Dynamic `require()` in Render
**File:** `components/AthleteDashboard.js`

Moved `computeEarnedBadges` from `require()` inside a render IIFE to a top-level `import`. Eliminates re-evaluation of the module on every render of the dashboard.

---

### 11. Google Auth — Mobile Redirect Fix
**File:** `app/[locale]/login/page.js`, locale files

- Mobile browsers (iOS Safari, in-app browsers) now use `signInWithRedirect` instead of popup
- `getRedirectResult` called on mount to complete the redirect flow
- Desktop popup-blocked fallback also redirects instead of failing
- Added 4 locale keys: `loginErrPopupBlocked`, `loginErrUnauthorizedDomain`, `loginErrNetwork`, `loginErrTooMany`

---

## Changed Files

| File | Change |
|---|---|
| `app/[locale]/login/page.js` | Mobile redirect auth flow |
| `app/[locale]/onboarding/page.js` | Intro screen |
| `app/[locale]/upload/page.js` | Stage-based upload overlay |
| `components/AthleteDashboard.js` | Top-level import fix |
| `components/knowledge/AcademyLessonCard.js` | Collapsed sections, gold colors |
| `components/reels/ReelItem.js` | Caption [more] hint, gold follow button |
| `components/reels/reelInfoStyles.js` | WebkitLineClamp display fix |
| `components/SparringPage.js` | Demo fighters |
| `components/sparring/SparringCards.js` | isDemo prop + badge |
| `components/train/TrainResultModal.js` | ActionSummary block, gold colors |
| `hooks/useOnboardingActions.js` | showIntro + primaryInterest |
| `lib/locales/en.js` | captionMore + auth error keys |
| `lib/locales/mn.js` | captionMore + auth error keys |
| `lib/locales/ko.js` | captionMore + auth error keys |

## Build Status

✓ Compiled successfully — no new errors introduced.

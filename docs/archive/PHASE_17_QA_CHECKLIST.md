# Phase 17 QA Checklist

Test environment: Local dev (`npm run dev`) or Vercel preview.

---

## 1. Onboarding Intro Screen

- [ ] New user sees intro screen before any profile steps
- [ ] Four cards visible: Train / Learn / Sparring / Watch
- [ ] Tapping a card navigates to the normal onboarding flow (role/archetype steps)
- [ ] `primaryInterest` saved to Firestore after selection
- [ ] `gavana_primaryInterest` set in localStorage
- [ ] All 3 locales: card labels visible in mn/ko (not raw keys)
- [ ] Returning user (onboarding complete) skips intro entirely

---

## 2. Feed Caption Truncation

- [ ] Long captions (>2 lines) are truncated at 2 lines in the feed
- [ ] Short captions show fully (no `[more]` hint)
- [ ] Captions >60 chars show a tappable `[more]` / `дэлгэрэнгүй` / `더 보기` hint
- [ ] Tapping `[more]` opens the caption sheet
- [ ] `captionMore` key renders correctly in mn and ko (not raw key "captionMore")

---

## 3. Academy Lesson Sections

- [ ] Open any Academy lesson → `What You Should Feel`, `Common Mistake`, `Coach Cue` are collapsed by default
- [ ] Tapping any collapsed section expands it
- [ ] Re-tapping collapses it
- [ ] "Ask Coach" button uses gold color (not blue)
- [ ] Colors: Mistake = red, Coach Cue + Feel = gold

---

## 4. Train Result — GOOD/FIX/NEXT Block

- [ ] After a training session with sufficient data, a 3-row card appears above the main review
- [ ] Row 1: GOOD ✓ with green color and a strength description
- [ ] Row 2: FIX ✗ with red color and a fix description
- [ ] Row 3: NEXT → with gold color and a drill
- [ ] Block does NOT appear for sessions with too few punches (< threshold)
- [ ] Block does NOT appear if no pose metrics

---

## 5. Upload Loading Stages

- [ ] Upload a video → loading overlay shows 4 stages
- [ ] Current stage is highlighted (white text + gold step number)
- [ ] Completed stages show ✓ in gold
- [ ] Pending stages are dimmed
- [ ] Progress % shown next to active stage
- [ ] RED→GOLD gradient progress bar visible at bottom
- [ ] "Don't close the app" message visible
- [ ] All 3 locales: stage labels render correctly

---

## 6. Sparring Empty State

- [ ] Sparring page with no real users shows 3 demo fighters
- [ ] "Demo Fighters" / "Жишээ тулаанчид" / "데모 파이터" heading visible
- [ ] "Real users will appear here" message visible below heading
- [ ] Each demo card shows "Demo" / "Жишээ" / "데모" badge
- [ ] Demo card CTA is disabled (not a button)
- [ ] No rank glow on demo cards (neutral box-shadow)
- [ ] Activating a filter when no real users → shows "No fighters match this filter" instead of demo fighters

---

## 7. Locale Keys

- [ ] `captionMore` shows correctly in en/mn/ko (no raw key displayed)
- [ ] Google auth error messages show in the correct locale

---

## 8. Color Audit (Calm Combat Mode V2)

- [ ] Train result: "Next Session Goal" block uses gold accent (not blue)
- [ ] Train result: Tactical profile label chip uses gold (not blue)
- [ ] Train result: Tactical cues block uses gold border (not blue)
- [ ] Academy: "Ask Coach" button is gold (not blue)
- [ ] No new blue highlights introduced in Phase 17 components

---

## 9. Follow Button

- [ ] On a reel from an unfollowed user: Follow button has slight white background
- [ ] After tapping Follow: button turns gold with gold background
- [ ] Responder badge (if present): gold color (not green)

---

## 10. Performance

- [ ] `AthleteDashboard` loads without runtime error
- [ ] No console warnings about calling `require()` inside a component render

---

## 11. Google Auth

- [ ] On desktop: Google sign-in popup works
- [ ] On iOS Safari: sign-in redirects to Google (no popup)
- [ ] After redirect: lands back on login page, auto-completes sign-in
- [ ] Popup-blocked error: falls back to redirect, shows descriptive toast
- [ ] Error messages show in the correct locale (mn/ko)

---

## Regression Checks

- [ ] Feed loads normally (no stuck loading)
- [ ] Train camera works (starts, records, shows result)
- [ ] Academy lesson list and detail work
- [ ] Sparring discover tab works with real data
- [ ] Upload completes successfully
- [ ] No new console errors on any page
- [ ] Build: `npm run build` exits with no new errors

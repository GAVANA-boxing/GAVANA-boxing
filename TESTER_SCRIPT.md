# GAVANA MVP — Tester Script

**Version:** 0.1.0 MVP  
**Supported Languages:** English (`/en`), Mongolian (`/mn`), Korean (`/ko`)  
**Test URL:** Your deployment URL (e.g. `https://gavana.app/mn`)

---

## Before You Start

- Use a phone or tablet if possible (mobile-first app)
- Allow camera and microphone when prompted
- Use good lighting for the camera session
- Have a stable internet connection
- Log in with Apple or Google

---

## Flow 1 — Guest Train (No Login Required)

**Goal:** Confirm the AI assessment works without an account.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/mn` (or `/en`) | Landing page loads with GAVANA logo and TRAIN button |
| 2 | Tap **TRAIN** without logging in | Train page opens |
| 3 | Tap **Start AI Assessment** | Camera permission prompt appears |
| 4 | Allow camera | Camera feed appears, countdown begins |
| 5 | Shadow box for the session duration | AI detects punches, overlays appear |
| 6 | Session ends | Result modal appears with score, punch stats, and Fighter DNA |
| 7 | Tap the **Sign In to Save** CTA at the bottom | Login page opens |

**Screenshot to send:** Result modal showing score + punch breakdown

---

## Flow 2 — Logged-In Train → Save → Profile

**Goal:** Confirm sessions save and appear in profile/history.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in | Dashboard or Feed loads |
| 2 | Go to `/mn/train` | Train page loads |
| 3 | Start and complete a session | Result modal appears |
| 4 | Tap **Save Session** | Toast or confirmation appears |
| 5 | Go to `/mn/profile` | Profile page loads |
| 6 | Check **Fighter DNA** section | Shows style label and breakdown |
| 7 | Check **Combat Progress** | XP or rank progress updated |
| 8 | Go to `/mn/history` | Session appears in history list |

**Screenshot to send:** Profile page showing Fighter DNA + history entry

---

## Flow 3 — Train → Record → Share to Feed

**Goal:** Confirm video recording and posting to feed works.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/mn/train` | Train page loads |
| 2 | Enable the **Record Video** toggle before starting | Toggle turns on |
| 3 | Complete a session | Result modal appears with video preview |
| 4 | Tap **Share Video to Feed** | Caption sheet slides up |
| 5 | Type a caption | Text appears in input |
| 6 | Tap **Post** | Success confirmation |
| 7 | Go to `/mn/feed` | Your training video appears in feed |
| 8 | Tap the video | It plays |

**Screenshot to send:** Feed showing your posted training video

---

## Flow 4 — Academy → Train → Share

**Goal:** Confirm Academy lessons link to training and produce shareable results.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/mn/drills` (Academy) | Lesson list loads |
| 2 | Tap a lesson (e.g. **Jab Mechanics**) | Lesson detail opens with drills |
| 3 | Tap **Train This** | Train page opens with lesson context shown |
| 4 | Complete the session | Result modal shows academy lesson label |
| 5 | Tap **Share to Feed** | Caption sheet opens |
| 6 | Post it | Feed shows post with academy tag |

**Screenshot to send:** Result modal showing the Academy lesson label

---

## Flow 5 — Challenge Loop

**Goal:** Confirm creating and responding to challenges works end-to-end.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/mn/challenges` | Challenge list loads |
| 2 | Tap **Create Challenge** | Challenge creation form opens |
| 3 | Set a target (combo, time, or score) | Form fills |
| 4 | Post the challenge | Challenge appears in the list |
| 5 | Tap **Accept Challenge** | Navigates to Train with challenge context |
| 6 | Complete the session | Result modal shows challenge result |
| 7 | Tap **Post Response** | Response posted |
| 8 | Return to challenges | Response count updated |

**Screenshot to send:** Challenge card showing your response

---

## Flow 6 — Feed Social Actions

**Goal:** Confirm all feed interactions work.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/mn/feed` | Reels feed loads and auto-plays |
| 2 | Double-tap a reel | Heart animation, like count increases |
| 3 | Tap heart icon again | Like removed, count decreases |
| 4 | Tap comment icon | Comment sheet opens |
| 5 | Type a comment and send | Comment appears in list |
| 6 | Tap bookmark icon | Saved to your library |
| 7 | Tap **Follow** on a creator | Button changes to "Following" |
| 8 | Tap the caption area | Caption sheet slides up with full text |

**Screenshot to send:** Feed reel showing like + comment count

---

## Flow 7 — Notifications

**Goal:** Confirm notification badge and mark-as-read works.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Have another user like or comment on your reel | Notification is created |
| 2 | Look at bottom navigation | Red badge appears on bell icon |
| 3 | Tap the bell / go to `/mn/notifications` | Notification list loads with unread item |
| 4 | Stay on the page for 1–2 seconds | Notifications marked as read automatically |
| 5 | Go back to any other page | Red badge on bell is gone |

**Screenshot to send:** Notifications page showing the unread list

---

## Flow 8 — Fighters List → Detail → Compare

**Goal:** Confirm fighter browsing, detail view, and comparison works.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/mn/fighters` | 10 fighters listed (Tyson, Ali, Inoue, etc.) |
| 2 | Tap a fighter card | Fighter detail page opens |
| 3 | Check style breakdown, combos, and Academy guide | Content loads correctly |
| 4 | Tap **Train This Style** | Navigates to Train with fighter context |
| 5 | Go back to fighters list | List still shows |
| 6 | Tap **Compare** button | Compare mode activates |
| 7 | Tap two fighters | Both are selected |
| 8 | Tap **Compare Now** | Comparison modal opens side-by-side |

**Screenshot to send:** Fighter comparison modal

---

## Flow 9 — Coach Library & Chat

**Goal:** Confirm coach browsing, filter, and chat card rendering.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/mn/coach` | Coach list loads |
| 2 | Tap filter button | Filter sheet slides up (Specialty, Vibe, Location, Sort By labels visible) |
| 3 | Select a specialty filter | Coach list filters down |
| 4 | Tap a coach card | Coach detail opens |
| 5 | Tap **Message** or chat option | Coach chat opens |
| 6 | Check message cards | Structured cards render (not broken JSON) |

**Screenshot to send:** Coach filter sheet open + coach chat

---

## Flow 10 — Locale Sweep

**Goal:** Confirm Mongolian, English, and Korean UIs have no raw untranslated keys.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app at `/mn` | UI is in Mongolian |
| 2 | Navigate: Train → Feed → Fighters → Coach → Notifications | All labels are in Mongolian |
| 3 | Change to `/en` in the URL | UI switches to English |
| 4 | Repeat navigation | All labels are in English |
| 5 | Change to `/ko` | UI switches to Korean |
| 6 | Repeat navigation | All labels are in Korean |
| 7 | Look for any raw keys (e.g. `trainLabelToday`, `lbFilter`, `fighterCompare`) | None visible — all replaced by real text |

**Note:** Boxing terms like "jab", "cross", "hook", "uppercut" may remain in English across all locales — this is intentional.

**Screenshot to send:** Same page in mn + en + ko side by side (or 3 separate screenshots)

---

## Quick Checklist

After all flows, verify:

- [ ] Bottom navigation works on all pages
- [ ] No page is stuck on a loading spinner
- [ ] Tapping the back arrow navigates correctly
- [ ] Safe area is respected on iPhone (nothing hidden under home bar)
- [ ] No visible raw locale keys (camelCase strings like `trainLabelToday`)
- [ ] Build has no errors in console (F12 → Console tab)

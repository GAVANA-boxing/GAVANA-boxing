# GAVANA Scheduled Push — Deploy Guide

Server-side retention functions that re-engage lapsing fighters.
These run on a schedule with **no client open** — this is the piece the app
was missing (every other push only fired while a user was already in the app).

## What gets deployed

| Function | Schedule (Asia/Ulaanbaatar) | Who it targets |
|---|---|---|
| `streakAtRisk` | daily **18:00** | `dailyStreak >= 3` and has **not** trained today → "streak at risk" nudge |
| `winBack` | daily **11:00** | last trained **3–14 days** ago, throttled to once / 3 days → "come back" |

Both respect `users/{uid}.pushEnabled !== false` (opt-out) and send in the
user's `locale` (mn / en / ko), falling back to Mongolian.

## Prerequisites

1. **Blaze plan** — Cloud Functions require the pay-as-you-go plan.
   Firebase Console → ⚙ → Usage and billing → Modify plan → Blaze.
   (These two daily jobs cost effectively nothing at small scale.)
2. **Firebase CLI** logged in: `npm i -g firebase-tools && firebase login`
3. FCM web push already works in the app (it does — `useFcmToken` + VAPID).

## Deploy

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

First deploy will auto-enable Cloud Scheduler + Cloud Build + Pub/Sub and
provision the two schedules. No service-account JSON needed — functions use
the project's default credentials (Application Default Credentials).

## Verify

```bash
# tail logs
firebase functions:log --only streakAtRisk,winBack

# force-run a schedule immediately (Cloud Scheduler console → Run now),
# or from gcloud:
gcloud scheduler jobs run firebase-schedule-streakAtRisk-asia-northeast3 --location=asia-northeast3
```

A log line like `streakAtRisk: 4 users, 5 pushes (today=2026-11-04)` confirms it ran.

## Notes / tuning

- **Timezone**: both jobs fire on `Asia/Ulaanbaatar`. If the main audience is
  Korea, change `TZ` in `functions/index.js` to `Asia/Seoul` and redeploy.
- **Copy**: edit the `COPY` object in `functions/index.js` to tweak wording.
- **Dedup fields written**: `lastStreakRiskKey`, `lastWinBackKey` on the user doc.
- **Locale**: persisted on first FCM-token registration (`useFcmToken`). Existing
  users default to Mongolian until they next grant/refresh push.
- **Next phase** (not in this deploy): `dnaDrift` weekly digest — recompute DNA
  over recent sessions and push "your DNA shifted toward X". Needs the DNA engine
  ported to the functions runtime; left as a follow-up.

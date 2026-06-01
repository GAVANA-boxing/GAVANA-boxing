# GAVANA MVP — Known Limitations

**Version:** 0.1.0 MVP  
These are expected behaviors, not bugs. Do not file a bug report for these.

---

## AI Pose Detection

- **Bad camera angle reduces accuracy.** The AI works best when the full upper body (head to waist) is visible. Low angles, extreme side views, or partial frames will reduce punch detection accuracy.
- **Low light degrades detection.** Bright, even lighting in front of you improves results. Backlighting (bright window behind you) causes silhouette-only detection and drops accuracy.
- **Loose or baggy clothing may affect detection.** Fitted clothing gives better joint tracking.
- **Fast combinations may be undercounted.** Rapid 3–4 punch combos at full speed may register as fewer punches than thrown. Deliberate technical punching at 70–80% speed gives the most accurate feedback.
- **Camera shake affects punch reads.** Mount your phone at chest–head height with a stable stand or holder. Hand-holding the phone while training will not work.
- **Desktop/laptop webcams work for testing.** For accurate training, use a phone mounted at the correct angle.

---

## Video Recording & Upload

- **Video upload depends on your network speed.** Uploading a training video to the feed may take 5–30 seconds on average connections. Slow networks may time out. The session data (score, stats) saves immediately regardless of video upload status.
- **No video does not mean no save.** If video upload fails or the record toggle was off, your session stats and Fighter DNA still save correctly.
- **Video preview is shown before posting.** You can review the clip before sharing — if it looks wrong, cancel and train again.
- **Video is only captured during the active session window.** Anything before or after the training countdown is not included.

---

## Feed & Social Content

- **Feed may be empty for new users.** The feed shows content from other users. If you are testing alone or in a fresh environment, the feed will be empty until you or other testers post sessions.
- **Like and comment counts are real.** They are stored in the database and visible to all users. Test interactions are visible to everyone.
- **Follow relationships are real.** Following a user in the test environment creates a real relationship. You can unfollow at any time.
- **Demo reels are not visible in the feed.** The feed only shows real user-posted content. Demo/placeholder content is filtered out.

---

## Ranking & Leaderboard

- **Rankings are based on posted reels, not total sessions.** Only sessions shared to the feed count toward the leaderboard.
- **Leaderboard updates may be slightly delayed.** Stats from a new post may take up to a minute to reflect in rankings.
- **XP and rank advancement are MVP-level.** The progression system is functional but not fully balanced. Rank thresholds and XP values may be adjusted before the full release.
- **Fighter DNA requires multiple sessions to stabilize.** Your style label (e.g. "Pressure Fighter", "Boxer") becomes more accurate after 3–5 sessions.

---

## Coaches & Gyms

- **Coach profiles are created by coaches who applied.** If no coaches have applied in your region, the coach list may be empty or show only sample data.
- **Coach chat is async.** Coaches respond in their own time. This is not a live chat feature in MVP.
- **Gym data may be incomplete.** Gyms shown are from registered partners. Coverage depends on which gyms have joined.

---

## Challenges

- **Challenges require at least two active users to complete the loop.** Creating a challenge alone will not auto-complete — another user must accept and respond.
- **Challenge response detection is based on training context.** You must start the train session from the challenge card (not the train page directly) for your session to be linked as a response.

---

## Notifications

- **Notifications require another user to trigger them.** Liking or commenting on your own content does not create a notification. A second test account is needed to test the notification badge.
- **Notification delivery is near real-time** but depends on an active Firestore connection. Offline or background sessions may delay delivery.

---

## Platform & Browser

- **Optimized for mobile browsers.** Safari on iOS and Chrome on Android are the primary targets. Desktop Chrome works but some UI proportions are designed for portrait mobile.
- **Safari requires explicit camera permission.** On iOS, you must allow camera access per-site in Settings → Safari → Camera.
- **PWA install is not yet supported.** The app runs in the browser only in MVP.
- **No offline mode.** An internet connection is required for all features.

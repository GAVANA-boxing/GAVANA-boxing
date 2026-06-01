# GAVANA — MVP Release Notes

**Version:** 0.1.0  
**Release:** MVP Tester Build  
**Languages:** English · Mongolian · 한국어

---

## What is GAVANA?

GAVANA is an AI boxing training app. It uses your phone camera to analyze your punches in real time, builds a Fighter DNA profile from your technique, and connects you with a community of boxers, fighters, and coaches.

No gym required. Train anywhere. Get real feedback.

---

## Core Features

### AI Training (`/train`)

- Real-time punch detection using pose estimation via your camera
- Counts jabs, crosses, hooks, and uppercuts
- Measures snap speed, recovery time, and rhythm
- Generates a session score (0–10) and punch breakdown
- Identifies your dominant weapon and next focus area
- Builds a **Fighter DNA** profile that improves with each session

**How to train:**
1. Mount your phone at chest–head height
2. Tap Start AI Assessment
3. Shadow box for the session
4. Review your result and Fighter DNA

---

### Fighter DNA

Your style profile built from training data:

- **Style Label** — Pressure Fighter, Out-Boxer, Brawler, Technician, etc.
- **Weapon Rating** — which punch you throw best
- **Weakness Map** — what the AI identifies as your gaps
- **Comparison** — how your profile matches legendary fighters

DNA updates automatically after each saved session.

---

### Academy (`/drills`)

Structured technique lessons based on real fighter mechanics:

- **10 lesson modules** covering: Jab Mechanics, Cross Mechanics, Hook Mechanics, Uppercut Mechanics, and more
- Each lesson has a subtitle, technique notes, and drills
- **Train This** button launches a live session with the lesson loaded as context
- Completed academy sessions appear in your feed with the lesson tag

---

### Feed (`/feed`)

A vertical video feed of training content from the community:

- Auto-plays as you scroll (scroll-snap format)
- Like, comment, save, and share reels
- Follow creators directly from the feed
- Caption sheet for viewing full captions
- Filter between **For You** and **Following** tabs
- Training videos include score, style label, and combo tags

---

### Fighters (`/fighters`)

Profiles of 10 legendary boxers as training archetypes:

- **Mike Tyson** — Peek-a-boo pressure style
- **Muhammad Ali** — Footwork and the jab
- **Naoya Inoue** — Body-head switch combinations
- **Dmitry Bivol** — Soviet straight and distance control
- **Vasyl Lomachenko** — Hi-Tech angles and pivots
- **Canelo Álvarez** — Shoulder roll counter style
- **Gennady Golovkin** — Stalking pressure and body work
- **Floyd Mayweather** — Defense-first counter boxing
- **Manny Pacquiao** — Southpaw speed and angles
- **Roberto Durán** — Pressure and inside fighting

Each fighter profile includes:
- Style breakdown and key attributes
- Signature combinations with step-by-step instructions
- Academy guide for training that style
- **Train This Style** — launches a session with fighter context loaded
- **Compare** mode — select two fighters to compare stats side by side

---

### Challenges (`/challenges`)

Community training challenges:

- Create a challenge with a target (combo, score, or duration)
- Other users accept and post video responses
- Challenges appear in the feed with response count
- Your Fighter DNA influences which challenges are recommended

---

### Social

- **Like / Unlike** — double-tap or tap the heart
- **Comment** — real-time comments on any reel
- **Save** — bookmark reels to your library
- **Follow / Unfollow** — follow creators to see their content in Following tab
- **Notifications** — get notified when someone likes, comments, or follows you

---

### Notifications (`/notifications`)

- Unread count badge on the bell icon in navigation
- Full notification list with actor avatars and timestamps
- All notifications marked as read automatically on page open
- Types: like, comment, follow, challenge response

---

### Profile (`/profile`)

- Fighter DNA display with style label and weapon breakdown
- Combat Progress: XP bar and rank badge
- Training history with per-session scores
- Posted reels grid
- Edit profile: display name, photo, bio

---

### Coach (`/coach`)

- Browse coach profiles with specialty, vibe, and location filters
- Filter by: Specialty · Vibe · Location · Sort By
- View coach detail: bio, style, availability
- Message a coach (async chat)
- Coaches can apply to join via `/coach/apply`

---

### Gyms (`/gyms`)

- Browse registered gyms with location and type filters
- View gym detail: facilities, schedule, member count
- Filter by vibe tags and verification status

---

### Programs (`/programs`)

- Structured multi-week training programs
- Enroll and track progress session by session
- Daily sessions with completion tracking

---

### Leaderboard (`/rank`)

- Top performers ranked by session score and activity
- Filter by time period and style
- Your position shown in context

---

## Language Support

All core UI is available in:
- **English** — `/en/...`
- **Mongolian** — `/mn/...`
- **Korean** — `/ko/...`

Boxing terminology (jab, cross, hook, uppercut, etc.) remains in English across all languages as it is internationally standardized.

---

## What's Coming After MVP

- Live sparring mode (1v1 real-time)
- Coach live session with video call
- Full ranking system with division brackets
- Gym membership integration
- PWA / installable app
- Android and iOS native builds

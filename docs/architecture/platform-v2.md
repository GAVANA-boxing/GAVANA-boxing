# GAVANA платформ v2 — архитектур, Fight Knowledge Graph, дэлгүүр, Fighter Dashboard

Огноо: 2026-11-08. Эзэмшигчийн хүсэлт: mobile-first босоо feed + browser MediaPipe, FKG өгөгдлийн сан,
Shopify маягийн дэлгүүр, Fighter Dashboard (TS interface, App Router бүтэц, UI, `useFighterDashboard`).

**Энэ баримтын төлөв:** dashboard-ын код (types, mappers, hook, UI, demo fixture) бичигдсэн. Firestore
rules + indexes (§5) repo-д нэмэгдсэн, emulator тест давсан — **deploy хийгдээгүй** (эзэмшигч deploy хийнэ).
Төлбөрийн API, видео анализын pipeline — санал.

---

## 0. Зарчим

1. **Утас эхэнд.** 360 px-ээс дээш, 11 px-ээс бага текст байхгүй, товч ≥ 40 px, нэг гараар.
2. **CV браузерт.** Камерын дүрс серверт явахгүй; зөвхөн тоон үр дүн (landmark-аас гаргасан хэмжүүр) хадгална.
3. **Сервер л оноо / XP / төлбөр бичнэ.** Клиент юу ч илгээсэн сервер дахин шалгана (`scoreGuard`).
4. **Зохиомол тоо үгүй.** Харьцуулах жишиг бүр эх сурвалжтай (хэн, хэдэн тамирчин, хэдэн клип).
5. **Бүх хэсэг өөрийн loading / error-той** — нэг хэсэг унахад бүх хуудас хоосрохгүй.

## 1. Frontend / backend бүтэц (Next.js App Router)

```
app/
  [locale]/                     mn | ko | en
    (core loop)  home/ train/ progress/ history/ coach/ …
    feed/ reels/                босоо feed (CORE_MODE-д нуугдсан)
    fighter-dashboard/page.tsx  NEXT_PUBLIC_FIGHTER_DASHBOARD=1 үед л (өгөгдөл бэлэн болтол 404)
    shop/                       (санал) каталог, бараа, сагс — §3
    visual/[screen]/            visual test fixture (зөвхөн NEXT_PUBLIC_VISUAL_FIXTURES=1)
  api/
    score/session               оноо + XP (сервер, anti-cheat)
    checkout/ (санал)           захиалга үүсгэх + QPay нэхэмжлэл
    payments/qpay/callback (санал) төлбөрийн webhook → order.status = paid
components/
  train/ PoseSkeletonOverlay …  камер + canvas overlay
  dashboard/fighter/*.tsx       dashboard UI (presentational, props-оор өгөгдөл авна)
hooks/
  usePoseDetection.js           MediaPipe, ~10 fps, raw → detector, One-Euro → overlay
  useFighterDashboard.ts        Firestore → dashboard state (real-time)
lib/
  pose/                         landmarkFilter (One-Euro), overlayGeometry
  dashboard/                    types.ts · mappers.ts (цэвэр, unit test) · copy.ts (MN/KO/EN) · mockData.ts
  domain/                       progression, scoreGuard, awardXp (сервер л бичнэ)
```

**Өгөгдлийн урсгал (real-time pose):** камер → `usePoseDetection` (main thread, 100 ms throttle) → raw
landmark → цохилт илрүүлэгч (`lib/punchPhaseDetector.js`, хамгаалагдсан) · шүүсэн landmark → хэмжүүр +
canvas overlay → раунд дуусахад `/api/score/session` → `training_sessions` doc (`poseMetrics`).

**Дараагийн алхам (perf):** MediaPipe-ийг Web Worker + OffscreenCanvas руу (main thread чөлөөлөгдөнө);
дэлгэрэнгүй: `docs/audit/2026-11-08-architecture-cv-qa.md` §2.

**Видео анализ (хийсэн, 2026-11-08):** хэрэглэгч клип сонгоно → `hooks/useClipAnalysis` клипийг **браузерт
бодит хурдаар** тоглуулж, live раундтай **яг ижил** pipeline-аар (`usePoseDetection` → цохилт илрүүлэгч →
`computeFinalScore`) шинжилнэ (илрүүлэгч цагийг wall clock-оор хэмждэг тул frame-ээр seek хийхгүй), live
skeleton overlay харагдана → `video_analyses/{id}`: `queued → processing (10 % тутам) → completed (score,
punches, poseFramesPct, thumbnailUrl) | failed (error код)`. **Видео төхөөрөмжөөс гарахгүй**; thumbnail нь
зөвхөн зурсан араг яс (видеоны пиксел биш, ≤ 24 KB data URL). Хязгаар: видео файл, ≤ 300 MB, 3 с – 3 мин.
Таб нуугдахад зогсоно; хуудсаас гарвал `failed: interrupted`. Оноо XP-д орохгүй. Dashboard `onSnapshot`-оор
явцыг шууд харуулна. Тест: `tests/clipAnalysis.test.ts`, `tests/cv/clip-analysis.spec.mjs` (жинхэнэ MediaPipe).

## 2. Fight Knowledge Graph (FKG)

### 2.1 Entity ба холбоос

```
Fighter ──1:N── Session ──1:N── PunchEvent
   │               └──N:1── Drill
   │1:N
   └── VideoAnalysis ──1:N── PunchEvent
Fighter ──N:1── Archetype            BenchmarkProfile ──1:N── BenchmarkAxis
Fighter ──N:M── BenchmarkProfile  (Comparison: тухайн үеийн 6 тэнхлэгийн snapshot)
BenchmarkProfile ──N:1── Source (coach | partner-athletes | community; тамирчин, клипийн тоо, зөвшөөрөл)
Fighter ──1:N── Order ──1:N── OrderLine ──N:1── ProductVariant ──N:1── Product
```

### 2.2 Firestore (одоо ашиглах — аль хэдийн байгаа сан)

| Collection | Doc | Гол талбар | Бичигч |
|---|---|---|---|
| `users/{uid}` | профайл | `displayName, stance, fighterArchetype, xp, dailyStreak, stats{sessions, trainingMinutes, punches, analyzedVideos}` | клиент (профайл) / сервер (`xp`, `stats`) |
| `training_sessions/{id}` | 1 раунд | `userId, createdAt, score, durationSeconds, drillId, poseMetrics{punchCount, punchBreakdown, velocityStats{avgRecoilMs, avgSnapVelocity, snapRating}, guardHeight, stanceWidth, punchExtension, rotation, balance, sessionConfidence}` | сервер (`/api/score/session`) |
| `video_analyses/{id}` (санал) | upload анализ | `userId, createdAt, status, progressPct, durationSec, thumbnailUrl, score, punches, poseFramesPct, error` | эзэмшигч (status) |
| `benchmarks/{sourceId}` (санал) | жишиг профайл | `label{mn,ko,en}, kind, athletes, clips, updatedAt, axes{speed, technique, guard, balance, volume, variety}` (0–100) | зөвхөн админ / сервер |
| `products/{id}` (санал) | бараа | `title{mn,ko,en}, slug, images[], active, variants[{sku, label, priceMnt, stock}]` | админ |
| `orders/{id}` (санал) | захиалга | `userId, createdAt, status, total{amount, currency:"MNT"}, items[], payment{provider, invoiceId}, ebarimt{billId}, trackingUrl` | **зөвхөн сервер** |

PunchEvent-ийг тусдаа doc болгохгүй (раунд бүрт 50–300 → бичилт үнэтэй); `poseMetrics`-д нэгтгэсэн
байдлаар хадгална. Нарийн шинжилгээнд BigQuery export (Firebase extension) ашиглана.

### 2.3 PostgreSQL хувилбар (graph query / аналитик өсөхөд)

```sql
create table fighters (id uuid primary key, firebase_uid text unique not null, stance text check (stance in ('orthodox','southpaw')),
  archetype text, created_at timestamptz default now());
create table sessions (id uuid primary key, fighter_id uuid not null references fighters on delete cascade,
  drill_id text, created_at timestamptz not null, duration_s int not null, score numeric(3,1) check (score between 0 and 10),
  confidence text check (confidence in ('high','medium','low','none')));
create table punch_events (id bigserial primary key, session_id uuid not null references sessions on delete cascade,
  t_ms int not null, hand text check (hand in ('lead','rear')), type text check (type in ('jab','cross','hook','uppercut')),
  return_ms int, snap_index real, form_ok boolean);
create table session_form (session_id uuid primary key references sessions on delete cascade,
  guard text, stance_width text, extension text, rotation text, balance text);
create table benchmark_sources (id text primary key, kind text check (kind in ('coach','partner-athletes','community')),
  athletes int not null check (athletes > 0), clips int not null check (clips > 0), consent_doc text not null, updated_at timestamptz);
create table benchmark_axes (source_id text references benchmark_sources on delete cascade, axis text check
  (axis in ('speed','technique','guard','balance','volume','variety')), value smallint check (value between 0 and 100),
  primary key (source_id, axis));
create index on sessions (fighter_id, created_at desc);
create index on punch_events (session_id);
```

Зөвлөмж: **одоо Firestore** (rules, auth, real-time бэлэн), PostgreSQL-ийг (Neon / Supabase) зөвхөн
аналитик / олон хүснэгтийн query хэрэг болоход Firestore → Postgres нэг чиглэлтэй sync-ээр нэмнэ.

### 2.4 Жишигтэй харьцуулах (мэргэжлийн benchmark)

Нэг normalisation хоёр талд (`lib/dashboard/mappers.ts → normalizeAxes`):

| Тэнхлэг | Томьёо (0–100) | Эх өгөгдөл |
|---|---|---|
| speed | `(700 − avgReturnMs) / 5` (200 ms → 100, 700 ms → 0) | `velocityStats.avgRecoilMs` |
| technique | 5 шалгуурын «good» эзлэх % | `poseMetrics.*.status` |
| guard / balance | «good» раундын % | `guardHeight`, `balance` |
| volume | `ppm / 120 × 100` | `punchCount / минут` |
| variety | jab/cross/hook/uppercut холимгийн Shannon entropy (нормчилсон) | `punchBreakdown` |

**Хурд нь м/с биш** — биеийн хэмжээтэй харьцангуй (камерын зай, өндрөөс үл хамаарахын тулд). Жишиг
профайлыг **зөвшөөрөл авсан** дасгалжуулагч / түнш тамирчдын клипээс **ижил pipeline**-аар гаргана.
`mapBenchmark` нь эх сурвалж (label, kind, athletes, clips) байхгүй doc-ийг хүлээж авахгүй → «жишиг
нийтлэгдээгүй» гэсэн шударга хоосон төлөв. Олны танил боксчдын тоог зохиож бичихгүй.

## 3. Дэлгүүр (Shopify маягийн UX, Монголд ажиллах төлбөр)

**Төлбөрийн бодит байдал:** Stripe нь Монголд бүртгэлтэй аж ахуйн нэгжид нээгдэхгүй (Stripe-ийн дэмжих
улсын жагсаалтад Монгол байхгүй; гадаад, ихэвчлэн АНУ-ын LLC-ээр л нээдэг —
support.stripe.com/questions/requirements-to-open-a-stripe-account-in-another-country,
doola.com/stripe-guide/how-to-open-a-stripe-account-in-mongolia). Shopify Payments ч Монголд байхгүй.
Тиймээс:

- **Каталог:** Firestore `products` (MN/KO/EN нэр, variant: хэмжээ / өнгө / unce, үлдэгдэл). Цөөн бараатай
  үед Shopify headless-ээс энгийн, MNT + QPay шууд.
- **Сагс:** клиент state + `localStorage` (зочин) → нэвтэрсэн үед `carts/{uid}`. Үнийг **сервер** дахин тооцно.
- **Checkout:** `POST /api/checkout` → үнэ, үлдэгдэл шалгана → `orders/{id}` (`pending_payment`) →
  `PaymentProvider.createInvoice()` → QR / deeplink буцаана.
- **Provider abstraction:** `interface PaymentProvider { createInvoice(order); verifyCallback(req); refund(order) }`
  — `QPayProvider` (үндсэн, MNT), `StripeProvider` (сонголттой, гадаад LLC-тэй бол, USD).
- **Webhook:** `POST /api/payments/qpay/callback` → QPay API-аар **төлбөрийг дахин шалгаж** (callback-д
  итгэхгүй) → `paid` → И-баримт (Ebarimt) үүсгэж `ebarimt.billId` хадгална.
- **Захиалгын төлөв (зөвхөн сервер шилжүүлнэ):**

```
pending_payment ──paid──▶ paid ──▶ fulfilling ──▶ shipped ──▶ delivered
      │                     │            │
      └──▶ cancelled        └────────────┴──▶ refunded
```

Dashboard нь `orders`-ыг `onSnapshot`-оор сонсдог тул webhook статус өөрчлөхөд хуудас шууд шинэчлэгдэнэ.

## 4. Fighter Dashboard

### 4.1 Хэсгүүд ба өгөгдлийн эх

| Хэсэг | Эх | Сонсох арга | Компонент |
|---|---|---|---|
| Профайл + цол + streak | `users/{uid}` + бүх `training_sessions` (XP `/progress`-тэй адил тооцоо) | `onSnapshot` + `getDocs` | `ProfileHeader` |
| KPI 4 карт | profile · biomechanics · orders | (дээрхээс) | `MetricCards` |
| Биомеханик (оноо, техник, тэнцвэр, хамгаалалт, цохилтын холимог) | сүүлийн 30 раунд | `getDocs`, `refresh()` | `BiomechanicsCard` (SVG line) |
| FKG radar | `benchmarks/{id}` + биомеханик | `getDoc` | `BenchmarkRadar` (SVG radar + хүснэгт) |
| Сүүлийн видео | `video_analyses` (6) | `onSnapshot` | `RecentVideos` |
| Захиалга | `orders` (5) | `onSnapshot` | `OrderHistory` |

### 4.2 Төрөл ба state

`lib/dashboard/types.ts`: `FighterProfileSummary`, `SessionAnalytics`, `BiomechanicsSummary`,
`BenchmarkComparison` (+ `BenchmarkSource` provenance), `VideoAnalysis`, `OrderSummary`,
`SectionState<T> = loading | ready{data} | error{DashboardError}`. Firestore doc → model хөрвүүлэлт бүгд
`mappers.ts`-д (цэвэр функц, `tests/dashboardMappers.test.ts`), буруу / дутуу талбар → `null` (зохиохгүй).

### 4.3 `useFighterDashboard(uid, opts)`

- Firestore-ийг динамик import (public хуудсанд SDK орохгүй).
- Listener бүр өөрийн хэсэгт алдаа бичнэ (`toDashboardError`: permission-denied / unavailable / …,
  `retryable`). `refresh()` бүгдийг дахин холбоно. Unmount / uid солигдоход бүх listener салгана,
  `cancelled` flag хоцорсон хариуг хаяна.
- Сешн ачаалагдаж чадаагүй бол профайлыг **алдаа** гэж харуулна (буруу, бага цол харуулахгүй).

### 4.4 UI

Харанхуй, өндөр контраст; брэндийн улаан (#FF3B30) = «та», саарал outline = жишиг (emphasis хэлбэр).
График гараар бичсэн SVG (`charts.tsx`): Recharts ~430 KB client JS нэмж, evolve bundle gate (+5 %)-ийг
давсан тул. Hover / touch tooltip, бүх утга хүснэгтээр бас уншигдана. Статус badge = icon + текст.
Demo: `/{locale}/visual/dashboard`, `/{locale}/visual/dashboard-states` (fixture горимд).

## 5. Rules ба index (repo-д бий, deploy хийгдээгүй)

Эзэмшигч «Hii» гэж зөвшөөрсний дараа (2026-11-08) `firestore.rules`-д нэмсэн, `scripts/rules-test`-д 29 тест:

| Collection | Унших | Бичих |
|---|---|---|
| `video_analyses` | зөвхөн эзэмшигч (query `userId == uid` шаардана) | эзэмшигч: `queued` төлөвтэй үүсгэнэ (үр дүнгүй); `processing → completed / failed` шинэчилнэ; оноо 0–10, явц 0–100, цохилт 0–5000, урт ≤ 600 с; thumbnail зөвхөн `data:image/…;base64` ≤ 24 KB (холбоос хориотой); `userId`, илүү талбар хориотой; `completed` болсны дараа өөрчлөгдөхгүй; устгаж болно |
| `orders` | зөвхөн эзэмшигч | клиент огт бичихгүй (checkout API + баталгаажсан payment callback, service account) |
| `products`, `benchmarks` | бүх хүн | клиент бичихгүй (admin SDK) |
| `users.stats` | (users-ийн дүрмээр нийтэд) | клиент бичихгүй — серверийн aggregate |

`firestore.indexes.json`: `video_analyses (userId ASC, createdAt DESC)`, `orders (userId ASC, createdAt DESC)`.
Deploy: `docs/LAUNCH.md` §3-ийн дарааллаар (эхлээд indexes, дараа нь rules).
`video_analyses`-ийн оноог клиент бичдэг тул XP-д **тооцохгүй** (XP зөвхөн `/api/score/session`).
Мөн нээлттэй P0: `training_sessions` / `user_training_profile` нь `allow read: if true` — §audit-д.

## 6. Дараалал

1. ~~rules + index + emulator тест~~ (хийсэн) → (эзэмшигч) deploy.
2. ~~`video_analyses` pipeline (клип → браузер анализ → status)~~ (хийсэн).
3. QPay merchant гэрээ + `PaymentProvider` + checkout + callback + Ebarimt → «Захиалга» амилна.
4. Зөвшөөрөлтэй жишиг клип цуглуулах → `benchmarks/{id}` нийтлэх → radar амилна.
5. `NEXT_PUBLIC_FIGHTER_DASHBOARD=1` — dashboard-ыг нээх, navigation-д холбох.

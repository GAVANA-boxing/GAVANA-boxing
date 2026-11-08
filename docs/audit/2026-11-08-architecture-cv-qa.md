# GAVANA — Архитектур, Computer Vision, QA аудит (2026-11-08)

**Хамрах хүрээ:** reel feed, MediaPipe + Canvas overlay, analytics. Бүх дүгнэлт GAVANA-гийн бодит код
(branch `claude/review-refactor-code-DUmiX`) болон production build дээрх хэмжилтэд тулгуурласан.

**Тэмдэглэгээ:** ✅ хийгдсэн, шалгасан · ⚠️ хэсэгчлэн / төхөөрөмж дээр шалгаагүй · ❌ байхгүй.
"Шинэ" гэсэн нь энэ аудитын хүрээнд нэмэгдсэн код (`b954d9d`).

### Эхлээд үнэнийг хэлье — тодорхойлолт ба кодын зөрүү
| Тодорхойлолтод | Кодонд бодитоор |
|---|---|
| TikTok шиг босоо reel feed | Бий (`app/reels/ReelsContent.js`, `components/reels/*`), гэхдээ **CORE_MODE-оор нуугдсан** (модераци хийгдээгүй тул). |
| MediaPipe + Canvas overlay | MediaPipe бий. Live skeleton overlay **байгаагүй** (зөвхөн `?debug=1` текст самбар) → **шинээр нэмсэн** `components/train/PoseSkeletonOverlay.js`. |
| Fight Knowledge Graph | **Байхгүй.** Оронд нь Fighter DNA, радар, ахиц, техникийн номын сан (`lib/fighterTechniques.js`) тус тусдаа байна. §1.3-т загварыг санал болгосон. |
| Tailwind CSS | Суулгасан ч бараг ашиглагддаггүй; ихэнх нь inline style. |

---

## 1. Гол функцийн шалгах хуудас (20 контрол цэг)

### 1.1 Mobile-first vertical reel feed
| # | Контрол цэг | Тэнцэх шалгуур (хэмжигдэхүйц) | Хэрхэн шалгах | Төлөв |
|---|---|---|---|---|
| 1 | Нэг swipe = нэг reel | `scroll-snap-type: y mandatory`; хурдан swipe-д 2 reel алгасахгүй | Playwright `mouse.wheel` / touch swipe 20 удаа → index +1 | ✅ (`globals.css .reels-feed`) |
| 2 | Scroll гөлгөр | Scroll үед ≥55 FPS, 50 мс-ээс урт task 0 (дунд зэргийн Android) | Chrome DevTools Performance / CDP `Tracing` | ⚠️ төхөөрөмж дээр хэмжээгүй |
| 3 | Идэвхтэй индекс нэг эх сурвалжтай | Scroll handler ба IntersectionObserver ижил индекс өгнө | URL bar нуугдах/гарах үед индекс зөрөхгүй | ✅ **Шинэ:** `container.clientHeight` (өмнө нь `window.innerHeight` → зөрдөг байсан) |
| 4 | Зөвхөн идэвхтэй нь тоглоно | Бусад `paused === true`, дуу зөвхөн идэвхтэйд | DOM-оос бүх `<video>`-ийн `paused` | ✅ (`ReelItem.js`) |
| 5 | Preload бодлого | active `auto`, дараагийнх `metadata`, бусад `none` | DevTools Network: зөвхөн 2 видео татагдана | ✅ |
| 6 | Санах ой тогтвортой | 100 swipe-ийн дараа `<video>` ≤ 4, JS heap өсөлт ≤ 20 MB | §5.3 тест (CDP heap) | ✅ **Шинэ:** windowing (active −1…+2) + `removeAttribute("src"); load()`. Heap тест төхөөрөмж дээр ажиллуулаагүй ⚠️ |
| 7 | "Хязгааргүй" feed | Cursor pagination (`startAfter`), давхардалгүй, сүүлд хүрэхэд дараагийн 20-г ачаална | Firestore emulator + 60 reel | ❌ Одоо `limit(120)` нэг удаа уншдаг; "infinite loop" байхгүй |

### 1.2 Browser-side MediaPipe + Canvas overlay
| # | Контрол цэг | Тэнцэх шалгуур | Хэрхэн шалгах | Төлөв |
|---|---|---|---|---|
| 8 | Загвар lazy ачаалагдана | Эхний зурахад (LCP) MediaPipe-ийн файл 0 | Network log: idle/раунд эхлэхэд л | ✅ (`train/page.js` `poseWarm`) |
| 9 | GPU → CPU fallback | GPU delegate бүтэлгүйтвэл CPU-гаар ажиллана | WebGL-гүй browser | ✅ (`usePoseDetection.js` `loadPoseLandmarker`) |
| 10 | Inference хурд | Бодит утсанд ≥ 10 FPS (детекторын загварын хурд), 1 frame ≤ 40 мс | `?debug=1` FPS; `npm run test:cv` `CV_MIN_FPS=8` | ⚠️ Контейнерт (GPU-гүй) 2–3 FPS; утсан дээр хэмжээгүй |
| 11 | Overlay үнэгүй байх | Шинэ pose ирэхэд л зурна, нэг зурах ≤ 2 мс, DPR ≤ 2, frame бүрт allocation 0 | `data-frames-drawn` ≈ inference frame; Performance profile | ✅ **Шинэ** `PoseSkeletonOverlay.js` |
| 12 | Overlay видеотой давхцах | Толин тусгал, iOS эргүүлэлт, `object-fit: cover` тайралтыг тооцно | `tests/overlayGeometry.test.js`; E2E зураг | ✅ (cover + mirror). iOS эргүүлэлт төхөөрөмж дээр ⚠️ |
| 13 | Далдлагдсан цэг | Бээлий, гар нүүр халхлахад ≤ 400 мс барина, дараа нь reset; хуучин байрлал холилдохгүй | `tests/landmarkFilter.test.js` (7) | ✅ **Шинэ** `lib/pose/landmarkFilter.js` |
| 14 | Нөөц чөлөөлөх | Раунд дуусахад loop зогсоно; таб нуугдахад зурахгүй; хуудаснаас гарахад камерын track stop | Камерын LED унтрах; `cancelAnimationFrame` | ✅ (`useCameraSession.js` track.stop, overlay `visibilityState`) |

### 1.3 Analytics dashboard ба Fight Knowledge Graph
| # | Контрол цэг | Тэнцэх шалгуур | Хэрхэн шалгах | Төлөв |
|---|---|---|---|---|
| 15 | Тоо бүр эх сурвалжтай | Дэлгэцийн тоо бүр хэмжилт эсвэл "тооцоолол" гэж тэмдэглэгдсэн | Код review + `docs/audit/2026-11-08-gavana-audit.md` | ✅ ихэнх (хуурамч тоо устгагдсан). Радарын Timing/Footwork/Power онооноос ⚠️ |
| 16 | Нэг раунд = нэг оноо | Дэлгэц, хадгалалт, XP ижил | `tests/scoreConfidence.test.js` | ✅ |
| 17 | Хоосон / их өгөгдөл | 0, 1, 200 сесстэй график алдаагүй | Visual fixture `/visual/progress` + unit | ⚠️ 0 ба 12 сесс шалгасан; 200 үгүй |
| 18 | Knowledge Graph | Техник → метрик → сесс → дасгал холбоос, асуулга < 100 мс | Доорх загвар | ❌ байхгүй |
| 19 | Асуулга хязгаартай | Бүх Firestore асуулга `limit` + index-тэй | Код grep, emulator | ⚠️ `useRankData`, coach chat бүх сессийг уншдаг (XP нийлбэрт) |
| 20 | 3 хэл бүрэн | MN/KO/EN түлхүүр зөрөхгүй | Locale parity script | ✅ 0 зөрүү |

**Fight Knowledge Graph — санал болгох загвар** (Firestore-д шууд граф DB шаардлагагүй):
```
technique  {id:"jab", cues:[…], metrics:["extensionDeg","returnMs","guardOtherHand"]}
metric     {id:"returnMs", unit:"ms", good:"<450", source:"lib/punchTeardown"}
session    {…, punches:[{type, t, metrics:{extensionDeg, returnMs, …}}]}
drill      {id, targets:["returnMs"], …}
edges (материалчилсан): users/{uid}/techniqueStats/{techniqueId} =
  {n, mean, p50, trend7d, lastSessionId, weakestMetric}   ← сесс хадгалах үед сервер шинэчилнэ
```
Dashboard нь зөвхөн `techniqueStats` (≤ 10 doc) уншина → 200 сессийг унших шаардлагагүй (#19-ийг давхар шийднэ).

---

## 2. Гүйцэтгэл ба браузерын нөөц

### 2.1 Одоогийн pipeline (хэмжсэн)
- `hooks/usePoseDetection.js`: main thread, `requestAnimationFrame` дотор `detectForVideo` (синхрон),
  100 мс throttle (~10 FPS). Детекторын бүх босго (`MIN_EXTEND_MS 80`, `PUNCH_COOLDOWN_MS 220`, EMA-ууд)
  10 FPS-д тааруулагдсан.
- Камер: `getUserMedia({ video: { facingMode } })` — **нягтралын хязгааргүй** (утас 1280×720+ өгдөг).
- Контейнерт (GPU-гүй, SwiftShader): 2–3 FPS. Бодит утсан дээр хэмжээгүй.
- Train-ийн эхний ачаалалд MediaPipe (6.7 MB) татагддаг байсныг idle рүү шилжүүлсэн (`d73efec`).

### 2.2 FPS-ийг унагаахгүй сайжруулалт (ач холбогдлоор)
**P1 — Камерын нягтралыг багасгах** (хамгийн хямд ялалт). Pose загварын оролт 256×256; 720p кадрыг
GPU руу илгээх нь дэмий. *Төхөөрөмж дээр туршаад* оруулна:
```js
navigator.mediaDevices.getUserMedia({
  video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, max: 30 } },
  audio: false,
});
```

**P1 — `requestVideoFrameCallback`** — зөвхөн камерын *шинэ* кадр дээр inference (rAF 60 Гц-ийн давтагдсан
кадруудыг алгасна). Chrome / Safari 15.4+:
```js
const tick = (now, meta) => {
  if (meta.mediaTime !== lastMediaTime && now - lastRun >= intervalMs) {
    lastMediaTime = meta.mediaTime; lastRun = now;
    runInference(video, now);
  }
  handle = video.requestVideoFrameCallback(tick);
};
handle = "requestVideoFrameCallback" in HTMLVideoElement.prototype
  ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(rafFallback);
```

**P2 — Inference-ийг Web Worker руу** (UI thread чөлөөлөгдөнө). Нэг frame л "in flight" байх
backpressure, `ImageBitmap`-ийг transfer хийнэ:
```js
// main thread
const worker = new Worker(new URL("./pose.worker.js", import.meta.url), { type: "module" });
let busy = false;
async function runInference(video, ts) {
  if (busy) return;                      // backpressure: frame алгасна, дараалал үүсгэхгүй
  busy = true;
  const bitmap = await createImageBitmap(video, { resizeWidth: 480, resizeQuality: "low" });
  worker.postMessage({ bitmap, ts }, [bitmap]);
}
worker.onmessage = ({ data }) => { busy = false; onLandmarks(data.landmarks, data.world, data.ts); };

// pose.worker.js
import { FilesetResolver, PoseLandmarker } from "/mediapipe/vision_bundle.mjs";
let lm;
self.onmessage = async ({ data: { bitmap, ts } }) => {
  lm ??= await PoseLandmarker.createFromOptions(await FilesetResolver.forVisionTasks("/mediapipe/wasm"), {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" }, runningMode: "VIDEO", numPoses: 1 });
  const r = lm.detectForVideo(bitmap, ts);
  bitmap.close();                        // санах ой шууд чөлөөлнө
  self.postMessage({ landmarks: r.landmarks?.[0] ?? null, world: r.worldLandmarks?.[0] ?? null, ts });
};
```
Анхааруулга: worker доторх GPU delegate нь `OffscreenCanvas` + WebGL2 шаардана (Chrome Android ✅,
iOS Safari 17+). Дэмжихгүй бол одоогийн main-thread замаар явна (feature detect).

**P2 — Дасан зохицох төсөв.** Inference-ийн хугацааг хэмжиж, удаан төхөөрөмж дээр интервалыг
томруулна. ⚠️ **Детектор 10 FPS-д тааруулагдсан тул FPS-ийг дээшлүүлэх / бууруулахаас өмнө
`scripts/punch-eval`-ийг шинэ хурдаар дахин тохируулж, F1 ≥ 0.90-ийг хадгалах ёстой.**

**Canvas** (хийгдсэн, `PoseSkeletonOverlay.js`): тусдаа rAF, `frameId` өөрчлөгдөөгүй бол ажил 0,
backing store зөвхөн хэмжээ өөрчлөгдөхөд, DPR ≤ 2, `visibilityState` шалгана, z-index давхарга.
Цаашид хэрэгтэй бол `transferControlToOffscreen()`-оор worker-т зурж болно.

**Батарей:** inference зөвхөн раунд бичих үед (`isActive`), idle үед камер ажиллавч inference 0.
Раундын хооронд 60 сек идэвхгүй бол камерыг унтраах (одоо байхгүй) — санал.

### 2.3 Санах ойн алдагдал (memory leak)
| Эх үүсвэр | Төлөв | Арга |
|---|---|---|
| Reel `<video>` элементүүд | ✅ Шинэ | Window (active −1…+2) гадна `<video>` render хийхгүй; unmount үед `pause(); removeAttribute("src"); load()` |
| `ImageBitmap` (worker хийвэл) | — | `bitmap.close()` заавал |
| Landmark буфер | ✅ | Replay ≤ 2400 frame; frame metrics раунд бүрт reset |
| PoseLandmarker | ⚠️ | Singleton (дахин ачаалахгүй — зориуд). Сургалтын хэсгээс урт хугацаагаар гарвал `landmarker.close()` |
| Event listener / rAF | ✅ | Бүх effect cleanup-тай; шинэ кодонд `cancelAnimationFrame` |
| Firestore listener | ✅ | Профайл нэг listener, unsubscribe-тай |

Шалгах арга: §5.3 (CDP `Performance.getMetrics` → `JSHeapUsedSize`, `<video>` тоо).

---

## 3. Онцгой нөхцөл ба биомеханикийн логик

### 3.1 Далдлагдсан / гэрэл муу үеийн landmark цэвэрлэх
**Хийгдсэн** (`lib/pose/landmarkFilter.js`, 7 тест):
1. **One-Euro filter** (Casiez 2012) — хөдөлгөөн хурдан үед бага, тайван үед их зөөлрүүлнэ. Тогтмол
   EMA (α 0.35) цохилтыг хоцрогдуулдаг байсан; тест: 0.3→0.6 үсрэлтэд гаралт > 0.5 (EMA ≈ 0.45).
2. **Visibility gate** — visibility < 0.5 цэг шүүлтүүрийг хөдөлгөхгүй.
3. **Богино далдлалт** — ≤ 400 мс сүүлийн найдвартай байрлалыг барина (`held: true`), overlay-д
   бүдэг зурна; visibility утга өөрчлөгдөхгүй тул `computePoseMetrics` тэр цэгийг алгасна.
4. **Урт тасалдал** — > 400 мс бол reset; хуучин байрлал хэзээ ч холилдохгүй. NaN-аас хамгаална.
5. Цохилтын детектор **түүхий** landmark авдаг хэвээр (өөрийн тааруулсан зөөлрүүлэлттэй) → F1 0.904 өөрчлөгдөөгүй.

**Цаашид (санал, код):**
- **Ясны уртын тогтвортой байдал** — бээлий бугуйг "шилжүүлэх" үед шуу хэт урт/богино болно:
```js
// calibrated = эхний 1 сек-ийн медиан (world landmarks, метр)
const forearm = dist(world[13], world[15]);
if (Math.abs(forearm - calibrated.forearmL) / calibrated.forearmL > 0.35) markUnreliable(15);
```
- **Зүүн/баруун солигдох** (MediaPipe далдлалтын үед гарын шошгыг сольдог):
```js
// Өмнөх frame-ээс зай: солиход нийт шилжилт эрс багасвал шошго солигдсон гэж үзнэ
const keep = d(prevL, curL) + d(prevR, curR);
const swap = d(prevL, curR) + d(prevR, curL);
if (swap < keep * 0.5) [cur[15], cur[16]] = [cur[16], cur[15]];   // мөн 13↔14
```
- **Бээлий:** гарын 17–22 цэг (хуруу) найдваргүй → ашиглахгүй; бугуй + тохойд тулгуурлах (одоо ингэдэг).
- **Гэрэл муу:** раунд эхлэхийн өмнө кадрын дундаж гэрэлтэлтийг 32×32 болгож хэмжинэ; < 40/255 бол
  "Гэрэл дутуу" сануулга. Одоо `cameraQuality` (бие хэр харагдаж байгаа) л бий.

### 3.2 Хурдан цохилтыг алдах / буруу frame дээр задрах
**Одоогийн байдал:** `lib/punchPhaseDetector.js` — гар тус бүрийн state machine (guard → extending →
retract), тохойн өнцгийн hysteresis (68°/75°), хурд + z-гүн + давхар гарын шүүлтүүр, 220 мс cooldown,
hook-ийн нумын ангилагч. Хэмжилт (`docs/evaluations/punch-baseline.json`, 6 клип, 1 тамирчин, 39 цохилт):
recall **0.897**, precision **1.0**, jab F1 1.0, cross F1 0.84, **hook recall 0.77**.

**Асуудал:** 10 FPS дээр jab-ийн сунгалт (~150–250 мс) **1–2 кадр** л авна → hook/cross алдагдах гол шалтгаан.

**Зөвлөмж (дарааллаар):**
1. **Өгөгдөл эхэлж:** ≥ 20 тамирчин, orthodox + southpaw, утасны камер, frame бүр шошготой — одоогийн
   6 клип ерөнхийлөхөд хангалтгүй. Эзэмшигчийн зөвшөөрөлтэй dataset хэрэгтэй.
2. **Хурдыг 15–20 FPS** (rVFC + 640×480) болгоод, хугацааны босгуудыг (мс) хэвээр, кадрт суурилсан
   EMA-уудыг `α = 1 − exp(−dt/τ)` хэлбэрт шилжүүлнэ (FPS-ээс хамааралгүй).
3. **Оргилын цагийг кадр хооронд тооцох** — цохилтын timestamp = сунгалтын оргил; 3 кадрт парабол таарууллаа:
```js
// d0, d1, d2 = мөрнөөс бугуй хүртэлх зай (t1 нь хамгийн их)
const denom = d0 - 2 * d1 + d2;
const offset = denom === 0 ? 0 : 0.5 * (d0 - d2) / denom;      // −0.5…0.5 кадр
const peakT = t1 + offset * (t2 - t0) / 2;
```
4. **Давхар тоолохгүй:** гар тус бүрт refractory 220 мс (бий); хоёр гарын хооронд хязгааргүй (комбо).
5. **Офлайн регресс:** `scripts/punch-eval` + `evolve:check`-ийн `punch` gate (F1 буурвал REJECT) — бий.

---

## 4. Аюулгүй байдал ба API бүрэн бүтэн байдал

### 4.1 Client талын хуурамч метрикээс сэргийлэх
MediaPipe утсан дээр ажилладаг тул сервер раундыг **дахин тоолж чадахгүй** — үүнийг нуухгүй.
Зорилго: хуурах **ашиггүй**, хуурсан нь **илэрдэг** байх.

**Одоо байгаа (`lib/domain/scoreGuard.js`, `/api/score/session`):**
- XP-г зөвхөн сервер бичнэ (Firestore rules `xp`, `dailyStreak`… талбарыг client-ээс хаасан).
- Сесс: эзэмшигч, оноо 0–10, хадгалснаас хойш ≤ 30 мин, ≥ 3 цохилт, нэг удаа л XP, өдөрт ≤ 10 XP сесс.
- **Шинэ:** физикийн хязгаар — **секундэд > 6 цохилт** эсвэл раунд **5–900 сек**-ээс гадуур бол XP 0
  (`implausible_punches`, `implausible_duration`; 3 тест).

**Нэмэх (ач холбогдлоор):**
1. **Firebase App Check** — хүсэлт жинхэнэ апп-аас ирсэн эсэх (script-ээр шууд API дуудахыг хаана):
```js
// client (lib/firebaseApp.js)
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(SITE_KEY), isTokenAutoRefreshEnabled: true });
// server (/api/score/session): X-Firebase-AppCheck header-ийг Admin SDK-ээр шалгана
await getAppCheck().verifyToken(req.headers.get("x-firebase-appcheck"));
```
2. **Раундын nonce** — `/api/round/start` сервер цаг + nonce өгнө; хадгалахад `durationSeconds ≤ серверийн
   хэмжсэн хугацаа + 5 сек` байх ёстой. Урьдчилан бэлдсэн "төгс" сессийг хаана.
3. **Серверт landmark replay (хамгийн хүчтэй):** детектор цэвэр JS тул сервер дээр яг адил ажиллана.
   Санамсаргүй 5% сесс (эсвэл тэргүүлэгчдийн жагсаалтад орох бүх сесс) шахсан landmark урсгалаа
   (≈ 33×3 тоо × 10 FPS × 60 сек ≈ 60 KB) илгээж, сервер `PunchPhaseDetector`-оор дахин тоолно;
   зөрүү > 20% бол XP-г хүлээлгэнэ. ⚠️ Landmark нь биометрийн шинжтэй өгөгдөл → нууцлалын бодлогод
   нэмж, зөвшөөрөл авч, 30 хоногт устгана.
4. **Статистик аномали:** хэрэглэгчийн өөрийн түүхтэй харьцуулсан z-score (оноо, цохилт/сек) > 3 бол
   *тэмдэглэнэ* (татгалзахгүй), admin шалгана.
5. **Шагнал/мөнгийг** client-ийн метрикт шууд холбохгүй (тэргүүлэгчдийн жагсаалт нуугдсан нь зөв).

### 4.2 Firebase Auth / Firestore / Storage — best practice ба GAVANA-гийн төлөв
| Practice | Төлөв |
|---|---|
| Default deny, collection бүрт тодорхой дүрэм | ✅ (`billing/`, `usage/` зөвхөн сервер — client дүрэмгүй) |
| Хамгаалагдсан талбар (xp, subscription, isAdmin…) client-ээс засагдахгүй | ✅ rules + 43 emulator тест |
| Хувийн өгөгдөл тусдаа (email → `users_private`, эзэмшигч л) | ✅ |
| Storage: эзэмшигч л бичнэ, contentType + хэмжээ | ✅ (`70bee4d`) |
| Admin SDK түлхүүр зөвхөн серверт | ✅ (`FIREBASE_SERVICE_ACCOUNT_BASE64`) |
| Rules тест CI-д | ✅ (`npm run test:rules`, GitHub Actions) |
| App Check enforcement | ❌ (дээрх 1) |
| **`training_sessions` уншилт** | ❌ **P0:** `allow read: if true` — нэвтрээгүй хэн ч бүх хэрэглэгчийн бэлтгэл, pose хэмжилтийг уншиж чадна. Нууцлалын бодлогын "бусдад харагдахгүй" гэдэгтэй зөрчилдөнө. |
| `user_training_profile` уншилт | ⚠️ `if true` |

**P0 засвар (санал — эзэмшигч deploy хийнэ):**
```
match /training_sessions/{sessionId} {
  allow read: if isAuth() && resource.data.userId == request.auth.uid;   // эзэмшигч л
  …
}
```
Нөлөө: бусдын нийтийн профайл XP/цолыг одоо тэдний сессээс тооцдог (`profile/[userId]`,
`useProfileSecondaryData`). Шилжилт: сервер `users/{uid}`-д `publicStats {xp, rankKey, sessions,
bestScore}` бичдэг болгоод, нийтийн профайл зөвхөн түүнийг уншина; дараа нь дүрмийг deploy хийнэ.
Rules тест: "өөр хэрэглэгч / нэвтрээгүй уншиж чадахгүй" гэсэн 2 кейс нэмнэ.

---

## 5. Автомат тест (Vitest = Jest-тэй ижил API, Playwright)

### 5.1 Хийгдсэн, ажиллаж байгаа
| Тест | Файл | Юуг баталдаг | Үр дүн |
|---|---|---|---|
| Unit | `tests/landmarkFilter.test.js` | One-Euro (jitter, хурдан хөдөлгөөн, dt=0), далдлалт барих/reset, NaN | 7/7 |
| Unit | `tests/overlayGeometry.test.js` | `object-fit: cover` mapping (640×480 → 360×700), тайралт | 2/2 |
| Unit | `tests/scoreGuard.test.js` | Хуурамч сесс: эзэмшигч, хугацаа, давхар, **физик хязгаар** | 14/14 |
| Регресс | `scripts/punch-eval` (`evolve:check` punch gate) | Шошготой клип дээр F1, recall, phantom | F1 0.904 |
| **E2E CV** | `tests/cv/pose-overlay.spec.mjs` | Камер → MediaPipe → шүүлтүүр → canvas overlay → раундын үр дүн | **2/2** |
| Visual | `tests/visual/*` | 60 дэлгэц (360/390 px, MN/KO) | 60/60 |

**E2E CV хэрхэн ажилладаг:** Chromium-ийн fake камер (`--use-file-for-fake-video-capture`) нь
`tests/fixtures/cv/synthetic-boxer.mp4`-г тоглуулна — **өөрсдийн 3D тамирчны** jab–cross анимаци
(бодит хүн, хувийн бичлэг биш; `scripts/cv/make-synthetic-boxer.mjs` дахин үүсгэнэ). Бээлий нүүрийг
халхалсан guard байрлал тул далдлалтын edge case-ийг давхар шалгана.
```bash
npm run test:cv                 # build + server + 2 тест
CV_MIN_FPS=8 npm run test:cv    # бодит GPU-тэй машин дээр FPS-ийн босго
```
Гол хэсэг (бүтнээр нь файлаас):
```js
await page.goto("/en/train?debug=1&autostart=1&drill=jab-minute");
const overlay = page.getByTestId("pose-overlay");
await expect(page.getByText(/DETECTED \(\d+\)/)).toBeVisible({ timeout: 60_000 });   // MediaPipe ажиллав
await expect.poll(async () => Number(await overlay.getAttribute("data-frames-drawn")) || 0)
  .toBeGreaterThanOrEqual(10);                                                       // шинэ pose бүрт зурав
const painted = await overlay.evaluate((c) => {                                      // canvas хоосон биш
  const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  let n = 0; for (let i = 3; i < d.length; i += 64) if (d[i] > 0) n++; return n;
});
expect(painted).toBeGreaterThan(20);
```
Энэ орчинд (GPU-гүй) хэмжсэн: landmark 33/33, FPS 2–3, синтетик раундад 6–11 цохилт таниглагдсан
(jab/cross/hook). Бодит утсан дээрх FPS-ийг `CV_MIN_FPS=8`-аар баталгаажуулах шаардлагатай.

### 5.2 Unit тестийн жишээ (Jest/Vitest) — overlay ба шүүлтүүр
```js
import { createLandmarkFilter } from "@/lib/pose/landmarkFilter";
it("бээлий бугуйг халхлахад сүүлийн байрлалыг барина", () => {
  const lf = createLandmarkFilter({ maxGapMs: 400 });
  const pose = (x, vis = 0.9) => Array.from({ length: 33 }, () => ({ x, y: 0.5, z: 0, visibility: vis }));
  for (let t = 0; t <= 500; t += 100) lf.filter(pose(0.5), t);
  const out = lf.filter(pose(0.9, 0.1), 600);          // хог утга, бага visibility
  expect(out[15].held).toBe(true);
  expect(out[15].x).toBeCloseTo(0.5, 2);
});
```

### 5.3 Reel feed-ийн санах ойн тест (жишээ — feed CORE_MODE-д нуугдсан тул одоо ажиллуулаагүй)
```js
test("100 swipe-ийн дараа media элемент ба heap тогтвортой", async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  await page.goto("/mn/reels");
  const heap = async () => (await cdp.send("Performance.getMetrics")).metrics
    .find((m) => m.name === "JSHeapUsedSize").value / 1e6;
  const before = await heap();
  for (let i = 0; i < 100; i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(250); }
  await cdp.send("HeapProfiler.collectGarbage");
  expect(await page.locator("video").count()).toBeLessThanOrEqual(4);
  expect(await heap() - before).toBeLessThan(20);
});
```

---

## Дүгнэлт ба дараалал
| Ач холбогдол | Ажил | Хэн |
|---|---|---|
| **P0** | `training_sessions` нийтэд уншигддаг → `publicStats` руу шилжүүлээд дүрмийг эзэмшигчид хязгаарлах | Код (Claude) + deploy (эзэмшигч) |
| P1 | Бодит утсан дээр `CV_MIN_FPS=8 npm run test:cv`; камер 640×480 + rVFC | Эзэмшигчийн утас + код |
| P1 | App Check + раундын nonce | Код + Firebase console |
| P1 | Цохилтын dataset (≥ 20 тамирчин, зөвшөөрөлтэй) → hook/cross recall | Эзэмшигч + код |
| P2 | Web Worker inference, ясны урт / L-R солилт засвар | Код |
| P2 | Fight Knowledge Graph (`techniqueStats`) | Код |
| P3 | Reel feed: cursor pagination (CORE_MODE нээх үед) | Код |

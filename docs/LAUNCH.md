# GAVANA — зах зээлд гаргах заавар (Launch checklist)

Код бэлэн: `claude/review-refactor-code-DUmiX` branch (тест: unit 277+, visual 60/60, rules 43/43).
Доорх алхмуудыг **эзэмшигч** хийнэ — production deploy, төлбөр, нууц түлхүүрүүд Claude-ийн эрхэд
ордоггүй. Дарааллыг баримтлаарай.

---

## 1. Код production руу

1. Branch-ыг review хийгээд `main` руу merge хийнэ (PR-аар).
2. Vercel → Project → Deployments: `main`-ийн deploy амжилттай болсныг шалгана.
   Буцаах хэрэг гарвал: Vercel → өмнөх deploy → **Instant Rollback**.

## 2. Vercel → Settings → Environment Variables (Production)

| Нэр | Юунд | Заавал |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | XP, дараалал, өдрийн даалгаврыг сервер бичнэ; Stripe идэвхжүүлэлт; AI квот | ✅ |
| `OPENAI_API_KEY` | AI коуч, раундын дүгнэлт, 7 хоногийн төлөвлөгөө | ✅ |
| `ADMIN_UIDS` (таслалаар), `ADMIN_SESSION_SECRET` (урт санамсаргүй) | Admin хуудсууд | ✅ |
| `NEXT_PUBLIC_SITE_URL` | Өөрийн домэйн бол (жишээ `https://gavana.mn`) — share, sitemap | Домэйнтэй бол |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PRO_YEARLY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | GAVANA Pro | Pro зарах үед |

**Тохируулж болохгүй:** `NEXT_PUBLIC_VISUAL_FIXTURES` (зөвхөн тест), `NEXT_PUBLIC_CORE_MODE=false`
(нуусан нийгмийн хэсгүүд нээгдэнэ — хяналт/модерацигүй).

Шалгах: deploy-ийн дараа `/mn/admin/evolution` → **Launch readiness** хэсэгт бүгд `OK` байх ёстой
(утгыг харуулдаггүй, зөвхөн байгаа эсэх).

## 3. Firebase (дарааллаараа)

```bash
firebase login
firebase use gavana-boxing-89a22
# 1) Индексүүд ба Storage дүрэм
firebase deploy --only firestore:indexes,storage
# 2) Vercel дээр FIREBASE_SERVICE_ACCOUNT_BASE64 тавьж, нэг раунд хийгээд XP орж байгааг шалгасны ДАРАА:
firebase deploy --only firestore:rules
# 3) Буцаан татах push функцууд (өдөр бүр 18:00 / winback)
firebase deploy --only functions
```
- Индексүүдэд dashboard-ын `video_analyses`, `orders` (userId + createdAt) орсон; rules-д `video_analyses`
  (зөвхөн эзэмшигч), `orders` (эзэмшигч уншина, сервер бичнэ), `products` / `benchmarks` (нийтэд уншина),
  `users.stats` (сервер л бичнэ) нэмэгдсэн — `npm run test:rules` 72/72.
- Firebase Console → Authentication → Settings → **Authorized domains**: production домэйноо нэмнэ
  (Google нэвтрэлт үүнгүйгээр ажиллахгүй).
- Firestore дүрэм XP-г зөвхөн сервер бичихийг шаарддаг — 2-р алхмын дарааллыг алгасвал раунд
  хадгалагдахгүй.

## 4. OpenAI

- platform.openai.com → Limits: **сарын төсвийн дээд хязгаар** тавина (жишээ $50).
- Үнэгүй хэрэглэгч өдөрт 10 чат мессеж + 20 раундын дүгнэлт (сервер хянана) — зардал хязгаарлагдсан.

## 5. GAVANA Pro (зарахаар шийдсэн үед)

1. Stripe → Products → **GAVANA Pro**: үнэ **9,900 MNT / сар**, **79,000 MNT / жил** (recurring).
   Үнийг өөрчилбөл `lib/pro.js`-ийг ч мөн адил өөрчилнө.
2. Price ID-уудыг `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PRO_YEARLY`-д.
3. Stripe → Webhooks → endpoint `https://<домэйн>/api/stripe/webhook`, үйлдлүүд:
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted` → signing secret-ийг `STRIPE_WEBHOOK_SECRET`-д.
4. Stripe → Settings → Billing → **Customer portal**: цуцлах, карт солихыг асаана.
5. Test mode-оор нэг удаа худалдаж аваад `/mn/pro` дээр "GAVANA Pro идэвхтэй" гарч, "Гишүүнчлэл
   удирдах"-аар цуцлагдахыг шалгана.
6. Бүх зүйл тохирох хүртэл `/pro` "Төлбөр удахгүй нээгдэнэ" гэж харуулна — мөнгө авчихаад Pro
   өгөхгүй байх нөхцөл байхгүй.

## 6. Хууль, холбоо барих

- `privacy@gavana.app` — **бодит, уншдаг** имэйл байх ёстой (нууцлалын бодлого, устгах хүсэлт). Өөр
  хаяг бол `app/[locale]/privacy/page.js`, `terms/page.js`-д солино.
- Нууцлалын бодлого, нөхцөл MN/KO/EN — кодтой нийцсэн (2026-11-08).
- Боксчдын бодит зураг апп-д байхгүй (эрхгүй тул устгасан).

## 7. Deploy-ийн дараах шалгалт (утсаар, 15 мин)

| # | Шалгах | Хүлээгдэх |
|---|---|---|
| 1 | iPhone Safari, Android Chrome дээр `/mn` → "Үнэгүй раунд эхлүүлэх" | Камер асна, 20 сек раунд, үр дүн |
| 2 | Нэвтрэх (Google) → раунд хийх | XP нэмэгдэнэ, Ахиц хуудсанд харагдана |
| 3 | Facebook/Instagram дотроос холбоос нээх | "Хөтөчөөр нээ" анхааруулга |
| 4 | Коуч → чат 2–3 асуулт | Монголоор хариулна |
| 5 | Ахиц → Сорилтын тест → Хурдны тест | Дууссаны дараа "Шилдэг" харагдана |
| 6 | `/mn/admin/evolution` | Launch readiness бүгд OK |
| 7 | KO, EN хэлээр landing | Орчуулга зөв |

## 8. Launch-ийн дараа хянах

- **Алдаа:** хэрэглэгчийн browser-ийн алдаа `analytics_events` цуглуулгад `client_error`
  нэрээр (`meta` = хаана:мессеж) бичигдэнэ. Сервер талын алдаа: Vercel → Logs.
- **Funnel:** `/api/admin/funnel` (admin) — landing → раунд → бүртгэл.
- **Зардал:** OpenAI usage, Firebase usage (Blaze төлөвлөгөө бол budget alert тавина).
- Firebase Console → Firestore → Usage: өдрийн уншилт/бичилт.

## 9. Мэдэгдэж буй хязгаарлалт (launch-д саад биш)

- Цохилт тоолох загвар нэг тамирчны бичлэг дээр тохируулагдсан (macro F1 0.904); uppercut танихгүй.
- Нэг зургаас stance тодорхойлохыг бодит хүний зургаар туршаагүй — дүнг хэрэглэгч засах боломжтой.
- Lighthouse (симуляц) хурдны оноо 56–77; бодит удаан 4G дээр LCP 1.0–2.5 сек.
- Дизайн өнгө, хэмжээ гурван эх сурвалжтай (дараагийн цэвэрлэгээ).
- Хувийн бичлэгтэй branch-ууд (punch-clips*, coach-clips)-ыг GitHub-аас устгахыг зөвлөж байна.

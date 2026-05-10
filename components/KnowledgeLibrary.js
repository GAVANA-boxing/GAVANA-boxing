"use client";

import { useMemo } from "react";
import { translate } from "@/lib/i18n";
import ScrollRow from "@/components/ScrollRow";

// ─── English content ──────────────────────────────────────────────────────────

const EN_STYLES = [
  {
    key: "pressure",
    emoji: "💥",
    name: "Pressure Fighter",
    tag: "Aggressive",
    tagColor: "#ef4444",
    desc: "Walks opponents down, controls range with volume. Conditioning is the weapon.",
    strengths: ["High punch output", "Wears opponents down", "Dictates the pace"],
    weaknesses: ["Exposed to counters", "Predictable forward path", "Tires if unconditioned"],
    practice: "Heavy bag: 3×3min all-out pressure. Stay tight, no wasted motion.",
  },
  {
    key: "counter",
    emoji: "🎯",
    name: "Counter Puncher",
    tag: "Patient",
    tagColor: "#60a5fa",
    desc: "Waits for openings, punishes mistakes. Economy of movement is the art.",
    strengths: ["Efficient shot selection", "Sharp reaction timing", "Stays composed"],
    weaknesses: ["Passive early rounds", "Risky against high-volume fighters", "Can look inactive"],
    practice: "Slip-and-counter drill: slip the jab, return the cross — 3×2min.",
  },
  {
    key: "technical",
    emoji: "📐",
    name: "Technical Boxer",
    tag: "Precise",
    tagColor: "#a78bfa",
    desc: "Clean guard, precise fundamentals, disciplined output. Quality over quantity.",
    strengths: ["Clean technique", "Disciplined guard", "Hard to hit cleanly"],
    weaknesses: ["Lower output volume", "Slower to adapt in scrambles", "Predictable patterns"],
    practice: "Jab-cross-hook: 100 reps clean form, guard up every rep.",
  },
  {
    key: "footwork",
    emoji: "👟",
    name: "Footwork Fighter",
    tag: "Elusive",
    tagColor: "#34d399",
    desc: "Movement IS the offense. Creates angles, makes opponents miss, controls space.",
    strengths: ["Elusive target", "Great angle creation", "Forces opponent to overcommit"],
    weaknesses: ["Less power from movement", "Can look too defensive", "Flat feet when planting"],
    practice: "Lateral step-and-jab: punch out of every pivot — 3×90s.",
  },
  {
    key: "southpaw",
    emoji: "🔄",
    name: "Southpaw",
    tag: "Unorthodox",
    tagColor: "#f59e0b",
    desc: "Left-hand dominant stance creates confusion. The left cross is the power weapon.",
    strengths: ["Awkward angles for orthodox fighters", "Left cross is the money shot", "Unique stance"],
    weaknesses: ["Right jab often underused", "Vulnerable on the outside", "Gets caught stepping same side"],
    practice: "Step right, pivot, left cross — 3×2min. Get off the center line.",
  },
  {
    key: "longrange",
    emoji: "📏",
    name: "Long Range Striker",
    tag: "Rangey",
    tagColor: "#fb923c",
    desc: "Uses reach and distance to control. Jab is the weapon, movement is the defense.",
    strengths: ["Controls fight with jab", "Difficult to get inside on", "Uses footwork to stay safe"],
    weaknesses: ["Less effective in close", "Struggles when backed to the ropes", "Jab must be sharp"],
    practice: "Double jab, step back, reset — 3×2min. Never let them close the gap.",
  },
  {
    key: "inside",
    emoji: "🤛",
    name: "Inside Fighter",
    tag: "Close Range",
    tagColor: "#f87171",
    desc: "Works best in the pocket. Short punches, hooks, uppercuts, body work.",
    strengths: ["Dangerous in close range", "Good body work", "Neutralizes reach advantage"],
    weaknesses: ["Vulnerable outside", "Must get past the jab", "Can get held/tied up"],
    practice: "Body-head uppercut: get in tight, dig to body, come upstairs — 50 reps.",
  },
];

const EN_TECHNIQUES = [
  {
    key: "jab",
    emoji: "👊",
    name: "Jab",
    color: "#f59e0b",
    what: "Lead-hand straight punch. Your range tool, setup shot, and distance checker.",
    mistake: "Pushing instead of snapping — slow, telegraphed, easy to catch.",
    drill: "50 jabs at mirror: snap and return to guard. Don't push.",
  },
  {
    key: "cross",
    emoji: "✋",
    name: "Cross",
    color: "#ef4444",
    what: "Rear-hand straight punch. Your power shot — rotate the hip all the way through.",
    mistake: "Arm punching — no hip rotation, no real power.",
    drill: "Cross with hip rotation: slow × 30 (feel it), then speed × 30.",
  },
  {
    key: "hook",
    emoji: "↩️",
    name: "Hook",
    color: "#a78bfa",
    what: "Short arc punch, lead or rear. Pivot the foot, elbow at shoulder height.",
    mistake: "Looping wide and high — telegraphed and loses power.",
    drill: "Pivot-hook drill: step lead foot 45°, throw hook, reset — × 20 each side.",
  },
  {
    key: "uppercut",
    emoji: "⬆️",
    name: "Uppercut",
    color: "#60a5fa",
    what: "Upward punch that travels under the guard. Drive from the legs, not just arms.",
    mistake: "Dropping hand too low to set it — gives away the shot.",
    drill: "Body-head uppercut combo: dig body, come upstairs — 50 reps, keep it tight.",
  },
  {
    key: "slip",
    emoji: "🛡️",
    name: "Slip",
    color: "#34d399",
    what: "Move head offline to avoid a punch. Slip outside the jab, slip inside the cross.",
    mistake: "Slipping backwards (leaning back) instead of offline — still in the way.",
    drill: "Slip-and-counter: slip outside the jab, return with your cross — 3×2min.",
  },
  {
    key: "pivot",
    emoji: "🔄",
    name: "Pivot",
    color: "#fb923c",
    what: "Rotate on the lead foot to change angle. Gets you offline and creates new attack angles.",
    mistake: "Hopping instead of pivoting — loses balance and takes longer.",
    drill: "Step-pivot-jab: lead foot 45°, pivot, jab — × 20 each direction.",
  },
  {
    key: "guard",
    emoji: "🛡️",
    name: "Guard",
    color: "#9ca3af",
    what: "High hands protecting head and chin. Active guard moves with the opponent — not frozen.",
    mistake: "Dropping hands between punches, or after throwing combos.",
    drill: "After every combo in any drill: freeze and check both hands are up before moving.",
  },
  {
    key: "footwork",
    emoji: "👟",
    name: "Footwork",
    color: "#34d399",
    what: "How you move inside the ring. Controls distance, creates angles, enables defense.",
    mistake: "Flat feet and big steps — slow, heavy, easy to time.",
    drill: "Lateral shadow box: step-punch-step, stay on toes — 5min continuous.",
  },
  {
    key: "timing",
    emoji: "⏱️",
    name: "Timing",
    color: "#fbbf24",
    what: "The rhythm between you and the opponent. Slow is smooth, smooth is fast.",
    mistake: "Rushing — throwing before the opening fully appears.",
    drill: "Timing bag: wait for second swing, counter — 3×2min. Don't rush it.",
  },
  {
    key: "combo",
    emoji: "💥",
    name: "Combo Setup",
    color: "#f87171",
    what: "Using one punch to set up the next. The jab creates the opening; the power shot scores.",
    mistake: "Throwing the same combo every time — opponents adjust fast.",
    drill: "Pick 3 combos. Alternate between them randomly. 3×2min, no pattern.",
  },
];

const EN_COUNTRY_STYLES = [
  {
    flag: "🇲🇽",
    name: "Mexican Style",
    tagline: "Heart over everything",
    color: "#ef4444",
    desc: "Pressure-first, heavy body work, high chin warrior mentality. Built to take a punch and keep coming forward.",
  },
  {
    flag: "🇨🇺",
    name: "Cuban / Soviet Style",
    tagline: "Technical perfection",
    color: "#60a5fa",
    desc: "Disciplined fundamentals, clean stance, sharp jab. Built on footwork and angles — counterpunching at its finest.",
  },
  {
    flag: "🇺🇸",
    name: "American Style",
    tagline: "Slick counter boxing",
    color: "#a78bfa",
    desc: "Defense-first, elusive movement, explosive counters. The sweet science as entertainment — always a way out.",
  },
  {
    flag: "🇯🇵",
    name: "Japanese Style",
    tagline: "Discipline and speed",
    color: "#f97316",
    desc: "High training volume, sharp hand speed, relentless dedication. Speed and discipline over brute power.",
  },
  {
    flag: "🇹🇭",
    name: "Muay Thai Style",
    tagline: "8-limb pressure",
    color: "#10b981",
    desc: "Full-body weapons — fists, elbows, knees, kicks. Clinch control and forward pressure are core identity.",
  },
  {
    flag: "🇲🇳",
    name: "Mongolian Style",
    tagline: "Iron will, wrestler's base",
    color: "#fbbf24",
    desc: "Wrestling influence creates a physical, relentless approach. Exceptional toughness and conditioning — built for the long fight.",
  },
];

const EN_COMMON_MISTAKES = [
  { emoji: "⚠️", mistake: "Guard drops after combos", fix: "Reset hands before your feet move. Make it a habit." },
  { emoji: "⚠️", mistake: "Flat-footed stance", fix: "Stay on the balls of your feet. Weight forward, ready to move." },
  { emoji: "⚠️", mistake: "Arm punching (no hip rotation)", fix: "Power comes from the floor — legs → hips → shoulder → fist." },
  { emoji: "⚠️", mistake: "Looking down during exchanges", fix: "Eyes forward always. You can't defend what you don't see." },
  { emoji: "⚠️", mistake: "Rushing combos when tense", fix: "Breathe. Slow down. Clean combos score more than rushed flurries." },
  { emoji: "⚠️", mistake: "Leaning back instead of slipping", fix: "Go offline — not backwards. Slipping keeps you in range to counter." },
  { emoji: "⚠️", mistake: "Telegraphing shots (big windup)", fix: "Short setup. The less they see it coming, the more it lands." },
];

const EN_WEEKLY_FOCUS = [
  { day: "Sunday",    emoji: "🛡️", focus: "Defense day",        desc: "Slipping, rolling, guard work. Active rest with intent.",                    drill: "10min shadow: every third combo, slip twice before resetting." },
  { day: "Monday",    emoji: "👊", focus: "Jab & Cross",        desc: "Build your foundation. The 1-2 is the base of everything.",                  drill: "100 jab-cross with guard reset. Clean, not fast." },
  { day: "Tuesday",   emoji: "👟", focus: "Footwork & Angles",  desc: "Move to score. Punch out of every pivot today.",                             drill: "Step-pivot-jab × 20 each direction. Stay on toes." },
  { day: "Wednesday", emoji: "💥", focus: "Power Combos",       desc: "Hook and uppercut day. Drive from the legs.",                                drill: "Body-head-uppercut: 3×3min on heavy bag. Full hip rotation." },
  { day: "Thursday",  emoji: "⏱️", focus: "Timing & Rhythm",   desc: "Slow down to speed up. Find the tempo.",                                     drill: "Timing bag: wait for second swing, counter — 3×2min." },
  { day: "Friday",    emoji: "🔥", focus: "Full Combo Drills",  desc: "Put it all together. Varied combos, no patterns.",                           drill: "3 combos, alternate randomly: 3×2min. Finish with guard every time." },
  { day: "Saturday",  emoji: "🧠", focus: "Technique Review",   desc: "Film yourself or work with a mirror. What needs fixing?",                    drill: "Pick your weakest technique. 10min focused work on it only." },
];

// ─── Mongolian content ────────────────────────────────────────────────────────

const MN_STYLES = [
  {
    key: "pressure",
    emoji: "💥",
    name: "Pressure Fighter",
    tag: "Aggressive",
    tagColor: "#ef4444",
    desc: "Өрсөлдөгчийг урагш шахаж, олон combo-оор дарамт учруулдаг. Conditioning — хамгийн чухал зэвсэг.",
    strengths: ["Өндөр цохилтын тоо", "Өрсөлдөгчийг ядраадаг", "Тулааны хурдыг өөрөө тодорхойлдог"],
    weaknesses: ["Counter-т өртөмтгий", "Урагш явах зам тааруулгатай", "Conditioning муу бол хурдан ядардаг"],
    practice: "Heavy bag: 3×3min бүрэн pressure. Нягт бай, хэрэлгүй хөдөлгөөнгүй.",
  },
  {
    key: "counter",
    emoji: "🎯",
    name: "Counter Puncher",
    tag: "Patient",
    tagColor: "#60a5fa",
    desc: "Завсрыг хүлээж, алдаагаа шийтгэдэг. Хөдөлгөөний хэмнэл бол энэ загварын урлаг.",
    strengths: ["Үр дүнтэй цохилт сонгодог", "Хурдан reaction timing", "Тайван байдлаа хадгалдаг"],
    weaknesses: ["Эхний раундад идэвхгүй харагддаг", "Их хэмжээний цохилт буудаг тамирчдад эрсдэлтэй", "Идэвхгүй мэт харагдаж болно"],
    practice: "Slip-and-counter drill: jab-г slip хийж, cross буцаа — 3×2min.",
  },
  {
    key: "technical",
    emoji: "📐",
    name: "Technical Boxer",
    tag: "Precise",
    tagColor: "#a78bfa",
    desc: "Цэвэр guard, нарийн үндэс суурь, сахилгатай гаралт. Тоо биш чанарыг эрхэмлэдэг.",
    strengths: ["Цэвэр technique", "Сахилгатай guard", "Цохиход хэцүү байдаг"],
    weaknesses: ["Цохилтын тоо бага", "Scramble-д дасан зохицоход удаан", "Давтагдах pattern"],
    practice: "Jab-cross-hook: 100 давтлага цэвэр хэлбэрээр, guard бүр дээр.",
  },
  {
    key: "footwork",
    emoji: "👟",
    name: "Footwork Fighter",
    tag: "Elusive",
    tagColor: "#34d399",
    desc: "Хөдөлгөөн өөрөө довтолгоо болдог. Өнцөг бүтээж, miss хийлгэж, зайг хянадаг.",
    strengths: ["Барихад хэцүү байдаг", "Өнцөг бүтээх чадвар өндөр", "Өрсөлдөгчийг хэт зарцуулдаг"],
    weaknesses: ["Хөдөлгөөнөөс цохилтын хүч буурдаг", "Хэт хамгаалалтын харагддаг", "Тогтохдоо хөлөө хавтгайрдаг"],
    practice: "Хажуу алхам-jab: pivot болгоноос цохилт хийх — 3×90s.",
  },
  {
    key: "southpaw",
    emoji: "🔄",
    name: "Southpaw",
    tag: "Unorthodox",
    tagColor: "#f59e0b",
    desc: "Зүүн гар давамгайлсан stance өрсөлдөгчийг эргэлзүүлдэг. Зүүн cross бол гол цохилт.",
    strengths: ["Orthodox тамирчдад хэцүү өнцөг", "Зүүн cross бол шийдвэрлэх цохилт", "Өвөрмөц stance"],
    weaknesses: ["Баруун jab ихэвчлэн дутуу ашиглагддаг", "Гаднаас довтлоход өртөмтгий", "Нэг тал руу алхахад баригддаг"],
    practice: "Баруун тийш алхаж, pivot хийж, зүүн cross — 3×2min. Төв шугамаас гар.",
  },
  {
    key: "longrange",
    emoji: "📏",
    name: "Long Range Striker",
    tag: "Rangey",
    tagColor: "#fb923c",
    desc: "Хүрэлцээ болон зайгаар хянадаг. Jab бол зэвсэг, footwork бол хамгаалалт.",
    strengths: ["Jab-аар тулаан хянадаг", "Дотор нь оруулахад хэцүү", "Аюулгүй байхад footwork ашигладаг"],
    weaknesses: ["Ойр зайд үр дүнгүй", "Rope-д нугархай болдог", "Jab нь хурц байх ёстой"],
    practice: "Давхар jab, арагш алхам, reset — 3×2min. Зайг ойртуулж болохгүй.",
  },
  {
    key: "inside",
    emoji: "🤛",
    name: "Inside Fighter",
    tag: "Close Range",
    tagColor: "#f87171",
    desc: "Ойр зайд хамгийн сайн ажилладаг. Богино цохилт, hook, uppercut, биеийн ажил.",
    strengths: ["Ойр зайд аюултай", "Биеийн ажил сайн", "Хүрэлцээний давуу талыг устгадаг"],
    weaknesses: ["Гадна талд өртөмтгий", "Jab-г давж гарах ёстой", "Баригдаж чадна"],
    practice: "Бие-толгой uppercut: ойрхон ор, биед цох, дээш гар — 50 давтлага.",
  },
];

const MN_TECHNIQUES = [
  {
    key: "jab",
    emoji: "👊",
    name: "Jab",
    color: "#f59e0b",
    what: "Зай барих, setup хийх, tempo олох үндсэн цохилт.",
    mistake: "Snap биш push — удаан, урьдчилан харагдаж, барихад хялбар.",
    drill: "Mirror дээр 50 jab: snap хийж, guard руу хурдан буцаа.",
  },
  {
    key: "cross",
    emoji: "✋",
    name: "Cross",
    color: "#ef4444",
    what: "Арын гараар шулуун цохих хүчтэй цохилт. Бүсийг бүрэн эргүүл.",
    mistake: "Зөвхөн гараар цохих — бүс эргэхгүй, хүч байхгүй.",
    drill: "Cross бүсний эргэлттэй: удаан × 30 (мэдрэх), дараа хурдан × 30.",
  },
  {
    key: "hook",
    emoji: "↩️",
    name: "Hook",
    color: "#a78bfa",
    what: "Богино нуман цохилт, өмнөд эсвэл арын гараар. Хөл pivot хийж, тохой мөрний өндөрт байна.",
    mistake: "Өргөн, өндөр нум — урьдчилан харагдаж, хүч алддаг.",
    drill: "Pivot-hook drill: өмнөд хөлийг 45° эргүүлж, hook цох, reset — × 20 тал бүрт.",
  },
  {
    key: "uppercut",
    emoji: "⬆️",
    name: "Uppercut",
    color: "#60a5fa",
    what: "Guard доогуур дээш чиглэсэн цохилт. Зөвхөн гараас биш хөлнөөс хөдөлгөөнийг эхлүүл.",
    mistake: "Хэт доош бэлтгэл хийх — цохилтыг урьдчилан илчилдэг.",
    drill: "Бие-толгой uppercut combo: биед цох, дээш гар — 50 давтлага, нягт бай.",
  },
  {
    key: "slip",
    emoji: "🛡️",
    name: "Slip",
    color: "#34d399",
    what: "Цохилтоос зайлахын тулд толгойг шугамаас гаргах. Jab-ийн гаднаас, cross-ийн дотроос slip хийх.",
    mistake: "Арагш буцах (арагш хазайх) — шугам дээр хэвээр, хамгаалалт болдоггүй.",
    drill: "Slip-and-counter: jab-ийн гаднаас slip хийж, cross буцаа — 3×2min.",
  },
  {
    key: "pivot",
    emoji: "🔄",
    name: "Pivot",
    color: "#fb923c",
    what: "Өмнөд хөл дээр эргэж өнцгийг өөрчлөх. Шугамаас гарч, шинэ довтолгооны өнцөг бүтээдэг.",
    mistake: "Pivot биш үсрэх — тэнцвэр алдаж, цаг алддаг.",
    drill: "Алхам-pivot-jab: өмнөд хөл 45°, pivot, jab — × 20 тал бүрт.",
  },
  {
    key: "guard",
    emoji: "🛡️",
    name: "Guard",
    color: "#9ca3af",
    what: "Толгой болон эрүүг хамгаалах өндөр гар. Идэвхтэй guard өрсөлдөгчтэй хамт хөдөлдөг — хөлдсөн биш.",
    mistake: "Цохилтын хооронд, эсвэл combo цохисны дараа гараа буулгах.",
    drill: "Дурын drill-д combo болгоны дараа: хоёр гар өргөгдсөн эсэхийг шалгаж, дараа хөдөл.",
  },
  {
    key: "footwork",
    emoji: "👟",
    name: "Footwork",
    color: "#34d399",
    what: "Рингийн дотор хэрхэн хөдөлдөг арга. Зайг хянаж, өнцөг бүтээж, хамгаалалтыг боломжтой болгодог.",
    mistake: "Хавтгай хөл, том алхам — удаан, хүнд, timing хялбар.",
    drill: "Хажуу shadow box: алхам-цохилт-алхам, хөлийн чинэ дээр — 5min тасралтгүй.",
  },
  {
    key: "timing",
    emoji: "⏱️",
    name: "Timing",
    color: "#fbbf24",
    what: "Чи болон өрсөлдөгчийн хоорондох хэмнэл. Удаан бол жигд, жигд бол хурдан.",
    mistake: "Яаруулах — завсар бүрэн нээгдэхээс өмнө цохих.",
    drill: "Timing bag: хоёр дахь дүүжлэгийг хүлээж, counter — 3×2min. Яарах хэрэггүй.",
  },
  {
    key: "combo",
    emoji: "💥",
    name: "Combo Setup",
    color: "#f87171",
    what: "Нэг цохилтоор дараагийнхыг setup хийх. Jab завсрыг нээдэг; хүчтэй цохилт оноо авдаг.",
    mistake: "Дандаа нэг combo хаяж байх — өрсөлдөгч хурдан дасан зохицдог.",
    drill: "3 combo сонго. Санамсаргүй ялгаж хэрэглэ. 3×2min, pattern гаргаж болохгүй.",
  },
];

const MN_COUNTRY_STYLES = [
  {
    flag: "🇲🇽",
    name: "Mexican Style",
    tagline: "Heart over everything",
    color: "#ef4444",
    desc: "Урагш pressure, хүнд биеийн ажил, өндөр эрүүтэй дайчны сэтгэлгээ. Цохилт авч, урагшаа үргэлжлүүлэхийн тулд бүтээгдсэн.",
  },
  {
    flag: "🇨🇺",
    name: "Cuban / Soviet Style",
    tagline: "Technical perfection",
    color: "#60a5fa",
    desc: "Сахилгатай үндэс суурь, цэвэр stance, хурц jab. Footwork болон өнцгөн тулааны дээд түвшний counter boxing.",
  },
  {
    flag: "🇺🇸",
    name: "American Style",
    tagline: "Slick counter boxing",
    color: "#a78bfa",
    desc: "Хамгаалалт түрүүлсэн, далдлагч footwork, тэсрэлтийн counter. Үзэгчдийн таашаалд нийцсэн ухаалаг шинжлэх ухаан — гарах гарц үргэлж байдаг.",
  },
  {
    flag: "🇯🇵",
    name: "Japanese Style",
    tagline: "Discipline and speed",
    color: "#f97316",
    desc: "Өндөр давтамжтай сургалт, хурц гарны хурд, тэвчээргүй зориулалт. Хүч биш хурд болон сахилга бат давамгайлдаг.",
  },
  {
    flag: "🇹🇭",
    name: "Muay Thai Style",
    tagline: "8-limb pressure",
    color: "#10b981",
    desc: "Бүх биеийн зэвсэг — нударга, тохой, өвдөг, хөл. Clinch хяналт болон урагш pressure нь гол шинж чанар.",
  },
  {
    flag: "🇲🇳",
    name: "Mongolian Style",
    tagline: "Iron will, wrestler's base",
    color: "#fbbf24",
    desc: "Бөхийн нөлөө биеийн болон тэвчээрийн хандлагыг бүтээдэг. Гайхалтай бат бөх чанар болон conditioning — урт тулааны тулд бүтээгдсэн.",
  },
];

const MN_COMMON_MISTAKES = [
  { emoji: "⚠️", mistake: "Combo-ийн дараа guard буудаг", fix: "Хөл хөдлөхөөс өмнө гараа reset хий. Дадал болго." },
  { emoji: "⚠️", mistake: "Хавтгай хөлтэй stance", fix: "Хөлийн чинэ дээр бай. Жин урагш, хөдлөхөд бэлэн." },
  { emoji: "⚠️", mistake: "Гараар цохих (бүс эргэхгүй)", fix: "Хүч газраас ирдэг — хөл → бүс → мөр → нударга." },
  { emoji: "⚠️", mistake: "Солилцооны үед доош харах", fix: "Нүд үргэлж урагш. Харахгүй зүйлээ хамгаалж чадахгүй." },
  { emoji: "⚠️", mistake: "Хурцдах үед combo яаруулах", fix: "Амьсгал. Удаашир. Цэвэр combo яаруулсан flurry-ийг бодвол оноо авдаг." },
  { emoji: "⚠️", mistake: "Slip биш арагш хазайх", fix: "Шугамаас гар — арагш биш. Slip хийснээр counter-д хүрэлцээ хадгалагдана." },
  { emoji: "⚠️", mistake: "Цохилтыг урьдчилан мэдэгдэх (том бэлтгэл)", fix: "Богино setup. Хэдий чинээ бага харагдана, төдий чинээ их тусах магадлал." },
];

const MN_WEEKLY_FOCUS = [
  { day: "Sunday",    emoji: "🛡️", focus: "Defense day",       desc: "Slip хийх, rolling хийх, guard ажил. Зорилготой идэвхтэй амралт.",                       drill: "10min shadow: гурав дахь combo болгоны дараа хоёр удаа slip хийж, reset хий." },
  { day: "Monday",    emoji: "👊", focus: "Jab & Cross",       desc: "Үндэсээ бүт. 1-2 combo бүх зүйлийн суурь.",                                               drill: "100 jab-cross guard reset-тэй. Цэвэр, хурдан биш." },
  { day: "Tuesday",   emoji: "👟", focus: "Footwork & Angles", desc: "Хөдлөж оноо ав. Өнөөдөр pivot болгоноос цохилт хий.",                                      drill: "Алхам-pivot-jab × 20 тал бүрт. Хөлийн чинэ дээр бай." },
  { day: "Wednesday", emoji: "💥", focus: "Power Combos",      desc: "Hook болон uppercut өдөр. Хөлнөөс хүч авч хөдөл.",                                         drill: "Бие-толгой-uppercut: heavy bag дээр 3×3min. Бүрэн бүсний эргэлт." },
  { day: "Thursday",  emoji: "⏱️", focus: "Timing & Rhythm",  desc: "Хурдасхийхийн тулд удаашир. Tempo ол.",                                                    drill: "Timing bag: хоёр дахь дүүжлэгийг хүлээж, counter — 3×2min." },
  { day: "Friday",    emoji: "🔥", focus: "Full Combo Drills", desc: "Бүгдийг нэгтгэ. Олон янзын combo, pattern гаргахгүй.",                                     drill: "3 combo, санамсаргүй ялгаж: 3×2min. Guard-тай дуусга." },
  { day: "Saturday",  emoji: "🧠", focus: "Technique Review",  desc: "Өөрийгөө тэмдэглэж авах эсвэл mirror-тэй ажил. Юуг засах хэрэгтэй вэ?",                   drill: "Хамгийн сул technique-ийг сонго. Зөвхөн тэр дээр 10min анхаарлаа төвлөрүүл." },
];

// ─── Korean content ───────────────────────────────────────────────────────────

const KO_STYLES = [
  {
    key: "pressure",
    emoji: "💥",
    name: "Pressure Fighter",
    tag: "Aggressive",
    tagColor: "#ef4444",
    desc: "상대를 압박하며 볼륨 punch로 제압하는 스타일. Conditioning이 핵심 무기.",
    strengths: ["높은 punch 출력", "상대를 지치게 만든다", "경기 페이스를 직접 결정"],
    weaknesses: ["counter에 노출되기 쉽다", "전진 경로가 예측 가능", "conditioning이 부족하면 쉽게 지친다"],
    practice: "Heavy bag: 3×3min 전력 pressure. 몸을 밀착하고 쓸데없는 동작 없이.",
  },
  {
    key: "counter",
    emoji: "🎯",
    name: "Counter Puncher",
    tag: "Patient",
    tagColor: "#60a5fa",
    desc: "빈틈을 기다려 상대의 실수를 응징하는 스타일. 동작의 효율이 핵심 예술.",
    strengths: ["효율적인 punch 선택", "빠른 reaction timing", "침착함을 유지"],
    weaknesses: ["초반 라운드에 소극적으로 보인다", "고볼륨 파이터 상대로 위험", "비활성적으로 보일 수 있다"],
    practice: "Slip-and-counter drill: jab을 slip하고 cross로 반격 — 3×2min.",
  },
  {
    key: "technical",
    emoji: "📐",
    name: "Technical Boxer",
    tag: "Precise",
    tagColor: "#a78bfa",
    desc: "깔끔한 guard, 정밀한 기본기, 절제된 출력. 양보다 질을 추구.",
    strengths: ["깔끔한 technique", "절제된 guard", "맞히기 어려운 타겟"],
    weaknesses: ["punch 출력이 낮다", "혼전에서 적응이 느리다", "예측 가능한 pattern"],
    practice: "Jab-cross-hook: 100회 깔끔한 자세로, 매 회 guard 올리기.",
  },
  {
    key: "footwork",
    emoji: "👟",
    name: "Footwork Fighter",
    tag: "Elusive",
    tagColor: "#34d399",
    desc: "움직임 자체가 공격. 각도를 만들고 상대를 빗나가게 하며 공간을 지배.",
    strengths: ["잡기 어려운 타겟", "탁월한 각도 창출", "상대를 과잉 소비하게 만든다"],
    weaknesses: ["이동 중 타격력이 줄어든다", "너무 수비적으로 보일 수 있다", "고정 시 발이 평평해진다"],
    practice: "옆 스텝-jab: 모든 pivot에서 punch — 3×90s.",
  },
  {
    key: "southpaw",
    emoji: "🔄",
    name: "Southpaw",
    tag: "Unorthodox",
    tagColor: "#f59e0b",
    desc: "왼손 주도 stance가 혼란을 일으킨다. 왼쪽 cross가 핵심 power 무기.",
    strengths: ["orthodox 파이터에게 어색한 각도", "왼쪽 cross가 결정타", "독특한 stance"],
    weaknesses: ["오른쪽 jab이 활용 부족", "바깥쪽에서 취약", "같은 방향으로 이동 시 붙잡힌다"],
    practice: "오른쪽 스텝, pivot, 왼쪽 cross — 3×2min. 중심선에서 벗어나라.",
  },
  {
    key: "longrange",
    emoji: "📏",
    name: "Long Range Striker",
    tag: "Rangey",
    tagColor: "#fb923c",
    desc: "리치와 거리로 경기를 지배. Jab이 무기, footwork이 방어.",
    strengths: ["jab으로 경기를 제어", "상대가 내 안으로 들어오기 어렵다", "footwork으로 안전 유지"],
    weaknesses: ["근접전에서 효과 감소", "로프에 몰리면 어려워진다", "jab은 날카로워야 한다"],
    practice: "더블 jab, 뒤로 스텝, reset — 3×2min. 거리를 좁히지 말라.",
  },
  {
    key: "inside",
    emoji: "🤛",
    name: "Inside Fighter",
    tag: "Close Range",
    tagColor: "#f87171",
    desc: "근접전에서 최고의 효율. 짧은 punch, hook, uppercut, 바디 공격.",
    strengths: ["근거리에서 위험", "바디 공격이 좋다", "리치 우위를 무력화"],
    weaknesses: ["원거리에서 취약", "jab을 뚫고 들어가야 한다", "잡히거나 묶일 수 있다"],
    practice: "바디-머리 uppercut: 밀착 진입, 바디 공격, 위로 올리기 — 50회.",
  },
];

const KO_TECHNIQUES = [
  {
    key: "jab",
    emoji: "👊",
    name: "Jab",
    color: "#f59e0b",
    what: "거리를 재고 rhythm을 잡는 기본 punch.",
    mistake: "snap이 아닌 push — 느리고 예측 가능하며 잡히기 쉽다.",
    drill: "거울 앞 50회 jab: snap하고 guard로 빠르게 복귀.",
  },
  {
    key: "cross",
    emoji: "✋",
    name: "Cross",
    color: "#ef4444",
    what: "뒷손으로 치는 직선 power punch. 엉덩이를 끝까지 회전시킨다.",
    mistake: "팔로만 치기 — hip rotation 없이 실제 power 없음.",
    drill: "Hip rotation과 함께 cross: 천천히 × 30 (느끼기), 빠르게 × 30.",
  },
  {
    key: "hook",
    emoji: "↩️",
    name: "Hook",
    color: "#a78bfa",
    what: "짧은 호형 punch, 앞손 또는 뒷손. 발을 pivot하고 팔꿈치는 어깨 높이.",
    mistake: "넓고 높게 루핑 — 예측 가능하고 power 손실.",
    drill: "Pivot-hook drill: 앞발 45°, hook, reset — 양쪽 × 20.",
  },
  {
    key: "uppercut",
    emoji: "⬆️",
    name: "Uppercut",
    color: "#60a5fa",
    what: "Guard 아래로 파고드는 상향 punch. 팔이 아닌 다리에서 힘을 끌어온다.",
    mistake: "너무 낮게 준비 동작 — 타격을 미리 노출시킨다.",
    drill: "바디-머리 uppercut combo: 바디 공격 후 위로 — 50회, 밀착 유지.",
  },
  {
    key: "slip",
    emoji: "🛡️",
    name: "Slip",
    color: "#34d399",
    what: "punch를 피해 머리를 선 밖으로 이동. jab 바깥쪽 slip, cross 안쪽 slip.",
    mistake: "선 밖이 아닌 뒤로 slip — 여전히 타격 범위 안에 있다.",
    drill: "Slip-and-counter: jab 바깥으로 slip하고 cross로 반격 — 3×2min.",
  },
  {
    key: "pivot",
    emoji: "🔄",
    name: "Pivot",
    color: "#fb923c",
    what: "앞발을 축으로 회전해 각도를 변경. 선에서 벗어나 새로운 공격 각도를 만든다.",
    mistake: "pivot이 아닌 점프 — 균형을 잃고 시간이 걸린다.",
    drill: "스텝-pivot-jab: 앞발 45°, pivot, jab — 양방향 × 20.",
  },
  {
    key: "guard",
    emoji: "🛡️",
    name: "Guard",
    color: "#9ca3af",
    what: "머리와 턱을 보호하는 높은 손. 능동적 guard는 상대와 함께 움직인다 — 굳어있지 않다.",
    mistake: "punch 사이 또는 combo 후 손을 내리는 것.",
    drill: "어떤 drill에서든 매 combo 후: 두 손이 올라가 있는지 확인하고 이동.",
  },
  {
    key: "footwork",
    emoji: "👟",
    name: "Footwork",
    color: "#34d399",
    what: "링 안에서 움직이는 방법. 거리를 제어하고 각도를 만들며 방어를 가능하게 한다.",
    mistake: "평발과 큰 스텝 — 느리고 무거우며 timing이 쉽다.",
    drill: "측면 shadow box: 스텝-punch-스텝, 발끝으로 — 5min 연속.",
  },
  {
    key: "timing",
    emoji: "⏱️",
    name: "Timing",
    color: "#fbbf24",
    what: "나와 상대 사이의 rhythm. 느리면 부드럽고, 부드러우면 빠르다.",
    mistake: "서두르기 — 빈틈이 완전히 열리기 전에 치는 것.",
    drill: "Timing bag: 두 번째 스윙을 기다렸다 counter — 3×2min. 서두르지 말 것.",
  },
  {
    key: "combo",
    emoji: "💥",
    name: "Combo Setup",
    color: "#f87171",
    what: "한 punch로 다음을 setup하는 것. Jab이 빈틈을 만들고, power punch가 점수를 낸다.",
    mistake: "항상 같은 combo를 던지기 — 상대가 빠르게 적응한다.",
    drill: "3개의 combo를 고른다. 무작위로 번갈아 사용. 3×2min, pattern 없이.",
  },
];

const KO_COUNTRY_STYLES = [
  {
    flag: "🇲🇽",
    name: "Mexican Style",
    tagline: "Heart over everything",
    color: "#ef4444",
    desc: "전진 pressure, 강한 바디 공격, 높은 턱의 전사 정신. 맞아도 계속 전진하기 위해 만들어진 스타일.",
  },
  {
    flag: "🇨🇺",
    name: "Cuban / Soviet Style",
    tagline: "Technical perfection",
    color: "#60a5fa",
    desc: "절제된 기본기, 깔끔한 stance, 날카로운 jab. Footwork과 각도 위에 구축된 최고의 counter boxing.",
  },
  {
    flag: "🇺🇸",
    name: "American Style",
    tagline: "Slick counter boxing",
    color: "#a78bfa",
    desc: "방어 우선, 교묘한 footwork, 폭발적인 counter. 관람 예술로서의 복싱 — 항상 탈출구가 있다.",
  },
  {
    flag: "🇯🇵",
    name: "Japanese Style",
    tagline: "Discipline and speed",
    color: "#f97316",
    desc: "높은 훈련 볼륨, 날카로운 손 스피드, 끊임없는 헌신. 단순한 힘보다 속도와 규율이 우선.",
  },
  {
    flag: "🇹🇭",
    name: "Muay Thai Style",
    tagline: "8-limb pressure",
    color: "#10b981",
    desc: "전신 무기 — 주먹, 팔꿈치, 무릎, 발차기. Clinch 제어와 전진 pressure가 핵심 정체성.",
  },
  {
    flag: "🇲🇳",
    name: "Mongolian Style",
    tagline: "Iron will, wrestler's base",
    color: "#fbbf24",
    desc: "레슬링 영향이 물리적이고 끈질긴 접근법을 만든다. 뛰어난 강인함과 conditioning — 장기전을 위해 만들어진 스타일.",
  },
];

const KO_COMMON_MISTAKES = [
  { emoji: "⚠️", mistake: "Combo 후 guard가 내려간다", fix: "발이 움직이기 전에 손을 reset. 습관으로 만들어라." },
  { emoji: "⚠️", mistake: "Flat-footed stance", fix: "발끝으로 서라. 무게 중심 앞으로, 항상 움직일 준비." },
  { emoji: "⚠️", mistake: "팔로만 치기 (hip rotation 없음)", fix: "힘은 바닥에서 온다 — 다리 → 엉덩이 → 어깨 → 주먹." },
  { emoji: "⚠️", mistake: "교전 중 아래를 보는 것", fix: "항상 눈은 앞으로. 보이지 않는 것은 막을 수 없다." },
  { emoji: "⚠️", mistake: "긴장 시 combo를 서두르기", fix: "숨 쉬어라. 느려져라. 깔끔한 combo가 급한 flurry보다 점수를 낸다." },
  { emoji: "⚠️", mistake: "Slip 대신 뒤로 기대기", fix: "선 밖으로 — 뒤가 아니다. Slip은 counter 범위 안에 머물게 한다." },
  { emoji: "⚠️", mistake: "타격 예고 (큰 준비 동작)", fix: "짧은 setup. 상대가 적게 볼수록 더 많이 맞힌다." },
];

const KO_WEEKLY_FOCUS = [
  { day: "Sunday",    emoji: "🛡️", focus: "Defense day",       desc: "Slip, rolling, guard 작업. 의도를 가진 능동적 휴식.",                              drill: "10min shadow: 세 번째 combo마다 두 번 slip하고 reset." },
  { day: "Monday",    emoji: "👊", focus: "Jab & Cross",       desc: "기초를 쌓아라. 1-2는 모든 것의 토대.",                                             drill: "100회 jab-cross, guard reset 포함. 빠르지 말고 깔끔하게." },
  { day: "Tuesday",   emoji: "👟", focus: "Footwork & Angles", desc: "움직여서 점수를 내라. 오늘은 모든 pivot에서 punch.",                               drill: "스텝-pivot-jab × 양방향 20회. 발끝으로 서라." },
  { day: "Wednesday", emoji: "💥", focus: "Power Combos",      desc: "Hook과 uppercut의 날. 다리에서 힘을 끌어와라.",                                    drill: "바디-머리-uppercut: heavy bag 3×3min. 완전한 hip rotation." },
  { day: "Thursday",  emoji: "⏱️", focus: "Timing & Rhythm",  desc: "빠르게 하려면 느려져라. Tempo를 찾아라.",                                           drill: "Timing bag: 두 번째 스윙을 기다렸다 counter — 3×2min." },
  { day: "Friday",    emoji: "🔥", focus: "Full Combo Drills", desc: "모두 합쳐라. 다양한 combo, pattern 없이.",                                         drill: "3개 combo, 무작위 교체: 3×2min. 항상 guard로 마무리." },
  { day: "Saturday",  emoji: "🧠", focus: "Technique Review",  desc: "촬영하거나 거울로 작업. 무엇을 고쳐야 하나?",                                       drill: "가장 약한 technique을 골라라. 10min 집중 작업만." },
];

// ─── Content dispatcher functions ─────────────────────────────────────────────

function getStyles(locale) {
  if (locale === "mn") return MN_STYLES;
  if (locale === "ko") return KO_STYLES;
  return EN_STYLES;
}

function getTechniques(locale) {
  if (locale === "mn") return MN_TECHNIQUES;
  if (locale === "ko") return KO_TECHNIQUES;
  return EN_TECHNIQUES;
}

function getCountryStyles(locale) {
  if (locale === "mn") return MN_COUNTRY_STYLES;
  if (locale === "ko") return KO_COUNTRY_STYLES;
  return EN_COUNTRY_STYLES;
}

function getCommonMistakes(locale) {
  if (locale === "mn") return MN_COMMON_MISTAKES;
  if (locale === "ko") return KO_COMMON_MISTAKES;
  return EN_COMMON_MISTAKES;
}

function getWeeklyFocus(locale) {
  if (locale === "mn") return MN_WEEKLY_FOCUS;
  if (locale === "ko") return KO_WEEKLY_FOCUS;
  return EN_WEEKLY_FOCUS;
}

// ─── Quick prompts (i18n keys — locale-resolved by translate()) ───────────────

const QUICK_PROMPTS = [
  { key: "libPromptStyle",    emoji: "🎯" },
  { key: "libPromptJab",      emoji: "👊" },
  { key: "libPromptFootwork", emoji: "👟" },
  { key: "libPromptGuard",    emoji: "🛡️" },
  { key: "libPromptToday",    emoji: "🔥" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ emoji, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {title}
      </h3>
    </div>
  );
}

function StyleCard({ style, onAsk, t }) {
  return (
    <div style={{
      flexShrink: 0,
      scrollSnapAlign: "start",
      width: 220,
      background: "#181818",
      border: `1px solid ${style.tagColor}33`,
      borderTop: `3px solid ${style.tagColor}`,
      borderRadius: 12,
      padding: "14px 14px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18 }}>{style.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{style.name}</span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: style.tagColor,
          background: `${style.tagColor}18`, border: `1px solid ${style.tagColor}44`,
          borderRadius: 20, padding: "2px 7px",
        }}>{style.tag}</span>
      </div>
      <p style={{ fontSize: 12, color: "#aaa", margin: 0, lineHeight: 1.5 }}>{style.desc}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {style.strengths.slice(0, 2).map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 5, alignItems: "flex-start" }}>
            <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: 11, color: "#bbb" }}>{s}</span>
          </div>
        ))}
        {style.weaknesses.slice(0, 1).map((w, i) => (
          <div key={i} style={{ display: "flex", gap: 5, alignItems: "flex-start" }}>
            <span style={{ color: "#f87171", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>✗</span>
            <span style={{ fontSize: 11, color: "#bbb" }}>{w}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #222", paddingTop: 8, marginTop: 2 }}>
        <p style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("libraryPractice")}
        </p>
        <p style={{ fontSize: 11, color: "#fca5a5", margin: 0, lineHeight: 1.4 }}>{style.practice}</p>
      </div>
      <button
        onClick={() => onAsk(`Tell me more about the ${style.name} style and what I should work on`)}
        style={{
          marginTop: 2, padding: "7px 0", borderRadius: 8,
          background: "#222", border: `1px solid ${style.tagColor}44`,
          color: style.tagColor, fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}
      >
        {t("libraryAskCoach")} →
      </button>
    </div>
  );
}

function TechCard({ tech, onAsk, t }) {
  return (
    <div style={{
      flexShrink: 0,
      scrollSnapAlign: "start",
      width: 200,
      background: "#181818",
      border: `1px solid ${tech.color}33`,
      borderTop: `3px solid ${tech.color}`,
      borderRadius: 12,
      padding: "13px 13px 11px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 18 }}>{tech.emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{tech.name}</span>
      </div>
      <p style={{ fontSize: 11, color: "#bbb", margin: 0, lineHeight: 1.45 }}>{tech.what}</p>
      <div style={{ background: "#1f0a0a", border: "1px solid #7f1d1d", borderRadius: 7, padding: "7px 9px" }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("libraryMistake")}
        </p>
        <p style={{ fontSize: 11, color: "#fca5a5", margin: 0, lineHeight: 1.4 }}>{tech.mistake}</p>
      </div>
      <div style={{ background: "#1c1400", border: "1px solid #78350f", borderRadius: 7, padding: "7px 9px" }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: "#f59e0b", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("libraryDrill")}
        </p>
        <p style={{ fontSize: 11, color: "#fde68a", margin: 0, lineHeight: 1.4 }}>{tech.drill}</p>
      </div>
      <button
        onClick={() => onAsk(`How do I improve my ${tech.name}?`)}
        style={{
          padding: "7px 0", borderRadius: 8,
          background: "#222", border: `1px solid ${tech.color}44`,
          color: tech.color, fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}
      >
        {t("libraryAskCoach")} →
      </button>
    </div>
  );
}

function CountryCard({ cs }) {
  return (
    <div style={{
      flexShrink: 0,
      scrollSnapAlign: "start",
      width: 180,
      background: "#181818",
      border: `1px solid ${cs.color}33`,
      borderTop: `3px solid ${cs.color}`,
      borderRadius: 12,
      padding: "13px 13px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 20 }}>{cs.flag}</span>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fff" }}>{cs.name}</p>
          <p style={{ margin: 0, fontSize: 10, color: cs.color, fontWeight: 700 }}>{cs.tagline}</p>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#aaa", margin: 0, lineHeight: 1.5 }}>{cs.desc}</p>
    </div>
  );
}

function MistakeRow({ item }) {
  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start",
      padding: "10px 0", borderBottom: "1px solid #1f1f1f",
    }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>{item.emoji}</span>
      <div>
        <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#f87171" }}>{item.mistake}</p>
        <p style={{ margin: 0, fontSize: 12, color: "#aaa", lineHeight: 1.4 }}>Fix: {item.fix}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function KnowledgeLibrary({ locale, onAsk }) {
  const t = (key) => translate(locale, key);

  const todayFocus = useMemo(() => {
    return getWeeklyFocus(locale)[new Date().getDay()];
  }, [locale]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 32 }}>

      {/* Quick Prompts */}
      <div>
        <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("libraryQuickPromptsLabel")}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.key}
              onClick={() => onAsk(t(p.key))}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "8px 13px", borderRadius: 999,
                background: "#1a1a1a", border: "1px solid #333",
                color: "#fff", fontSize: 12, fontWeight: 700,
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              <span>{p.emoji}</span>
              {t(p.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Train Today */}
      <div>
        <SectionHeader emoji="🔥" title={t("librarySectionToday")} />
        <div style={{
          background: "#1c1400",
          border: "1px solid #78350f",
          borderLeft: "4px solid #f59e0b",
          borderRadius: 12,
          padding: "14px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>{todayFocus.emoji}</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff" }}>{todayFocus.focus}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#f59e0b" }}>{todayFocus.day}</p>
            </div>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: "#d4a", lineHeight: 1.5 }}>{todayFocus.desc}</p>
          <div style={{ background: "#111", border: "1px solid #333", borderRadius: 8, padding: "8px 10px" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#fde68a", lineHeight: 1.5 }}>
              <strong style={{ color: "#f59e0b" }}>Drill: </strong>{todayFocus.drill}
            </p>
          </div>
          <button
            onClick={() => onAsk(t("libPromptToday"))}
            style={{
              marginTop: 10, width: "100%", padding: "9px 0", borderRadius: 8,
              background: "#2a1800", border: "1px solid #78350f",
              color: "#f59e0b", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            {t("libraryAskCoach")} →
          </button>
        </div>
      </div>

      {/* Fighter Styles */}
      <div>
        <SectionHeader emoji="🥊" title={t("librarySectionStyles")} />
        <ScrollRow>
          {getStyles(locale).map((s) => (
            <StyleCard key={s.key} style={s} onAsk={onAsk} t={t} />
          ))}
        </ScrollRow>
      </div>

      {/* Techniques */}
      <div>
        <SectionHeader emoji="🎯" title={t("librarySectionTechniques")} />
        <ScrollRow>
          {getTechniques(locale).map((tech) => (
            <TechCard key={tech.key} tech={tech} onAsk={onAsk} t={t} />
          ))}
        </ScrollRow>
      </div>

      {/* Country / Legacy Styles */}
      <div>
        <SectionHeader emoji="🌍" title={t("librarySectionCountries")} />
        <ScrollRow>
          {getCountryStyles(locale).map((cs) => (
            <CountryCard key={cs.name} cs={cs} />
          ))}
        </ScrollRow>
      </div>

      {/* Common Mistakes */}
      <div>
        <SectionHeader emoji="⚠️" title={t("librarySectionMistakes")} />
        <div style={{ borderTop: "1px solid #1f1f1f" }}>
          {getCommonMistakes(locale).map((item, i) => (
            <MistakeRow key={i} item={item} />
          ))}
        </div>
        <button
          onClick={() => onAsk("What are the most common boxing mistakes beginners make and how do I fix them?")}
          style={{
            marginTop: 12, width: "100%", padding: "9px 0", borderRadius: 8,
            background: "#1a1a1a", border: "1px solid #333",
            color: "#aaa", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}
        >
          Ask coach about my mistakes →
        </button>
      </div>

    </div>
  );
}

// Deterministic technique review — computed from poseMetrics + result, no API call.

const L = {
  lowDataFewPunches: {
    en: "Not enough clean punches detected. Stand in full view of the camera and throw at least 5 clear punches for AI analysis.",
    mn: "Хангалттай тодорхой цохилт илрүүлэгдсэнгүй. Дэлгэцний өмнө бүтэн биеэр зогсож, хамгийн багадаа 5 тодорхой цохилт хийнэ үү.",
    ko: "깨끗한 펀치가 충분히 감지되지 않았습니다. 카메라에 전신이 보이도록 서서 최소 5개의 펀치를 던져 주세요.",
  },
  lowDataConfidence: {
    en: "Tracking data was limited this session. Ensure your full body is visible and the lighting is good for accurate analysis.",
    mn: "Энэ session-ийн tracking өгөгдөл хязгаарлагдмал байна. Бүтэн биеэ харуулж, гэрэлтүүлгийг сайжруул.",
    ko: "이번 세션의 트래킹 데이터가 제한적이었습니다. 전신이 보이도록 하고 조명을 개선하세요.",
  },
  positionAdvice: {
    en: "Step back to show your full stance. Keep your upper body and arms in frame. Punch toward the camera.",
    mn: "Бүтэн зогсолтоо харуулахын тулд арагшаа алхам. Биеийн дээд хэсэг, гараа дэлгэцэнд харуул. Камер руу цохи.",
    ko: "전체 스탠스가 보이도록 뒤로 물러서세요. 상체와 팔이 프레임 안에 있도록 하고 카메라를 향해 펀치하세요.",
  },

  // Strength messages
  snapFast:    { en: "Punching with sharp snap speed.", mn: "Хурдан snap хурдтай цохиж байна.", ko: "빠른 스냅 속도로 펀치하고 있습니다." },
  recoilQuick: { en: "Fast guard recovery after punches.", mn: "Цохилтын дараа хурдан guard буцаж байна.", ko: "펀치 후 빠른 가드 회복." },
  guardGood:   { en: "Guard position is solid.", mn: "Guard байрлал хатуу байна.", ko: "가드 자세가 견고합니다." },

  // Fix messages
  guardLow:    { en: "Guard drops after punching — snap back immediately.", mn: "Цохилтын дараа guard унаж байна — даруй буцаа.", ko: "펀치 후 가드가 내려감 — 즉시 복귀하세요." },
  snapSlow:    { en: "Punches lack snap — drive from the shoulder.", mn: "Цохилтод snap дутмаг — мөрнөөс жолоодо.", ko: "펀치에 스냅이 부족함 — 어깨에서 구동하세요." },
  recoilSlow:  { en: "Guard recovery is slow — retract faster.", mn: "Guard-ийн буцалт удаан — хурдан буцаа.", ko: "가드 회복이 느림 — 더 빨리 당기세요." },

  // Weakness labels per metric key
  weakness: {
    guard:      { en: "Guard Recovery", mn: "Guard буцалт", ko: "가드 회복" },
    accuracy:   { en: "Accuracy", mn: "Нарийвчлал", ko: "정확도" },
    speed:      { en: "Hand Speed", mn: "Гарын хурд", ko: "손 속도" },
    power:      { en: "Power", mn: "Хүч", ko: "파워" },
    consistency:{ en: "Consistency", mn: "Тогтвортой байдал", ko: "일관성" },
    balance:    { en: "Balance", mn: "Тэнцвэр", ko: "균형" },
    "hip rotation": { en: "Hip Rotation", mn: "Бүсний эргэлт", ko: "힙 회전" },
    extension:  { en: "Punch Extension", mn: "Цохилтын сунгалт", ko: "펀치 익스텐션" },
  },

  // Drills
  drills: {
    guard:    { en: "30 jabs — snap guard up after every punch. 3 sets.", mn: "30 jab — цохилт болгоны дараа guard буцаа. 3 сет.", ko: "잽 30개 — 매 펀치 후 가드 올리기. 3세트." },
    speed:    { en: "20-punch speed burst, 5 sec rest, repeat ×5.", mn: "20 цохилтын burst, 5 секунд амра, ×5 давт.", ko: "20펀치 속도 버스트, 5초 휴식, ×5 반복." },
    combo:    { en: "Jab-cross-hook ×10 — drive hip rotation on the cross.", mn: "Jab-cross-hook ×10 — cross-д бүсний эргэлтийг анхаарна.", ko: "잽-크로스-훅 ×10 — 크로스에서 힙 회전 구동." },
    accuracy: { en: "Slow precise jabs to a target — quality over quantity. 20 reps.", mn: "Зорилтод удаан нарийвчилсан jab — тоогоос чанар. 20 удаа.", ko: "타겟에 천천히 정확한 잽 — 양보다 질. 20회." },
    balance:  { en: "Wide-stance shadow, 1 min — stay on your toes, no flat feet.", mn: "Өргөн зогсолттой сүүдэр, 1 минут — хурууны дээр жинг авч явна.", ko: "넓은 스탠스 섀도우, 1분 — 발끝 유지, 발바닥 닿지 않기." },
    extension:{ en: "10 slow-motion crosses — full arm extension each time.", mn: "10 удаан cross — бүрэн гарын сунгалттай.", ko: "슬로우 크로스 10개 — 매번 완전한 팔 펴기." },
    power:    { en: "5 heavy cross punches with full hip drive. 4 sets of 5.", mn: "5 хүчтэй cross — бүрэн бүсний хөдөлгөөнтэй. 4×5.", ko: "풀 힙 드라이브로 강한 크로스 5개. 4세트." },
  },

  // Next session goals
  nextGoals: {
    guard:    { en: "Keep guard up for 60% of your punches.", mn: "Цохилтынхоо 60%-д guard-аа барьж байна уу.", ko: "펀치의 60%는 가드를 유지하세요." },
    speed:    { en: "Increase snap speed — aim for 30 punches in 20 seconds.", mn: "Snap хурдаа нэмэгдүүл — 20 секундад 30 цохилт.", ko: "스냅 속도 향상 — 20초에 30펀치 목표." },
    combo:    { en: "Land 3-punch combos consistently — power in every cross.", mn: "3 цохилтын combo-г тогтмол хийнэ — cross бүрт хүч.", ko: "3펀치 콤보 일관되게 — 모든 크로스에 파워." },
    accuracy: { en: "Focus on clean punches — fewer punches, more precision.", mn: "Цэвэр цохилтод анхаарна — цохилт бага, нарийвчлал илүү.", ko: "깨끗한 펀치에 집중 — 적게, 더 정확하게." },
    balance:  { en: "Maintain stance width throughout — no weight shifts.", mn: "Дасгал даяар зогсолтын өргөнөө хадгална — жингийн хазайлт байхгүй.", ko: "세션 내내 스탠스 너비 유지 — 체중 이동 없이." },
    power:    { en: "Drive every cross from the hips — feel the rotation.", mn: "Бүх cross-ийг бүснээс жолоодоно — эргэлтийг мэдрэгтүн.", ko: "모든 크로스는 힙에서 — 회전을 느끼세요." },
    general:  { en: "Add 5 more punches and maintain pace to the end.", mn: "5 цохилт нэмж, эцэс хүртэл хурдаа хадгална.", ko: "펀치를 5개 더 추가하고 끝까지 속도를 유지하세요." },
  },

  // Titles
  titlePositive: { en: "🔥 Strong Session", mn: "🔥 Хүчтэй Session", ko: "🔥 강한 세션" },
  titleMixed:    { en: "🥊 Solid Foundation", mn: "🥊 Бат суурь", ko: "🥊 탄탄한 기반" },
  titleCritical: { en: "💪 Room to Grow", mn: "💪 Өсөх орон зай", ko: "💪 성장 가능성" },
};

const WEAKNESS_DRILL_MAP = {
  guard:          "guard",
  accuracy:       "accuracy",
  speed:          "speed",
  power:          "power",
  consistency:    "combo",
  balance:        "balance",
  "hip rotation": "combo",
  extension:      "extension",
};

function t(obj, locale) {
  return obj?.[locale] || obj?.en || "";
}

export function generateTechniqueReview({ poseMetrics, result, locale = "en" }) {
  const punchCount = poseMetrics?.punchCount ?? 0;
  const confidence = poseMetrics?.sessionConfidence;

  if (punchCount < 5) {
    return {
      lowData: true,
      lowDataReason: t(L.lowDataFewPunches, locale),
      positionAdvice: t(L.positionAdvice, locale),
    };
  }
  if (confidence === "low") {
    return {
      lowData: true,
      lowDataReason: t(L.lowDataConfidence, locale),
      positionAdvice: t(L.positionAdvice, locale),
    };
  }

  const score = result?.score ?? 0;
  const breakdown = result?.breakdown || {};
  const coaching = poseMetrics?.coaching || [];

  // Strengths from coaching notes
  const strengthCues = coaching.filter((c) => c.type === "strength").map((c) => c.message);
  const improveCues  = coaching.filter((c) => c.type === "improve").map((c) => c.message);

  const snapRating   = poseMetrics?.velocityStats?.snapRating;
  const recoilRating = poseMetrics?.velocityStats?.recoilRating;
  const guardStatus  = poseMetrics?.guardHeight?.status;

  const strengths = [...strengthCues.slice(0, 2)];
  if (snapRating === "FAST")    strengths.push(t(L.snapFast, locale));
  if (recoilRating === "QUICK") strengths.push(t(L.recoilQuick, locale));
  if (guardStatus === "good" && strengths.length < 2) strengths.push(t(L.guardGood, locale));

  const fixes = [...improveCues.slice(0, 2)];
  if (guardStatus === "dropped" || guardStatus === "low") {
    if (!fixes.some((f) => /guard/i.test(f))) fixes.unshift(t(L.guardLow, locale));
  }
  if (snapRating === "SLOW" && fixes.length < 2)   fixes.push(t(L.snapSlow, locale));
  if (recoilRating === "SLOW" && fixes.length < 2) fixes.push(t(L.recoilSlow, locale));

  // Priority weakness key
  let weakKey = null;
  const biWeakness = poseMetrics?.boxingIntelligence?.weakness?.label;
  if (biWeakness) {
    weakKey = biWeakness.toLowerCase();
  } else if (guardStatus === "dropped") {
    weakKey = "guard";
  } else if (Object.keys(breakdown).length) {
    const entries = Object.entries(breakdown).filter(([, v]) => typeof v === "number");
    if (entries.length) {
      [weakKey] = entries.sort(([, a], [, b]) => a - b)[0];
    }
  }

  const priorityWeakness = weakKey
    ? t(L.weakness[weakKey] || { en: weakKey }, locale)
    : (fixes[0] || null);

  const drillKey = WEAKNESS_DRILL_MAP[weakKey] || "combo";
  const drill = t(L.drills[drillKey], locale);

  const nextGoalKey = WEAKNESS_DRILL_MAP[weakKey] || "general";
  const nextSessionGoal = t(L.nextGoals[nextGoalKey] || L.nextGoals.general, locale);

  const coachTone = score >= 7.5 ? "positive" : score < 5 ? "critical" : "mixed";

  // Best weapon
  const pb = poseMetrics?.punchBreakdown;
  let bestWeapon = null;
  if (pb) {
    const types = [
      { key: "jab", count: pb.jab?.count || 0 },
      { key: "cross", count: pb.cross?.count || 0 },
      { key: "hook", count: pb.hook?.count || 0 },
    ];
    const best = types.reduce((a, b) => (b.count > a.count ? b : a), types[0]);
    if (best.count > 0) bestWeapon = best.key;
  }

  const title = t(
    coachTone === "positive" ? L.titlePositive
    : coachTone === "critical" ? L.titleCritical
    : L.titleMixed,
    locale
  );

  const summary = buildSummary({ score, punchCount, strengths, priorityWeakness, locale });

  return {
    lowData: false,
    title,
    summary,
    strengths: strengths.slice(0, 2),
    fixes: fixes.slice(0, 2),
    priorityWeakness,
    drill,
    nextSessionGoal,
    coachTone,
    bestWeapon,
    weakKey,
  };
}

function buildSummary({ score, punchCount, strengths, priorityWeakness, locale }) {
  if (locale === "mn") {
    const tone = score >= 7.5 ? "Маш сайн session." : score >= 5 ? "Тогтвортой session." : "Хөгжлийн боломж байна.";
    const punch = `${punchCount} цохилт`;
    const fix = priorityWeakness ? ` ${priorityWeakness}-д анхаарал хэрэгтэй.` : "";
    return `${tone} ${punch} хийсэн.${fix}`;
  }
  if (locale === "ko") {
    const tone = score >= 7.5 ? "훌륭한 세션입니다." : score >= 5 ? "안정적인 세션입니다." : "성장할 여지가 있습니다.";
    const fix = priorityWeakness ? ` ${priorityWeakness}에 집중이 필요합니다.` : "";
    return `${tone} ${punchCount}개 펀치.${fix}`;
  }
  const tone = score >= 7.5 ? "Solid session." : score >= 5 ? "Decent session." : "Plenty of room to grow.";
  const fix = priorityWeakness ? ` Focus on ${priorityWeakness} next.` : "";
  return `${tone} ${punchCount} punches tracked.${fix}`;
}

// Build a message string to send to AI chat for "Review my last session"
export function buildLastSessionMessage({ poseMetrics, result, locale = "en" }) {
  if (!poseMetrics || !result) return null;

  const score = result.score?.toFixed(1) ?? "?";
  const punchCount = poseMetrics.punchCount ?? 0;
  const bd = result.breakdown || {};

  const pb = poseMetrics.punchBreakdown;
  const punches = pb
    ? [
        pb.jab?.count  ? `Jab ×${pb.jab.count}`   : null,
        pb.cross?.count ? `Cross ×${pb.cross.count}` : null,
        pb.hook?.count  ? `Hook ×${pb.hook.count}`  : null,
      ].filter(Boolean).join(", ")
    : null;

  const snap   = poseMetrics.velocityStats?.snapRating;
  const recoil = poseMetrics.velocityStats?.recoilRating;
  const guard  = poseMetrics.guardHeight?.status;
  const biWeak = poseMetrics.boxingIntelligence?.weakness?.label;
  const biStyle = poseMetrics.boxingIntelligence?.style;

  const lines = [
    locale === "mn"
      ? `Сүүлийн дасгалаа шинжилж өгнө үү. Гүйцэтгэлийн дүн: ${score}/10.`
      : locale === "ko"
      ? `최근 훈련 세션을 리뷰해 주세요. 퍼포먼스 점수: ${score}/10.`
      : `Review my latest training session. Performance score: ${score}/10.`,
    `${punchCount} punches detected.`,
    punches ? `Breakdown: ${punches}.` : null,
    snap    ? `Hand snap speed: ${snap}.` : null,
    recoil  ? `Guard recovery speed: ${recoil}.` : null,
    guard   ? `Guard status: ${guard}.` : null,
    biStyle ? `Fighting style: ${biStyle}.` : null,
    biWeak  ? `Main weakness detected: ${biWeak}.` : null,
    bd.accuracy  != null ? `Accuracy: ${bd.accuracy.toFixed(1)}/10.` : null,
    bd.speed     != null ? `Speed: ${bd.speed.toFixed(1)}/10.` : null,
    bd.power     != null ? `Power: ${bd.power.toFixed(1)}/10.` : null,
    bd.consistency != null ? `Consistency: ${bd.consistency.toFixed(1)}/10.` : null,
  ].filter(Boolean).join(" ");

  return lines;
}

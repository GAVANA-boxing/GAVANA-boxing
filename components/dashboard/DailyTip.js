"use client";

import { GOLD, RED, RADIUS } from "@/lib/tokens";

const AREA_COLOR = {
  Power: RED, Speed: "#FB923C", Timing: GOLD,
  Footwork: "#60A5FA", Guard: "#A78BFA", Accuracy: "#34D399",
};
const AREA_MN = {
  Power: "Хүч", Speed: "Хурд", Timing: "Цаг",
  Footwork: "Хөл", Guard: "Хамгаалалт", Accuracy: "Нарийвчлал",
};

// 4 tips per area, cycled by day-of-year mod 4
const TIPS = {
  Power: [
    { en: "Drive from your legs — power starts at the floor, not your arm.", mn: "Хөлөөрөө түлхэх — хүч гараасаа биш газраас эхэлдэг." },
    { en: "Rotate your hips fully before the fist lands. Hip speed = punch power.", mn: "Нударга буухаас өмнө бүсээ бүрэн эргүүл. Бүсний хурд = цохилтын хүч." },
    { en: "Exhale sharply at the moment of impact to engage your core.", mn: "Цохих мөчид хурдан амьсгал гарга — голч нь зориудаар идэвхждэг." },
    { en: "Practice 3-punch bursts with max intent, not 10-punch flurries with no power.", mn: "Хүч муутай 10 цохилтоос хурдан 3 цохилтын burst дээр ажил." },
  ],
  Speed: [
    { en: "Relax your hands between punches — tension is the enemy of speed.", mn: "Цохилтуудын хооронд гараа суль — хүч чадал хурдны дайсан." },
    { en: "Snap your punches back faster than you throw them. Recovery = next speed.", mn: "Цохилт буцаахдаа илгээхээсээ хурдан буцаа. Буцаах = дараагийн хурд." },
    { en: "Shadow for 3 min at 30% effort, then 3 min at 100%. Feel the contrast.", mn: "3 мин 30%-тайгаар, дараа нь 3 мин 100%-тайгаар сүүдэрлэ." },
    { en: "Train double-end bag daily for hand-eye coordination and snap speed.", mn: "Хоёр тийш уутыг өдөр бүр хий — гар-нүд зохицол болон snap хурд." },
  ],
  Timing: [
    { en: "Counter on the second beat — let them start, then punish the extension.", mn: "Хоёр дахь мөчид хариулах — тэд эхлэхийг зөвшөө, сунаснаас шийтгэ." },
    { en: "Learn your opponent's rhythm before committing to an attack.", mn: "Довтлохоос өмнө өрсөлдөгчийнхөө хэмнэлийг судал." },
    { en: "The best punch lands when they're thinking about throwing, not defending.", mn: "Хамгийн сайн цохилт тэд хамгаалахгүй байхад буудаг." },
    { en: "Use the jab as a timing tool, not just an attack — feel the distance.", mn: "Шулуун цохилтыг зайг мэдрэх хэрэгсэл болгон ашигла, зөвхөн довтолгоо биш." },
  ],
  Footwork: [
    { en: "Always exit at an angle — don't back up in a straight line.", mn: "Үргэлж буланд гарч яв — шулуун ухраад болохгүй." },
    { en: "Your front foot leads, your back foot follows. Never cross your feet.", mn: "Урдаа хөл удирдана, хойд хөл дагана. Хөлөө огтолж болохгүй." },
    { en: "Pivot to your right after a right hand — it takes you off centerline.", mn: "Баруун гараа цохисны дараа баруун тийш эргэ — голчоос гарна." },
    { en: "Footwork drill: step-jab, pivot, step-jab. 5 min of pure movement.", mn: "Хөлний дасгал: алхах-шулуун, эргэх, алхах-шулуун. 5 мин цэвэр хөдөлгөөн." },
  ],
  Guard: [
    { en: "Chin down, shoulders up — your guard is your posture, not your hands.", mn: "Эрүү доош, мөр дээш — хамгаалалт таны бие байдал, гар биш." },
    { en: "Return to guard after every punch. One sloppy reset gets you knocked out.", mn: "Тус бүрийн цохилтын дараа хамгаалалтдаа буцаа. Нэг алдаа нокаут болдог." },
    { en: "Slip inside — never pull straight back. Make them miss and pay for it.", mn: "Дотогш мулталж ор — шулуун ухрах биш. Алдуулаад шийтгэ." },
    { en: "Practice the shell: elbows tight, chin tucked, eyes visible over gloves.", mn: "Бүрхүүл дасгал: тохой нягтаар, эрүү дотогш, нүд бээлийн дээгүүр харагдах." },
  ],
  Accuracy: [
    { en: "Pick a spot on the bag before you punch — vague targeting = vague punches.", mn: "Цохихоосоо өмнө уут дээр нэг цэг сонго — тодорхойгүй бай = тодорхойгүй цохилт." },
    { en: "Slow is smooth, smooth is fast. Drill at 50% speed until the line is perfect.", mn: "Удаан = жигд, жигд = хурдан. 50%-ийн хурдаар шугам нь перфект болтол дасгалла." },
    { en: "Focus on where your punch lands, not how hard you throw it.", mn: "Хэр хүчтэй цохиж байгаагаасаа илүү хаана буухад анхаарал тавь." },
    { en: "Jab to the nose, cross to the chin — specific targets build precision.", mn: "Шулуун хамарт, загалмай эрүүнд — тодорхой бай нарийвчлал бүрдүүлдэг." },
  ],
};

function getTodaysTip(area) {
  const dayOfYear = Math.floor(Date.now() / (24 * 3600 * 1000));
  const tips = TIPS[area] || TIPS.Accuracy;
  return tips[dayOfYear % tips.length];
}

export default function DailyTip({ coachSnapshot, locale }) {
  const mn = locale === "mn";
  const weakAreas = coachSnapshot?.weakAreas || [];
  const area = weakAreas[0]?.[0] || "Accuracy";
  const tip = getTodaysTip(area);
  const col = AREA_COLOR[area] || GOLD;
  const areaLabel = mn ? (AREA_MN[area] || area) : area;

  return (
    <div style={{
      marginBottom: 20,
      padding: "13px 14px",
      borderRadius: "3px 14px 14px 3px",
      background: `${col}07`,
      border: `1px solid ${col}20`,
      borderLeft: `3px solid ${col}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
        <span style={{ fontSize: 14 }}>💡</span>
        <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: col, letterSpacing: 2, textTransform: "uppercase" }}>
          {mn ? `Өнөөдрийн зөвлөмж · ${areaLabel}` : `Daily Tip · ${areaLabel}`}
        </p>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.72)", lineHeight: 1.55 }}>
        {mn ? tip.mn : tip.en}
      </p>
    </div>
  );
}

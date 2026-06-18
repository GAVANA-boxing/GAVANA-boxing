"use client";

const DAILY_MISSIONS = [
  { emoji: "🥊", mn: "Доргиних тусгай дасгал", ko: "잽 정밀도 훈련", en: "Jab Precision Day", promptMn: "Өнөөдрийн доргиний дасгал хийлгэж өгнө үү", promptKo: "오늘 잽 정밀도 훈련 루틴을 짜줘", promptEn: "Give me a jab precision drill routine for today" },
  { emoji: "👣", mn: "Хөлийн хөдөлгөөн & Өнцгийн дасгал", ko: "풋워크와 앵글 훈련", en: "Footwork & Angles", promptMn: "Хөлийн хөдөлгөөн болон өнцгийн дасгал хийлгэнэ үү", promptKo: "오늘 풋워크와 각도 훈련 루틴을 알려줘", promptEn: "Coach me on footwork and angle drills today" },
  { emoji: "🛡️", mn: "Хамгааллын техник", ko: "방어 기술 훈련", en: "Defense Focus", promptMn: "Ухрах болон бөхийх хамгааллын дасгал хийлгэнэ үү", promptKo: "슬립과 롤을 중심으로 방어 훈련을 알려줘", promptEn: "Coach me on slip and roll defense drills" },
  { emoji: "💥", mn: "Хүчтэй хослолын цуваа", ko: "파워 콤비네이션 훈련", en: "Power Combinations", promptMn: "Хүч чадал нэмэх хослолын цуваа заана уу", promptKo: "오늘 파워 콤비네이션 연습을 알려줘", promptEn: "Give me power combination drills to build knockout power" },
  { emoji: "⚡", mn: "Хурд & Хэмнэл", ko: "스피드와 리듬 훈련", en: "Speed & Rhythm", promptMn: "Хурд болон хэмнэлийн дасгал хийлгэнэ үү", promptKo: "스피드와 리듬 훈련 루틴을 알려줘", promptEn: "Give me speed and rhythm training drills" },
  { emoji: "🥋", mn: "Дүрслэлт раунд симуляци", ko: "풀라운드 스파링 시뮬레이션", en: "Full Round Simulation", promptMn: "Бүтэн раундын дасгал симуляци хийлгэнэ үү", promptKo: "풀라운드 스파링 시뮬레이션 훈련을 도와줘", promptEn: "Coach me through a full round sparring simulation" },
  { emoji: "🔄", mn: "Нөхөн сэргэлт & Дүн шинжилгээ", ko: "회복과 리뷰", en: "Recovery & Review", promptMn: "Нөхөн сэргэлт болон долоо хоногийн ахицаа шинжлэх дасгал хийлгэнэ үү", promptKo: "회복 훈련과 이번 주 진행 상황을 리뷰해줘", promptEn: "Help me with recovery techniques and review my week" },
];

export { DAILY_MISSIONS };

export default function TodayMissionBanner({ locale, onAsk, onSwitchToChat }) {
  const todayMission = DAILY_MISSIONS[new Date().getDay()];
  const focus = locale === "mn" ? todayMission.mn : locale === "ko" ? todayMission.ko : todayMission.en;
  const prompt = locale === "mn" ? todayMission.promptMn : locale === "ko" ? todayMission.promptKo : todayMission.promptEn;

  return (
    <div style={{
      marginBottom: 12,
      padding: "12px 14px",
      borderRadius: 14,
      background: "rgba(245,196,81,0.06)",
      border: "1px solid rgba(245,196,81,0.2)",
      borderLeft: "3px solid #F5C451",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{todayMission.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: "#F5C451", textTransform: "uppercase", marginBottom: 2 }}>
          {locale === "mn" ? "ӨНӨӨДРИЙН ДААЛГАВАР" : locale === "ko" ? "오늘의 미션" : "TODAY'S MISSION"}
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
          {focus}
        </div>
      </div>
      <button
        type="button"
        onClick={() => { onSwitchToChat(); onAsk(prompt); }}
        style={{
          padding: "7px 12px", borderRadius: 10,
          background: "#F5C451", border: "none",
          color: "#000", fontSize: 11, fontWeight: 900,
          cursor: "pointer", flexShrink: 0, letterSpacing: 0.3,
        }}
      >
        {locale === "mn" ? "Асуу" : locale === "ko" ? "물어보기" : "Ask →"}
      </button>
    </div>
  );
}

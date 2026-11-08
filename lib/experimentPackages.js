// Curated weekly experiment packages — rotate by ISO week number. Named by technique, not by
// real boxers (no rights to their names or photos for promotion); fighterId only links the
// technique notes.
import { FIGHTERS } from "@/lib/fighters";

export const EXPERIMENT_PACKAGES = [
  {
    id: "ali-week",
    fighterId: "muhammad-ali",
    accent: "#F5C451",
    archetype: "outboxer",
    week: { en: "Footwork Week", mn: "Хөлийн ажлын долоо хоног", ko: "풋워크 위크" },
    theme: { en: "Move, jab, move", mn: "Хөдөл, жэб, хөдөл", ko: "움직이고, 잽, 움직이고" },
    focus: { en: "Footwork · Lateral movement · Jab control", mn: "Хөлийн ажил · Хажуу тийш хөдлөх · Жэбээр зай барих", ko: "풋워크 · 측면 이동 · 잽 컨트롤" },
  },
  {
    id: "tyson-week",
    fighterId: "mike-tyson",
    accent: "#FF3B30",
    archetype: "pressure",
    week: { en: "Inside Pressure Week", mn: "Ойрын дарамтын долоо хоног", ko: "인사이드 프레셔 위크" },
    theme: { en: "Head moves, then you punch", mn: "Толгойгоо хөдөлгөөд цохи", ko: "머리를 움직이고 펀치" },
    focus: { en: "Peek-a-boo · Inside pressure · Explosive combinations", mn: "Өндөр хамгаалалт · Ойрын дарамт · Хурдан комбо", ko: "픽어부 · 인사이드 프레셔 · 폭발적 콤보" },
  },
  {
    id: "inoue-week",
    fighterId: "naoya-inoue",
    accent: "#F97316",
    archetype: "explosive",
    week: { en: "Body–Head Week", mn: "Бие–толгойн долоо хоног", ko: "바디–헤드 위크" },
    theme: { en: "Go to the body, finish up top", mn: "Биед эхэлж, толгойд дуусга", ko: "바디로 시작해 머리로 끝내기" },
    focus: { en: "Explosive combinations · Body-head switch · Counter instinct", mn: "Хурдан комбо · Бие-толгой солих · Хариу цохилт", ko: "폭발적 콤보 · 바디-헤드 전환 · 카운터 본능" },
  },
  {
    id: "bivol-week",
    fighterId: "dmitry-bivol",
    accent: "#3B82F6",
    archetype: "technician",
    week: { en: "Jab Control Week", mn: "Жэбийн хяналтын долоо хоног", ko: "잽 컨트롤 위크" },
    theme: { en: "Jab, reset, repeat", mn: "Жэб, хамгаалалт, давт", ko: "잽, 리셋, 반복" },
    focus: { en: "Systematic jab · Distance management · Technical defense", mn: "Тогтмол жэб · Зай барих · Техникийн хамгаалалт", ko: "체계적 잽 · 거리 관리 · 기술적 방어" },
  },
  {
    id: "lomachenko-week",
    fighterId: "vasyl-lomachenko",
    accent: "#A855F7",
    archetype: "outboxer",
    week: { en: "Angles Week", mn: "Өнцгийн долоо хоног", ko: "앵글 위크" },
    theme: { en: "Pivot and punch from the side", mn: "Эргээд хажуугаас цохи", ko: "피벗하고 옆에서 펀치" },
    focus: { en: "Pivot angles · Hi-tech footwork · Feint combinations", mn: "Эргэх өнцөг · Хөлийн ажил · Хуурмаг цохилттой комбо", ko: "피벗 앵글 · 하이테크 풋워크 · 페인트 콤보" },
  },
  {
    id: "canelo-week",
    fighterId: "canelo-alvarez",
    accent: "#F59E0B",
    archetype: "counter",
    week: { en: "Shoulder Roll Week", mn: "Мөрөөр хамгаалах долоо хоног", ko: "숄더 롤 위크" },
    theme: { en: "Roll, then counter", mn: "Мөрөөр халз, хариу цохи", ko: "롤하고 카운터" },
    focus: { en: "Shoulder roll · Check hook · Body intelligence", mn: "Мөрөөр хамгаалах · Хариу хук · Биеийн цохилт", ko: "숄더 롤 · 체크 훅 · 바디 인텔리전스" },
  },
  {
    id: "ggc-week",
    fighterId: "gennady-golovkin",
    accent: "#10B981",
    archetype: "pressure",
    week: { en: "Double Jab Week", mn: "Давхар жэбийн долоо хоног", ko: "더블 잽 위크" },
    theme: { en: "Volume with a purpose", mn: "Олон цохилт, зорилготой", ko: "목적 있는 볼륨" },
    focus: { en: "Double jab · Body accumulation · Pressure with accuracy", mn: "Давхар жэб · Биед давтан цохих · Нарийн дарамт", ko: "더블 잽 · 바디 누적 · 정확한 프레셔" },
  },
  {
    id: "mayweather-week",
    fighterId: "floyd-mayweather",
    accent: "#94A3B8",
    archetype: "counter",
    week: { en: "Defense Week", mn: "Хамгаалалтын долоо хоног", ko: "디펜스 위크" },
    theme: { en: "Don't get hit, then hit", mn: "Цохиулахгүй, дараа нь цохи", ko: "맞지 말고, 그다음 때려라" },
    focus: { en: "Philly shell · Catch and counter · Ring IQ", mn: "Мөрний хамгаалалт · Хаагаад хариу цохи · Зай ба цаг", ko: "필리 쉘 · 캐치 앤 카운터 · 링 IQ" },
  },
];

export function getFeaturedPackage() {
  const weekNum = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
  return EXPERIMENT_PACKAGES[weekNum % EXPERIMENT_PACKAGES.length];
}

export function getPackageFighter(pkg) {
  return FIGHTERS.find((f) => f.id === pkg.fighterId) || null;
}

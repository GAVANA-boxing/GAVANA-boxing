// Curated weekly experiment packages — rotate by ISO week number
import { FIGHTERS } from "@/lib/fighters";

export const EXPERIMENT_PACKAGES = [
  {
    id: "ali-week",
    fighterId: "muhammad-ali",
    accent: "#F5C451",
    archetype: "outboxer",
    week: { en: "Ali Week", mn: "Али долоо хоног", ko: "알리 위크" },
    theme: { en: "Float like a butterfly", mn: "Эрвээхэй шиг хөнгөн", ko: "나비처럼 날아라" },
    focus: { en: "Footwork · Lateral movement · Jab control", mn: "Хөдөлгөөн · Хажуу тал · Жааб контроль", ko: "풋워크 · 측면 이동 · 잽 컨트롤" },
  },
  {
    id: "tyson-week",
    fighterId: "mike-tyson",
    accent: "#FF3B30",
    archetype: "pressure",
    week: { en: "Tyson Week", mn: "Тайсон долоо хоног", ko: "타이슨 위크" },
    theme: { en: "Controlled chaos", mn: "Хяналттай эмх замбараагүй байдал", ko: "통제된 혼돈" },
    focus: { en: "Peek-a-boo · Inside pressure · Explosive combinations", mn: "Peek-a-boo · Дотоод дарамт · Тэсрэмтгий комбо", ko: "픽어부 · 인사이드 프레셔 · 폭발적 콤보" },
  },
  {
    id: "inoue-week",
    fighterId: "naoya-inoue",
    accent: "#F97316",
    archetype: "explosive",
    week: { en: "Inoue Week", mn: "Иноуэ долоо хоног", ko: "이노우에 위크" },
    theme: { en: "Monster precision", mn: "Мангасын нарийвчлал", ko: "몬스터 정밀함" },
    focus: { en: "Explosive combinations · Body-head switch · Counter instinct", mn: "Тэсрэмтгий комбо · Биед-толгой солилт · Контр зөн совин", ko: "폭발적 콤보 · 바디-헤드 전환 · 카운터 본능" },
  },
  {
    id: "bivol-week",
    fighterId: "dmitry-bivol",
    accent: "#3B82F6",
    archetype: "technician",
    week: { en: "Bivol Week", mn: "Бивол долоо хоног", ko: "비볼 위크" },
    theme: { en: "Soviet system", mn: "Зөвлөлтийн систем", ko: "소비에트 시스템" },
    focus: { en: "Systematic jab · Distance management · Technical defense", mn: "Системтэй жааб · Зайн удирдлага · Техникийн хамгаалалт", ko: "체계적 잽 · 거리 관리 · 기술적 방어" },
  },
  {
    id: "lomachenko-week",
    fighterId: "vasyl-lomachenko",
    accent: "#A855F7",
    archetype: "outboxer",
    week: { en: "Lomachenko Week", mn: "Ломаченко долоо хоног", ko: "로마첸코 위크" },
    theme: { en: "The Matrix", mn: "Матрикс", ko: "매트릭스" },
    focus: { en: "Pivot angles · Hi-tech footwork · Feint combinations", mn: "Эргэлтийн өнцөг · Хай-тек хөдөлгөөн · Хуурамч комбо", ko: "피벗 앵글 · 하이테크 풋워크 · 페인트 콤보" },
  },
  {
    id: "canelo-week",
    fighterId: "canelo-alvarez",
    accent: "#F59E0B",
    archetype: "counter",
    week: { en: "Canelo Week", mn: "Канело долоо хоног", ko: "카넬로 위크" },
    theme: { en: "Shoulder roll everything", mn: "Мөрний эргэлт бүгдэд", ko: "모든 것을 숄더 롤로" },
    focus: { en: "Shoulder roll · Check hook · Body intelligence", mn: "Мөрний эргэлт · Чек хук · Биений оюун", ko: "숄더 롤 · 체크 훅 · 바디 인텔리전스" },
  },
  {
    id: "ggc-week",
    fighterId: "gennady-golovkin",
    accent: "#10B981",
    archetype: "pressure",
    week: { en: "GGG Week", mn: "GGG долоо хоног", ko: "GGG 위크" },
    theme: { en: "Triple G Volume", mn: "Triple G хэмжээ", ko: "트리플 G 볼륨" },
    focus: { en: "Double jab · Body accumulation · Pressure with accuracy", mn: "Давхар жааб · Биед хуримтлал · Нарийн дарамт", ko: "더블 잽 · 바디 누적 · 정확한 프레셔" },
  },
  {
    id: "mayweather-week",
    fighterId: "floyd-mayweather",
    accent: "#94A3B8",
    archetype: "counter",
    week: { en: "Mayweather Week", mn: "Мэйвэзер долоо хоног", ko: "메이웨더 위크" },
    theme: { en: "The defensive masterclass", mn: "Хамгаалалтын мастар класс", ko: "방어의 마스터클래스" },
    focus: { en: "Philly shell · Catch and counter · Ring IQ", mn: "Фили шелл · Барьж контр хий · Рингийн IQ", ko: "필리 쉘 · 캐치 앤 카운터 · 링 IQ" },
  },
];

export function getFeaturedPackage() {
  const weekNum = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
  return EXPERIMENT_PACKAGES[weekNum % EXPERIMENT_PACKAGES.length];
}

export function getPackageFighter(pkg) {
  return FIGHTERS.find((f) => f.id === pkg.fighterId) || null;
}

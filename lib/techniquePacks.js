// The 30 technique drills (lib/fighterTechniques.js), grouped by WHAT they train — never by whose
// style they came from: no boxer's name is shown. A drill is identified internally by
// fighterId/index (the Train page still opens it through ?fighter=…&lesson=<slug>).
import { FIGHTER_TECHNIQUES } from "@/lib/fighterTechniques";

export const TECHNIQUE_PACKS = [
  { id: "footwork", icon: "🦶", name: { mn: "Хөл ба өнцөг", ko: "풋워크와 각도", en: "Footwork & angles" } },
  { id: "defense", icon: "🛡️", name: { mn: "Хамгаалалт ба хариу", ko: "방어와 카운터", en: "Defence & counters" } },
  { id: "combo", icon: "🥊", name: { mn: "Хослол ба хэмнэл", ko: "콤보와 리듬", en: "Combos & rhythm" } },
  { id: "power", icon: "💥", name: { mn: "Хүч ба ойр зай", ko: "파워와 근접전", en: "Power & close range" } },
];

// "fighterId/index" → { pack, title: { mn, ko, en } }
const D = (pack, mn, ko) => ({ pack, mn, ko });
const MAP = {
  "mike-tyson/0": D("defense", "Толгойн хамгаалалттай орох", "가드 올리고 들어가기"),
  "mike-tyson/1": D("power", "Жин ачаалж дэлбэрэх", "체중 싣고 폭발하기"),
  "mike-tyson/2": D("power", "Дотоод богино баруун", "인사이드 짧은 오른손"),
  "muhammad-ali/0": D("footwork", "Тэргүүн хөлөөр эргэж гарах", "앞발 피벗 빠지기"),
  "muhammad-ali/1": D("footwork", "Хөлийн үзүүрээр хөвөх", "발끝으로 뜨기"),
  "muhammad-ali/2": D("combo", "Цохиод шууд буцаах", "치고 바로 회수"),
  "naoya-inoue/0": D("combo", "Дээд-доод солилт", "상하 전환"),
  "naoya-inoue/1": D("defense", "Эсрэг баруун гар", "카운터 오른손"),
  "naoya-inoue/2": D("power", "Ойр зайн богино хук", "근접 짧은 훅"),
  "dmitry-bivol/0": D("combo", "Жэбийн хэмнэл ба буцаалт", "잽 리듬과 리셋"),
  "dmitry-bivol/1": D("defense", "Хамгаалалт сэргээх хөдөлгөөн", "가드 회복 움직임"),
  "dmitry-bivol/2": D("power", "Зөв зайн сахилга", "최적 거리 유지"),
  "vasyl-lomachenko/0": D("footwork", "Гаднах хөлөөр орох", "바깥발로 진입"),
  "vasyl-lomachenko/1": D("footwork", "Хослолын дунд өнцөг солих", "콤비네이션 중 각도 전환"),
  "vasyl-lomachenko/2": D("combo", "Чиглэл солих хуурмаг", "방향 전환 페인트"),
  "canelo-alvarez/0": D("defense", "Мөрөөр хамгаалах", "숄더 롤 방어"),
  "canelo-alvarez/1": D("defense", "Бөхийж богино хукаар хариулах", "숙이고 짧은 훅 카운터"),
  "canelo-alvarez/2": D("power", "Бие рүү цуглуулж цохих", "바디 누적 공략"),
  "gennady-golovkin/0": D("combo", "Гурвалсан жэбийн бэлтгэл", "트리플 잽 셋업"),
  "gennady-golovkin/1": D("footwork", "Рингийг тууштай таслах", "체계적인 링 컷"),
  "gennady-golovkin/2": D("power", "Дотор баруун гар", "근접 오른손"),
  "floyd-mayweather/0": D("defense", "Мөр ба тохойн хамгаалалтын байрлал", "숄더 가드 자세"),
  "floyd-mayweather/1": D("defense", "Барьж аваад хариулах", "받아내고 카운터"),
  "floyd-mayweather/2": D("combo", "Тэргүүн баруун гараар сааталдуулах", "리드 오른손 교란"),
  "manny-pacquiao/0": D("footwork", "Зүүн гарынхаа хөлийн байрлал", "사우스포 발 위치"),
  "manny-pacquiao/1": D("footwork", "Тэсрэлттэй богино алхам", "폭발적인 짧은 스텝"),
  "manny-pacquiao/2": D("combo", "Зүүн гарын дээд-доод цохилт", "사우스포 상하 레프트"),
  "roberto-duran/0": D("power", "Дотор толгойн хяналт", "인사이드 헤드 컨트롤"),
  "roberto-duran/1": D("combo", "Хэмнэл эвдэх", "리듬 깨기"),
  "roberto-duran/2": D("power", "Дарамттай орох алхам", "압박 전진"),
};

const slugOf = (title) => String(title).toLowerCase().replace(/\s+/g, "-");

/** → [{ pack, drills: [{ id, title: {mn,ko,en}, difficulty, url }] }] in pack order. */
export function techniquePacks(locale = "en", techniques = FIGHTER_TECHNIQUES) {
  const out = TECHNIQUE_PACKS.map((p) => ({ ...p, drills: [] }));
  for (const [fighterId, lessons] of Object.entries(techniques)) {
    lessons.forEach((l, i) => {
      const m = MAP[`${fighterId}/${i}`];
      const pack = out.find((p) => p.id === m?.pack);
      if (!pack) return;
      pack.drills.push({
        id: `${fighterId}/${i}`,
        title: { mn: m.mn, ko: m.ko, en: l.title },
        difficulty: l.difficulty,
        url: `/${locale}/train?fighter=${encodeURIComponent(fighterId)}&lesson=${encodeURIComponent(slugOf(l.title))}`,
      });
    });
  }
  return out;
}

/** The trilingual title of drill number `index` of `fighterId` (falls back to the English one). */
export function techniqueTitle(fighterId, index, techniques = FIGHTER_TECHNIQUES) {
  const l = techniques[fighterId]?.[index];
  if (!l) return null;
  const m = MAP[`${fighterId}/${index}`];
  return { mn: m?.mn || l.title, ko: m?.ko || l.title, en: l.title };
}

export { slugOf as techniqueSlug };

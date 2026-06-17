import { RED, GOLD } from "@/lib/tokens";

export const FALLBACK_SPARRING = [
  { id: "f1", fromName: "Бат-Эрдэнэ", weightClass: "75кг", gym: "Gavana Gym", time: "Өнөөдөр 19:00" },
  { id: "f2", fromName: "Анхбаяр", weightClass: "69кг", gym: "Khan Boxing", time: "Маргааш 10:00" },
  { id: "f3", fromName: "Дэлгэрмаа", weightClass: "60кг", gym: "Эрдэнэт Клуб", time: "Өнөөдөр 21:00" },
];

export const GYMS = [
  { id: "g1", name: "GAVANA GYM", city: "Улаанбаатар", members: 142, accent: RED, bg: "linear-gradient(160deg,#3d0007 0%,#150002 100%)" },
  { id: "g2", name: "KHAN BOXING", city: "Дархан", members: 68, accent: "#3B82F6", bg: "linear-gradient(160deg,#0a1e3d 0%,#030a18 100%)" },
  { id: "g3", name: "ЭРДЭНЭТ КЛУБ", city: "Эрдэнэт хот", members: 34, accent: "#10B981", bg: "linear-gradient(160deg,#00200f 0%,#000d06 100%)" },
];

export const COACHES = [
  { id: "c1", name: "ОЮУНАА БАГШ", sub: "Чемпион • 12 жил", rating: "5.0", accent: GOLD, bg: "linear-gradient(160deg,#2d1e00 0%,#100b00 100%)" },
  { id: "c2", name: "БОЛД ТРЕНЕР", sub: "ОХУ-ын экс-про", rating: "4.9", accent: "#A855F7", bg: "linear-gradient(160deg,#1e0833 0%,#0a0315 100%)" },
  { id: "c3", name: "МӨНХБАТ", sub: "Контр техник", rating: "4.8", accent: "#3B82F6", bg: "linear-gradient(160deg,#0a1e3d 0%,#030a18 100%)" },
];

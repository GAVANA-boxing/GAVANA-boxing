"use client";

import { GOLD, whiteAlpha } from "@/lib/tokens";
import { FIGHTERS } from "@/lib/fighters";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";
import { classifyFighterArchetype } from "@/lib/fighterDNA";

const ARCH_LABELS = {
  en: { pressure: "Pressure", outboxer: "Outboxer", counter: "Counter", explosive: "Explosive", technician: "Technician" },
  mn: { pressure: "Дарамт", outboxer: "Аутбоксер", counter: "Контр", explosive: "Тэсрэмтгий", technician: "Техникийн" },
  ko: { pressure: "압박", outboxer: "아웃복싱", counter: "카운터", explosive: "폭발력", technician: "기술" },
};
const ARCH_COLORS = {
  pressure: "#EF4444", outboxer: "#3B82F6", counter: "#8B5CF6", explosive: "#F59E0B", technician: "#10B981",
};
const SF_L = {
  en: {
    eyebrow: "FIGHTER STUDY",
    studiedCount: (n) => `${n} fighter${n !== 1 ? "s" : ""} studied`,
    studyPattern: "Study pattern",
    yourDNA: "Your DNA",
    alignedWith: "Aligned ✓",
    gap: "Study gap",
    gapHint: (arch) => `Study more ${arch} fighters to round out your education`,
    noStudied: "Visit fighter profiles to start building your study record.",
    nextUp: "Study next",
    discoverCta: "Discover fighters →",
    unstudied: "unstudied",
  },
  mn: {
    eyebrow: "СУДЛАГДСАН ТУЛААНЧИД",
    studiedCount: (n) => `${n} тулаанч судалсан`,
    studyPattern: "Судлах хэв маяг",
    yourDNA: "Таны ДНХ",
    alignedWith: "Тохирч байна ✓",
    gap: "Судлах орон зай",
    gapHint: (arch) => `${arch} тулаанчдыг судалж бэлтгэлээ гүйцэтгэ`,
    noStudied: "Тулаанчийн профайлыг зочлон судалгааны бичлэгээ эхлүүл.",
    nextUp: "Дараагийнх",
    discoverCta: "Тулаанч хайх →",
    unstudied: "судлаагүй",
  },
  ko: {
    eyebrow: "파이터 스터디",
    studiedCount: (n) => `${n}명의 파이터 학습`,
    studyPattern: "학습 패턴",
    yourDNA: "나의 DNA",
    alignedWith: "일치 ✓",
    gap: "학습 격차",
    gapHint: (arch) => `${arch} 파이터를 더 연구해 학습을 완성하세요`,
    noStudied: "파이터 프로필을 방문하여 학습 기록을 시작하세요.",
    nextUp: "다음 학습",
    discoverCta: "파이터 탐색 →",
    unstudied: "미학습",
  },
};

export default function StudiedFightersPanel({ studiedIds, dna, locale, router }) {
  const L = SF_L[locale] || SF_L.en;
  const AL = ARCH_LABELS[locale] || ARCH_LABELS.en;

  const studiedFighters = FIGHTERS.filter((f) => studiedIds.includes(f.id));
  const unstudiedFighters = FIGHTERS.filter((f) => !studiedIds.includes(f.id));

  if (studiedFighters.length === 0) {
    return (
      <div style={{ borderRadius: 14, padding: "14px 16px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}`, marginBottom: 8 }}>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 8 }}>{L.eyebrow}</div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: whiteAlpha(0.3), lineHeight: 1.5 }}>{L.noStudied}</p>
      </div>
    );
  }

  // Tally archetype distribution of studied fighters
  const archCounts = { pressure: 0, outboxer: 0, counter: 0, explosive: 0, technician: 0 };
  for (const f of studiedFighters) {
    const arch = classifyFighterArchetype(f);
    archCounts[arch] = (archCounts[arch] || 0) + 1;
  }
  const totalStudied = studiedFighters.length;
  const archEntries = Object.entries(archCounts)
    .filter(([, c]) => c > 0)
    .sort(([, a], [, b]) => b - a);

  // DNA archetype key
  const userArchKey = dna?.building ? null : dna?.archetypeKey;

  // Gap: archetype with zero studied fighters (prefer ones relevant to DNA gaps)
  const allArchKeys = ["pressure", "outboxer", "counter", "explosive", "technician"];
  const gapArch = allArchKeys.find((k) => k !== userArchKey && archCounts[k] === 0);
  const gapFighters = gapArch ? unstudiedFighters.filter((f) => classifyFighterArchetype(f) === gapArch).slice(0, 2) : [];

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${whiteAlpha(0.07)}`, background: whiteAlpha(0.02), marginBottom: 8 }}>
      {/* Header */}
      <div style={{ padding: "13px 16px 10px", borderBottom: `1px solid ${whiteAlpha(0.05)}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.3), textTransform: "uppercase", marginBottom: 3 }}>{L.eyebrow}</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: whiteAlpha(0.7) }}>{L.studiedCount(totalStudied)}</div>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/fighters`)}
            style={{ background: whiteAlpha(0.05), border: `1px solid ${whiteAlpha(0.1)}`, borderRadius: 8, padding: "5px 10px", color: whiteAlpha(0.45), fontSize: 9.5, fontWeight: 900, cursor: "pointer" }}
          >
            {L.discoverCta}
          </button>
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {/* Fighter dots row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {studiedFighters.map((f) => {
            const arch = classifyFighterArchetype(f);
            const color = ARCH_COLORS[arch] || GOLD;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => router.push(`/${locale}/fighters/${f.id}`)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: `${color}18`, border: `2px solid ${color}55`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 900, color,
                }}>
                  {f.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <span style={{ fontSize: 8, fontWeight: 800, color: whiteAlpha(0.4), maxWidth: 42, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f.name.split(" ").slice(-1)[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Archetype distribution bars */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.25), textTransform: "uppercase", marginBottom: 8 }}>{L.studyPattern}</div>
          {archEntries.map(([arch, count]) => {
            const pct = Math.round((count / totalStudied) * 100);
            const color = ARCH_COLORS[arch] || GOLD;
            const isUserArch = arch === userArchKey;
            return (
              <div key={arch} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 64, fontSize: 9, fontWeight: 900, color: isUserArch ? color : whiteAlpha(0.32), textTransform: "uppercase", letterSpacing: 0.8, flexShrink: 0 }}>
                  {AL[arch]}
                </span>
                <div style={{ flex: 1, height: 4, background: whiteAlpha(0.05), borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: isUserArch ? color : whiteAlpha(0.2), borderRadius: 2, boxShadow: isUserArch ? `0 0 6px ${color}55` : "none" }} />
                </div>
                <span style={{ width: 28, textAlign: "right", fontSize: 9, fontWeight: 900, color: isUserArch ? color : whiteAlpha(0.3), fontFamily: "monospace", flexShrink: 0 }}>{pct}%</span>
                {isUserArch && (
                  <span style={{ fontSize: 8, fontWeight: 900, color, background: `${color}14`, borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>{L.alignedWith}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Study gap recommendation */}
        {gapArch && gapFighters.length > 0 && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}` }}>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.25), textTransform: "uppercase", marginBottom: 5 }}>{L.gap}</div>
            <p style={{ margin: "0 0 8px", fontSize: 11, color: whiteAlpha(0.45), lineHeight: 1.4 }}>
              {L.gapHint(AL[gapArch])}
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              {gapFighters.map((f) => {
                const color = ARCH_COLORS[gapArch] || GOLD;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => router.push(`/${locale}/fighters/${f.id}`)}
                    style={{ flex: 1, padding: "7px 10px", borderRadius: 9, background: `${color}10`, border: `1px solid ${color}30`, color, fontSize: 10, fontWeight: 900, cursor: "pointer", textAlign: "left" }}
                  >
                    {f.name.split(" ").slice(-1)[0]}
                    <span style={{ fontSize: 8, color: whiteAlpha(0.3), display: "block", fontWeight: 700, marginTop: 1 }}>{L.unstudied}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

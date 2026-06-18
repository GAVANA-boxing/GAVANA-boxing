"use client";

import EmptyState from "@/components/EmptyState";

const ARCH_COLORS = {
  pressure: "#EF4444",
  outboxer: "#3B82F6",
  counter: "#8B5CF6",
  explosive: "#F59E0B",
  technician: "#10B981",
};

const ARCH_NAMES = {
  en: { pressure: "Pressure", outboxer: "Outboxer", counter: "Counter", explosive: "Explosive", technician: "Technician" },
  mn: { pressure: "Дарамт", outboxer: "Аутбоксер", counter: "Контр", explosive: "Тэсрэмтгий", technician: "Техникийн" },
  ko: { pressure: "압박", outboxer: "아웃복싱", counter: "카운터", explosive: "폭발력", technician: "기술" },
};

export default function GymDNADistribution({ members, requesterUsers, locale, router }) {
  const AL = ARCH_NAMES[locale] || ARCH_NAMES.en;

  const dist = {};
  members.forEach((m) => {
    const arch = requesterUsers[m.userId]?.fighterDNA?.archetypeKey;
    if (arch) dist[arch] = (dist[arch] || 0) + 1;
  });

  const total     = members.length;
  const confirmed = Object.values(dist).reduce((a, b) => a + b, 0);
  const building  = total - confirmed;
  const sorted    = Object.entries(dist).sort(([, a], [, b]) => b - a);
  const topArch   = sorted[0]?.[0];

  if (total === 0) {
    return (
      <EmptyState
        emoji="🧬"
        title={locale === "mn" ? "Гишүүд байхгүй байна" : locale === "ko" ? "멤버 없음" : "No members yet"}
      />
    );
  }

  return (
    <div>
      {/* Summary stats */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, padding: "12px 8px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display,'Anton',sans-serif)" }}>{total}</div>
          <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>
            {locale === "mn" ? "Нийт" : locale === "ko" ? "전체" : "Total"}
          </div>
        </div>
        <div style={{ flex: 1, padding: "12px 8px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 1000, color: "#34D399", fontFamily: "var(--font-display,'Anton',sans-serif)" }}>{confirmed}</div>
          <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>
            {locale === "mn" ? "ДНХ тогтсон" : locale === "ko" ? "DNA 확정" : "Confirmed"}
          </div>
        </div>
        {topArch && (
          <div style={{ flex: 1, padding: "12px 8px", borderRadius: 12, background: `${ARCH_COLORS[topArch]}10`, border: `1px solid ${ARCH_COLORS[topArch]}30`, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 1000, color: ARCH_COLORS[topArch], lineHeight: 1.2 }}>{AL[topArch]}</div>
            <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>
              {locale === "mn" ? "Хамгийн олон" : locale === "ko" ? "최다" : "Top"}
            </div>
          </div>
        )}
      </div>

      {/* Distribution bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map(([arch, count]) => (
          <div key={arch} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 80, fontSize: 11, fontWeight: 800, color: ARCH_COLORS[arch], flexShrink: 0 }}>{AL[arch]}</span>
            <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${(count / total) * 100}%`, height: "100%", background: ARCH_COLORS[arch], borderRadius: 4, boxShadow: `0 0 6px ${ARCH_COLORS[arch]}55`, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
            </div>
            <span style={{ width: 30, textAlign: "right", fontSize: 14, fontWeight: 900, color: ARCH_COLORS[arch], fontFamily: "var(--font-display,'Anton',sans-serif)" }}>{count}</span>
          </div>
        ))}
        {building > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 80, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
              {locale === "mn" ? "Бүрдэж байна" : locale === "ko" ? "구축 중" : "Building"}
            </span>
            <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${(building / total) * 100}%`, height: "100%", background: "rgba(255,255,255,0.12)", borderRadius: 4 }} />
            </div>
            <span style={{ width: 30, textAlign: "right", fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-display,'Anton',sans-serif)" }}>{building}</span>
          </div>
        )}
      </div>

      {/* Top by archetype */}
      {sorted.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 12 }}>
            {locale === "mn" ? "АРХЕТИПИЙН ТОП ГИШҮҮД" : locale === "ko" ? "아키타입별 TOP 멤버" : "TOP BY ARCHETYPE"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map(([arch]) => {
              const topMember = members.find((m) => requesterUsers[m.userId]?.fighterDNA?.archetypeKey === arch);
              if (!topMember) return null;
              const mu = requesterUsers[topMember.userId] || {};
              const name = mu.displayName || mu.username || mu.name || "Fighter";
              const photo = mu.photoURL || mu.profileImageUrl || "";
              const archColor = ARCH_COLORS[arch];
              return (
                <button
                  key={arch}
                  type="button"
                  onClick={() => topMember.userId && router.push(`/${locale}/profile/${topMember.userId}`)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: `${archColor}08`, border: `1px solid ${archColor}22`, textAlign: "left", cursor: "pointer", color: "#fff" }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${archColor}20`, border: `1px solid ${archColor}40`, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {photo
                      ? <img src={photo} alt="" width={34} height={34} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                      : <span style={{ fontSize: 13, fontWeight: 900, color: archColor }}>{name[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "#fff", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                    <div style={{ fontSize: 9, fontWeight: 900, color: archColor, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 1 }}>{AL[arch]}</div>
                  </div>
                  <div style={{ fontSize: 18, color: "rgba(255,255,255,0.15)" }}>›</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

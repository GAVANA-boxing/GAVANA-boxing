"use client";

import EmptyState from "@/components/EmptyState";
import { RED, GOLD } from "@/lib/tokens";

const ARCH_COLORS = {
  pressure: "#EF4444",
  outboxer: "#3B82F6",
  counter: "#8B5CF6",
  explosive: "#F59E0B",
  technician: "#10B981",
};

export default function GymSessionsTab({ members, requesterUsers, locale, router, t, gym }) {
  if (members.length === 0) {
    return (
      <EmptyState
        emoji="📅"
        title={t("gymDashSessionSchedule")}
        hint={locale === "mn" ? "Гишүүдийг урьж, дасгалын идэвхийг энд харна уу." : locale === "ko" ? "멤버를 초대하고 활동을 확인하세요." : "Invite members and track their activity here."}
        action={
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", marginTop: 4 }}>
            <button
              type="button"
              style={{ padding: "11px 24px", borderRadius: 999, border: "none", background: "linear-gradient(135deg, #FF3B30, #cc2820)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
              onClick={() => router.push(`/${locale}/coach`)}
            >
              {t("gymDashFindCoaches")}
            </button>
            <button
              type="button"
              style={{ padding: "10px 22px", borderRadius: 999, border: "1px solid rgba(245,196,81,0.4)", background: "rgba(245,196,81,0.08)", color: GOLD, fontSize: 13, fontWeight: 900, cursor: "pointer" }}
              onClick={() => {
                const link = `${window.location.origin}/${locale}/gyms/${gym?.id || ""}`;
                navigator.clipboard?.writeText(link).catch(() => {});
              }}
            >
              {locale === "mn" ? "Урилга хуулах" : locale === "ko" ? "초대 링크 복사" : "Copy Invite Link"}
            </button>
          </div>
        }
      />
    );
  }

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, padding: "12px 8px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display,'Anton',sans-serif)" }}>{members.length}</div>
          <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>
            {locale === "mn" ? "Гишүүд" : locale === "ko" ? "멤버" : "Members"}
          </div>
        </div>
        <div style={{ flex: 1, padding: "12px 8px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 1000, color: "#34D399", fontFamily: "var(--font-display,'Anton',sans-serif)" }}>
            {members.filter((m) => requesterUsers[m.userId]?.fighterDNA?.archetypeKey).length}
          </div>
          <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>
            {locale === "mn" ? "ДНХ тогтсон" : locale === "ko" ? "DNA 확정" : "DNA Set"}
          </div>
        </div>
        <div
          style={{ flex: 1, padding: "12px 8px", borderRadius: 12, background: "rgba(245,196,81,0.06)", border: "1px solid rgba(245,196,81,0.15)", textAlign: "center", cursor: "pointer" }}
          onClick={() => {
            const link = `${window.location.origin}/${locale}/gyms/${gym?.id || ""}`;
            navigator.clipboard?.writeText(link).catch(() => {});
          }}
        >
          <div style={{ fontSize: 20, lineHeight: 1.4 }}>🔗</div>
          <div style={{ fontSize: 8, fontWeight: 900, color: GOLD, textTransform: "uppercase", letterSpacing: 1 }}>
            {locale === "mn" ? "Урилга" : locale === "ko" ? "초대" : "Invite"}
          </div>
        </div>
      </div>

      {/* Member activity list */}
      <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 10 }}>
        {locale === "mn" ? "ГИШҮҮДИЙН ИДЭВХ" : locale === "ko" ? "멤버 활동" : "MEMBER ACTIVITY"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {members.map((mem) => {
          const mu = requesterUsers[mem.userId] || {};
          const name = mu.displayName || mu.username || mu.name || "Fighter";
          const photo = mu.photoURL || mu.profileImageUrl || "";
          const arch = mu.fighterDNA?.archetypeKey || mu.archetype || "";
          const archColor = ARCH_COLORS[arch] || "rgba(255,255,255,0.3)";
          const tier = mu.subscriptionTier || "fan";
          const joinedAt = mem.reviewedAt?.toDate
            ? mem.reviewedAt.toDate().toLocaleDateString()
            : mem.createdAt?.toDate
            ? mem.createdAt.toDate().toLocaleDateString()
            : "";
          const tierLabel = tier === "pro" ? "PRO" : tier === "champion" ? "CHAMP" : null;
          const tierColor = tier === "champion" ? RED : tier === "pro" ? GOLD : null;

          return (
            <button
              key={mem.id}
              type="button"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "left", cursor: "pointer", color: "#fff" }}
              onClick={() => mem.userId && router.push(`/${locale}/profile/${mem.userId}`)}
            >
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: arch ? `${archColor}20` : "rgba(255,255,255,0.08)", border: `1.5px solid ${arch ? archColor + "40" : "rgba(255,255,255,0.1)"}`, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {photo
                  ? <img src={photo} alt="" width={38} height={38} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                  : <span style={{ fontSize: 14, fontWeight: 900, color: arch ? archColor : "rgba(255,255,255,0.5)" }}>{name[0]?.toUpperCase()}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                  {tierLabel && (
                    <span style={{ fontSize: 8, fontWeight: 900, color: tierColor, border: `1px solid ${tierColor}55`, padding: "1px 5px", borderRadius: 4, flexShrink: 0 }}>{tierLabel}</span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: arch ? archColor : "rgba(255,255,255,0.3)", fontWeight: 700, marginTop: 1 }}>
                  {arch ? arch.toUpperCase() : (locale === "mn" ? "ДНХ тогтоогдоогүй" : locale === "ko" ? "DNA 미설정" : "DNA not set")}
                </div>
              </div>
              {joinedAt && (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>
                    {locale === "mn" ? "Элссэн" : locale === "ko" ? "가입" : "Joined"}
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{joinedAt}</div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

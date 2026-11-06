"use client";

import { useState } from "react";
import { loc } from "@/lib/loc";
import { shortDate } from "@/lib/progressStats";
import { getWeightClassLabel } from "@/lib/weightClasses";
import { ACHIEVEMENT_BADGES, TIER_COLOR } from "@/lib/badges";
import { BRAND, btnPrimary, btnSecondary, displayTitle, glass, glassCard, sectionLabel } from "@/components/ui/brand";
import { GlassIconButton as GlassIcon } from "@/components/ui/BrandHeader";

/**
 * The profile page's content — presentational only (data comes from
 * app/[locale]/profile/[userId]/page.js).
 *
 * Layout: a blurred backdrop made from the fighter's own photo (or their rank
 * colour), a centred avatar ringed in the rank colour, name + hashtags, stat
 * pills, then glass cards — rank, achievements as rounded tiles, the latest
 * sessions as a bento grid, Fighter DNA.
 */
export default function ProfileView({
  locale, t, profileUser, isOwnProfile,
  xp, rank, nextRank, rankPct,
  sessions = [], streak = 0, earnedBadgeIds = [], dna,
  social, // { followers, following } — shown only when the social side is on
  isFollowing, followLoading,
  onBack, onMenu, onEdit, onShareCard, onFollow, onFollowers, onFollowing, onLogout, signingOut,
  go,
  children, // extra sections (the social tabs in the full app)
}) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const [avatarError, setAvatarError] = useState(false);
  const name = profileUser.displayName || profileUser.username || "";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const photo = !avatarError && profileUser.photoURL;
  const cover = profileUser.coverPhotoURL || profileUser.coverPhoto || profileUser.photoURL;
  const tint = rank?.color || BRAND.red;

  const scores = sessions.map((s) => Number(s.score)).filter(Number.isFinite);
  const best = scores.length ? Math.max(...scores) : null;

  // "Хүрэл бүс" → "#ХүрэлБүс"
  const hashtag = (text) => "#" + String(text || "").split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  const tags = [
    profileUser.stance === "southpaw" ? "#Southpaw" : profileUser.stance === "orthodox" ? "#Orthodox" : null,
    profileUser.weightClass && getWeightClassLabel(profileUser.weightClass) ? hashtag(getWeightClassLabel(profileUser.weightClass)) : null,
    dna && !dna.building && dna.archetype ? hashtag(dna.archetype) : null,
  ].filter(Boolean);

  // Bento: one wide tile + full rows of three (2 + 1, then 3s) — 1, 2, 5 or 8 tiles.
  const tileCount = sessions.length >= 8 ? 8 : sessions.length >= 5 ? 5 : Math.min(sessions.length, 2);

  const earned = ACHIEVEMENT_BADGES.filter((b) => earnedBadgeIds.includes(b.id));
  const locked = ACHIEVEMENT_BADGES.filter((b) => !earnedBadgeIds.includes(b.id)).slice(0, 3);

  return (
    <div style={{ position: "relative", overflowX: "hidden" }}>
      {/* ── Backdrop: the fighter's photo, blurred into the page ── */}
      <div aria-hidden="true" style={backdrop}>
        {cover
          ? <div style={{ ...backdropImg, backgroundImage: `url("${cover}")` }} />
          : <>
              <div style={{ ...orb, background: tint, left: "-10%", top: "-20%" }} />
              <div style={{ ...orb, background: BRAND.red, right: "-15%", top: "5%", opacity: 0.45 }} />
            </>}
        <div style={backdropFade} />
      </div>

      <div style={wrap}>
        {/* ── Top bar ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 42 }}>
          {onBack
            ? <GlassIcon label={L("Буцах", "뒤로", "Back")} onClick={onBack}><path d="M15 18l-6-6 6-6" /></GlassIcon>
            : <span />}
          <span style={{ display: "flex", gap: 8 }}>
            {onShareCard && (
              <GlassIcon label={L("Тулаанчийн карт", "파이터 카드", "Fighter card")} onClick={onShareCard}>
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
              </GlassIcon>
            )}
            {onMenu && (
              <GlassIcon label={L("Цэс", "메뉴", "Menu")} onClick={onMenu}>
                <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="14" y2="17" />
              </GlassIcon>
            )}
          </span>
        </div>

        {/* ── Identity ── */}
        <header style={{ textAlign: "center", marginTop: 36 }}>
          <div style={{ position: "relative", width: 112, height: 112, margin: "0 auto" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", padding: 3, background: `conic-gradient(from 200deg, ${tint}, ${BRAND.red}, ${tint})`, boxShadow: `0 18px 50px ${hexA(tint, 0.35)}` }}>
              <div style={avatarInner}>
                {photo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={photo} alt={name} onError={() => setAvatarError(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ ...displayTitle, fontSize: 38 }}>{initials}</span>}
              </div>
            </div>
            {streak > 0 && (
              <span style={streakChip} title={L(`${streak} өдөр дараалан`, `${streak}일 연속`, `${streak}-day streak`)}>🔥 {streak}</span>
            )}
          </div>

          <h1 style={{ ...displayTitle, fontSize: 34, marginTop: 18 }}>{name}</h1>
          {profileUser.username && <div style={{ marginTop: 6, fontSize: 14, color: BRAND.faint }}>@{profileUser.username}</div>}

          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "4px 10px", marginTop: 12, fontSize: 14 }}>
            {rank && <span style={{ color: tint, fontWeight: 700 }}>{hashtag(t(rank.key))}</span>}
            {tags.map((tag) => <span key={tag} style={{ color: BRAND.muted }}>{tag}</span>)}
          </div>

          {profileUser.bio && <p style={{ margin: "12px auto 0", maxWidth: 340, fontSize: 14, lineHeight: 1.5, color: BRAND.muted }}>{profileUser.bio}</p>}

          {/* Stat pills */}
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
            <Pill value={scores.length} label={L("бэлтгэл", "세션", "sessions")} />
            <Pill value={best != null ? best.toFixed(1) : "—"} label={L("шилдэг", "최고", "best")} />
            <Pill value={xp.toLocaleString()} label="XP" />
            {social && <Pill value={social.followers} label={L("дагагч", "팔로워", "followers")} onClick={onFollowers} />}
            {social && <Pill value={social.following} label={L("дагаж буй", "팔로잉", "following")} onClick={onFollowing} />}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            {isOwnProfile
              ? <button type="button" onClick={onEdit} style={{ ...btnSecondary, ...glass, minHeight: 46 }}>{L("Профайл засах", "프로필 편집", "Edit profile")}</button>
              : <button type="button" onClick={onFollow} disabled={followLoading} style={isFollowing ? { ...btnSecondary, ...glass, minHeight: 46 } : { ...btnPrimary, minHeight: 46 }}>
                  {followLoading ? "…" : isFollowing ? L("Дагаж байна", "팔로잉", "Following") : L("Дагах", "팔로우", "Follow")}
                </button>}
          </div>
        </header>

        {/* ── Rank (glass) ── */}
        {rank && (
          <button type="button" onClick={() => go("/progress")} style={{ ...glassCard, ...rowBtn, marginTop: 24, overflow: "hidden", position: "relative" }}>
            <span aria-hidden="true" style={{ position: "absolute", width: 160, height: 160, right: -40, top: -60, borderRadius: "50%", background: tint, opacity: 0.28, filter: "blur(40px)" }} />
            <span style={{ flex: 1, minWidth: 0, position: "relative" }}>
              <span style={{ ...sectionLabel, color: tint, display: "block" }}>{L("Цол", "등급", "Rank")}</span>
              <span style={{ ...displayTitle, display: "block", fontSize: 24, marginTop: 6 }}>{t(rank.key)}</span>
              <span style={{ display: "block", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginTop: 12 }}>
                <span style={{ display: "block", height: "100%", width: `${Math.round(rankPct)}%`, background: `linear-gradient(90deg, ${tint}, ${BRAND.gold})`, borderRadius: 3 }} />
              </span>
              <span style={{ display: "block", marginTop: 8, fontSize: 13, color: BRAND.faint }}>
                {nextRank
                  ? L(`${t(nextRank.key)} хүртэл ${(nextRank.minXP - xp).toLocaleString()} XP`, `${t(nextRank.key)}까지 ${(nextRank.minXP - xp).toLocaleString()} XP`, `${(nextRank.minXP - xp).toLocaleString()} XP to ${t(nextRank.key)}`)
                  : L("Хамгийн дээд цол", "최고 등급", "Top rank")}
              </span>
            </span>
            <Chevron />
          </button>
        )}

        {/* ── Achievements: rounded tiles, like story bubbles ── */}
        <section style={{ marginTop: 26 }}>
          <div style={sectionHead}>
            <p style={sectionLabel}>{L("Амжилт", "업적", "Achievements")}</p>
            <span style={{ fontSize: 13, color: BRAND.faint }}>{earned.length}/{ACHIEVEMENT_BADGES.length}</span>
          </div>
          <div style={tileRow}>
            {earned.map((b) => <BadgeTile key={b.id} badge={b} locale={locale} earned />)}
            {locked.map((b) => <BadgeTile key={b.id} badge={b} locale={locale} />)}
          </div>
        </section>

        {/* ── Sessions: bento grid ── */}
        <section style={{ marginTop: 26 }}>
          <div style={sectionHead}>
            <p style={sectionLabel}>{L("Бэлтгэлүүд", "세션", "Sessions")}</p>
            {sessions.length > 0 && <button type="button" onClick={() => go("/history")} style={linkBtn}>{L("Бүгд", "전체", "All")} →</button>}
          </div>
          {sessions.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {sessions.slice(0, tileCount).map((s, i) => (
                <SessionTile key={s.id || i} s={s} big={i === 0} full={tileCount === 1} locale={locale} L={L} onClick={() => go("/history")} />
              ))}
            </div>
          ) : (
            <div style={{ ...glassCard, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 32 }} aria-hidden="true">🥊</div>
              <p style={{ margin: "8px 0 14px", fontSize: 15, color: BRAND.muted }}>
                {isOwnProfile
                  ? L("Анхны раундаа хийгээд энд оноогоо хар.", "첫 라운드를 하고 점수를 확인하세요.", "Do your first round and your scores show up here.")
                  : L("Одоогоор бэлтгэл алга.", "아직 세션이 없어요.", "No sessions yet.")}
              </p>
              {isOwnProfile && <button type="button" onClick={() => go("/train")} style={btnPrimary}>{L("Раунд эхлүүлэх", "라운드 시작", "Start a round")}</button>}
            </div>
          )}
        </section>

        {/* ── Fighter DNA ── */}
        {isOwnProfile && dna && (
          <button type="button" onClick={() => go("/fighter-profile")} style={{ ...glassCard, ...rowBtn, marginTop: 12 }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ ...sectionLabel, display: "block" }}>Fighter DNA</span>
              <span style={{ display: "block", marginTop: 6, fontSize: 17, fontWeight: 700 }}>
                {dna.building
                  ? L(`${3 - (dna.sessionsNeeded ?? 3)}/3 бэлтгэл — DNA нээгдэнэ`, `${3 - (dna.sessionsNeeded ?? 3)}/3 세션 — DNA 공개`, `${3 - (dna.sessionsNeeded ?? 3)}/3 sessions to unlock`)
                  : dna.archetype}
              </span>
            </span>
            <Chevron />
          </button>
        )}

        {children}

        {isOwnProfile && onLogout && (
          <button type="button" onClick={onLogout} disabled={signingOut} style={{ ...linkBtn, display: "block", margin: "28px auto 0", color: "rgba(248,113,113,0.8)" }}>
            {signingOut ? "…" : L("Гарах", "로그아웃", "Sign out")}
          </button>
        )}
      </div>
    </div>
  );
}

function Pill({ value, label, onClick }) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick} style={{ ...glass, display: "inline-flex", alignItems: "baseline", gap: 6, padding: "8px 14px", borderRadius: 999, color: BRAND.text, font: "inherit", cursor: onClick ? "pointer" : "default" }}>
      <b style={{ fontSize: 15, fontWeight: 700 }}>{value}</b>
      <span style={{ fontSize: 13, color: BRAND.muted }}>{label}</span>
    </Tag>
  );
}

function BadgeTile({ badge, locale, earned }) {
  const c = TIER_COLOR[badge.tier] || BRAND.gold;
  const label = locale === "mn" ? badge.nameMn : badge.name;
  return (
    <div style={{ flex: "0 0 auto", width: 76, textAlign: "center", opacity: earned ? 1 : 0.38 }} title={locale === "mn" ? badge.descMn : badge.desc}>
      <div style={{
        width: 70, height: 82, margin: "0 auto", borderRadius: 26, padding: 2.5,
        background: earned ? `linear-gradient(160deg, ${c}, ${BRAND.red})` : "rgba(255,255,255,0.12)",
      }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 24, background: earned ? `radial-gradient(circle at 50% 30%, ${hexA(c, 0.28)}, #121215 70%)` : "#121215", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, filter: earned ? "none" : "grayscale(1)" }}>
          {earned ? badge.icon : "🔒"}
        </div>
      </div>
      <div style={{ marginTop: 6, fontSize: 11.5, lineHeight: 1.25, color: earned ? BRAND.muted : BRAND.faint }}>{label}</div>
    </div>
  );
}

function SessionTile({ s, big, full, locale, L, onClick }) {
  const score = Number(s.score);
  const c = !Number.isFinite(score) ? BRAND.faint : score >= 8 ? BRAND.green : score >= 6.5 ? BRAND.gold : BRAND.red;
  const punches = Number(s.poseMetrics?.punchCount) || 0;
  return (
    <button type="button" onClick={onClick} style={{
      gridColumn: full ? "span 3" : big ? "span 2" : "span 1",
      aspectRatio: full ? "3 / 1" : big ? "2 / 1" : "1 / 1",
      position: "relative", overflow: "hidden", textAlign: "left", cursor: "pointer", font: "inherit", color: BRAND.text,
      borderRadius: 22, border: `1px solid ${BRAND.line}`,
      background: `radial-gradient(120% 90% at 100% 0%, ${hexA(c, big ? 0.32 : 0.22)}, transparent 60%), rgba(255,255,255,0.035)`,
      padding: big ? "14px 16px" : "10px 12px",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <span style={{ fontSize: big ? 13 : 11.5, color: BRAND.faint }}>{shortDate(s.createdAt, locale)}</span>
      <span>
        <span style={{ ...displayTitle, display: "block", fontSize: big ? 46 : 30, color: c }}>{Number.isFinite(score) ? score.toFixed(1) : "—"}</span>
        {punches > 0 && <span style={{ display: "block", marginTop: 4, fontSize: big ? 13 : 11, color: BRAND.muted }}>{punches} {L("цохилт", "펀치", "punches")}</span>}
      </span>
    </button>
  );
}

function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND.faint} strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ position: "relative", flexShrink: 0 }}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/** "#F5C451" + alpha → "rgba(...)". */
function hexA(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return `rgba(255,59,48,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const wrap = {
  position: "relative",
  maxWidth: 540,
  margin: "0 auto",
  padding: "calc(14px + env(safe-area-inset-top)) 16px calc(110px + env(safe-area-inset-bottom))",
};
const rowBtn = {
  display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
  padding: "18px 18px", cursor: "pointer", font: "inherit",
};
const backdrop = { position: "absolute", left: 0, right: 0, top: 0, height: 420, overflow: "hidden", pointerEvents: "none" };
const backdropImg = {
  position: "absolute", inset: "-15%",
  backgroundSize: "cover", backgroundPosition: "center",
  filter: "blur(38px) saturate(1.6)", opacity: 0.7, transform: "scale(1.1)",
};
const orb = { position: "absolute", width: "75%", aspectRatio: "1", borderRadius: "50%", filter: "blur(70px)", opacity: 0.4 };
const backdropFade = { position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,8,10,0.15) 0%, rgba(8,8,10,0.55) 55%, #08080a 100%)" };
const avatarInner = {
  width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden",
  border: "3px solid #08080a", background: "#1a1a1e",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const streakChip = {
  position: "absolute", left: "50%", bottom: -10, transform: "translateX(-50%)",
  padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap",
  background: "linear-gradient(135deg, #FB923C, #FF3B30)", border: "2px solid #08080a",
  fontSize: 12, fontWeight: 700, color: "#fff",
};
const sectionHead = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 };
const tileRow = { display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, margin: "0 -16px", paddingLeft: 16, paddingRight: 16, scrollbarWidth: "none" };
const linkBtn = { background: "none", border: "none", padding: 0, color: BRAND.muted, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" };

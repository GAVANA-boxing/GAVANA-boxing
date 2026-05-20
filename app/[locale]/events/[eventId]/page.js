"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";
import { RED, GOLD , PURPLE, redAlpha, goldAlpha} from "@/lib/tokens";
import { useEventData } from "@/hooks/useEventData";
import Image from "next/image";

const TYPE_META = {
  boxing:     { mn: "Бокс",     ko: "복싱",    en: "Boxing",     color: RED, emoji: "🥊" },
  mma:        { mn: "MMA",      ko: "MMA",     en: "MMA",        color: PURPLE, emoji: "⚔️" },
  muay_thai:  { mn: "Муай Тай", ko: "무에타이", en: "Muay Thai",  color: "#F97316", emoji: "🦵" },
  sparring:   { mn: "Спарринг", ko: "스파링",   en: "Sparring",   color: "#34D399", emoji: "🤜" },
  tournament: { mn: "Тэмцээн",  ko: "토너먼트", en: "Tournament", color: GOLD, emoji: "🏆" },
  seminar:    { mn: "Семинар",   ko: "세미나",   en: "Seminar",   color: "#60A5FA", emoji: "📚" },
};

function getTypeLabel(type, locale) {
  const meta = TYPE_META[type];
  if (!meta) return type;
  return meta[locale] || meta.en;
}

function formatEventDate(dateStr, locale) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(
    locale === "mn" ? "mn-MN" : locale === "ko" ? "ko-KR" : "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }
  );
}

function isUpcoming(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) >= new Date();
}

function isLive(event) {
  if (!event?.date) return false;
  const now = Date.now();
  const start = new Date(event.date).getTime();
  const end = start + (event.durationMinutes || 120) * 60 * 1000;
  return now >= start && now <= end;
}

function useCountdown(dateStr) {
  const [ms, setMs] = useState(null);
  useEffect(() => {
    if (!dateStr) return;
    const target = new Date(dateStr).getTime();
    const tick = () => setMs(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateStr]);
  return ms;
}

function formatCountdown(ms, locale) {
  if (ms === null || ms === undefined) return "";
  if (ms <= 0) return locale === "mn" ? "🔴 Одоо явагдаж байна" : locale === "ko" ? "🔴 진행 중" : "🔴 Live now";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (days > 0) return locale === "mn" ? `${days}ө ${hours}ц ${mins}м` : locale === "ko" ? `${days}일 ${hours}시간 ${mins}분` : `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return locale === "mn" ? `${hours}ц ${mins}м ${secs}с` : locale === "ko" ? `${hours}시간 ${mins}분 ${secs}초` : `${hours}h ${mins}m ${secs}s`;
  return locale === "mn" ? `${mins}м ${secs}с` : locale === "ko" ? `${mins}분 ${secs}초` : `${mins}m ${secs}s`;
}

export default function EventDetailPage() {
  const params = useParams();
  const locale = getLocale(params?.locale);
  const eventId = params?.eventId;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const t = (key) => translate(locale, key);

  const {
    event, setEvent,
    rsvps,
    participants,
    isGoing,
    loading,
    rsvping,
    reminderSet,
    settingReminder,
    handleRsvp,
    handleReminder,
  } = useEventData({ eventId, user, authLoading, locale, router });
  const [shareCopied, setShareCopied] = useState(false);
  const countdown = useCountdown(event?.date);

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  const handleShare = async () => {
    if (!event) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const dateStr = event.date ? formatEventDate(event.date, locale) : "";
    const locationStr = [event.location, event.city].filter(Boolean).join(", ");
    const text = locale === "mn"
      ? `${event.title}${dateStr ? ` — ${dateStr}` : ""}${locationStr ? ` @ ${locationStr}` : ""} | GAVANA`
      : locale === "ko"
      ? `${event.title}${dateStr ? ` — ${dateStr}` : ""}${locationStr ? ` @ ${locationStr}` : ""} | GAVANA`
      : `${event.title}${dateStr ? ` — ${dateStr}` : ""}${locationStr ? ` @ ${locationStr}` : ""} | GAVANA Boxing`;
    try {
      if (navigator.share) { await navigator.share({ title: event.title, text, url }); return; }
    } catch {}
    try { await navigator.clipboard.writeText(`${text}\n${url}`); } catch {}
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  if (!user && !authLoading) return null;
  if (authLoading || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#fff" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ height: 44, paddingTop: 16, marginBottom: 20 }}>
            <div className="shimmer" style={{ width: 100, height: 20, borderRadius: 8, background: "rgba(255,255,255,0.06)" }} />
          </div>
          <div className="shimmer" style={{ height: 140, borderRadius: "3px 20px 20px 3px", background: "rgba(255,255,255,0.06)", marginBottom: 12 }} />
          <div className="shimmer" style={{ height: 160, borderRadius: 16, background: "rgba(255,255,255,0.06)", marginBottom: 12 }} />
          <div className="shimmer" style={{ height: 52, borderRadius: 14, background: "rgba(255,255,255,0.06)" }} />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={s.page}>
        <div style={s.inner}>
          <button type="button" style={s.backBtn} onClick={() => router.push(`/${locale}/events`)}>← {t("eventBack")}</button>
          <div style={s.notFound}>
            <span style={{ fontSize: 44, opacity: 0.4 }}>🏆</span>
            <p style={{ color: "rgba(255,255,255,0.45)", margin: 0 }}>{t("eventNotFound")}</p>
          </div>
        </div>
        <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
      </div>
    );
  }

  const meta = TYPE_META[event.eventType] || TYPE_META.boxing;
  const upcoming = isUpcoming(event.date);
  const live = isLive(event);
  const isFull = event.maxParticipants && (event.participantCount || 0) >= event.maxParticipants && !isGoing;
  const isOrganizer = event.organizerId === user.uid;

  return (
    <div style={{ ...s.page, background: `radial-gradient(ellipse at top, ${meta.color}10 0%, transparent 40%), #0A0A0A` }}>
      <div style={s.inner}>
        <button type="button" style={s.backBtn} onClick={() => router.push(`/${locale}/events`)}>
          ← {t("eventBackToList")}
        </button>

        {/* Hero */}
        <div style={{ ...s.heroCard, borderLeftColor: live ? "#34D399" : meta.color }}>
          <div style={s.heroTop}>
            <span style={{ ...s.typeBadge, background: `${meta.color}18`, color: meta.color, borderColor: `${meta.color}35` }}>
              {meta.emoji} {getTypeLabel(event.eventType, locale)}
            </span>
            {live && (
              <span style={s.liveBadge}>
                <span style={s.liveDot} />
                LIVE
              </span>
            )}
            {!live && !upcoming && <span style={s.pastLabel}>{t("eventPast")}</span>}
          </div>
          <h1 style={s.eventTitle}>{event.title}</h1>
          {event.description && <p style={s.eventDesc}>{event.description}</p>}

          {/* Countdown */}
          {upcoming && !live && countdown !== null && (
            <div style={s.countdownBox}>
              <span style={s.countdownLabel}>
                {t("eventStartsIn")}
              </span>
              <span style={s.countdownValue}>{formatCountdown(countdown, locale)}</span>
            </div>
          )}
          {live && (
            <div style={{ ...s.countdownBox, borderColor: "rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.08)" }}>
              <span style={{ ...s.countdownValue, color: "#34D399" }}>
                {t("eventHappeningNow")}
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div style={s.detailsCard}>
          {event.date && (
            <div style={s.detailRow}>
              <span style={s.detailIcon}>📅</span>
              <div>
                <p style={s.detailLabel}>{t("eventDateTime")}</p>
                <p style={s.detailValue}>{formatEventDate(event.date, locale)}</p>
              </div>
            </div>
          )}
          {(event.city || event.location) && (
            <div style={s.detailRow}>
              <span style={s.detailIcon}>📍</span>
              <div style={{ flex: 1 }}>
                <p style={s.detailLabel}>{t("eventLocation")}</p>
                <p style={s.detailValue}>{[event.city, event.location].filter(Boolean).join(" · ")}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent([event.location, event.city].filter(Boolean).join(", "))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "#60A5FA", fontWeight: 800, letterSpacing: 0.3, textDecoration: "none", display: "inline-block", marginTop: 4 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  🗺 {t("eventViewOnMaps")}
                </a>
              </div>
            </div>
          )}
          <div style={s.detailRow}>
            <span style={s.detailIcon}>👥</span>
            <div style={{ flex: 1 }}>
              <p style={s.detailLabel}>{t("eventParticipants")}</p>
              <p style={s.detailValue}>
                {event.participantCount || 0}
                {event.maxParticipants ? ` / ${event.maxParticipants}` : ""}
                {event.maxParticipants && <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}> {t("eventSpots")}</span>}
              </p>
              {event.maxParticipants > 0 && (() => {
                const pct = Math.round(Math.min(100, ((event.participantCount || 0) / event.maxParticipants) * 100));
                const barColor = pct >= 90 ? "#F87171" : pct >= 60 ? GOLD : "#34D399";
                return (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: barColor, transition: "width 600ms ease" }} />
                    </div>
                    <p style={{ margin: "3px 0 0", fontSize: 9, color: barColor, fontWeight: 900 }}>
                      {pct >= 90 ? t("eventAlmostFull")
                        : `${event.maxParticipants - (event.participantCount || 0)} ${t("eventSpotsLeft")}`}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
          <div style={s.detailRow}>
            <span style={s.detailIcon}>🎤</span>
            <div>
              <p style={s.detailLabel}>{t("eventOrganizer")}</p>
              <p style={s.detailValue}>{event.organizerName}</p>
            </div>
          </div>
        </div>

        {/* RSVP button */}
        {upcoming && !isOrganizer && (
          <button
            type="button"
            disabled={rsvping || isFull}
            onClick={handleRsvp}
            style={isGoing ? s.cancelRsvpBtn : isFull ? s.fullBtn : s.rsvpBtn}
          >
            {rsvping ? "…"
              : isGoing ? t("eventCancelRsvp")
              : isFull ? t("eventFull")
              : t("eventRsvp")}
          </button>
        )}
        {/* Reminder button */}
        {upcoming && (
          <button
            type="button"
            disabled={reminderSet || settingReminder}
            onClick={handleReminder}
            style={reminderSet ? s.reminderSetBtn : s.reminderBtn}
          >
            {settingReminder ? "…"
              : reminderSet
              ? t("eventReminderSet")
              : t("eventSetReminder")}
          </button>
        )}

        {/* Share event */}
        <button
          type="button"
          onClick={handleShare}
          style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: `1px solid ${goldAlpha(0.25)}`, background: `${goldAlpha(0.06)}`, color: shareCopied ? "#34D399" : GOLD, fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 8 }}
        >
          {shareCopied ? t("eventLinkCopied") : t("eventShare")}
        </button>

        {isOrganizer && (
          <div style={s.organizerBanner}>
            🎤 {t("eventYouAreOrganizer")}
          </div>
        )}

        {/* Participants list */}
        {rsvps.length > 0 && (
          <div style={s.participantSection}>
            <p style={s.sectionLabel}>
              {t("eventParticipantsList")} ({rsvps.length})
            </p>
            <div style={s.participantGrid}>
              {rsvps.map((r) => {
                const pu = participants[r.userId] || {};
                const name = pu.displayName || pu.username || "Fighter";
                const photo = pu.photoURL || pu.profileImageUrl || "";
                return (
                  <div key={r.userId} style={s.participantChip}
                    onClick={() => router.push(`/${locale}/profile/${r.userId}`)}>
                    <div style={s.partAvatar}>
                      {photo
                        ? <Image src={photo} alt="" width={34} height={34} style={{ objectFit: "cover" }} />
                        : <span style={s.partAvatarInitial}>{name[0]?.toUpperCase()}</span>}
                    </div>
                    <span style={s.partName}>{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
    </div>
  );
}

const s = {
  loading: { minHeight: "100vh", background: "#0A0A0A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
  page: { minHeight: "100dvh", background: "#070707", color: "#fff" },
  inner: { maxWidth: 520, margin: "0 auto", padding: "0 16px calc(90px + env(safe-area-inset-bottom))" },
  backBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.55)", fontSize: 14, cursor: "pointer", padding: "16px 0", display: "block" },
  notFound: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "80px 0", textAlign: "center" },
  heroCard: { background: "linear-gradient(145deg, #111012, #0a0a0a)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid #C1121F", borderRadius: "3px 20px 20px 3px", padding: "18px 18px 20px", marginBottom: 12 },
  heroTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  typeBadge: { display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 999, border: "1px solid", fontSize: 11, fontWeight: 900, letterSpacing: 0.3 },
  pastLabel: { fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 700 },
  eventTitle: { margin: "0 0 10px", fontSize: 24, fontWeight: 1000, lineHeight: 1.15, color: "#fff" },
  eventDesc: { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 },
  detailsCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 },
  detailRow: { display: "flex", alignItems: "flex-start", gap: 12 },
  detailIcon: { fontSize: 18, flexShrink: 0, marginTop: 1 },
  detailLabel: { margin: "0 0 2px", fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { margin: 0, fontSize: 14, color: "#fff", fontWeight: 700 },
  rsvpBtn: { width: "100%", padding: 16, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#C1121F,#7d0812)", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 28px ${redAlpha(0.32)}`, marginBottom: 10 },
  cancelRsvpBtn: { width: "100%", padding: 16, borderRadius: 14, border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.08)", color: "#34D399", fontSize: 15, fontWeight: 900, cursor: "pointer", marginBottom: 10 },
  fullBtn: { width: "100%", padding: 16, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 15, fontWeight: 700, cursor: "not-allowed", marginBottom: 10 },
  reminderBtn: { width: "100%", padding: 13, borderRadius: 14, border: `1px solid ${goldAlpha(0.3)}`, background: `${goldAlpha(0.06)}`, color: GOLD, fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 16 },
  reminderSetBtn: { width: "100%", padding: 13, borderRadius: 14, border: "1px solid rgba(52,211,153,0.2)", background: "rgba(52,211,153,0.05)", color: "rgba(52,211,153,0.7)", fontSize: 14, fontWeight: 800, cursor: "not-allowed", marginBottom: 16 },
  countdownBox: { marginTop: 14, padding: "10px 14px", borderRadius: 12, background: `${goldAlpha(0.06)}`, border: `1px solid ${goldAlpha(0.2)}`, display: "flex", alignItems: "center", justifyContent: "space-between" },
  countdownLabel: { fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  countdownValue: { fontSize: 18, fontWeight: 1000, color: GOLD, fontVariantNumeric: "tabular-nums", letterSpacing: 0.5 },
  liveBadge: { display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 999, background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.4)", color: "#34D399", fontSize: 11, fontWeight: 900, letterSpacing: 1.2 },
  liveDot: { width: 7, height: 7, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 6px #34D399" },
  organizerBanner: { padding: "12px 16px", borderRadius: 12, background: `${goldAlpha(0.08)}`, border: `1px solid ${goldAlpha(0.2)}`, color: GOLD, fontSize: 13, fontWeight: 700, marginBottom: 16, textAlign: "center" },
  participantSection: { marginTop: 4 },
  sectionLabel: { margin: "0 0 10px", fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 },
  participantGrid: { display: "flex", flexDirection: "column", gap: 8 },
  participantChip: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" },
  partAvatar: { width: 34, height: 34, borderRadius: "50%", background: `${redAlpha(0.2)}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 },
  partAvatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  partAvatarInitial: { fontSize: 13, fontWeight: 900, color: "#fff" },
  partName: { fontSize: 14, fontWeight: 700, color: "#fff" },
};

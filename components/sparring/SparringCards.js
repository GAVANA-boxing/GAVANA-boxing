"use client";

import { translate } from "@/lib/i18n";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import { RED, RED_DARK, GOLD, redAlpha , blackAlpha} from "@/lib/tokens";
import { getWeightClassLabel } from "@/lib/weightClasses";
import { c } from "@/components/sparring/sparringStyles";
import { formatAgo } from "@/lib/utils";
import Image from "next/image";

const ARCHETYPE_STATS = {
  pressure:  { SPD: 75, PWR: 80, TEC: 55, STAM: 90 },
  counter:   { SPD: 85, PWR: 65, TEC: 90, STAM: 70 },
  technical: { SPD: 80, PWR: 50, TEC: 95, STAM: 72 },
  brawler:   { SPD: 60, PWR: 95, TEC: 50, STAM: 80 },
};

const STAT_DEFS = [
  { key: "SPD", label: "SPD", color: "#60A5FA" },
  { key: "PWR", label: "PWR", color: "#F87171" },
  { key: "TEC", label: "TEC", color: "#34D399" },
  { key: "STAM", label: "STA", color: "#FB923C" },
];

export function FighterCard({ post, isMe, onRequest, sent, requesting, locale, isDemo = false }) {
  const arch = ARCHETYPE_DISPLAY[post.archetype];
  const t = (key) => translate(locale, key);
  const isBusy = requesting === post.userId;
  const stats = ARCHETYPE_STATS[post.archetype] || null;
  const accentColor = isDemo ? "rgba(255,255,255,0.2)" : (post.rankColor || arch?.color || RED);
  const rankGlow = (isDemo || post.rankKey === "rankRookieGloves" || post.rankKey === "rankAmateurBelt")
    ? `0 4px 16px ${blackAlpha(0.45)}`
    : `0 0 18px ${accentColor}30, 0 4px 16px ${blackAlpha(0.5)}`;

  return (
    <div
      className="lift-card"
      style={{
        ...c.card,
        borderLeft: `3px solid ${accentColor}`,
        boxShadow: rankGlow,
        opacity: isMe ? 0.5 : 1,
        position: "relative",
      }}
    >
      {isDemo && (
        <div style={{ position: "absolute", top: 8, right: 10, fontSize: 9, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "2px 6px" }}>
          {locale === "mn" ? "Жишээ" : locale === "ko" ? "데모" : "Demo"}
        </div>
      )}
      <div style={c.cardTop}>
        {/* Avatar */}
        <div style={c.avatarWrap}>
          {post.photoURL
            ? <Image src={post.photoURL} alt="" width={56} height={56} style={{ borderRadius: "50%", objectFit: "cover", border: `1.5px solid ${accentColor}40` }} />
            : <div style={{ ...c.avatarFallback, background: arch?.color ? `${arch.color}1A` : "rgba(255,255,255,0.06)", border: `1.5px solid ${accentColor}40` }}>
                {(post.displayName || "?").charAt(0).toUpperCase()}
              </div>
          }
          {arch && (
            <span style={{ position: "absolute", bottom: -4, right: -4, fontSize: 14, lineHeight: 1, filter: `drop-shadow(0 1px 4px ${blackAlpha(0.8)})` }}>
              {arch.emoji}
            </span>
          )}
        </div>

        {/* Info */}
        <div style={c.infoBlock}>
          <div style={c.name}>{post.displayName || (locale === "mn" ? "Тулаанч" : locale === "ko" ? "파이터" : "Fighter")}</div>
          <div style={c.chips}>
            {post.rankKey && (
              <span style={{ ...c.chip, color: post.rankColor || "#fff", background: `${post.rankColor || "#fff"}12`, borderColor: `${post.rankColor || "#fff"}40` }}>
                {t(post.rankKey)}
              </span>
            )}
            {post.weightClass && (
              <span style={c.chip}>{getWeightClassLabel(post.weightClass)}</span>
            )}
            {arch && (
              <span style={{ ...c.chip, color: arch.color, background: `${arch.color}12`, borderColor: `${arch.color}40` }}>
                {arch.emoji} {arch.name.split(" ")[0]}
              </span>
            )}
          </div>
          {post.location && <div style={c.location}>📍 {post.location}</div>}
          {post.bio && <div style={c.bio}>{post.bio.slice(0, 80)}{post.bio.length > 80 ? "…" : ""}</div>}
        </div>
      </div>

      {/* Stat bars */}
      {stats && (
        <div style={c.statBarsRow}>
          {STAT_DEFS.map(({ key, label, color }) => (
            <div key={key} style={c.statBar}>
              <span style={{ ...c.statLabel, color }}>{label}</span>
              <div style={c.statTrack}>
                <div style={{ ...c.statFill, width: `${stats[key]}%`, background: color, boxShadow: `0 0 6px ${color}60` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      {isDemo ? (
        <div style={{ ...c.requestBtn, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.22)", cursor: "default", textAlign: "center", fontSize: 11 }}>
          {locale === "mn" ? "Жишээ тулаанч — хүсэлт илгээх боломжгүй" : locale === "ko" ? "데모 파이터 — 요청 불가" : "Demo fighter — not requestable"}
        </div>
      ) : !isMe ? (
        <button
          type="button"
          onClick={() => !sent && !isBusy && onRequest(post)}
          disabled={sent || isBusy}
          style={{
            ...c.requestBtn,
            background: sent
              ? "rgba(52,211,153,0.1)"
              : isBusy
              ? "rgba(255,255,255,0.06)"
              : arch?.color
              ? `linear-gradient(135deg, ${arch.color}, ${arch.color}cc)`
              : `linear-gradient(135deg, ${RED}, ${RED_DARK})`,
            border: sent ? "1px solid rgba(52,211,153,0.3)" : "none",
            color: sent ? "#34D399" : "#fff",
            boxShadow: sent || isBusy ? "none" : `0 6px 20px ${arch?.color ? arch.color + "30" : redAlpha(0.28)}`,
            cursor: sent ? "not-allowed" : isBusy ? "wait" : "pointer",
            opacity: isBusy ? 0.6 : 1,
          }}
        >
          {isBusy ? "…" : sent ? (
            locale === "mn" ? "✓ Хүсэлт илгээсэн" : locale === "ko" ? "✓ 요청 전송됨" : "✓ Request Sent"
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {locale === "mn" ? "Sparring хүс" : locale === "ko" ? "스파링 요청" : "Request Sparring"}
            </>
          )}
        </button>
      ) : (
        <div style={c.myLabel}>👆 {locale === "mn" ? "Таны бичлэг" : locale === "ko" ? "내 게시물" : "Your listing"}</div>
      )}

    </div>
  );
}

export function IncomingRequestCard({ req, onAccept, onDecline, accepting, declining, locale }) {
  const arch = ARCHETYPE_DISPLAY[req.fromArchetype];
  const isBusy = accepting === req.id || declining === req.id;
  const timeAgo = formatAgo(req.createdAt, locale);

  return (
    <div style={{
      ...c.card,
      borderLeft: `3px solid ${GOLD}`,
      boxShadow: `0 0 20px rgba(245,196,81,0.12), 0 4px 20px ${blackAlpha(0.5)}`,
      background: "rgba(245,196,81,0.03)",
    }}>
      {/* "Challenge received" kicker */}
      <p style={c.incomingKicker}>
        <span style={c.incomingKickerDot} />
        {locale === "mn" ? "CHALLENGE ирсэн" : locale === "ko" ? "챌린지 받음" : "CHALLENGE RECEIVED"}
      </p>

      <div style={c.cardTop}>
        <div style={c.avatarWrap}>
          {req.fromPhotoURL
            ? <Image src={req.fromPhotoURL} alt="" width={56} height={56} style={{ borderRadius: "50%", objectFit: "cover", border: `1.5px solid rgba(245,196,81,0.35)` }} />
            : <div style={{ ...c.avatarFallback, background: "rgba(245,196,81,0.08)", border: "1.5px solid rgba(245,196,81,0.25)" }}>
                {(req.fromDisplayName || "?").charAt(0).toUpperCase()}
              </div>
          }
          {arch && (
            <span style={{ position: "absolute", bottom: -4, right: -4, fontSize: 14, lineHeight: 1 }}>
              {arch.emoji}
            </span>
          )}
        </div>
        <div style={c.infoBlock}>
          <div style={c.name}>{req.fromDisplayName || (locale === "mn" ? "Тулаанч" : locale === "ko" ? "파이터" : "Fighter")}</div>
          <div style={c.chips}>
            {arch && <span style={{ ...c.chip, color: arch.color, background: `${arch.color}12`, borderColor: `${arch.color}40` }}>{arch.emoji} {arch.name.split(" ")[0]}</span>}
            {req.fromWeightClass && <span style={c.chip}>{req.fromWeightClass.split(" ")[0]}</span>}
          </div>
          {timeAgo && <div style={c.location}>🕐 {timeAgo}</div>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => !isBusy && onAccept(req)}
          disabled={isBusy}
          style={{
            ...c.requestBtn,
            flex: 1,
            background: isBusy && accepting === req.id ? "rgba(52,211,153,0.08)" : "linear-gradient(135deg, #34D399, #22a870)",
            boxShadow: isBusy ? "none" : "0 6px 18px rgba(52,211,153,0.25)",
            opacity: isBusy ? 0.65 : 1,
            cursor: isBusy ? "wait" : "pointer",
          }}
        >
          {accepting === req.id ? "…" : locale === "mn" ? "✓ Зөвшөөрөх" : locale === "ko" ? "✓ 수락" : "✓ Accept"}
        </button>
        <button
          type="button"
          onClick={() => !isBusy && onDecline(req)}
          disabled={isBusy}
          style={{
            ...c.requestBtn,
            flex: 1,
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.28)",
            color: "#F87171",
            boxShadow: "none",
            opacity: isBusy ? 0.65 : 1,
            cursor: isBusy ? "wait" : "pointer",
          }}
        >
          {declining === req.id ? "…" : locale === "mn" ? "✕ Татгалзах" : locale === "ko" ? "✕ 거절" : "✕ Decline"}
        </button>
      </div>
    </div>
  );
}

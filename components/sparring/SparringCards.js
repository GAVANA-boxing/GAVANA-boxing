"use client";

import { translate } from "@/lib/i18n";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import { RED, GOLD, redAlpha } from "@/lib/tokens";
import { c } from "@/components/sparring/sparringStyles";
import { formatAgo } from "@/lib/utils";
import Image from "next/image";

const ARCHETYPE_STATS = {
  pressure:  { SPD: 75, PWR: 80, TEC: 55, STAM: 90 },
  counter:   { SPD: 85, PWR: 65, TEC: 90, STAM: 70 },
  technical: { SPD: 80, PWR: 50, TEC: 95, STAM: 72 },
  brawler:   { SPD: 60, PWR: 95, TEC: 50, STAM: 80 },
};

export function FighterCard({ post, isMe, onRequest, sent, requesting, locale }) {
  const arch = ARCHETYPE_DISPLAY[post.archetype];
  const t = (key) => translate(locale, key);
  const isBusy = requesting === post.userId;
  const stats = ARCHETYPE_STATS[post.archetype] || null;
  const rankGlow = post.rankColor && post.rankKey !== "rankRookieGloves" && post.rankKey !== "rankAmateurBelt"
    ? `0 0 12px ${post.rankColor}35, 0 2px 8px rgba(0,0,0,0.5)`
    : "0 2px 8px rgba(0,0,0,0.4)";

  return (
    <div
      className="lift-card"
      style={{
        ...c.card,
        borderLeft: `2.5px solid ${post.rankColor || arch?.color || RED}`,
        boxShadow: rankGlow,
        opacity: isMe ? 0.55 : 1,
      }}
    >
      <div style={c.cardTop}>
        <div style={c.avatarWrap}>
          {post.photoURL
            ? <Image src={post.photoURL} alt="" width={48} height={48} style={{ borderRadius: "50%", objectFit: "cover" }} />
            : <div style={{ ...c.avatarFallback, background: arch?.color ? `${arch.color}22` : "#1a1a1a" }}>
                {(post.displayName || "?").charAt(0).toUpperCase()}
              </div>
          }
          {arch && (
            <span style={{ position: "absolute", bottom: -3, right: -3, fontSize: 13, lineHeight: 1, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.7))" }}>
              {arch.emoji}
            </span>
          )}
        </div>

        <div style={c.infoBlock}>
          <div style={c.name}>{post.displayName || "Fighter"}</div>
          <div style={c.chips}>
            {post.rankKey && (
              <span style={{ ...c.chip, color: post.rankColor || "#fff", background: `${post.rankColor || "#fff"}14`, borderColor: `${post.rankColor || "#fff"}44` }}>
                {t(post.rankKey)}
              </span>
            )}
            {post.weightClass && (
              <span style={c.chip}>{post.weightClass.split(" ")[0]}</span>
            )}
            {arch && (
              <span style={{ ...c.chip, color: arch.color, borderColor: `${arch.color}44` }}>
                {arch.name}
              </span>
            )}
          </div>
          {post.location && <div style={c.location}>📍 {post.location}</div>}
          {post.bio && <div style={c.bio}>{post.bio.slice(0, 72)}{post.bio.length > 72 ? "…" : ""}</div>}
          {stats && (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {[["SPD", stats.SPD, "#60A5FA"], ["PWR", stats.PWR, "#F87171"], ["TEC", stats.TEC, "#34D399"], ["STAM", stats.STAM, "#FB923C"]].map(([label, val, col]) => (
                <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 8, fontWeight: 900, color: col, letterSpacing: "0.05em", textAlign: "center" }}>{label}</span>
                  <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${val}%`, borderRadius: 99, background: col }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!isMe && (
        <button
          type="button"
          onClick={() => !sent && !isBusy && onRequest(post)}
          disabled={sent || isBusy}
          style={{
            ...c.msgBtn,
            background: sent
              ? "rgba(52,211,153,0.1)"
              : isBusy
              ? "rgba(255,255,255,0.06)"
              : arch?.color
              ? `linear-gradient(135deg, ${arch.color}, ${arch.color}bb)`
              : RED,
            border: sent ? "1px solid rgba(52,211,153,0.3)" : "none",
            color: sent ? "#34D399" : "#fff",
            cursor: sent ? "not-allowed" : isBusy ? "wait" : "pointer",
          }}
        >
          {isBusy ? "…"
            : sent
            ? (locale === "mn" ? "✓ Хүсэлт илгээсэн" : locale === "ko" ? "✓ 요청 전송됨" : "✓ Request Sent")
            : <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {locale === "mn" ? "Sparring хүс" : locale === "ko" ? "스파링 요청" : "Request Sparring"}
              </>
          }
        </button>
      )}
      {isMe && <div style={c.myLabel}>👆 {locale === "mn" ? "Таны бичлэг" : locale === "ko" ? "내 게시물" : "Your post"}</div>}
    </div>
  );
}

export function IncomingRequestCard({ req, onAccept, onDecline, onMessage, accepting, declining, locale }) {
  const arch = ARCHETYPE_DISPLAY[req.fromArchetype];
  const isBusy = accepting === req.id || declining === req.id;
  const timeAgo = formatAgo(req.createdAt, locale);

  return (
    <div style={{ ...c.card, borderLeft: `2.5px solid ${GOLD}` }}>
      <div style={c.cardTop}>
        <div style={c.avatarWrap}>
          {req.fromPhotoURL
            ? <Image src={req.fromPhotoURL} alt="" width={48} height={48} style={{ borderRadius: "50%", objectFit: "cover" }} />
            : <div style={{ ...c.avatarFallback, background: "#1a1a1a" }}>
                {(req.fromDisplayName || "?").charAt(0).toUpperCase()}
              </div>
          }
          {arch && (
            <span style={{ position: "absolute", bottom: -3, right: -3, fontSize: 13, lineHeight: 1 }}>
              {arch.emoji}
            </span>
          )}
        </div>
        <div style={c.infoBlock}>
          <div style={c.name}>{req.fromDisplayName || "Fighter"}</div>
          <div style={c.chips}>
            {arch && <span style={{ ...c.chip, color: arch.color, borderColor: `${arch.color}44` }}>{arch.name}</span>}
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
            flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
            background: isBusy && accepting === req.id ? "rgba(52,211,153,0.08)" : "linear-gradient(135deg, #34D399, #22a870)",
            color: "#fff", fontSize: 13, fontWeight: 900,
            cursor: isBusy ? "wait" : "pointer",
            opacity: isBusy ? 0.7 : 1,
          }}
        >
          {accepting === req.id ? "…" : locale === "mn" ? "✓ Зөвшөөрөх" : locale === "ko" ? "✓ 수락" : "✓ Accept"}
        </button>
        <button
          type="button"
          onClick={() => !isBusy && onDecline(req)}
          disabled={isBusy}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 10,
            border: "1px solid rgba(248,113,113,0.3)",
            background: "rgba(248,113,113,0.07)",
            color: "#F87171", fontSize: 13, fontWeight: 900,
            cursor: isBusy ? "wait" : "pointer",
            opacity: isBusy ? 0.7 : 1,
          }}
        >
          {declining === req.id ? "…" : locale === "mn" ? "✕ Татгалзах" : locale === "ko" ? "✕ 거절" : "✕ Decline"}
        </button>
      </div>
    </div>
  );
}

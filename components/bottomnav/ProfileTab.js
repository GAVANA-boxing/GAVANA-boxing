"use client";

import { useState } from "react";
import Image from "next/image";
import { RED } from "@/lib/tokens";
import { loc } from "@/lib/loc";

const s = {
  iconTab: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 68,
    WebkitTapHighlightColor: "transparent",
    padding: 0,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    lineHeight: 1,
    transition: "color 160ms ease",
    fontFamily: "var(--font-geist-sans, system-ui)",
  },
  badge: {
    position: "absolute",
    minWidth: 14,
    height: 14,
    padding: "0 3px",
    borderRadius: 7,
    background: RED,
    color: "#fff",
    border: "1.5px solid rgba(6,6,7,0.97)",
    fontSize: 8,
    fontWeight: 900,
    lineHeight: "11px",
    textAlign: "center",
    boxSizing: "border-box",
  },
  avatarWrap: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "box-shadow 200ms ease",
    flexShrink: 0,
  },
  avatarInitial: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
    color: "#fff",
  },
};

/**
 * @param {{ user: object | null, active: boolean, onClick: () => void, onBadgeClick: () => void, badge: number, locale: string }} props
 */
export default function ProfileTab({ user, active, onClick, onBadgeClick, badge, locale }) {
  const photo = user?.photoURL || user?.profileImageUrl || "";
  const initial = (user?.displayName || user?.username || "U").charAt(0).toUpperCase();
  const [imgError, setImgError] = useState(false);
  const label = loc(locale, "Профайл", "프로필", "Profile");

  return (
    <button type="button" onClick={onClick} style={s.iconTab} aria-label={label} className="tap-bounce">
      <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative" }}>
        <span style={{ position: "relative", display: "inline-flex" }}>
          <span style={{
            ...s.avatarWrap,
            boxShadow: active ? `0 0 0 2px ${RED}` : "0 0 0 1.5px rgba(255,255,255,0.08)",
          }}>
            {photo && !imgError
              ? <Image src={photo} alt="Profile" width={28} height={28} style={{ objectFit: "cover" }} onError={() => setImgError(true)} />
              : <span style={{ ...s.avatarInitial, background: active ? RED : "rgba(255,255,255,0.08)" }}>{initial}</span>
            }
          </span>
          {badge > 0 && (
            <button
              type="button"
              aria-label="Notifications"
              style={{ ...s.badge, top: -3, right: -3, cursor: "pointer", border: "none", padding: 0 }}
              onClick={(e) => { e.stopPropagation(); onBadgeClick?.(); }}
            >
              {badge > 9 ? "9+" : badge}
            </button>
          )}
        </span>
        <span style={{ ...s.tabLabel, color: active ? "#fff" : "rgba(255,255,255,0.32)" }}>{label}</span>
      </span>
    </button>
  );
}

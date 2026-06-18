"use client";

import Image from "next/image";
import { redAlpha } from "@/lib/tokens";
import XPBar from "./XPBar";

const FALLBACK_NAME = "Fighter";

const s = {
  footer: {
    marginTop: 12,
    borderTop: "1px solid rgba(255,255,255,0.05)",
    paddingTop: 10,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  profileBtn: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "6px 8px",
    background: "none",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    borderRadius: 9,
    WebkitTapHighlightColor: "transparent",
  },
  avaWrap: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#222",
    border: `1.5px solid ${redAlpha(0.4)}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  avaInitial: { fontSize: 13, fontWeight: 700, color: "#fff" },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: {
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: 1.2,
  },
  rankLabel: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
};

export default function SidebarFooter({
  user,
  photo,
  imgErr,
  onImgError,
  initial,
  rank,
  xpProgress,
  onProfileClick,
}) {
  return (
    <div style={s.footer}>
      <button
        style={s.profileBtn}
        onClick={onProfileClick}
        className="tap-bounce"
      >
        <div style={s.avaWrap}>
          {photo && !imgErr
            ? (
              <Image
                src={photo}
                alt=""
                width={32}
                height={32}
                style={{ borderRadius: "50%", objectFit: "cover" }}
                onError={onImgError}
              />
            )
            : <span style={s.avaInitial}>{initial}</span>
          }
        </div>
        <div style={s.profileInfo}>
          <div style={s.profileName}>
            {user.displayName || user.email?.split("@")[0] || FALLBACK_NAME}
          </div>
          <div style={s.rankLabel}>
            <span style={{ fontSize: 9, fontWeight: 800, color: rank.color, letterSpacing: 0.8 }}>
              {rank.label || "ROOKIE"}
            </span>
          </div>
        </div>
      </button>

      <div style={{ padding: "0 8px 2px" }}>
        <XPBar progress={xpProgress} color={rank.color} />
      </div>
    </div>
  );
}

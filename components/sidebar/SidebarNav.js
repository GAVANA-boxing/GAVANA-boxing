"use client";

import { RED, redAlpha } from "@/lib/tokens";
import { NAV } from "./navConfig";

const s = {
  nav: { display: "flex", flexDirection: "column", gap: 0, flex: 1 },
  navGroup: { marginBottom: 16 },
  groupLabel: {
    fontSize: 8,
    fontWeight: 900,
    color: "rgba(255,255,255,0.11)",
    letterSpacing: 2,
    textTransform: "uppercase",
    padding: "0 10px",
    marginBottom: 3,
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "8px 10px",
    borderRadius: 9,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    position: "relative",
    transition: "background 140ms ease",
    WebkitTapHighlightColor: "transparent",
  },
  navBtnActive: {
    background: "rgba(255,59,48,0.10)",
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 6,
    width: 2.5,
    borderRadius: 2,
    background: RED,
    boxShadow: `0 0 8px ${redAlpha(0.8)}`,
  },
  navIcon: {
    width: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "color 140ms ease",
  },
  navLabel: {
    flex: 1,
    fontSize: 13,
    letterSpacing: 0,
    transition: "color 140ms ease, font-weight 140ms ease",
  },
  activePip: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: RED,
    flexShrink: 0,
    boxShadow: `0 0 6px ${redAlpha(0.55)}`,
  },
};

export default function SidebarNav({ isActive, onNavigate }) {
  return (
    <nav style={s.nav}>
      {NAV.map(({ group, items }) => (
        <div key={group} style={s.navGroup}>
          <div style={s.groupLabel}>{group}</div>
          {items.map(({ Icon, label, path }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                style={{ ...s.navBtn, ...(active ? s.navBtnActive : {}) }}
                onClick={() => onNavigate(path)}
                className="tap-bounce"
              >
                {active && <div style={s.activeBar} />}
                <span style={{ ...s.navIcon, color: active ? RED : "rgba(255,255,255,0.22)" }}>
                  <Icon />
                </span>
                <span style={{
                  ...s.navLabel,
                  color: active ? "#fff" : "rgba(255,255,255,0.32)",
                  fontWeight: active ? 700 : 500,
                }}>
                  {label}
                </span>
                {active && <span style={s.activePip} />}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

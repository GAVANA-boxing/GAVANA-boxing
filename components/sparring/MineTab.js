"use client";

import { RED } from "@/lib/tokens";
import s from "@/components/sparring/sparringStyles";
import { FighterCard } from "@/components/sparring/SparringCards";

/**
 * Props:
 *   user         – Firebase user
 *   locale       – locale string
 *   t            – translate(locale, key) shorthand
 *   myPost       – current user's sparring post (or null)
 *   isOn         – whether listing is active
 *   toggling     – bool
 *   handleToggle – fn
 */
export default function MineTab({ user, locale, t, myPost, isOn, toggling, handleToggle }) {
  return (
    <div style={s.list}>
      {/* Toggle banner */}
      {user && (
        <div style={{ padding: "12px 16px 4px" }}>
          <div className="hud-corners" style={{ ...s.toggleBanner, background: isOn ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.03)", borderColor: isOn ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.07)" }}>
            <div style={s.toggleLeft}>
              <div style={{ ...s.toggleDot, background: isOn ? "#34D399" : "rgba(255,255,255,0.2)", boxShadow: isOn ? "0 0 8px #34D399" : "none" }} />
              <div>
                <div style={{ ...s.toggleTitle, color: isOn ? "#34D399" : "rgba(255,255,255,0.7)" }}>
                  {isOn ? t("sparringLookingActive") : t("sparringLookingInactive")}
                </div>
                <div style={s.toggleSub}>
                  {isOn ? t("sparringVisibleDesc") : t("sparringHiddenDesc")}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              disabled={toggling}
              style={{
                ...s.toggleBtn,
                background: isOn ? "rgba(52,211,153,0.15)" : RED,
                border: isOn ? "1px solid rgba(52,211,153,0.3)" : "none",
                color: isOn ? "#34D399" : "#fff",
                opacity: toggling ? 0.6 : 1,
              }}
            >
              {toggling ? "…" : isOn ? t("sparringDisableBtn") : t("sparringActivateBtn")}
            </button>
          </div>
        </div>
      )}

      {/* Own post preview */}
      {myPost && (
        <div style={{ padding: "8px 16px 0" }}>
          <div style={{ ...s.sectionLabel, marginBottom: 8 }}>
            {t("sparringYourListing")}
          </div>
          <FighterCard post={myPost} isMe onRequest={() => {}} sent={false} requesting={null} locale={locale} />
        </div>
      )}

      {!user && (
        <div style={s.empty}>
          <p style={s.emptyTitle}>{t("sparringLoginRequired")}</p>
        </div>
      )}

      {user && !myPost && (
        <div style={{ padding: "20px 16px 0" }}>
          <div style={{ textAlign: "center", padding: "32px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, margin: "0 auto 12px" }}>🥊</div>
            <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 900, color: "#fff" }}>
              {t("sparringListingInactive")}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.55 }}>
              {t("sparringToggleHint")}
            </p>
          </div>
        </div>
      )}

      <div style={{ height: "calc(24px + env(safe-area-inset-bottom))" }} />
    </div>
  );
}

"use client";

import Image from "next/image";
import styles from "@/components/gyms/gymIdStyles";
import { redAlpha } from "@/lib/tokens";

function ReelThumb({ reel, router, locale }) {
  return (
    <div
      style={styles.reelThumb}
      onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}`)}
    >
      {reel.thumbnailUrl ? (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Image src={reel.thumbnailUrl} alt="" fill style={{ objectFit: "cover" }} />
        </div>
      ) : (
        <div style={styles.reelThumbPlaceholder}>🥊</div>
      )}
    </div>
  );
}

export default function GymReelsSection({ reels, isOwner, locale, router, t }) {
  return (
    <section style={styles.section}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ ...styles.sectionTitle, margin: 0 }}>{t("gymReels")}</p>
        {isOwner && (
          <button
            onClick={() => router.push(`/${locale}/upload`)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 11px", borderRadius: 999,
              background: `${redAlpha(0.12)}`, border: `1px solid ${redAlpha(0.3)}`,
              color: "#F87171", fontSize: 11, fontWeight: 800, cursor: "pointer",
            }}
          >
            + {t("gymIdAddReel")}
          </button>
        )}
      </div>

      {reels.length === 0 ? (
        isOwner ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "28px 16px", borderRadius: 14,
            background: `${redAlpha(0.05)}`, border: `1px dashed ${redAlpha(0.25)}`,
            gap: 10,
          }}>
            <span style={{ fontSize: 28 }}>🎥</span>
            <p style={{ margin: 0, fontSize: 13, color: "#777", fontWeight: 700 }}>
              {t("gymIdNoReels")}
            </p>
            <button
              onClick={() => router.push(`/${locale}/upload`)}
              style={{
                padding: "8px 20px", borderRadius: 999,
                background: "linear-gradient(135deg, #FF3B30, #cc2820)",
                color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
                border: "none",
              }}
            >
              {t("gymIdUploadFirstReel")}
            </button>
          </div>
        ) : (
          <p style={styles.emptyText}>{t("gymNoReels")}</p>
        )
      ) : (
        <div style={styles.reelsGrid}>
          {reels.map((reel) => (
            <ReelThumb key={reel.id} reel={reel} router={router} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}

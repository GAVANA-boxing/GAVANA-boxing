"use client";

/**
 * ProfileReputationCard
 *
 * Props:
 *   userReels        – Array of reel objects
 *   followersCount   – number
 *   t                – (key: string) => string
 */
export default function ProfileReputationCard({ userReels, followersCount, t }) {
  const training = userReels.filter((r) => r.contentType === "training").length;
  const responses = userReels.filter((r) => r.contentType === "challenge_response").length;
  const wins = userReels.filter(
    (r) =>
      r.contentType === "challenge_response" &&
      typeof r.sourceSessionScore === "number" &&
      typeof r.challengeTargetScore === "number" &&
      r.sourceSessionScore > r.challengeTargetScore
  ).length;
  const totalLikesRep = userReels.reduce(
    (s, r) => s + (Number(r.likes || r.likesCount) || 0),
    0
  );

  if (!training && !responses && !totalLikesRep && !followersCount) return null;

  const cells = [
    { label: t("repTrainingPosts"),      value: training },
    { label: t("repChallengeResponses"), value: responses },
    { label: t("repLikesReceived"),      value: totalLikesRep },
    { label: t("followers"),             value: followersCount },
    ...(wins > 0 ? [{ label: t("repChallengeWins"), value: wins }] : []),
  ];

  return (
    <div
      className="section-reveal stagger-4"
      style={{
        margin: "0 0 16px",
        padding: "12px 16px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {t("repCardTitle")}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {cells.map(({ label, value }) => (
          <div
            key={label}
            style={{
              flex: "1 1 auto",
              minWidth: 64,
              textAlign: "center",
              padding: "6px 8px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
              {value.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "rgba(255,255,255,0.38)",
                letterSpacing: 0.3,
                marginTop: 2,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

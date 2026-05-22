import { GOLD, BORDER, RADIUS, goldAlpha, whiteAlpha } from "@/lib/tokens";

export const feedbackXpStyles = {
  xpCard: {
    marginBottom: 16,
    padding: "14px 15px",
    borderRadius: RADIUS.md,
    background: goldAlpha(0.07),
    border: `1px solid ${goldAlpha(0.2)}`,
    animation: "fadeUp 280ms ease forwards",
  },
  xpCardTitle: {
    margin: "0 0 10px",
    fontSize: 9,
    fontWeight: 900,
    color: GOLD,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  xpCardRows: {
    display: "grid",
    gap: 5,
    marginBottom: 12,
  },
  xpCardRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  xpCardRowTotal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: `1px solid ${BORDER}`,
    marginTop: 5,
    paddingTop: 7,
  },
  xpCardLabel: {
    fontSize: 12,
    color: whiteAlpha(0.45),
    fontWeight: 600,
  },
  xpCardVal: {
    fontSize: 13,
    fontWeight: 900,
    color: whiteAlpha(0.78),
  },
  xpCardTotalLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#fff",
  },
  xpCardTotalVal: {
    fontSize: 18,
    fontWeight: 1000,
    color: GOLD,
  },
  xpCapNotice: {
    margin: "5px 0 0",
    fontSize: 10,
    color: "#FB923C",
    fontWeight: 700,
  },
  xpRankWrap: {
    borderTop: `1px solid ${BORDER}`,
    paddingTop: 11,
  },
  xpRankRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  xpTotalLabel: {
    fontSize: 11,
    color: whiteAlpha(0.45),
    fontWeight: 700,
  },
  xpRankTrack: {
    height: 5,
    borderRadius: RADIUS.full,
    background: whiteAlpha(0.08),
    overflow: "hidden",
    marginBottom: 5,
  },
  xpRankFill: {
    height: "100%",
    borderRadius: RADIUS.full,
    transition: "width 700ms ease",
  },
  xpNextLabel: {
    margin: 0,
    fontSize: 10,
    color: whiteAlpha(0.45),
    textAlign: "right",
  },
};

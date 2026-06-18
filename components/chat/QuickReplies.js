"use client";

import { BORDER, SURFACE_1, BORDER_2, RADIUS, whiteAlpha } from "@/lib/tokens";

/**
 * Props:
 *   replies  – string[]
 *   onSelect – (reply: string) => void
 */
export default function QuickReplies({ replies, onSelect }) {
  return (
    <div style={s.wrap}>
      <div style={s.scroll}>
        {replies.map((reply) => (
          <button
            key={reply}
            type="button"
            style={s.chip}
            onClick={() => onSelect(reply)}
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}

const s = {
  wrap: { flexShrink: 0, borderTop: `1px solid ${BORDER}`, background: "rgba(9,9,9,0.98)" },
  scroll: { display: "flex", gap: 8, overflowX: "auto", padding: "10px 14px", scrollbarWidth: "none" },
  chip: {
    flexShrink: 0, padding: "7px 14px", borderRadius: RADIUS.full,
    border: `1px solid ${BORDER_2}`, background: SURFACE_1,
    color: whiteAlpha(0.75), fontSize: 12, fontWeight: 700,
    cursor: "pointer", whiteSpace: "nowrap",
  },
};

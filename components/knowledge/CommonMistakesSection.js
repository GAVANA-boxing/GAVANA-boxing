"use client";

import { loc } from "@/lib/loc";
import { MistakeRow } from "@/components/knowledge/KnowledgeCards";

export default function CommonMistakesSection({ locale, mistakes, onAsk }) {
  return (
    <div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {mistakes.map((item, i) => (
          <MistakeRow key={i} item={item} />
        ))}
      </div>
      <button
        onClick={() => onAsk(loc(
          locale,
          "Хамгийн нийтлэг алдаанууд юу вэ, тэдгээрийг хэрхэн засах вэ?",
          "복싱 초보자들이 가장 많이 하는 실수와 고치는 법은?",
          "What are the most common boxing mistakes beginners make and how do I fix them?",
        ))}
        style={{
          marginTop: 10, width: "100%", padding: "10px 0", borderRadius: 10,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}
      >
        {locale === "mn" ? "Алдаагаа засах зөвлөгөө авах →" : "Ask coach about my mistakes →"}
      </button>
    </div>
  );
}

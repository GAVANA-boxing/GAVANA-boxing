"use client";

// The 30 technique drills as four packs named by what they train (no boxer's name). Folded by
// default: one line until the user opens it. A drill opens on Train as a guided round.
import { useState } from "react";
import { techniquePacks } from "@/lib/techniquePacks";
import { loc } from "@/lib/loc";
import { BRAND, card, sectionLabel } from "@/components/ui/brand";

const DIFF = { beginner: ["Анхан", "초급", "Beginner"], intermediate: ["Дунд", "중급", "Intermediate"], advanced: ["Ахисан", "고급", "Advanced"] };
const DIFF_COLOR = { beginner: "#10B981", intermediate: "#F59E0B", advanced: "#F87171" };

export default function TechniquePacks({ locale = "en", router, progress = {} }) {
  const [open, setOpen] = useState(false);
  const [packId, setPackId] = useState(null);
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const packs = techniquePacks(locale);
  const total = packs.reduce((n, p) => n + p.drills.length, 0);
  const pack = packs.find((p) => p.id === packId);

  return (
    <section data-testid="technique-packs" style={{ ...card, margin: "0 16px", padding: 16 }}>
      <button type="button" aria-expanded={open} onClick={() => { setOpen((v) => !v); setPackId(null); }}
        style={{ width: "100%", minHeight: 44, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "none", border: "none", padding: 0, color: BRAND.text, fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}>
        <span>
          <span style={{ ...sectionLabel, display: "block" }}>{L("Техникийн дасгал", "테크닉 드릴", "Technique drills")}</span>
          <span style={{ display: "block", marginTop: 4, fontSize: 16, fontWeight: 700 }}>{total} {L("дасгал · 4 бүлэг", "개 드릴 · 4개 묶음", "drills · 4 packs")}</span>
        </span>
        <span aria-hidden="true" style={{ fontSize: 18, color: BRAND.faint }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && !pack && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          {packs.map((p) => (
            <button key={p.id} type="button" data-testid={`pack-${p.id}`} onClick={() => setPackId(p.id)}
              style={{ minHeight: 84, padding: "12px 10px", borderRadius: 16, border: `1px solid ${BRAND.line}`, background: "rgba(255,255,255,0.05)", color: BRAND.text, fontFamily: "inherit", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 6 }}>
              <span aria-hidden="true" style={{ fontSize: 22 }}>{p.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>{loc(locale, p.name.mn, p.name.ko, p.name.en)}</span>
              <span style={{ fontSize: 12.5, color: BRAND.muted }}>{p.drills.length}</span>
            </button>
          ))}
        </div>
      )}

      {open && pack && (
        <div style={{ marginTop: 10 }}>
          <button type="button" onClick={() => setPackId(null)} style={{ minHeight: 44, background: "none", border: "none", color: BRAND.muted, fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0 }}>
            ← {loc(locale, pack.name.mn, pack.name.ko, pack.name.en)}
          </button>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {pack.drills.map((d) => (
              <li key={d.id}>
                <button type="button" data-testid="technique-drill" onClick={() => router.push(d.url)}
                  style={{ width: "100%", minHeight: 52, display: "flex", alignItems: "center", gap: 10, padding: "8px 0", background: "none", border: "none", borderTop: `1px solid ${BRAND.line}`, color: BRAND.text, fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}>
                  {progress[`drill:${d.id}`]?.completed && <span aria-label={L("Хийсэн", "완료", "Done")} style={{ flexShrink: 0, color: "#10B981", fontWeight: 800 }}>✓</span>}
                  <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, overflowWrap: "anywhere" }}>{loc(locale, d.title.mn, d.title.ko, d.title.en)}</span>
                  <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: DIFF_COLOR[d.difficulty] || BRAND.muted }}>{loc(locale, ...(DIFF[d.difficulty] || DIFF.intermediate))}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

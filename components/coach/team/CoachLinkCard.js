"use client";

// On the Coach tab: a student joins their coach's team with a code (or sees / leaves it), and a
// coach opens "My students". View is presentational (fixture-friendly); the default export wires
// it to /api/coach/membership.
import { useState } from "react";
import Link from "next/link";
import { loc } from "@/lib/loc";
import { useCoachMembership } from "@/hooks/useCoachMembership";
import { BRAND, card } from "@/components/ui/brand";

const ERR = {
  not_found: ["Ийм код олдсонгүй.", "코드를 찾을 수 없어요.", "No team with that code."],
  own_team: ["Энэ таны өөрийн багийн код.", "내 팀 코드예요.", "That's your own team's code."],
  team_full: ["Баг дүүрсэн байна.", "팀이 가득 찼어요.", "That team is full."],
  too_many_tries: ["Хэт олон оролдлого — 10 минутын дараа.", "시도가 너무 많아요 — 10분 후에.", "Too many tries — wait 10 minutes."],
  unavailable: ["Сервер хараахан тохируулагдаагүй.", "서버가 아직 설정되지 않았어요.", "The server isn't set up for this yet."],
  failed: ["Амжилтгүй. Дахин оролдоно уу.", "실패했어요. 다시 시도하세요.", "Didn't work. Try again."],
};

export function CoachLinkCardView({ locale, team, loading, error, onJoin, onLeave }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const [code, setCode] = useState("");
  const err = error && (ERR[error] || ERR.failed);

  return (
    <section data-testid="coach-link" style={{ ...card, padding: 16, margin: "0 0 14px" }}>
      {team ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span aria-hidden="true" style={{ fontSize: 26 }}>🥊</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {team.name || team.coachName || L("Миний дасгалжуулагч", "내 코치", "My coach")}
            </div>
            <div style={{ fontSize: 13, color: BRAND.muted }}>{L(`Өдөрт ${team.roundsPerDay} раунд`, `하루 ${team.roundsPerDay}라운드`, `${team.roundsPerDay} rounds a day`)}</div>
          </div>
          <button type="button" disabled={loading} onClick={onLeave} style={ghostBtn}>{L("Гарах", "나가기", "Leave")}</button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) onJoin?.(code); }} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label htmlFor="coach-code" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
            {L("Дасгалжуулагчийн код", "코치 코드", "Coach code")}
          </label>
          <input
            id="coach-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8}
            autoCapitalize="characters" autoComplete="off" spellCheck={false}
            placeholder={L("Код", "코드", "Code")}
            // width 0 + flex 1: the input's built-in width (≈20 characters) must not widen the page on narrow phones
            style={{ flex: 1, width: 0, minWidth: 0, minHeight: 44, padding: "0 14px", borderRadius: 12, border: `1px solid ${BRAND.line}`, background: "rgba(255,255,255,0.04)", color: BRAND.text, fontSize: 16, letterSpacing: "0.08em" }}
          />
          <button type="submit" disabled={loading || !code.trim()} style={{ ...ghostBtn, background: BRAND.red, borderColor: BRAND.red, color: "#fff" }}>
            {L("Нэгдэх", "참여", "Join")}
          </button>
        </form>
      )}
      {err && <p role="alert" style={{ margin: "10px 0 0", fontSize: 13, color: "#FCA5A5" }}>{L(...err)}</p>}
      <Link href={`/${locale}/coach/team`} style={{ display: "inline-flex", alignItems: "center", minHeight: 40, marginTop: 6, fontSize: 13, color: BRAND.faint, textDecoration: "none" }}>
        {L("Би дасгалжуулагч → Миний шавь нар", "코치예요 → 내 제자들", "I'm a coach → My students")}
      </Link>
    </section>
  );
}

export default function CoachLinkCard({ user, locale }) {
  const m = useCoachMembership(user);
  if (!user) return null;
  return <CoachLinkCardView locale={locale} team={m.team} loading={m.loading} error={m.error} onJoin={m.join} onLeave={m.leave} />;
}

const ghostBtn = {
  minHeight: 44, padding: "0 16px", borderRadius: 12, border: `1px solid ${BRAND.line}`, background: "rgba(255,255,255,0.05)",
  color: BRAND.text, fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0,
};

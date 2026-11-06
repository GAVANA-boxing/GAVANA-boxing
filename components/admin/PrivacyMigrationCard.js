"use client";

import { useState } from "react";
import { loc } from "@/lib/loc";
import { BRAND, btnSecondary, card } from "@/components/ui/brand";

/**
 * One-off admin tool: move email addresses off the public users docs into the
 * owner-only users_private docs (/api/admin/privacy-migration). Check first
 * (dry run), then move.
 */
export default function PrivacyMigrationCard({ user, locale }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const L = (mn, ko, en) => loc(locale, mn, ko, en);

  const run = async (apply) => {
    setBusy(true); setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/privacy-migration${apply ? "?apply=1" : ""}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || String(res.status));
      setResult(json);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section style={{ ...card, padding: 16, marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{L("Нууцлал: email шилжүүлэх", "개인정보: 이메일 이전", "Privacy: move emails")}</div>
      <p style={{ margin: "6px 0 12px", fontSize: 13, color: BRAND.muted, lineHeight: 1.5 }}>
        {L("Нийтэд харагддаг профайлаас email-ийг зөвхөн эзэн нь хардаг users_private руу шилжүүлнэ. Эхлээд шалга, дараа нь шилжүүл.",
           "공개 프로필의 이메일을 본인만 볼 수 있는 users_private로 옮깁니다. 먼저 확인 후 이전하세요.",
           "Moves emails from public profiles to owner-only users_private. Check first, then move.")}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" disabled={busy} onClick={() => run(false)} style={{ ...btnSecondary, minHeight: 42 }}>{L("Шалгах", "확인", "Check")}</button>
        <button type="button" disabled={busy || !result || result.found === 0} onClick={() => run(true)} style={{ ...btnSecondary, minHeight: 42, color: BRAND.red }}>{L("Шилжүүлэх", "이전", "Move")}</button>
      </div>
      {busy && <p style={{ fontSize: 13, color: BRAND.faint }}>…</p>}
      {error && <p style={{ fontSize: 13, color: BRAND.red }}>{error}</p>}
      {result && (
        <p style={{ fontSize: 13, color: BRAND.muted, marginBottom: 0 }}>
          {L("Шалгасан", "확인", "Scanned")}: {result.scanned} · {L("Email-тэй", "이메일 있음", "With email")}: {result.found}
          {result.apply && <> · {L("Шилжүүлсэн", "이전됨", "Moved")}: {result.moved} · {L("Алдаа", "실패", "Failed")}: {result.failed}</>}
          {result.more && <> · {L("Дахин дар — үлдсэн бий", "다시 실행 — 남음", "Run again — more left")}</>}
        </p>
      )}
    </section>
  );
}

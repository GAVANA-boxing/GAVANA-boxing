"use client";

// Paying for Pro by bank transfer while card payments are closed. Three short steps, the owner's
// bank details (from public config — never invented) and THIS person's own reference code. Shown
// only when manualPayConfig() has all four values; the owner then grants Pro on /admin/pro.
import { useState } from "react";
import { loc } from "@/lib/loc";
import { BRAND, btnPrimary } from "@/components/ui/brand";
import { PRO_PRICES, formatMnt } from "@/lib/pro";

const GOLD = "#F5C451";

function CopyRow({ label, value, locale }) {
  const [done, setDone] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: BRAND.muted }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", overflowWrap: "anywhere", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      </div>
      <button type="button" onClick={() => { try { navigator.clipboard?.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* no clipboard */ } }}
        style={{ flexShrink: 0, minHeight: 44, minWidth: 44, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.05)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
        {done ? "✓" : loc(locale, "Хуулах", "복사", "Copy")}
      </button>
    </div>
  );
}

export default function BankTransferCard({ locale = "en", config, reference, onSignIn }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  if (!config) return null;
  return (
    <section data-testid="bank-transfer" style={{ marginTop: 14, borderRadius: 16, padding: 16, background: "rgba(255,255,255,0.04)", border: `1px solid ${GOLD}55` }}>
      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 900, letterSpacing: 1.5, color: GOLD }}>{L("БАНКААР ТӨЛӨХ", "계좌이체", "PAY BY BANK TRANSFER")}</h2>
      <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.45, color: BRAND.muted }}>
        {L(
          `${formatMnt(PRO_PRICES.monthly.amount)} / сар, эсвэл ${formatMnt(PRO_PRICES.yearly.amount)} / жил.`,
          `${formatMnt(PRO_PRICES.monthly.amount)} / 월, 또는 ${formatMnt(PRO_PRICES.yearly.amount)} / 년.`,
          `${formatMnt(PRO_PRICES.monthly.amount)} / month, or ${formatMnt(PRO_PRICES.yearly.amount)} / year.`,
        )}
      </p>

      {reference ? (
        <>
          <div style={{ marginTop: 10 }}>
            <CopyRow locale={locale} label={`${config.bank} · ${config.holder}`} value={config.account} />
            <CopyRow locale={locale} label={L("Гүйлгээний утга (заавал бич)", "송금 메모 (꼭 적어 주세요)", "Transfer note (required)")} value={reference} />
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.5, color: BRAND.muted }}>
            {L(
              `Шилжүүлсний дараа "${reference}" кодоо ${config.contact} руу илгээнэ. Pro нэг өдрийн дотор нээгдэнэ.`,
              `송금 후 "${reference}" 코드를 ${config.contact}(으)로 보내 주세요. Pro는 하루 안에 열려요.`,
              `After you pay, send "${reference}" to ${config.contact}. Pro is turned on within a day.`,
            )}
          </p>
        </>
      ) : (
        <button type="button" onClick={onSignIn} style={{ ...btnPrimary, width: "100%", marginTop: 12, fontFamily: "inherit" }}>
          {L("Нэвтэрч кодоо аваарай", "로그인하고 코드 받기", "Sign in to get your code")}
        </button>
      )}
    </section>
  );
}

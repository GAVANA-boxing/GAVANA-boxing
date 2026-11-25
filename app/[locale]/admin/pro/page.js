"use client";

// Owner screen: after a bank transfer, type the person's reference code (from their Pro page) and
// the months they paid for. The server (/api/admin/grant-pro, ADMIN_UIDS only) turns Pro on and
// logs the grant. Reached from /admin (that visit sets the admin session this path needs).
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocale } from "@/lib/i18n";
import { loc } from "@/lib/loc";
import { BRAND, btnPrimary, displayTitle, pageBackground } from "@/components/ui/brand";

const ERRORS = {
  bad_reference: ["Код буруу байна (G- + 8 тэмдэгт).", "코드가 올바르지 않아요.", "That code isn't valid (G- + 8 characters)."],
  not_found: ["Ийм кодтой хэрэглэгч олдсонгүй.", "해당 코드의 사용자를 찾을 수 없어요.", "No account has that code."],
  ambiguous: ["Хоёр хэрэглэгч таарлаа — кодыг бүтнээр нь бич.", "두 명이 일치해요.", "Two accounts match — check the code."],
  server_not_configured: ["Сервер тохируулагдаагүй (FIREBASE_SERVICE_ACCOUNT_BASE64).", "서버가 설정되지 않았어요.", "Server is not configured (FIREBASE_SERVICE_ACCOUNT_BASE64)."],
  Forbidden: ["Та админ биш байна (ADMIN_UIDS).", "관리자가 아니에요.", "You are not an admin (ADMIN_UIDS)."],
};

export default function AdminProPage() {
  const params = useParams();
  const locale = getLocale(params?.locale);
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const router = useRouter();
  const { user, loading } = useAuth();
  const [reference, setReference] = useState("");
  const [months, setMonths] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  const submit = async (e) => {
    e.preventDefault();
    if (!user || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/grant-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reference, months }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        const until = new Date(data.proUntil).toLocaleDateString("en-GB");
        setMsg({ ok: true, text: `✓ ${data.name || L("Хэрэглэгч", "사용자", "User")} — Pro ${until} ${L("хүртэл", "까지", "until")}` });
        setReference("");
      } else {
        const m = ERRORS[data.error];
        setMsg({ ok: false, text: m ? L(...m) : L("Алдаа гарлаа. Дахин оролдоно уу.", "오류가 발생했어요.", "Something went wrong. Try again.") });
      }
    } catch {
      setMsg({ ok: false, text: L("Холболт амжилтгүй.", "연결 실패.", "Connection failed.") });
    }
    setBusy(false);
  };

  return (
    <main style={{ minHeight: "100dvh", background: pageBackground, color: BRAND.text, padding: "16px 16px 120px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <button type="button" onClick={() => router.push(`/${locale}/admin`)} style={{ minHeight: 44, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff", fontFamily: "inherit", cursor: "pointer" }}>← Admin</button>
        <h1 style={{ ...displayTitle, fontSize: 32, margin: "18px 0 6px" }}>{L("Pro олгох", "Pro 부여", "Grant Pro")}</h1>
        <p style={{ margin: 0, fontSize: 14, color: BRAND.muted }}>{L("Банкны шилжүүлгийг шалгаад кодыг оруулна.", "입금을 확인한 뒤 코드를 입력하세요.", "Check the bank transfer, then enter the code.")}</p>

        {!loading && !user ? (
          <p style={{ marginTop: 20 }}>{L("Эхлээд нэвтэрнэ үү.", "먼저 로그인하세요.", "Sign in first.")}</p>
        ) : (
          <form onSubmit={submit} style={{ marginTop: 20, display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 13, color: BRAND.muted }}>
              {L("Хэрэглэгчийн код", "사용자 코드", "User's code")}
              <input data-testid="grant-reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="G-AbC123xY" autoCapitalize="off" autoCorrect="off" spellCheck={false}
                style={{ minHeight: 48, padding: "0 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 18, fontFamily: "inherit" }} />
            </label>
            <div role="radiogroup" aria-label={L("Хугацаа", "기간", "Period")} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[[1, L("1 сар", "1개월", "1 month")], [12, L("12 сар", "12개월", "12 months")]].map(([m, label]) => (
                <button key={m} type="button" role="radio" aria-checked={months === m} onClick={() => setMonths(m)}
                  style={{ minHeight: 48, borderRadius: 12, cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 800, border: months === m ? "2px solid #F5C451" : "1px solid rgba(255,255,255,0.15)", background: months === m ? "rgba(245,196,81,0.12)" : "rgba(255,255,255,0.04)", color: months === m ? "#F5C451" : "#fff" }}>{label}</button>
              ))}
            </div>
            <button type="submit" disabled={busy || !reference.trim()} style={{ ...btnPrimary, fontFamily: "inherit", opacity: busy || !reference.trim() ? 0.6 : 1 }}>
              {busy ? "…" : L("Pro олгох", "Pro 부여", "Grant Pro")}
            </button>
            {msg && <p role={msg.ok ? "status" : "alert"} style={{ margin: 0, fontSize: 15, fontWeight: 700, color: msg.ok ? "#A7F3D0" : "#FCA5A5" }}>{msg.text}</p>}
          </form>
        )}
      </div>
    </main>
  );
}

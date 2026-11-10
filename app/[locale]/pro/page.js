"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useUserProfile } from "@/context/UserProfileProvider";
import { getLocale } from "@/lib/i18n";
import { BRAND, btnPrimary, btnSecondary, displayTitle, kickerDot, kickerPill, pageBackground } from "@/components/ui/brand";
import { FREE_INCLUDES, PRO_PERKS, PRO_PRICES, formatMnt, isProUser } from "@/lib/pro";
import { funnel } from "@/lib/funnel";

// GAVANA Pro — the one page for the plan, its price, its perks, buying and managing it.
// Pro is only sold when the server says checkout, webhook and activation are all set up
// (/api/stripe/config); until then the page says so plainly instead of showing a buy button.

const GOLD = "#F5C451";

export default function ProPage() {
  const params = useParams();
  const locale = getLocale(params?.locale);
  const L = (mn, ko, en) => (locale === "mn" ? mn : locale === "ko" ? ko : en);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();
  const isPro = isProUser(profile);

  const [sale, setSale] = useState(null); // { enabled, plans: { monthly, yearly } }
  const [plan, setPlan] = useState("monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    let back = false;
    try { back = new URLSearchParams(window.location.search).get("subscribed") === "1"; } catch { /* no URL */ }
    setSubscribed(back);
    // Pro funnel: page seen → checkout started → came back from a successful checkout.
    // ("subscribed" here is the return URL, not proof of payment — the webhook is the source of truth.)
    if (back) funnel("subscribed", { locale, meta: "return" });
  }, [locale]);

  useEffect(() => {
    if (sale === null) return;
    funnel("upgrade_viewed", { locale, meta: sale.enabled ? "open" : "soon" });
  }, [sale, locale]);

  useEffect(() => {
    let alive = true;
    fetch("/api/stripe/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setSale(d || { enabled: false, plans: {} }); })
      .catch(() => { if (alive) setSale({ enabled: false, plans: {} }); });
    return () => { alive = false; };
  }, []);

  const yearlyAvailable = !!sale?.plans?.yearly;
  const activePlan = plan === "yearly" && yearlyAvailable ? "yearly" : "monthly";
  const monthly = PRO_PRICES.monthly.amount;
  const yearly = PRO_PRICES.yearly.amount;
  const yearlyPerMonth = Math.round(yearly / 12 / 10) * 10;
  const savePct = Math.round((1 - yearly / (monthly * 12)) * 100);

  const callApi = async (path, body) => {
    setBusy(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...body, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) { window.location.assign(data.url); return; }
      setError(L("Одоогоор нээх боломжгүй байна. Дараа дахин оролдоорой.", "지금은 열 수 없어요. 잠시 후 다시 시도해 주세요.", "Couldn't open it right now. Please try again later."));
    } catch {
      setError(L("Холболт амжилтгүй. Дахин оролдоорой.", "연결에 실패했어요. 다시 시도해 주세요.", "Connection failed. Please try again."));
    }
    setBusy(false);
  };

  const cta = (() => {
    if (authLoading || sale === null) return { label: "…", disabled: true };
    if (isPro) return { label: L("Гишүүнчлэл удирдах", "멤버십 관리", "Manage membership"), onClick: () => callApi("/api/stripe/portal", {}), secondary: true };
    if (!sale.enabled) return { label: L("Төлбөр удахгүй нээгдэнэ", "결제는 곧 열려요", "Payments open soon"), disabled: true };
    if (!user) return { label: L("Нэвтрээд Pro болох", "로그인하고 Pro 시작", "Sign in to get Pro"), onClick: () => router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/pro`)}`) };
    const price = activePlan === "yearly" ? `${formatMnt(yearly)} / ${L("жил", "년", "year")}` : `${formatMnt(monthly)} / ${L("сар", "월", "month")}`;
    return { label: `${L("Pro болох", "Pro 시작", "Get Pro")} · ${price}`, onClick: () => { funnel("upgrade_clicked", { locale, meta: activePlan }); callApi("/api/stripe/checkout", { plan: activePlan }); } };
  })();

  return (
    <main style={{ minHeight: "100dvh", background: pageBackground, color: BRAND.text, padding: "16px 16px 120px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <button type="button" onClick={() => router.back()} style={{ minHeight: 40, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          ← {L("Буцах", "뒤로", "Back")}
        </button>

        <div style={{ marginTop: 20 }}><p style={{ ...kickerPill, margin: 0 }}><span style={kickerDot} />GAVANA PRO</p></div>
        <h1 style={{ ...displayTitle, fontSize: 38, lineHeight: 1.05, margin: "14px 0 8px" }}>
          {L("Илүү гүн бэлтгэл", "더 깊은 훈련", "Train deeper")}
        </h1>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: BRAND.muted }}>
          {L("Раунд, оноо, AI дүгнэлт үргэлж үнэгүй. Pro нь түүнээс цааш явах хүмүүст.", "라운드·점수·AI 디브리프는 언제나 무료. Pro는 더 나아가고 싶은 분들을 위한 거예요.", "Rounds, scores and the AI debrief are always free. Pro is for going further.")}
        </p>

        {subscribed && (
          <div role="status" style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.35)", fontSize: 14, color: "#A7F3D0" }}>
            {isPro
              ? L("Баярлалаа! GAVANA Pro идэвхтэй боллоо.", "감사합니다! GAVANA Pro가 활성화됐어요.", "Thank you! GAVANA Pro is active.")
              : L("Баярлалаа! Pro хэдэн секундын дараа идэвхжинэ.", "감사합니다! 몇 초 후 Pro가 활성화돼요.", "Thank you! Pro turns on in a few seconds.")}
          </div>
        )}

        {/* Plan + price */}
        <section style={{ marginTop: 22, borderRadius: 18, padding: 16, background: "linear-gradient(160deg, rgba(245,196,81,0.12), rgba(245,196,81,0.02))", border: `1px solid ${GOLD}55` }}>
          {yearlyAvailable && (
            <div role="radiogroup" aria-label={L("Төлөх хугацаа", "결제 주기", "Billing period")} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
              {[["monthly", L("Сар бүр", "월간", "Monthly")], ["yearly", `${L("Жилээр", "연간", "Yearly")} −${savePct}%`]].map(([k, label]) => (
                <button key={k} type="button" role="radio" aria-checked={activePlan === k} onClick={() => setPlan(k)}
                  style={{ minHeight: 40, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 800, border: activePlan === k ? `2px solid ${GOLD}` : "1px solid rgba(255,255,255,0.12)", background: activePlan === k ? `${GOLD}1f` : "rgba(255,255,255,0.03)", color: activePlan === k ? GOLD : "#fff" }}>
                  {label}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 34, fontWeight: 900, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
              {formatMnt(activePlan === "yearly" ? yearly : monthly)}
            </span>
            <span style={{ fontSize: 15, color: BRAND.muted }}>
              / {activePlan === "yearly" ? L("жил", "년", "year") : L("сар", "월", "month")}
            </span>
          </div>
          {activePlan === "yearly" && (
            <div style={{ fontSize: 13, color: BRAND.muted, marginTop: 2 }}>
              ≈ {formatMnt(yearlyPerMonth)} / {L("сар", "월", "month")}
            </div>
          )}

          <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 12 }}>
            {PRO_PERKS.map((p) => (
              <li key={p.key} style={{ display: "flex", gap: 10 }}>
                <span aria-hidden="true" style={{ fontSize: 20, lineHeight: "24px" }}>{p.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{p.title[locale] || p.title.en}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.45, color: BRAND.muted, marginTop: 2 }}>{p.body[locale] || p.body.en}</div>
                </div>
              </li>
            ))}
          </ul>

          <button type="button" disabled={busy || cta.disabled} onClick={cta.onClick}
            style={{ ...(cta.secondary ? btnSecondary : btnPrimary), width: "100%", marginTop: 18, fontFamily: "inherit", opacity: cta.disabled ? 0.6 : 1, cursor: cta.disabled ? "default" : "pointer" }}>
            {busy ? "…" : cta.label}
          </button>
          {error && <p role="alert" style={{ margin: "10px 0 0", fontSize: 13, color: "#FCA5A5" }}>{error}</p>}
          {sale && !sale.enabled && !isPro && (
            <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.45, color: BRAND.muted }}>
              {L("Төлбөрийн систем холбогдмогц энд нээгдэнэ. Одоогоор үнэгүй бүх боломж ажиллаж байна.", "결제 시스템이 연결되면 여기서 열려요. 지금은 무료 기능이 모두 작동해요.", "This opens here once payments are connected. All free features work now.")}
            </p>
          )}
        </section>

        {/* Free */}
        <section style={{ marginTop: 18, borderRadius: 16, padding: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 900, letterSpacing: 1.5, color: BRAND.muted }}>
            {L("ҮНЭГҮЙ ҮРГЭЛЖ", "언제나 무료", "ALWAYS FREE")}
          </h2>
          <ul style={{ margin: "10px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
            {(FREE_INCLUDES[locale] || FREE_INCLUDES.en).map((f) => (
              <li key={f} style={{ fontSize: 14, color: "#fff" }}>✓ {f}</li>
            ))}
          </ul>
        </section>

        <p style={{ margin: "16px 2px 0", fontSize: 12.5, lineHeight: 1.5, color: BRAND.muted }}>
          {L(
            "Төгрөгөөр (MNT) Stripe-аар төлнө. Хүссэн үедээ цуцлах боломжтой — төлсөн хугацаа дуустал Pro хэвээр.",
            "몽골 투그릭(MNT)으로 Stripe를 통해 결제돼요. 언제든 해지할 수 있고, 결제한 기간이 끝날 때까지 Pro가 유지돼요.",
            "Charged in Mongolian tögrög (MNT) through Stripe. Cancel any time — Pro stays until the paid period ends.",
          )}{" "}
          <a href={`/${locale}/terms`} style={{ color: "#fff" }}>{L("Нөхцөл", "이용약관", "Terms")}</a>
        </p>
      </div>
    </main>
  );
}

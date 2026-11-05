"use client";

import { useEffect, useState } from "react";
import { RED, GOLD, GREEN, RADIUS, FONT_SIZE, FONT_WEIGHT, whiteAlpha, redAlpha, goldAlpha } from "@/lib/tokens";
import { loc } from "@/lib/loc";
import { Spinner, ErrorState } from "@/components/ui";

/**
 * Activation funnel for admins: how many NEW users make it from landing to the
 * first "it understands my punches" moment, where they drop, how long it takes,
 * and whether they come back (D1/D7). Data: /api/admin/funnel.
 */
export default function FunnelCard({ user, locale }) {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | error
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setState("loading");
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/admin/funnel?days=${days}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        if (active) { setData(json); setState("ready"); }
      } catch {
        if (active) setState("error");
      }
    })();
    return () => { active = false; };
  }, [user, days, reloadKey]);

  const stepLabel = (s) => loc(locale, s.mn, s.ko, s.en);

  // The single worst step-to-step drop — the thing to fix first.
  const worst = data?.steps?.slice(1).reduce(
    (w, s, i) => (data.steps[i].reached > 0 && (w == null || s.pctOfPrev < w.pctOfPrev) ? s : w),
    null,
  );

  const secs = (ms) => (ms == null ? "—" : `${(ms / 1000).toFixed(1)}s`);

  return (
    <section style={{ marginBottom: 20, padding: 16, borderRadius: RADIUS.lg, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
        <div>
          <div style={{ fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.black, letterSpacing: 1.8, color: whiteAlpha(0.35), textTransform: "uppercase" }}>
            {loc(locale, "Activation funnel", "활성화 퍼널", "Activation funnel")}
          </div>
          <div style={{ fontSize: FONT_SIZE.sm, color: whiteAlpha(0.45), marginTop: 2 }}>
            {loc(locale, "Шинэ хэрэглэгч → эхний WOW хүртэл", "신규 사용자 → 첫 WOW까지", "New users → first WOW")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[7, 30].map((d) => (
            <button key={d} type="button" onClick={() => setDays(d)} style={{
              padding: "5px 10px", borderRadius: RADIUS.full, cursor: "pointer", fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold,
              border: `1px solid ${days === d ? redAlpha(0.5) : whiteAlpha(0.1)}`,
              background: days === d ? redAlpha(0.14) : "transparent",
              color: days === d ? RED : whiteAlpha(0.5),
            }}>
              {d}{loc(locale, " хоног", "일", "d")}
            </button>
          ))}
        </div>
      </div>

      {state === "loading" && (
        <div style={{ display: "grid", placeItems: "center", padding: 32 }}><Spinner /></div>
      )}

      {state === "error" && (
        <ErrorState
          title={loc(locale, "Funnel ачаалсангүй", "퍼널을 불러오지 못했습니다", "Couldn't load funnel")}
          message={loc(locale, "ADMIN_UIDS болон service account тохирсон эсэхийг шалга.", "ADMIN_UIDS와 서비스 계정 설정을 확인하세요.", "Check ADMIN_UIDS and the service account.")}
          retryLabel={loc(locale, "Дахин", "다시", "Retry")}
          onRetry={() => setReloadKey((k) => k + 1)}
          padding="24px 12px"
        />
      )}

      {state === "ready" && data && (
        <>
          {data.cohortSize === 0 ? (
            <p style={{ margin: "8px 0", fontSize: FONT_SIZE.base, color: whiteAlpha(0.45) }}>
              {loc(locale, "Энэ хугацаанд шинэ хэрэглэгчийн өгөгдөл алга. Event-үүд deploy-ийн дараа цуглаж эхэлнэ.", "이 기간에 신규 사용자 데이터가 없습니다. 배포 후 이벤트가 수집됩니다.", "No new-user data in this window yet. Events start collecting after deploy.")}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {data.steps.map((s, i) => {
                const isWorst = worst && s.key === worst.key;
                const isWow = s.key === "result_viewed";
                const bar = isWow ? GOLD : isWorst ? RED : whiteAlpha(0.35);
                return (
                  <div key={s.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: FONT_SIZE.sm, marginBottom: 3 }}>
                      <span style={{ color: isWow ? GOLD : whiteAlpha(0.75), fontWeight: isWow ? FONT_WEIGHT.bold : FONT_WEIGHT.medium }}>
                        {i + 1}. {stepLabel(s)}
                      </span>
                      <span style={{ color: whiteAlpha(0.6), fontVariantNumeric: "tabular-nums" }}>
                        {s.reached} · {s.pctOfTop}%
                        {i > 0 && (
                          <span style={{ color: isWorst ? RED : whiteAlpha(0.35), marginLeft: 6 }}>
                            ({s.pctOfPrev}% {loc(locale, "үлдсэн", "유지", "kept")})
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{ height: 7, borderRadius: 4, background: whiteAlpha(0.06), overflow: "hidden" }}>
                      <div style={{ width: `${Math.max(s.pctOfTop, s.reached > 0 ? 2 : 0)}%`, height: "100%", background: bar, borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Key numbers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 14 }}>
            <Metric label={loc(locale, "Шинэ хэрэглэгч", "신규 사용자", "New users")} value={data.cohortSize} />
            <Metric label={loc(locale, "WOW хүрэх хугацаа (p50)", "WOW 도달 (p50)", "Time to WOW (p50)")} value={secs(data.timeToWowMs?.p50)} color={GOLD} hint={`p75 ${secs(data.timeToWowMs?.p75)}`} />
            <Metric label={loc(locale, "Камер татгалзсан", "카메라 거부", "Camera denied")} value={data.cameraDenied} color={data.cameraDenied ? RED : undefined} />
            <Metric label="D1 / D7" value={`${data.retention?.d1?.rate ?? 0}% / ${data.retention?.d7?.rate ?? 0}%`} color={GREEN} hint={`n=${data.retention?.d1?.eligible ?? 0}/${data.retention?.d7?.eligible ?? 0}`} />
          </div>

          {worst && data.cohortSize > 0 && (
            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: RADIUS.sm, background: redAlpha(0.08), border: `1px solid ${redAlpha(0.25)}`, fontSize: FONT_SIZE.sm, color: whiteAlpha(0.8) }}>
              {loc(locale, "Хамгийн их уналт: ", "가장 큰 이탈: ", "Biggest drop: ")}
              <b style={{ color: RED }}>{stepLabel(worst)}</b> — {loc(locale, "үүнийг эхэлж засна.", "여기부터 개선하세요.", "fix this first.")}
            </div>
          )}

          {data.truncated && (
            <p style={{ margin: "10px 0 0", fontSize: FONT_SIZE.xs, color: goldAlpha(0.8) }}>
              {loc(locale, "Анхаар: 20,000 event-ээр хязгаарлагдсан — хугацааг богиносго.", "주의: 20,000개 이벤트로 제한됨 — 기간을 줄이세요.", "Note: capped at 20,000 events — shorten the window.")}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function Metric({ label, value, color, hint }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: RADIUS.sm, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.06)}` }}>
      <div style={{ fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.ultra, color: color || "#fff", lineHeight: 1.1 }}>{value ?? "—"}</div>
      <div style={{ fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.black, color: whiteAlpha(0.35), textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>{label}</div>
      {hint && <div style={{ fontSize: FONT_SIZE.xs, color: whiteAlpha(0.3), marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

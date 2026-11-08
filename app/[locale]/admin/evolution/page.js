import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Image from "next/image";
import { verifyAdminSession } from "@/lib/adminSession";
import { cycleGate, pickNext } from "@/lib/evolve/queue";
import control from "@/evolve/control.json";
import queue from "@/evolve/queue.json";
import memory from "@/evolve/memory.json";
import runsIndex from "@/evolve/runs-index.json";
import models from "@/evolve/coach/models.json";
import baseline from "@/docs/evaluations/baseline.json";
import shotToday from "@/tests/visual/__screenshots__/today-mn-390.png";
import shotTrain from "@/tests/visual/__screenshots__/train-live-mn-390.png";
import shotResult from "@/tests/visual/__screenshots__/result-mn-390.png";
import shotProgress from "@/tests/visual/__screenshots__/progress-mn-390.png";
import { launchReadiness } from "@/lib/server/launchReadiness";

// GAVANA Evolve — owner-only control room. Server component: the data below is
// bundled into server code only and rendered after a server-side admin check
// (on top of proxy.js). It is a snapshot of evolve/* as of this deploy; the live
// state is on the branch. Engine actions (pause / resume / stop) are made in
// evolve/control.json or by telling Claude — see the "Controls" card.

export const dynamic = "force-dynamic";
export const metadata = { title: "Evolution", robots: { index: false, follow: false } };

async function requireOwner() {
  const token = (await cookies()).get("admin_session")?.value;
  const uid = await verifyAdminSession(token);
  const admins = (process.env.ADMIN_UIDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  // Fail closed: no configured admins → nobody sees this page.
  if (!uid || !admins.length || !admins.includes(uid)) notFound();
  return uid;
}

const C = { bg: "#08080a", card: "rgba(255,255,255,0.04)", line: "rgba(255,255,255,0.08)", text: "#fff", muted: "rgba(255,255,255,0.65)", red: "#FF3B30", gold: "#F5C451", green: "#34D399" };
const verdictColor = (v) => (v === "ACCEPTED" ? C.green : v === "AWAITING_APPROVAL" ? C.gold : v ? C.red : C.muted);
const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "16px 18px", minWidth: 0, overflowWrap: "anywhere" };
const h2 = { margin: "0 0 10px", fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase", color: C.muted, fontWeight: 800 };
const fmt = (iso) => (iso ? new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC" : "—");

function Stat({ label, value, color }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || C.text, fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere" }}>{value}</div>
    </div>
  );
}

export default async function EvolutionPage() {
  await requireOwner();
  const now = Date.now();
  const gate = cycleGate(control, memory, now);
  const inProgress = (queue.tasks || []).find((t) => t.status === "in_progress");
  const next = pickNext(queue);
  const counts = (queue.tasks || []).reduce((m, t) => ({ ...m, [t.status]: (m[t.status] || 0) + 1 }), {});
  const runs = runsIndex.runs || [];
  const today = new Date(now).toISOString().slice(0, 10);
  const runsToday = runs.filter((r) => String(r.at).startsWith(today));
  const approvals = [
    ...runs.filter((r) => r.verdict === "AWAITING_APPROVAL").map((r) => ({ key: r.id, what: r.task, why: "run touches RED paths" })),
    ...(queue.tasks || []).filter((t) => t.status === "blocked").map((t) => ({ key: t.fingerprint, what: t.title, why: t.risk === "RED" ? "RED — owner decision" : "blocked" })),
  ];
  const alerts = runs.filter((r) => r.verdict === "REJECTED" || r.verdict === "FAILED").slice(0, 5);
  const lastRun = runs[0];
  const model = (models.models || []).find((m) => m.id === models.current);
  const cycles = (memory.cycles || []).slice(-12).reverse();

  return (
    <main style={{ minHeight: "100dvh", background: C.bg, color: C.text, padding: "24px 16px 60px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 14, minWidth: 0 }}>
        <header>
          <div style={{ fontSize: 12, letterSpacing: 2, color: C.red, fontWeight: 900 }}>GAVANA / ADMIN</div>
          <h1 style={{ margin: "4px 0 0", fontSize: 30 }}>Evolution Control</h1>
          <p style={{ margin: "6px 0 0", color: C.muted, fontSize: 13 }}>Snapshot of the branch state at deploy (baseline {baseline.commit}). Live state: <code>evolve/</code> on <code>{control.authorizedBranch}</code>.</p>
        </header>

        <section style={card}>
          <h2 style={h2}>Launch readiness (production settings — values never shown)</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {launchReadiness().map((c) => (
              <li key={c.key} style={{ display: "flex", gap: 10, fontSize: 13, alignItems: "baseline" }}>
                <b style={{ color: c.ok ? C.green : c.required ? C.red : C.gold, minWidth: 64 }}>{c.ok ? "OK" : c.required ? "MISSING" : "OFF"}</b>
                <span><b>{c.key}</b> — <span style={{ color: C.muted }}>{c.what}</span></span>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ ...card, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 14 }}>
          <Stat label="Engineer AI" value={control.paused ? "PAUSED" : gate.ok ? "ARMED" : gate.reason} color={control.paused || !gate.ok ? C.red : C.green} />
          <Stat label="Scheduler" value={control.scheduler?.id ? `${control.scheduler.cron || "on"}` : "not configured"} color={control.scheduler?.id ? C.green : C.gold} />
          <Stat label="Current task" value={inProgress ? inProgress.title : "—"} />
          <Stat label="Next task" value={next ? next.title : "none safe"} />
          <Stat label="Boxing AI model" value={`${models.current} · F1 ${model?.metrics?.macroF1 ?? "—"}`} />
          <Stat label="Cycles today" value={`${runsToday.length} runs · budget ${control.maxCyclesPerDay}/day`} />
          <Stat label="Paid API cost" value={`${control.budget?.paidApiCallsPerDay ?? 0} calls/day allowed · 0 used`} />
          <Stat label="Queue" value={Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(" · ") || "empty"} />
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 14 }}>
          <section style={card}>
            <h2 style={h2}>Latest test results</h2>
            {lastRun ? (
              <>
                <div style={{ fontSize: 14, marginBottom: 8 }}><b style={{ color: verdictColor(lastRun.verdict) }}>{lastRun.verdict}</b> · {fmt(lastRun.at)} · {lastRun.commit}</div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{lastRun.task}</div>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <tbody>
                    {Object.entries(baseline.metrics).map(([k, b]) => {
                      const v = lastRun.metrics?.[k];
                      return (
                        <tr key={k} style={{ borderTop: `1px solid ${C.line}` }}>
                          <td style={{ padding: "4px 0", color: C.muted }}>{k}</td>
                          <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{v ?? "NOT RUN"}</td>
                          <td style={{ textAlign: "right", color: C.muted, fontVariantNumeric: "tabular-nums" }}>base {b}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            ) : <p style={{ color: C.muted }}>No runs yet.</p>}
          </section>

          <section style={card}>
            <h2 style={h2}>Punch recognition · {models.current}</h2>
            {model && (
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead><tr style={{ color: C.muted }}><th style={{ textAlign: "left" }}>class</th><th>support</th><th>P</th><th>R</th><th>F1</th></tr></thead>
                <tbody>
                  {Object.entries(model.metrics.perClass).map(([c, m]) => (
                    <tr key={c} style={{ borderTop: `1px solid ${C.line}`, textAlign: "center" }}>
                      <td style={{ textAlign: "left", padding: "4px 0" }}>{c}</td><td>{m.support}</td><td>{m.precision}</td><td>{m.recall}</td><td><b>{m.f1}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p style={{ fontSize: 12, color: C.muted, margin: "10px 0 0" }}>Evaluated on {model?.evaluatedOn} (39 punches, one fighter — not representative). On-device latency: {model?.latency?.onDevice}.</p>
            <h2 style={{ ...h2, marginTop: 14 }}>Training experiments</h2>
            {(models.experiments || []).length ? null : <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>None. Pipeline: {Object.entries(models.pipeline).map(([k, v]) => `${k}: ${v.split(" — ")[0]}`).join(" · ")}</p>}
          </section>

          <section style={card}>
            <h2 style={h2}>Approval requests</h2>
            {approvals.length ? approvals.map((a) => (
              <div key={a.key} style={{ borderTop: `1px solid ${C.line}`, padding: "6px 0", fontSize: 13 }}>
                <div>{a.what}</div><div style={{ color: C.gold, fontSize: 12 }}>{a.why}</div>
              </div>
            )) : <p style={{ color: C.muted, fontSize: 13 }}>Nothing waiting.</p>}
          </section>

          <section style={card}>
            <h2 style={h2}>Error alerts</h2>
            {!gate.ok && <div style={{ color: C.red, fontSize: 13, marginBottom: 6 }}>{gate.reason}: {gate.note}</div>}
            {alerts.length ? alerts.map((r) => (
              <div key={r.id} style={{ borderTop: `1px solid ${C.line}`, padding: "6px 0", fontSize: 13 }}>
                <b style={{ color: C.red }}>{r.verdict}</b> {fmt(r.at)} — failed: {r.failedSteps.join(", ") || "gates"}<div style={{ color: C.muted, fontSize: 12 }}>{r.task}</div>
              </div>
            )) : <p style={{ color: C.muted, fontSize: 13 }}>No failed runs.</p>}
          </section>

          <section style={card}>
            <h2 style={h2}>Controls</h2>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: C.muted }}>
              <li><b style={{ color: C.text }}>Emergency stop</b>: set <code>&quot;paused&quot;: true</code> in <code>evolve/control.json</code> (GitHub → edit) or tell Claude &quot;зогсоо&quot;. Every cycle reads it first.</li>
              <li><b style={{ color: C.text }}>Resume</b>: set <code>&quot;paused&quot;: false</code>. Only the owner does this — the automation never unpauses itself.</li>
              <li><b style={{ color: C.text }}>Clear the failure breaker</b>: set <code>clearFailuresBefore</code> to now.</li>
              <li>Buttons on this page are not wired yet: writing to the branch from the server needs a GitHub token secret (owner decision).</li>
            </ul>
          </section>
        </div>

        <section style={card}>
          <h2 style={h2}>Recent cycles</h2>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", tableLayout: "fixed" }}>
            <tbody>
              {cycles.map((c) => (
                <tr key={c.cycleId + c.at} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ padding: "6px 0", color: C.muted, width: 84, fontSize: 12, verticalAlign: "top" }}>{fmt(c.at)}</td>
                  <td style={{ padding: "6px 8px", color: verdictColor(c.outcome), fontWeight: 800, width: 96, fontSize: 11, verticalAlign: "top" }}>{c.outcome}</td>
                  <td style={{ padding: "6px 0" }}>{c.task || "—"}<div style={{ color: C.muted, fontSize: 12 }}>{c.commit ? `commit ${c.commit} · ` : ""}{c.note}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={card}>
          <h2 style={h2}>Run history</h2>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", tableLayout: "fixed" }}>
            <tbody>
              {runs.slice(0, 25).map((r) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ padding: "6px 0", color: C.muted, width: 84, fontSize: 12, verticalAlign: "top" }}>{fmt(r.at)}</td>
                  <td style={{ padding: "6px 8px", color: verdictColor(r.verdict), fontWeight: 800, width: 96, fontSize: 11, verticalAlign: "top" }}>{r.verdict}</td>
                  <td style={{ padding: "6px 0" }}>{r.task}<div style={{ color: C.muted, fontSize: 12 }}>{r.commit} · {r.level} · {r.durationS}s{r.failedSteps.length ? ` · failed ${r.failedSteps.join(", ")}` : ""}{r.notRun.length ? ` · not run ${r.notRun.join(", ")}` : ""}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={card}>
          <h2 style={h2}>UI regression baselines (core screens)</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 45%), 1fr))", gap: 10 }}>
            {[["Today", shotToday], ["Train (live)", shotTrain], ["Result", shotResult], ["Progress", shotProgress]].map(([label, src]) => (
              <figure key={label} style={{ margin: 0 }}>
                <div style={{ height: 260, overflow: "hidden", borderRadius: 12, border: `1px solid ${C.line}` }}>
                  <Image src={src} alt={`${label} baseline`} style={{ width: "100%", height: "auto" }} sizes="200px" />
                </div>
                <figcaption style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{label}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

// Coach: "my students" — team code, daily assignment, each student's rounds and progress.
// Data from /api/coach/team (server-side; students joined with the code).
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocale } from "@/lib/i18n";
import { loc } from "@/lib/loc";
import { coachApi } from "@/lib/coach/api";
import BottomNav from "@/components/BottomNav";
import CoachTeamView from "@/components/coach/team/CoachTeamView";
import { BRAND, btnPrimary, pageBackground } from "@/components/ui/brand";

export default function CoachTeamPage() {
  const params = useParams();
  const locale = getLocale(params?.locale);
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null); // { team, students, now }
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await coachApi(user, "/api/coach/team");
    if (r.ok) { setData(r.data); setError(null); } else setError(r.status === 503 ? "unavailable" : "failed");
  }, [user]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const act = async (body) => {
    setBusy(true);
    const r = await coachApi(user, "/api/coach/team", { method: "POST", body });
    if (r.ok) await load(); else setError("failed");
    setBusy(false);
  };

  const share = async (code) => {
    const text = L(`GAVANA дээр миний багт нэгдээрэй: Коуч → код ${code}`, `GAVANA에서 내 팀에 참여하세요: 코치 → 코드 ${code}`, `Join my team on GAVANA: Coach → code ${code}`);
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard?.writeText(code);
    } catch { /* cancelled */ }
  };

  const remove = (s) => {
    if (window.confirm(L(`${s.name}-г багаас хасах уу?`, `${s.name}을(를) 팀에서 제거할까요?`, `Remove ${s.name} from the team?`))) act({ action: "remove", studentUid: s.uid });
  };

  let body;
  if (authLoading) body = null;
  else if (!user) {
    body = (
      <Center>
        <p style={{ color: BRAND.muted, margin: "0 0 16px" }}>{L("Нэвтэрсний дараа багаа үүсгэнэ.", "로그인 후 팀을 만들 수 있어요.", "Sign in to create your team.")}</p>
        <button type="button" style={btnPrimary} onClick={() => router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/coach/team`)}`)}>{L("Нэвтрэх", "로그인", "Sign in")}</button>
      </Center>
    );
  } else if (error && !data) {
    body = (
      <Center>
        <p role="alert" style={{ color: BRAND.muted, margin: "0 0 16px" }}>
          {error === "unavailable"
            ? L("Сервер хараахан тохируулагдаагүй байна.", "서버가 아직 설정되지 않았어요.", "The server isn't set up for this yet.")
            : L("Ачаалж чадсангүй.", "불러오지 못했어요.", "Couldn't load.")}
        </p>
        <button type="button" style={btnPrimary} onClick={load}>{L("Дахин оролдох", "다시 시도", "Try again")}</button>
      </Center>
    );
  } else if (!data) body = <Center><p style={{ color: BRAND.faint }}>…</p></Center>;
  else {
    body = (
      <CoachTeamView
        locale={locale} team={data.team} students={data.students} now={data.now}
        tzOffsetMin={new Date().getTimezoneOffset()} busy={busy}
        onCreate={() => act({ action: "save" })} onSave={(patch) => act({ action: "save", ...patch })}
        onRemove={remove} onShare={share}
      />
    );
  }

  return (
    <main style={{ minHeight: "100dvh", background: pageBackground, color: BRAND.text }}>
      {body}
      <BottomNav router={router} user={user} currentLocale={locale} activeTab="coach" />
    </main>
  );
}

function Center({ children }) {
  return <div style={{ maxWidth: 420, margin: "0 auto", padding: "120px 16px", textAlign: "center" }}>{children}</div>;
}

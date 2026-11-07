"use client";

import { useRef, useState } from "react";
import { analyzeStancePhoto } from "@/lib/stanceFromPose";

// Onboarding: "find my stance from a photo". The user takes / picks one
// full-body photo in their stance; MediaPipe (on device, nothing uploaded)
// estimates the lead side and pre-selects orthodox / southpaw.

export default function StancePhotoCheck({ locale, onStance }) {
  const L = (mn, ko, en) => (locale === "mn" ? mn : locale === "ko" ? ko : en);
  const inputRef = useRef(null);
  const [state, setState] = useState({ status: "idle" }); // idle | working | done | error

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setState({ status: "working" });
    try {
      const { detectPoseInPhoto } = await import("@/lib/poseImage");
      const pose = await detectPoseInPhoto(file);
      const r = pose ? analyzeStancePhoto(pose.world, pose.image) : { ok: false, reason: "no_pose" };
      if (r.ok) onStance(r.stance);
      setState({ status: r.ok ? "done" : "error", result: r });
    } catch {
      setState({ status: "error", result: { ok: false, reason: "load_failed" } });
    }
  };

  const reasons = {
    no_pose: L("Зурган дээр хүн олдсонгүй.", "사진에서 사람을 찾지 못했어요.", "No person found in the photo."),
    body_not_visible: L("Бүтэн биеэ (хөл хүртэл) харуулаарай.", "발끝까지 전신이 보이게 찍어 주세요.", "Show your whole body, down to the feet."),
    square_on: L("Камер руу шууд харсан байна — байрлалдаа зогсоод дахин зураарай.", "정면으로 서 있어요 — 스탠스를 잡고 다시 찍어 주세요.", "You're square to the camera — get in your stance and try again."),
    load_failed: L("AI ачаалж чадсангүй. Дээрээс гараар сонгоорой.", "AI를 불러오지 못했어요. 위에서 직접 선택하세요.", "Couldn't load the AI. Pick above by hand."),
  };
  const guardText = { high: L("өндөр", "높음", "high"), mid: L("дунд", "중간", "mid"), low: L("доогуур", "낮음", "low") };
  const feetText = { narrow: L("нарийн", "좁음", "narrow"), good: L("зөв", "좋음", "good"), wide: L("өргөн", "넓음", "wide") };
  const r = state.result;

  return (
    <div style={{ marginTop: 10 }}>
      <input ref={inputRef} type="file" accept="image/*" capture="user" onChange={onFile} style={{ display: "none" }} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={state.status === "working"}
        style={{
          width: "100%", minHeight: 44, borderRadius: 14, cursor: "pointer", fontFamily: "inherit",
          border: "1px dashed rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.03)",
          color: "#fff", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        <span aria-hidden="true">📷</span>
        {state.status === "working"
          ? L("Шалгаж байна…", "확인 중…", "Checking…")
          : L("Зургаас тодорхойлох", "사진으로 확인", "Detect from a photo")}
      </button>
      <p role="status" aria-live="polite" style={{ margin: "8px 2px 0", fontSize: 12.5, lineHeight: 1.45, color: "rgba(255,255,255,0.66)" }}>
        {state.status === "done" && r && (
          <>
            <strong style={{ color: "#fff" }}>
              {r.stance === "orthodox" ? L("Orthodox — зүүн тал урд", "오소독스 — 왼쪽이 앞", "Orthodox — left side forward") : L("Southpaw — баруун тал урд", "사우스포 — 오른쪽이 앞", "Southpaw — right side forward")}
            </strong>
            {r.guard && <> · {L("Хамгаалалт", "가드", "Guard")}: {guardText[r.guard]}</>}
            {r.footWidthLabel && <> · {L("Хөлийн зай", "발 너비", "Feet")}: {feetText[r.footWidthLabel]}</>}
            <br />
            {L("Буруу бол дээрээс солиорой (толин зураг эсрэгээр гарч болно).", "틀리면 위에서 바꾸세요 (거울 사진은 반대로 나올 수 있어요).", "Wrong? Switch above (mirrored selfies can come out reversed).")}
          </>
        )}
        {state.status === "error" && r && reasons[r.reason]}
        {state.status === "idle" && L("Байрлалдаа зогсоод бүтэн биеэ зураарай. Зураг утсан дээрээ л шалгагдана, хаана ч илгээгдэхгүй.", "스탠스를 잡고 전신을 찍어 주세요. 사진은 폰에서만 분석되고 업로드되지 않아요.", "Stand in your stance, full body in frame. The photo is checked on your phone and never uploaded.")}
      </p>
    </div>
  );
}

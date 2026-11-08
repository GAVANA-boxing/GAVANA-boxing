"use client";

import ErrorScreen from "@/components/ui/ErrorScreen";

const MESSAGE = {
  mn: "AI коуч ачааллагдсангүй. Холболтоо шалгаад дахин оролдоно уу.",
  ko: "AI 코치를 불러오지 못했어요. 연결을 확인하고 다시 시도하세요.",
  en: "The AI coach couldn't load. Check your connection and try again.",
};

export default function CoachError({ reset }) {
  return <ErrorScreen reset={reset} message={MESSAGE} />;
}

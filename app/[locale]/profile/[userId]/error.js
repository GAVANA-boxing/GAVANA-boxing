"use client";

import ErrorScreen from "@/components/ui/ErrorScreen";

const MESSAGE = {
  mn: "Профайл ачааллагдсангүй. Дахин оролдоно уу.",
  ko: "프로필을 불러오지 못했어요. 다시 시도하세요.",
  en: "This profile couldn't be loaded. Try again.",
};

export default function ProfileError({ error, reset }) {
  return <ErrorScreen reset={reset} message={MESSAGE} error={error} />;
}

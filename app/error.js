"use client";

import ErrorScreen from "@/components/ui/ErrorScreen";

const MESSAGE = {
  mn: "Хуудсыг ачааллахад алдаа гарлаа. Интернэт холболтоо шалгаад дахин оролдоно уу.",
  ko: "페이지를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도하세요.",
  en: "This page didn't load. Check your connection and try again.",
};

export default function RouteError({ error, reset }) {
  return <ErrorScreen reset={reset} message={MESSAGE} error={error} />;
}

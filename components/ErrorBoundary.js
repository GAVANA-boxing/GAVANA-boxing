"use client";

import { Component } from "react";
import ErrorState from "@/components/ui/ErrorState";

const T = {
  en: {
    title:  "Something went wrong",
    msg:    "Please try again",
    btn:    "Try again",
  },
  mn: {
    title:  "Алдаа гарлаа",
    msg:    "Дахин оролдоно уу",
    btn:    "Дахин оролдох",
  },
  ko: {
    title:  "오류가 발생했습니다",
    msg:    "다시 시도해 주세요",
    btn:    "다시 시도",
  },
};

function detectLocale(localeProp) {
  if (localeProp && T[localeProp]) return localeProp;
  if (typeof document !== "undefined") {
    const lang = document.documentElement.lang || "";
    if (lang.startsWith("mn")) return "mn";
    if (lang.startsWith("ko")) return "ko";
  }
  return "en";
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      const locale = detectLocale(this.props.locale);
      const t = T[locale] || T.en;
      return (
        <ErrorState
          title={this.props.title || t.title}
          message={this.props.message || t.msg}
          retryLabel={t.btn}
          onRetry={() => this.setState({ hasError: false })}
          padding="32px 24px"
        />
      );
    }
    return this.props.children;
  }
}

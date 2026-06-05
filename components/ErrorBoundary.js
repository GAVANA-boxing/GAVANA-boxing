"use client";

import { Component } from "react";

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

const styles = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
    padding: "32px 24px",
    textAlign: "center",
    color: "#fff",
  },
  icon: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 8, color: "#fff" },
  msg: { fontSize: 13, color: "#aaa", marginBottom: 20 },
  btn: {
    background: "#C8102E",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 22px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
};

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
        <div style={styles.wrap}>
          <div style={styles.icon}>⚠️</div>
          <div style={styles.title}>{this.props.title || t.title}</div>
          <div style={styles.msg}>{this.props.message || t.msg}</div>
          <button type="button" style={styles.btn} onClick={() => this.setState({ hasError: false })}>
            {t.btn}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

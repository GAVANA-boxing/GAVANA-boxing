"use client";

import { Component } from "react";

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
      return (
        <div style={styles.wrap}>
          <div style={styles.icon}>⚠️</div>
          <div style={styles.title}>{this.props.title || "Алдаа гарлаа"}</div>
          <div style={styles.msg}>{this.props.message || "Дахин оролдоно уу"}</div>
          <button style={styles.btn} onClick={() => this.setState({ hasError: false })}>
            Дахин оролдох
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

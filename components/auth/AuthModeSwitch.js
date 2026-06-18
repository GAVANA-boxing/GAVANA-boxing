"use client";

import { GOLD } from "@/lib/tokens";

const S = {
  switchBtn: {
    background: "none",
    border: "none",
    color: GOLD,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    display: "block",
    margin: "20px auto 0",
    padding: 0,
    opacity: 0.7,
  },
};

/**
 * Toggle button to switch between sign-in and sign-up modes.
 *
 * @param {{ isSignUp: boolean, onClick: () => void, signInLabel: string, signUpLabel: string }} props
 */
export default function AuthModeSwitch({ isSignUp, onClick, signInLabel, signUpLabel }) {
  return (
    <button onClick={onClick} style={S.switchBtn}>
      {isSignUp ? signInLabel : signUpLabel}
    </button>
  );
}

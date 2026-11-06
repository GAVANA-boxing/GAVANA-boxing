"use client";

import { BRAND } from "@/components/ui/brand";

const S = {
  switchBtn: {
    background: "none",
    border: "none",
    color: BRAND.gold,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 14.5,
    fontWeight: 600,
    display: "block",
    margin: "18px auto 0",
    padding: 0,
  },
};

/**
 * Toggle button to switch between sign-in and sign-up modes.
 *
 * @param {{ isSignUp: boolean, onClick: () => void, signInLabel: string, signUpLabel: string }} props
 */
export default function AuthModeSwitch({ isSignUp, onClick, signInLabel, signUpLabel }) {
  return (
    <button type="button" onClick={onClick} style={S.switchBtn}>
      {isSignUp ? signInLabel : signUpLabel}
    </button>
  );
}

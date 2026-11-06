"use client";

import {
  IcoDash,
  IcoHome,
  IcoPlay,
  IcoBrain,
  IcoTarget,
  IcoFighter,
  IcoSwords,
  IcoBars,
  IcoFlash,
  IcoUsers,
  IcoBuilding,
  IcoMessage,
} from "./icons";

// Same structure as the mobile tab bar (Home · Progress · Train · Coach · Me),
// then the social groups (hidden in core mode).
export const NAV = [
  {
    group: "GAVANA",
    items: [
      { Icon: IcoHome,   label: "Home",        path: "home" },
      { Icon: IcoDash,   label: "Progress",    path: "progress" },
      { Icon: IcoBrain,  label: "Train",       path: "train" },
      { Icon: IcoFlash,  label: "Ghost Round", path: "ghost" },
      { Icon: IcoTarget, label: "Coach",       path: "coach" },
    ],
  },
  {
    group: "YOU",
    items: [
      { Icon: IcoFighter, label: "Fighter DNA",   path: "fighter-profile" },
      { Icon: IcoBars,    label: "History",       path: "history" },
    ],
  },
  {
    group: "DISCOVER",
    items: [
      { Icon: IcoHome,   label: "Discover",   path: "discover" },
      { Icon: IcoPlay,   label: "Reels",      path: "reels" },
    ],
  },
  {
    group: "COMPETE",
    items: [
      { Icon: IcoSwords,   label: "Sparring",    path: "sparring" },
      { Icon: IcoBars,     label: "Leaderboard", path: "leaderboard" },
      { Icon: IcoFlash,    label: "Challenges",  path: "challenges" },
    ],
  },
  {
    group: "EXPLORE",
    items: [
      { Icon: IcoUsers,    label: "Fighters",    path: "fighters" },
      { Icon: IcoBuilding, label: "Gyms",        path: "gyms" },
    ],
  },
  {
    group: "SOCIAL",
    items: [
      { Icon: IcoMessage, label: "Inbox",        path: "inbox" },
    ],
  },
];

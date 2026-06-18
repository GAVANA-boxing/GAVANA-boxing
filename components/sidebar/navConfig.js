"use client";

import {
  IcoDash,
  IcoHome,
  IcoPlay,
  IcoBrain,
  IcoTarget,
  IcoFighter,
  IcoTrophy,
  IcoSwords,
  IcoBars,
  IcoFlash,
  IcoUsers,
  IcoBuilding,
  IcoMessage,
} from "./icons";

export const NAV = [
  {
    group: "CORE",
    items: [
      { Icon: IcoDash,   label: "Dashboard",  path: "dashboard" },
      { Icon: IcoHome,   label: "Discover",   path: "discover" },
      { Icon: IcoPlay,   label: "Reels",      path: "reels" },
    ],
  },
  {
    group: "TRAIN",
    items: [
      { Icon: IcoBrain,   label: "AI Coach",        path: "train" },
      { Icon: IcoTarget,  label: "Coach",           path: "coach" },
      { Icon: IcoFighter, label: "Fighter Intel",   path: "fighter-profile" },
    ],
  },
  {
    group: "COMPETE",
    items: [
      { Icon: IcoTrophy,   label: "Rank",        path: "rank" },
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

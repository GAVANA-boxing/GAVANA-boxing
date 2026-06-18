"use client";

import Image from "next/image";
import styles from "@/components/gyms/gymIdStyles";

export default function GymHero({ gym }) {
  return (
    <div style={styles.hero}>
      {gym.images?.[0] ? (
        <Image src={gym.images[0]} alt="" fill style={{ objectFit: "cover" }} />
      ) : (
        <div style={styles.heroPlaceholder}>
          <span style={{ fontSize: 52 }}>🥊</span>
        </div>
      )}
      {gym.logo && (
        <Image
          src={gym.logo}
          alt=""
          width={60}
          height={60}
          style={{ position: "absolute", bottom: -20, left: 20, borderRadius: 12, objectFit: "cover" }}
        />
      )}
    </div>
  );
}

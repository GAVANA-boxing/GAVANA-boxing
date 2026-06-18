"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import FighterTechSheet from "./FighterTechSheet";
import TechDetailSheet from "./TechDetailSheet";

/**
 * Root sheet controller — owns mounted/selectedTech state and renders
 * either FighterTechSheet (technique list) or TechDetailSheet (detail view)
 * into a React portal on document.body.
 *
 * @param {{ fighter: object|null, onClose: () => void, locale: string, router?: object }} props
 */
export default function TechniqueSheet({ fighter, onClose, locale, router }) {
  const [mounted, setMounted] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  if (!fighter || !mounted) return null;

  const content = selectedTech ? (
    <TechDetailSheet
      fighter={fighter}
      technique={selectedTech}
      onClose={onClose}
      onBack={() => setSelectedTech(null)}
      locale={locale}
      router={router}
    />
  ) : (
    <FighterTechSheet
      fighter={fighter}
      onClose={onClose}
      onSelectTech={(f, tech) => setSelectedTech(tech)}
      locale={locale}
    />
  );

  return createPortal(content, document.body);
}

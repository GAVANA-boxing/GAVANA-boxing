import { useEffect, useState } from "react";
import { getDocs } from "firebase/firestore";

/**
 * Convert a Firestore QuerySnapshot to a plain array.
 * Adds `id` from the document reference.
 *
 * @param {import("firebase/firestore").QuerySnapshot} snap
 * @returns {object[]}
 */
export function snapToDocs(snap) {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * One-shot Firestore query hook.
 *
 * @param {() => import("firebase/firestore").Query | null} buildQuery
 *   Called on mount and when deps change. Return null to skip fetching.
 * @param {any[]} deps
 * @returns {{ data: object[], loading: boolean }}
 */
export function useFirestoreQuery(buildQuery, deps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = buildQuery();
    if (!q) { setLoading(false); return; }

    let active = true;
    setLoading(true);
    getDocs(q)
      .then((snap) => { if (active) setData(snapToDocs(snap)); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading };
}

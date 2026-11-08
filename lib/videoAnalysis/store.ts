// Where an uploaded-clip analysis writes its status. Firestore for real users (video_analyses,
// rules: owner-only, queued → processing → completed | failed); in-memory for the fixture /
// E2E test. Firestore is imported on demand.
import type { ClipErrorCode } from "./clip";

export type ClipPatch =
  | { status: "processing"; progressPct: number }
  | { status: "completed"; score: number | null; punches: number; poseFramesPct: number; error: null; thumbnailUrl?: string | null }
  | { status: "failed"; error: ClipErrorCode };

export interface ClipStore {
  /** Creates the doc as "queued" and returns its id. */
  create(init: { durationSec: number }): Promise<string>;
  update(id: string, patch: ClipPatch): Promise<void>;
}

export function firestoreClipStore(uid: string): ClipStore {
  const load = async () => {
    const [fs, { db }] = await Promise.all([import("firebase/firestore"), import("@/lib/firebase")]);
    return { fs, db };
  };
  return {
    async create({ durationSec }) {
      const { fs, db } = await load();
      const ref = await fs.addDoc(fs.collection(db, "video_analyses"), {
        userId: uid, status: "queued", durationSec: Math.round(durationSec * 10) / 10,
        createdAt: fs.serverTimestamp(), updatedAt: fs.serverTimestamp(),
      });
      return ref.id;
    },
    async update(id, patch) {
      const { fs, db } = await load();
      await fs.updateDoc(fs.doc(db, "video_analyses", id), { ...patch, updatedAt: fs.serverTimestamp() });
    },
  };
}

export interface MemoryClipStore extends ClipStore {
  log: Array<{ id: string; op: "create" | "update"; data: Record<string, unknown> }>;
}

/** For fixtures / tests: records every write, never touches the network. */
export function memoryClipStore(onWrite?: (log: MemoryClipStore["log"]) => void): MemoryClipStore {
  const log: MemoryClipStore["log"] = [];
  let n = 0;
  return {
    log,
    async create(init) {
      const id = `clip-${++n}`;
      log.push({ id, op: "create", data: { status: "queued", ...init } });
      onWrite?.([...log]);
      return id;
    },
    async update(id, patch) {
      log.push({ id, op: "update", data: { ...patch } });
      onWrite?.([...log]);
    },
  };
}

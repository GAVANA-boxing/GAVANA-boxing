"use client";

// Fixture for /visual/dashboard and the CV E2E test: the analyzer on an in-memory store, with
// every write shown as JSON (data-testid="clip-log") so a test can follow
// queued → processing → completed. Never touches Firestore.
import { useMemo, useState } from "react";
import { memoryClipStore, type MemoryClipStore } from "@/lib/videoAnalysis/store";
import type { DashboardCopy } from "@/lib/dashboard/copy";
import ClipAnalyzer from "./ClipAnalyzer";

export default function ClipAnalyzerFixture({ copy, showLog = false }: { copy: DashboardCopy; showLog?: boolean }) {
  const [log, setLog] = useState<MemoryClipStore["log"]>([]);
  const store = useMemo(() => memoryClipStore(setLog), []);
  return (
    <>
      <ClipAnalyzer store={store} stance="orthodox" copy={copy} />
      {showLog ? <pre data-testid="clip-log" className="sr-only">{JSON.stringify(log)}</pre> : null}
    </>
  );
}

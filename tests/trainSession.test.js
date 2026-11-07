import { describe, it, expect } from "vitest";
import { STUDIO as S, IDLE_STATES, RESULT_STATES, deriveStudio, cameraStudioState, canTransition, studioUi } from "@/lib/trainSession";

const derive = (f) => deriveStudio({ cameraState: "ready", phase: "idle", ...f });
const ui = (f) => studioUi(derive(f));

describe("deriveStudio", () => {
  it("maps the camera when idle", () => {
    expect(derive({ cameraState: "checking" }).state).toBe(S.REQUESTING_CAMERA);
    expect(derive({ cameraState: "ready" }).state).toBe(S.READY);
    expect(derive({ cameraState: "denied" }).state).toBe(S.CAMERA_DENIED);
    expect(derive({ cameraState: "denied", cameraError: "NotAllowedError" }).state).toBe(S.CAMERA_DENIED);
    expect(derive({ cameraState: "denied", cameraError: "NotFoundError" }).state).toBe(S.CAMERA_UNAVAILABLE);
    expect(derive({ cameraState: "denied", cameraError: "NotReadableError" }).state).toBe(S.CAMERA_UNAVAILABLE);
    expect(derive({ cameraState: "unsupported" }).state).toBe(S.CAMERA_UNAVAILABLE);
  });

  it("round phase wins over the camera", () => {
    expect(derive({ cameraState: "denied", phase: "countdown" }).state).toBe(S.COUNTDOWN);
    expect(derive({ cameraState: "denied", phase: "recording" })).toEqual({ state: S.RECORDING, camera: S.CAMERA_DENIED, cameraLive: false });
    expect(derive({ phase: "recording" })).toEqual({ state: S.RECORDING, camera: S.READY, cameraLive: true });
  });

  it("maps save progress after a round", () => {
    expect(derive({ phase: "result" }).state).toBe(S.RESULT);
    expect(derive({ phase: "result", saving: true }).state).toBe(S.SAVING);
    expect(derive({ phase: "result", saved: true }).state).toBe(S.SAVED);
    expect(derive({ phase: "result", saveFailed: true }).state).toBe(S.SAVE_FAILED);
    expect(derive({ phase: "result", saving: true, saveFailed: true }).state).toBe(S.SAVING);
  });

  it("never throws on empty input", () => {
    expect(deriveStudio().state).toBe(S.REQUESTING_CAMERA);
    expect(cameraStudioState(undefined)).toBe(S.REQUESTING_CAMERA);
  });
});

describe("canTransition", () => {
  it("allows the happy path", () => {
    const path = [S.REQUESTING_CAMERA, S.READY, S.COUNTDOWN, S.RECORDING, S.RESULT, S.SAVING, S.SAVED, S.COUNTDOWN];
    path.slice(1).forEach((to, i) => expect(canTransition(path[i], to), `${path[i]} → ${to}`).toBe(true));
  });

  it("allows a timer-only round and a failed save retry", () => {
    expect(canTransition(S.CAMERA_DENIED, S.COUNTDOWN)).toBe(true);
    expect(canTransition(S.SAVING, S.SAVE_FAILED)).toBe(true);
    expect(canTransition(S.SAVE_FAILED, S.SAVING)).toBe(true);
  });

  it("rejects impossible jumps", () => {
    expect(canTransition(S.READY, S.RECORDING)).toBe(false);   // skipped the countdown
    expect(canTransition(S.READY, S.RESULT)).toBe(false);
    expect(canTransition(S.COUNTDOWN, S.RESULT)).toBe(false);
    expect(canTransition(S.RECORDING, S.SAVING)).toBe(false);
    expect(canTransition(S.SAVED, S.SAVING)).toBe(false);      // double save
  });

  it("every state has an entry and staying put is fine", () => {
    Object.values(S).forEach((st) => {
      expect(canTransition(st, st)).toBe(true);
      expect(Object.values(S).some((to) => to !== st && canTransition(st, to))).toBe(true);
    });
  });
});

describe("studioUi", () => {
  it("shows REC only while recording on a live camera", () => {
    expect(ui({ phase: "recording" }).recBadge).toBe(true);
    expect(ui({ phase: "recording", cameraState: "denied" }).recBadge).toBe(false);
    for (const cameraState of ["checking", "denied", "unsupported", "ready"]) {
      expect(ui({ cameraState }).recBadge).toBe(false);
    }
  });

  it("names the start button for the situation", () => {
    expect(ui({}).startKind).toBe("start");
    expect(ui({ cameraState: "checking" }).startKind).toBe("start");
    expect(ui({ cameraState: "denied" }).startKind).toBe("timer");
    expect(ui({ cameraState: "unsupported" }).startKind).toBe("timer");
    expect(ui({ phase: "result" }).startKind).toBe("again");
  });

  it("hides the dock during a round and while saving", () => {
    expect(ui({ phase: "countdown" }).dock).toBe(false);
    expect(ui({ phase: "recording" }).dock).toBe(false);
    expect(ui({ phase: "result", saving: true }).dock).toBe(false);
    for (const cameraState of ["checking", "denied", "unsupported", "ready"]) expect(ui({ cameraState }).dock).toBe(true);
    expect(IDLE_STATES).toHaveLength(4);
    expect(ui({ phase: "result", saved: true }).dock).toBe(true);
  });

  it("explains a missing preview even mid-round, offers retry only between rounds", () => {
    expect(ui({ cameraState: "denied", phase: "recording" }).stageMessage).toBe("denied");
    expect(ui({ cameraState: "denied", phase: "recording" }).retryCamera).toBe(false);
    expect(ui({ cameraState: "denied" }).retryCamera).toBe(true);
    expect(ui({ cameraState: "denied", cameraError: "NotFoundError" }).stageMessage).toBe("unavailable");
    expect(ui({ cameraState: "checking" }).stageMessage).toBe("checking");
    expect(ui({ cameraState: "checking" }).retryCamera).toBe(false);
    expect(ui({}).stageMessage).toBe(null);
  });

  it("result states are all covered", () => {
    expect(RESULT_STATES).toHaveLength(4);
  });
});

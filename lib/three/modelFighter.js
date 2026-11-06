// A rigged character (Mixamo-style skeleton, e.g. exported from Meshy) driven by
// MediaPipe pose landmarks. Same interface as createFighterAvatar():
// { group, update(pos, state), dispose }.
//
// Retargeting: for each driven bone we know its rest direction (bone → child) in
// world space. Every frame we rotate it so that direction points along the
// matching landmark segment (shoulder → elbow, …). Hips and chest also match the
// twist of the hip line / shoulder line, so a cross shows the shoulders turning.

const LM = {
  NOSE: 0, L_EAR: 7, R_EAR: 8,
  L_SH: 11, R_SH: 12, L_EL: 13, R_EL: 14, L_WR: 15, R_WR: 16,
  L_PINKY: 17, R_PINKY: 18, L_INDEX: 19, R_INDEX: 20,
  L_HIP: 23, R_HIP: 24, L_KNEE: 25, R_KNEE: 26, L_ANK: 27, R_ANK: 28, L_FOOT: 31, R_FOOT: 32,
};

export const AVATAR_MODELS = {
  male: "/models/boxer_male.glb",
  female: "/models/boxer_female.glb",
};

const GUARD_COLORS = { up: 0x34d399, down: 0xff5a4f, punch: 0xf5c451 };

/** "mixamorig:LeftArm" (sanitized by three.js to "mixamorigLeftArm") → bone. */
function findBone(root, name) {
  let hit = null;
  root.traverse((o) => { if (!hit && o.isBone && o.name.replace(/[^a-z0-9]/gi, "").endsWith(name)) hit = o; });
  return hit;
}

export async function createModelFighter(THREE, { url, look = "you" } = {}) {
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const gltf = await new GLTFLoader().loadAsync(url);
  const model = gltf.scene;
  const group = new THREE.Group();
  group.add(model);
  const ghost = look === "ghost";

  // Materials: keep the textured look for "you"; a cyan see-through skin for the ghost.
  const ghostMat = ghost
    ? new THREE.MeshStandardMaterial({ color: 0x67e8f9, emissive: 0x22d3ee, emissiveIntensity: 0.55, roughness: 0.3, transparent: true, opacity: 0.38, depthWrite: false })
    : null;
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false; // skinned bounds don't follow the pose
    if (ghost) o.material = ghostMat;
    else {
      o.castShadow = true;
      o.receiveShadow = true;
      if (o.material) { o.material.roughness = Math.max(o.material.roughness ?? 0.7, 0.6); o.material.metalness = 0; }
    }
  });

  const B = Object.fromEntries([
    "Hips", "Spine", "Spine1", "Spine2", "Neck", "Head",
    "LeftArm", "LeftForeArm", "LeftHand", "RightArm", "RightForeArm", "RightHand",
    "LeftUpLeg", "LeftLeg", "LeftFoot", "LeftToeBase", "RightUpLeg", "RightLeg", "RightFoot", "RightToeBase",
  ].map((n) => [n, findBone(model, n)]));
  // Optional helpers (Mixamo end bones) for head orientation.
  const headTop = findBone(model, "HeadTopEnd");
  const headFront = findBone(model, "headfront");
  const missing = Object.entries(B).filter(([, b]) => !b).map(([n]) => n);
  if (missing.length) throw new Error(`model is missing bones: ${missing.join(", ")}`);

  // ── Rest pose (captured once) ─────────────────────────────────────────────
  model.updateMatrixWorld(true);
  const wp = (b) => b.getWorldPosition(new THREE.Vector3());
  const wq = (b) => b.getWorldQuaternion(new THREE.Quaternion());
  const rest = {};
  const aim = (bone, child) => { rest[bone] = { q: wq(B[bone]), dir: wp(B[child]).sub(wp(B[bone])).normalize() }; };
  [["LeftArm", "LeftForeArm"], ["LeftForeArm", "LeftHand"], ["RightArm", "RightForeArm"], ["RightForeArm", "RightHand"],
   ["LeftUpLeg", "LeftLeg"], ["LeftLeg", "LeftFoot"], ["LeftFoot", "LeftToeBase"],
   ["RightUpLeg", "RightLeg"], ["RightLeg", "RightFoot"], ["RightFoot", "RightToeBase"],
   ["Neck", "Head"]].forEach(([b, c]) => aim(b, c));

  // Hands: aim along the fingers — the hand's descendant farthest out along the forearm.
  for (const [hand, fore] of [["LeftHand", "LeftForeArm"], ["RightHand", "RightForeArm"]]) {
    const h = wp(B[hand]), along = h.clone().sub(wp(B[fore])).normalize();
    let tip = null, best = 0.02;
    B[hand].traverse((o) => { if (o !== B[hand] && o.isBone) { const d = wp(o).sub(h).dot(along); if (d > best) { best = d; tip = o; } } });
    if (tip) rest[hand] = { q: wq(B[hand]), dir: wp(tip).sub(h).normalize() };
  }

  const basisQ = (right, up, out) => {
    const u = up.clone().normalize();
    const r = right.clone().addScaledVector(u, -right.dot(u)).normalize();
    const f = new THREE.Vector3().crossVectors(r, u).normalize();
    return out.setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, f));
  };
  const hipsRestBasis = basisQ(wp(B.LeftUpLeg).sub(wp(B.RightUpLeg)), wp(B.Spine2).sub(wp(B.Hips)), new THREE.Quaternion());
  const chestRestBasis = basisQ(wp(B.LeftArm).sub(wp(B.RightArm)), wp(B.LeftArm).add(wp(B.RightArm)).multiplyScalar(0.5).sub(wp(B.Hips)), new THREE.Quaternion());
  const spineRestQ = ["Hips", "Spine", "Spine1", "Spine2"].reduce((m, n) => ({ ...m, [n]: wq(B[n]) }), {});
  const legLen = wp(B.LeftUpLeg).distanceTo(wp(B.LeftLeg)) + wp(B.LeftLeg).distanceTo(wp(B.LeftFoot));
  // Head rest frame: up = head → top, forward = head → face (right = up × forward).
  let headRestBasis = null, headRestQ = null;
  if (headTop && headFront) {
    const up0 = wp(headTop).sub(wp(B.Head)), fwd0 = wp(headFront).sub(wp(B.Head));
    if (up0.lengthSq() > 1e-6 && fwd0.lengthSq() > 1e-6) {
      headRestBasis = basisQ(new THREE.Vector3().crossVectors(up0, fwd0), up0, new THREE.Quaternion());
      headRestQ = wq(B.Head);
    }
  }

  // Guard / punch rings at the cuffs (like the procedural fighter). Not on the ghost.
  const rings = ghost ? null : ["Left", "Right"].map(() => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(0.055, 0.007, 10, 32),
      new THREE.MeshBasicMaterial({ color: GUARD_COLORS.up, toneMapped: false }),
    );
    group.add(m);
    return m;
  });

  // ── Per-frame scratch ─────────────────────────────────────────────────────
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), hipMid = new THREE.Vector3(), shMid = new THREE.Vector3();
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qp = new THREE.Quaternion();
  const hipsDelta = new THREE.Quaternion(), chestDelta = new THREE.Quaternion();
  const Z = new THREE.Vector3(0, 0, 1);
  let swap = null; // mirror the left/right landmarks onto the model (decided on the first frame)

  /** Set `bone`'s world rotation to `worldQ` (parents must already be up to date). */
  const setWorldQ = (bone, worldQ) => {
    bone.parent.getWorldQuaternion(qp);
    bone.quaternion.copy(qp.invert().multiply(worldQ));
    bone.updateMatrixWorld(true);
  };
  const aimBone = (name, from, to) => {
    v1.subVectors(to, from);
    if (v1.lengthSq() < 1e-8) return;
    v1.normalize();
    qa.setFromUnitVectors(rest[name].dir, v1).multiply(rest[name].q);
    setWorldQ(B[name], qa);
  };

  function update(pos, { punching = false, guard = null } = {}) {
    // Which landmark side drives the model's left side: the one that keeps the
    // fighter facing the camera (+z). Display coordinates may be mirrored.
    if (swap === null) {
      const right = new THREE.Vector3().subVectors(pos(LM.L_SH), pos(LM.R_SH));
      const sh = new THREE.Vector3().addVectors(pos(LM.L_SH), pos(LM.R_SH)).multiplyScalar(0.5);
      const hp = new THREE.Vector3().addVectors(pos(LM.L_HIP), pos(LM.R_HIP)).multiplyScalar(0.5);
      swap = new THREE.Vector3().crossVectors(right, sh.sub(hp)).dot(Z) < 0;
    }
    const P = (l, r) => pos(swap ? r : l);       // model-left landmark
    const Q = (l, r) => pos(swap ? l : r);       // model-right landmark

    // Hips: position + hip-line/up orientation.
    hipMid.addVectors(P(LM.L_HIP, LM.R_HIP), Q(LM.L_HIP, LM.R_HIP)).multiplyScalar(0.5);
    shMid.addVectors(P(LM.L_SH, LM.R_SH), Q(LM.L_SH, LM.R_SH)).multiplyScalar(0.5);
    const up = v2.subVectors(shMid, hipMid).clone();
    basisQ(v1.subVectors(P(LM.L_HIP, LM.R_HIP), Q(LM.L_HIP, LM.R_HIP)), up, qa);
    hipsDelta.copy(qa).multiply(qb.copy(hipsRestBasis).invert());
    basisQ(v1.subVectors(P(LM.L_SH, LM.R_SH), Q(LM.L_SH, LM.R_SH)), up, qa);
    chestDelta.copy(qa).multiply(qb.copy(chestRestBasis).invert());

    // Lift so the feet stay near the user's floor even if leg lengths differ.
    const userLeg = P(LM.L_HIP, LM.R_HIP).distanceTo(P(LM.L_KNEE, LM.R_KNEE)) + P(LM.L_KNEE, LM.R_KNEE).distanceTo(P(LM.L_ANK, LM.R_ANK));
    const lift = Number.isFinite(userLeg) && userLeg > 0.3 ? legLen - userLeg : 0;
    B.Hips.position.copy(B.Hips.parent.worldToLocal(v1.copy(hipMid).addScaledVector(up.clone().normalize(), Math.max(-0.1, Math.min(0.25, lift)))));
    setWorldQ(B.Hips, qa.copy(hipsDelta).multiply(spineRestQ.Hips));
    // Spine: blend from the hip twist to the shoulder twist.
    [["Spine", 0.34], ["Spine1", 0.67], ["Spine2", 1]].forEach(([n, k]) => {
      qb.copy(hipsDelta).slerp(chestDelta, k);
      setWorldQ(B[n], qa.copy(qb).multiply(spineRestQ[n]));
    });

    // Neck toward the head (ears' midpoint, else nose).
    v2.addVectors(pos(LM.L_EAR), pos(LM.R_EAR)).multiplyScalar(0.5);
    if (!Number.isFinite(v2.x) || v2.distanceTo(shMid) < 0.08) v2.copy(pos(LM.NOSE));
    aimBone("Neck", shMid, v2.clone());

    // Head turns with the face: right = ear → ear, forward = ears → nose.
    if (headRestBasis) {
      const le = P(LM.L_EAR, LM.R_EAR), re = Q(LM.L_EAR, LM.R_EAR), nose = pos(LM.NOSE);
      const right = new THREE.Vector3().subVectors(le, re);
      const face = new THREE.Vector3().subVectors(nose, v1.addVectors(le, re).multiplyScalar(0.5));
      if (right.length() > 0.06 && face.length() > 0.02) {
        const headUp = new THREE.Vector3().crossVectors(face, right);
        basisQ(right, headUp, qa);
        qb.copy(qa).multiply(new THREE.Quaternion().copy(headRestBasis).invert());
        setWorldQ(B.Head, qa.copy(qb).multiply(headRestQ));
      }
    }

    // Arms and legs.
    aimBone("LeftArm", P(LM.L_SH, LM.R_SH), P(LM.L_EL, LM.R_EL));
    aimBone("LeftForeArm", P(LM.L_EL, LM.R_EL), P(LM.L_WR, LM.R_WR));
    aimBone("RightArm", Q(LM.L_SH, LM.R_SH), Q(LM.L_EL, LM.R_EL));
    aimBone("RightForeArm", Q(LM.L_EL, LM.R_EL), Q(LM.L_WR, LM.R_WR));
    // Wrists flex toward the knuckles (middle of index and pinky).
    for (const [hand, W, I, K] of [["LeftHand", P(LM.L_WR, LM.R_WR), P(LM.L_INDEX, LM.R_INDEX), P(LM.L_PINKY, LM.R_PINKY)], ["RightHand", Q(LM.L_WR, LM.R_WR), Q(LM.L_INDEX, LM.R_INDEX), Q(LM.L_PINKY, LM.R_PINKY)]]) {
      if (!rest[hand]) continue;
      const knuckles = v2.addVectors(I, K).multiplyScalar(0.5);
      if (Number.isFinite(knuckles.x) && knuckles.distanceTo(W) > 0.03) aimBone(hand, W, knuckles.clone());
    }
    aimBone("LeftUpLeg", P(LM.L_HIP, LM.R_HIP), P(LM.L_KNEE, LM.R_KNEE));
    aimBone("LeftLeg", P(LM.L_KNEE, LM.R_KNEE), P(LM.L_ANK, LM.R_ANK));
    aimBone("RightUpLeg", Q(LM.L_HIP, LM.R_HIP), Q(LM.L_KNEE, LM.R_KNEE));
    aimBone("RightLeg", Q(LM.L_KNEE, LM.R_KNEE), Q(LM.L_ANK, LM.R_ANK));
    const footOk = (a, f) => Number.isFinite(f.x) && a.distanceTo(f) > 0.04;
    if (footOk(P(LM.L_ANK, LM.R_ANK), P(LM.L_FOOT, LM.R_FOOT))) aimBone("LeftFoot", P(LM.L_ANK, LM.R_ANK), P(LM.L_FOOT, LM.R_FOOT));
    if (footOk(Q(LM.L_ANK, LM.R_ANK), Q(LM.L_FOOT, LM.R_FOOT))) aimBone("RightFoot", Q(LM.L_ANK, LM.R_ANK), Q(LM.L_FOOT, LM.R_FOOT));

    // Rings around the wrists, facing along the forearm. `guard` is keyed by the
    // landmark side, so map it through the same swap.
    if (rings) {
      [["Left", "LeftForeArm", "LeftHand"], ["Right", "RightForeArm", "RightHand"]].forEach(([side, fa, hand], k) => {
        const ring = rings[k];
        const a = wp(B[fa]), h = wp(B[hand]);
        group.worldToLocal(ring.position.copy(h));
        ring.quaternion.setFromUnitVectors(Z, h.sub(a).normalize());
        const lmSide = (side === "Left") !== swap ? "left" : "right";
        const state = punching ? "punch" : guard?.[lmSide] === "up" ? "up" : "down";
        ring.material.color.setHex(GUARD_COLORS[state]);
        ring.scale.setScalar(state === "punch" ? 1.25 : 1);
      });
    }
  }

  function dispose() {
    group.removeFromParent();
    group.traverse((o) => {
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) { m.map?.dispose?.(); m.dispose?.(); }
    });
  }

  return { group, update, dispose };
}

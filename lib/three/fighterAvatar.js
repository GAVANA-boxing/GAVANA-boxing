// A 3D boxer driven by MediaPipe pose landmarks: clay-white body, red gloves,
// black trunks — or a translucent cyan "ghost". Built from simple shapes placed
// between joints every frame, so it follows any pose (the user's own replay, the
// motion-capture ghost) with no rigging. Pass the `three` module in (it is
// loaded lazily by the caller).
//
// update(pos, state): pos(i) → THREE.Vector3 for MediaPipe landmark i (scene
// coordinates, y up); state = { punching: bool, guard: { left, right } }.

const LM = {
  NOSE: 0, L_EAR: 7, R_EAR: 8,
  L_SH: 11, R_SH: 12, L_EL: 13, R_EL: 14, L_WR: 15, R_WR: 16,
  L_HIP: 23, R_HIP: 24, L_KNEE: 25, R_KNEE: 26, L_ANK: 27, R_ANK: 28, L_FOOT: 31, R_FOOT: 32,
};

const COLORS = {
  clay: 0xe7e2dc,
  trunks: 0x141416,
  trim: 0xff3b30,
  glove: 0xe0261c,
  cuff: 0xf5f5f5,
  shoe: 0x1b1b1e,
  ghost: 0x67e8f9,
  guardUp: 0x34d399,
  guardDown: 0xff5a4f,
  punch: 0xf5c451,
};

/** Fresnel "glass" for the ghost: bright rim, see-through middle. */
function ghostMaterial(THREE) {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(COLORS.ghost) } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 color; varying vec3 vN; varying vec3 vV;
      void main() {
        float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        gl_FragColor = vec4(color * (0.35 + 1.2 * rim), 0.18 + 0.7 * rim);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function createFighterAvatar(THREE, { look = "you" } = {}) {
  const ghost = look === "ghost";
  const group = new THREE.Group();
  const disposables = [];
  const track = (x) => { disposables.push(x); return x; };

  const ghostMat = ghost ? track(ghostMaterial(THREE)) : null;
  const std = (color, { rough = 0.55, metal = 0, clear = 0 } = {}) => {
    if (ghost) return ghostMat;
    return track(clear
      ? new THREE.MeshPhysicalMaterial({ color, roughness: rough, metalness: metal, clearcoat: clear, clearcoatRoughness: 0.25 })
      : new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal }));
  };
  const M = {
    clay: std(COLORS.clay, { rough: 0.62 }),
    arm: std(COLORS.clay, { rough: 0.62 }),   // own instance: glows while punching
    trunks: std(COLORS.trunks, { rough: 0.45 }),
    trim: std(COLORS.trim, { rough: 0.4 }),
    glove: std(COLORS.glove, { rough: 0.32, clear: 0.6 }),
    cuff: std(COLORS.cuff, { rough: 0.5 }),
    shoe: std(COLORS.shoe, { rough: 0.5 }),
  };

  const G = {
    cyl: track(new THREE.CylinderGeometry(1, 1, 1, 18, 1, true)),
    sphere: track(new THREE.SphereGeometry(1, 24, 16)),
  };

  const mesh = (geo, mat) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = !ghost;
    m.receiveShadow = !ghost;
    group.add(m);
    return m;
  };

  // ── Limbs: tapered tubes with a ball at each joint (reads as one smooth capsule)
  const LIMBS = [
    // [from, to, rFrom, rTo, material]
    [LM.L_SH, LM.L_EL, 0.056, 0.044, "arm"], [LM.L_EL, LM.L_WR, 0.044, 0.034, "arm"],
    [LM.R_SH, LM.R_EL, 0.056, 0.044, "arm"], [LM.R_EL, LM.R_WR, 0.044, 0.034, "arm"],
    [LM.L_KNEE, LM.L_ANK, 0.066, 0.042, "clay"], [LM.R_KNEE, LM.R_ANK, 0.066, 0.042, "clay"],
  ];
  const limbs = LIMBS.map(([a, b, ra, rb, mat]) => {
    const geo = track(new THREE.CylinderGeometry(rb, ra, 1, 18, 1, true)); // top = b end
    return { a, b, m: mesh(geo, M[mat]), arm: a <= 16 };
  });
  // Thighs: trunks over the top half, clay below.
  const thighs = [[LM.L_HIP, LM.L_KNEE], [LM.R_HIP, LM.R_KNEE]].map(([a, b]) => ({
    a, b,
    top: mesh(track(new THREE.CylinderGeometry(0.08, 0.092, 1, 18, 1, true)), M.trunks),
    low: mesh(track(new THREE.CylinderGeometry(0.066, 0.078, 1, 18, 1, true)), M.clay),
  }));
  const ball = (r, mat) => { const m = mesh(G.sphere, mat); m.scale.setScalar(r); return m; };
  const joints = [
    [LM.L_SH, 0.072, "arm"], [LM.R_SH, 0.072, "arm"],
    [LM.L_EL, 0.045, "arm"], [LM.R_EL, 0.045, "arm"],
    [LM.L_KNEE, 0.068, "clay"], [LM.R_KNEE, 0.068, "clay"],
    [LM.L_ANK, 0.043, "clay"], [LM.R_ANK, 0.043, "clay"],
  ].map(([i, r, mat]) => ({ i, m: ball(r, M[mat]) }));

  // ── Torso, trunks, neck, head
  const torso = new THREE.Object3D(); group.add(torso);   // orientation carrier
  const chest = mesh(G.sphere, M.clay);
  const abdomen = mesh(G.sphere, M.clay);
  const pelvis = mesh(G.sphere, M.trunks);
  const waistband = mesh(track(new THREE.CylinderGeometry(1, 1, 1, 28, 1, true)), M.trim);
  const neck = mesh(G.cyl, M.clay);
  const head = mesh(G.sphere, M.clay);

  // ── Gloves: padded fist + thumb + white cuff, along the forearm
  const makeGlove = () => {
    const g = new THREE.Group();
    const fist = new THREE.Mesh(G.sphere, M.glove); fist.scale.set(0.066, 0.088, 0.072); fist.position.y = 0.06;
    const thumb = new THREE.Mesh(G.sphere, M.glove); thumb.scale.set(0.026, 0.05, 0.03); thumb.position.set(0.05, 0.035, 0.03);
    const cuff = new THREE.Mesh(track(new THREE.CylinderGeometry(0.047, 0.05, 0.05, 20)), M.cuff); cuff.position.y = -0.005;
    for (const p of [fist, thumb, cuff]) { p.castShadow = !ghost; g.add(p); }
    // State halo (guard up / hand down / punch) — not on the ghost.
    let halo = null;
    if (!ghost) {
      halo = new THREE.Mesh(track(new THREE.TorusGeometry(0.058, 0.009, 10, 32)), track(new THREE.MeshBasicMaterial({ color: COLORS.guardUp, transparent: true, opacity: 0.95, toneMapped: false })));
      halo.rotation.x = Math.PI / 2; halo.position.y = -0.03;
      g.add(halo);
    }
    group.add(g);
    return { g, halo };
  };
  const gloves = { left: makeGlove(), right: makeGlove() };

  // ── Shoes
  const shoes = [[LM.L_ANK, LM.L_FOOT], [LM.R_ANK, LM.R_FOOT]].map(([a, b]) => ({ a, b, m: mesh(G.sphere, M.shoe) }));

  // Scratch vectors
  const Y = new THREE.Vector3(0, 1, 0);
  const A = new THREE.Vector3(), B = new THREE.Vector3(), D = new THREE.Vector3(), C = new THREE.Vector3();
  const sMid = new THREE.Vector3(), hMid = new THREE.Vector3(), up = new THREE.Vector3(), right = new THREE.Vector3(), fwd = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  const black = new THREE.Color(0x000000);
  const gold = new THREE.Color(COLORS.punch), guardUp = new THREE.Color(COLORS.guardUp), guardDown = new THREE.Color(COLORS.guardDown);

  /** Place a unit-height Y-axis mesh between a and b. */
  const between = (m, a, b) => {
    D.subVectors(b, a);
    const len = D.length() || 1e-4;
    m.position.copy(a).addScaledVector(D, 0.5);
    m.quaternion.setFromUnitVectors(Y, D.multiplyScalar(1 / len));
    return len;
  };

  function update(pos, { punching = false, guard = null } = {}) {
    for (const l of limbs) {
      const len = between(l.m, pos(l.a), pos(l.b));
      l.m.scale.set(1, len, 1);
    }
    for (const t of thighs) {
      A.copy(pos(t.a)); B.copy(pos(t.b));
      C.lerpVectors(A, B, 0.45);
      t.top.scale.set(1, between(t.top, A, C), 1);
      t.low.scale.set(1, between(t.low, C, B), 1);
    }
    for (const j of joints) j.m.position.copy(pos(j.i));

    // Torso frame: up = hips→shoulders, right = across the shoulders.
    sMid.addVectors(pos(LM.L_SH), pos(LM.R_SH)).multiplyScalar(0.5);
    hMid.addVectors(pos(LM.L_HIP), pos(LM.R_HIP)).multiplyScalar(0.5);
    up.subVectors(sMid, hMid);
    const torsoLen = up.length() || 1e-4;
    up.multiplyScalar(1 / torsoLen);
    right.subVectors(pos(LM.L_SH), pos(LM.R_SH));
    const sw = right.length() || 0.3;
    right.addScaledVector(up, -right.dot(up)).normalize();
    fwd.crossVectors(right, up).normalize();
    basis.makeBasis(right, up, fwd);
    torso.quaternion.setFromRotationMatrix(basis);
    // Chest: broad, sits just under the shoulder line; abdomen: narrower, down to the trunks.
    chest.quaternion.copy(torso.quaternion);
    chest.position.copy(hMid).addScaledVector(up, torsoLen * 0.72);
    chest.scale.set(sw * 0.62, torsoLen * 0.4, sw * 0.36);
    abdomen.quaternion.copy(torso.quaternion);
    abdomen.position.copy(hMid).addScaledVector(up, torsoLen * 0.34);
    abdomen.scale.set(sw * 0.44, torsoLen * 0.42, sw * 0.3);

    const hw = pos(LM.L_HIP).distanceTo(pos(LM.R_HIP)) || 0.22;
    pelvis.quaternion.copy(torso.quaternion);
    pelvis.position.copy(hMid).addScaledVector(up, 0.02);
    pelvis.scale.set(Math.max(hw, sw * 0.62) * 0.8, 0.13, sw * 0.34);
    waistband.quaternion.copy(torso.quaternion);
    waistband.position.copy(hMid).addScaledVector(up, 0.1);
    waistband.scale.set(Math.max(hw, sw * 0.62) * 0.78, 0.034, sw * 0.32);

    // Head between the ears (falls back to the nose), neck from the shoulders.
    // Must sit above the shoulders: some references (keyframed, mocap) leave ears unset.
    const above = (v) => Number.isFinite(v.x) && D.subVectors(v, sMid).dot(up) > 0.06;
    C.addVectors(pos(LM.L_EAR), pos(LM.R_EAR)).multiplyScalar(0.5);
    if (!above(C)) C.copy(pos(LM.NOSE)).addScaledVector(fwd, -0.06);
    if (!above(C)) C.copy(sMid).addScaledVector(up, 0.22);
    head.position.copy(C);
    head.quaternion.copy(torso.quaternion);
    head.scale.set(0.09, 0.11, 0.1);
    A.copy(sMid).addScaledVector(up, -0.02); B.copy(C).addScaledVector(up, -0.04);
    neck.scale.set(0.056, between(neck, A, B), 0.056);

    // Gloves along each forearm.
    for (const [side, el, wr] of [["left", LM.L_EL, LM.L_WR], ["right", LM.R_EL, LM.R_WR]]) {
      const { g, halo } = gloves[side];
      A.copy(pos(el)); B.copy(pos(wr));
      D.subVectors(B, A).normalize();
      g.position.copy(B);
      g.quaternion.setFromUnitVectors(Y, D);
      if (halo) {
        const state = punching ? "punch" : guard?.[side] === "up" ? "up" : "down";
        halo.material.color.copy(state === "punch" ? gold : state === "up" ? guardUp : guardDown);
        halo.scale.setScalar(state === "punch" ? 1.25 : 1);
      }
    }

    // Shoes from ankle toward the toes.
    for (const s of shoes) {
      A.copy(pos(s.a)); B.copy(pos(s.b));
      if (!Number.isFinite(B.x) || A.distanceTo(B) < 0.02) B.copy(A).addScaledVector(fwd, 0.12);
      const len = between(s.m, A, B);
      s.m.position.lerpVectors(A, B, 0.55);
      s.m.scale.set(0.045, Math.max(len, 0.1) * 0.75, 0.05);
    }

    // Arms glow a little during a punch (not on the ghost).
    if (!ghost) {
      M.arm.emissive.copy(punching ? gold : black);
      M.arm.emissiveIntensity = punching ? 0.22 : 0;
    }
  }

  function dispose() {
    group.removeFromParent();
    for (const d of disposables) d.dispose?.();
  }

  return { group, update, dispose };
}

/** A round ring mat with soft falloff, as a canvas texture (no image files). */
export function createRingFloor(THREE, { radius = 1.6 } = {}) {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(46,46,52,1)");
  grad.addColorStop(0.62, "rgba(26,26,30,1)");
  grad.addColorStop(1, "rgba(10,10,12,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  g.strokeStyle = "rgba(255,59,48,0.55)";
  g.lineWidth = 4;
  g.beginPath(); g.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.08)";
  g.lineWidth = 2;
  g.beginPath(); g.arc(size / 2, size / 2, size * 0.2, 0, Math.PI * 2); g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.9 });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), mat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  return floor;
}

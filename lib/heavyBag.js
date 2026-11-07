// Heavy bag — physics for the virtual bag (cannon-es) and the round stats.
//
// The bag hangs from a ceiling anchor by a ball joint, like a real 35 kg bag on
// a chain. Each detected punch becomes an impulse at the point it lands: a jab
// is light and straight, a cross heavier, a hook comes from the side, an
// uppercut from below; faster snaps hit harder. Pure apart from cannon-es, so
// it runs (and is unit-tested) in Node.

import * as CANNON from "cannon-es";

export const BAG = Object.freeze({
  mass: 35,        // kg
  radius: 0.18,    // m
  height: 1.1,     // m
  chain: 0.55,     // m from anchor to the top of the bag
  anchorY: 2.6,    // m
});

// N·s before the snap bonus — a real cross into a heavy bag is roughly 20–35 N·s.
const BASE = { jab: 18, cross: 30, hook: 28, uppercut: 24, punch: 20 };

/**
 * Impulse for one punch, in bag space. The viewer stands at +z facing the bag,
 * so punches push toward -z. `lead` is the side of the fighter's lead hand on
 * screen (mirror view): orthodox lead = left = -x.
 * @returns {{ impulse: {x,y,z}, point: {x,y,z}, power: number }} power 0..100 for the HUD
 */
export function punchImpulse({ type = "punch", hand = null, snapVelocity = null } = {}, stance = "orthodox") {
  const leadHand = stance === "southpaw" ? "right" : "left";
  const isLead = hand ? hand === leadHand : type === "jab" || type === "hook";
  const side = (hand ? hand === "left" : (stance === "southpaw") !== isLead) ? -1 : 1; // -1 = screen left
  const snap = Number.isFinite(snapVelocity) ? Math.max(0, Math.min(1, snapVelocity / 0.6)) : 0.5;
  const mag = (BASE[type] ?? BASE.punch) * (0.75 + 0.6 * snap);

  let dir, point;
  if (type === "hook") {
    dir = { x: -side * 0.85, y: 0.05, z: -0.5 };           // swings across the bag
    point = { x: side * BAG.radius, y: 0.25, z: 0.05 };
  } else if (type === "uppercut") {
    dir = { x: 0, y: 0.75, z: -0.65 };
    point = { x: side * 0.06, y: -0.2, z: BAG.radius };
  } else {
    dir = { x: -side * 0.08, y: 0, z: -1 };
    point = { x: side * 0.07, y: type === "jab" ? 0.3 : 0.22, z: BAG.radius };
  }
  const n = Math.hypot(dir.x, dir.y, dir.z);
  return {
    impulse: { x: (dir.x / n) * mag, y: (dir.y / n) * mag, z: (dir.z / n) * mag },
    point,
    power: Math.round(Math.min(100, (mag / (BASE.cross * 1.35)) * 100)),
  };
}

/** A physics world with the bag hanging at rest. */
export function createBagWorld() {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
  const anchor = new CANNON.Body({ mass: 0, position: new CANNON.Vec3(0, BAG.anchorY, 0) });
  const bag = new CANNON.Body({
    mass: BAG.mass,
    position: new CANNON.Vec3(0, BAG.anchorY - BAG.chain - BAG.height / 2, 0),
    shape: new CANNON.Cylinder(BAG.radius, BAG.radius, BAG.height, 16),
    linearDamping: 0.12,
    angularDamping: 0.35,
  });
  world.addBody(anchor);
  world.addBody(bag);
  // Ball joint: bag top (local +y) to the anchor.
  world.addConstraint(new CANNON.PointToPointConstraint(bag, new CANNON.Vec3(0, BAG.height / 2 + BAG.chain, 0), anchor, new CANNON.Vec3(0, 0, 0)));
  return { world, bag, anchor };
}

/** Land a punch on the bag. */
export function hitBag(bagWorld, punch, stance) {
  const { impulse, point, power } = punchImpulse(punch, stance);
  const b = bagWorld.bag;
  const worldPoint = b.pointToWorldFrame(new CANNON.Vec3(point.x, point.y, point.z));
  b.applyImpulse(new CANNON.Vec3(impulse.x, impulse.y, impulse.z), worldPoint.vsub(b.position));
  return { power, point };
}

export function stepBag(bagWorld, dt) {
  bagWorld.world.step(1 / 60, dt, 4);
}

/** How far the bag swings from hanging straight down (degrees). */
export function swingDeg(bagWorld) {
  const b = bagWorld.bag, a = bagWorld.anchor.position;
  const dx = b.position.x - a.x, dy = b.position.y - a.y, dz = b.position.z - a.z;
  return (Math.atan2(Math.hypot(dx, dz), -dy) * 180) / Math.PI;
}

/** Round stats for the HUD and the result. */
export function createBagStats() {
  const s = { punches: 0, power: 0, best: 0, maxSwing: 0, byType: {} };
  return {
    add(type, power) {
      s.punches += 1;
      s.power += power;
      s.best = Math.max(s.best, power);
      s.byType[type] = (s.byType[type] || 0) + 1;
    },
    swing(deg) { s.maxSwing = Math.max(s.maxSwing, deg); },
    summary(seconds) {
      return {
        punches: s.punches,
        avgPower: s.punches ? Math.round(s.power / s.punches) : 0,
        bestPower: s.best,
        maxSwingDeg: Math.round(s.maxSwing),
        perMinute: seconds > 0 ? Math.round((s.punches / seconds) * 60) : 0,
        byType: { ...s.byType },
      };
    },
  };
}

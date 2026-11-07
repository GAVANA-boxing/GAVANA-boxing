"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createBagWorld, hitBag, stepBag, swingDeg, BAG } from "@/lib/heavyBag";
import { bagShader, lightShaftShader, MAX_HITS } from "@/lib/three/shaders";
import { createRingFloor } from "@/lib/three/fighterAvatar";

// The heavy bag in 3D — React Three Fiber for the scene, cannon-es for the
// physics (lib/heavyBag.js), a GLSL shader for the leather, dents and impact
// ripples (lib/three/shaders.js), and the bag mesh modelled in Blender
// (public/models/heavy-bag.glb, from tools/blender/heavy_bag.py) when it loads.
//
// `controlRef.current.hit(punch)` lands a punch; `onHit({ power, type })` and
// `onSwing(deg)` report back. Tapping the left / right half of the bag throws a
// jab / cross with that hand.

const MODEL_URL = "/models/heavy-bag.glb";
const GYM_URL = "/models/gym.glb";
// Lamp positions in the Blender gym (tools/blender/gym.py): two over the ring, one over the bag.
const LAMPS = [[-1.4, 4.0, -5.6], [1.4, 4.0, -5.6], [0, 4.0, 0.2]];

function Bag({ stance, controlRef, onHit, onSwing }) {
  const physics = useMemo(() => createBagWorld(), []);
  const bagRef = useRef(null);
  const chainRef = useRef(null);
  const slot = useRef(0);
  const timeRef = useRef(0);
  const swingTick = useRef(0);

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: bagShader.vertexShader,
    fragmentShader: bagShader.fragmentShader,
    uniforms: {
      uHits: { value: Array.from({ length: MAX_HITS }, () => new THREE.Vector4(0, 0, 0, -1)) },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#8f1d1a") },
      uLightDir: { value: new THREE.Vector3(0.4, 1, 0.8).normalize() },
      uRingColor: { value: new THREE.Color("#ff6a3d") },
    },
  }), []);

  // Procedural bag first; swap in the Blender model's geometry if it loads.
  const [geometry, setGeometry] = useState(() => new THREE.CylinderGeometry(BAG.radius, BAG.radius, BAG.height, 48, 28));
  const [straps, setStraps] = useState(null);
  useEffect(() => {
    let alive = true;
    import("three/examples/jsm/loaders/GLTFLoader.js").then(({ GLTFLoader }) => {
      new GLTFLoader().load(MODEL_URL, (gltf) => {
        if (!alive) return;
        let mesh = null, strapMesh = null;
        gltf.scene.traverse((o) => {
          if (!o.isMesh) return;
          const n = o.name.toLowerCase();
          if (!mesh && n.includes("bag")) mesh = o;
          if (!strapMesh && n.includes("strap")) strapMesh = o;
        });
        if (mesh) setGeometry(mesh.geometry.clone());
        if (strapMesh) setStraps(strapMesh.geometry.clone());
      }, undefined, () => { /* keep the procedural bag */ });
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const land = (punch) => {
    const { power, point } = hitBag(physics, punch, stance);
    const u = material.uniforms.uHits.value[slot.current % MAX_HITS];
    u.set(point.x, point.y, point.z, timeRef.current);
    slot.current += 1;
    onHit?.({ power, type: punch.type || "punch" });
  };
  useEffect(() => { if (controlRef) controlRef.current = { hit: land }; });

  const anchorV = useMemo(() => new THREE.Vector3(0, BAG.anchorY, 0), []);
  const topV = useMemo(() => new THREE.Vector3(), []);
  const mid = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame((_, dt) => {
    const step = Math.min(dt, 1 / 20);
    timeRef.current += step;
    material.uniforms.uTime.value = timeRef.current;
    stepBag(physics, step);
    const b = physics.bag;
    if (bagRef.current) {
      bagRef.current.position.set(b.position.x, b.position.y, b.position.z);
      bagRef.current.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
    }
    // Chain: from the anchor to the top of the bag.
    if (chainRef.current && bagRef.current) {
      topV.set(0, BAG.height / 2, 0).applyQuaternion(bagRef.current.quaternion).add(bagRef.current.position);
      mid.copy(anchorV).add(topV).multiplyScalar(0.5);
      chainRef.current.position.copy(mid);
      chainRef.current.scale.set(1, anchorV.distanceTo(topV), 1);
      chainRef.current.quaternion.setFromUnitVectors(up, topV.clone().sub(anchorV).normalize().negate());
    }
    swingTick.current += step;
    if (onSwing && swingTick.current > 0.1) { swingTick.current = 0; onSwing(swingDeg(physics)); }
  });

  const onPointerDown = (e) => {
    e.stopPropagation();
    // Screen left half of the bag = the fighter's left hand (mirror view).
    const local = bagRef.current.worldToLocal(e.point.clone());
    const hand = local.x < 0 ? "left" : "right";
    const lead = stance === "southpaw" ? "right" : "left";
    land({ type: hand === lead ? "jab" : "cross", hand, snapVelocity: 0.4 });
  };

  return (
    <group>
      <mesh position={[0, BAG.anchorY + 0.05, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.5]} />
        <meshStandardMaterial color="#2a2a30" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh ref={chainRef}>
        <cylinderGeometry args={[0.012, 0.012, 1, 8]} />
        <meshStandardMaterial color="#b9b9c2" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh ref={bagRef} geometry={geometry} material={material} castShadow onPointerDown={onPointerDown}>
        {straps && (
          <mesh geometry={straps}>
            <meshStandardMaterial color="#1b1b1f" roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
        )}
      </mesh>
    </group>
  );
}

function Floor() {
  const floor = useMemo(() => createRingFloor(THREE, { radius: 2.4 }), []);
  return <primitive object={floor} position={[0, 0.002, 0]} />;
}

/** The boxing gym modelled in Blender (ring, ropes, windows, bag rack, lamps). */
function Gym({ shadows }) {
  const [scene, setScene] = useState(null);
  useEffect(() => {
    let alive = true;
    import("three/examples/jsm/loaders/GLTFLoader.js").then(({ GLTFLoader }) => {
      new GLTFLoader().load(GYM_URL, (gltf) => {
        if (!alive) return;
        gltf.scene.traverse((o) => {
          if (!o.isMesh) return;
          o.receiveShadow = shadows;
          o.castShadow = shadows && !/^(Floor|BackWall|LeftWall|Window)/.test(o.name);
        });
        setScene(gltf.scene);
      }, undefined, () => { /* no gym — the bag still works on its own */ });
    }).catch(() => {});
    return () => { alive = false; };
  }, [shadows]);
  return scene ? <primitive object={scene} /> : null;
}

/** Lamp beams through dusty air (GLSL, additive) and slowly drifting dust. */
function Atmosphere({ dust = 1 }) {
  const shaftMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: lightShaftShader.vertexShader,
    fragmentShader: lightShaftShader.fragmentShader,
    uniforms: { uColor: { value: new THREE.Color("#ffd9a0") }, uStrength: { value: 0.16 }, uTime: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }), []);
  const count = Math.round(500 * dust);
  const dustGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const [lx, , lz] = LAMPS[i % LAMPS.length];
      const r = Math.random() * 1.1, a = Math.random() * Math.PI * 2;
      p.set([lx + Math.cos(a) * r, Math.random() * 4, lz + Math.sin(a) * r], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, [count]);
  const dustRef = useRef(null);
  useFrame((state, dt) => {
    shaftMat.uniforms.uTime.value = state.clock.elapsedTime;
    const a = dustGeo.attributes.position;
    for (let i = 0; i < a.count; i++) {
      let y = a.getY(i) + dt * 0.05;
      if (y > 4) y = 0;
      a.setY(i, y);
      a.setX(i, a.getX(i) + Math.sin(state.clock.elapsedTime * 0.3 + i) * dt * 0.02);
    }
    a.needsUpdate = true;
  });
  return (
    <group>
      {LAMPS.map(([x, y, z], i) => (
        <group key={i}>
          <mesh position={[x, y / 2, z]} material={shaftMat}>
            <cylinderGeometry args={[0.12, 1.25, y, 32, 1, true]} />
          </mesh>
          <pointLight position={[x, y - 0.1, z]} intensity={i === 2 ? 6 : 10} distance={7} decay={1.6} color="#ffd9a0" />
        </group>
      ))}
      <points ref={dustRef} geometry={dustGeo}>
        <pointsMaterial color="#ffe7c2" size={0.018} transparent opacity={0.55} depthWrite={false} />
      </points>
    </group>
  );
}

export default function HeavyBagScene({ stance = "orthodox", controlRef, onHit, onSwing, quality, height = "100%" }) {
  return (
    <div data-testid="bag-scene" style={{ width: "100%", height, touchAction: "none" }}>
      <Canvas
        shadows={quality?.shadows !== false}
        dpr={quality?.pixelRatio || [1, 2]}
        gl={{ antialias: quality?.antialias !== false }}
        camera={{ position: [0.55, 1.6, 2.7], fov: 44 }}
        onCreated={({ camera }) => camera.lookAt(0, 1.45, -0.4)}
      >
        <color attach="background" args={["#0d0b0b"]} />
        <fog attach="fog" args={["#0d0b0b", 5, 17]} />
        <hemisphereLight args={["#dfe7ff", "#1a1012", 0.45]} />
        <spotLight position={[0.6, 3.6, 1.4]} angle={0.6} penumbra={0.6} intensity={40} castShadow />
        {/* Cool daylight from the back windows, a red accent from the side. */}
        <directionalLight position={[1, 4, -10]} intensity={0.9} color="#cfe0ff" />
        <directionalLight position={[-3, 1.5, -1]} intensity={0.7} color="#ff3b30" />
        <Gym shadows={quality?.shadows !== false} />
        <Atmosphere dust={quality?.particles ?? 1} />
        <Bag stance={stance} controlRef={controlRef} onHit={onHit} onSwing={onSwing} />
        <Floor />
      </Canvas>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createBagWorld, hitBag, stepBag, swingDeg, BAG } from "@/lib/heavyBag";
import { bagShader, MAX_HITS } from "@/lib/three/shaders";
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
  return <primitive object={floor} position={[0, 0, 0]} />;
}

export default function HeavyBagScene({ stance = "orthodox", controlRef, onHit, onSwing, quality, height = "100%" }) {
  return (
    <div data-testid="bag-scene" style={{ width: "100%", height, touchAction: "none" }}>
      <Canvas
        shadows={quality?.shadows !== false}
        dpr={quality?.pixelRatio || [1, 2]}
        gl={{ antialias: quality?.antialias !== false }}
        camera={{ position: [0.35, 1.55, 2.4], fov: 42 }}
        onCreated={({ camera }) => camera.lookAt(0, 1.45, 0)}
      >
        <color attach="background" args={["#0b0b0d"]} />
        <fog attach="fog" args={["#0b0b0d", 4, 10]} />
        <hemisphereLight args={["#dfe7ff", "#1a1012", 0.6]} />
        <spotLight position={[0.6, 3.6, 1.4]} angle={0.6} penumbra={0.6} intensity={40} castShadow />
        <directionalLight position={[-2, 1.5, -2]} intensity={1.6} color="#ff3b30" />
        <Bag stance={stance} controlRef={controlRef} onHit={onHit} onSwing={onSwing} />
        <Floor />
      </Canvas>
    </div>
  );
}

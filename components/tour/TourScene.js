"use client";

import { useEffect, useRef, useState } from "react";
import { terrainFor, cityLayout, isWater, sunDirection } from "@/lib/worldTour";
import { skyShader, waterShader } from "@/lib/three/shaders";
import { detectRenderCaps, qualityFor } from "@/lib/three/renderCaps";

/**
 * One World Tour city in 3D: procedural terrain, a generated city around the
 * arena, the sun where it is right now in that city, the sky colours for that
 * moment, window lights after dark, and snow / rain particles. Everything
 * comes from lib/worldTour.js; this only builds the three.js scene.
 *
 * props: stop, sky (skyFor), elevation (sun °), hour (local), weather ({ kind })
 */
export default function TourScene({ stop, sky, elevation, hour, weather, height = 340, failText = "", onFail }) {
  const mountRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      let THREE, OrbitControls;
      try {
        THREE = await import("three");
        ({ OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js"));
      } catch { if (!disposed) { setFailed(true); onFail?.(); } return; }
      const quality = qualityFor(await detectRenderCaps().catch(() => ({})));
      const el = mountRef.current;
      if (disposed || !el) return;

      let renderer;
      try { renderer = new THREE.WebGLRenderer({ antialias: quality.antialias }); } catch { setFailed(true); onFail?.(); return; }
      const W = el.clientWidth, H = el.clientHeight;
      renderer.setPixelRatio(quality.pixelRatio);
      renderer.setSize(W, H);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.shadowMap.enabled = quality.shadows;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(sky.sky);
      const cloudiness = weather.kind === "clear" ? 0 : weather.kind === "cloud" ? 0.55 : 0.75;
      const realSun = sunDirection(elevation, hour);
      const sunColor = new THREE.Color(sky.phase === "day" ? "#fff4d6" : "#ffb070");

      // ── Sky dome (GLSL): gradient, sun disc + glow, stars at night ──
      const skyMat = new THREE.ShaderMaterial({
        vertexShader: skyShader.vertexShader,
        fragmentShader: skyShader.fragmentShader,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uSky: { value: new THREE.Color(sky.sky) },
          uHorizon: { value: new THREE.Color(sky.horizon) },
          uGround: { value: new THREE.Color(stop.terrain.ground).multiplyScalar(0.5) },
          uSunDir: { value: new THREE.Vector3(realSun.x, realSun.y, realSun.z) },
          uSunColor: { value: sunColor },
          uNight: { value: sky.windows },
          uCloud: { value: cloudiness },
        },
      });
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), skyMat));
      const fogDense = weather.kind === "cloud" ? 0.014 : weather.kind === "rain" || weather.kind === "snow" ? 0.018 : 0.008;
      scene.fog = new THREE.FogExp2(new THREE.Color(sky.horizon), fogDense);

      const camera = new THREE.PerspectiveCamera(45, W / H, 0.5, 400);
      camera.position.set(38, 30, 46);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 2, 0);
      controls.enableDamping = true;
      controls.autoRotate = true; // turned off below for reduced motion
      controls.autoRotateSpeed = 0.35;
      controls.minDistance = 18;
      controls.maxDistance = 110;
      controls.maxPolarAngle = Math.PI * 0.47;
      if (!quality.motion) controls.autoRotate = false;

      // ── Light: sky/ground fill + the real sun (or a cool moon at night) ──
      scene.add(new THREE.HemisphereLight(new THREE.Color(sky.sky), new THREE.Color(stop.terrain.ground), sky.ambient * 1.6));
      const dir = sunDirection(Math.max(elevation, 4), hour);
      const sun = new THREE.DirectionalLight(sky.phase === "night" ? 0x9fb4ff : 0xfff1dc, sky.phase === "night" ? 0.35 : 0.4 + 2.6 * sky.sunLight);
      sun.position.set(dir.x * 120, Math.max(dir.y, 0.15) * 120, dir.z * 120);
      sun.castShadow = sky.sunLight > 0.05;
      sun.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
      Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 10, far: 300 });
      scene.add(sun);

      // ── Terrain ──
      const height = terrainFor(stop);
      const SIZE = 200, SEG = 120;
      const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      const colors = new Float32Array(pos.count * 3);
      const ground = new THREE.Color(stop.terrain.ground), rock = new THREE.Color("#5b5550"), snowC = new THREE.Color("#f4f6fb"), waterC = new THREE.Color("#2b5a7a");
      const snowy = weather.kind === "snow" || weather.season === "winter" && stop.lat > 35;
      const c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const wet = isWater(stop, x, z);
        const h = wet ? -0.4 : height(x, z);
        pos.setY(i, h);
        if (wet) c.copy(waterC);
        else {
          c.copy(ground).lerp(rock, Math.min(1, h / 14));
          if (snowy && h > 2) c.lerp(snowC, Math.min(1, (h - 2) / 6));
          else if (h > 16) c.lerp(snowC, Math.min(1, (h - 16) / 6));
          if (snowy && h <= 2) c.lerp(snowC, 0.55);
        }
        colors.set([c.r, c.g, c.b], i * 3);
      }
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true }));
      terrain.receiveShadow = true;
      scene.add(terrain);

      // ── Water (GLSL): one plane just under street level shows wherever the
      // terrain dips for the river / coast; waves, sky reflection, sun glint ──
      let waterMat = null;
      if (stop.city.water) {
        waterMat = new THREE.ShaderMaterial({
          vertexShader: waterShader.vertexShader,
          fragmentShader: waterShader.fragmentShader,
          transparent: true,
          uniforms: {
            uTime: { value: 0 },
            uDeep: { value: new THREE.Color("#173a52").multiplyScalar(0.35 + 0.65 * (1 - sky.windows)) },
            uSky: { value: new THREE.Color(sky.horizon) },
            uSunDir: { value: new THREE.Vector3(realSun.x, realSun.y, realSun.z) },
            uSunColor: { value: sunColor },
          },
        });
        const water = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE, 1, 1), waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.y = -0.15;
        scene.add(water);
      }

      // ── City: one instanced mesh, windows glow after dark ──
      const blocks = cityLayout(stop);
      const box = new THREE.BoxGeometry(1, 1, 1);
      box.translate(0, 0.5, 0);
      const mat = new THREE.MeshStandardMaterial({
        roughness: 0.8, metalness: 0.05,
        emissive: new THREE.Color(stop.city.neon ? "#ff4fd8" : "#ffc46b"),
        emissiveIntensity: (stop.city.neon ? 0.14 : 0.22) * sky.windows,
      });
      const city = new THREE.InstancedMesh(box, mat, blocks.length);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
      blocks.forEach((b, i) => {
        m4.compose(v.set(b.x, height(b.x, b.z), b.z), q, s.set(b.w, b.h, b.d));
        city.setMatrixAt(i, m4);
        city.setColorAt(i, c.set(b.color).multiplyScalar(snowy ? 1.05 : 1));
      });
      city.castShadow = true;
      city.receiveShadow = true;
      scene.add(city);

      // ── The arena in the middle: a lit dome over a red ring ──
      const arena = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.6, 1.2, 40), new THREE.MeshStandardMaterial({ color: "#1c1c22", roughness: 0.6 }));
      base.position.y = 0.6;
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(5, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: "#2a2a33", roughness: 0.35, metalness: 0.4, emissive: new THREE.Color("#ff3b30"), emissiveIntensity: 0.12 + 0.5 * sky.windows }),
      );
      dome.scale.y = 0.55;
      dome.position.y = 1.2;
      const halo = new THREE.Mesh(new THREE.TorusGeometry(5.3, 0.12, 8, 64), new THREE.MeshBasicMaterial({ color: "#ff3b30" }));
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 1.25;
      arena.add(base, dome, halo);
      arena.traverse((o) => { o.castShadow = true; });
      scene.add(arena);
      const glow = new THREE.PointLight(0xff3b30, 30 * (0.2 + sky.windows), 40, 2);
      glow.position.set(0, 6, 0);
      scene.add(glow);

      // ── Weather ──
      let particles = null, speed = 0;
      if (weather.kind === "snow" || weather.kind === "rain") {
        const N = Math.round((weather.kind === "snow" ? 2200 : 2600) * quality.particles);
        const p = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) p.set([(Math.random() - 0.5) * 120, Math.random() * 60, (Math.random() - 0.5) * 120], i * 3);
        const pg = new THREE.BufferGeometry();
        pg.setAttribute("position", new THREE.BufferAttribute(p, 3));
        particles = new THREE.Points(pg, new THREE.PointsMaterial({
          color: weather.kind === "snow" ? 0xffffff : 0x9fc4ff, size: weather.kind === "snow" ? 0.45 : 0.18,
          transparent: true, opacity: weather.kind === "snow" ? 0.9 : 0.55, depthWrite: false,
        }));
        speed = weather.kind === "snow" ? 3 : 28;
        scene.add(particles);
      }

      let raf, last = performance.now();
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (waterMat) waterMat.uniforms.uTime.value = now / 1000;
        if (particles) {
          const a = particles.geometry.attributes.position;
          for (let i = 0; i < a.count; i++) {
            let y = a.getY(i) - speed * dt;
            if (y < 0) y += 60;
            a.setY(i, y);
            if (weather.kind === "snow") a.setX(i, a.getX(i) + Math.sin(now / 900 + i) * 0.01);
          }
          a.needsUpdate = true;
        }
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      const onResize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        controls.dispose();
        scene.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();
    return () => { disposed = true; cleanup(); };
  }, [stop, sky, elevation, hour, weather]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={mountRef} data-testid="tour-scene" style={{ position: "relative", width: "100%", height, borderRadius: 22, overflow: "hidden", background: sky.sky, touchAction: "none" }}>
      {failed && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "rgba(255,255,255,0.7)", fontSize: 13, padding: 20, textAlign: "center" }}>
          {failText}
        </div>
      )}
    </div>
  );
}

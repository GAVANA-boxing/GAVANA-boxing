// Hand-written GLSL for the 3D scenes (three.js ShaderMaterial, WebGL2).
//
// bag   — leather heavy bag that dents and sends a red ripple out from each hit
// sky   — sky dome: colour gradient, sun disc + glow, stars at night
// water — river / sea: moving waves, sky reflection (Fresnel) and a sun glint

export const MAX_HITS = 4;

// ── Heavy bag ────────────────────────────────────────────────────────────
// uHits[i] = (local hit point xyz, time of hit in seconds); w < 0 = unused slot.
export const bagShader = {
  vertexShader: /* glsl */ `
    uniform vec4 uHits[${MAX_HITS}];
    uniform float uTime;
    varying vec3 vNormalW;
    varying vec3 vPosL;
    varying vec3 vPosW;
    void main() {
      vec3 p = position;
      for (int i = 0; i < ${MAX_HITS}; i++) {
        vec4 h = uHits[i];
        if (h.w < 0.0) continue;
        float age = uTime - h.w;
        if (age < 0.0 || age > 1.2) continue;
        float d = distance(p, h.xyz);
        // A dent that springs back: deep at first, gone in ~0.4 s.
        float dent = 0.035 * exp(-age * 9.0) * exp(-d * d * 55.0);
        p -= normal * dent;
      }
      vPosL = p;
      vec4 world = modelMatrix * vec4(p, 1.0);
      vPosW = world.xyz;
      vNormalW = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec4 uHits[${MAX_HITS}];
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uLightDir;
    uniform vec3 uRingColor;
    varying vec3 vNormalW;
    varying vec3 vPosL;
    varying vec3 vPosW;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
    }
    void main() {
      vec3 n = normalize(vNormalW);
      vec3 v = normalize(cameraPosition - vPosW);
      // Leather: grain noise + horizontal seams.
      float ang = atan(vPosL.z, vPosL.x);
      float grain = noise(vec2(ang * 24.0, vPosL.y * 60.0)) * 0.08;
      float seam = smoothstep(0.012, 0.0, abs(fract(vPosL.y * 3.2 + 0.5) - 0.5) - 0.47);
      vec3 base = uColor * (0.92 + grain) * (1.0 - 0.25 * seam);
      float diff = max(dot(n, normalize(uLightDir)), 0.0);
      float spec = pow(max(dot(reflect(-normalize(uLightDir), n), v), 0.0), 24.0) * 0.35;
      float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.35;
      vec3 col = base * (0.28 + 0.85 * diff) + vec3(spec) + uRingColor * rim * 0.4;
      // Impact ripples.
      for (int i = 0; i < ${MAX_HITS}; i++) {
        vec4 h = uHits[i];
        if (h.w < 0.0) continue;
        float age = uTime - h.w;
        if (age < 0.0 || age > 1.2) continue;
        float d = distance(vPosL, h.xyz);
        float radius = age * 0.55;
        float ring = smoothstep(0.03, 0.0, abs(d - radius)) * exp(-age * 3.5);
        float flash = exp(-d * 30.0) * exp(-age * 10.0);
        col += uRingColor * (ring * 1.6 + flash * 2.0);
      }
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

// ── Sky dome ─────────────────────────────────────────────────────────────
export const skyShader = {
  vertexShader: /* glsl */ `
    varying vec3 vDir;
    void main() {
      vDir = normalize(position);
      vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_Position = p.xyww; // always at the far plane
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uSky;
    uniform vec3 uHorizon;
    uniform vec3 uGround;
    uniform vec3 uSunDir;
    uniform vec3 uSunColor;
    uniform float uNight;   // 0 day … 1 night
    uniform float uCloud;   // 0 clear … 1 overcast
    varying vec3 vDir;
    float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
    void main() {
      vec3 d = normalize(vDir);
      float h = d.y;
      vec3 col = h > 0.0 ? mix(uHorizon, uSky, pow(clamp(h, 0.0, 1.0), 0.55)) : mix(uHorizon, uGround, clamp(-h * 4.0, 0.0, 1.0));
      // Sun: a crisp disc and a wide glow (dimmer when cloudy, gone at night).
      float s = max(dot(d, normalize(uSunDir)), 0.0);
      float sunUp = smoothstep(-0.05, 0.05, uSunDir.y);
      col += uSunColor * (pow(s, 900.0) * 6.0 + pow(s, 12.0) * 0.35) * sunUp * (1.0 - 0.8 * uCloud);
      // Stars above the horizon at night.
      if (h > 0.05 && uNight > 0.0) {
        vec3 cell = floor(d * 220.0);
        float star = step(0.9975, hash(cell)) * (0.6 + 0.4 * hash(cell + 1.0));
        col += vec3(star) * uNight * smoothstep(0.05, 0.3, h) * (1.0 - uCloud);
      }
      col = mix(col, vec3(dot(col, vec3(0.333))) * 0.9 + uHorizon * 0.1, uCloud * 0.55);
      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }
  `,
};

// ── Water ────────────────────────────────────────────────────────────────
export const waterShader = {
  vertexShader: /* glsl */ `
    varying vec3 vPosW;
    void main() {
      vec4 w = modelMatrix * vec4(position, 1.0);
      vPosW = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform vec3 uDeep;
    uniform vec3 uSky;
    uniform vec3 uSunDir;
    uniform vec3 uSunColor;
    varying vec3 vPosW;
    void main() {
      vec2 p = vPosW.xz;
      // Sum of travelling waves → a surface normal.
      float t = uTime;
      vec2 g = vec2(0.0);
      g += vec2(0.8, 0.6) * cos(dot(p, vec2(0.8, 0.6)) * 1.3 + t * 1.6) * 0.12;
      g += vec2(-0.5, 0.9) * cos(dot(p, vec2(-0.5, 0.9)) * 2.1 + t * 2.3) * 0.07;
      g += vec2(0.3, -1.0) * cos(dot(p, vec2(0.3, -1.0)) * 3.7 + t * 3.1) * 0.04;
      vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
      vec3 v = normalize(cameraPosition - vPosW);
      float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
      vec3 col = mix(uDeep, uSky, fres);
      vec3 r = reflect(-normalize(uSunDir), n);
      col += uSunColor * pow(max(dot(r, v), 0.0), 120.0) * 1.5 * smoothstep(0.0, 0.1, uSunDir.y);
      gl_FragColor = vec4(col, 0.92);
      #include <colorspace_fragment>
    }
  `,
};

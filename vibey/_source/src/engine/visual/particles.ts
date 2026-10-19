// Stateless GPU particles: every position is a function of a per-instance seed and time, so nothing
// is updated on the CPU and long sessions cannot accumulate state.

import { NOISE } from "./shaders";
import { Program, type GL } from "./gl";

const MAX = 6000;

const HEADER = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec4 aSeed;
uniform float uTime;
uniform vec2 uRes;
uniform vec4 uCover;       // image uv = screen uv * xy + zw
uniform sampler2D uBase;
uniform sampler2D uMapsA;
uniform sampler2D uMapsC;
uniform float uHasMaps;
uniform vec2 uWind;
uniform float uAmount;
uniform vec2 uCam;
uniform float uNearMax;   // < 1 keeps weather outside a window: only far, small particles
out vec2 vLocal;
out float vAlpha;
out float vNear;
out vec2 vSuv;
out vec3 vTint;
${NOISE}
vec2 corner() { return vec2(float(gl_VertexID & 1), float((gl_VertexID >> 1) & 1)); }
vec2 toImage(vec2 s) { return s * uCover.xy + uCover.zw; }
vec4 clipFromScreen(vec2 s) { return vec4(s.x * 2.0 - 1.0, 1.0 - s.y * 2.0, 0.0, 1.0); }
vec3 sceneAt(vec2 s) { return textureLod(uBase, toImage(s), 4.0).rgb; }
`;

const FS_HEADER = /* glsl */ `#version 300 es
precision highp float;
in vec2 vLocal;
in float vAlpha;
in float vNear;
in vec2 vSuv;
in vec3 vTint;
out vec4 outColor;
uniform sampler2D uMapsC;
uniform vec4 uCover;
uniform float uHasMaps;
uniform float uOcclusion;
float hidden() {
  if (uHasMaps < 0.5) return 0.0;
  float scene = texture(uMapsC, vSuv * uCover.xy + uCover.zw).b;
  return smoothstep(-0.02, 0.08, scene - vNear - uOcclusion);
}
`;

export type ParticleKind =
  | "rain"
  | "snow"
  | "petals"
  | "maple"
  | "embers"
  | "dust"
  | "fireflies"
  | "splashes"
  | "marine"
  | "headlights"
  | "stars"
  | "streaks";

interface KindDef {
  vs: string;
  fs: string;
  additive: boolean;
  /** instances at amount 1 for a 1.0 quality density */
  base: number;
}

const KINDS: Record<ParticleKind, KindDef> = {
  rain: {
    base: 2600,
    additive: false,
    vs: /* glsl */ `
uniform float uSpeed;
void main() {
  vec2 c = corner();
  float z = aSeed.z;
  float near = (1.0 - z) * uNearMax;
  float speed = mix(0.5, 2.3, near * near) * uSpeed;
  float t = aSeed.y + uTime * speed;
  float cycle = floor(t);
  float y = fract(t) * 1.25 - 0.12;
  float slant = uWind.x * 0.32;
  float x = fract(aSeed.x + hash(vec2(cycle, aSeed.w)) * 0.37 + slant * y);
  vec2 center = vec2(x, y);
  vec2 dir = normalize(vec2(slant * uRes.x, uRes.y));
  vec2 perp = vec2(-dir.y, dir.x);
  float lenPx = mix(16.0, 118.0, near * near) * (uRes.y / 1080.0) * (0.7 + 0.6 * aSeed.w);
  float widPx = max(1.0, mix(1.0, 2.3, near) * (uRes.y / 1080.0));
  vec2 px = center * uRes + dir * (c.y - 0.5) * lenPx + perp * (c.x - 0.5) * widPx * 3.0;
  vec2 s = px / uRes;
  vSuv = s;
  vLocal = c;
  vNear = near * 0.9;
  vec3 sc = sceneAt(center);
  float lit = clamp(luma(sc) * 1.6, 0.0, 1.0);
  vTint = mix(vec3(0.75, 0.8, 0.85), sc * 1.4 + 0.25, 0.55);
  vAlpha = min(0.9, uAmount * mix(0.26, 0.75, near) * (0.5 + 0.9 * lit)) * step(z, uAmount * 1.1 + 0.05);
  gl_Position = clipFromScreen(s);
}`,
    fs: /* glsl */ `
void main() {
  float across = 1.0 - abs(vLocal.x - 0.5) * 2.0;
  float along = smoothstep(0.0, 0.25, vLocal.y) * smoothstep(1.0, 0.6, vLocal.y);
  float a = pow(across, 1.6) * along * vAlpha * (1.0 - hidden());
  outColor = vec4(vTint * a, a);
}`,
  },
  snow: {
    base: 1700,
    additive: false,
    vs: /* glsl */ `
uniform float uSpeed;
void main() {
  vec2 c = corner();
  float z = aSeed.z;
  float near = (1.0 - z) * uNearMax;
  float fall = mix(0.025, 0.11, near) * uSpeed;
  float t = aSeed.y + uTime * fall;
  float cycle = floor(t);
  float y = fract(t) * 1.2 - 0.1;
  float wob = sin(uTime * (0.5 + aSeed.w) + aSeed.x * 40.0) * 0.012 * (0.4 + near);
  float x = fract(aSeed.x + hash(vec2(cycle, aSeed.w)) * 0.21 + uWind.x * 0.18 * y + wob);
  float size = max(1.2, mix(2.6, 16.0, pow(near, 2.0)) * (uRes.y / 1080.0) * (0.75 + 0.5 * aSeed.w));
  vec2 px = vec2(x, y) * uRes + (c - 0.5) * size * 2.0;
  vSuv = px / uRes;
  vLocal = c;
  vNear = near * 0.92;
  vec3 sc = sceneAt(vec2(x, y));
  vTint = mix(vec3(0.97, 0.98, 1.0), vec3(0.56, 0.6, 0.66), smoothstep(0.55, 0.92, luma(sc)));
  vAlpha = uAmount * mix(0.6, 0.9, near) * mix(1.0, 0.5, smoothstep(0.75, 1.0, near)) * step(z, uAmount * 1.05 + 0.05);
  gl_Position = clipFromScreen(vSuv);
}`,
    fs: /* glsl */ `
void main() {
  float d = length(vLocal - 0.5) * 2.0;
  float soft = mix(0.5, 0.95, smoothstep(0.75, 1.0, vNear));
  float a = (1.0 - smoothstep(1.0 - soft, 1.0, d)) * vAlpha * (1.0 - hidden());
  outColor = vec4(vTint * a, a);
}`,
  },
  petals: {
    base: 220,
    additive: false,
    vs: /* glsl */ `
uniform float uSpeed;
out float vTurn;
void main() {
  vec2 c = corner();
  float near = (1.0 - aSeed.z) * uNearMax;
  float fall = mix(0.018, 0.06, near) * uSpeed;
  float t = aSeed.y + uTime * fall;
  float cycle = floor(t);
  float y = fract(t) * 1.25 - 0.12;
  float drift = sin(uTime * (0.35 + 0.3 * aSeed.w) + aSeed.x * 31.0) * 0.05;
  float x = fract(aSeed.x + hash(vec2(cycle, 3.0)) * 0.3 + uWind.x * 0.25 * y + drift * near);
  float size = mix(8.0, 30.0, near * near) * (uRes.y / 1080.0) * (0.8 + 0.4 * aSeed.w);
  float ang = uTime * (0.6 + aSeed.w) + aSeed.x * 12.0;
  float flip = cos(uTime * (1.1 + aSeed.z) + aSeed.y * 9.0);
  vTurn = flip;
  vec2 q = (c - 0.5) * vec2(size * 0.62 * (0.25 + 0.75 * abs(flip)), size);
  q = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * q;
  vec2 px = vec2(x, y) * uRes + q * 1.6;
  vSuv = px / uRes;
  vLocal = c;
  vNear = near * 0.9;
  vec3 sc = sceneAt(vec2(x, y));
  vTint = mix(vec3(1.0, 0.85, 0.9), vec3(1.0, 0.94, 0.95), aSeed.w) * (0.55 + 0.75 * luma(sc) + 0.2);
  vAlpha = uAmount * mix(0.6, 0.95, near) * step(aSeed.z, uAmount + 0.1);
  gl_Position = clipFromScreen(vSuv);
}`,
    fs: /* glsl */ `
in float vTurn;
void main() {
  vec2 p = (vLocal - 0.5) * 2.0;
  float body = 1.0 - smoothstep(0.82, 1.0, length(p * vec2(1.0, 0.92)));
  float notch = smoothstep(0.12, 0.22, length(p - vec2(0.0, -0.98)));
  float shade = 0.82 + 0.18 * p.y + 0.12 * vTurn;
  float a = body * notch * vAlpha * (1.0 - hidden());
  outColor = vec4(vTint * shade * a, a);
}`,
  },
  maple: {
    base: 170,
    additive: false,
    vs: /* glsl */ `
uniform float uSpeed;
out float vTurn;
void main() {
  vec2 c = corner();
  float near = (1.0 - aSeed.z) * uNearMax;
  float fall = mix(0.03, 0.08, near) * uSpeed;
  float t = aSeed.y + uTime * fall;
  float cycle = floor(t);
  float y = fract(t) * 1.25 - 0.12;
  float drift = sin(uTime * (0.4 + 0.3 * aSeed.w) + aSeed.x * 27.0) * 0.06;
  float x = fract(aSeed.x + hash(vec2(cycle, 5.0)) * 0.3 + uWind.x * 0.3 * y + drift * near);
  float size = mix(9.0, 34.0, near * near) * (uRes.y / 1080.0) * (0.8 + 0.4 * aSeed.w);
  float ang = uTime * (0.9 + aSeed.w) + aSeed.x * 12.0;
  float flip = cos(uTime * (1.3 + aSeed.z) + aSeed.y * 9.0);
  vTurn = flip;
  vec2 q = (c - 0.5) * vec2(size * (0.2 + 0.8 * abs(flip)), size);
  q = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * q;
  vec2 px = vec2(x, y) * uRes + q * 1.6;
  vSuv = px / uRes;
  vLocal = c;
  vNear = near * 0.9;
  vec3 sc = sceneAt(vec2(x, y));
  vec3 leaf = mix(vec3(0.85, 0.22, 0.08), vec3(0.95, 0.55, 0.12), aSeed.w);
  vTint = leaf * (0.45 + 0.8 * luma(sc) + 0.15);
  vAlpha = uAmount * mix(0.7, 0.95, near) * step(aSeed.z, uAmount + 0.1);
  gl_Position = clipFromScreen(vSuv);
}`,
    fs: /* glsl */ `
in float vTurn;
void main() {
  vec2 p = (vLocal - 0.5) * 2.0;
  float r = length(p);
  float ang = atan(p.y, p.x);
  float lobes = 0.62 + 0.3 * pow(abs(cos(ang * 2.5)), 0.6);
  float a = (1.0 - smoothstep(lobes - 0.08, lobes, r)) * vAlpha * (1.0 - hidden());
  float vein = 1.0 - 0.25 * smoothstep(0.06, 0.0, abs(p.x)) * step(0.0, p.y);
  outColor = vec4(vTint * (0.85 + 0.15 * vTurn) * vein * a, a);
}`,
  },
  embers: {
    base: 90,
    additive: true,
    vs: /* glsl */ `
uniform vec4 uEmitter; // screen rect x,y,w,h
void main() {
  vec2 c = corner();
  float life = fract(aSeed.y + uTime * (0.16 + 0.12 * aSeed.w));
  float cycle = floor(aSeed.y + uTime * (0.16 + 0.12 * aSeed.w));
  vec2 start = uEmitter.xy + vec2(hash(vec2(cycle, aSeed.x)) * uEmitter.z, uEmitter.w);
  float rise = life * (0.18 + 0.12 * aSeed.z);
  float sway = (vnoise(vec2(life * 6.0 + aSeed.x * 9.0, cycle)) - 0.5) * 0.06 * life;
  vec2 pos = start + vec2(sway, -rise);
  float size = (2.2 + 2.0 * aSeed.z) * (uRes.y / 1080.0);
  vec2 px = pos * uRes + (c - 0.5) * size * 3.0;
  vSuv = px / uRes;
  vLocal = c;
  vNear = 0.0;
  vTint = mix(vec3(1.0, 0.55, 0.15), vec3(1.0, 0.25, 0.05), life);
  float flick = 0.6 + 0.4 * vnoise(vec2(uTime * 9.0, aSeed.x * 40.0));
  vAlpha = uAmount * smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.55, 1.0, life)) * flick * step(aSeed.z, uAmount);
  gl_Position = clipFromScreen(vSuv);
}`,
    fs: /* glsl */ `
void main() {
  float d = length(vLocal - 0.5) * 2.0;
  float a = exp(-d * d * 5.0) * vAlpha;
  outColor = vec4(vTint * a, a);
}`,
  },
  dust: {
    base: 260,
    additive: true,
    vs: /* glsl */ `
void main() {
  vec2 c = corner();
  float near = 1.0 - aSeed.z;
  vec2 p = aSeed.xy + vec2(vnoise(vec2(uTime * 0.035, aSeed.w * 30.0)) - 0.5, vnoise(vec2(aSeed.w * 30.0, uTime * 0.03)) - 0.5) * 0.12;
  p.y = fract(p.y + uTime * 0.0035 * (0.5 + aSeed.w));
  p.x = fract(p.x + uWind.x * uTime * 0.002);
  float size = max(1.0, mix(1.4, 5.0, near * near) * (uRes.y / 1080.0));
  vec2 px = p * uRes + (c - 0.5) * size * 3.0;
  vSuv = px / uRes;
  vLocal = c;
  vNear = near * 0.8;
  vec3 sc = sceneAt(p);
  float lit = smoothstep(0.35, 0.8, luma(sc));
  vTint = sc * 0.6 + 0.6;
  float glint = 0.4 + 0.6 * vnoise(vec2(uTime * 1.7, aSeed.x * 77.0));
  vAlpha = uAmount * lit * glint * 0.75 * step(aSeed.z, uAmount + 0.15);
  gl_Position = clipFromScreen(vSuv);
}`,
    fs: /* glsl */ `
void main() {
  float d = length(vLocal - 0.5) * 2.0;
  float a = exp(-d * d * 6.0) * vAlpha * (1.0 - hidden());
  outColor = vec4(vTint * a, a);
}`,
  },
  fireflies: {
    base: 60,
    additive: true,
    vs: /* glsl */ `
void main() {
  vec2 c = corner();
  float near = 1.0 - aSeed.z;
  vec2 home = vec2(aSeed.x, mix(0.55, 0.97, aSeed.y));
  vec2 p = home + vec2(vnoise(vec2(uTime * 0.09, aSeed.w * 20.0)) - 0.5, vnoise(vec2(aSeed.w * 20.0, uTime * 0.07)) - 0.5) * 0.09;
  float size = mix(3.0, 9.0, near) * (uRes.y / 1080.0);
  vec2 px = p * uRes + (c - 0.5) * size * 4.0;
  vSuv = px / uRes;
  vLocal = c;
  vNear = near * 0.85;
  vTint = vec3(0.78, 1.0, 0.38);
  float pulse = pow(max(0.0, sin(uTime * (0.9 + aSeed.w) + aSeed.x * 50.0)), 3.0);
  vAlpha = uAmount * pulse * step(aSeed.z, uAmount + 0.05);
  gl_Position = clipFromScreen(vSuv);
}`,
    fs: /* glsl */ `
void main() {
  float d = length(vLocal - 0.5) * 2.0;
  float a = (exp(-d * d * 14.0) + 0.25 * exp(-d * d * 3.0)) * vAlpha * (1.0 - hidden());
  outColor = vec4(vTint * a, a);
}`,
  },
  splashes: {
    base: 260,
    additive: true,
    vs: /* glsl */ `
uniform float uSpeed;
void main() {
  vec2 c = corner();
  float rate = 2.4 * uSpeed;
  float life = fract(aSeed.y + uTime * rate * (0.8 + 0.4 * aSeed.w));
  float cycle = floor(aSeed.y + uTime * rate * (0.8 + 0.4 * aSeed.w));
  vec2 p = vec2(hash(vec2(cycle, aSeed.x * 91.0)), mix(0.45, 1.0, hash(vec2(aSeed.z * 17.0, cycle))));
  vec2 ip = toImage(p);
  vec4 C = textureLod(uMapsC, ip, 0.0);
  float wet = max(C.r, textureLod(uMapsA, ip, 0.0).g) * (1.0 - C.g);
  float near = C.b;
  float size = mix(3.0, 26.0, near * near) * (uRes.y / 1080.0) * (0.6 + 0.8 * life);
  vec2 px = p * uRes + (c - 0.5) * vec2(size, size * mix(0.22, 0.45, near)) * 2.0;
  vSuv = px / uRes;
  vLocal = c;
  vNear = 0.0;
  vec3 sc = sceneAt(p);
  vTint = sc * 0.8 + 0.25;
  vAlpha = uAmount * step(0.45, wet) * (1.0 - life) * 0.7 * step(aSeed.z, uAmount + 0.1);
  gl_Position = clipFromScreen(vSuv);
}`,
    fs: /* glsl */ `
void main() {
  float d = length(vLocal - 0.5) * 2.0;
  float ring = smoothstep(0.62, 0.8, d) * (1.0 - smoothstep(0.82, 1.0, d));
  float a = ring * vAlpha;
  outColor = vec4(vTint * a, a);
}`,
  },
  marine: {
    base: 700,
    additive: true,
    vs: /* glsl */ `
void main() {
  vec2 c = corner();
  float near = 1.0 - aSeed.z;
  vec2 p = aSeed.xy + uCam * near * 0.6;
  p += vec2(vnoise(vec2(uTime * 0.05, aSeed.w * 13.0)) - 0.5, vnoise(vec2(aSeed.w * 13.0, uTime * 0.04)) - 0.5) * 0.08;
  p.y = fract(p.y - uTime * 0.004 * (0.3 + aSeed.w));
  p.x = fract(p.x + uTime * 0.0025 * near);
  float size = mix(1.2, 9.0, pow(near, 3.0)) * (uRes.y / 1080.0);
  vec2 px = p * uRes + (c - 0.5) * size * 3.0;
  vSuv = px / uRes;
  vLocal = c;
  vNear = 0.0;
  vec3 sc = sceneAt(p);
  vTint = sc * 0.9 + vec3(0.35, 0.5, 0.55);
  vAlpha = uAmount * mix(0.28, 0.12, near) * step(aSeed.z, uAmount + 0.1);
  gl_Position = clipFromScreen(vSuv);
}`,
    fs: /* glsl */ `
void main() {
  float d = length(vLocal - 0.5) * 2.0;
  float a = exp(-d * d * 4.5) * vAlpha;
  outColor = vec4(vTint * a, a);
}`,
  },
  headlights: {
    base: 26,
    additive: true,
    vs: /* glsl */ `
uniform vec2 uRoad; // screen y range
void main() {
  vec2 c = corner();
  float dirSign = aSeed.w > 0.5 ? 1.0 : -1.0;
  float speed = mix(0.035, 0.09, aSeed.z);
  float t = aSeed.x + uTime * speed;
  float cycle = floor(t);
  float x = dirSign > 0.0 ? fract(t) * 1.4 - 0.2 : 1.2 - fract(t) * 1.4;
  float y = mix(uRoad.x, uRoad.y, hash(vec2(cycle, aSeed.y * 13.0)));
  float on = step(0.42, hash(vec2(cycle * 1.7, aSeed.y)));
  float size = mix(28.0, 70.0, aSeed.y) * (uRes.y / 1080.0);
  vec2 px = vec2(x, y) * uRes + (c - 0.5) * size * 2.0;
  vSuv = px / uRes;
  vLocal = c;
  vNear = 0.0;
  vTint = dirSign > 0.0 ? vec3(1.0, 0.9, 0.72) : vec3(1.0, 0.22, 0.14);
  vAlpha = uAmount * on * 0.3 * smoothstep(-0.2, 0.05, x) * smoothstep(1.2, 0.95, x);
  gl_Position = clipFromScreen(vSuv);
}`,
    fs: /* glsl */ `
void main() {
  float d = length(vLocal - 0.5) * 2.0;
  float disc = 1.0 - smoothstep(0.82, 1.0, d);
  float a = disc * (0.75 + 0.25 * smoothstep(0.5, 0.95, d)) * vAlpha;
  outColor = vec4(vTint * a, a);
}`,
  },
  stars: {
    base: 900,
    additive: true,
    vs: /* glsl */ `
void main() {
  vec2 c = corner();
  float layer = floor(aSeed.z * 3.0);
  float depth = 0.25 + layer * 0.35;
  vec2 p = fract(aSeed.xy + uCam * depth * 2.0 + vec2(uTime * 0.0006 * depth, 0.0));
  float size = max(1.0, mix(1.2, 3.2, pow(aSeed.w, 6.0)) * (uRes.y / 1080.0));
  vec2 px = p * uRes + (c - 0.5) * size * 3.0;
  vSuv = px / uRes;
  vLocal = c;
  vNear = 0.0;
  float temp = aSeed.w;
  vTint = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.88, 0.75), smoothstep(0.4, 1.0, fract(temp * 7.3)));
  float tw = 0.65 + 0.35 * sin(uTime * (1.5 + aSeed.x * 3.0) + aSeed.y * 40.0);
  vAlpha = uAmount * (0.25 + 0.75 * pow(aSeed.w, 4.0)) * tw;
  gl_Position = clipFromScreen(vSuv);
}`,
    fs: /* glsl */ `
void main() {
  float d = length(vLocal - 0.5) * 2.0;
  float a = exp(-d * d * 9.0) * vAlpha;
  outColor = vec4(vTint * a, a);
}`,
  },
  // one-off streaks (meteors, aircraft lights), driven by uniforms from the event scheduler
  streaks: {
    base: 2,
    additive: true,
    vs: /* glsl */ `
uniform vec4 uStreakA; // x, y, dx, dy (screen)
uniform vec4 uStreakB; // progress 0..1, brightness, kind (0 meteor, 1 aircraft), length
void main() {
  vec2 c = corner();
  vec4 S = uStreakA;
  vec4 P = uStreakB;
  if (gl_InstanceID > 0 || P.y <= 0.0) { gl_Position = vec4(2.0, 2.0, 0.0, 1.0); return; }
  vec2 head = S.xy + S.zw * P.x;
  vec2 dir = normalize(S.zw * uRes);
  vec2 perp = vec2(-dir.y, dir.x);
  float len = P.z < 0.5 ? P.w * uRes.y : 6.0;
  float wid = (P.z < 0.5 ? 2.4 : 6.0) * (uRes.y / 1080.0);
  vec2 px = head * uRes - dir * (1.0 - c.y) * len + perp * (c.x - 0.5) * wid * 3.0;
  vSuv = px / uRes;
  vLocal = c;
  vNear = 0.0;
  float blink = P.z < 0.5 ? 1.0 : step(0.86, fract(uTime * 0.9));
  vTint = P.z < 0.5 ? vec3(0.85, 0.92, 1.0) : mix(vec3(1.0, 0.25, 0.2), vec3(1.0), blink);
  vAlpha = P.y * (P.z < 0.5 ? 1.0 : 0.35 + 0.65 * blink);
  gl_Position = clipFromScreen(vSuv);
}`,
    fs: /* glsl */ `
void main() {
  float across = 1.0 - abs(vLocal.x - 0.5) * 2.0;
  float a = pow(across, 3.0) * pow(vLocal.y, 2.2) * vAlpha;
  outColor = vec4(vTint * a, a);
}`,
  },
};

export interface ParticleUniforms {
  nearMax: number;
  time: number;
  res: [number, number];
  cover: [number, number, number, number];
  wind: [number, number];
  cam: [number, number];
  hasMaps: boolean;
  occlusion: number;
  base: WebGLTexture;
  mapsA: WebGLTexture;
  mapsC: WebGLTexture;
}

export class Particles {
  private readonly programs = new Map<ParticleKind, Program>();
  private readonly vao: WebGLVertexArrayObject;
  private readonly buffer: WebGLBuffer;

  constructor(private readonly gl: GL) {
    const seeds = new Float32Array(MAX * 4);
    let s = 1234567;
    const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < seeds.length; i++) seeds[i] = rnd();
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    if (!vao || !buffer) throw new Error("Could not create particle buffers");
    this.vao = vao;
    this.buffer = buffer;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(0, 1);
    gl.bindVertexArray(null);
  }

  private program(kind: ParticleKind) {
    let p = this.programs.get(kind);
    if (!p) {
      const def = KINDS[kind];
      p = new Program(this.gl, HEADER + def.vs, FS_HEADER + def.fs, `particles:${kind}`);
      this.programs.set(kind, p);
    }
    return p;
  }

  /** Draw one kind. `density` scales the instance count for the quality tier. */
  draw(kind: ParticleKind, amount: number, density: number, u: ParticleUniforms, extra?: (p: Program) => void) {
    if (amount <= 0.001) return;
    const gl = this.gl;
    const def = KINDS[kind];
    const count = Math.min(MAX, Math.max(1, Math.round(def.base * density * Math.min(1, amount + 0.15))));
    const p = this.program(kind).use();
    p.f("uTime", u.time)
      .f("uRes", u.res[0], u.res[1])
      .f("uCover", ...u.cover)
      .f("uWind", u.wind[0], u.wind[1])
      .f("uCam", u.cam[0], u.cam[1])
      .f("uAmount", amount)
      .f("uHasMaps", u.hasMaps ? 1 : 0)
      .f("uOcclusion", u.occlusion)
      .f("uNearMax", u.nearMax)
      .tex("uBase", 0, u.base)
      .tex("uMapsA", 1, u.mapsA)
      .tex("uMapsC", 2, u.mapsC);
    extra?.(p);
    gl.enable(gl.BLEND);
    if (def.additive) gl.blendFunc(gl.ONE, gl.ONE);
    else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(this.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
  }

  dispose() {
    for (const p of this.programs.values()) p.dispose();
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteVertexArray(this.vao);
  }
}

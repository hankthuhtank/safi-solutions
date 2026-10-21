// GLSL sources. The scene composite is assembled from feature flags so each place only pays for
// the effects it uses.

export const NOISE = /* glsl */ `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s;
}
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
`;

export type SceneFlags = {
  maps: boolean;
  clouds: boolean;
  water: boolean;
  sway: boolean;
  fog: boolean;
  flash: boolean;
  stars: boolean;
  aurora: boolean;
  caustics: boolean;
  lamps: boolean;
  neon: boolean;
  fire: boolean;
  night: boolean;
  twinkle: boolean;
};

export function flagKey(f: SceneFlags) {
  return Object.entries(f)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join("+");
}

export function compositeFS(f: SceneFlags) {
  const defs = Object.entries(f)
    .filter(([, v]) => v)
    .map(([k]) => `#define ${k.toUpperCase()}`)
    .join("\n");
  return /* glsl */ `#version 300 es
precision highp float;
${defs}
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uBase;
uniform sampler2D uMapsA; // sky, water, foliage
uniform sampler2D uMapsB; // glass, lights, fire
uniform sampler2D uMapsC; // ground, people, depth (1 = near)
uniform sampler2D uMapsD; // tree bend, grass, per-light flicker phase
uniform sampler2D uFireTex;
uniform vec4 uCover;      // image uv = screen uv * xy + zw
uniform vec2 uRes;
uniform float uImgAspect;
uniform float uTime;
uniform vec2 uCam;
uniform float uParallax;
uniform vec2 uWind;       // direction * strength
uniform vec2 uWaterFlow;
uniform float uStorm;
uniform float uClouds, uWater, uSway, uFog, uFogLow, uStars, uAurora, uCaustics, uLamps, uNeon, uFire, uFireGlow, uFireMode, uMist, uWet;
uniform vec3 uFogColor;
uniform float uFlash, uFlashX;
uniform vec3 uFlashColor;
uniform vec4 uFireRect;
uniform float uExposure, uWarmth;
uniform float uNight, uGlow, uInterior, uWindows, uTwinkle;
uniform vec2 uGlowAt;
${NOISE}

vec3 base(vec2 uv) { return texture(uBase, uv).rgb; }

#ifdef CLOUDS
vec3 skyFlow(vec2 iuv) {
  const float T = 26.0;
  float drive = max(uClouds, uMist * 0.7);
  vec2 flow = uWind * drive * 0.0011;
  float n = vnoise(iuv * 2.5) * 0.7;
  float p0 = fract(uTime / T + n);
  float p1 = fract(uTime / T + n + 0.5);
  vec2 warp = (vec2(vnoise(iuv * 3.5 + uTime * 0.018), vnoise(iuv * 3.5 + 9.1 - uTime * 0.015)) - 0.5) * 0.0035 * drive;
  vec2 u0 = iuv - flow * (p0 - 0.5) * T + warp;
  vec2 u1 = iuv - flow * (p1 - 0.5) * T + warp;
  vec3 still = base(iuv);
  vec4 a0 = texture(uMapsA, u0), a1 = texture(uMapsA, u1);
  vec3 c0 = mix(still, base(u0), smoothstep(0.4, 0.85, max(a0.r, a0.g * uMist)));
  vec3 c1 = mix(still, base(u1), smoothstep(0.4, 0.85, max(a1.r, a1.g * uMist)));
  return mix(c0, c1, abs(p0 - 0.5) * 2.0);
}
#endif

#ifdef WATER
vec2 ripple(vec2 iuv, float near) {
  float persp = mix(0.16, 1.0, near);
  vec2 p = vec2(iuv.x * uImgAspect * 48.0, iuv.y * 155.0) / persp;
  float breeze = 0.5 + length(uWind);
  float a = sin(p.y + p.x * 0.12 - uTime * (1.1 + breeze));
  float b = sin(p.y * 1.73 - p.x * 0.21 - uTime * (1.7 + breeze));
  float fine = vnoise(p * 0.65 + vec2(uTime * 0.3, -uTime * 0.7)) - 0.5;
  return vec2((a * 0.16 + fine * 0.35) / uImgAspect, a * 0.55 + b * 0.25 + fine * 0.4) * 0.0032 * persp * uWater;
}

// Two offset copies crossfade before either wraps. Only sample water, so the current never
// drags a bank, rock or building into the river and its loop has no visible reset.
vec3 flowingWater(vec2 uv, vec3 still, float mask) {
  const float period = 8.0;
  float phase = fract(uTime / period);
  vec2 flow = uWaterFlow * uWater;
  vec2 a = uv - flow * (phase - 0.5) * period;
  vec2 b = uv - flow * (fract(phase + 0.5) - 0.5) * period;
  float ma = smoothstep(0.55, 0.95, texture(uMapsA, a).g);
  float mb = smoothstep(0.55, 0.95, texture(uMapsA, b).g);
  vec3 ca = mix(still, base(a), ma);
  vec3 cb = mix(still, base(b), mb);
  return mix(still, mix(ca, cb, abs(phase - 0.5) * 2.0), mask);
}
#endif

#ifdef SWAY
// Wind in the trees. maps-d.r says how far a pixel swings when its tree bends: 0 at the roots, 1 at
// the top of a tall crown, and a little beyond the crown so the silhouette moves, not only the
// texture inside it. Each crown sways as one piece, a slow pendulum with its own rhythm, and leans
// further downwind as gust fronts roll across the picture, then springs back.
float gustAt(vec2 iuv, vec2 wdir, float ws) {
  float along = dot(iuv * vec2(uImgAspect, 1.0), wdir);
  return smoothstep(0.25, 0.8, vnoise(vec2(along * 1.6 - uTime * (0.14 + 0.3 * ws), 3.7)));
}
vec2 sway(vec2 iuv, float bend, vec2 wdir, float ws, float gust) {
  float ph = vnoise(iuv * vec2(2.6, 1.4)) * 6.2832 + iuv.x * 1.5;
  float f = 0.28 + 0.14 * vnoise(iuv * 2.1 + 9.0);
  float osc = sin(uTime * 6.2832 * f + ph) + 0.3 * sin(uTime * 6.2832 * f * 2.13 + ph * 1.7);
  // big limbs answer faster than the trunk and out of step with it, more so in the gusts
  float fb = 0.85 + 0.5 * vnoise(iuv * 5.0 + 3.0);
  float limb = sin(uTime * 6.2832 * fb + vnoise(iuv * vec2(7.0, 5.0)) * 6.2832) * (0.12 + 0.3 * gust) * ws;
  float lean = (0.15 + 0.85 * gust) * (0.3 + 0.9 * ws);
  float push = (lean * 0.9 + osc * (0.3 + 0.45 * gust) + limb * smoothstep(0.15, 0.6, bend)) * bend;
  // a bending top also dips a little; content moves downwind, so sample upwind
  return -vec2(wdir.x * push, abs(push) * 0.1) * 0.0032 * uSway;
}
#endif

#ifdef CAUSTICS
float worleyEdge(vec2 p, float t) {
  vec2 i = floor(p), fr = fract(p);
  float f1 = 8.0, f2 = 8.0;
  for (int y = -1; y <= 1; y++)
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = 0.5 + 0.42 * sin(t + 6.2831 * hash2(i + g));
      float d = length(g + o - fr);
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
    }
  return f2 - f1;
}
float caustic(vec2 p, float t) {
  // warp the cells so the light ripples in threads instead of forming a rigid net
  p += vec2(vnoise(p * 0.65 + t * 0.14), vnoise(p * 0.65 - t * 0.11 + 7.3)) * 0.95;
  float e1 = worleyEdge(p, t);
  float e2 = worleyEdge(p * 1.62 + 3.1, t * 1.21 + 2.0);
  return pow(clamp(1.0 - e1 * 3.3, 0.0, 1.0), 6.0) * 0.62 + pow(clamp(1.0 - e2 * 3.8, 0.0, 1.0), 7.0) * 0.38;
}
#endif

#ifdef AURORA
// The photograph's own aurora, set moving: the curtains drift and ripple and bright rays travel
// along them, the way a real display pulses. Nothing is painted over the sky.
vec3 livingAurora(vec2 iuv, vec3 col, float skyish) {
  vec3 bg = textureLod(uBase, iuv, 5.0).rgb;
  float green = col.g - max(col.r, col.b) * 0.92;
  float violet = min(col.r, col.b) - col.g * 0.85;
  float chroma = max(green, 0.0) + max(violet, 0.0) * 0.7;
  float glow = luma(col) - luma(bg) * 0.55;
  float m = smoothstep(0.012, 0.08, chroma) * smoothstep(0.0, 0.08, glow) * skyish;
  if (m < 0.002) return col;
  float t = uTime;
  vec2 w = vec2(fbm(vec2(iuv.x * 3.1 + t * 0.028, iuv.y * 2.2)) - 0.5, fbm(vec2(iuv.x * 2.3 - t * 0.022, iuv.y * 3.4 + 5.0)) - 0.5);
  vec3 moved = base(iuv + w * 0.011 * uAurora);
  float rays = 0.72 + 0.56 * fbm(vec2(iuv.x * 16.0 - t * 0.16, iuv.y * 1.3 + t * 0.025));
  float wave = 0.86 + 0.28 * sin(iuv.x * 8.5 - t * 0.32 + fbm(iuv * 2.6 + t * 0.01) * 5.0);
  vec3 lit = moved * mix(1.0, rays * wave, uAurora);
  return mix(col, lit, m);
}
#endif

void main() {
  vec2 suv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 iuv = suv * uCover.xy + uCover.zw;
#ifdef MAPS
  vec4 C = texture(uMapsC, iuv);
  float near = C.b;
  iuv += uCam * (near - 0.45) * uParallax;
  C = texture(uMapsC, iuv);
  near = C.b;
  vec4 A = texture(uMapsA, iuv);
  vec4 B = texture(uMapsB, iuv);
  vec4 D = texture(uMapsD, iuv);
  float still = C.g; // people never wobble
#else
  float near = 0.5;
  vec4 A = vec4(0.0), B = vec4(0.0), D = vec4(0.0);
  float still = 0.0;
  iuv += uCam * 0.05 * uParallax;
#endif
#ifdef CAUSTICS
  iuv += vec2(sin(iuv.y * 31.0 + uTime * 1.1), cos(iuv.x * 27.0 + uTime * 0.9)) * 0.0007 * uCaustics;
#endif
  vec2 duv = vec2(0.0);
#ifdef WATER
  float waterM = smoothstep(0.25, 0.9, A.g) * (1.0 - uMist) * (1.0 - still);
  float wetM = max(waterM, C.r * uWet / max(uWater, 0.001));
  vec2 rip = ripple(iuv, near) * wetM * (1.0 - still);
  float bank = mix(1.0, smoothstep(0.25, 0.85, texture(uMapsA, iuv + rip).g), waterM);
  duv += rip * bank;
#endif
#ifdef SWAY
  float ws = length(uWind);
  vec2 wdir = ws > 0.001 ? uWind / ws : vec2(1.0, 0.0);
  float gust = gustAt(iuv, wdir, ws);
  duv += sway(iuv, D.r, wdir, ws, gust) * (1.0 - still) * (1.0 - A.g);
  // wind over grass: waves run downwind, bending the blades so they show their paler side
  float gw = vnoise(vec2(dot(iuv * vec2(uImgAspect, 1.0), wdir) * 9.0 - uTime * (0.7 + 1.3 * ws), iuv.y * 6.0));
  duv -= wdir * (gw - 0.5) * 0.0007 * D.g * uSway;
#endif
  vec3 col = base(iuv + duv);
#ifdef SWAY
  col *= 1.0 + (gw - 0.5) * 0.11 * D.g * ws * (0.3 + near);
  // leaves turning in the wind: a faint, quick shimmer on the foliage
  float lf = vnoise(iuv * vec2(uImgAspect, 1.0) * 170.0 + vec2(uTime * 2.6, -uTime * 1.9)) - 0.5;
  col *= 1.0 + lf * 0.06 * A.b * smoothstep(0.02, 0.2, D.r) * ws * (0.4 + gust);
#endif
#ifdef CLOUDS
  float skyM = smoothstep(0.35, 0.8, max(A.r, A.g * uMist));
  if (skyM > 0.001) col = mix(col, skyFlow(iuv), skyM);
#endif
#ifdef WATER
  if (dot(uWaterFlow, uWaterFlow) > 0.0 && waterM > 0.001) col = flowingWater(iuv + duv, col, waterM);
  col *= 1.0 + (vnoise(iuv * vec2(260.0, 900.0) + vec2(uTime * 0.8, 0.0)) - 0.5) * 0.07 * wetM * uWater;
#endif
#ifdef STARS
  float lb = luma(textureLod(uBase, iuv, 2.0).rgb);
  float pt = smoothstep(0.05, 0.22, luma(col) - lb) * smoothstep(0.3, 0.8, A.r + (1.0 - near) * 0.5);
  float tw = vnoise(iuv * uRes / 7.0 + vec2(uTime * 2.2, uTime * 0.7));
  col *= 1.0 + pt * (tw - 0.5) * 1.1 * uStars;
#endif
#ifdef LAMPS
  // every light flickers as a whole, each on its own rhythm (maps-d.b holds one phase per light)
  float lph = D.b * 23.0;
  float fl = vnoise(vec2(uTime * 5.5 + lph * 7.0, lph));
  float fl2 = vnoise(vec2(uTime * 13.0 + lph * 3.0, 5.0 + lph));
  col *= 1.0 + B.g * ((fl - 0.5) * 0.2 + (fl2 - 0.5) * 0.08) * uLamps;
#endif
#ifdef TWINKLE
  // points of light brighter than their surroundings: fairy lights, far windows, lanterns
  float lbT = luma(textureLod(uBase, iuv, 3.0).rgb);
  float lT = luma(col);
  float ptT = smoothstep(0.06, 0.28, lT - lbT) * smoothstep(0.45, 0.85, lT);
  float twk = vnoise(iuv * uRes / 4.0 + vec2(uTime * 2.1, uTime * 0.7));
  col *= 1.0 + ptT * (twk - 0.42) * 1.5 * uTwinkle;
#endif
#ifdef NEON
  float h = D.b;
  float drop = step(0.94, vnoise(vec2(uTime * (1.4 + h * 2.0), h * 61.0)));
  float buzz = vnoise(vec2(uTime * 37.0, h * 9.0)) - 0.5;
  col *= 1.0 - B.g * uNeon * (drop * 0.5 + buzz * 0.05);
#endif
#ifdef FIRE
  vec2 fuv = (iuv - uFireRect.xy) / uFireRect.zw;
  if (fuv.x > 0.0 && fuv.y > 0.0 && fuv.x < 1.0 && fuv.y < 1.0) {
    vec3 fc = texture(uFireTex, fuv).rgb;
    float edge = smoothstep(0.0, 0.14, fuv.x) * smoothstep(1.0, 0.86, fuv.x) * smoothstep(0.0, 0.18, fuv.y) * smoothstep(1.0, 0.93, fuv.y);
    float keep = mix(1.0, smoothstep(0.12, 0.5, luma(col)), uFireMode);
    col = 1.0 - (1.0 - col) * (1.0 - fc * edge * keep * uFire);
  }
  vec2 fcen = uFireRect.xy + uFireRect.zw * vec2(0.5, 0.65);
  float fd = length((iuv - fcen) * vec2(uImgAspect, 1.0));
  col *= 1.0 + uFire * uFireGlow * exp(-fd * 2.3) * vec3(0.42, 0.24, 0.1);
#endif
#ifdef CAUSTICS
  float cz = caustic(iuv * vec2(uImgAspect, 1.0) * 9.0 + vec2(uTime * 0.03, 0.0), uTime * 0.5);
  // light lands on coral and sand; open water only shimmers faintly
  float surf = smoothstep(0.22, 0.7, near);
  col += cz * uCaustics * (0.05 + 0.95 * surf) * (0.25 + luma(col)) * vec3(0.62, 0.92, 0.9) * 0.5;
#endif
#ifdef AURORA
  col = livingAurora(iuv + duv, col, smoothstep(0.3, 0.8, A.r + (1.0 - near) * 0.6));
#endif
#ifdef FOG
  float far = 1.0 - near;
  float lowBias = mix(1.0, smoothstep(0.2, 0.8, iuv.y), uFogLow);
  float drift = fbm(vec2(iuv.x * 2.1 - uTime * 0.011 * (0.4 + length(uWind)), iuv.y * 4.6 + uTime * 0.004));
  float fogA = clamp(uFog * smoothstep(0.15, 0.95, far) * lowBias * (0.4 + 0.95 * drift), 0.0, 0.9);
  col = mix(col, uFogColor, fogA);
#endif
  // Weather also changes the light. Interiors stay sheltered; the sky loses its sunny warmth
  // when the viewer turns up rain, rather than receiving a bright, disconnected rain overlay.
  if (uStorm > 0.001) {
    float outdoors = mix(1.0, smoothstep(0.2, 0.7, B.r), uInterior);
    float cloudShade = 0.8 + 0.2 * vnoise(iuv * 3.0 - uTime * 0.012);
    vec3 overcast = mix(col, vec3(luma(col)) * vec3(0.91, 0.96, 1.04), 0.3) * mix(0.78, 0.54, A.r * cloudShade);
    col = mix(col, overcast, uStorm * outdoors);
  }
#ifdef NIGHT
  {
    // Day for night, graded the way film crews do it: outdoors falls to moonlight and the sky to
    // deep blue, while whatever gives light (lamps, flames, warm lit windows) keeps its glow.
    vec3 src = col;
    float lum = luma(col);
#ifdef MAPS
    float glass = B.r, lights = B.g, flame = B.b, skyM = A.r;
#else
    float glass = 0.0, lights = 0.0, flame = 0.0, skyM = 0.0;
#endif
    float inside = uInterior * (1.0 - smoothstep(0.3, 0.7, glass)) * (1.0 - skyM);
    vec3 moon = mix(vec3(lum), col, 0.3) * vec3(0.5, 0.64, 1.0) * mix(0.1, 0.22, smoothstep(0.45, 0.95, lum));
    moon = mix(moon, vec3(0.008, 0.014, 0.04) + moon * 0.5, skyM);
    // a few stars come out where there is open sky
    vec2 sp = floor(iuv * uRes * 0.55);
    float star = step(0.9975, hash(sp)) * (0.6 + 0.4 * sin(uTime * (1.0 + 3.0 * hash(sp + 7.0)) + hash(sp + 3.0) * 6.28));
    moon += vec3(0.75, 0.82, 1.0) * star * skyM * 0.55 * (1.0 - uStorm);
    // seen from outside, house windows light up one by one
    float win = uWindows * glass * (0.55 + 0.45 * hash(floor(iuv * vec2(90.0, 60.0))));
    moon = mix(moon, src * 0.2 + vec3(0.95, 0.62, 0.3) * 0.55 * win, smoothstep(0.0, 0.5, uWindows * glass));
    vec3 room = col * vec3(0.3, 0.24, 0.19);
    vec3 dark = mix(moon, room, inside);
    // only what actually shines keeps its light: the bright part of a lamp, the flames rather
    // than the whole fireplace, warm highlights such as lit windows
    float warmth = smoothstep(0.05, 0.2, col.r - col.b);
    float warmHi = smoothstep(0.62, 0.92, lum) * smoothstep(0.08, 0.22, col.r - col.b);
    float emit = clamp(max(max(lights * smoothstep(0.3, 0.75, lum), flame * smoothstep(0.35, 0.8, lum) * warmth), warmHi * 0.85), 0.0, 1.0);
    col = mix(col, mix(dark, col * 1.04, emit), uNight);
    if (uGlow > 0.0) {
      // firelight: a flickering warm pool from the hearth, or from a fire just out of frame
      float flick = 0.76 + 0.17 * vnoise(vec2(uTime * 6.5, 1.3)) + 0.11 * vnoise(vec2(uTime * 15.0, 7.1));
      float gd = length((iuv - uGlowAt) * vec2(uImgAspect, 1.0));
      float pool = exp(-gd * 2.4) * flick;
      // light lands on what is there; even near-black wood and stone pick up a little of it
      vec3 albedo = src + vec3(0.07, 0.06, 0.05) * (1.0 - smoothstep(0.0, 0.25, lum));
      col += albedo * vec3(1.0, 0.55, 0.25) * pool * uGlow * mix(0.35, 1.1, uNight) * (1.0 - skyM) * mix(1.0, 0.2, glass);
    }
  }
#endif
#ifdef FLASH
  float spot = exp(-pow((suv.x - uFlashX) / 0.42, 2.0));
  float skyF = A.r;
  col += uFlash * uFlashColor * (skyF * (0.25 + 1.5 * luma(col)) * (0.35 + 0.65 * spot) + 0.1 * (1.0 - skyF));
#endif
  col *= exp2(uExposure * 0.85);
  vec3 tint = uWarmth > 0.0 ? vec3(1.07, 1.0, 0.87) : vec3(0.9, 0.98, 1.1);
  col *= mix(vec3(1.0), tint, abs(uWarmth));
  outColor = vec4(col, 1.0);
}`;
}

/** Wet glass: refracts the rendered scene through the drop map and softens it where the glass is fogged. */
export const GLASS_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uScene;   // rendered scene (GL orientation)
uniform sampler2D uDrops;   // rg normal, b thickness, a coverage (screen orientation, top row first)
uniform sampler2D uMask;    // glass mask from maps-b.r (image uv)
uniform sampler2D uReflect; // faint interior reflection
uniform vec4 uCover;
uniform float uFull;        // 1 = whole frame is glass
uniform float uFocusGlass;  // 1 = camera focused on the glass
uniform float uRefract;
uniform float uReflection;
uniform float uFogGlass;
uniform vec2 uTexel;
${NOISE}

vec3 sharp(vec2 uv) { return texture(uScene, uv).rgb; }
vec3 soft(vec2 uv, float lod) {
  vec3 c = textureLod(uScene, uv, lod).rgb * 0.4;
  c += textureLod(uScene, uv + vec2(uTexel.x, 0.0) * 6.0, lod).rgb * 0.15;
  c += textureLod(uScene, uv - vec2(uTexel.x, 0.0) * 6.0, lod).rgb * 0.15;
  c += textureLod(uScene, uv + vec2(0.0, uTexel.y) * 6.0, lod).rgb * 0.15;
  c += textureLod(uScene, uv - vec2(0.0, uTexel.y) * 6.0, lod).rgb * 0.15;
  return c;
}

void main() {
  vec2 suv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 iuv = suv * uCover.xy + uCover.zw;
  float glass = max(uFull, smoothstep(0.3, 0.7, texture(uMask, iuv).r));
  vec3 clear = sharp(vUv);
  if (glass < 0.001) { outColor = vec4(clear, 1.0); return; }
  vec4 d = texture(uDrops, suv);
  // hard-edged drops, the way water beads on glass
  float cov = smoothstep(0.3, 0.5, d.a);
  vec2 n = (d.rg - 0.5) * 2.0;
  float thick = d.b;
  vec3 far = soft(vUv, 3.0);
  // behind the glass: sharp when focused on the street, a lens blur when focused on the glass
  vec3 behind = mix(clear, far, uFocusGlass);
  // a little condensation between drops
  behind = mix(behind, far * 1.04 + 0.01, uFogGlass * (1.0 - cov) * mix(0.1, 0.28, uFocusGlass));
  // each drop casts a faint shadow just below itself
  float under = smoothstep(0.3, 0.6, texture(uDrops, suv - vec2(0.0, uTexel.y * 5.0)).a);
  behind *= 1.0 - under * (1.0 - cov) * 0.16;
  // each drop is a lens: a flipped, minified view of what lies behind it
  vec2 ruv = vUv - vec2(n.x, -n.y) * uRefract * (0.45 + thick * 1.1);
  vec3 thru = mix(soft(ruv, 1.0), sharp(ruv), uFocusGlass) * 1.05 + 0.012;
  // darker where the surface curves away, a bright glint where it catches the light
  float rim = (1.0 - smoothstep(0.0, 0.55, thick)) * cov;
  float glint = pow(clamp(dot(normalize(vec3(n, 0.55)), normalize(vec3(-0.35, 0.6, 0.72))), 0.0, 1.0), 42.0) * cov;
  vec3 wet = mix(behind, thru, cov);
  wet *= 1.0 - rim * 0.42;
  wet += glint * (0.3 + 0.4 * luma(far));
  // a faint reflection of a warm room on the glass
  vec3 refl = texture(uReflect, vec2(suv.x, suv.y)).rgb;
  wet = 1.0 - (1.0 - wet) * (1.0 - refl * uReflection * (1.0 - cov * 0.7));
  outColor = vec4(mix(clear, wet, glass), 1.0);
}`;

/** Final pass: scene crossfade with a focus pull, grain, vignette and dithering. */
export const FINAL_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uMix;       // 0 = A, 1 = B
uniform float uBlurA;     // lod
uniform float uBlurB;
uniform float uGrain;
uniform float uVignette;
uniform float uTime;
uniform vec2 uRes;
uniform float uSharpen;
uniform vec2 uTexel;
${NOISE}

vec3 sampleSharp(sampler2D t, vec2 uv) {
  vec3 c = texture(t, uv).rgb;
  if (uSharpen <= 0.0) return c;
  vec3 n = texture(t, uv + vec2(0.0, uTexel.y)).rgb + texture(t, uv - vec2(0.0, uTexel.y)).rgb
         + texture(t, uv + vec2(uTexel.x, 0.0)).rgb + texture(t, uv - vec2(uTexel.x, 0.0)).rgb;
  vec3 mx = max(c, max(n * 0.25, c));
  vec3 detail = c - n * 0.25;
  return clamp(c + detail * uSharpen * (1.0 - smoothstep(0.6, 1.0, mx)), 0.0, 1.0);
}

void main() {
  vec3 a = uBlurA > 0.01 ? textureLod(uA, vUv, uBlurA).rgb : sampleSharp(uA, vUv);
  vec3 col = a;
  if (uMix > 0.0) {
    vec3 b = uBlurB > 0.01 ? textureLod(uB, vUv, uBlurB).rgb : sampleSharp(uB, vUv);
    float e = uMix * uMix * (3.0 - 2.0 * uMix);
    col = mix(a, b, e);
    col *= 1.0 - 0.18 * sin(3.14159 * uMix);   // a soft dip through the change
  }
  vec2 p = vUv - 0.5;
  col *= 1.0 - uVignette * smoothstep(0.35, 0.95, length(p * vec2(1.25, 1.0)));
  // film-like grain sized to the output pixels, plus dither to stop banding in dark skies
  float g = hash(gl_FragCoord.xy + fract(uTime * 13.37) * 311.0) - 0.5;
  float lum = luma(col);
  col += g * uGrain * (0.35 + 0.65 * (1.0 - lum)) * 0.09;
  col += (hash(gl_FragCoord.xy * 1.37 + 17.0) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}`;

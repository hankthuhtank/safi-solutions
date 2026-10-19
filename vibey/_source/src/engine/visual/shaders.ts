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
uniform sampler2D uFireTex;
uniform vec4 uCover;      // image uv = screen uv * xy + zw
uniform vec2 uRes;
uniform float uImgAspect;
uniform float uTime;
uniform vec2 uCam;
uniform float uParallax;
uniform vec2 uWind;       // direction * strength
uniform float uClouds, uWater, uSway, uFog, uFogLow, uStars, uAurora, uCaustics, uLamps, uNeon, uFire, uFireGlow, uFireMode, uMist, uWet;
uniform vec3 uFogColor;
uniform float uFlash, uFlashX;
uniform vec3 uFlashColor;
uniform vec4 uFireRect;
uniform float uExposure, uWarmth;
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
  vec2 p = vec2(iuv.x * 70.0, iuv.y * 230.0) / persp;
  float a = vnoise(p * 0.55 + vec2(uTime * 0.42, uTime * 0.12));
  float b = vnoise(p * 0.95 - vec2(uTime * 0.31, -uTime * 0.17));
  return vec2(a - 0.5, (b - 0.5) * 1.7) * 0.0032 * persp * uWater;
}
#endif

#ifdef SWAY
vec2 sway(vec2 iuv, float near) {
  float gust = 0.55 + 0.45 * vnoise(vec2(uTime * 0.13, 3.0));
  float s = vnoise(iuv * 5.0 + vec2(uTime * 0.55, 0.0)) - 0.5;
  float s2 = vnoise(iuv * 16.0 + vec2(uTime * 1.2, 4.0)) - 0.5;
  return vec2(s + 0.4 * s2, s2 * 0.35) * 0.0014 * uSway * gust * (0.35 + near);
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
  float still = C.g; // people never wobble
#else
  float near = 0.5;
  vec4 A = vec4(0.0), B = vec4(0.0);
  float still = 0.0;
  iuv += uCam * 0.05 * uParallax;
#endif
#ifdef CAUSTICS
  iuv += vec2(sin(iuv.y * 31.0 + uTime * 1.1), cos(iuv.x * 27.0 + uTime * 0.9)) * 0.0007 * uCaustics;
#endif
  vec2 duv = vec2(0.0);
#ifdef WATER
  float wetM = max(A.g * (1.0 - uMist), C.r * uWet / max(uWater, 0.001));
  duv += ripple(iuv, near) * wetM * (1.0 - still);
#endif
#ifdef SWAY
  duv += sway(iuv, near) * A.b * (1.0 - still) * (1.0 - A.g);
#endif
  vec3 col = base(iuv + duv);
#ifdef CLOUDS
  float skyM = smoothstep(0.35, 0.8, max(A.r, A.g * uMist));
  if (skyM > 0.001) col = mix(col, skyFlow(iuv), skyM);
#endif
#ifdef WATER
  col *= 1.0 + (vnoise(iuv * vec2(260.0, 900.0) + vec2(uTime * 0.8, 0.0)) - 0.5) * 0.07 * wetM * uWater;
#endif
#ifdef STARS
  float lb = luma(textureLod(uBase, iuv, 2.0).rgb);
  float pt = smoothstep(0.05, 0.22, luma(col) - lb) * smoothstep(0.3, 0.8, A.r + (1.0 - near) * 0.5);
  float tw = vnoise(iuv * uRes / 7.0 + vec2(uTime * 2.2, uTime * 0.7));
  col *= 1.0 + pt * (tw - 0.5) * 1.1 * uStars;
#endif
#ifdef LAMPS
  float fl = vnoise(vec2(uTime * 5.5, floor(iuv.x * 9.0) * 3.7 + floor(iuv.y * 7.0)));
  col *= 1.0 + B.g * (fl - 0.5) * 0.12 * uLamps;
#endif
#ifdef NEON
  vec2 cell = floor(iuv * vec2(14.0, 9.0));
  float h = hash(cell);
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

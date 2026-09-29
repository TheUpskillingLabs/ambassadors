/* The Labs orb, live, at the hub of its network: the home page's hero.

   The orb: the logo's orb as a planet. The logo's three bands (teal above, the
   ink band, red below) are latitude bands on a sphere: fitted to the orb mark
   (brandkit/assets/orb-mark.png), their edges are circles around one pole,
   rolled 22.5° to the left and tilted 15.4° toward the viewer, which is where
   their curve comes from. Every pixel's colour is read off the mark's own
   colours by its latitude (RAMP, sampled from the mark every 0.02), and the
   grain is the mark's too: the latitude is jittered per pixel before it's read,
   so the edges between the bands dither the way they do in the logo.

   The network: hub and spoke, and the same again at each level. The orb is
   the national Labs; spokes run out to the regional Labs, each a small orb of
   its own; spokes run from each of those to its neighbourhood Labs, and from
   each neighbourhood Lab to the places it meets in and the people around it.
   One region is lit (DC, where it started); the others are the vision, dimmer.
   Light runs along the spokes both ways: teal out from the hub (playbooks,
   the platform), red back in (what the Labs make and return to the commons).
   It all lies in one plane, rolled like the swoosh and a little more open
   than the bands, so the orbits sweep the way the logo does and the spokes
   still read.

   A small solar system: the orbits are rings made of networks, as in the
   orbits film, and the regions ride on them like planets, each ring turning
   at its own speed (the inner ones faster), each region with its ring, spoke
   and all. Its neighbourhood Labs are its moons, each on its own path round
   it, the nearer ones faster, carrying their places and people with them.

   It moves with the page: the orbits turn; the pointer turns it all a
   little and moves the light, which catches glints in the teal and the red;
   pointing at a region lights its branch; scrolling lifts the camera from the
   logo's view to above the network, where the hub and spokes read as a map.

   Plain WebGL 2, no library. It draws only while on screen; with reduced
   motion it draws one still frame; without WebGL 2 the poster stays. */

// The mark's colours by latitude: d = n·pole from -1 (south) to 1 (north), 101 RGB steps.
const RAMP = "250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,40,27,249,40,27,249,40,26,248,39,26,247,38,26,245,38,26,244,37,26,242,36,26,240,36,26,238,35,27,235,34,26,232,33,26,229,32,26,226,32,26,222,31,26,218,30,26,214,29,26,209,29,27,204,28,27,199,27,27,193,27,27,187,26,27,180,26,28,173,25,28,166,25,28,158,24,28,150,24,28,141,23,28,132,23,29,123,23,29,114,22,29,105,22,30,97,22,30,88,21,30,80,21,30,72,21,30,65,21,31,59,21,31,52,21,31,46,21,31,40,21,31,35,22,31,30,22,31,26,22,31,23,23,32,19,23,32,16,24,33,13,25,34,11,26,35,10,25,34,9,24,32,9,22,30,8,22,30,6,22,30,5,22,31,4,22,31,3,23,32,2,23,32,2,24,33,1,25,33,1,26,34,1,27,36,2,29,37,2,31,39,2,33,42,3,36,44,3,38,46,4,41,48,5,43,51,5,47,54,6,51,58,7,55,62,8,61,67,9,67,73,10,74,80,11,82,87,12,90,96,13,100,105,14,110,114,15,120,124,16,130,133,16,140,143,16,149,152,16,159,161,16,167,169,16,176,177,15,184,185,14,193,193,13,201,200,12,207,206,11,210,208";

/** The logo's view of the orb: the pole rolled left and tilted toward the viewer. */
const LOGO = { roll: 22.5, elev: 15.4 };
/** The network's plane, a little more open than the bands (and as steep as the swoosh), so the spokes read. */
const NET = { roll: 28, elev: 27 };
/** Where scrolling takes them: the camera rises until the network reads as a map, and the orb shows more of its teal. */
const ABOVE = { roll: 12, elev: 62 }, ABOVE_ORB = { roll: 16, elev: 38 };

type V3 = [number, number, number];
type M3 = number[]; // row-major 3×3

const DEG = Math.PI / 180;
const mul = (a: M3, b: M3): M3 => {
  const o = new Array(9).fill(0);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) for (let k = 0; k < 3; k++) o[r * 3 + c] += a[r * 3 + k] * b[k * 3 + c];
  return o;
};
const rx = (t: number): M3 => { const c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const ry = (t: number): M3 => { const c = Math.cos(t), s = Math.sin(t); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const rz = (t: number): M3 => { const c = Math.cos(t), s = Math.sin(t); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
const apply = (m: M3, v: V3): V3 => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

function mulberry(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ── the network, in the orb's frame: pole +y, the equatorial plane xz, the orb's radius 1 ── */

interface Region { p: V3; r: number; lit: boolean; w: number; }
const TEAL: V3 = [0.24, 0.9, 0.88], TEAL_DIM: V3 = [0.2, 0.66, 0.68], RED: V3 = [1, 0.27, 0.19], WHITE: V3 = [0.88, 1, 0.98], WARM: V3 = [1, 0.9, 0.84];

// Point kinds, for the shader.
const K = { spoke: 0, hood: 1, place: 2, person: 3, dust: 4, pulse: 5, ring: 6, node: 7, star: 8 };

/** The orbits: rings made of networks, as in the orbits film, radius and band width. */
const RINGS: [number, number][] = [[1.75, 0.15], [2.6, 0.2], [3.45, 0.24], [4.3, 0.28]];
/** The regional Labs, on the rings: [ring, angle°]. The first is lit (DC) and sits front right in the logo's view. */
const REGIONS: [number, number][] = [[1, 28], [1, 148], [1, 262], [2, 92], [2, 205], [2, 322], [3, 62]];
/** Orbital speed at radius r, rad/s: the inner orbits run faster, as planets' do. */
const orbitW = (r: number) => 0.03 * Math.pow(2.5 / r, 1.5);

function buildNetwork() {
  const rnd = mulberry(20251);
  const J = (a: number) => (rnd() * 2 - 1) * a;
  const regions: Region[] = REGIONS.map(([k, a], i) => {
    const rad = RINGS[k][0];
    return { p: [Math.cos(a * DEG) * rad, J(0.05), Math.sin(a * DEG) * rad] as V3, r: i === 0 ? 0.24 : 0.15 + rnd() * 0.04, lit: i === 0, w: orbitW(rad) };
  });

  // Points: A (from), B (to), T (phase, speed, birth, group), C (rgb, alpha), S (size px, kind),
  // W (speed round the orb), Lc (the planet a moon circles, and the moon's speed round it).
  const A: number[] = [], B: number[] = [], T: number[] = [], C: number[] = [], S: number[] = [], Wv: number[] = [], Lc: number[] = [];
  let w = 0; // the orbital speed of whatever's being pushed
  let loc: [number, number, number, number] = [0, 0, 0, 0]; // and its moon orbit, if it's part of one
  const push = (a: V3, b: V3, phase: number, speed: number, birth: number, group: number, c: V3, alpha: number, size: number, kind: number) => {
    A.push(...a); B.push(...b); T.push(phase, speed, birth, group); C.push(...c, alpha); S.push(size, kind); Wv.push(w); Lc.push(...loc);
  };
  // Lines (the rings' links): P (end), M (the link's middle, so both ends fall on the same side of the orb), L (speed, birth, group, alpha), LC (rgb).
  const P: number[] = [], Mid: number[] = [], Lw: number[] = [], LC: number[] = [];
  const link = (a: V3, b: V3, birth: number, c: V3, alpha: number) => {
    const m: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    for (const e of [a, b]) { P.push(...e); Mid.push(...m); Lw.push(w, birth, -1, alpha); LC.push(...c); }
  };
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const len = (v: V3) => Math.hypot(v[0], v[1], v[2]);
  const along = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  /** A spoke as a dotted line, from a's surface (radius ra) to b's (radius rb), growing outward from `birth`. */
  const spoke = (a: V3, ra: number, b: V3, rb: number, birth: number, span: number, group: number, c: V3, alpha: number, size: number, step: number, pulses: number) => {
    const L = len(sub(b, a)); const u0 = ra / L, u1 = 1 - rb / L;
    const p0 = along(a, b, u0), p1 = along(a, b, u1);
    const n = Math.max(2, Math.round((L * (u1 - u0)) / step));
    for (let i = 0; i <= n; i++) { const t = i / n; push(along(p0, p1, t), along(p0, p1, t), 0, 0, birth + span * t, group, c, alpha, size, K.spoke); }
    // Light running along it: teal out, now and then red back in; each a head and a short tail.
    const speed = 0.55 / (L * (u1 - u0));
    for (let k = 0; k < pulses; k++) {
      const inward = k % 3 === 2; const phase = rnd();
      const [s, e] = inward ? [p1, p0] : [p0, p1];
      for (let tail = 0; tail < 5; tail++) push(s, e, phase - tail * 0.018, speed, 0.9, group, inward ? RED : WHITE, (inward ? 0.9 : 1) * (1 - tail / 5), size * (tail ? 1.7 : 2.6), K.pulse);
    }
  };

  // The orbits: each ring a belt of fine, glowing dust, densest along the orbit and fading
  // at its edges, with brighter nodes strung along it, linked one to the next so the
  // links flow round the ring, and now and then across to the next ring out.
  const hubsByRing: { a: number; p: V3 }[][] = [];
  RINGS.forEach(([rad, bw], k) => {
    w = orbitW(rad);
    const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 0.87;
    const n = Math.round(2 * Math.PI * rad * bw * 240);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = rad + gauss() * bw * 0.42;
      const q: V3 = [Math.cos(a) * d, J(0.012), Math.sin(a) * d];
      const c: V3 = rnd() < 0.2 ? WHITE : TEAL_DIM;
      push(q, q, 0, 0, 0.02 + k * 0.05 + 0.3 * (a / (Math.PI * 2)), -1, c, 0.14 + rnd() * 0.3, 0.9 + rnd() * 1.2, K.ring);
    }
    const m = Math.round(2 * Math.PI * rad * 2.1);
    const hubs: { a: number; p: V3 }[] = [];
    for (let i = 0; i < m; i++) {
      const a = ((i + J(0.3)) / m) * Math.PI * 2, d = rad + gauss() * bw * 0.28;
      const q: V3 = [Math.cos(a) * d, J(0.01), Math.sin(a) * d];
      hubs.push({ a, p: q });
      push(q, q, 0, 0, 0.04 + k * 0.05 + 0.3 * (a / (Math.PI * 2)), -1, WHITE, 0.55 + rnd() * 0.35, 2.6 + rnd() * 1.6, K.node);
    }
    hubs.forEach((h, i) => {
      const birth = 0.06 + k * 0.05 + 0.3 * (h.a / (Math.PI * 2));
      link(h.p, hubs[(i + 1) % m].p, birth, TEAL, 0.28);
      if (rnd() < 0.35) link(h.p, hubs[(i + 2) % m].p, birth, TEAL, 0.1);
    });
    hubsByRing.push(hubs);
  });
  // A few links across the gaps between rings: one network, not four.
  for (let k = 0; k < RINGS.length - 1; k++) {
    w = (orbitW(RINGS[k][0]) + orbitW(RINGS[k + 1][0])) / 2;
    hubsByRing[k].forEach((h) => {
      if (rnd() > 0.3) return;
      const next = hubsByRing[k + 1].reduce((b, q) => (Math.abs(q.a - h.a) < Math.abs(b.a - h.a) ? q : b));
      link(h.p, next.p, 0.3 + 0.3 * (h.a / (Math.PI * 2)), TEAL, 0.07);
    });
  }

  const O: V3 = [0, 0, 0];
  regions.forEach((R, g) => {
    const lit = R.lit;
    w = R.w; // a region and everything of it move with its orbit
    // Hub → region.
    spoke(O, 1.06, R.p, R.r * 1.35, 0.1, 0.3, g, lit ? TEAL : TEAL_DIM, lit ? 0.6 : 0.34, lit ? 1.7 : 1.5, 0.014, lit ? 3 : 2);
    // Region → its neighbourhood Labs, and each of those → its places and people.
    const n = lit ? 7 : 3 + Math.floor(rnd() * 3);
    const a0 = rnd() * Math.PI * 2;
    for (let h = 0; h < n; h++) {
      // Each neighbourhood Lab a moon of its region, on its own orbit round it (nearer, faster).
      const a = a0 + (h / n) * Math.PI * 2 + J(0.35);
      const d = (lit ? 0.38 : 0.3) + (h / n) * (lit ? 0.5 : 0.34) + J(0.04);
      const H: V3 = [R.p[0] + Math.cos(a) * d, R.p[1] + J(0.03), R.p[2] + Math.sin(a) * d];
      const birth = 0.45 + 0.08 * rnd();
      loc = [0, 0, 0, 0];
      const path = Math.round((2 * Math.PI * d) / 0.045);
      for (let i = 0; i < path; i++) {
        const b = (i / path) * Math.PI * 2;
        const q: V3 = [R.p[0] + Math.cos(b) * d, R.p[1], R.p[2] + Math.sin(b) * d];
        push(q, q, 0, 0, birth + 0.1 * (i / path), g, TEAL_DIM, lit ? 0.16 : 0.08, 1.1, K.ring);
      }
      loc = [R.p[0], R.p[1], R.p[2], 0.16 * Math.pow(0.5 / d, 1.5)];
      spoke(R.p, R.r * 1.3, H, 0.03, birth, 0.18, g, lit ? TEAL : TEAL_DIM, lit ? 0.5 : 0.28, lit ? 1.5 : 1.3, 0.014, lit ? 1 : (rnd() < 0.4 ? 1 : 0));
      push(H, H, 0, 0, birth + 0.18, g, WARM, lit ? 1 : 0.6, lit ? 8 : 6, K.hood);
      const places = 2 + Math.floor(rnd() * 2);
      for (let p = 0; p < places; p++) {
        const b = a + J(1.4), e = 0.09 + rnd() * 0.08;
        const Q: V3 = [H[0] + Math.cos(b) * e, H[1] + J(0.03), H[2] + Math.sin(b) * e];
        push(Q, Q, 0, 0, birth + 0.26 + 0.1 * rnd(), g, TEAL, lit ? 1 : 0.5, 3.4, K.place);
        for (const f of [0.35, 0.65]) push(along(H, Q, f), along(H, Q, f), 0, 0, birth + 0.24, g, TEAL, lit ? 0.5 : 0.25, 1.4, K.spoke);
      }
      // The people around it: a small cloud.
      const people = lit ? 16 : 6;
      for (let q = 0; q < people; q++) {
        const b = rnd() * Math.PI * 2, e = 0.06 + Math.pow(rnd(), 0.7) * 0.26;
        const Q: V3 = [H[0] + Math.cos(b) * e, H[1] + J(0.05), H[2] + Math.sin(b) * e];
        push(Q, Q, 0, 0, birth + 0.3 + 0.3 * rnd(), g, WARM, (lit ? 0.66 : 0.32) * (0.5 + rnd() * 0.5), 1.7 + rnd() * 1.1, K.person);
      }
    }
    loc = [0, 0, 0, 0];
  });
  // Far stars behind it all, fixed to the view (they only shift a little with the pointer), twinkling slowly.
  w = 0;
  for (let i = 0; i < 240; i++) {
    const q: V3 = [J(1), J(1), 0.3 + rnd()];
    push(q, q, rnd() * 6.28, 0.4 + rnd() * 1.2, 0.1 + rnd() * 0.5, -1, rnd() < 0.3 ? TEAL : WHITE, 0.12 + Math.pow(rnd(), 2) * 0.5, 0.8 + rnd() * 1.1, K.star);
  }
  // Dust in the plane, thinning outward, each grain on its own orbit: everyone else.
  for (let i = 0; i < 450; i++) {
    const a = rnd() * Math.PI * 2, d = 1.35 + Math.pow(rnd(), 1.6) * 4.4;
    w = orbitW(d);
    const Q: V3 = [Math.cos(a) * d, J(0.1) * (0.4 + d * 0.12), Math.sin(a) * d];
    push(Q, Q, 0, 0, 0.15 + 0.7 * rnd(), -1, TEAL_DIM, 0.18 + rnd() * 0.2, 1.3 + rnd() * 1.3, K.dust);
  }
  return { regions, A, B, T, C, S, W: Wv, Lc, count: S.length / 2, P, Mid, Lw, LC, lines: P.length / 3 };
}

/* ── shaders ── */

const GLSL_HASH = `
float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float hash3(vec3 p) { p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
vec3 hash33(vec3 p) { p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }`;

// Turn a point about the pole by angle a: its orbit (the same turn as ry()).
const GLSL_SPIN = `vec3 spin(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }`;

const POINT_VS = `#version 300 es
precision highp float;
in vec3 aA; in vec3 aB; in vec4 aT; in vec4 aC; in vec2 aS; in float aW; in vec4 aLoc;
uniform mat3 uM; uniform float uD; uniform vec2 uTan; uniform float uPx; uniform float uTime;
uniform float uGrow; uniform float uPulse; uniform float uSide; uniform float uFocus; uniform float uFocusAmt; uniform float uBoost; uniform vec2 uPar;
out vec4 vC; out float vKind; out float vNear;
${GLSL_SPIN}
void main() {
  if (aS.y > 7.5) { // a star: A is its place on screen, its depth in z
    if (uSide > 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; } // behind everything
    gl_Position = vec4(aA.xy - uPar * 0.03 * aA.z, 0.0, 1.0);
    vC = vec4(aC.rgb, aC.a * (0.65 + 0.35 * sin(aT.x + uTime * aT.y)) * smoothstep(aT.z, aT.z + 0.1, uGrow));
    vKind = aS.y; vNear = 0.0;
    gl_PointSize = aS.x * uPx;
    return;
  }
  float moving = step(0.0001, aT.y);
  float u = fract(aT.x + uTime * aT.y);
  vec3 p = mix(aA, aB, moving * u);
  p = aLoc.xyz + spin(p - aLoc.xyz, aLoc.w * uTime); // round its planet, if it's a moon
  p = spin(p, aW * uTime);                          // and round the orb
  vec3 v = uM * p; v.z -= uD;
  if ((v.z + uD) * uSide < 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  gl_Position = vec4(v.x / (-v.z * uTan.x), v.y / (-v.z * uTan.y), 0.0, 1.0);
  float a = aC.a * smoothstep(aT.z, aT.z + 0.06, uGrow);
  a *= mix(1.0, sin(3.14159 * u) * uPulse, moving);
  float g = aT.w;
  float f = g < -0.5 ? 1.0 - 0.45 * uFocusAmt : (abs(g - uFocus) < 0.5 ? 1.0 + 1.3 * uFocusAmt : 1.0 - 0.65 * uFocusAmt);
  a *= f * (aS.y < 0.5 ? uBoost : 1.0);
  // Depth: the far side of the system dimmer and finer, the near side larger and softer, out of focus.
  float depth = clamp((v.z + uD) / 4.5, -1.0, 1.0);
  a *= 1.0 + 0.3 * depth;
  vC = vec4(aC.rgb, a);
  vKind = aS.y;
  vNear = max(depth, 0.0);
  gl_PointSize = aS.x * uPx * (uD / -v.z) * (1.0 + 0.55 * max(depth, 0.0) - 0.15 * max(-depth, 0.0)) * (abs(g - uFocus) < 0.5 && aS.y > 0.5 ? 1.0 + 0.3 * uFocusAmt : 1.0);
}`;

const POINT_FS = `#version 300 es
precision highp float;
in vec4 vC; in float vKind; in float vNear;
out vec4 o;
${GLSL_HASH}
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0; float r = dot(c, c);
  if (r > 1.0) discard;
  bool glow = (vKind > 0.5 && vKind < 1.5) || vKind > 6.5;
  float core = glow ? smoothstep(1.0, 0.0, r) * 0.5 + smoothstep(0.3, 0.05, r) * 0.7 : smoothstep(1.0, 0.15, r);
  core = mix(core, smoothstep(1.0, 0.0, r) * 0.75, vNear * 0.8);
  float a = vC.a * core * (0.78 + 0.44 * hash(gl_FragCoord.xy));
  o = vec4(vC.rgb * a, a * 0.55);
}`;

const LINE_VS = `#version 300 es
precision highp float;
in vec3 aP; in vec3 aM; in vec4 aL; in vec3 aLC;
uniform mat3 uM; uniform float uD; uniform vec2 uTan; uniform float uTime; uniform float uGrow; uniform float uSide; uniform float uFocusAmt; uniform float uBoost;
out vec4 vC;
${GLSL_SPIN}
void main() {
  float ang = aL.x * uTime;
  if ((uM * spin(aM, ang)).z * uSide < 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec3 v = uM * spin(aP, ang); v.z -= uD;
  gl_Position = vec4(v.x / (-v.z * uTan.x), v.y / (-v.z * uTan.y), 0.0, 1.0);
  vC = vec4(aLC, aL.w * smoothstep(aL.y, aL.y + 0.06, uGrow) * (1.0 - 0.45 * uFocusAmt) * uBoost);
}`;

const LINE_FS = `#version 300 es
precision highp float;
in vec4 vC; out vec4 o;
${GLSL_HASH}
void main() { float a = vC.a * (0.75 + 0.5 * hash(gl_FragCoord.xy)); o = vec4(vC.rgb * a, a * 0.5); }`;

// The orbital plane's own light: a grainy glow round the orb, a little brighter along the orbits.
const DISC_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aQ;
uniform mat3 uM; uniform float uD; uniform vec2 uTan; uniform float uR;
out vec2 vP;
void main() {
  vec3 p = vec3(aQ.x * uR, 0.0, aQ.y * uR);
  vP = p.xz;
  vec3 v = uM * p; v.z -= uD;
  gl_Position = vec4(v.x / uTan.x, v.y / uTan.y, 0.0, -v.z);
}`;

const DISC_FS = `#version 300 es
precision highp float;
in vec2 vP; uniform float uAmt; uniform vec4 uRings;
out vec4 o;
${GLSL_HASH}
void main() {
  float r = length(vP);
  float g = exp(-(r - 1.0) / 1.1) * 0.55 + exp(-(r - 1.0) / 3.2) * 0.2;
  vec4 dr = (vec4(r) - uRings) / 0.22;
  g += dot(exp(-dr * dr), vec4(0.1));
  float ang = atan(vP.y, vP.x);
  vec3 c = mix(vec3(0.0, 0.62, 0.66), vec3(0.84, 0.17, 0.2), 0.4 * smoothstep(0.2, -0.9, sin(ang + 0.7)));
  float a = g * uAmt * smoothstep(5.6, 3.6, r) * smoothstep(0.9, 1.15, r) * (0.55 + 0.9 * hash(gl_FragCoord.xy));
  o = vec4(c * a, a * 0.55);
}`;

const ORB_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aQ; uniform vec4 uRect;
void main() { gl_Position = vec4(mix(uRect.xy, uRect.zw, aQ * 0.5 + 0.5), 0.0, 1.0); }`;

const ORB_FS = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform vec2 uTan; uniform vec3 uCenter; uniform float uR;
uniform vec3 uPole; uniform vec3 uLight; uniform mat3 uInv; uniform sampler2D uRamp;
uniform float uBright; uniform float uHalo; uniform float uGlint;
out vec4 o;
${GLSL_HASH}
void main() {
  vec2 ndc = gl_FragCoord.xy / uRes * 2.0 - 1.0;
  vec3 dir = normalize(vec3(ndc.x * uTan.x, ndc.y * uTan.y, -1.0));
  float b = dot(dir, uCenter);
  vec3 off = dir * b - uCenter;
  float dist = length(off);
  float pix = -uCenter.z * 2.0 * uTan.y / uRes.y;
  float cover = smoothstep(uR + pix * 0.8, uR - pix * 0.8, dist);
  vec3 col = vec3(0.0); float alpha = 0.0;
  if (cover > 0.0) {
    float t = b - sqrt(max(uR * uR - dist * dist, 0.0));
    vec3 n = normalize(dir * t - uCenter);
    float d = dot(n, uPole);
    // The mark's grain: the latitude dithered per pixel, so the band edges break up like the logo's.
    float dj = d + (hash(gl_FragCoord.xy) - 0.5) * 0.13;
    vec3 c = texture(uRamp, vec2((clamp(dj, -1.0, 1.0) * 0.5 + 0.5) * (100.0 / 101.0) + 0.5 / 101.0, 0.5)).rgb;
    float tealW = smoothstep(0.3, 0.8, d), redW = smoothstep(-0.05, -0.45, d);
    float lit = dot(n, uLight);
    c *= 1.0 + lit * (0.2 * tealW + 0.07 * redW);
    // Glints in the teal and the red, fixed to the surface, caught by the light.
    vec3 os = uInv * n;
    vec3 cell = floor(os * 64.0);
    float h = hash3(cell + 7.0);
    if (h > 0.985) {
      vec3 np = normalize(n + (hash33(cell) - 0.5) * 1.1);
      float s = pow(max(dot(reflect(dir, np), uLight), 0.0), 18.0);
      c += (c * 2.2 + 0.25) * s * (tealW + redW) * uGlint;
    }
    // A thin atmosphere at the limb, teal above and red below, so it sits in its light like a planet.
    float rim = pow(1.0 - max(dot(n, -dir), 0.0), 3.0);
    c += mix(vec3(0.95, 0.2, 0.18), vec3(0.1, 0.85, 0.85), smoothstep(-0.3, 0.45, d)) * rim * 0.3;
    col = c * uBright * cover; alpha = cover;
  }
  // A halo just outside the limb, with the grain in it: red below, a little teal above.
  float outside = max(dist - uR, 0.0) / uR;
  float side = dot(off / max(dist, 1e-5), uPole);
  vec3 hc = mix(vec3(0.84, 0.17, 0.2), vec3(0.0, 0.58, 0.63), smoothstep(-0.6, 0.6, side));
  float hw = mix(0.95, 0.55, smoothstep(-0.6, 0.6, side));
  float hl = (exp(-outside / 0.1) * 0.7 + exp(-outside / 0.45) * 0.45) * hw * uHalo * (1.0 - cover) * (0.65 + 0.7 * hash(gl_FragCoord.yx + 3.0));
  col += hc * hl * 0.55; alpha += hl * 0.22;
  o = vec4(col, min(alpha, 1.0));
}`;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const prog = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    gl.attachShader(prog, s);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
  const U = new Proxy({} as Record<string, WebGLUniformLocation | null>, { get: (c, k: string) => (k in c ? c[k] : (c[k] = gl.getUniformLocation(prog, k))) });
  return { prog, U };
}

export interface OrbNetOptions { still?: boolean; poster?: boolean; }

/** Start the live orb in `wrap` (it gets `is-live` once it draws). Returns false without WebGL 2. */
export function mountOrbNet(wrap: HTMLElement, opts: OrbNetOptions = {}): boolean {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: Boolean(opts.poster) });
  if (!gl) return false;
  let pts: ReturnType<typeof compile>, lines: ReturnType<typeof compile>, orb: ReturnType<typeof compile>, disc: ReturnType<typeof compile>;
  try { pts = compile(gl, POINT_VS, POINT_FS); lines = compile(gl, LINE_VS, LINE_FS); orb = compile(gl, ORB_VS, ORB_FS); disc = compile(gl, DISC_VS, DISC_FS); } catch (e) { console.warn("orbnet", e); return false; }
  wrap.appendChild(canvas);

  const net = buildNetwork();
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const attr = (prog: WebGLProgram, name: string, data: number[], size: number) => {
    const loc = gl.getAttribLocation(prog, name); if (loc < 0) return;
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  attr(pts.prog, "aA", net.A, 3); attr(pts.prog, "aB", net.B, 3); attr(pts.prog, "aT", net.T, 4); attr(pts.prog, "aC", net.C, 4); attr(pts.prog, "aS", net.S, 2); attr(pts.prog, "aW", net.W, 1); attr(pts.prog, "aLoc", net.Lc, 4);
  const lineVao = gl.createVertexArray(); gl.bindVertexArray(lineVao);
  attr(lines.prog, "aP", net.P, 3); attr(lines.prog, "aM", net.Mid, 3); attr(lines.prog, "aL", net.Lw, 4); attr(lines.prog, "aLC", net.LC, 3);
  const quadVao = gl.createVertexArray(); gl.bindVertexArray(quadVao);
  const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); // aQ, location 0 in the orb's and the disc's shaders
  gl.bindVertexArray(null);

  const ramp = new Uint8Array(101 * 4); RAMP.split(",").map(Number).forEach((v, i) => { ramp[Math.floor(i / 3) * 4 + (i % 3)] = v; });
  for (let i = 0; i < 101; i++) ramp[i * 4 + 3] = 255;
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 101, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, ramp);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const still = Boolean(opts.still || opts.poster);
  const D = 30;
  let W = 1, H = 1, dpr = 1, halfW = 4;
  const resize = () => {
    // Layout size, not the box on screen: the hero's entrance scales it for a moment.
    const w = wrap.clientWidth, h = wrap.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(w * dpr)); H = Math.max(1, Math.round(h * dpr));
    canvas.width = W; canvas.height = H;
    halfW = w < 620 ? 3.3 : 4.05;
    if (still) draw(performance.now());
  };

  // Inputs, eased.
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, cx: -1e4, cy: -1e4, inside: false };
  let scrollT = 0, scrollE = 0, focus = -1, focusAmt = 0, lastFocus = 0;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!still && fine) window.addEventListener("pointermove", (e) => {
    const r = wrap.getBoundingClientRect();
    ptr.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    ptr.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    ptr.cx = e.clientX - r.left; ptr.cy = e.clientY - r.top;
    ptr.inside = ptr.cx >= 0 && ptr.cy >= 0 && ptr.cx <= r.width && ptr.cy <= r.height;
  }, { passive: true });
  const readScroll = () => {
    const r = wrap.getBoundingClientRect();
    const top = r.top + window.scrollY;
    scrollT = Math.max(0, Math.min(1, window.scrollY / Math.max(1, top + r.height * 0.55)));
  };
  if (!still) window.addEventListener("scroll", readScroll, { passive: true });

  const t0 = performance.now();
  let grow = still ? 1 : 0, growStart = -1;

  function draw(now: number) {
    const t = (now - t0) / 1000;
    ptr.x = lerp(ptr.x, ptr.tx, 0.06); ptr.y = lerp(ptr.y, ptr.ty, 0.06);
    scrollE = lerp(scrollE, scrollT, 0.12);
    if (!still) {
      if (growStart < 0) growStart = t;
      grow = Math.min(1, (t - growStart) / 3.4);
    }
    const g = 1 - Math.pow(1 - grow, 3);
    const s = ease(scrollE);

    const yaw = ptr.x * 9 * DEG + (still ? 0 : Math.sin(t * 0.13) * 2.5 * DEG), pitch = ptr.y * 6 * DEG;
    const par = mul(ry(yaw), rx(pitch));
    const view = mul(par, mul(rz(lerp(NET.roll, ABOVE.roll, s) * DEG), rx(lerp(NET.elev, ABOVE.elev, s) * DEG)));
    const orbView = mul(par, mul(rz(lerp(LOGO.roll, ABOVE_ORB.roll, s) * DEG), rx(lerp(LOGO.elev, ABOVE_ORB.elev, s) * DEG)));
    const spin = s * 38 * DEG; // scrolling turns the whole system; time turns each orbit (in the shaders)
    const tt = still ? 0 : t;
    const M = mul(view, ry(spin));
    const O = mul(orbView, ry(spin + tt * 2 * DEG)); // the orb's own day: its glints drift round
    const pole = apply(orbView, [0, 1, 0]);
    const inv = [O[0], O[3], O[6], O[1], O[4], O[7], O[2], O[5], O[8]]; // transpose: view → the orb's own frame
    const L = (() => { const v: V3 = [0.8 + ptr.x * 0.6, 0.3 - ptr.y * 0.6, 0.65]; const l = Math.hypot(...v); return v.map((x) => x / l) as V3; })();

    const aspect = W / H, tanX = halfW / D, tanY = tanX / aspect;

    // Which region the pointer is on.
    let hit = -1;
    if (ptr.inside && grow > 0.9) {
      let best = (70 * dpr) ** 2;
      net.regions.forEach((R, i) => {
        const v = apply(M, apply(ry(R.w * tt), R.p)); const z = v[2] - D;
        const sx = (v[0] / (-z * tanX) * 0.5 + 0.5) * W / dpr, sy = (0.5 - v[1] / (-z * tanY) * 0.5) * H / dpr;
        const d2 = ((sx - ptr.cx) * dpr) ** 2 + ((sy - ptr.cy) * dpr) ** 2;
        if (d2 < best) { best = d2; hit = i; }
      });
    }
    if (hit >= 0) { focus = hit; lastFocus = hit; }
    focusAmt = lerp(focusAmt, hit >= 0 ? 1 : 0, 0.08);
    if (hit < 0 && focusAmt < 0.01) focus = -1;

    gl!.viewport(0, 0, W, H);
    gl!.clearColor(0, 0, 0, 0); gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.enable(gl!.BLEND); gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);

    const drawPoints = (side: number) => {
      gl!.useProgram(pts.prog); gl!.bindVertexArray(vao);
      const U = pts.U;
      gl!.uniformMatrix3fv(U.uM, true, M); gl!.uniform1f(U.uD, D); gl!.uniform2f(U.uTan, tanX, tanY);
      gl!.uniform1f(U.uPx, dpr * Math.min(1.2, Math.max(0.8, H / dpr / 600))); gl!.uniform1f(U.uTime, tt);
      gl!.uniform1f(U.uGrow, g); gl!.uniform1f(U.uPulse, still ? 0 : Math.min(1, Math.max(0, (grow - 0.8) / 0.2)));
      gl!.uniform1f(U.uSide, side); gl!.uniform1f(U.uFocus, focus >= 0 ? focus : lastFocus); gl!.uniform1f(U.uFocusAmt, focus >= 0 ? focusAmt : 0);
      gl!.uniform1f(U.uBoost, 1 + 0.5 * s); gl!.uniform2f(U.uPar, ptr.x, -ptr.y);
      gl!.drawArrays(gl!.POINTS, 0, net.count);
    };
    const drawLines = (side: number) => {
      gl!.useProgram(lines.prog); gl!.bindVertexArray(lineVao);
      const U = lines.U;
      gl!.uniformMatrix3fv(U.uM, true, M); gl!.uniform1f(U.uD, D); gl!.uniform2f(U.uTan, tanX, tanY);
      gl!.uniform1f(U.uTime, tt); gl!.uniform1f(U.uGrow, g); gl!.uniform1f(U.uSide, side);
      gl!.uniform1f(U.uFocusAmt, focus >= 0 ? focusAmt : 0); gl!.uniform1f(U.uBoost, 1 + 0.3 * s);
      gl!.drawArrays(gl!.LINES, 0, net.lines);
    };
    const drawOrb = (c: V3, r: number, bright: number, halo: number, glint: number) => {
      const z = -c[2];
      const cx = c[0] / (z * tanX), cy = c[1] / (z * tanY), rx_ = (r * 3.2) / (z * tanX), ry_ = (r * 3.2) / (z * tanY);
      gl!.useProgram(orb.prog); gl!.bindVertexArray(quadVao);
      const U = orb.U;
      gl!.uniform4f(U.uRect, cx - rx_, cy - ry_, cx + rx_, cy + ry_);
      gl!.uniform2f(U.uRes, W, H); gl!.uniform2f(U.uTan, tanX, tanY); gl!.uniform3f(U.uCenter, c[0], c[1], c[2]); gl!.uniform1f(U.uR, r);
      gl!.uniform3f(U.uPole, pole[0], pole[1], pole[2]); gl!.uniform3f(U.uLight, L[0], L[1], L[2]);
      gl!.uniformMatrix3fv(U.uInv, true, inv);
      gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, tex); gl!.uniform1i(U.uRamp, 0);
      gl!.uniform1f(U.uBright, bright); gl!.uniform1f(U.uHalo, halo); gl!.uniform1f(U.uGlint, glint);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    };
    // Regional orbs, back to front, split around the hub so the hub hides the ones behind it.
    const minis = net.regions.map((R, i) => {
      const v = apply(M, apply(ry(R.w * tt), R.p)); v[2] -= D;
      const appear = Math.min(1, Math.max(0, (g - 0.3) / 0.12));
      const lit = R.lit ? 1.08 : 0.74;
      const f = focus === i ? 1 + 0.5 * focusAmt : (focus >= 0 ? 1 - 0.4 * focusAmt : 1);
      return { v, r: R.r * (0.6 + 0.4 * ease(appear)), bright: lit * f * appear, i };
    }).sort((a, b) => a.v[2] - b.v[2]);
    const behind = minis.filter((m) => m.v[2] < -D), front = minis.filter((m) => m.v[2] >= -D);

    gl!.useProgram(disc.prog); gl!.bindVertexArray(quadVao);
    gl!.uniformMatrix3fv(disc.U.uM, true, M); gl!.uniform1f(disc.U.uD, D); gl!.uniform2f(disc.U.uTan, tanX, tanY); gl!.uniform1f(disc.U.uR, 5.8);
    gl!.uniform1f(disc.U.uAmt, 0.2 * g); gl!.uniform4f(disc.U.uRings, RINGS[0][0], RINGS[1][0], RINGS[2][0], RINGS[3][0]);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    drawLines(-1);
    drawPoints(-1);
    behind.forEach((m) => m.bright > 0 && drawOrb(m.v, m.r, m.bright, 1.1 * m.bright, 0));
    drawOrb([0, 0, -D], 1, 1, 1, still ? 0.6 : 1);
    drawLines(1); // the rings' links under the planets riding on them
    front.forEach((m) => m.bright > 0 && drawOrb(m.v, m.r, m.bright, 1.1 * m.bright, 0));
    drawPoints(1);

    if (!wrap.classList.contains("is-live")) wrap.classList.add("is-live");
  }

  new ResizeObserver(resize).observe(wrap);
  resize();
  if (still) { draw(performance.now()); return true; }

  let on = false, raf = 0;
  const loop = (now: number) => { draw(now); raf = on ? requestAnimationFrame(loop) : 0; };
  const setOn = (v: boolean) => { if (v === on) return; on = v; if (on && !raf) { readScroll(); raf = requestAnimationFrame(loop); } };
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; setOn(visible && !document.hidden); }).observe(wrap);
  document.addEventListener("visibilitychange", () => setOn(visible && !document.hidden));
  return true;
}

/* The Labs' people: the home page's hero.

   Seven members of the first cohort, and the orb (The Labs) they gather round. Fine lines join the people
   near each other, ideas pass along them one spark at a time, and the whole thing answers you. It says three
   things, and nothing else:
     connection   people joined to people, and to The Labs
     adaptivity   the lines let go and re-form as people move; the group regroups into teams as you scroll;
                  it leans toward your cursor, with weight
     expertise    ideas passing on, one spark at a time, from the people who know to the people learning
   The page's scroll moves it through five shots, one line of the story each:
     0  the hero: the people on two slow orbits round the orb, under the title, one seat still empty
     1  build: two teams, of three and four, an idea going round each
     2  together: close on a team, its mentor passing on what they know
     3  bigger: the team seen small, its idea going up to the orb and out to other Labs
     4  you: the orbits again, and the empty seat is yours; the orb is the way in (Join The Labs)

   Everything moves on springs, so it has weight: a new shot is a new target, and people ease into it.
   Plain canvas 2D, a handful of shapes a frame; it draws only while on screen. Reduced motion gets the
   first shot, still. */

/** Where each shot sits in the story's progress. */
export const SHOT_AT = [0, 0.25, 0.47, 0.69, 0.92];
/** How much each beat is on screen at story progress p (0 hero … 4 you). */
export function beatWeights(p: number): number[] {
  return SHOT_AT.map((x, i) => {
    const half = i === 0 ? 0.08 : 0.085;
    const d = Math.abs(p - x) - half;
    if (i === 0 && p < x) return 1;
    if (i === 4 && p > x) return 1;
    return clamp(1 - d / 0.035, 0, 1);
  });
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);
const TAU = Math.PI * 2, DEG = Math.PI / 180;

/* ── who's who ── */
const F = 7, ORB = 7, SEAT = 8, CROWD = 9, NCL = 5, PER = 6, N = CROWD + NCL * PER;
const MENTOR = 1;
const TEAM_A = [0, 2, 4], TEAM_B = [1, 3, 5, 6];
const ROUND = [SEAT, 0, 4, 2, 6, 1, 5, 3]; // the order round the circle: the seat, then the seven
// A little irregularity, so the circle reads as people, not a clock face.
const JIT_A = [0, 6, -5, 4, -7, 3, -4, 5], JIT_R = [1, 0.95, 1.04, 0.97, 1.03, 0.96, 1.05, 0.98];
const key = (a: number, b: number) => (a < b ? a * 256 + b : b * 256 + a);
const ends = (k: number): [number, number] => [Math.floor(k / 256), k % 256];

interface Target { x: number; y: number; d: number; a: number; z: number } // centre (px), diameter (px), opacity, depth (−1 behind the orb … 1 in front)
interface Shot { T: Target[]; ties: Map<number, number>; near?: number[] } // near: who the ties are found among, by distance

/* ── the shots, laid out for the screen ── */
function geometry(W: number, H: number, clearTop: number) {
  const portrait = W < H * 0.9;
  const S = portrait ? Math.min(W, H * 0.56) : Math.min(H, W / 1.6); // the size everything scales from
  const at = (x: number, y: number, d: number, a = 1, z = 0.5): Target => ({ x, y, d, a, z });
  const team = (T: Target[], ids: number[], cx: number, cy: number, r: number, a0: number, d: number, a = 1) =>
    ids.forEach((f, j) => { const th = (a0 + (j * 360) / ids.length) * DEG; T[f] = at(cx + r * Math.cos(th), cy + r * Math.sin(th), d, a); });
  const ring = (ids: number[], w: number, m = new Map<number, number>()) => { ids.forEach((f, j) => m.set(key(f, ids[(j + 1) % ids.length]), w)); return m; };

  // Other Labs: small circles of people seen from far off (shot 3), each like the one we know, turned to face
  // the orb; elsewhere they fade where they are.
  const clusters: [number, number][] = portrait
    ? [[0.84, 0.15], [0.88, 0.43], [0.72, 0.57], [0.32, 0.16], [0.12, 0.31]]
    : [[0.86, 0.24], [0.9, 0.62], [0.74, 0.86], [0.47, 0.17], [0.24, 0.33]];
  const crowd = (T: Target[], a: number, ox: number, oy: number) => clusters.forEach(([fx, fy], c) => {
    const cx = fx * W, cy = fy * H, toward = Math.atan2(oy - cy, ox - cx), r = S * (portrait ? 0.06 : 0.036);
    for (let j = 0; j < PER; j++) {
      const th = toward + (j * TAU) / PER;
      T[CROWD + c * PER + j] = at(cx + r * Math.cos(th), cy + r * Math.sin(th), S * (portrait ? 0.03 : 0.015) * (j === 0 ? 1.25 : 1), a, 0.5);
    }
  });

  // The circle round the orb: seven people and a seat, seen a little from above, far enough out that nobody
  // passes behind or in front of the orb, and spaced evenly along it as you see it (so the sides don't
  // crowd). turn: where the seat is, as an angle; spin: how far the circle has turned since (0–1).
  const circle = (T: Target[], cx: number, cy: number, orbD: number, rx: number, ry: number, base: number, turn: number, spin: number, seatA: number) => {
    T[ORB] = at(cx, cy, orbD, 1, 0);
    const arc = ellipse(rx, ry), f0 = arc.frac(turn) + spin;
    ROUND.forEach((n, j) => {
      const th = arc.angle(f0 + j / ROUND.length + JIT_A[j] / 360), c = Math.cos(th), s = Math.sin(th);
      const q = at(cx + rx * JIT_R[j] * c, cy + ry * JIT_R[j] * s, base * (1 + 0.3 * s), 0.72 + 0.28 * ((s + 1) / 2), s);
      T[n] = n === SEAT ? { ...q, a: seatA } : q;
    });
  };
  const clearRy = (orbD: number, base: number) => (orbD / 2 + base * 0.65 + 8) / 0.95;

  // The hero's circle sits in the band below the title and its facts, scaled down if the band is short.
  const heroTop = Math.max(clearTop + H * 0.03, H * (portrait ? 0.36 : 0.46));
  const heroBot = H - (portrait ? 56 : H * 0.05);
  const band = Math.max(120, heroBot - heroTop);
  const hero = (() => {
    let base = S * (portrait ? 0.15 : 0.085), orbD = S * (portrait ? 0.3 : 0.2);
    const need = 2.1 * clearRy(orbD, base) + base, sc = Math.min(portrait ? 1.2 : 1, band / need); // a phone's tall band: a little bigger
    base *= sc; orbD *= sc;
    const ry = clearRy(orbD, base), rx = portrait ? W * 0.38 : Math.min(W * 0.36, W / 2 - base);
    const cy = heroTop + ry * 1.05 + base * 0.35 + Math.max(0, band - (2.1 * ry + base)) / 2;
    return { cx: W / 2, cy, orbD, rx, ry, base };
  })();
  const last = portrait
    ? (() => { const orbD = S * 0.3, base = S * 0.15; return { cx: W / 2, cy: H * 0.3, orbD, rx: W * 0.39, ry: clearRy(orbD, base), base }; })()
    : (() => { const orbD = S * 0.2, base = S * 0.085; return { cx: W * 0.65, cy: H * 0.5, orbD, rx: Math.min(W * 0.26, S * 0.46), ry: Math.max(clearRy(orbD, base), H * 0.2), base }; })();

  return (s: number, t: number, still: boolean): Shot => {
    const T: Target[] = new Array(N);
    const ties = new Map<number, number>();
    if (s === 0 || s === 4) {
      // The hero turns, slowly; the last shot holds still, with the seat front and left, beside the words.
      const c = s === 0 ? hero : last;
      circle(T, c.cx, c.cy, c.orbD, c.rx, c.ry, c.base, s === 0 ? 205 * DEG : 150 * DEG, s === 0 && !still ? t / 160 : 0, s === 4 ? 1 : 0);
      crowd(T, 0, c.cx, c.cy);
      return { T, ties, near: s === 4 ? [0, 1, 2, 3, 4, 5, 6, SEAT] : [0, 1, 2, 3, 4, 5, 6] };
    }
    if (s === 1) {
      const d = S * (portrait ? 0.2 : 0.105);
      T[ORB] = portrait ? at(W * 0.84, H * 0.17, S * 0.14, 1, 0) : at(W * 0.88, H * 0.2, S * 0.09, 1, 0);
      if (portrait) { team(T, TEAM_A, W * 0.3, H * 0.28, S * 0.19, -90, d); team(T, TEAM_B, W * 0.66, H * 0.53, S * 0.22, -125, d); }
      else { team(T, TEAM_A, W * 0.47, H * 0.38, S * 0.12, -90, d); team(T, TEAM_B, W * 0.72, H * 0.62, S * 0.14, -125, d); }
      ring(TEAM_A, 1, ties); ring(TEAM_B, 1, ties);
      ties.set(key(2, 1), 0.35); ties.set(key(0, ORB), 0.3); ties.set(key(3, ORB), 0.3);
    } else if (s === 2) {
      const [cx, cy] = portrait ? [W * 0.5, H * 0.36] : [W * 0.66, H * 0.48];
      T[ORB] = portrait ? at(W * 0.12, H * 0.14, S * 0.1, 1, 0) : at(W * 0.9, H * 0.18, S * 0.07, 1, 0);
      T[MENTOR] = at(cx, cy, S * (portrait ? 0.36 : 0.2));
      const learners = [3, 5, 6], r = S * (portrait ? 0.37 : 0.26);
      learners.forEach((f, j) => { const th = (-100 + j * 120) * DEG; T[f] = at(cx + r * Math.cos(th), cy + r * Math.sin(th), S * (portrait ? 0.25 : 0.14)); });
      // The other team steps back, out of the frame's light.
      team(T, TEAM_A, portrait ? W * 0.2 : W * 0.4, portrait ? H * 0.2 : H * 0.22, S * 0.1, -60, S * 0.06, 0);
      learners.forEach((f) => ties.set(key(MENTOR, f), 1));
      ring(learners, 0.35, ties);
    } else {
      const [cx, cy] = portrait ? [W * 0.3, H * 0.47] : [W * 0.38, H * 0.7];
      T[ORB] = portrait ? at(W * 0.62, H * 0.3, S * 0.26, 1, 0) : at(W * 0.62, H * 0.46, S * 0.15, 1, 0);
      team(T, [0, 1, 2, 3, 4, 5, 6], cx, cy, S * (portrait ? 0.12 : 0.075), -90, S * (portrait ? 0.085 : 0.05));
      ring([0, 1, 2, 3, 4, 5, 6], 0.8, ties);
      ties.set(key(up(T), ORB), 0.8);
      for (let c = 0; c < NCL; c++) {
        ties.set(key(ORB, CROWD + c * PER), 0.5);
        ring(Array.from({ length: PER }, (_, j) => CROWD + c * PER + j), 0.4, ties);
      }
    }
    if (s !== 3) crowd(T, 0, T[ORB].x, T[ORB].y);
    else crowd(T, 1, T[ORB].x, T[ORB].y);
    T[SEAT] = { ...T[ORB], d: S * 0.06, a: 0, z: 1 }; // the seat waits at the orb until it's yours
    return { T, ties };
  };
}
/** The one of the seven nearest the orb: the way an idea goes up. */
function up(T: Target[]) {
  let best = 0, bd = Infinity;
  for (let f = 0; f < F; f++) { const d = Math.hypot(T[f].x - T[ORB].x, T[f].y - T[ORB].y); if (d < bd) { bd = d; best = f; } }
  return best;
}
/** An ellipse's angle by how far round it you are (0–1, by length), and back. */
function ellipse(rx: number, ry: number) {
  const n = 360, len = [0];
  for (let i = 1; i <= n; i++) { const a = ((i - 1) / n) * TAU, b = (i / n) * TAU; len.push(len[i - 1] + Math.hypot(rx * (Math.cos(b) - Math.cos(a)), ry * (Math.sin(b) - Math.sin(a)))); }
  const P = len[n];
  return {
    angle(f: number) { const L = (((f % 1) + 1) % 1) * P; let lo = 0, hi = n; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (len[m] < L) lo = m; else hi = m; } return ((lo + (L - len[lo]) / Math.max(1e-6, len[hi] - len[lo])) / n) * TAU; },
    frac(th: number) { const u = ((((th / TAU) % 1) + 1) % 1) * n, i = Math.floor(u); return (len[i] + (len[Math.min(n, i + 1)] - len[i]) * (u - i)) / P; },
  };
}
/** How near the segment a–b passes to the point o. */
function passes(ax: number, ay: number, bx: number, by: number, ox: number, oy: number) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1, u = clamp(((ox - ax) * dx + (oy - ay) * dy) / L2, 0, 1);
  return Math.hypot(ax + dx * u - ox, ay + dy * u - oy);
}

/* ── the orb: the logo's, drawn once. Its three bands are latitude bands round one pole, fitted to
   orb-mark.png (rolled 22.5° left, tilted 15.4° toward you), coloured from the mark by latitude, lit from
   the upper left, with the brand's grain in the bands' edges. ── */
// The mark's colours by latitude: from the south pole (red) to the north (teal), 101 RGB steps.
const RAMP = "250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,40,27,249,40,27,249,40,26,248,39,26,247,38,26,245,38,26,244,37,26,242,36,26,240,36,26,238,35,27,235,34,26,232,33,26,229,32,26,226,32,26,222,31,26,218,30,26,214,29,26,209,29,27,204,28,27,199,27,27,193,27,27,187,26,27,180,26,28,173,25,28,166,25,28,158,24,28,150,24,28,141,23,28,132,23,29,123,23,29,114,22,29,105,22,30,97,22,30,88,21,30,80,21,30,72,21,30,65,21,31,59,21,31,52,21,31,46,21,31,40,21,31,35,22,31,30,22,31,26,22,31,23,23,32,19,23,32,16,24,33,13,25,34,11,26,35,10,25,34,9,24,32,9,22,30,8,22,30,6,22,30,5,22,31,4,22,31,3,23,32,2,23,32,2,24,33,1,25,33,1,26,34,1,27,36,2,29,37,2,31,39,2,33,42,3,36,44,3,38,46,4,41,48,5,43,51,5,47,54,6,51,58,7,55,62,8,61,67,9,67,73,10,74,80,11,82,87,12,90,96,13,100,105,14,110,114,15,120,124,16,130,133,16,140,143,16,149,152,16,159,161,16,167,169,16,176,177,15,184,185,14,193,193,13,201,200,12,207,206,11,210,208".split(",").map(Number);
function orbSprite(px: number): HTMLCanvasElement {
  const c = document.createElement("canvas"); c.width = c.height = px;
  const g = c.getContext("2d")!; const img = g.createImageData(px, px); const D = img.data;
  const roll = 22.5 * DEG, tilt = 15.4 * DEG;
  const pole = [-Math.sin(roll) * Math.cos(tilt), Math.cos(roll) * Math.cos(tilt), Math.sin(tilt)];
  const Lraw = [-0.45, 0.6, 0.66], Ll = Math.hypot(...Lraw), L = Lraw.map((v) => v / Ll);
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const R = px / 2 - 1;
  for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) {
    const nx = (x + 0.5 - px / 2) / R, ny = -(y + 0.5 - px / 2) / R, rr = nx * nx + ny * ny;
    if (rr > 1.004) continue;
    const nz = Math.sqrt(Math.max(0, 1 - rr));
    const d = nx * pole[0] + ny * pole[1] + nz * pole[2] + (rnd() - 0.5) * 0.2;
    const u = clamp((d + 1) / 2, 0, 1) * 100, i = Math.floor(u), f = u - i, j = Math.min(100, i + 1);
    const shade = (0.82 + 0.3 * Math.max(0, nx * L[0] + ny * L[1] + nz * L[2])) * (0.88 + 0.24 * rnd());
    const o = (y * px + x) * 4;
    for (let k = 0; k < 3; k++) D[o + k] = Math.min(255, lerp(RAMP[i * 3 + k], RAMP[j * 3 + k], f) * shade);
    D[o + 3] = 255 * clamp((1 - Math.sqrt(rr)) * R, 0, 1);
  }
  g.putImageData(img, 0, 0);
  return c;
}

/* ── the page's side ── */
export interface FrameState { p: number; beats: number[]; you: { x: number; y: number; r: number } | null; orb: { x: number; y: number; r: number }; paused: boolean }
export interface PeopleOptions { still?: boolean; story?: HTMLElement; stage?: HTMLElement; clear?: HTMLElement; faces?: string[]; onFrame?: (s: FrameState) => void }
export interface People { setPaused(v: boolean): void; paused(): boolean; setOrbHover(v: boolean): void; join(): void }

interface Body { x: number; y: number; vx: number; vy: number; d: number; a: number; z: number; flash: number }
interface Spark { a: number; b: number; t0: number; dur: number; then?: () => void }

/** Start the people in `wrap` (it gets `is-live` once it draws). */
export function mountPeople(wrap: HTMLElement, opts: PeopleOptions = {}): People | null {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const g: CanvasRenderingContext2D = ctx;
  wrap.appendChild(canvas);
  const still = Boolean(opts.still);
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // The portraits, drawn as they arrive.
  const imgs: (HTMLImageElement | null)[] = (opts.faces ?? []).slice(0, F).map((src) => {
    const im = new Image(); im.decoding = "async"; im.src = src;
    im.onload = () => { if (still || pausedFlag) draw(performance.now()); };
    return im;
  });

  /* sizing */
  let W = 1, H = 1, dpr = 1, lay = geometry(1, 1, 0), orbImg: HTMLCanvasElement | null = null, orbPx = 0;
  const resize = () => {
    W = wrap.clientWidth; H = wrap.clientHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const clear = opts.clear ? opts.clear.offsetTop + opts.clear.offsetHeight : 0;
    lay = geometry(W, H, clear);
    // The orb's sprite, big enough for its largest shot.
    const want = Math.min(1024, Math.ceil((0.42 * Math.min(W, H) * dpr) / 64) * 64);
    if (want > orbPx) { orbPx = want; orbImg = orbSprite(orbPx); }
    if (still) settle();
    if (still || pausedFlag) draw(performance.now());
  };

  /* inputs */
  const ptr = { x: -1e4, y: -1e4, inside: false, quiet: false, amt: 0 };
  let scrollP = 0, scrollE = 0, pausedFlag = false, orbHoverT = 0, orbHover = 0;
  if (!still && fine) {
    // Over the page's own words and buttons (anything marked data-quiet, while it's showing) the people take
    // no notice of you, so they never compete with what you're reading.
    let quietEls: HTMLElement[] | null = null;
    const shown = (el: HTMLElement) => { let op = 1; for (let x: HTMLElement | null = el; x && x !== document.body; x = x.parentElement) if (x.style.opacity) op = Math.min(op, parseFloat(x.style.opacity)); return op > 0.2; };
    const inQuiet = (x: number, y: number) => (quietEls ??= [...document.querySelectorAll<HTMLElement>("[data-quiet]")]).some((el) => {
      if (!shown(el)) return false;
      const q = el.getBoundingClientRect();
      return q.width > 0 && x > q.left - 24 && x < q.right + 24 && y > q.top - 14 && y < q.bottom + 14;
    });
    window.addEventListener("pointermove", (e) => {
      const r = wrap.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top;
      ptr.inside = ptr.x >= 0 && ptr.y >= 0 && ptr.x <= r.width && ptr.y <= r.height;
      ptr.quiet = inQuiet(e.clientX, e.clientY);
    }, { passive: true });
    (opts.stage ?? wrap).addEventListener("pointerleave", () => { ptr.inside = false; });
  }
  const readScroll = () => {
    if (!opts.story) return;
    const r = opts.story.getBoundingClientRect();
    scrollP = clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1);
  };
  if (!still) window.addEventListener("scroll", readScroll, { passive: true });
  readScroll();

  /* the model */
  const B: Body[] = Array.from({ length: N }, () => ({ x: 0, y: 0, vx: 0, vy: 0, d: 0, a: 0, z: 0, flash: 0 }));
  const near = [new Map<number, number>(), new Map<number, number>()]; // the hero's and the last shot's ties, found by distance, eased in and out
  const sparks: Spark[] = [];
  const ripples: number[] = [];
  let mentorW = 0, t = 0, introT = still ? 99 : 0, nextSpark = 2.2, shotNow = 0, lastBeat = 0, joinT = -99, orbFlash = 0, round = 0;
  let born = false;

  // Where everyone should be at progress p: between two shots, held still near each one.
  const blend = (p: number) => {
    let i = 0; while (i < SHOT_AT.length - 2 && p > SHOT_AT[i + 1]) i++;
    const a = SHOT_AT[i], b = SHOT_AT[i + 1], hold = 0.05;
    const k = ease(clamp((p - a - hold) / (b - a - 2 * hold), 0, 1));
    const all = SHOT_AT.map((_, s) => lay(s, t, still));
    return { i, k, all, A: all[i], B: all[i + 1] };
  };
  const settle = () => { const { A } = blend(0); A.T.forEach((q, n) => Object.assign(B[n], { x: q.x, y: q.y, d: q.d, a: q.a, z: q.z })); born = true; };

  // Ties found by distance: each of the people reaches for the nearest two (never across the orb), and the
  // three nearest the orb reach for it. They ease in and out as people move.
  const reach = (m: Map<number, number>, T: Target[], who: number[], dt: number) => {
    const want = new Map<number, number>(), max = Math.max(W, H) * 0.3, o = T[ORB], clear = o.d / 2 + 6;
    const here = who.filter((i) => T[i].a >= 0.05);
    for (const i of here) {
      here.filter((j) => j !== i).map((j) => [Math.hypot(T[i].x - T[j].x, T[i].y - T[j].y), j])
        .filter(([d, j]) => d < max && passes(T[i].x, T[i].y, T[j].x, T[j].y, o.x, o.y) > clear)
        .sort((x, y) => x[0] - y[0]).slice(0, 2).forEach(([, j]) => want.set(key(i, j), 1));
    }
    here.map((i) => [Math.hypot(T[i].x - o.x, T[i].y - o.y), i]).sort((x, y) => x[0] - y[0]).slice(0, 3).forEach(([, i]) => want.set(key(i, ORB), 0.45));
    want.forEach((_, k) => { if (!m.has(k)) m.set(k, still ? want.get(k)! : 0); });
    m.forEach((v, k) => { const w = want.get(k) ?? 0; const nv = still ? w : v + (w - v) * Math.min(1, dt * 1.4); if (nv < 0.005 && !w) m.delete(k); else m.set(k, nv); });
  };

  const tiesNow = new Map<number, number>();
  const step = (dt: number, p: number, simDt: number) => {
    const { i, k, all, A, B: Bs } = blend(p);
    const wA = 1 - k, wB = k;
    shotNow = k < 0.5 ? i : i + 1;
    mentorW = i === 2 ? wA : i + 1 === 2 ? wB : 0;
    // Both orbits keep finding their ties, on screen or not, so they're right when you scroll back.
    reach(near[0], all[0].T, all[0].near!, dt); reach(near[1], all[4].T, all[4].near!, dt);
    // The ties on screen: each shot's, weighted by how much of it is showing.
    tiesNow.clear();
    const addTies = (s: Shot, w: number, idx: number) => {
      if (w <= 0) return;
      s.ties.forEach((v, kk) => tiesNow.set(kk, (tiesNow.get(kk) ?? 0) + v * w));
      if (s.near) near[idx === 0 ? 0 : 1].forEach((v, kk) => tiesNow.set(kk, (tiesNow.get(kk) ?? 0) + v * w));
    };
    addTies(A, wA, i); addTies(Bs, wB, i + 1);
    // Joining: for a moment, The Labs reaches every one of them.
    const jk = clamp(1 - (t - joinT) / 1.8, 0, 1);
    if (jk > 0) for (let f = 0; f < F; f++) tiesNow.set(key(f, ORB), Math.max(tiesNow.get(key(f, ORB)) ?? 0, jk));

    // The pointer: present when it's over the people, not over words or the orb.
    ptr.amt = lerp(ptr.amt, ptr.inside && !ptr.quiet && orbHoverT < 0.5 && !still ? 1 : 0, Math.min(1, dt * 5));
    const reachR = Math.min(W, H) * 0.3;
    const ox = lerp(A.T[ORB].x, Bs.T[ORB].x, k), oy = lerp(A.T[ORB].y, Bs.T[ORB].y, k);
    // Everyone eases toward their place on a spring, so they carry some weight (the big ones more), leaning
    // a little toward your cursor; the intro sends them out from the orb, one by one.
    for (let n = 0; n < N; n++) {
      const qa = A.T[n], qb = Bs.T[n], b = B[n];
      let tx = lerp(qa.x, qb.x, k), ty = lerp(qa.y, qb.y, k);
      const td = lerp(qa.d, qb.d, k), ta = lerp(qa.a, qb.a, k), tz = lerp(qa.z, qb.z, k);
      const person = n < F || n === SEAT;
      if (person && !still) { tx += Math.cos(t * 0.5 + n * 2.1) * S1() * 2.5; ty += Math.sin(t * 0.7 + n * 1.3) * S1() * 3.5; }
      if (person && ptr.amt > 0.01) {
        const dx = ptr.x - tx, dy = ptr.y - ty, d = Math.hypot(dx, dy);
        if (d < reachR && d > 1) { const f = 22 * Math.pow(1 - d / reachR, 2) * ptr.amt; tx += (dx / d) * f; ty += (dy / d) * f; }
      }
      const out = n < F ? clamp((introT - 0.35 - n * 0.09) / 0.7, 0, 1) : n === SEAT ? clamp((introT - 1.2) / 0.8, 0, 1) : 1;
      if (!born) Object.assign(b, n >= CROWD ? { x: tx, y: ty, d: td, a: 0, z: tz } : { x: ox, y: oy, d: 0, a: 0, z: 0 });
      if (n < F && out < 0.02) { b.x = ox; b.y = oy; b.vx = b.vy = 0; }
      const K = 26, m = 1 + td / 220, C = 2 * 0.8 * Math.sqrt(K);
      b.vx += ((K * (tx - b.x) - C * b.vx) / m) * dt; b.vy += ((K * (ty - b.y) - C * b.vy) / m) * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      const e = Math.min(1, dt * 5);
      b.d = lerp(b.d, td * (n < F ? 0.4 + 0.6 * out : 1), e); b.a = lerp(b.a, ta * out, e); b.z = lerp(b.z, tz, e);
      b.flash *= Math.exp(-simDt * 1.5);
    }
    born = true;
    orbFlash *= Math.exp(-simDt * 1.8);

    // Ideas, one at a time: each shot passes them its own way.
    if (simDt > 0 && introT > 2.4) {
      if (shotNow !== lastBeat) { lastBeat = shotNow; nextSpark = t + 0.6; }
      if (t >= nextSpark && sparks.length < 6) spawn(shotNow);
    }
    sparks.forEach((s) => { if (t >= s.t0 + s.dur) { B[s.b].flash = 1; if (s.b === ORB) orbFlash = Math.max(orbFlash, 0.6); s.then?.(); } });
    for (let j = sparks.length - 1; j >= 0; j--) if (t >= sparks[j].t0 + sparks[j].dur) sparks.splice(j, 1);
  };
  const S1 = () => Math.min(W, H) / 800;
  const lit = (a: number, b: number) => (tiesNow.get(key(a, b)) ?? 0) > 0.5 && B[a].a > 0.4 && B[b].a > 0.4;
  const send = (a: number, b: number, delay = 0, dur = 1.1, then?: () => void) => { sparks.push({ a, b, t0: t + delay, dur, then }); };
  const spawn = (s: number) => {
    round++;
    if (s === 2) {
      // The mentor, to each of the others in turn.
      const to = [3, 5, 6][round % 3];
      if (lit(MENTOR, to)) send(MENTOR, to, 0, 1.0);
      nextSpark = t + 1.8;
    } else if (s === 3) {
      // Up from the team to The Labs, and out from it to other Labs.
      const f = [...tiesNow.keys()].map(ends).find(([x, y]) => (x === ORB || y === ORB) && (x < F || y < F));
      if (f) {
        const from = f[0] === ORB ? f[1] : f[0];
        send(from, ORB, 0, 1.0, () => { for (let c = 0; c < NCL; c++) { const d0 = CROWD + c * PER; send(ORB, d0, c * 0.06, 1.2, () => { send(d0, d0 + 1, 0, 0.6); send(d0, d0 + PER - 1, 0, 0.6); }); } });
      }
      nextSpark = t + 5.2;
    } else {
      // Anywhere along a tie between two people.
      const list = [...tiesNow.entries()].filter(([kk, v]) => { const [a, b] = ends(kk); return v > 0.5 && a < F && (b < F || b === SEAT) && B[a].a > 0.4 && B[b].a > 0.4; });
      if (list.length) {
        const [kk] = list[round * 7 % list.length]; const [a, b] = ends(kk);
        if (round % 2) send(a, b, 0, 1.1); else send(b, a, 0, 1.1);
      }
      nextSpark = t + (s === 1 ? 1.5 : 2.6);
    }
  };

  /* drawing */
  const edge = (a: Body, b: Body) => {
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const ra = a.d / 2 + 4, rb = b.d / 2 + 4;
    return L > ra + rb ? { x0: a.x + ux * ra, y0: a.y + uy * ra, x1: b.x - ux * rb, y1: b.y - uy * rb, ux, uy } : null;
  };
  const drawFace = (n: number) => {
    const b = B[n]; if (b.a < 0.01 || b.d < 2) return;
    const r = b.d / 2;
    g.save(); g.globalAlpha = b.a;
    g.beginPath(); g.arc(b.x, b.y, r, 0, TAU); g.closePath();
    const im = imgs[n];
    if (im && im.complete && im.naturalWidth) { g.save(); g.clip(); g.drawImage(im, b.x - r, b.y - r, r * 2, r * 2); g.restore(); }
    else { g.fillStyle = "rgba(0,148,160,0.35)"; g.fill(); }
    g.lineWidth = 1; g.strokeStyle = "rgba(255,255,255,0.22)"; g.stroke();
    // The mentor, close up: a second, finer ring.
    if (n === MENTOR && mentorW > 0.01) { g.beginPath(); g.arc(b.x, b.y, r + 8, 0, TAU); g.lineWidth = 1; g.strokeStyle = `rgba(90,235,228,${0.6 * mentorW})`; g.stroke(); }
    // An idea arriving: the ring lights, teal.
    if (b.flash > 0.02) {
      g.beginPath(); g.arc(b.x, b.y, r + 1.5, 0, TAU); g.lineWidth = 2; g.strokeStyle = `rgba(90,235,228,${0.9 * b.flash})`; g.stroke();
      g.beginPath(); g.arc(b.x, b.y, r + 5, 0, TAU); g.lineWidth = 4; g.strokeStyle = `rgba(0,190,200,${0.22 * b.flash})`; g.stroke();
    }
    g.restore();
  };
  const drawSeat = () => {
    const b = B[SEAT]; if (b.a < 0.01) return;
    const r = b.d / 2, br = 0.5 + 0.5 * Math.sin(t * 1.4);
    g.save(); g.globalAlpha = b.a;
    g.beginPath(); g.arc(b.x, b.y, r, 0, TAU);
    g.fillStyle = `rgba(0,148,160,${0.1 + 0.08 * br + 0.3 * b.flash})`; g.fill();
    g.setLineDash([4, 5]); g.lineDashOffset = -t * 6; g.lineWidth = 1.5; g.strokeStyle = "rgba(255,255,255,0.6)"; g.stroke();
    g.restore();
  };
  const drawOrb = () => {
    const b = B[ORB]; if (!orbImg || b.d < 2) return;
    const r = (b.d / 2) * (1 + 0.04 * orbHover), glow = 0.16 + 0.12 * orbHover + 0.25 * orbFlash;
    g.save(); g.globalAlpha = b.a;
    // A soft light round it, teal above and red below, as in the mark.
    const halo = (x: number, y: number, R: number, c: string, a: number) => { const q = g.createRadialGradient(x, y, r * 0.6, x, y, R); q.addColorStop(0, `rgba(${c},${a})`); q.addColorStop(1, `rgba(${c},0)`); g.fillStyle = q; g.fillRect(x - R, y - R, R * 2, R * 2); };
    halo(b.x - r * 0.25, b.y - r * 0.3, r * 2.1, "0,160,170", glow);
    halo(b.x + r * 0.3, b.y + r * 0.35, r * 1.7, "214,44,52", glow * 0.55);
    g.imageSmoothingQuality = "high";
    g.drawImage(orbImg, b.x - r, b.y - r, r * 2, r * 2);
    g.restore();
  };
  const drawCrowd = () => {
    for (let n = CROWD; n < N; n++) {
      const b = B[n]; if (b.a < 0.01) continue;
      g.beginPath(); g.arc(b.x, b.y, b.d / 2, 0, TAU);
      g.fillStyle = `rgba(${lerp(0, 120, b.flash)},${lerp(148, 240, b.flash)},${lerp(160, 235, b.flash)},${0.85 * b.a})`; g.fill();
      g.lineWidth = 1; g.strokeStyle = `rgba(255,255,255,${0.28 * b.a})`; g.stroke();
    }
  };

  function draw(now: number) {
    const rdt = Math.min(0.05, Math.max(0, (now - lastNow) / 1000)); lastNow = now;
    const simDt = still || pausedFlag ? 0 : rdt;
    t += simDt; if (!still) introT += rdt;
    scrollE = still ? 0 : lerp(scrollE, scrollP, 1 - Math.pow(0.9, rdt * 60));
    orbHover = lerp(orbHover, orbHoverT, Math.min(1, rdt * 8));
    const p = scrollE, beats = beatWeights(p);
    step(still ? 0 : rdt, p, simDt);

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    // Ties: fine lines, edge to edge.
    g.lineWidth = 1; g.lineCap = "round";
    tiesNow.forEach((v, kk) => {
      const [a, b] = ends(kk); const A = B[a], Bb = B[b];
      const al = v * Math.min(A.a, Bb.a); if (al < 0.01) return;
      const e = edge(A, Bb); if (!e) return;
      g.strokeStyle = `rgba(170,232,228,${(0.34 * al).toFixed(3)})`;
      g.beginPath(); g.moveTo(e.x0, e.y0); g.lineTo(e.x1, e.y1); g.stroke();
    });
    drawCrowd();
    const faces = [0, 1, 2, 3, 4, 5, 6].sort((x, y) => B[x].z - B[y].z);
    faces.filter((f) => B[f].z < 0).forEach(drawFace);
    if (B[SEAT].z < 0) drawSeat();
    drawOrb();
    faces.filter((f) => B[f].z >= 0).forEach(drawFace);
    if (B[SEAT].z >= 0) drawSeat();
    // Your cursor: the nearest two reach for it.
    if (ptr.amt > 0.02) {
      const R = Math.min(W, H) * 0.3;
      [0, 1, 2, 3, 4, 5, 6].map((f) => [Math.hypot(B[f].x - ptr.x, B[f].y - ptr.y), f]).filter(([d, f]) => d < R && B[f].a > 0.3).sort((x, y) => x[0] - y[0]).slice(0, 2).forEach(([d, f]) => {
        const b = B[f], ux = (ptr.x - b.x) / d, uy = (ptr.y - b.y) / d, r = b.d / 2 + 4;
        if (d < r + 6) return;
        g.strokeStyle = `rgba(170,232,228,${(0.4 * (1 - d / R) * ptr.amt).toFixed(3)})`;
        g.beginPath(); g.moveTo(b.x + ux * r, b.y + uy * r); g.lineTo(ptr.x - ux * 5, ptr.y - uy * 5); g.stroke();
      });
      g.beginPath(); g.arc(ptr.x, ptr.y, 2.5, 0, TAU); g.fillStyle = `rgba(120,240,232,${0.75 * ptr.amt})`; g.fill();
    }
    // Sparks: a bright point with a short tail, riding the tie.
    for (const s of sparks) {
      if (t < s.t0) continue;
      const al = Math.min(B[s.a].a, B[s.b].a); if (al < 0.05) continue;
      const e = edge(B[s.a], B[s.b]); if (!e) continue;
      const u = ease(clamp((t - s.t0) / s.dur, 0, 1));
      g.globalAlpha = al;
      const x = lerp(e.x0, e.x1, u), y = lerp(e.y0, e.y1, u), L = Math.min(34, Math.hypot(e.x1 - e.x0, e.y1 - e.y0) * u);
      const tail = g.createLinearGradient(x, y, x - e.ux * L, y - e.uy * L);
      tail.addColorStop(0, "rgba(200,255,250,0.85)"); tail.addColorStop(1, "rgba(200,255,250,0)");
      g.strokeStyle = tail; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x - e.ux * L, y - e.uy * L); g.stroke();
      const q = g.createRadialGradient(x, y, 0, x, y, 12); q.addColorStop(0, "rgba(120,255,245,0.5)"); q.addColorStop(1, "rgba(120,255,245,0)");
      g.fillStyle = q; g.fillRect(x - 12, y - 12, 24, 24);
      g.beginPath(); g.arc(x, y, 2.3, 0, TAU); g.fillStyle = "#EFFFFD"; g.fill();
      g.lineWidth = 1; g.globalAlpha = 1;
    }
    // Joining: a ring goes out from the orb.
    for (const r0 of ripples) {
      const age = (now - r0) / 1000; if (age > 1.4) continue;
      const o = B[ORB];
      g.beginPath(); g.arc(o.x, o.y, o.d / 2 + age * Math.max(W, H) * 0.55, 0, TAU);
      g.lineWidth = 1.5; g.strokeStyle = `rgba(120,240,232,${(0.5 * (1 - age / 1.4)).toFixed(3)})`; g.stroke();
    }

    if (!wrap.classList.contains("is-live")) wrap.classList.add("is-live");
    const seat = B[SEAT];
    opts.onFrame?.({
      p, beats, paused: pausedFlag,
      you: beats[4] > 0.5 && seat.a > 0.5 ? { x: seat.x, y: seat.y, r: seat.d / 2 } : null,
      orb: { x: B[ORB].x, y: B[ORB].y, r: (B[ORB].d / 2) * (1 + 0.04 * orbHover) },
    });
  }
  let lastNow = performance.now();

  new ResizeObserver(() => resize()).observe(wrap);
  resize();
  if (still) { draw(performance.now()); return { setPaused() {}, paused: () => true, setOrbHover() {}, join() {} }; }

  let on = false, raf = 0, visible = false;
  const loop = (now: number) => { draw(now); raf = on ? requestAnimationFrame(loop) : 0; };
  const setOn = (v: boolean) => { if (v === on) return; on = v; if (on && !raf) { readScroll(); lastNow = performance.now(); raf = requestAnimationFrame(loop); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; setOn(visible && !document.hidden); }).observe(wrap);
  document.addEventListener("visibilitychange", () => setOn(visible && !document.hidden));
  return {
    setPaused(v: boolean) { pausedFlag = v; },
    paused: () => pausedFlag,
    setOrbHover(v: boolean) { orbHoverT = v ? 1 : 0; },
    // Joining: the orb flares, a ring goes out, and The Labs reaches every one of them at once.
    join() {
      joinT = t; orbFlash = 1; ripples.push(performance.now());
      for (let f = 0; f < F; f++) if (B[f].a > 0.3) send(ORB, f, 0.05 + f * 0.04, 0.7);
    },
  };
}

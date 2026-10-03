/* The Labs, live: the world of the home page's journey, a model of how The Labs works that you scroll
   through, while its one motif changes shape: the system, the weave, each path's thread, the weave, the
   system.

   What it models. The Upskilling Labs as a federated, practice-based research
   network: local Labs where people learn by building, a commons of contributors
   and shared knowledge that ties them together, and the national Labs at the
   centre. It's drawn the way actor-network theory sees an organisation: no given
   scale, only actors and their ties. People, places (the libraries), projects and
   knowledge (playbooks, code) are all actors, each its own mark:
     people     a pearl dot         places     a teal square
     projects   a red diamond       knowledge  a gold ring
   These are the page's glyphs too, in the pins' materials: the three paths
   joining opens wear the same colours (learn teal, build red, share gold), so
   the model, the emblem, the weave and the gems are one visual language. The
   metal is gold, the norm: everyone comes in through their own Lab, and gold is
   the regional metal; the Labs' orbits are gold dust. Silver belongs to the
   national org alone, so it shows only at the centre: the commons round the orb
   (its dust, its knowledge, the ties into it), the orb's wave, and what the orb
   sends out to every Lab. Its meaning is there to be discovered later.
   A Lab is nothing but its ties, and the whole behaves like a complex adaptive
   system: newcomers drift in and are pulled into the Lab with the strongest pull
   near them, new ties form as ideas spread, and it never stops rearranging.

   Gravity is the density of relationships. A Lab's mass is its ties, so a dense
   Lab pulls harder: its actors orbit tighter and faster, it draws in more
   newcomers, it glows, and it bends the orbits beneath it into a deeper well.
   Dense enough, a Lab closes into a small orb of its own: a network so held
   together it reads as one thing. The Labs' orb, the logo's, is the deepest well.

   Innovation arrives as jolts of energy, on a heartbeat, and its colours tell
   the three paths in order. A project makes something new and a spark runs
   out along its ties (red: build); the big ones find their way up through a
   contributor to the orb (teal: what was learned). The orb flares, a silver wave
   crosses the orbits, and the idea comes back down (silver: the national org's
   official version) to every
   Lab tied to the commons, where it spreads again. Sparks strengthen the ties they
   cross, adopters form new ties, and what reaches the orb leaves new knowledge
   in the commons. Everything leaves a fading trail along its orbit.

   The three paths are three of the system's own orbits (STRAND_VS). An orbit carried on through time is a
   helix: as the journey moves on they're drawn down out of the plane into a vortex beneath the orb that
   narrows into one triple helix; the camera travels down it, each path's own thread in turn, and carries on
   down: the helix opens out again round the system's orb one cycle on, below, and the three paths coil into
   its orbits (SPOOL). Nothing climbs back or rewinds: the journey only ever goes down (SHOTS). At the very
   end the paths pour into those orbits and the system gives way to the logo: everything but the orb fades,
   and the three paths fly together into its swoosh (src/scripts/swoosh.ts); then the world lets go (settle)
   as the page lays the brand's own lockup exactly over the orb.

   To make it legible, anything in it can be asked what it is: point at an
   actor (or tap it) and a card says what it is and what it's doing here, while
   it lights up with its ties and whoever they reach, and its Lab steps forward.
   Point at a Lab and the card says which. Nothing follows your cursor.

   The orb is the logo's: its three bands are latitude bands round one pole,
   fitted to orb-mark.png (rolled 22.5° left, tilted 15.4° toward the viewer),
   coloured from the mark by latitude, with the mark's grain.

   Rendering: plain WebGL 2, no library. The model runs on the CPU; each frame
   its actors' positions and states go to the GPU as small float textures, and
   everything else (actors, ties, trails) reads them there, drawn as soft,
   feathered marks into a high-range buffer. A finishing pass adds bloom (so
   sparks read as light), a gentle shoulder that keeps the brand colours, the
   brand's grain only where there's light, a touch of chromatic fringing and
   the shockwave. It's composited over the page with screen blending, so the
   title sits inside the light. Quality adapts to the device's frame rate; it
   draws only while on screen; reduced motion gets one still frame; without
   WebGL 2 the poster stays. */

import { SWOOSH, SWOOSH_N } from "./swoosh";

// The mark's colours by latitude: d = n·pole from -1 (south) to 1 (north), 101 RGB steps.
const RAMP = "250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,40,27,249,40,27,249,40,26,248,39,26,247,38,26,245,38,26,244,37,26,242,36,26,240,36,26,238,35,27,235,34,26,232,33,26,229,32,26,226,32,26,222,31,26,218,30,26,214,29,26,209,29,27,204,28,27,199,27,27,193,27,27,187,26,27,180,26,28,173,25,28,166,25,28,158,24,28,150,24,28,141,23,28,132,23,29,123,23,29,114,22,29,105,22,30,97,22,30,88,21,30,80,21,30,72,21,30,65,21,31,59,21,31,52,21,31,46,21,31,40,21,31,35,22,31,30,22,31,26,22,31,23,23,32,19,23,32,16,24,33,13,25,34,11,26,35,10,25,34,9,24,32,9,22,30,8,22,30,6,22,30,5,22,31,4,22,31,3,23,32,2,23,32,2,24,33,1,25,33,1,26,34,1,27,36,2,29,37,2,31,39,2,33,42,3,36,44,3,38,46,4,41,48,5,43,51,5,47,54,6,51,58,7,55,62,8,61,67,9,67,73,10,74,80,11,82,87,12,90,96,13,100,105,14,110,114,15,120,124,16,130,133,16,140,143,16,149,152,16,159,161,16,167,169,16,176,177,15,184,185,14,193,193,13,201,200,12,207,206,11,210,208";

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
const tr = (m: M3): M3 => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
const apply = (m: M3, v: V3): V3 => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => t * t * (3 - 2 * t);
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function mulberry(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ── the story's shots: where the camera is at each beat ── */

interface Shot { at: number; target: "orb" | "dc" | "between" | "pod" | "new"; ty?: number; halfW: number; elev: number; roll: number; oElev: number; oRoll: number; yaw: number; sx: number; sy: number; px: number; py: number; pz?: number } // pz: how much closer a portrait screen frames it (0.6)
/* One world for the whole journey: each shot is a scene the page anchors (OrbNetOptions.anchors, in order),
   and the camera travels through them as you scroll, never stopping: every bit of scroll moves the world, so
   you can feel yourself going forward. It only slows (never quite stops) at the few moments that matter most
   (PAUSE), and comes to rest at the very end, on the logo.

   And it only ever goes one way: down. The motif changes shape as it goes (the system, the weave, each
   thread, the next system), but nothing is undone on the way back to the system: the camera never climbs
   back up the weave and the weave never retracts. It carries on down instead, and coils into the system
   again below, one cycle on (SPOOL: how far below). So the second half of the journey is the next cycle,
   not the first one rewound. Every value the camera follows runs one way for the whole journey: the target
   down (ty), the view sinking towards the orbits' plane (elev), the picture turning one way (roll), and the
   world turning steadily the way its orbits turn (SPIN, never back), with no swings from side to side. The
   framing only zooms out where the descent outweighs it. Where the weave or a thread holds the screen, the
   camera looks along the orbits' plane, so the system rises out of frame and the thread is the picture. On
   wide screens the picture sits right of centre and the words beside it on the left; on portrait screens it
   sits high and the words below. Nothing is ever laid over it. */
const SYS = { oElev: 15.4, oRoll: 22.5 };
/** How far below the first system the next one sits: the weave's whole length (the strand shader's LEN). */
const SPOOL = 70;
/** How far the world turns, all told, over the journey: one way, the way its orbits turn (degrees). */
const SPIN = 150;
/** The weave's helix, shared by its shader (STRAND_VS) and the stories told on it: its turns, its length (the
   spool from one system's orbits to the next's), where its orbits sit under the plane, and how tight its
   turns are as it leaves its orbit (U0) and as it lands in the next (U1); and how much of each path is
   that next orbit (RING), so it's whole. */
const HELIX = { TURNS: 26, LEN: SPOOL, Y0: -0.62, U0: 0.021, U1: 0.05, RING: 0.12 };
// Down the weave: each of a path's scenes sits a little further down the helix's axis (ty), so the camera
// travels down its thread as the page goes on, and the system rises out of frame.
const down = (ty: number): Shot => ({ at: 0, target: "orb", ty, halfW: 6.6, elev: 2, roll: 1.5, ...SYS, yaw: 0, sx: 0.36, sy: 0, px: 0, py: 0.45, pz: 0.6 });
const next = (s: Partial<Shot>): Shot => ({ at: 0, target: "orb", ty: -SPOOL, halfW: 7, elev: 30, roll: 0, ...SYS, yaw: 0, sx: 0.4, sy: 0.08, px: 0, py: 0.56, pz: 0.62, ...s });
const SHOTS: Shot[] = [
  { at: 0, target: "orb", halfW: 7.1, elev: 38, roll: 24, ...SYS, yaw: 0, sx: 0, sy: -0.27, px: 0, py: -0.2, pz: 0.74 },     // 0  the whole system, under the title
  { at: 0, target: "orb", halfW: 7, elev: 28, roll: 16, ...SYS, yaw: 0, sx: 0.42, sy: 0.04, px: 0, py: 0.56, pz: 0.75 },     // 1  the system, beside what this is: the first scroll sinks towards it as it turns
  { at: 0, target: "orb", ty: -0.4, halfW: 6.6, elev: 21, roll: 11, ...SYS, yaw: 0, sx: 0.4, sy: 0.04, px: 0, py: 0.56, pz: 0.7 }, // 2  close on the centre: where it started
  { at: 0, target: "orb", ty: -3.4, halfW: 6.6, elev: 9, roll: 4, ...SYS, yaw: 0, sx: 0.36, sy: 0.03, px: 0, py: 0.42, pz: 0.6 }, // 3  the weave, drawn down out of the orbits
  down(-9), down(-13.4), down(-17.8),                                                                              // 4–6  learn: its thread; open workshops; this week
  down(-22.2), down(-26.6), down(-31), down(-35.4), down(-39.8), down(-44.2),                                      // 7–12 build: its thread; a Pod; teams; a knot; the Showcase; the next cycle
  down(-48.6),                                                                                                     // 13 share: contributions flowing down its thread
  next({ halfW: 7.4, elev: 42, roll: 0, py: 0.5, pz: 0.6 }),                                                                // 14 the next system's centre: what was shared, curated, sent out to every Lab
  next({ halfW: 7.3, elev: 38, roll: -1, py: 0.52, pz: 0.6 }),                                                              // 15 it keeps getting better: the weave feeding the next cycle
  next({ halfW: 7.2, elev: 34, roll: -2, sx: 0.42, pz: 0.6 }),                                                    // 16 the system: every Lab, one network, a new one born
  next({ target: "new", halfW: 5.6, elev: 30, roll: -3, pz: 0.66 }),                                                 // 17 close on the new Lab: its first people gather, the kit reaches it
  next({ halfW: 5.4, elev: 27, roll: -4, sx: 0.5, pz: 0.66 }),                                                    // 18 the close
  next({ halfW: 4.8, elev: 24, roll: -5, sx: -0.36, sy: 0.08, px: -0.56, py: 0.36, pz: 0.656 }),                    // 19 the very end: the logo, the wordmark beside it
];
/** Which scenes are which, by index: the system's, the weave's, and each path's (for the motif and the story). */
const SCENE = { system: [0, 1, 2, 16, 17, 18, 19], weave: [3, 15], learn: [4, 5, 6], build: [7, 8, 9, 10, 11, 12], share: [13, 14], workshops: 5, pod: 8, teams: 9, stuck: 10, showcase: 11, flowing: 13, centre: 14, born: 16, found: 17, close: 18, end: 19 };
/** The pauses, for emphasis, and only these: how much the camera slows as it passes each (1 would stop it).
   The triad, the centre (the official version going out to every Lab) and the close; then the logo, where it
   comes to rest. */
const PAUSE: Record<number, number> = { 3: 0.65, [SCENE.centre]: 0.65, [SCENE.close]: 0.6, [SCENE.end]: 1 };
/** Scroll within one stretch between two scenes (f, 0 … 1) to the way along it: steady, but easing off into a
   pause and out of one (s0, s1: how fast it's going at each end, 1 = steady). Never backwards, never still. */
const glide = (f: number, s0: number, s1: number) => { const f2 = f * f, f3 = f2 * f; return 3 * f2 - 2 * f3 + s0 * (f3 - 2 * f2 + f) + s1 * (f3 - f2); };
/** A camera value through four shots in a row (b at k = 0, c at k = 1): a smooth curve through every shot
   (no stop-and-start at each, as easing from one to the next would give), that never overshoots: a value only
   comes to rest where it turns back. `first`: a is the first shot, so the curve leaves it already moving. */
const through = (a: number, b: number, c: number, d: number, k: number, first: boolean) => {
  const m = (p: number, q: number, r: number) => { const d0 = q - p, d1 = r - q; return d0 * d1 <= 0 ? 0 : (2 * d0 * d1) / (d0 + d1); };
  const mb = first ? c - b : m(a, b, c), mc = m(b, c, d), k2 = k * k, k3 = k2 * k;
  return (2 * k3 - 3 * k2 + 1) * b + (k3 - 2 * k2 + k) * mb + (3 * k2 - 2 * k3) * c + (k3 - k2) * mc;
};
SHOTS.forEach((s, i) => { s.at = i / (SHOTS.length - 1); });
/** How much each shot is on screen at page progress p (0 … 1). */
export function shotWeights(p: number): number[] {
  const s = p * (SHOTS.length - 1);
  return SHOTS.map((_, k) => clamp(1 - Math.abs(s - k), 0, 1));
}

/* ── the model ── */

const HUMAN = 0, PLACE = 1, PROJECT = 2, KNOW = 3;
const MAX_NODES = 2600, MAX_EDGES = 9000, MAX_PULSES = 480, TAIL = 7, TEXW = 64;
/** The local Labs: [orbit radius, angle°, actors]. The first is DC, the one that's lit today. */
const LABS: [number, number, number][] = [[2.95, 28, 360], [3.4, 122, 140], [2.65, 192, 100], [3.75, 252, 170], [3.05, 314, 80], [4.25, 72, 60], [4.1, 162, 50], [4.45, 352, 40], [2.8, 88, 30]];
const COMMONS = { n: 150, r0: 1.32, r1: 2.05 };

interface Arrive { from: V3; t0: number; dur: number; spin: number; intro: boolean }
interface Actor { c: number; type: number; r: number; th: number; y: number; deg: number; flash: number; seen: number; born: number; p: V3; anchor?: number; arrive?: Arrive; face?: number }
interface Tie { a: number; b: number; w: number; flash: number; bridge: boolean } // b = -1: the orb
interface Lab { R: number; th: number; mass: number; nodes: number[]; c: V3; lit: boolean; size: number; cap: number; rot: M3; tilt: [number, number] }
interface Pulse { e: number; from: number; to: number; t0: number; dur: number; kind: number; hop: number; inv: number }
interface Idea { id: number; t0: number; upSent: boolean; orbSent: boolean; down: boolean; origin: number; adopters: Map<number, number[]>; done: boolean }

class Model {
  rnd = mulberry(20251);
  nodes: Actor[] = []; ties: Tie[] = []; adj: number[][] = []; orbTies: number[] = [];
  labs: Lab[] = []; pulses: Pulse[] = []; ideas: Idea[] = []; ripples: { t0: number; s: number }[] = [];
  orbFlash = 0; kick = 0; ideaId = 0; nextMinor = 3.4; nextMajor = 4.2; nextSpawn = 4; startN = 0; tiesDirty = true;
  pods: { project: number; members: number[] }[] = [];
  podOf = new Map<number, number>();
  /** Where a new Lab will be (the thread ties there at the close): an empty stretch of orbit, turning with it. */
  newTh = (283 * Math.PI) / 180;
  newLab(): V3 { return [Math.cos(this.newTh) * 3.5, 0, Math.sin(this.newTh) * 3.5]; }
  /** The DC Lab's library: its first place. */

  J(a: number) { return (this.rnd() * 2 - 1) * a; }
  pick<T>(a: T[]): T { return a[Math.floor(this.rnd() * a.length)]; }

  constructor(density: number, intro: boolean) {
    const R = this.rnd;
    LABS.forEach(([rad, ang, n0], li) => {
      const n = Math.max(12, Math.round(n0 * density));
      const tilt: [number, number] = li === 0 ? [0.32, -0.12] : [this.J(0.5), this.J(0.45)];
      const lab: Lab = { R: rad, th: ang * DEG, mass: 0, nodes: [], c: [0, 0, 0], lit: li === 0, size: 0.24 + 0.4 * Math.sqrt(n0 / 120), cap: 0, rot: mul(rz(tilt[1]), rx(tilt[0])), tilt };
      this.labs.push(lab);
      const places = Math.max(1, Math.round(n * 0.05)), projects = Math.max(1, Math.round(n * 0.12)), know = Math.max(1, Math.round(n * 0.07));
      const shells = Math.min(5, 2 + Math.round(n0 / 45));
      for (let i = 0; i < n; i++) {
        const type = i < places ? PLACE : i < places + projects ? PROJECT : i < places + projects + know ? KNOW : HUMAN;
        // On one of its Lab's orbits: places and knowledge on the inner ones, people further out.
        const inner = type === PLACE ? 0.4 : type === KNOW ? 0.7 : 1;
        const sh = Math.min(shells - 1, Math.floor(Math.pow(R(), 0.8) * shells * inner + (type === HUMAN ? 0.5 : 0)));
        const r = lab.size * (0.4 + 0.6 * (sh + 0.5) / shells) + this.J(0.018);
        const born = 0.9 + li * 0.12 + R() * 0.9;
        const idx = this.add({ c: li, type, r, th: R() * Math.PI * 2, y: this.J(0.04), deg: 0, flash: 0, seen: 0, born, p: [0, 0, 0] });
        lab.nodes.push(idx);
      }
      const of = (t: number) => lab.nodes.filter((i) => this.nodes[i].type === t);
      const people = of(HUMAN), placesN = of(PLACE), projectsN = of(PROJECT), knowN = of(KNOW);
      projectsN.forEach((pj) => { // pods: a few people round each project, mostly tied to each other too
        const pod = Array.from({ length: 3 + Math.floor(R() * 3) }, () => this.pick(people));
        pod.forEach((h, k) => { this.link(h, pj); if (k && R() < 0.55) this.link(h, pod[k - 1]); });
      });
      people.forEach((h) => { if (R() < 0.7) this.link(h, this.pick(placesN)); if (R() < 0.35) this.link(h, this.pick(people)); });
      knowN.forEach((k) => { for (let i = 0; i < 2 + Math.floor(R() * 2); i++) this.link(k, this.pick(projectsN)); });
    });
    // The commons round the orb: shared knowledge and the contributors who keep it.
    const commons: number[] = [];
    const cn = Math.round(COMMONS.n * (0.6 + 0.4 * density));
    for (let i = 0; i < cn; i++) {
      const type = R() < 0.45 ? HUMAN : KNOW;
      commons.push(this.add({ c: -1, type, r: lerp(COMMONS.r0, COMMONS.r1, R()), th: (i / cn) * Math.PI * 2 + this.J(0.05), y: this.J(0.04), deg: 0, flash: 0, seen: 0, born: 0.45 + (i / cn) * 0.7, p: [0, 0, 0] }));
    }
    commons.forEach((i, k) => {
      if (R() < 0.5) this.link(i, -1);
      this.link(i, commons[(k + 1) % commons.length]);
      if (R() < 0.3) this.link(i, commons[(k + 2) % commons.length]);
    });
    // Each Lab's contributors stand between it and the commons and move with it: the bridge.
    this.labs.forEach((lab, li) => {
      const bridges = 1 + Math.round(lab.nodes.length / 20);
      const inLab = lab.nodes.filter((i) => this.nodes[i].type !== PLACE);
      for (let b = 0; b < bridges; b++) {
        const r = lerp(COMMONS.r1 + 0.25, lab.R - lab.size * 0.9, 0.2 + 0.6 * R());
        const k = this.add({ c: -1, anchor: li, type: HUMAN, r, th: this.J(0.22 / lab.R * 2), y: this.J(0.05), deg: 0, flash: 0, seen: 0, born: 1.6 + li * 0.12 + R() * 0.4, p: [0, 0, 0] });
        this.link(k, this.pick(inLab), true);
        if (R() < 0.6) this.link(k, this.pick(inLab), true);
        if (R() < 0.6) this.link(k, -1, true);
        else { const near = commons.reduce((best, c) => (Math.abs(Math.sin((this.nodes[c].th - lab.th) / 2)) < Math.abs(Math.sin((this.nodes[best].th - lab.th) / 2)) ? c : best), commons[0]); this.link(k, near, true); }
      }
    });
    this.labs.forEach((L) => { L.cap = L.mass * 1.35; });
    // Some of DC's people are real: the first cohort's faces, as two Pods of four, each round a project
    // they're building, orbiting together (the "together" shot looks at the first).
    const dc = this.labs[0];
    const dcProjects = dc.nodes.filter((i) => this.nodes[i].type === PROJECT);
    const free = dc.nodes.filter((i) => this.nodes[i].type === HUMAN);
    for (let pod = 0; pod < 2 && dcProjects.length > pod; pod++) {
      const pj = this.nodes[dcProjects[pod * Math.floor(dcProjects.length / 2)]];
      pj.r = dc.size * (0.62 + 0.18 * pod); pj.th = pod * Math.PI + 0.4;
      const members: number[] = [];
      for (let k = 0; k < 4 && free.length; k++) {
        const i = free.splice(Math.floor(this.rnd() * free.length), 1)[0];
        const n = this.nodes[i];
        // Round their project like a team round a table: a small ring, turning with it.
        const phi = k * Math.PI / 2 + 0.6;
        n.face = pod * 4 + k; n.r = pj.r + 0.085 * Math.cos(phi); n.th = pj.th + 0.085 * Math.sin(phi) / pj.r; n.y = pj.y + 0.02 * Math.sin(phi * 2);
        this.link(i, dcProjects[pod * Math.floor(dcProjects.length / 2)]);
        members.forEach((m) => this.link(i, m));
        members.push(i);
      }
      this.pods.push({ project: dcProjects[pod * Math.floor(dcProjects.length / 2)], members });
      [dcProjects[pod * Math.floor(dcProjects.length / 2)], ...members].forEach((i) => this.podOf.set(i, pod));
    }
    this.startN = this.nodes.length;
    this.positions(0, 0);
    // The opening: everything gathers into its orbit from further out.
    if (intro) for (const n of this.nodes) {
      const p = n.p, s = n.c === -1 ? 2.2 : 1.7 + R() * 0.6;
      n.arrive = { from: [p[0] * s + this.J(0.4), p[1] + this.J(0.3), p[2] * s + this.J(0.4)], t0: n.born, dur: 1.4 + R() * 1.1, spin: (R() < 0.5 ? -1 : 1) * (0.8 + R()), intro: true };
    }
  }

  add(a: Actor) { this.nodes.push(a); this.adj.push([]); return this.nodes.length - 1; }
  inPod(i: number) { return this.podOf.has(i); }
  /** A tie inside a Pod: both ends on the same team. */
  podTie(e: Tie) { const a = this.podOf.get(e.a); return a !== undefined && a === this.podOf.get(e.b); }
  /** Where the first Pod is now: the "together" shot looks at it. */
  podCenter(): V3 {
    const p = this.pods[0]; if (!p) return this.labs[0].c;
    const ids = [p.project, ...p.members]; const c: V3 = [0, 0, 0];
    ids.forEach((i) => { const q = this.nodes[i].p; c[0] += q[0]; c[1] += q[1]; c[2] += q[2]; });
    return [c[0] / ids.length, c[1] / ids.length, c[2] / ids.length];
  }
  linked(a: number, b: number) { return this.adj[a].some((e) => { const t = this.ties[e]; return (t.a === a && t.b === b) || (t.b === a && t.a === b); }); }
  link(a: number, b: number, bridge = false) {
    if (a === b || this.ties.length >= MAX_EDGES || this.linked(a, b)) return;
    const e = this.ties.push({ a, b, w: 1, flash: 0, bridge }) - 1;
    this.adj[a].push(e); this.nodes[a].deg++;
    if (b >= 0) { this.adj[b].push(e); this.nodes[b].deg++; } else this.orbTies.push(e);
    const ca = this.nodes[a].c, cb = b >= 0 ? this.nodes[b].c : -2;
    if (ca >= 0 && ca === cb) this.labs[ca].mass += 1;
    else { if (ca >= 0) this.labs[ca].mass += 0.5; if (cb >= 0) this.labs[cb].mass += 0.5; }
    this.tiesDirty = true;
  }
  /** Where an end of a tie is: an actor, or the point on the orb's surface facing the other end. */
  end(i: number, other: number): V3 {
    if (i >= 0) return this.nodes[i].p;
    const o = this.nodes[other].p, l = Math.hypot(o[0], o[1], o[2]) || 1;
    return [o[0] / l * 1.03, o[1] / l * 1.03, o[2] / l * 1.03];
  }
  /** Where an actor sits on its orbit at angle th (its Lab's plane is tilted). */
  orbitAt(n: Actor, th: number): V3 {
    if (n.c < 0) return [Math.cos(th) * n.r, n.y, Math.sin(th) * n.r];
    const L = this.labs[n.c];
    const l = apply(L.rot, [Math.cos(th) * n.r, n.y, Math.sin(th) * n.r]);
    return [L.c[0] + l[0], L.c[1] + l[1], L.c[2] + l[2]];
  }

  /** Move everything along its orbit. A Lab's actors orbit it as fast as its mass (its ties) pulls. */
  positions(dt: number, t: number) {
    this.labs.forEach((L) => { L.th += dt * 0.03 * Math.pow(2.5 / L.R, 1.5); L.c = [Math.cos(L.th) * L.R, 0, Math.sin(L.th) * L.R]; });
    this.newTh += dt * 0.03 * Math.pow(2.5 / 3.5, 1.5);
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      if (n.anchor !== undefined && !n.arrive) {
        const La = this.labs[n.anchor];
        n.p = [Math.cos(La.th + n.th) * n.r, n.y, Math.sin(La.th + n.th) * n.r];
        n.flash = Math.max(0, n.flash - dt * 1.3);
        continue;
      }
      let w: number;
      if (n.c >= 0) {
        const pull = Math.sqrt(Math.max(this.labs[n.c].mass, 6) / 260);
        w = clamp(0.13 * pull * Math.pow(0.45 / Math.max(n.face !== undefined || this.inPod(i) ? this.labs[0].size * 0.7 : n.r, 0.08), 1.5), 0.012, 0.42);
      } else w = 0.07;
      if (n.anchor === undefined) n.th += w * dt;
      const target = n.anchor !== undefined ? [Math.cos(this.labs[n.anchor].th + n.th) * n.r, n.y, Math.sin(this.labs[n.anchor].th + n.th) * n.r] as V3 : this.orbitAt(n, n.th);
      if (n.arrive) {
        const k = (t - n.arrive.t0) / n.arrive.dur;
        if (k >= 1) { const intro = n.arrive.intro; n.arrive = undefined; n.p = target; if (!intro) this.settle(i); continue; }
        const C: V3 = n.c >= 0 ? this.labs[n.c].c : [0, 0, 0];
        const e = ease(clamp(k, 0, 1)), sw = (1 - e) * n.arrive.spin;
        const m = lerp3(n.arrive.from, target, e);
        const cx = m[0] - C[0], cz = m[2] - C[2];
        n.p = [C[0] + cx * Math.cos(sw) - cz * Math.sin(sw), m[1], C[2] + cx * Math.sin(sw) + cz * Math.cos(sw)];
      } else n.p = target;
      n.flash = Math.max(0, n.flash - dt * 1.3);
    }
    for (const e of this.ties) { e.flash = Math.max(0, e.flash - dt * 2.8); e.w += (1 - e.w) * dt * 0.035; }
    this.orbFlash = Math.max(0, this.orbFlash - dt * 1.1);
    this.kick = Math.max(0, this.kick - dt * 2.4);
    this.ripples = this.ripples.filter((r) => t - r.t0 < 1.6);
  }

  /** You pressed the orb: it flares, a wave crosses the orbits, and sparks go out down every tie to the Labs. */
  join(t: number) {
    this.orbFlash = 1.6; this.ripples.push({ t0: t, s: 1.4 });
    const idea: Idea = { id: ++this.ideaId, t0: t, upSent: true, orbSent: true, down: true, origin: 0, adopters: new Map(), done: false };
    this.ideas.push(idea);
    for (const e of this.orbTies) this.send(e, -1, this.ties[e].a, 2, 0, idea, t, 0.05 + this.rnd() * 0.35);
  }

  /** A newcomer has arrived: it takes a tie or two in its Lab. */
  settle(i: number) {
    const n = this.nodes[i]; const L = this.labs[n.c];
    const people = L.nodes.filter((j) => j !== i && this.nodes[j].type === HUMAN && !this.nodes[j].arrive);
    if (people.length) this.link(i, this.pick(people));
    if (people.length && this.rnd() < 0.5) this.link(i, this.pick(people));
    const places = L.nodes.filter((j) => this.nodes[j].type === PLACE);
    if (places.length && this.rnd() < 0.6) this.link(i, this.pick(places));
    n.flash = 1;
  }

  /** Someone new drifts in, drawn to a Lab by its pull: its mass over the distance squared. */
  spawn(t: number) {
    if (this.nodes.length >= Math.min(MAX_NODES - 30, this.startN + 320)) return -1;
    const a = this.rnd() * Math.PI * 2, d = 5.2 + this.rnd() * 1.2, from: V3 = [Math.cos(a) * d, this.J(0.4), Math.sin(a) * d];
    const pulls = this.labs.map((L) => (L.mass + 4) / (1 + dist(from, L.c) ** 2));
    let x = this.rnd() * pulls.reduce((s, v) => s + v, 0), li = 0;
    while (li < pulls.length - 1 && (x -= pulls[li]) > 0) li++;
    const L = this.labs[li];
    const idx = this.add({ c: li, type: HUMAN, r: L.size * (0.45 + 0.5 * this.rnd()), th: this.rnd() * Math.PI * 2, y: this.J(0.04), deg: 0, flash: 0.6, seen: 0, born: t, p: from,
      arrive: { from, t0: t, dur: 5 + this.rnd() * 2.5, spin: (this.rnd() < 0.5 ? -1 : 1) * (1.5 + this.rnd()), intro: false } });
    L.nodes.push(idx);
    return idx;
  }

  send(e: number, from: number, to: number, kind: number, hop: number, idea: Idea, t: number, delay = 0) {
    if (this.pulses.length >= MAX_PULSES) return 0;
    const L = dist(this.end(from, to), this.end(to, from));
    const dur = clamp(L / (kind === 0 ? 0.8 : 1.15), 0.25, 2.4);
    this.pulses.push({ e, from, to, t0: t + delay, dur, kind, hop, inv: idea.id });
    return dur;
  }

  /** A new idea. Minor ones stay in their Lab; major ones find a way up to the orb. */
  innovate(t: number, o: { lab?: number; from?: number; major: boolean }) {
    let origin = o.from ?? -1;
    if (origin < 0) {
      let li = o.lab ?? -1;
      if (li < 0) { const w = this.labs.map((L) => L.mass + 3); let x = this.rnd() * w.reduce((s, v) => s + v, 0); li = 0; while (li < w.length - 1 && (x -= w[li]) > 0) li++; }
      const cands = this.labs[li].nodes.filter((i) => this.nodes[i].type === PROJECT && !this.nodes[i].arrive);
      if (!cands.length) return;
      origin = this.pick(cands);
    }
    const idea: Idea = { id: ++this.ideaId, t0: t, upSent: !o.major, orbSent: !o.major, down: false, origin, adopters: new Map(), done: false };
    this.ideas.push(idea);
    if (o.major) this.route(origin, idea, t);
    this.reach(origin, idea, 0, 0, t);
  }
  /** The way up: the shortest run of ties from an actor to the orb, sparked one after another. */
  route(origin: number, idea: Idea, t: number) {
    const lab = this.nodes[origin].c;
    const prev = new Map<number, [number, number]>([[origin, [-2, -1]]]);
    const q = [origin]; let goal = false;
    while (q.length && !goal) {
      const x = q.shift()!;
      for (const ei of this.adj[x]) {
        const e = this.ties[ei]; const o = e.a === x ? e.b : e.a;
        if (o === -1) { prev.set(-1, [x, ei]); goal = true; break; }
        if (prev.has(o)) continue;
        const O = this.nodes[o];
        if (O.arrive || (O.c !== lab && O.c !== -1)) continue;
        prev.set(o, [x, ei]); q.push(o);
      }
    }
    if (!goal) { idea.upSent = idea.orbSent = false; return; }
    const path: [number, number, number][] = []; // from, to, tie
    let cur = -1;
    while (cur !== origin) { const [p, ei] = prev.get(cur)!; path.unshift([p, cur, ei]); cur = p; }
    let delay = 0.05;
    for (const [a, b, ei] of path) {
      const kind = b === -1 || this.nodes[b].c === -1 ? 1 : 0;
      delay += this.send(ei, a, b, kind, 9, idea, t, delay) * 0.92;
    }
  }

  /** The spark arrives at an actor (or the orb) and goes on. Kinds: 0 spreading in a Lab, 1 going up, 2 coming down. */
  reach(i: number, idea: Idea, kind: number, hop: number, t: number) {
    if (i === -1) {
      if (idea.down) return;
      idea.down = true; this.orbFlash = 1; this.kick = 1; this.ripples.push({ t0: t, s: 0.55 });
      const cm = this.nodes.filter((n) => n.c === -1).length;
      if (cm < 190 && this.nodes.length < MAX_NODES - 30) { // what reaches the orb becomes knowledge in the commons
        const o = this.nodes[idea.origin].p;
        const k = this.add({ c: -1, type: KNOW, r: lerp(COMMONS.r0, COMMONS.r1, this.rnd()), th: Math.atan2(o[2], o[0]) + this.J(0.2), y: this.J(0.04), deg: 0, flash: 1, seen: idea.id, born: t, p: [0, 0, 0] });
        this.link(k, -1);
        const bridge = this.nodes.findIndex((n) => n.anchor === this.nodes[idea.origin].c);
        if (bridge >= 0) this.link(k, bridge, true);
      }
      // Back out: one spark to each Lab, by a contributor who bridges it, and a few into the commons.
      const out = new Map<number, number>(); const commons: number[] = [];
      for (const e of this.orbTies) { const n = this.nodes[this.ties[e].a]; if (n.anchor !== undefined) { if (!out.has(n.anchor)) out.set(n.anchor, e); } else commons.push(e); }
      for (let k = 0; k < 3 && commons.length; k++) out.set(-10 - k, commons.splice(Math.floor(this.rnd() * commons.length), 1)[0]);
      for (const e of out.values()) this.send(e, -1, this.ties[e].a, 2, 0, idea, t, 0.3 + this.rnd() * 0.5);
      return;
    }
    const n = this.nodes[i];
    if (n.seen === idea.id || n.arrive) return;
    n.seen = idea.id; n.flash = 1;
    if (n.c >= 0) { const a = idea.adopters.get(n.c) ?? []; a.push(i); idea.adopters.set(n.c, a); }
    if (hop === 9) return; // a step on the routed way up: the route carries it on
    for (const ei of this.adj[i]) {
      const e = this.ties[ei]; const o = e.a === i ? e.b : e.a;
      if (o === -1) { if (kind !== 2 && !idea.orbSent) { idea.orbSent = true; this.send(ei, i, -1, 1, hop + 1, idea, t); } continue; }
      const O = this.nodes[o];
      if (O.seen === idea.id || O.arrive) continue;
      if (kind === 0) {
        if (O.c === -1) { if (!idea.upSent && this.rnd() < 0.8) { idea.upSent = true; this.send(ei, i, o, 1, hop + 1, idea, t); } continue; }
        if (O.c !== n.c) continue;
        if (hop < 3 && this.rnd() < 0.6 * Math.pow(0.55, hop)) this.send(ei, i, o, 0, hop + 1, idea, t);
      } else if (kind === 1) {
        if (O.c === -1 && hop < 3 && this.rnd() < 0.35) this.send(ei, i, o, 1, hop + 1, idea, t);
      } else if (O.c >= 0) this.send(ei, i, o, 0, 2, idea, t);
    }
  }

  step(dt: number, t: number, live: boolean, dcOnly: boolean, dcBuild = false, podFocus = false) {
    if (live) {
      // A slow heartbeat, so each idea can be followed: a big one every several seconds, a small local one
      // between (in DC while we're looking at it).
      if (t > this.nextMajor) { this.innovate(t, { lab: dcOnly ? 0 : undefined, major: true }); this.nextMajor = t + (dcOnly ? 6.5 : 8.5); this.nextMinor = t + 3; }
      if (t > this.nextMinor) {
        // Looking at a Pod: its ideas pass round the team.
        const pd = podFocus ? this.pods[0] : undefined;
        this.innovate(t, pd ? { from: this.pick([pd.project, ...pd.members]), major: false } : { lab: dcBuild ? 0 : undefined, major: false });
        this.nextMinor = t + (pd ? 2.2 : dcBuild ? 2.4 : 3.2);
      }
      if (t > this.nextSpawn) { this.spawn(t); this.nextSpawn = t + 1.8 + this.rnd() * 2; }
    }
    this.positions(dt, t);
    const landed: Pulse[] = [];
    this.pulses = this.pulses.filter((p) => {
      if (t < p.t0) return true;
      const e = this.ties[p.e]; e.flash = 1; e.w = Math.min(2.6, e.w + 0.012);
      if (t >= p.t0 + p.dur) { landed.push(p); return false; }
      return true;
    });
    for (const p of landed) { const idea = this.ideas.find((d) => d.id === p.inv); if (idea) this.reach(p.to, idea, p.kind, p.hop === 9 ? 9 : p.hop, t); }
    for (const idea of this.ideas) { // an idea that has spread leaves new ties among those who took it up
      if (idea.done || t - idea.t0 < 7) continue;
      idea.done = true;
      idea.adopters.forEach((a, li) => { const L = this.labs[li]; for (let k = 0; k < Math.min(2, a.length - 1); k++) if (L.mass < L.cap) this.link(this.pick(a), this.pick(a)); });
    }
    this.ideas = this.ideas.filter((d) => t - d.t0 < 12);
  }
}

/* ── shaders ── */

const GLSL_HASH = `
float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float hash3(vec3 p) { p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
vec3 hash33(vec3 p) { p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }`;

// The camera, shared: world → view (uM, the target uT, the distance uD), and the projection (uTan). Each
// pass draws in front of the orb or behind it (uSide), split at the orb's centre: uCullY is how far down the
// weave's space the orb is (0 for the system's own passes).
const GLSL_CAM = `
uniform mat3 uM; uniform vec3 uT; uniform float uD; uniform vec2 uTan; uniform float uSide; uniform vec2 uShift; uniform float uCullY;
vec3 toView(vec3 p) { vec3 v = uM * (p - uT); v.z -= uD; return v; }
vec4 toClip(vec3 v) { return vec4(v.x / uTan.x - uShift.x * v.z, v.y / uTan.y - uShift.y * v.z, 0.0, -v.z); }
bool culled(vec3 p) { return (uM * (p - vec3(0.0, uCullY, 0.0))).z * uSide < 0.0; }`;

// The actors' state, read by index: position and opacity; flash, size, kind, Lab; orbit (r, angle, height, Lab code).
const GLSL_STATE = `
uniform highp sampler2D uPos; uniform highp sampler2D uSt; uniform highp sampler2D uOrb;
ivec2 texAt(int i) { return ivec2(i % ${TEXW}, i / ${TEXW}); }
// The metal is gold: everyone comes in through their own Lab, so gold is the norm. Silver is the national
// org's alone (the commons round the orb, its wave, what it sends out), there to be discovered later.
const vec3 COL[5] = vec3[5](vec3(1.0, 0.86, 0.74), vec3(0.14, 0.84, 0.86), vec3(1.0, 0.36, 0.28), vec3(1.0, 0.79, 0.44), vec3(1.0, 0.9, 0.8)); // pearl, teal, red, gold; you
const vec3 NATIONAL = vec3(0.84, 0.89, 0.95); // silver
vec3 colOf(float kind) { int k = int(kind + 0.5); return k >= 10 ? vec3(1.0, 0.9, 0.8) : COL[min(k, 4)]; }
// By kind and Lab: knowledge in the commons (no Lab) is the national corpus, so silver.
vec3 colAt(float kind, float lab) { return int(kind + 0.5) == 3 && lab < -0.5 ? NATIONAL : colOf(kind); }`;

const ACTOR_VS = `#version 300 es
precision highp float;
${GLSL_CAM}
${GLSL_STATE}
uniform float uPx; uniform int uFirst; uniform float uFocus; uniform float uFocusAmt; uniform float uZoom; uniform float uDense; uniform vec4 uEmph;
out vec4 vC; out float vShape; out float vFlash; out float vNear;
void main() {
  int id = gl_VertexID + uFirst;
  vec4 P = texelFetch(uPos, texAt(id), 0), S = texelFetch(uSt, texAt(id), 0); // S: flash, size, kind, Lab
  if (P.w <= 0.002 || culled(P.xyz)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  vec3 v = toView(P.xyz);
  gl_Position = toClip(v);
  float depth = clamp((v.z + uD) / 6.0, -1.0, 1.0);
  float g = S.w;
  float f = g < -0.5 ? 1.0 - 0.4 * uFocusAmt : (abs(g - uFocus) < 0.5 ? 1.0 + 0.8 * uFocusAmt : 1.0 - 0.6 * uFocusAmt);
  float k = S.z > 9.5 ? 0.0 : S.z, em = k < 0.5 ? uEmph.x : k < 1.5 ? uEmph.y : k < 2.5 ? uEmph.z : k < 3.5 ? uEmph.w : 1.0; // what the shot is about
  vC = vec4(colAt(S.z, S.w), P.w * f * em * (1.0 + 0.12 * depth));
  float fl = S.z > 9.5 ? 1.0 : 0.4 + 0.6 * uDense; // where the network is packed tight on screen, a flash is smaller
  vShape = S.z; vFlash = S.x * fl; vNear = max(depth, 0.0);
  gl_PointSize = S.y * uPx * uZoom * (uD / -v.z) * (1.0 + 0.12 * max(depth, 0.0) - 0.1 * max(-depth, 0.0)) * (1.0 + (S.z > 9.5 ? 0.15 : 0.3 * fl) * S.x);
}`;

// Sparks and stars: points the CPU places (S: size, shape, flash, alpha; C: rgb, and for a star its depth).
const SPRITE_VS = `#version 300 es
precision highp float;
${GLSL_CAM}
in vec3 aP; in vec4 aS; in vec4 aC;
uniform float uPx; uniform vec2 uPar;
out vec4 vC; out float vShape; out float vFlash; out float vNear;
void main() {
  vShape = aS.y; vFlash = aS.z; vNear = 0.0;
  if (aS.y > 8.5) { // a star, placed on screen
    if (uSide > 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
    gl_Position = vec4(aP.xy - uPar * 0.03 * aP.z, 0.0, 1.0);
    vC = vec4(aC.rgb, aS.w); gl_PointSize = aS.x * uPx; return;
  }
  if (culled(aP)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  vec3 v = toView(aP);
  gl_Position = toClip(v);
  vC = vec4(aC.rgb, aS.w);
  gl_PointSize = aS.x * uPx * (uD / -v.z);
}`;

const POINT_FS = `#version 300 es
precision highp float;
in vec4 vC; in float vShape; in float vFlash; in float vNear;
uniform sampler2D uFaces; uniform float uFacesReady;
out vec4 o;
${GLSL_HASH}
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r = length(c);
  if (r > 1.0) discard;
  if (vShape > 9.5) { // a real person: their portrait in a circle, with a warm ring, lit when they take up an idea
    float f = floor(vShape - 10.0 + 0.5);
    vec2 cell = vec2(mod(f, 3.0), floor(f / 3.0));
    vec3 face = texture(uFaces, (cell + (c / 0.62 * 0.5 + 0.5)) / 3.0).rgb;
    float inside = smoothstep(0.64, 0.6, r), ring = smoothstep(0.6, 0.64, r) * smoothstep(0.74, 0.68, r);
    vec3 col = mix(vec3(1.0, 0.86, 0.74), face * 1.05, uFacesReady) * inside + vec3(1.0, 0.85, 0.7) * ring * (0.8 + vFlash);
    float glow = exp(-r * r * 2.5) * vFlash * 0.6 * (1.0 - inside);
    float a = (inside + ring + glow) * vC.a;
    o = vec4((col + vec3(1.0, 0.9, 0.8) * glow) * vC.a, a);
    return;
  }
  // The mark sits in the middle half of the sprite; the rest is its glow when it lights up.
  vec2 q = c / 0.5; float aa = 0.2;
  float m;
  if (vShape < 0.5 || (vShape > 3.5 && vShape < 4.5)) m = smoothstep(1.0, 1.0 - aa * 2.0, length(q)); // a person (or you)
  else if (vShape < 1.5) m = smoothstep(0.78, 0.78 - aa, max(abs(q.x), abs(q.y)));            // a place
  else if (vShape < 2.5) m = smoothstep(1.02, 1.02 - aa * 1.4, abs(q.x) + abs(q.y));           // a project
  else if (vShape < 3.5) m = smoothstep(0.26, 0.26 - aa, abs(length(q) - 0.72));               // knowledge
  else if (vShape < 5.5) m = exp(-r * r * 7.0) * 0.8 + smoothstep(0.24, 0.0, r) * 1.8;          // a spark: hot at its core, so it blooms
  else m = smoothstep(1.0, 0.2, r);                                                            // a star
  float glow = vShape < 4.5 ? exp(-r * r * 3.2) * (0.1 + vFlash * 0.7) : 0.0;
  float a = (m + glow) * vC.a;
  vec3 col = mix(vC.rgb, vec3(1.0), vFlash * 0.4) * (1.0 + vFlash * 0.7);
  o = vec4(col * a, a);
}`;

// Soft lines: every tie, bend and trail is a screen-space quad, feathered at its edges, as wide as it's strong.
const GLSL_QUAD = `
uniform vec2 uRes;
out vec4 vC; out float vD; out float vW;
void quad(vec3 A, vec3 B, float t, float side, float width, vec4 col) {
  vec4 ca = toClip(toView(A)), cb = toClip(toView(B));
  vec2 sa = ca.xy / ca.w * uRes * 0.5, sb = cb.xy / cb.w * uRes * 0.5;
  vec2 d = sb - sa; float l = length(d);
  vec2 n = l > 1e-4 ? vec2(-d.y, d.x) / l : vec2(0.0, 1.0);
  float hw = width * 0.5 + 1.0;
  vec2 s = mix(sa, sb, t) + n * side * hw;
  float w = mix(ca.w, cb.w, t);
  gl_Position = vec4(s / (uRes * 0.5) * w, 0.0, w);
  vC = col; vD = side * hw; vW = width;
}`;

const TIE_VS = `#version 300 es
precision highp float;
${GLSL_CAM}
${GLSL_STATE}
${GLSL_QUAD}
layout(location = 0) in vec2 aCorner;  // along (0, 1), side (-1, 1)
layout(location = 1) in vec4 aTie;     // end a, end b (-1: the orb), segment (-1: straight), tie index
layout(location = 2) in vec4 aKind;    // kind (0 a tie, 1 a bridge, 2 inside a Pod), Lab of a, Lab of b, (spare)
uniform highp sampler2D uTies;         // strength, flash
uniform float uPx; uniform float uFocus; uniform float uFocusAmt; uniform int uTieW; uniform float uPod; uniform float uDense;
vec3 orbEnd(vec3 o) { float l = max(length(o), 1e-3); return o / l * 1.03; }
void main() {
  int ia = int(aTie.x), ib = int(aTie.y), ti = int(aTie.w);
  vec4 PA = texelFetch(uPos, texAt(ia), 0);
  vec4 PB = ib >= 0 ? texelFetch(uPos, texAt(ib), 0) : vec4(orbEnd(PA.xyz), 1.0);
  float vis = min(PA.w, PB.w);
  vec3 A = PA.xyz, B = PB.xyz, M = (A + B) * 0.5;
  if (aTie.z >= 0.0) { // a bridge bends like a spiral arm: the outer end trails, as outer orbits do
    vec3 C = vec3(M.x * 0.976 - M.z * 0.218, M.y, M.x * 0.218 + M.z * 0.976);
    float u0 = aTie.z / 6.0, u1 = (aTie.z + 1.0) / 6.0;
    vec3 a0 = mix(mix(A, C, u0), mix(C, B, u0), u0), b0 = mix(mix(A, C, u1), mix(C, B, u1), u1);
    M = mix(mix(A, C, 0.5), mix(C, B, 0.5), 0.5); A = a0; B = b0;
  }
  vec2 st = texelFetch(uTies, ivec2(ti % uTieW, ti / uTieW), 0).xy;
  if (vis <= 0.002 || culled(M)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  bool bridge = abs(aKind.x - 1.0) < 0.5, pod = aKind.x > 1.5;
  // Close on a Pod: the team's own ties warm and brighten; everything else steps back.
  if (!pod) { st.y *= (1.0 - 0.8 * uPod) * (0.35 + 0.65 * uDense); }
  float foc = uFocusAmt > 0.0 ? ((abs(aKind.y - uFocus) < 0.5 || abs(aKind.z - uFocus) < 0.5) ? 1.0 + 1.2 * uFocusAmt : 1.0 - 0.55 * uFocusAmt) : 1.0;
  float front = ib < 0 && (uM * M).z > 0.0 ? 0.35 : 1.0;
  float base = (bridge || ib < 0 ? 0.3 : 0.16) * st.x * foc * vis * front;
  vec3 col = mix(bridge || ib < 0 ? vec3(0.74, 0.8, 0.87) : vec3(0.5, 0.78, 0.8), bridge || ib < 0 ? vec3(0.95, 0.98, 1.0) : vec3(0.92, 0.97, 0.95), st.y * 0.75); // ties into the commons are the national org's: silver
  if (pod) { col = mix(col, mix(vec3(1.0, 0.82, 0.62), vec3(1.0, 0.97, 0.9) * 1.05, st.y), uPod); base += 0.4 * uPod * vis; }
  else base *= (1.0 - 0.55 * uPod) * (0.6 + 0.4 * uDense);
  float width = ((bridge ? 1.3 : 0.85) + 0.45 * (st.x - 1.0) + 0.3 * st.y + (pod ? 0.8 * uPod : 0.0)) * uPx;
  quad(A, B, aCorner.x, aCorner.y, width, vec4(col, base + st.y * 0.2 * front));
}`;

const TRAIL_VS = `#version 300 es
precision highp float;
${GLSL_CAM}
${GLSL_STATE}
${GLSL_QUAD}
layout(location = 0) in vec2 aCorner;
uniform vec3 uLabC[10]; uniform vec2 uLabTilt[10]; uniform float uPx; uniform int uFirst;
const int SEG = 5;
vec3 orbitAt(vec4 O, float th) {
  vec3 l = vec3(cos(th) * O.x, O.z, sin(th) * O.x);
  int lab = int(O.w + 0.5) - 2;
  if (lab < 0) return l;
  vec2 t = uLabTilt[lab];
  float cx = cos(t.x), sx = sin(t.x), cz = cos(t.y), sz = sin(t.y);
  l = vec3(l.x, cx * l.y - sx * l.z, sx * l.y + cx * l.z);   // tilt about x
  l = vec3(cz * l.x - sz * l.y, sz * l.x + cz * l.y, l.z);   // then about z
  return uLabC[lab] + l;
}
void main() {
  int node = gl_InstanceID / SEG + uFirst, k = gl_InstanceID % SEG;
  vec4 P = texelFetch(uPos, texAt(node), 0), O = texelFetch(uOrb, texAt(node), 0), S = texelFetch(uSt, texAt(node), 0);
  if (P.w <= 0.002 || O.w < 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float len = (O.w < 1.5 ? 0.5 : 0.36) / max(O.x, 0.2);
  float t0 = O.y - float(k) / float(SEG) * len, t1 = O.y - float(k + 1) / float(SEG) * len;
  vec3 A = k == 0 ? P.xyz : orbitAt(O, t0), B = orbitAt(O, t1);
  if (culled((A + B) * 0.5)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float f = 1.0 - float(k) / float(SEG);
  quad(A, B, aCorner.x, aCorner.y, (0.4 + 1.3 * f) * uPx, vec4(colAt(S.z, S.w), P.w * 0.24 * f * f));
}`;

const LINE_FS = `#version 300 es
precision highp float;
in vec4 vC; in float vD; in float vW;
out vec4 o;
void main() {
  float cover = clamp(vW * 0.5 + 0.5 - abs(vD), 0.0, 1.0);
  float a = vC.a * cover * (vW < 1.0 ? vW : 1.0);
  o = vec4(vC.rgb * a, a);
}`;

// The orbits: fine dust, each orbit one or two arcs trailing off behind their head, turning at its
// own speed, drawn toward every mass and sunk into a well beneath it, rippling when the orb flares.
const FABRIC_VS = `#version 300 es
precision highp float;
${GLSL_CAM}
in vec4 aG; // orbit radius, angle, seed, brightness
uniform float uPx; uniform float uGrow; uniform float uTime; uniform float uBoost;
uniform vec4 uMass[10]; uniform vec4 uRip[4];
out float vA; out float vWell; out float vRip; out float vCore; out float vG;
void main() {
  float R = aG.x, th = aG.y + uTime * 0.03 * pow(2.5 / R, 1.5), k = aG.z;
  vG = fract(k * 91.7 + aG.y * 13.37); // this grain's own brightness
  float rr = R + 0.05 * sin(3.0 * th + k * 6.3) + 0.03 * sin(5.0 * th - k * 11.0) + 0.02 * sin(9.0 * th + k * 3.0);
  vec2 p = vec2(cos(th), sin(th)) * rr;
  float well = 0.0; vec2 pull = vec2(0.0);
  for (int i = 1; i < 10; i++) { vec2 d = p - uMass[i].xy; float l2 = dot(d, d) + uMass[i].w * uMass[i].w; pull -= d * uMass[i].z * 0.16 / l2; }
  p += pull;
  for (int i = 0; i < 10; i++) { vec2 d = p - uMass[i].xy; well += uMass[i].z / sqrt(dot(d, d) + uMass[i].w * uMass[i].w); }
  float rip = 0.0;
  for (int i = 0; i < 4; i++) { float dd = length(p - uRip[i].xy) - uRip[i].z; rip += uRip[i].w * exp(-dd * dd / 0.05); }
  vec3 w = vec3(p.x, -0.5 - 0.55 * well * (0.6 + 0.4 * uBoost) + 0.07 * rip, p.y);
  if (culled(w)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  vec3 v = toView(w);
  gl_Position = toClip(v);
  float r = length(p);
  vWell = clamp(well - 0.25, 0.0, 1.5); vRip = rip; vCore = smoothstep(2.45, 1.85, r); // the commons round the orb
  float arcs = 1.0 + floor(k * 2.0), len = 0.25 + 0.45 * fract(k * 7.13);
  float sft = fract((k * 6.28 - aG.y) / 6.2832 * arcs);
  float clump = sft < len ? pow(1.0 - sft / len, 1.7) : 0.0;
  vA = ((0.26 + 0.34 * vWell * uBoost + 0.7 * rip) * clump + 0.5 * rip * (1.0 - clump)) * aG.w * smoothstep(6.3, 3.8, r) * smoothstep(1.05, 1.35, R) * uGrow;
  gl_PointSize = (2.1 + 1.6 * rip) * uPx * (uD / -v.z);
}`;

const FABRIC_FS = `#version 300 es
precision highp float;
in float vA; in float vWell; in float vRip; in float vCore; in float vG; out vec4 o;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0; float r = dot(c, c); if (r > 1.0) discard;
  // Each grain keeps its own brightness as it moves (by the screen's pixels, moving dust would twinkle).
  float a = vA * smoothstep(1.0, 0.1, r) * (0.6 + 0.8 * vG);
  float wl = clamp(vWell * 0.5, 0.0, 1.0);
  vec3 col = mix(mix(vec3(0.5, 0.37, 0.17), vec3(1.0, 0.86, 0.56), wl),                      // gold dust: the Labs' orbits, the norm
                 mix(vec3(0.36, 0.4, 0.45), vec3(0.86, 0.91, 0.97), wl), vCore);            // silver round the centre: the national commons
  col = mix(col, vec3(0.94, 0.97, 1.0), clamp(vRip * 1.4, 0.0, 1.0));                         // the wave from the orb: silver, the national org sending out
  o = vec4(col * a, a);
}`;

// The weave: the three paths are three of the system's own orbits, neighbours round the orb in its plane, in
// the same dust as every other orbit. An orbit carried on through time is a helix, so that's how the weave is
// made: as the journey moves on, each path is drawn down out of the plane, its turns pulling apart (tight at
// the top, where it leaves its orbit, longer below) and its radius narrowing, so the three drain from the
// system into a vortex beneath the orb and then wind round one another as one triple helix, turning as orbits
// turn. The camera travels down it, one path's scene at a time; there that path's strand draws in to a single
// thread near the axis while the other two widen into faint loose turns round it. It never retracts: at the
// bottom it opens out again round the next system's orb (LEN below the first) and coils into its orbits, the
// same three paths one cycle on, so the journey only ever goes down. At the close the paths pour down into
// those orbits (uPour), and from there become the logo. All in the world, through its camera: the same grain,
// bloom and glow as everything else. On a portrait screen the drawn-out helix fades below the middle, where
// the words are.
const STRAND_VS = `#version 300 es
precision highp float;
${GLSL_CAM}
in vec4 aS; // path (0 learn, 1 build, 2 share), place along it, two seeds
uniform float uPx; uniform float uTime; uniform float uStretch; uniform float uRing; uniform float uGlow; uniform float uTwist; uniform float uPour; uniform float uLift;
uniform vec3 uFocus; uniform float uFocusSum; uniform float uCamY; uniform float uPortrait;
uniform vec2 uKnot; // a knot in Build's thread: how tangled, and where
uniform float uLogo; uniform vec4 uOrbN; uniform highp sampler2D uSwoosh; uniform float uLogoA; // the mark forming: how far, the orb on screen (centre, radius), the swoosh's points, their light
out vec3 vCol; out float vA; out float vG;
const vec3 CANDY[3] = vec3[3](vec3(0.1, 0.84, 0.88), vec3(1.0, 0.3, 0.22), vec3(1.0, 0.78, 0.42)); // teal, red, gold
const vec3 DUST = vec3(0.8, 0.66, 0.42); // gold dust, as every Lab's orbit
const float TURNS = ${HELIX.TURNS.toFixed(1)}, LEN = ${HELIX.LEN.toFixed(1)}, RB = 0.5, Y0 = ${HELIX.Y0}, U0 = ${HELIX.U0}, U1 = ${HELIX.U1}, RING = ${HELIX.RING};
// How far down the weave a place along it is (0 … 1 of its length): tight turns as it leaves its orbit, then
// even, then tight again as it coils into the next system's.
float spool(float u) { return u - U0 * (1.0 - exp(-u / U0)) - U1 * (1.0 - exp(-(1.0 - u) / U1)) + U1 * (1.0 - exp(-1.0 / U1)); }
void main() {
  int k = int(aS.x + 0.5); float s1 = aS.z, s2 = aS.w, h = fract(s1 * 91.7 + s2 * 13.3);
  vG = fract(s2 * 57.3 + s1 * 7.1);
  float f = uFocus[k], away = clamp(uFocusSum - f, 0.0, 1.0);
  float u = fract(aS.y + uTime * 0.0035);                      // the dust drifts along its path, downstream
  // The last of each path (RING of it) is its orbit round the next system: twice round, so the orbit is whole.
  float us = min(u / (1.0 - RING), 1.0), lap = max(u - (1.0 - RING), 0.0) / RING;
  float L = uStretch * LEN;
  float dep = mix(L * spool(us) / spool(1.0), L, uPour);        // how far below its first orbit
  float rest = L - dep;                                         // how far above its next one
  float down = smoothstep(0.0, 3.2, dep) * smoothstep(0.0, 4.0, rest);
  float r = mix(1.42 + 0.16 * float(k), RB, down);              // its orbit, narrowing into the helix, opening out into the next
  r = mix(r, mix(r, 0.16, f) * (1.0 + 2.6 * away), smoothstep(1.0, 3.0, dep) * smoothstep(1.0, 3.0, rest));
  float th = (us * TURNS + lap * 2.0) * 6.2832 + float(k) * 2.0944 + uTwist;
  float ca = s1 * 6.2832, rr = (0.05 + 0.05 * f) * sqrt(s2) * (0.6 + 0.4 * down);
  vec3 p = vec3(cos(th) * r + cos(ca) * rr, Y0 - dep + (s2 - 0.5) * 0.03 + sin(ca) * rr * 0.6, sin(th) * r + sin(ca) * rr);
  if (k == 1 && uKnot.x > 0.001) { // where a team gets stuck, Build's thread tangles on itself
    float kw = uKnot.x * exp(-pow((p.y - uKnot.y) / 0.55, 2.0));
    p += vec3(sin(u * 900.0 + th * 2.0), sin(u * 1300.0) * 0.55, cos(u * 700.0 + th * 3.0)) * 0.34 * kw;
  }
  // At the very end the paths become the logo's swoosh: each grain flies to a point of it, laid over the orb as
  // in the mark (so they all draw in front).
  float lm = clamp(uLogo * 1.8 - h * 0.8, 0.0, 1.0); lm = lm * lm * (3.0 - 2.0 * lm);
  if (lm > 0.5 ? uSide < 0.0 : culled(p)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  vec3 v = toView(p);
  gl_Position = toClip(v);
  vec3 ax = toView(vec3(0.0, p.y, 0.0));
  float d = clamp((v.z - ax.z) / max(r, 0.12), -1.0, 1.0);      // in front of its axis, or behind
  float lit = 1.0 - away;
  float pulse = exp(-pow((u - fract(uTime * 0.03 + float(k) * 0.37)) / 0.01, 2.0)) * lit * down;
  // (Coiled into the next system's orbits, a path is still drawn out: its last turns carry their own light, so
  // the three arrive lit in their colours. Poured into those orbits whole, it's one faint orbit again.)
  float drawn = smoothstep(0.0, 1.6, dep) * (1.0 - uPour);
  // In the system each path is one faint orbit (all its turns lie on one circle, so each grain is dim), lit a
  // little in its colour beside "three paths open up"; drawn out, each grain carries its own light.
  float a0 = uRing * mix(0.011, 0.03, uGlow);
  // (uLift: at the next system the three paths, having arrived, are lit: the cycle that brought you here.)
  float a1 = (0.28 + 0.32 * f) * (0.3 + 0.7 * mix(0.5 + 0.5 * d, 1.0, f)) * (1.0 - 0.78 * away) * (1.0 + 2.4 * pulse) * (1.0 + uLift);
  float ndcY = gl_Position.y / gl_Position.w;
  float below = mix(1.0, smoothstep(-0.04, 0.2, ndcY), uPortrait * drawn);
  vA = mix(a0, a1, drawn) * (0.55 + 0.9 * h) * below;
  vec3 col = CANDY[k];
  if (k == 2) col = mix(col, mix(CANDY[0], CANDY[2], smoothstep(uCamY + 3.5, uCamY - 3.5, p.y)), f); // shared: what was learned (teal), given (gold)
  vCol = mix(mix(DUST, col, mix(0.3, 0.85, uGlow)), col, drawn) * (1.0 + 0.6 * pulse);
  gl_PointSize = (mix(2.0, 1.7 + 0.6 * (0.5 + 0.5 * d) + 0.5 * f, drawn) + 1.4 * pulse) * uPx * (uD / -v.z);
  if (lm > 0.0) {
    int si = gl_VertexID % ${SWOOSH_N};
    vec4 sp = texelFetch(uSwoosh, ivec2(si % 64, si / 64), 0);
    float ja = h * 6.2832, jr = 0.004 * fract(s2 * 37.1);
    vec2 tgt = uOrbN.xy + (sp.xy + vec2(cos(ja), sin(ja)) * jr) * uOrbN.zw;
    // On the way between the paths' rings and the swoosh, the grains atomize into a halo round the orb (a curve
    // through it): the opening's swoosh breaks up into it, and at the end the paths gather through it.
    float ha = h * 6.2832 + s1 * 0.9 + uTime * 0.12, hr = 1.18 + 0.6 * fract(s2 * 13.7);
    vec2 halo = uOrbN.xy + vec2(cos(ha), sin(ha)) * hr * uOrbN.zw, from = gl_Position.xy / gl_Position.w;
    gl_Position = vec4((1.0 - lm) * (1.0 - lm) * from + 2.0 * lm * (1.0 - lm) * halo + lm * lm * tgt, 0.0, 1.0);
    vCol = mix(vCol, mix(vec3(0.0, 0.36, 0.38), vec3(0.07, 0.74, 0.74), sp.z), lm); // the mark's teal, brighter at the head
    vA = mix(vA, uLogoA * (0.55 + 0.9 * h) * sp.z, lm);
    gl_PointSize = mix(gl_PointSize, 2.4 * uPx, lm);
  }
}`;

const STRAND_FS = `#version 300 es
precision highp float;
in vec3 vCol; in float vA; in float vG; out vec4 o;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0; float r = dot(c, c); if (r > 1.0) discard;
  float a = vA * smoothstep(1.0, 0.1, r) * (0.6 + 0.8 * vG);
  o = vec4(vCol * a, a);
}`;

// The plane's own light: a glow round the orb, and round each Lab as bright as it's dense.
const DISC_VS = `#version 300 es
precision highp float;
${GLSL_CAM}
layout(location = 0) in vec2 aQ;
uniform float uR;
out vec2 vP;
void main() { vec3 p = vec3(aQ.x * uR, 0.0, aQ.y * uR); vP = p.xz; gl_Position = toClip(toView(p)); }`;

const DISC_FS = `#version 300 es
precision highp float;
in vec2 vP; uniform float uAmt; uniform vec4 uLab[10];
out vec4 o;
${GLSL_HASH}
void main() {
  float r = length(vP);
  vec3 c = vec3(0.0, 0.62, 0.66) * (exp(-(r - 1.0) / 1.0) * 0.5 + exp(-(r - 1.0) / 3.0) * 0.14);
  for (int i = 0; i < 10; i++) {
    vec2 d = vP - uLab[i].xy;
    c += vec3(0.24, 0.6, 0.62) * uLab[i].z * exp(-dot(d, d) / (uLab[i].w * uLab[i].w));
  }
  float a = uAmt * smoothstep(5.8, 3.8, r) * smoothstep(0.9, 1.15, r) * (0.55 + 0.9 * hash(gl_FragCoord.xy));
  o = vec4(c * a, 0.0);
}`;

const ORB_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aQ; uniform vec4 uRect;
void main() { gl_Position = vec4(mix(uRect.xy, uRect.zw, aQ * 0.5 + 0.5), 0.0, 1.0); }`;

const ORB_FS = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform vec2 uTan; uniform vec3 uCenter; uniform float uR;
uniform vec3 uPole; uniform vec3 uLight; uniform mat3 uInv; uniform sampler2D uRamp;
uniform float uBright; uniform float uHalo; uniform float uGlint; uniform float uReveal; uniform vec2 uShift;
out vec4 o;
${GLSL_HASH}
void main() {
  vec2 ndc = gl_FragCoord.xy / uRes * 2.0 - 1.0 - uShift;
  vec3 dir = normalize(vec3(ndc.x * uTan.x, ndc.y * uTan.y, -1.0));
  // The grain is pinned to the orb (by whole pixels from its centre), so it travels with the orb as it moves.
  vec2 cPx = (vec2(uCenter.x / (-uCenter.z * uTan.x), uCenter.y / (-uCenter.z * uTan.y)) + uShift) * 0.5 * uRes + 0.5 * uRes;
  vec2 g = floor(gl_FragCoord.xy - cPx);
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
    float dj = d + (hash(g) - 0.5) * 0.13;
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
    // At the opening the bands paint in from the pole down: teal, then the ink band, then the red.
    c *= smoothstep(1.0 - uReveal * 2.4, 1.18 - uReveal * 2.4, d);
    col = c * uBright * cover; alpha = cover;
  }
  // A halo just outside the limb, with the grain in it: red below, a little teal above.
  float outside = max(dist - uR, 0.0) / uR;
  float side = dot(off / max(dist, 1e-5), uPole);
  vec3 hc = mix(vec3(0.84, 0.17, 0.2), vec3(0.0, 0.58, 0.63), smoothstep(-0.6, 0.6, side));
  float hw = mix(0.95, 0.55, smoothstep(-0.6, 0.6, side));
  float hl = uReveal * (exp(-outside / 0.08) * 0.7 + exp(-outside / 0.3) * 0.22) * hw * uHalo * (1.0 - cover) * (0.65 + 0.7 * hash(g.yx + 3.0));
  col += hc * hl * 0.55; alpha += hl * 0.22;
  o = vec4(col, min(alpha, 1.0));
}`;


// The finishing pass.
const FULL_VS = `#version 300 es
precision highp float;
out vec2 vUv;
void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

const PREFILTER_FS = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uSrc; uniform vec2 uTexel; uniform float uThreshold;
out vec4 o;
void main() {
  vec3 c = (texture(uSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture(uSrc, vUv + uTexel * vec2(1.0, -1.0)).rgb +
            texture(uSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture(uSrc, vUv + uTexel * vec2(1.0, 1.0)).rgb) * 0.25;
  float br = max(c.r, max(c.g, c.b));
  float knee = uThreshold * 0.6;
  float soft = clamp(br - uThreshold + knee, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 1e-4);
  float w = max(soft, br - uThreshold) / max(br, 1e-4);
  o = vec4(c * w, 1.0);
}`;

const DOWN_FS = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uSrc; uniform vec2 uTexel;
out vec4 o;
void main() {
  vec3 c = texture(uSrc, vUv).rgb * 4.0;
  c += texture(uSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture(uSrc, vUv + uTexel * vec2(1.0, -1.0)).rgb;
  c += texture(uSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture(uSrc, vUv + uTexel * vec2(1.0, 1.0)).rgb;
  o = vec4(c / 8.0, 1.0);
}`;

const UP_FS = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uSrc; uniform vec2 uTexel;
out vec4 o;
void main() {
  vec3 c = texture(uSrc, vUv + uTexel * vec2(-2.0, 0.0)).rgb + texture(uSrc, vUv + uTexel * vec2(2.0, 0.0)).rgb;
  c += texture(uSrc, vUv + uTexel * vec2(0.0, -2.0)).rgb + texture(uSrc, vUv + uTexel * vec2(0.0, 2.0)).rgb;
  c += (texture(uSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture(uSrc, vUv + uTexel * vec2(1.0, -1.0)).rgb +
        texture(uSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture(uSrc, vUv + uTexel * vec2(1.0, 1.0)).rgb) * 2.0;
  o = vec4(c / 12.0, 1.0);
}`;

const COMPOSITE_FS = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uScene; uniform sampler2D uBloom;
uniform float uBloomAmt; uniform vec2 uRes; uniform vec4 uShock; uniform float uAspect; uniform float uBg;
out vec4 o;
${GLSL_HASH}
vec3 shoulder(vec3 c) { vec3 k = vec3(0.88); return mix(c, k + (1.0 - k) * (1.0 - exp(-(c - k) / (1.0 - k))), step(k, c)); }
// The stage behind the world, exactly as the page's CSS paints it (.hm-world: ink, a deep-teal glow right of
// centre, a teal one in the top-left corner, and the brand's grain laid over the glows), so the world can be
// screened over it here, in one opaque picture, rather than by the browser's compositor every frame (which a
// phone feels). uv from the bottom left; CSS from the top left.
vec3 stage(vec2 uv) {
  vec2 p = vec2(uv.x, 1.0 - uv.y);
  float m1 = clamp(1.0 - length(p / vec2(0.55, 0.45)), 0.0, 1.0);
  float m2 = clamp(1.0 - length((p - vec2(1.0, 0.62)) / vec2(0.5, 0.4)), 0.0, 1.0);
  vec3 b = mix(vec3(0.0, 20.0, 27.0) / 255.0, vec3(0.0, 95.0, 104.0) / 255.0, 0.42 * m2);
  b = mix(b, vec3(0.0, 148.0, 160.0) / 255.0, 0.3 * m1);
  // The grain: white at about a seventh, overlaid at 0.55 where the glows are (on a dark ground, overlay of
  // white lifts by its alpha).
  float m = m1 + m2 * (1.0 - m1), n = 0.5 + 0.3 * (hash(gl_FragCoord.xy) - 0.5);
  return b * (1.0 + 0.151 * m * n);
}
void main() {
  vec2 uv = vUv;
  // The shockwave: a ring from the orb that bends what's behind it as it passes.
  vec2 d = (uv - uShock.xy) * vec2(uAspect, 1.0);
  float r = length(d);
  float ring = exp(-pow((r - uShock.z) / 0.035, 2.0)) * uShock.w;
  uv -= (d / max(r, 1e-4)) * ring * 0.012 / vec2(uAspect, 1.0);
  // A touch of colour fringing toward the edges, as in a real lens.
  vec2 fr = (uv - 0.5) * 0.0012;
  vec3 c = vec3(texture(uScene, uv + fr).r, texture(uScene, uv).g, texture(uScene, uv - fr).b);
  c += texture(uBloom, uv).rgb * uBloomAmt;
  c += vec3(0.86, 0.91, 0.97) * ring * 0.08; // the orb's wave: the national org's, silver
  c = shoulder(c);
  // The brand's grain, only where there's light.
  float l = max(c.r, max(c.g, c.b));
  c += (hash(gl_FragCoord.xy) - 0.5) * 0.05 * smoothstep(0.02, 0.35, l); // (held still: animated, it flickered)
  c = clamp(c, 0.0, 1.0);
  // Screened over the stage (as the page would, with mix-blend-mode: screen).
  if (uBg > 0.5) c = 1.0 - (1.0 - stage(vUv)) * (1.0 - c);
  o = vec4(c, 1.0);
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

/** What you're pointing at (or tapped), for the page's card: where it is on screen, and what it is. */
export interface Hover { x: number; y: number; r: number; type: string; kind: string; title: string; detail: string }
/** The card's words (content/site/home.json, model.hover): each kind of actor, and a Lab. [one, many] pairs take {n}. */
export type HoverWords = Record<string, Record<string, string | string[]>>;
export interface FrameState {
  p: number; s: number; w: number[]; beats: number[]; hover: Hover | null; orb: { x: number; y: number; r: number }; paused: boolean; t: number;
  /** How much the system holds the screen (the rest of the time it's the weave, or a thread). */
  sys: number; width: number; height: number;
  /** How far the logo has formed, at the very end (0 … 1), and how far it has settled into the brand's own artwork. */
  logo: number; settle: number;
  /** The wordmark's light (at the opening, and as the logo forms at the end), and how far the opening is done
   (0 … 1: the page's own words wait for it). */
  word: number; intro: number;
  /** The headline's second line (0 … 1): it comes in as the hero acts out the first ("Find your people."),
   when the people it gathered make something together. */
  title2: number;
}
export interface OrbNetOptions { intro?: boolean; introReady?: () => boolean; still?: boolean; poster?: boolean; story?: HTMLElement; anchors?: HTMLElement[]; stage?: HTMLElement; faces?: string[]; words?: HoverWords; inspectable?: () => boolean; onFrame?: (s: FrameState) => void }
export interface OrbNet { setPaused(v: boolean): void; paused(): boolean; setOrbHover(v: boolean): void; join(): void }

/** Start the live model in `wrap` (it gets `is-live` once it draws). Returns null without WebGL 2. */
export function mountOrbNet(wrap: HTMLElement, opts: OrbNetOptions = {}): OrbNet | null {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: false, alpha: false, preserveDrawingBuffer: Boolean(opts.poster) });
  if (!gl) return null;
  const hdr = Boolean(gl.getExtension("EXT_color_buffer_float"));
  // Phones (and small machines) get a lighter world, so it keeps an even 60 frames a second: fewer pixels
  // (about 1.4 per CSS pixel), a bloom built from a quarter-size picture, shorter orbit trails, and a little
  // less dust. The look is the same; the GPU does about half the work.
  const small = !opts.poster && (matchMedia("(max-width: 700px)").matches || (navigator.hardwareConcurrency || 8) <= 4);
  const TSEG = small ? 3 : 5;
  let P: Record<string, ReturnType<typeof compile>>;
  try {
    P = {
      actor: compile(gl, ACTOR_VS, POINT_FS), sprite: compile(gl, SPRITE_VS, POINT_FS), tie: compile(gl, TIE_VS, LINE_FS), trail: compile(gl, TRAIL_VS.replace("const int SEG = 5;", `const int SEG = ${TSEG};`), LINE_FS),
      fab: compile(gl, FABRIC_VS, FABRIC_FS), strand: compile(gl, STRAND_VS, STRAND_FS), disc: compile(gl, DISC_VS, DISC_FS), orb: compile(gl, ORB_VS, ORB_FS),
      pre: compile(gl, FULL_VS, PREFILTER_FS), down: compile(gl, FULL_VS, DOWN_FS), up: compile(gl, FULL_VS, UP_FS), comp: compile(gl, FULL_VS, COMPOSITE_FS),
    };
  } catch (e) { console.warn("orbnet", e); return null; }
  wrap.appendChild(canvas);

  const still = Boolean(opts.still || opts.poster);
  // The stage is painted into the picture (see stage() in the composite), except for the poster, which the page
  // screens over the stage itself.
  const bake = !opts.poster;
  const model = new Model(small ? 0.5 : 0.8, !still);
  const rnd = mulberry(7);

  /* buffers */
  const vao = (layout: [WebGLProgram, string, number, number?][], data: Float32Array, usage: number, inst = false) => {
    const v = gl.createVertexArray()!; gl.bindVertexArray(v);
    const buf = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    const stride = layout.reduce((s, l) => s + l[2], 0) * 4; let off = 0;
    for (const [prog, name, n, fixed] of layout) {
      const loc = fixed ?? gl.getAttribLocation(prog, name);
      if (loc >= 0) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, gl.FLOAT, false, stride, off); if (inst) gl.vertexAttribDivisor(loc, 1); }
      off += n * 4;
    }
    return { v, buf };
  };
  // The quad corners every soft line is drawn from.
  const corners = new Float32Array([0, -1, 1, -1, 0, 1, 1, 1]);
  const cornerBuf = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf); gl.bufferData(gl.ARRAY_BUFFER, corners, gl.STATIC_DRAW);
  const withCorners = () => { gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(0, 0); };
  // Ties: per instance, [a, b, segment, tie] and [bridge, Lab a, Lab b, spare].
  const MAX_TI = MAX_EDGES + 1400 * 6 + 8;
  const tieInst = new Float32Array(MAX_TI * 8);
  const TI = (() => {
    const v = gl.createVertexArray()!; gl.bindVertexArray(v); withCorners();
    const buf = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, tieInst, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 0); gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16); gl.vertexAttribDivisor(2, 1);
    return { v, buf };
  })();
  let tieCount = 0, tieFixed = 0;
  const TRV = (() => { const v = gl.createVertexArray()!; gl.bindVertexArray(v); withCorners(); return v; })();
  // Sparks (CPU points).
  const PT: [WebGLProgram, string, number][] = [[P.sprite.prog, "aP", 3], [P.sprite.prog, "aS", 4], [P.sprite.prog, "aC", 4]];
  const sparkArr = new Float32Array(MAX_PULSES * TAIL * 11);
  const SP = vao(PT, sparkArr, gl.DYNAMIC_DRAW);
  // Orbits' dust.
  const grid: number[] = [];
  for (let R = 1.2; R < 6.3; R += 0.16 + rnd() * 0.14) {
    const k = rnd(), bright = 0.5 + rnd() * 0.7, n = Math.round((2 * Math.PI * R) / (small ? 0.04 : 0.03));
    for (let i = 0; i < n; i++) grid.push(R + (rnd() - 0.5) * 0.02, (i / n) * Math.PI * 2 + rnd() * 0.01, k, bright);
  }
  const FB = vao([[P.fab.prog, "aG", 4]], new Float32Array(grid), gl.STATIC_DRAW);
  const gridN = grid.length / 4;
  // The weave's dust: each path's points, spread evenly along it, with two seeds for where in the strand.
  const perStrand = small ? 5000 : 14000, strandArr: number[] = [];
  for (let k = 0; k < 3; k++) for (let i = 0; i < perStrand; i++) strandArr.push(k, (i + rnd()) / perStrand, rnd(), rnd());
  const ST = vao([[P.strand.prog, "aS", 4]], new Float32Array(strandArr), gl.STATIC_DRAW);
  const strandN = strandArr.length / 4;
  // The logo's swoosh, as points (src/scripts/swoosh.ts): x, y (on the orb's radius), brightness.
  const swooshTex = (() => {
    const raw = atob(SWOOSH), bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const i16 = new Int16Array(bytes.buffer), rows = Math.ceil(SWOOSH_N / 64), f = new Float32Array(64 * rows * 4);
    for (let i = 0; i < SWOOSH_N; i++) { f[i * 4] = i16[i * 3] / 10000; f[i * 4 + 1] = i16[i * 3 + 1] / 10000; f[i * 4 + 2] = i16[i * 3 + 2] / 1000; f[i * 4 + 3] = 1; }
    const t = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 64, rows, 0, gl.RGBA, gl.FLOAT, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return t;
  })();
  // The orb's and the disc's quad.
  const QD = (() => { const v = gl.createVertexArray()!; gl.bindVertexArray(v); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); return v; })();
  const EMPTY = gl.createVertexArray()!;
  gl.bindVertexArray(null);

  /* textures */
  const ROWS = Math.ceil(MAX_NODES / TEXW);
  const dataTex = (w: number, h: number) => {
    const t = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return t;
  };
  const posArr = new Float32Array(TEXW * ROWS * 4), stArr = new Float32Array(TEXW * ROWS * 4), orbArr = new Float32Array(TEXW * ROWS * 4);
  const posTex = dataTex(TEXW, ROWS), stTex = dataTex(TEXW, ROWS), orbTex = dataTex(TEXW, ROWS);
  const TIEW = 128, TIEROWS = Math.ceil(MAX_EDGES / TIEW);
  const tieArr = new Float32Array(TIEW * TIEROWS * 4);
  const tieTex = dataTex(TIEW, TIEROWS);
  const ramp = new Uint8Array(101 * 4); RAMP.split(",").map(Number).forEach((v, i) => { ramp[Math.floor(i / 3) * 4 + (i % 3)] = v; });
  for (let i = 0; i < 101; i++) ramp[i * 4 + 3] = 255;
  const rampTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, rampTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 101, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, ramp);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // The faces' atlas: up to nine portraits in a 3×3 grid, drawn as they load.
  const facesTex = gl.createTexture(); let facesReady = 0;
  gl.bindTexture(gl.TEXTURE_2D, facesTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 220, 190, 255]));
  if (opts.faces?.length) {
    const atlas = document.createElement("canvas"); atlas.width = atlas.height = 384;
    const ctx = atlas.getContext("2d")!;
    Promise.all(opts.faces.slice(0, 9).map((src, i) => new Promise<void>((res) => {
      const im = new Image(); im.decoding = "async";
      im.onload = () => { ctx.drawImage(im, (i % 3) * 128, Math.floor(i / 3) * 128, 128, 128); res(); };
      im.onerror = () => res(); im.src = src;
    }))).then(() => {
      gl.bindTexture(gl.TEXTURE_2D, facesTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      facesReady = 1;
      if (still || pausedFlag) draw(performance.now());
    });
  }

  /* render targets: the scene, and the bloom's chain */
  interface RT { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number }
  const makeRT = (w: number, h: number): RT => {
    const tex = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, tex);
    if (hdr) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer()!; gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo, w, h };
  };
  const freeRT = (r: RT) => { gl.deleteTexture(r.tex); gl.deleteFramebuffer(r.fbo); };
  let scene: RT | null = null; let mips: RT[] = [];

  /* sizing and quality */
  const QMAX = small ? 0.7 : 1, QMIN = small ? 0.5 : 0.5;
  let W = 1, H = 1, cssW = 1, cssH = 1, dpr = 1, quality = QMAX, frameMs = 1000 / 60;
  // A phone's frame pacing (see draw()): the last step down and what it was for, whether a frame cap (not the
  // load) is holding it back, and when it last settled for an even 30.
  let lastDrop: { q: number; med: number } | null = null, capped = false, lockedAt = 0;
  const resize = () => {
    cssW = wrap.clientWidth; cssH = wrap.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(2, Math.round(cssW * dpr * quality)); H = Math.max(2, Math.round(cssH * dpr * quality));
    canvas.width = W; canvas.height = H;
    if (scene) freeRT(scene); mips.forEach(freeRT);
    scene = makeRT(W, H);
    // The bloom's chain: from half size down five levels, or on a phone from a quarter size down four (the same
    // reach, with the biggest, costliest level skipped).
    mips = []; let w = small ? W >> 1 : W, h = small ? H >> 1 : H;
    for (let i = 0; i < (small ? 4 : 5); i++) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); mips.push(makeRT(w, h)); }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (still || pausedFlag) draw(performance.now());
  };

  /* inputs */
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, cx: -1e4, cy: -1e4, inside: false, quiet: false, pinned: -1, pinnedLab: -1, pinUntil: 0 };
  // The scroll, read (scrollP) and followed (scrollE, and on a touch screen its speed, scrollV).
  const touch = matchMedia("(pointer: coarse)").matches, SPRING = 11;
  let scrollV = 0;
  let scrollP = 0, scrollE = 0, focus = -1, focusAmt = 0, lastFocus = 0, pausedFlag = false, orbHoverT = 0, orbHover = 0;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const host = opts.stage ?? wrap;
  if (!still) {
    // Over the page's own words and buttons (anything marked data-quiet, while it's showing) the model takes no
    // notice of the pointer: nothing to inspect there, and the view stops following you, so it never competes.
    let quietEls: HTMLElement[] | null = null;
    const shown = (el: HTMLElement) => { let op = 1; for (let x: HTMLElement | null = el; x && x !== document.body; x = x.parentElement) if (x.style.opacity) op = Math.min(op, parseFloat(x.style.opacity)); return op > 0.2; };
    const inQuiet = (x: number, y: number) => (quietEls ??= [...document.querySelectorAll<HTMLElement>("[data-quiet]")]).some((el) => {
      if (!shown(el)) return false;
      const q = el.getBoundingClientRect();
      return q.width > 0 && x > q.left - 24 && x < q.right + 24 && y > q.top - 14 && y < q.bottom + 14;
    });
    const move = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      ptr.cx = e.clientX - r.left; ptr.cy = e.clientY - r.top;
      ptr.inside = ptr.cx >= 0 && ptr.cy >= 0 && ptr.cx <= r.width && ptr.cy <= r.height;
      ptr.quiet = inQuiet(e.clientX, e.clientY);
      if (!ptr.quiet) {
        ptr.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
        ptr.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      }
    };
    if (fine) window.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", () => { ptr.inside = false; });
    // On a touch screen, tap anything in the model to see what it is (tap again, or elsewhere, to let go).
    if (!fine) host.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      const r = wrap.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const i = pick(x, y, 16), lab = i < 0 ? pickLab(x, y) : -1;
      const same = (i >= 0 && i === ptr.pinned) || (lab >= 0 && lab === ptr.pinnedLab);
      ptr.pinned = same ? -1 : i; ptr.pinnedLab = same ? -1 : lab; ptr.pinUntil = performance.now() + 5000;
      if (still || pausedFlag) draw(performance.now());
    });
  }
  // Each scene's anchor, as page y (its middle); re-measured as the page reflows. And the screen's height as the
  // layout sees it, which (unlike innerHeight) holds still while a phone's toolbar comes and goes, so the camera
  // doesn't lurch when it does.
  let anchorY: number[] = [], viewH = document.documentElement.clientHeight || window.innerHeight;
  const measureAnchors = () => { viewH = document.documentElement.clientHeight || window.innerHeight; anchorY = (opts.anchors ?? []).map((el) => { const r = el.getBoundingClientRect(); return r.top + window.scrollY + r.height / 2; }); };
  const readScroll = () => {
    if (anchorY.length > 1) {
      // The middle of the screen against the scenes' middles, and the camera always on its way from one to the
      // next: steadily, slowing only into and out of the pauses (PAUSE, glide()). The first scene's anchor is
      // the top of the page, so the very first touch of the scroll moves the world.
      const c = window.scrollY + viewH / 2, n = anchorY.length;
      const A = (k: number) => (k === 0 ? Math.min(anchorY[0], viewH / 2) : anchorY[k]);
      let sh = 0;
      if (c >= anchorY[n - 1]) sh = n - 1;
      else if (c > A(0)) {
        let k = 0; while (c > A(k + 1)) k++;
        const f = clamp((c - A(k)) / Math.max(1, A(k + 1) - A(k)), 0, 1);
        sh = k + glide(f, 1 - (PAUSE[k] ?? 0), 1 - (PAUSE[k + 1] ?? 0));
      }
      scrollP = sh / (SHOTS.length - 1);
    } else if (opts.story) {
      const r = opts.story.getBoundingClientRect();
      scrollP = clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1);
    }
  };
  if (opts.anchors) {
    const again = () => { measureAnchors(); readScroll(); };
    // (A phone's toolbars coming and going as you scroll change the window's height, but every height here is
    // in svh or lvh, which don't move with them: re-measuring then would only lay the page out mid-scroll.
    // Real changes in size show up in the page's own size, which the observer catches.)
    let lastW = window.innerWidth;
    measureAnchors(); new ResizeObserver(again).observe(document.body); window.addEventListener("load", again);
    window.addEventListener("resize", () => { if (window.innerWidth === lastW) return; lastW = window.innerWidth; again(); });
  }
  if (!still) window.addEventListener("scroll", readScroll, { passive: true });
  readScroll();

  /* the camera */
  // T is the target in the system's own space (the orb at the origin), Tw the same in the weave's, where the
  // first system is at the origin and the next one SPOOL below; SY is where the system is drawn in the weave's
  // space (0, or −SPOOL once the camera is past the middle of the weave, where neither is in view). wv: how far
  // the weave is drawn down out of the orbits (it never retracts).
  let cam = { M: [1, 0, 0, 0, 1, 0, 0, 0, 1] as M3, O: [1, 0, 0, 0, 1, 0, 0, 0, 1] as M3, T: [0, 0, 0] as V3, Tw: [0, 0, 0] as V3, SY: 0, wv: 0, halfW: 4.7, zoomW: 4.7, dense: 1, tanX: 0.15, tanY: 0.1, sh: [0, 0] as [number, number] };
  const D = 30;
  const shotTarget = (s: Shot): V3 => s.target === "new" ? model.newLab() : s.target === "pod" ? model.podCenter() : s.target === "dc" ? model.labs[0].c : s.target === "between" ? [model.labs[0].c[0] * 0.45, 0, model.labs[0].c[2] * 0.45] : [0, 0, 0];
  // How far to turn the system so the new Lab sits within the front arc (FRONT, as an angle round the orbits):
  // its people and the centre behind it both in view, and the orb never in front of it or under the words.
  const FRONT = [95, 135].map((d) => d * DEG);
  const wrapA = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
  const turnTo = (th: number) => {
    const lo = wrapA(th - FRONT[0]), hi = wrapA(th - FRONT[1]); // (ry(a) moves an angle round by −a)
    if (lo >= 0 && hi <= 0) return 0;
    return Math.abs(lo) < Math.abs(hi) ? lo : hi;
  };
  /** The world's steady turn at scene s: one way only (ry(a) moves an angle round by −a, so a falling angle
     turns the world the way its orbits go). */
  const spinAt = (s: number) => (-SPIN * DEG * s) / (SHOTS.length - 1);
  const camera = (p: number, t: number, ic = 0) => {
    const nS = SHOTS.length, s = clamp(p * (nS - 1), 0, nS - 1), i = Math.min(nS - 2, Math.floor(s)), k = s - i;
    const a = SHOTS[i], b = SHOTS[i + 1], a0 = SHOTS[Math.max(0, i - 1)], b1 = SHOTS[Math.min(nS - 1, i + 2)];
    // Through the shots on a smooth curve, so the camera keeps moving as you scroll (see through()). At the
    // opening (ic), it starts from the logo's own framing (the last shot's), and comes round to the page's.
    const E = SHOTS[SCENE.end];
    const Lv = (get: (q: Shot) => number) => { const v = through(get(a0), get(a), get(b), get(b1), k, i === 0); return ic > 0 ? lerp(v, get(E), ic) : v; };
    const L = (x: keyof Shot) => Lv((q) => q[x] as number);
    // (By scene, not framing: never blended towards the logo's at the opening.)
    const Ls = (get: (j: number) => number) => through(get(Math.max(0, i - 1)), get(i), get(i + 1), get(Math.min(nS - 1, i + 2)), k, i === 0);
    // ty: down the weave's axis, in the weave's space, and only ever down. Past the middle of the weave the
    // system is drawn SPOOL below (out of view from there), so the camera arrives at it still going down.
    const Tw = lerp3(shotTarget(a), shotTarget(b), ease(k)); Tw[1] += Ls((j) => SHOTS[j].ty ?? 0);
    const SY = Tw[1] < -SPOOL / 2 ? -SPOOL : 0, T: V3 = [Tw[0], Tw[1] - SY, Tw[2]];
    const shake = 0;
    // Held under the title, the camera drifts: a slow turn, a little rise and fall, a breath in and out, so the
    // whole picture moves in depth while you read (near things faster than far). It hands over to the scroll.
    const hw = still ? 0 : ease(clamp(1 - s * 1.5, 0, 1)) * (1 - ic);
    const yaw = (L("yaw") + ptr.x * 4.5 + (still ? 0 : Math.sin(t * 0.13) * 2.5) + hw * 7 * Math.sin(t * 0.26) + Math.sin(t * 47) * shake * 0.5) * DEG, pitch = ptr.y * 3 * DEG;
    const par = mul(ry(yaw), rx(pitch));
    // The world turns steadily one way as you go (spinAt). Starting a Lab: the new Lab is placed (before it's
    // born) to come round to the front just as the camera closes in on it (see draw); if you've lingered and it
    // has drifted, the turn takes up the difference, and keeps it after, so nothing turns back.
    const fW = Ls((j) => (j >= SCENE.found ? 1 : 0)), base = spinAt(s);
    const spin = base + (fW > 0.001 ? fW * turnTo(model.newTh - base) : 0);
    const M = mul(par, mul(rz(L("roll") * DEG), mul(rx((L("elev") + hw * 3.5 * Math.sin(t * 0.19 + 1)) * DEG), ry(spin))));
    const orbV = mul(par, mul(rz(L("oRoll") * DEG), rx(L("oElev") * DEG)));
    // Portrait screens frame closer (the system runs off the sides), and keep the lower third for the lines.
    const portrait = cssW < cssH;
    const halfW = L("halfW") * (portrait ? Lv((q) => q.pz ?? 0.6) : cssW < 900 ? 0.85 : 1) * (1 - 0.018 * shake) * (1 + hw * 0.04 * Math.sin(t * 0.33));
    const tanX = halfW / D, tanY = tanX / (W / H);
    const sh: [number, number] = portrait ? [L("px"), L("py")] : [L("sx"), L("sy")];
    // Actors grow as the shot closes in, by the shot's own framing: a narrow screen's closer crop
    // doesn't make them bigger, or a Lab seen whole on a phone crowds into a white blur.
    // And how tightly the network packs onto this screen, next to a wide desktop's view of the same shot.
    const dense = clamp((cssW * L("halfW")) / (1440 * halfW), 0.45, 1);
    cam = { M, O: orbV, T, Tw, SY, wv: Ls((j) => (j >= SCENE.weave[0] ? 1 : 0)), halfW, zoomW: L("halfW"), dense, tanX, tanY, sh };
  };
  const project = (p: V3): { x: number; y: number; z: number } => {
    const v = apply(cam.M, [p[0] - cam.T[0], p[1] - cam.T[1], p[2] - cam.T[2]]); v[2] -= D;
    return { x: ((v[0] / (-v[2] * cam.tanX) + cam.sh[0]) * 0.5 + 0.5) * cssW, y: (0.5 - (v[1] / (-v[2] * cam.tanY) + cam.sh[1]) * 0.5) * cssH, z: v[2] };
  };

  /* what you're pointing at */
  // How big an actor's mark is on screen (CSS px), as the actor shader sizes it.
  const faceSizeNow = () => 10 + 9 * clamp((4.7 / cam.zoomW - 1) / 1.5, 0, 1);
  const markR = (a: Actor, z: number) => {
    const size = a.face !== undefined ? faceSizeNow() : (a.type === HUMAN ? 7 : a.type === PLACE ? 9.5 : 10) * (1 + 0.08 * Math.sqrt(a.deg));
    return size * clamp(cssH / 600, 0.8, 1.2) * Math.pow(clamp(4.7 / cam.zoomW, 1, 2.8), 0.7) * (D / -z) * (a.face !== undefined ? 0.31 : 0.25);
  };
  /** The actor under a point on screen (a few pixels' grace), or −1; never one hidden behind the orb. */
  const pick = (cx: number, cy: number, slack: number) => {
    const oc = project([0, 0, 0]), orR = (1 / (-oc.z * cam.tanX)) * 0.5 * cssW;
    let best = -1, bd = Infinity;
    for (let i = 0; i < model.nodes.length; i++) {
      const a = model.nodes[i]; if (a.arrive?.intro || simT - a.born < 0.3) continue;
      const q = project(a.p); if (q.z > -1) continue;
      const d = Math.hypot(q.x - cx, q.y - cy) - markR(a, q.z);
      if (d > slack || d >= bd) continue;
      if (q.z < oc.z && Math.hypot(q.x - oc.x, q.y - oc.y) < orR) continue;
      best = i; bd = d;
    }
    return best;
  };
  /** The Lab round a point on screen, or −1. */
  const pickLab = (cx: number, cy: number) => {
    let hit = -1, best = 90 ** 2;
    model.labs.forEach((L, i) => { const q = project(L.c); const d2 = (q.x - cx) ** 2 + (q.y - cy) ** 2; if (d2 < best) { best = d2; hit = i; } });
    return hit;
  };
  // What it is, in the page's words: the kind of actor, and what it's doing here.
  const words = opts.words ?? {};
  const say = (k: string, f: string) => { const v = words[k]?.[f]; return typeof v === "string" ? v : ""; };
  const sayN = (k: string, f: string, n: number) => { const v = words[k]?.[f]; return Array.isArray(v) ? (n === 1 ? v[0] : v[1]).replace("{n}", String(n)) : ""; };
  const count = (i: number, type: number) => model.adj[i].reduce((c, e) => { const t = model.ties[e], o = t.a === i ? t.b : t.a; return c + (o >= 0 && model.nodes[o].type === type ? 1 : 0); }, 0);
  const describe = (i: number): Omit<Hover, "x" | "y" | "r"> => {
    const a = model.nodes[i], dc = a.c === 0, as = (type: string, k: string, title: string, detail: string) => ({ type, kind: say(k, "kind"), title, detail });
    if (a.arrive && !a.arrive.intro) return as("person", "newcomer", say("newcomer", "title"), say("newcomer", "detail"));
    if (a.face !== undefined) return as("person", "face", say("face", "title"), say("face", "detail"));
    if (a.type === HUMAN) {
      if (a.anchor !== undefined) return as("contributor", "bridge", say("bridge", "title"), say("bridge", "detail"));
      if (a.c < 0) return as("contributor", "contributor", say("contributor", "title"), say("contributor", "detail"));
      const pj = count(i, PROJECT), hu = count(i, HUMAN), pl = count(i, PLACE);
      const bits = [pj ? sayN("person", "projects", pj) : "", hu ? sayN("person", "people", hu) : "", pl ? say("person", dc ? "meetsDc" : "meets") : ""].filter(Boolean).join(", ");
      return as("person", "person", say("person", dc ? "dc" : "lab"), bits ? bits[0].toUpperCase() + bits.slice(1) : say("person", "none"));
    }
    if (a.type === PLACE) return as("place", "place", say("place", dc ? "dc" : "title"), say("place", dc ? "dcDetail" : "detail"));
    if (a.type === PROJECT) return as("project", "project", sayN("project", "people", Math.max(1, count(i, HUMAN))), model.podOf.has(i) ? say("project", "team") : say("project", dc ? "dc" : "lab"));
    if (a.c < 0) return as("commons", "knowledge", say("knowledge", "commons"), say("knowledge", "commonsDetail")); // the national corpus: its glyph is silver
    const pj = count(i, PROJECT);
    return as("knowledge", "knowledge", say("knowledge", "title"), pj ? sayN("knowledge", "projects", pj) : say("knowledge", "detail"));
  };
  // What each shot is about, by kind of actor (people, places, projects, knowledge): it steps forward, the
  // rest back a little.
  const EMPH = [[1, 1, 1, 1], [1.2, 1.3, 0.8, 0.8], [1.1, 0.7, 1.4, 0.7], [0.85, 0.85, 0.9, 1.45], [1, 1, 1, 1]];

  /* the frame */
  // The Build story's people: a fixed scatter for each, so they always drift in from the same places.
  const mulberryAt = (() => { const r = mulberry(31), cache: [number, number, number][] = []; for (let i = 0; i < 16; i++) cache.push([r(), r(), r()]); return (i: number) => cache[i % 16]; })();
  let knot = 0, settle = 0;
  // The opening: the page opens on the logo, as it ends. The wordmark lets go, the mark hands over to its dust,
  // and the swoosh atomizes into a halo round the orb that settles into the three paths' rings; then the whole
  // system forms round them, and the page's words come in. On a clock of its own (seconds), which waits for
  // the lockup's artwork to arrive (introReady, up to 1.8 s) and runs fast if you start scrolling. Not for a
  // still, the poster, or a page opened partway down (the page decides: opts.intro).
  const introOn = Boolean(opts.intro) && !still && !opts.poster, INTRO_END = 6.5;
  let introClock = 0;
  const pulsed: Record<number, boolean> = {};
  // The hero's heartbeat (see heroBeats): what's next and when, the act playing now, and when the headline's
  // second line comes in.
  let heroNext = 0, heroBeat = 0, title2At = -1, introDoneAt = -1;
  let act: { t0: number; P: V3; from: V3[] } | null = null;
  const massU = new Float32Array(40), labU = new Float32Array(40), labC = new Float32Array(30), labTilt = new Float32Array(20), ripU = new Float32Array(16);
  const t0 = performance.now();
  let last = t0, lastReal = t0, simT = 0, frame = 0, introT = 0;
  const fps: number[] = [];
  if (still) { for (let i = 0; i < 720; i++) { simT += 1 / 60; model.step(1 / 60, simT, i > 320 && i < 570, false); } } // a still: the last sparks settling, not mid-burst

  /* The hero's heartbeat. While the title holds the screen, something you can follow happens every few
     seconds, in turn: a few people find each other and make something (the headline, acted out), then an
     idea goes up from a Lab to the orb, which flares and sends it back out to every Lab. The first act
     brings in the headline's second line. And the first scroll gets an answer: the orb's big pulse. */
  const startAct = () => {
    // In front of the orb and to one side, in the orbits' plane, alternating sides: below the words.
    const side = heroBeat % 4 === 0 ? 0.8 : -0.8, face = Math.atan2(cam.M[8], cam.M[6]) + side, R = 2.3;
    const P: V3 = [Math.cos(face) * R, 0, Math.sin(face) * R];
    const from: V3[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.random() * 0.8, d = 0.9 + Math.random() * 0.6;
      from.push([P[0] + Math.cos(a) * d, (Math.random() - 0.5) * 0.5, P[2] + Math.sin(a) * d]);
    }
    act = { t0: simT, P, from };
    if (title2At === -1) title2At = simT + 1.9;
  };
  const ideaUp = () => {
    // From a Lab that's in front and on screen, nearest first; one whose idea can find its way up.
    const labs = model.labs.map((L, i) => ({ i, q: project(L.c) }))
      .filter(({ q }) => q.x > cssW * 0.08 && q.x < cssW * 0.92 && q.y > cssH * 0.3 && q.y < cssH * 0.96)
      .sort((a, b) => b.q.z - a.q.z);
    for (const { i } of labs.slice(0, 4)) {
      model.innovate(simT, { lab: i, major: true });
      const idea = model.ideas[model.ideas.length - 1];
      if (idea && model.pulses.some((pu) => pu.inv === idea.id && pu.kind === 1)) { model.nextMajor = simT + 6; return; }
    }
  };
  const heroBeats = (heroW: number, introDone: number, sCur: number, now: number) => {
    if (introDone >= 1 && introDoneAt < 0) introDoneAt = now;
    if (still || pausedFlag) return;
    if (heroW > 0.6 && introDone > 0.25 && simT > 1 && simT >= heroNext) {
      if (heroBeat % 2 === 0) startAct(); else ideaUp();
      heroBeat++; heroNext = simT + (heroBeat % 2 === 1 ? 6.8 : 5.6);
    }
    if (introDone > 0.9 && sCur > 0.18 && !pulsed[-1]) { pulsed[-1] = true; model.join(simT); }
    if (sCur < 0.04) pulsed[-1] = false;
  };
  // The headline's second line: with the first act's project; at once if there's no act to wait for.
  const title2Now = () => {
    if (title2At === -1 && (still || pausedFlag || scrollE > 0.03 || (introDoneAt > 0 && performance.now() - introDoneAt > 2500))) title2At = -2;
    return title2At === -2 ? 1 : title2At < 0 ? 0 : clamp((simT - title2At) / 0.6, 0, 1);
  };

  function draw(now: number) {
    const dt = still || pausedFlag ? 0 : Math.min(0.05, (now - last) / 1000);
    // Adapt: if frames run slow, draw fewer pixels; if there's room again, more. By the typical frame (the
    // median of 90), so one long frame (a scroll's hiccup, a tab coming back) never changes it, and with a wide
    // band between the two, so it settles rather than see-saws (each change costs a frame).
    if (!still && !pausedFlag && last !== now && now - last < 250) {
      fps.push(now - last);
      if (fps.length >= 90) {
        fps.sort((a, b) => a - b); const med = fps[45]; fps.length = 0; const q0 = quality;
        if (small) {
          // A phone is held to 60 frames a second, so its typical frame can't show room to spare: it steps down
          // as soon as it starts missing frames, since uneven frames are what reads as jitter. But not every slow
          // frame is the GPU's: Safari holds a page framed in another site (a preview) to 30 until it's tapped,
          // and Low Power Mode holds every page to 30. If stepping down didn't help, it's one of those caps, not
          // the load, so the step is undone and the world waits for the cap to lift instead of drawing blurrier.
          if (capped) { if (med < 18.5) capped = false; }
          else if (med > 18.5) {
            if (lastDrop && med >= lastDrop.med * 0.93) { quality = lastDrop.q; capped = true; lastDrop = null; }
            else if (quality > QMIN) { lastDrop = { q: quality, med }; quality = Math.max(QMIN, quality - 0.08); }
            // Still missing frames at its lightest: an even 30 instead (steady beats fast), tried again now and then.
            else { frameMs = 1000 / 30; lockedAt = now; }
          } else lastDrop = null;
        } else if (med > 22 && quality > QMIN) quality = Math.max(QMIN, quality - 0.15);
        else if (med < 12 && quality < QMAX) quality = Math.min(QMAX, quality + 0.1);
        if (q0 !== quality) resize();
      }
    }
    last = now;
    // Easing by time, not by frame, so the camera keeps up at any frame rate (and while paused).
    const rdt = Math.min(0.1, Math.max(0, (now - lastReal) / 1000)); lastReal = now;
    const ease60 = (k: number) => 1 - Math.pow(1 - k, rdt * 60);
    if (still) scrollE = scrollP;
    else if (touch) {
      // On a touch screen the scroll position reaches the page in uneven steps (a phone scrolls on its own
      // thread and reports back when it can), and easing toward each step makes the camera's speed jump with
      // it. A critically damped spring keeps the speed itself continuous, so uneven reports still give an even
      // glide (and it never overshoots). In small steps, so a slow frame can't upset it.
      for (let h = rdt; h > 1e-4; h -= 1 / 120) {
        const st = Math.min(h, 1 / 120);
        scrollV += (SPRING * SPRING * (scrollP - scrollE) - 2 * SPRING * scrollV) * st;
        scrollE += scrollV * st;
      }
    } else scrollE = lerp(scrollE, scrollP, ease60(0.1));
    const p = scrollE, sCur = p * (SHOTS.length - 1), w = shotWeights(p);
    // The model's own logic reads five beats: the whole, learn, build, share, and the close. (In the
    // threads' scenes the system is out of frame, so its beats there matter little.)
    const sum = (ix: number[]) => ix.reduce((acc, i) => acc + (w[i] ?? 0), 0);
    const learnW = sum(SCENE.learn), buildW = sum(SCENE.build), shareW = sum(SCENE.share);
    const beats = [sum([...SCENE.system.slice(0, 3), ...SCENE.weave, SCENE.born, SCENE.found]), learnW, buildW, shareW, (w[SCENE.close] ?? 0) + (w[SCENE.end] ?? 0)];
    // What the motif is: the system (its scenes' weight), else the weave, and how much each path's own thread leads.
    const sysW = clamp(sum(SCENE.system), 0, 1), focus3: V3 = [learnW, buildW, shareW], focusSum = clamp(learnW + buildW + shareW, 0, 1);
    // The very end: the system gives way to the logo. Everything but the orb fades, and the paths become the swoosh.
    // The opening's beats (see introOn): the wordmark lets go (iWord), the artwork hands over to the dust
    // (iSettle), the dust atomizes and settles into the paths' rings (iLogo), lit in their colours (iGlow),
    // while the camera comes round from the logo's framing to the page's (iCam); then the system forms.
    if (introOn && introClock < INTRO_END && (!opts.introReady || opts.introReady() || now - t0 > 1800)) introClock += rdt * (scrollP > 0.003 ? 5 : 1);
    const IT = introOn ? introClock : INTRO_END, at = (a: number, d: number) => ease(clamp((IT - a) / d, 0, 1));
    const iWord = introOn ? 1 - at(0.9, 0.6) : 0, iSettle = introOn ? 1 - at(1.1, 0.6) : 0, iLogo = introOn ? 1 - at(1.5, 1.6) : 0;
    const iCam = introOn ? 1 - at(2.0, 2.4) : 0, iGlow = introOn ? at(1.6, 0.6) * (1 - at(3.8, 2.2)) : 0, iRing = introOn ? at(1.5, 0.8) : 0;
    const introDone = introOn ? at(3.2, 1.4) : 1;
    // The very end: the system gives way to the logo. Everything but the orb fades, and the paths become the swoosh.
    const endLogo = ease(clamp((sCur - (SCENE.end - 0.8)) / 0.75, 0, 1)), logoK = Math.max(endLogo, iLogo), keep = 1 - logoK;
    // Starting a Lab: how far its first people have come in, by scroll (so every bit of scroll there shows).
    const founded = clamp((sCur - (SCENE.found - 0.8)) / 0.8, 0, 1);
    // Once the paths have arrived, the world hands over to the exact logo (the page lays the brand's own artwork
    // over the orb): the swoosh's dust and the orb's halo let go, so what's left is the mark itself.
    const settleTo = endLogo > 0.97 ? 1 : 0;
    settle = still ? settleTo : lerp(settle, settleTo, ease60(0.05));
    const settleAll = Math.max(settle, iSettle), word = Math.max(iWord, clamp((endLogo - 0.35) / 0.65, 0, 1));
    if (!still && !pausedFlag && IT > 2.5) { simT += dt; introT += dt; model.step(dt, simT, simT > 3.2, beats[3] > 0.5, beats[1] + beats[2] > 0.5, beats[2] > 0.5); }
    // The system's own opening runs on the clock, not on simulated time: on a slow device (frames capped at
    // 50 ms) the orb would otherwise sit half painted for seconds. After the logo's opening, if there is one.
    const openT = introOn ? Math.max(introT, IT - 2.7) : Math.max(introT, (now - t0) / 1000 - 0.2);
    // How much the title holds the screen; then the heartbeat that plays under it.
    const heroW = still ? 0 : ease(clamp(1 - sCur * 1.5, 0, 1));
    heroBeats(heroW, introDone, sCur, now);
    const t = simT, grow = still ? 1 : clamp(openT / 3.4, 0, 1), g = 1 - Math.pow(1 - grow, 3);
    ptr.x = lerp(ptr.x, ptr.tx, ease60(0.03)); ptr.y = lerp(ptr.y, ptr.ty, ease60(0.03));
    orbHover = lerp(orbHover, orbHoverT, ease60(0.12));
    // The new Lab, until it's born: placed where the world's steady turn will bring it to the front just as
    // the camera closes in on it, so nothing has to turn back for it.
    if (sCur < SCENE.born - 1) model.newTh = (FRONT[0] + FRONT[1]) / 2 + spinAt(SCENE.found);
    camera(p, t, iCam);
    const { M, T, tanX, tanY } = cam;

    // What you're pointing at (or tapped, on a touch screen): an actor, lit with its ties and whoever they
    // reach; else the Lab round the pointer. Its Lab steps forward, the others back.
    let hov = -1, hovLab = -1;
    if (!still && grow > 0.9 && (!opts.inspectable || opts.inspectable())) {
      if (fine) { if (ptr.inside && !ptr.quiet && orbHoverT < 0.5) { hov = pick(ptr.cx, ptr.cy, 6); if (hov < 0) hovLab = pickLab(ptr.cx, ptr.cy); } }
      else if (now < ptr.pinUntil) { hov = ptr.pinned; hovLab = ptr.pinnedLab; }
    }
    if (hov >= 0) {
      const a = model.nodes[hov]; a.flash = Math.max(a.flash, 0.9);
      for (const e of model.adj[hov]) { const tt = model.ties[e]; tt.flash = Math.max(tt.flash, 0.85); const o = tt.a === hov ? tt.b : tt.a; if (o >= 0) model.nodes[o].flash = Math.max(model.nodes[o].flash, 0.45); }
    }
    const hit = hov >= 0 ? model.nodes[hov].c : hovLab;
    if (hit >= 0) { focus = hit; lastFocus = hit; }
    const bsum = beats.reduce((s2, v) => s2 + v, 0) || 1;
    const emph = [0, 1, 2, 3].map((k) => beats.reduce((s2, v, i) => s2 + v * EMPH[i][k], 0) / bsum);
    focusAmt = lerp(focusAmt, hit >= 0 ? 1 : 0, ease60(0.08));
    if (hit < 0 && focusAmt < 0.01) focus = -1;

    // Actors → textures.
    const N = model.nodes.length;
    // Faces are for the close shots; seen whole, a Pod is just a few warm points, not a clump of rings.
    const faceSize = 10 + 9 * clamp((4.7 / cam.zoomW - 1) / 1.5, 0, 1);
    for (let i = 0; i < N; i++) {
      const a = model.nodes[i], o = i * 4;
      const born = still ? 1 : clamp((t - a.born) / 0.6, 0, 1);
      const lit = a.c < 0 ? 0.9 : model.labs[a.c].lit ? 1 : 0.88;
      // The value hierarchy: people stay low, the other actors a little brighter; light is for sparks.
      const base = a.type === HUMAN ? 0.62 : 0.9;
      posArr[o] = a.p[0]; posArr[o + 1] = a.p[1]; posArr[o + 2] = a.p[2]; posArr[o + 3] = base * lit * born * (a.arrive && !a.arrive.intro ? 0.7 : 1) * keep;
      const size = a.face !== undefined ? faceSize : (a.type === HUMAN ? 7 : a.type === PLACE ? 9.5 : 10) * (1 + 0.08 * Math.sqrt(a.deg));
      if (a.face !== undefined) posArr[o + 3] = lit * born * keep;
      stArr[o] = a.face !== undefined ? Math.max(a.flash, 0.55 * beats[2]) : a.flash; stArr[o + 1] = size; stArr[o + 2] = a.face !== undefined ? 10 + a.face : a.type; stArr[o + 3] = a.c;
      const trail = a.anchor !== undefined || a.arrive ? 0 : a.c < 0 ? 1 : a.c + 2;
      orbArr[o] = a.r; orbArr[o + 1] = a.th; orbArr[o + 2] = a.y; orbArr[o + 3] = trail;
    }
    const rows = Math.ceil(N / TEXW);
    const up = (tex: WebGLTexture, arr: Float32Array) => { gl!.bindTexture(gl!.TEXTURE_2D, tex); gl!.texSubImage2D(gl!.TEXTURE_2D, 0, 0, 0, TEXW, rows, gl!.RGBA, gl!.FLOAT, arr, 0); };
    up(posTex, posArr); up(stTex, stArr); up(orbTex, orbArr);
    // Ties: their list changes only when a tie forms; their strength and flash every frame.
    if (model.tiesDirty) {
      let k = 0;
      const put = (a: number, b: number, seg: number, ti: number, bridge: number, la: number, lb: number, cur: number) => { const o = k * 8; tieInst[o] = a; tieInst[o + 1] = b; tieInst[o + 2] = seg; tieInst[o + 3] = ti; tieInst[o + 4] = bridge; tieInst[o + 5] = la; tieInst[o + 6] = lb; tieInst[o + 7] = cur; k++; };
      model.ties.forEach((e, ti) => {
        const la = model.nodes[e.a].c, lb = e.b >= 0 ? model.nodes[e.b].c : -1;
        if ((e.bridge || e.b < 0) && k < MAX_TI - 16) for (let s = 0; s < 6; s++) put(e.a, e.b, s, ti, e.bridge ? 1 : 0, la, lb, 0);
        else put(e.a, e.b, -1, ti, model.podTie(e) ? 2 : 0, la, lb, 0);
      });
      tieFixed = k; model.tiesDirty = false;
    }
    tieCount = tieFixed;
    gl!.bindBuffer(gl!.ARRAY_BUFFER, TI.buf); gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, tieInst, 0, tieCount * 8);
    model.ties.forEach((e, i) => { tieArr[i * 4] = e.w; tieArr[i * 4 + 1] = e.flash; });
    gl!.bindTexture(gl!.TEXTURE_2D, tieTex); gl!.texSubImage2D(gl!.TEXTURE_2D, 0, 0, 0, TIEW, Math.ceil(model.ties.length / TIEW), gl!.RGBA, gl!.FLOAT, tieArr, 0);
    // Sparks. The sprites are drawn in the weave's space, so the system's own (its sparks, the hero's act, a new
    // Lab's people and its kit) are lifted to where the system is drawn there: dy, SY.
    let sn = 0;
    const SY = cam.SY;
    // Smaller and softer where the network packs tight on screen, so a busy Lab on a phone stays a Lab.
    const sS = 0.55 + 0.45 * cam.dense, sA = 0.5 + 0.5 * cam.dense;
    // (Written straight into the buffer: no arrays made per sprite, so no collector's pauses mid-scroll.)
    const putX = (q: V3, size: number, shape: number, flash: number, alpha: number, c: V3, dy = 0) => {
      const A = sparkArr, o = sn * 11;
      A[o] = q[0]; A[o + 1] = q[1] + dy; A[o + 2] = q[2]; A[o + 3] = size; A[o + 4] = shape; A[o + 5] = flash; A[o + 6] = alpha; A[o + 7] = c[0]; A[o + 8] = c[1]; A[o + 9] = c[2]; A[o + 10] = -1; sn++;
    };
    const putS = (q: V3, size: number, alpha: number, c: V3) => { if (sn < MAX_PULSES * TAIL) putX(q, size * sS, 5, 0, alpha * sA * keep, c, SY); };
    for (const pu of model.pulses) {
      if (t < pu.t0) continue;
      const u = clamp((t - pu.t0) / pu.dur, 0, 1);
      const A = model.end(pu.from, pu.to), B = model.end(pu.to, pu.from);
      const c: V3 = pu.kind === 1 ? [0.25, 1, 0.92] : pu.kind === 2 ? [0.86, 0.92, 1] : [1, 0.42, 0.3]; // build red; then what was learned rises teal, and comes back out silver: the national org's official version
      for (let k = 0; k < 5; k++) { const uu = u - k * 0.028; if (uu < 0) break; putS(lerp3(A, B, uu), (k ? 8 - k * 1.1 : 13) * (1 + 0.6 * heroW), Math.min(1, (k ? 0.5 - k * 0.08 : 0.85) * (1 - 0.25 * u) * (1 + 0.3 * heroW)), c); }
    }
    // The small stories on the paths' threads, told with the model's own glyphs, round the camera's place on
    // the helix (cy, below). The helix's geometry is the strand shader's, so a glyph set on a strand sits on it.
    // (dy: SY for one of the system's own.)
    const putG = (q: V3, size: number, shape: number, flash: number, alpha: number, c: V3, dy = 0) => {
      if (alpha < 0.01 || sn >= MAX_PULSES * TAIL) return;
      putX(q, size, shape, flash, alpha, c, dy);
    };
    // The weave: how far it's drawn down (it never retracts), how far the paths have poured into the next
    // system's orbits at the close, and its turn (with the scroll as well as with time).
    const stretch = cam.wv, pour = ease(clamp((sCur - (SCENE.close - 0.4)) / 0.7, 0, 1));
    // At the next system, the paths that arrived are lit; most of all beside "it keeps getting better".
    const lift = 0.9 * ((w[SCENE.centre] ?? 0) + (w[SCENE.born] ?? 0) + (w[SCENE.found] ?? 0) + (w[SCENE.close] ?? 0)) + 1.8 * (w[SCENE.weave[1]] ?? 0);
    const twist = (still ? 0 : t * 0.05) + sCur * 1.6;
    // Where along the helix a depth falls (Newton on the shader's depth curve, spool()), and a point on strand
    // k there. In the weave's space, round the camera's place on it (cy).
    const HX = HELIX, E0 = (u: number) => Math.exp(-u / HX.U0), E1 = (u: number) => Math.exp(-(1 - u) / HX.U1);
    const G = (u: number) => u - HX.U0 * (1 - E0(u)) - HX.U1 * (1 - E1(u)) + HX.U1 * (1 - E1(0)), G1 = G(1);
    const uAt = (y: number) => {
      const dep = HX.Y0 - y, L = Math.max(HX.LEN * stretch, 1e-3);
      let u = clamp(dep / L, 0, 1);
      for (let i = 0; i < 6; i++) { const f = (L * G(u)) / G1 - dep, d = (L * (1 - E0(u) - E1(u))) / G1; u = clamp(u - f / Math.max(d, 1e-3), 0, 1); }
      return u;
    };
    const onStrand = (k: number, y: number, r: number): V3 => { const th = uAt(y) * HX.TURNS * Math.PI * 2 + k * 2.0944 + twist; return [Math.cos(th) * r, y, Math.sin(th) * r]; };
    const cy = cam.Tw[1];
    const PEARL: V3 = [1, 0.86, 0.74], GOLD: V3 = [1, 0.8, 0.45], RED: V3 = [1, 0.36, 0.28], TEAL: V3 = [0.14, 0.84, 0.86], SILVER: V3 = [0.86, 0.92, 1];
    const wt = (i: number) => w[i] ?? 0;
    // Learn: open workshops (gold rings) come down its thread into a room of people, who light up as each
    // passes; below them the rings carry on brighter, improved by the room.
    if (wt(SCENE.workshops) > 0.01) {
      const v = wt(SCENE.workshops);
      let lit = 0;
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.07 + i / 3) % 1, y = cy + 4.8 - ph * 9.6;
        lit = Math.max(lit, Math.exp(-(((y - cy) / 0.55) ** 2)));
        putG(onStrand(0, y, 0.16), 30, 3, y < cy ? 0.7 : 0.1, v * Math.sin(Math.PI * ph), GOLD);
      }
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.3; putG([Math.cos(a) * 1.35, cy + Math.sin(a) * 1.05, 0.1 * Math.sin(a * 2)], 17, 0, 0.15 + 0.75 * lit, v, PEARL); }
    }
    // Build: strangers drift in and become a Pod round a problem situation on the thread; the Pod becomes
    // teams round what they propose, with Mentors beside them; one team's thread knots, a workshop comes to
    // it and frees it, then rises up the thread into what everyone shares; at the Showcase the projects light.
    const vb = wt(SCENE.pod) + wt(SCENE.teams) + wt(SCENE.stuck) + wt(SCENE.showcase) + 0.45 * wt(SCENE.showcase + 1) + 0.6 * wt(SCENE.pod - 1) * clamp(sCur - (SCENE.pod - 1), 0, 1);
    knot = 0;
    if (vb > 0.01) {
      const fPod = ease(clamp((sCur - (SCENE.pod - 0.75)) / 0.7, 0, 1)), fTeam = ease(clamp((sCur - (SCENE.teams - 0.75)) / 0.7, 0, 1));
      const teams: [number, number][] = [[-1.25, 0.45], [1.25, 0.45], [0, -1.15]];
      const sizes = [3, 4, 3];
      let n = 0;
      const show = wt(SCENE.showcase);
      teams.forEach(([tx, ty], ti) => {
        for (let j = 0; j < sizes[ti]; j++, n++) {
          const sr = mulberryAt(n), sa = (n / 10) * Math.PI * 2 + 0.4;
          const scatter: V3 = [(sr[0] < 0.5 ? -1 : 1) * (2.6 + sr[1] * 2.2), cy + (sr[2] - 0.5) * 6, (sr[0] - 0.5) * 2];
          const pod: V3 = [Math.cos(sa) * 1.35, cy + Math.sin(sa) * 1.1, 0];
          const ja = (j / sizes[ti]) * Math.PI * 2 + ti;
          const team: V3 = [tx + Math.cos(ja) * 0.46, cy + ty + Math.sin(ja) * 0.4, 0];
          const q = lerp3(lerp3(scatter, pod, fPod), team, fTeam);
          putG(q, 17, 0, 0.1 + 0.6 * show * (0.6 + 0.4 * Math.sin(t * 3 + n)), vb * (0.25 + 0.75 * fPod), PEARL);
        }
        const dq: V3 = [tx, cy + ty, 0];
        putG(dq, 28 + 8 * show, 2, 0.2 + 0.7 * show * (0.7 + 0.3 * Math.sin(t * 2.4 + ti)), vb * fTeam, RED);
        if (show > 0.01) for (let j = 0; j < 6; j++) {
          const ph = (t * 0.5 + j / 6 + ti * 0.13) % 1, a = (j / 6) * Math.PI * 2 + ti;
          putG([tx + Math.cos(a) * ph * 1.0, cy + ty + Math.sin(a) * ph * 0.9, 0], 10, 5, 0, show * (1 - ph) * 0.8, ph < 0.4 ? [1, 0.9, 0.8] : RED);
        }
      });
      const mentors: V3[] = [[-0.1, cy + 1.35, 0], [1.85, cy - 0.75, 0]];
      mentors.forEach((m) => { putG(m, 17, 0, 0.3, vb * fTeam, PEARL); putG(m, 34, 3, 0.2, vb * fTeam * 0.9, GOLD); });
      putG([0, cy, 0], 48, 5, 0, wt(SCENE.pod) * (1 - fTeam) * 0.55, RED); // the problem situation the Pod forms round
      // The knot, on a loop while its scene holds: it tangles, a workshop comes from a Mentor and frees it,
      // then rises up the thread.
      const vs = wt(SCENE.stuck);
      if (vs > 0.01) {
        const ph = (t % 7) / 7;
        knot = vs * ease(clamp((ph - 0.05) / 0.15, 0, 1)) * (1 - ease(clamp((ph - 0.55) / 0.17, 0, 1)));
        let rq: V3 | null = null, ra = 0;
        if (ph > 0.2 && ph < 0.62) { const k = ease(clamp((ph - 0.22) / 0.23, 0, 1)); rq = lerp3(mentors[0], [0, cy + 0.05, 0], k); ra = 1; }
        else if (ph >= 0.62) { const k = ease(clamp((ph - 0.62) / 0.33, 0, 1)); rq = onStrand(1, cy + k * 5.5, 0.16); ra = 1 - k * 0.6; }
        if (rq) putG(rq, 32, 3, 0.6, vs * ra, GOLD);
      }
    }
    // Share: contributions (a workshop teal, a method red, code gold) flow down its thread, downstream, to the
    // next system's centre, where the camera follows them; there they go into the orb, down the helix's axis.
    const vr = wt(SCENE.flowing) + wt(SCENE.centre);
    if (vr > 0.01) {
      const cols: V3[] = [TEAL, RED, GOLD], orbY = -HX.LEN * stretch, into = orbY + 3.4; // the next orb; where they leave the thread for it
      for (let i = 0; i < 6; i++) {
        const ph = (t * 0.06 + i / 6) % 1;
        for (let tl = 0; tl < 4; tl++) {
          const y = cy + 5 - (ph - tl * 0.012) * 10;
          const q = y > into ? onStrand(2, y, 0.16) : lerp3(onStrand(2, into, 0.16), [0, orbY, 0], ease(clamp((into - y) / (into - orbY), 0, 1)));
          putG(q, tl ? 15 - tl * 2.5 : 24, 5, 0, vr * Math.sin(Math.PI * ph) * (tl ? 0.6 - tl * 0.12 : 1) * (y < orbY + 0.5 ? 0 : 1), cols[i % 3]);
        }
      }
    }
    // Start a Lab: close on the new Lab. A few people come in from round it on the network and gather there (and
    // stay, once it's started); then The Labs' kit (the workshops, the Build Cycle, the tools) comes out to it
    // from the centre, silver: the national org's.
    const vf = wt(SCENE.found), vPeople = Math.max(vf, 0.75 * founded * sysW) * keep;
    if (vPeople > 0.01) {
      const NL = model.newLab(), th0 = Math.atan2(NL[2], NL[0]), nl = Math.hypot(NL[0], NL[2]) || 1;
      for (let i = 0; i < 7; i++) {
        const k = ease(clamp((founded - i * 0.06) / 0.55, 0, 1));
        const a0 = th0 + (i / 7) * Math.PI * 2 + 0.4, a1 = (i / 7) * Math.PI * 2 + t * 0.2;
        const from: V3 = [NL[0] + Math.cos(a0) * 1.9, NL[1] + 0.3 * Math.sin(i * 2.1), NL[2] + Math.sin(a0) * 1.9];
        const to: V3 = [NL[0] + Math.cos(a1) * 0.42, NL[1] + 0.07 * Math.sin(a1 * 2), NL[2] + Math.sin(a1) * 0.42];
        putG(lerp3(from, to, k), 15, 0, 0.15 + 0.65 * k, vPeople * (0.3 + 0.7 * k), PEARL, SY);
      }
      const kit = vf * ease(clamp((founded - 0.45) / 0.35, 0, 1));
      if (kit > 0.01) {
        const A: V3 = [(NL[0] / nl) * 1.1, 0, (NL[2] / nl) * 1.1], B: V3 = [NL[0] - (NL[0] / nl) * 0.3, NL[1], NL[2] - (NL[2] / nl) * 0.3];
        for (let i = 0; i < 3; i++) {
          const ph = (t * 0.2 + i / 3) % 1;
          for (let tl = 0; tl < 5; tl++) {
            const u = ph - tl * 0.03; if (u < 0) break;
            const q = lerp3(A, B, u); q[1] += Math.sin(Math.PI * u) * 0.3; // a low arc, out from the orb
            putS(q, tl ? 8 - tl * 1.1 : 13, kit * Math.sin(Math.PI * ph) * (tl ? 0.5 - tl * 0.08 : 0.85), SILVER);
          }
        }
      }
    }
    // The hero, acted out: a few people find each other (the headline's first line), ties form between them,
    // then they make something together (its second line): a project at the middle. Then it lets go.
    if (act && heroW > 0.01) {
      const k = simT - act.t0, P = act.P;
      if (k > 8) act = null;
      else {
        const fade = (1 - ease(clamp((k - 6.2) / 1.6, 0, 1))) * heroW;
        const made = ease(clamp((k - 2.1) / 0.8, 0, 1)), n = act.from.length, ring: V3[] = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + k * 0.3;
          const to: V3 = [P[0] + Math.cos(a) * 0.26, P[1] + 0.03 * Math.sin(a * 2), P[2] + Math.sin(a) * 0.26];
          const ki = ease(clamp((k - i * 0.12) / 2.0, 0, 1)), q = lerp3(act.from[i], to, ki);
          ring.push(q);
          const lit = 0.2 + 0.45 * ki + 0.7 * Math.sin(Math.PI * clamp((k - 2.1 - i * 0.07) / 0.7, 0, 1));
          putG(q, 17 * sS, 0, lit, fade * (0.3 + 0.7 * ki), PEARL, SY);
        }
        const tie = ease(clamp((k - 1.3) / 0.8, 0, 1)) * fade;
        if (tie > 0.01) for (let i = 0; i < n; i++) { const A = ring[i], B = ring[(i + 1) % n]; for (let d = 1; d < 4; d++) putS(lerp3(A, B, d / 4), 4.5, 0.6 * tie, GOLD); }
        if (made > 0.01) putG(P, 30 * sS * (0.6 + 0.4 * made), 2, 0.35 + 0.9 * (1 - made), fade * made, RED, SY);
      }
    }
    // The centre (and the open-project scene): the orb flares as the official version goes out to every Lab.
    for (const sc of [2, SCENE.centre]) {
      const v = wt(sc);
      if (!still && v > 0.65 && !pulsed[sc]) { pulsed[sc] = true; model.join(simT); }
      if (v < 0.3) pulsed[sc] = false;
    }
    gl!.bindBuffer(gl!.ARRAY_BUFFER, SP.buf); gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, sparkArr, 0, sn * 11);

    // Masses for the orbits' wells and the glows.
    massU.fill(0); labU.fill(0); labC.fill(0); labTilt.fill(0); ripU.fill(0);
    massU.set([0, 0, 1.0, 0.85], 0);
    model.labs.forEach((L, i) => {
      const k = Math.min(1.4, L.mass / 300);
      massU.set([L.c[0], L.c[2], 0.06 + 0.42 * k, 0.35 + L.size * 0.4], (i + 1) * 4);
      labU.set([L.c[0], L.c[2], (0.1 + 0.55 * k) * (L.lit ? 1.1 : 0.8) * (focus === i ? 1 + focusAmt : 1) * (1 + beats[2] * 0.8), L.size * 1.1], i * 4);
      labC.set(L.c, i * 3); labTilt.set(L.tilt, i * 2);
    });
    model.ripples.slice(-4).forEach((r, i) => { const age = t - r.t0; ripU.set([0, 0, 1.1 + age * 2.6, r.s * Math.max(0, 1 - age / 1.6) * (1 + 0.7 * heroW)], i * 4); });

    /* draw the scene */
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, scene!.fbo);
    gl!.viewport(0, 0, W, H);
    gl!.clearColor(0, 0, 0, 1); gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.enable(gl!.BLEND);
    const add = () => gl!.blendFunc(gl!.ONE, gl!.ONE), over = () => gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
    const px = dpr * quality * clamp(cssH / 600, 0.8, 1.2);
    // The system's own passes draw in its space; the weave and the sprites in the weave's (where the system
    // is SY below the first one's place).
    const camU = (U: Record<string, WebGLUniformLocation | null>, side: number, weave = false) => {
      const C = weave ? cam.Tw : T;
      gl!.uniformMatrix3fv(U.uM, true, M); gl!.uniform3f(U.uT, C[0], C[1], C[2]); gl!.uniform1f(U.uD, D); gl!.uniform2f(U.uTan, tanX, tanY); gl!.uniform1f(U.uSide, side); gl!.uniform2f(U.uShift, cam.sh[0], cam.sh[1]);
      gl!.uniform1f(U.uCullY, weave ? cam.SY : 0);
    };
    const stateU = (U: Record<string, WebGLUniformLocation | null>) => {
      gl!.activeTexture(gl!.TEXTURE1); gl!.bindTexture(gl!.TEXTURE_2D, posTex); gl!.uniform1i(U.uPos, 1);
      gl!.activeTexture(gl!.TEXTURE2); gl!.bindTexture(gl!.TEXTURE_2D, stTex); gl!.uniform1i(U.uSt, 2);
      gl!.activeTexture(gl!.TEXTURE3); gl!.bindTexture(gl!.TEXTURE_2D, orbTex); gl!.uniform1i(U.uOrb, 3);
    };
    const focusU = (U: Record<string, WebGLUniformLocation | null>) => { gl!.uniform1f(U.uFocus, focus >= 0 ? focus : lastFocus); gl!.uniform1f(U.uFocusAmt, focus >= 0 ? focusAmt : 0); };
    gl!.useProgram(P.sprite.prog); gl!.activeTexture(gl!.TEXTURE5); gl!.bindTexture(gl!.TEXTURE_2D, facesTex); gl!.uniform1i(P.sprite.U.uFaces, 5);
    const drawDisc = () => { add(); gl!.useProgram(P.disc.prog); gl!.bindVertexArray(QD); camU(P.disc.U, 1); gl!.uniform1f(P.disc.U.uR, 5.9); gl!.uniform1f(P.disc.U.uAmt, 0.11 * g * keep); gl!.uniform4fv(P.disc.U.uLab, labU); gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4); };
    const drawFabric = (side: number) => {
      add(); gl!.useProgram(P.fab.prog); gl!.bindVertexArray(FB.v); camU(P.fab.U, side);
      gl!.uniform1f(P.fab.U.uPx, px); gl!.uniform1f(P.fab.U.uGrow, g * keep); gl!.uniform1f(P.fab.U.uTime, t); gl!.uniform1f(P.fab.U.uBoost, 1 + beats[2] * 1.2);
      gl!.uniform4fv(P.fab.U.uMass, massU); gl!.uniform4fv(P.fab.U.uRip, ripU);
      gl!.drawArrays(gl!.POINTS, 0, gridN);
    };
    const drawTies = (side: number) => {
      add(); gl!.useProgram(P.tie.prog); gl!.bindVertexArray(TI.v); camU(P.tie.U, side); stateU(P.tie.U); focusU(P.tie.U);
      gl!.activeTexture(gl!.TEXTURE4); gl!.bindTexture(gl!.TEXTURE_2D, tieTex); gl!.uniform1i(P.tie.U.uTies, 4); gl!.uniform1i(P.tie.U.uTieW, TIEW); gl!.uniform1f(P.tie.U.uPod, beats[2]); gl!.uniform1f(P.tie.U.uDense, cam.dense);
      gl!.uniform2f(P.tie.U.uRes, W, H); gl!.uniform1f(P.tie.U.uPx, dpr * quality);
      gl!.drawArraysInstanced(gl!.TRIANGLE_STRIP, 0, 4, tieCount);
    };
    const drawTrails = (side: number) => {
      add(); gl!.useProgram(P.trail.prog); gl!.bindVertexArray(TRV); camU(P.trail.U, side); stateU(P.trail.U);
      gl!.uniform3fv(P.trail.U.uLabC, labC); gl!.uniform2fv(P.trail.U.uLabTilt, labTilt); gl!.uniform2f(P.trail.U.uRes, W, H); gl!.uniform1f(P.trail.U.uPx, dpr * quality); gl!.uniform1i(P.trail.U.uFirst, 0);
      gl!.drawArraysInstanced(gl!.TRIANGLE_STRIP, 0, 4, N * TSEG);
    };
    const drawActors = (side: number) => {
      add(); gl!.useProgram(P.actor.prog); gl!.bindVertexArray(EMPTY); camU(P.actor.U, side); stateU(P.actor.U); focusU(P.actor.U);
      gl!.uniform1f(P.actor.U.uPx, px); gl!.uniform1i(P.actor.U.uFirst, 0); gl!.uniform1f(P.actor.U.uZoom, Math.pow(clamp(4.7 / cam.zoomW, 1, 2.8), 0.7)); gl!.uniform1f(P.actor.U.uDense, cam.dense);
      gl!.activeTexture(gl!.TEXTURE5); gl!.bindTexture(gl!.TEXTURE_2D, facesTex); gl!.uniform1i(P.actor.U.uFaces, 5); gl!.uniform1f(P.actor.U.uFacesReady, facesReady);
      gl!.uniform4f(P.actor.U.uEmph, emph[0], emph[1], emph[2], emph[3]);
      gl!.drawArrays(gl!.POINTS, 0, N);
    };
    const drawSparks = (side: number) => { add(); gl!.useProgram(P.sprite.prog); gl!.bindVertexArray(SP.v); camU(P.sprite.U, side, true); gl!.uniform1f(P.sprite.U.uPx, px); gl!.uniform2f(P.sprite.U.uPar, 0, 0); gl!.drawArrays(gl!.POINTS, 0, sn); };
    const drawStrands = (side: number) => {
      add(); gl!.useProgram(P.strand.prog); gl!.bindVertexArray(ST.v); camU(P.strand.U, side, true);
      const U = P.strand.U;
      gl!.uniform1f(U.uPx, px); gl!.uniform1f(U.uTime, t); gl!.uniform1f(U.uStretch, stretch); gl!.uniform1f(U.uPour, pour); gl!.uniform1f(U.uLift, lift); gl!.uniform1f(U.uRing, Math.max(g, iRing)); gl!.uniform1f(U.uGlow, Math.max(w[1], iGlow));
      gl!.uniform1f(U.uTwist, twist);
      gl!.uniform3f(U.uFocus, focus3[0], focus3[1], focus3[2]); gl!.uniform1f(U.uFocusSum, focusSum);
      gl!.uniform1f(U.uCamY, cy); gl!.uniform1f(U.uPortrait, cssW < cssH ? 1 : 0);
      gl!.uniform2f(U.uKnot, knot, cy + 0.05);
      const ov = orbView([0, 0, 0]), oz = -ov[2], rxN = 1 / (oz * tanX), ryN = 1 / (oz * tanY);
      gl!.uniform1f(U.uLogo, logoK); gl!.uniform4f(U.uOrbN, ov[0] / (oz * tanX) + cam.sh[0], ov[1] / (oz * tanY) + cam.sh[1], rxN, ryN);
      const rCss = rxN * 0.5 * cssW; gl!.uniform1f(U.uLogoA, clamp((1.7 * 0.365 * rCss * rCss) / strandN, 0.02, 0.4) * (1 - settleAll));
      gl!.activeTexture(gl!.TEXTURE6); gl!.bindTexture(gl!.TEXTURE_2D, swooshTex); gl!.uniform1i(U.uSwoosh, 6);
      gl!.drawArrays(gl!.POINTS, 0, strandN);
    };
    const pole = apply(cam.O, [0, 1, 0]);
    const Oinv = tr(mul(cam.O, ry(t * 2 * DEG)));
    const Lgt = (() => { const v: V3 = [0.8 + ptr.x * 0.6, 0.3 - ptr.y * 0.6, 0.65]; const l = Math.hypot(...v); return v.map((x) => x / l) as V3; })();
    const drawOrb = (c: V3, r: number, bright: number, halo: number, glint: number, reveal: number) => {
      over(); gl!.useProgram(P.orb.prog); gl!.bindVertexArray(QD);
      const z = -c[2];
      const cx = c[0] / (z * tanX) + cam.sh[0], cy = c[1] / (z * tanY) + cam.sh[1], rx_ = (r * 3.2) / (z * tanX), ry_ = (r * 3.2) / (z * tanY);
      const U = P.orb.U;
      gl!.uniform2f(U.uShift, cam.sh[0], cam.sh[1]);
      gl!.uniform4f(U.uRect, cx - rx_, cy - ry_, cx + rx_, cy + ry_);
      gl!.uniform2f(U.uRes, W, H); gl!.uniform2f(U.uTan, tanX, tanY); gl!.uniform3f(U.uCenter, c[0], c[1], c[2]); gl!.uniform1f(U.uR, r);
      gl!.uniform3f(U.uPole, pole[0], pole[1], pole[2]); gl!.uniform3f(U.uLight, Lgt[0], Lgt[1], Lgt[2]);
      gl!.uniformMatrix3fv(U.uInv, true, Oinv);
      gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, rampTex); gl!.uniform1i(U.uRamp, 0);
      gl!.uniform1f(U.uBright, bright); gl!.uniform1f(U.uHalo, halo); gl!.uniform1f(U.uGlint, glint); gl!.uniform1f(U.uReveal, reveal);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    };
    const orbView = (w: V3): V3 => { const v = apply(M, [w[0] - T[0], w[1] - T[1], w[2] - T[2]]); v[2] -= D; return v; };
    const bodies = model.labs.map((L, i) => {
      const r = clamp((L.mass - 150) / 700, 0, 0.21);
      return { v: orbView(L.c), r: r * (0.5 + 0.5 * g), bright: (L.lit ? 1.05 : 0.8) * (focus === i ? 1 + 0.4 * focusAmt : 1) * g };
    }).filter((b) => b.r > 0.02);
    const born = ease(clamp(sCur - (SCENE.born - 1), 0, 1));
    if (born > 0.01) bodies.push({ v: orbView(model.newLab()), r: 0.17 * born * (1 + 0.22 * founded), bright: 1.15 * born * (1 + 0.2 * founded) }); // (it grows a little as its first people arrive)
    bodies.forEach((b) => { b.r *= keep; b.bright *= keep; });
    bodies.sort((a, b) => a.v[2] - b.v[2]);
    const orbC = orbView([0, 0, 0]);
    const reveal = still || introOn ? 1 : clamp(openT / 1.3, 0, 1); // (opening on the logo, the orb is whole from the start)

    drawDisc();
    drawFabric(-1); drawTrails(-1); drawTies(-1); drawActors(-1); drawSparks(-1); drawStrands(-1);
    bodies.filter((b) => b.v[2] < orbC[2]).forEach((b) => drawOrb(b.v, b.r, b.bright, 1.1 * b.bright, 0, 1));
    // (Settled, the brand's artwork covers the orb, so it draws a touch smaller and dimmer underneath: no rim shows.)
    drawOrb(orbC, (1 + 0.025 * orbHover) * (1 - 0.03 * settleAll), (1 + 0.45 * model.orbFlash + 0.18 * orbHover) * (1 - 0.6 * settleAll), (1 + 0.7 * model.orbFlash + 0.8 * orbHover) * (1 - settleAll), (still ? 0.6 : 1 + 1.5 * orbHover) * (1 - settleAll), reveal);
    drawFabric(1); drawTrails(1); drawTies(1);
    bodies.filter((b) => b.v[2] >= orbC[2]).forEach((b) => drawOrb(b.v, b.r, b.bright, 1.1 * b.bright, 0, 1));
    drawActors(1); drawSparks(1); drawStrands(1);

    /* the finishing pass: bloom, then everything together */
    gl!.disable(gl!.BLEND);
    const full = (prog: ReturnType<typeof compile>, src: RT, dst: RT | null, texel: [number, number]) => {
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, dst ? dst.fbo : null); gl!.viewport(0, 0, dst ? dst.w : W, dst ? dst.h : H);
      gl!.useProgram(prog.prog); gl!.bindVertexArray(EMPTY);
      gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, src.tex); gl!.uniform1i(prog.U.uSrc, 0); gl!.uniform2f(prog.U.uTexel, texel[0], texel[1]);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    };
    gl!.useProgram(P.pre.prog); gl!.uniform1f(P.pre.U.uThreshold, 1.05);
    full(P.pre, scene!, mips[0], small ? [1.5 / W, 1.5 / H] : [1 / W, 1 / H]);
    for (let i = 1; i < mips.length; i++) full(P.down, mips[i - 1], mips[i], [1 / mips[i - 1].w, 1 / mips[i - 1].h]);
    gl!.enable(gl!.BLEND); add();
    for (let i = mips.length - 2; i >= 0; i--) full(P.up, mips[i + 1], mips[i], [1 / mips[i + 1].w, 1 / mips[i + 1].h]);
    gl!.disable(gl!.BLEND);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null); gl!.viewport(0, 0, W, H);
    gl!.useProgram(P.comp.prog); gl!.bindVertexArray(EMPTY);
    gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, scene!.tex); gl!.uniform1i(P.comp.U.uScene, 0);
    gl!.activeTexture(gl!.TEXTURE1); gl!.bindTexture(gl!.TEXTURE_2D, mips[0].tex); gl!.uniform1i(P.comp.U.uBloom, 1);
    gl!.uniform1f(P.comp.U.uBloomAmt, 0.42 + 0.25 * model.orbFlash + 0.25 * orbHover); gl!.uniform2f(P.comp.U.uRes, W, H);
    gl!.uniform1f(P.comp.U.uAspect, W / H); gl!.uniform1f(P.comp.U.uBg, bake ? 1 : 0);
    const sc = { x: (orbC[0] / (-orbC[2] * tanX) + cam.sh[0]) * 0.5 + 0.5, y: (orbC[1] / (-orbC[2] * tanY) + cam.sh[1]) * 0.5 + 0.5 };
    const shock = model.ripples.length ? model.ripples[model.ripples.length - 1] : null;
    const age = shock ? t - shock.t0 : 9;
    gl!.uniform4f(P.comp.U.uShock, sc.x, sc.y, 0.05 + age * 0.55, shock ? Math.min(1, 0.6 * shock.s) * Math.max(0, 1 - age / 1.5) : 0);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    frame++;

    if (!wrap.classList.contains("is-live")) wrap.classList.add("is-live", ...(bake ? ["is-baked"] : []));

    // Tell the page what's on screen: the story's progress, each beat's weight, the orb, and what you're
    // pointing at.
    if (opts.onFrame) {
      opts.onFrame({
        p, s: sCur, w, beats, paused: pausedFlag, t: simT, width: cssW, height: cssH, sys: sysW, logo: logoK, settle: settleAll, word, intro: introDone, title2: title2Now(),
        hover: hov >= 0 ? (() => { const a = model.nodes[hov], q = project(a.p); return { x: q.x, y: q.y, r: markR(a, q.z), ...describe(hov) }; })()
          : hovLab >= 0 ? (() => { const q = project(model.labs[hovLab].c); return { x: q.x, y: q.y, r: 24, type: "lab", kind: say("lab", "kind"), title: say("lab", hovLab === 0 ? "dc" : "title"), detail: say("lab", hovLab === 0 ? "dcDetail" : "detail") }; })()
          : null,
        orb: (() => { const s = project([0, 0, 0]); return { x: s.x, y: s.y, r: (1 / (-s.z * cam.tanX)) * 0.5 * cssW }; })(),
      });
    }
  }

  new ResizeObserver(() => resize()).observe(wrap);
  resize();
  if (still) {
    draw(performance.now());
    if (opts.anchors && !opts.poster) window.addEventListener("scroll", () => { readScroll(); draw(performance.now()); }, { passive: true });
    return { setPaused() {}, paused: () => true, setOrbHover() {}, join() {} };
  }

  let on = false, raf = 0, visible = false;
  // On a phone, an even 60 frames a second: a 90 or 120 Hz screen otherwise asks for frames as fast as it
  // refreshes, and a world that can't always keep up stutters between the two rates. (Everything else on the
  // page is held still while it scrolls, so nothing needs more.)
  let drawn = 0;
  const loop = (now: number) => {
    if (frameMs > 20 && now - lockedAt > 30000) frameMs = 1000 / 60; // (every so often, try 60 again)
    if (!small || now - drawn > frameMs - 3) { drawn = now; draw(now); }
    raf = on ? requestAnimationFrame(loop) : 0;
  };
  const setOn = (v: boolean) => { if (v === on) return; on = v; if (on && !raf) { readScroll(); last = lastReal = performance.now(); raf = requestAnimationFrame(loop); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; setOn(visible && !document.hidden); }).observe(wrap);
  document.addEventListener("visibilitychange", () => setOn(visible && !document.hidden));
  return {
    setPaused(v: boolean) { pausedFlag = v; },
    paused: () => pausedFlag,
    setOrbHover(v: boolean) { orbHoverT = v ? 1 : 0; },
    join() { model.join(simT); },
  };
}

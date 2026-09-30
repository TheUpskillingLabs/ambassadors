/* The Labs, live: the home page's hero, a model of how The Labs works, told as a
   short story you scroll through.

   What it models. The Upskilling Labs as a federated, practice-based research
   network: local Labs where people learn by building, a commons of contributors
   and shared knowledge that ties them together, and the national Labs at the
   centre. It's drawn the way actor-network theory sees an organisation: no given
   scale, only actors and their ties. People, places (the libraries), projects and
   knowledge (playbooks, code) are all actors, each its own mark:
     people     a warm dot          places     a teal square
     projects   a red diamond       knowledge  a pale ring
   A Lab is nothing but its ties, and the whole behaves like a complex adaptive
   system: newcomers drift in and are pulled into the Lab with the strongest pull
   near them, new ties form as ideas spread, and it never stops rearranging.

   Gravity is the density of relationships. A Lab's mass is its ties, so a dense
   Lab pulls harder: its actors orbit tighter and faster, it draws in more
   newcomers, it glows, and it bends the orbits beneath it into a deeper well.
   Dense enough, a Lab closes into a small orb of its own: a network so held
   together it reads as one thing. The Labs' orb, the logo's, is the deepest well.

   Innovation arrives as jolts of energy, on a heartbeat. A project makes
   something new and a spark runs out along its ties (white); the big ones find
   their way up through a contributor to the orb (red). The orb flares, a
   shockwave crosses the view, and the idea comes back down (teal) to every Lab
   tied to the commons, where it spreads again. Sparks strengthen the ties they
   cross, adopters form new ties, and what reaches the orb leaves new knowledge
   in the commons. Everything leaves a fading trail along its orbit.

   The story, for the people we're recruiting (Upskillers and Mentors): it
   doesn't explain the structure, it shows what you get and what you join.
   The page's scroll moves the camera through five shots:
     0  the logo's view: the orb and the system round it, under the title
     1  build: inside the DC Lab, projects sparking as people build
     2  together: close on DC's people, the first cohort's faces lit
     3  bigger: a spark from DC up to the orb and back out to every Lab
     4  you: the whole system from above; your cursor is a newcomer, and
        clicking (or tapping) joins you to the nearest Lab, with a spark

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

interface Shot { at: number; target: "orb" | "dc" | "between" | "pod"; halfW: number; elev: number; roll: number; oElev: number; oRoll: number; yaw: number; sx: number; sy: number; px: number; py: number; pz?: number } // pz: how much closer a portrait screen frames it (0.6)
const SHOTS: Shot[] = [
  { at: 0.0, target: "orb", halfW: 4.7, elev: 27, roll: 28, oElev: 15.4, oRoll: 22.5, yaw: 0, sx: 0, sy: -0.3, px: 0, py: -0.14 }, // the logo's view, under the title
  { at: 0.25, target: "dc", halfW: 1.9, elev: 40, roll: 14, oElev: 28, oRoll: 16, yaw: -14, sx: 0.16, sy: 0.05, px: 0, py: 0.16 }, // build: inside a Lab
  { at: 0.47, target: "pod", halfW: 0.62, elev: 30, roll: 6, oElev: 18, oRoll: 10, yaw: 20, sx: 0.2, sy: 0.02, px: 0, py: 0.22, pz: 0.45 }, // together: close on a Pod
  { at: 0.69, target: "between", halfW: 3.9, elev: 30, roll: 24, oElev: 18, oRoll: 21, yaw: -6, sx: 0.12, sy: 0.05, px: 0, py: 0.18 }, // bigger: what you build travels
  { at: 0.92, target: "orb", halfW: 5.3, elev: 64, roll: 12, oElev: 40, oRoll: 16, yaw: 0, sx: 0.12, sy: 0.02, px: 0, py: 0.44 }, // you (on phones, high: the choice fills the lower half)
];
/** Where each shot sits in the story's progress, for the page's chapter rail. */
export const SHOT_AT = SHOTS.map((s) => s.at);
/** How much each beat is on screen at story progress p (0 hero … 4 you). */
export function beatWeights(p: number): number[] {
  const c = [0, 0.25, 0.47, 0.69, 0.92];
  return c.map((x, i) => {
    const half = i === 0 ? 0.08 : 0.085;
    const d = Math.abs(p - x) - half;
    if (i === 0 && p < x) return 1;
    if (i === 4 && p > x) return 1;
    return clamp(1 - d / 0.035, 0, 1);
  });
}

/* ── the model ── */

const HUMAN = 0, PLACE = 1, PROJECT = 2, KNOW = 3, YOU = 4;
const MAX_NODES = 2600, CURSOR = MAX_NODES - 1, MAX_EDGES = 9000, MAX_PULSES = 480, TAIL = 7, TEXW = 64;
/** The local Labs: [orbit radius, angle°, actors]. The first is DC, the one that's lit today. */
const LABS: [number, number, number][] = [[2.95, 28, 360], [3.4, 122, 140], [2.65, 192, 100], [3.75, 252, 170], [3.05, 314, 80], [4.25, 72, 60], [4.1, 162, 50], [4.45, 352, 40], [2.8, 88, 30]];
const COMMONS = { n: 150, r0: 1.32, r1: 2.05 };

interface Arrive { from: V3; t0: number; dur: number; spin: number; intro: boolean }
interface Actor { c: number; type: number; r: number; th: number; y: number; deg: number; flash: number; seen: number; born: number; p: V3; anchor?: number; arrive?: Arrive; you?: boolean; face?: number }
interface Tie { a: number; b: number; w: number; flash: number; bridge: boolean } // b = -1: the orb
interface Lab { R: number; th: number; mass: number; nodes: number[]; c: V3; lit: boolean; size: number; cap: number; rot: M3; tilt: [number, number] }
interface Pulse { e: number; from: number; to: number; t0: number; dur: number; kind: number; hop: number; inv: number }
interface Idea { id: number; t0: number; upSent: boolean; orbSent: boolean; down: boolean; origin: number; adopters: Map<number, number[]>; done: boolean }

class Model {
  rnd = mulberry(20251);
  nodes: Actor[] = []; ties: Tie[] = []; adj: number[][] = []; orbTies: number[] = [];
  labs: Lab[] = []; pulses: Pulse[] = []; ideas: Idea[] = []; ripples: { t0: number; s: number }[] = [];
  orbFlash = 0; kick = 0; ideaId = 0; nextMinor = 3.4; nextMajor = 4.2; nextSpawn = 4; startN = 0; tiesDirty = true;
  cursor: V3 | null = null;
  pods: { project: number; members: number[] }[] = [];
  podOf = new Map<number, number>();

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
    const cur = this.cursor;
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
      let target = n.anchor !== undefined ? [Math.cos(this.labs[n.anchor].th + n.th) * n.r, n.y, Math.sin(this.labs[n.anchor].th + n.th) * n.r] as V3 : this.orbitAt(n, n.th);
      // Your cursor has a little pull of its own: the actors nearest it lean toward it.
      if (cur) {
        const d = dist(target, cur);
        if (d < 0.9) { const k = 0.07 * (1 - d / 0.9) / Math.max(d, 0.05); target = [target[0] + (cur[0] - target[0]) * k, target[1] + (cur[1] - target[1]) * k, target[2] + (cur[2] - target[2]) * k]; }
      }
      if (n.arrive) {
        const k = (t - n.arrive.t0) / n.arrive.dur;
        if (k >= 1) { const intro = n.arrive.intro; n.arrive = undefined; n.p = target; if (!intro) this.settle(i, t); continue; }
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

  /** A newcomer has arrived: it takes a tie or two in its Lab (and if it's you, sets off a spark). */
  settle(i: number, t: number) {
    const n = this.nodes[i]; const L = this.labs[n.c];
    const people = L.nodes.filter((j) => j !== i && this.nodes[j].type === HUMAN && !this.nodes[j].arrive);
    if (people.length) this.link(i, this.pick(people));
    if (people.length && (n.you || this.rnd() < 0.5)) this.link(i, this.pick(people));
    const places = L.nodes.filter((j) => this.nodes[j].type === PLACE);
    if (places.length && (n.you || this.rnd() < 0.6)) this.link(i, this.pick(places));
    n.flash = 1;
    if (n.you) this.innovate(t, { from: i, major: true });
  }

  /** Someone new drifts in, drawn to a Lab by its pull: its mass over the distance squared. */
  spawn(t: number, from?: V3, you = false) {
    if (!you && this.nodes.length >= Math.min(MAX_NODES - 30, this.startN + 320)) return -1;
    if (this.nodes.length >= MAX_NODES - 2) return -1;
    if (!from) { const a = this.rnd() * Math.PI * 2, d = 5.2 + this.rnd() * 1.2; from = [Math.cos(a) * d, this.J(0.4), Math.sin(a) * d]; }
    const pulls = this.labs.map((L) => (L.mass + 4) / (1 + (dist(from!, L.c) ** 2) * (you ? 8 : 1)));
    let x = this.rnd() * pulls.reduce((s, v) => s + v, 0), li = 0;
    if (you) li = pulls.indexOf(Math.max(...pulls));
    else while (li < pulls.length - 1 && (x -= pulls[li]) > 0) li++;
    const L = this.labs[li];
    const idx = this.add({ c: li, type: you ? YOU : HUMAN, you, r: L.size * (0.45 + 0.5 * this.rnd()), th: this.rnd() * Math.PI * 2, y: this.J(0.04), deg: 0, flash: 0.6, seen: 0, born: t, p: from,
      arrive: { from, t0: t, dur: you ? 1.8 : 5 + this.rnd() * 2.5, spin: (this.rnd() < 0.5 ? -1 : 1) * (you ? 0.8 : 1.5 + this.rnd()), intro: false } });
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

// The camera, shared: world → view (uM, the target uT, the distance uD), and the projection (uTan).
const GLSL_CAM = `
uniform mat3 uM; uniform vec3 uT; uniform float uD; uniform vec2 uTan; uniform float uSide; uniform vec2 uShift;
vec3 toView(vec3 p) { vec3 v = uM * (p - uT); v.z -= uD; return v; }
vec4 toClip(vec3 v) { return vec4(v.x / uTan.x - uShift.x * v.z, v.y / uTan.y - uShift.y * v.z, 0.0, -v.z); }
bool culled(vec3 p) { return (uM * p).z * uSide < 0.0; }`;

// The actors' state, read by index: position and opacity; flash, size, kind, Lab; orbit (r, angle, height, Lab code).
const GLSL_STATE = `
uniform highp sampler2D uPos; uniform highp sampler2D uSt; uniform highp sampler2D uOrb;
ivec2 texAt(int i) { return ivec2(i % ${TEXW}, i / ${TEXW}); }
const vec3 COL[5] = vec3[5](vec3(1.0, 0.86, 0.74), vec3(0.14, 0.84, 0.86), vec3(1.0, 0.36, 0.28), vec3(0.62, 1.0, 0.96), vec3(1.0, 0.78, 0.5));
vec3 colOf(float kind) { int k = int(kind + 0.5); return k >= 10 ? vec3(1.0, 0.9, 0.8) : COL[min(k, 4)]; }`;

const ACTOR_VS = `#version 300 es
precision highp float;
${GLSL_CAM}
${GLSL_STATE}
uniform float uPx; uniform int uFirst; uniform float uFocus; uniform float uFocusAmt; uniform float uZoom; uniform float uDense;
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
  vC = vec4(colOf(S.z), P.w * f * (1.0 + 0.12 * depth));
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
layout(location = 2) in vec4 aKind;    // kind (0 a tie, 1 a bridge, 2 inside a Pod), Lab of a, Lab of b, is-cursor
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
  vec2 st = aKind.w > 0.5 ? vec2(1.0, 0.0) : texelFetch(uTies, ivec2(ti % uTieW, ti / uTieW), 0).xy;
  if (vis <= 0.002 || culled(M)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  bool bridge = abs(aKind.x - 1.0) < 0.5, pod = aKind.x > 1.5;
  // Close on a Pod: the team's own ties warm and brighten; everything else steps back.
  if (!pod) { st.y *= (1.0 - 0.8 * uPod) * (0.35 + 0.65 * uDense); }
  float foc = uFocusAmt > 0.0 ? ((abs(aKind.y - uFocus) < 0.5 || abs(aKind.z - uFocus) < 0.5) ? 1.0 + 1.2 * uFocusAmt : 1.0 - 0.55 * uFocusAmt) : 1.0;
  float front = ib < 0 && (uM * M).z > 0.0 ? 0.35 : 1.0;
  float base = (bridge || ib < 0 ? 0.3 : 0.16) * st.x * foc * vis * front;
  vec3 col = mix(bridge || ib < 0 ? vec3(0.24, 0.9, 0.88) : vec3(0.5, 0.78, 0.8), vec3(0.92, 0.97, 0.95), st.y * 0.75);
  if (aKind.w > 0.5) { col = vec3(1.0, 0.8, 0.55); base = 0.35 * vis; }
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
  quad(A, B, aCorner.x, aCorner.y, (0.4 + 1.3 * f) * uPx, vec4(colOf(S.z), P.w * 0.24 * f * f));
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
out float vA; out float vWell; out float vRip;
void main() {
  float R = aG.x, th = aG.y + uTime * 0.03 * pow(2.5 / R, 1.5), k = aG.z;
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
  vWell = clamp(well - 0.25, 0.0, 1.5); vRip = rip;
  float arcs = 1.0 + floor(k * 2.0), len = 0.25 + 0.45 * fract(k * 7.13);
  float sft = fract((k * 6.28 - aG.y) / 6.2832 * arcs);
  float clump = sft < len ? pow(1.0 - sft / len, 1.7) : 0.0;
  vA = ((0.26 + 0.34 * vWell * uBoost + 0.7 * rip) * clump + 0.5 * rip * (1.0 - clump)) * aG.w * smoothstep(6.3, 3.8, r) * smoothstep(1.05, 1.35, R) * uGrow;
  gl_PointSize = (2.1 + 1.6 * rip) * uPx * (uD / -v.z);
}`;

const FABRIC_FS = `#version 300 es
precision highp float;
in float vA; in float vWell; in float vRip; out vec4 o;
${GLSL_HASH}
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0; float r = dot(c, c); if (r > 1.0) discard;
  float a = vA * smoothstep(1.0, 0.1, r) * (0.6 + 0.8 * hash(gl_FragCoord.xy));
  vec3 col = mix(vec3(0.12, 0.6, 0.64), vec3(0.5, 1.0, 0.96), clamp(vWell * 0.5 + vRip, 0.0, 1.0));
  o = vec4(col * a, a);
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

// Out-of-focus dust between you and the system, drifting, and moving faster than it as you scroll.
const BOKEH_VS = `#version 300 es
precision highp float;
in vec4 aB; // x, y, depth, seed
uniform vec2 uPar; uniform float uScroll; uniform float uTime; uniform float uPx; uniform float uAspect;
out vec3 vC; out float vA;
void main() {
  float d = aB.z, s = aB.w;
  float y = fract(aB.y * 0.5 + 0.5 + uScroll * d * 1.4 + uTime * 0.004 * d) * 2.6 - 1.3;
  float x = aB.x + uPar.x * d * 0.07 + sin(uTime * 0.07 + s * 20.0) * 0.02;
  gl_Position = vec4(x, y + uPar.y * d * 0.05, 0.0, 1.0);
  gl_PointSize = (28.0 + 80.0 * d) * uPx;
  vC = s < 0.5 ? vec3(0.1, 0.75, 0.78) : s < 0.8 ? vec3(0.95, 0.35, 0.28) : vec3(1.0, 0.85, 0.75);
  vA = (0.012 + 0.03 * d);
}`;

const BOKEH_FS = `#version 300 es
precision highp float;
in vec3 vC; in float vA; out vec4 o;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0; float r = length(c); if (r > 1.0) discard;
  float a = vA * smoothstep(1.0, 0.86, r) * (0.55 + 0.45 * smoothstep(0.55, 0.92, r));
  o = vec4(vC * a, a);
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
    // At the opening the bands paint in from the pole down: teal, then the ink band, then the red.
    c *= smoothstep(1.0 - uReveal * 2.4, 1.18 - uReveal * 2.4, d);
    col = c * uBright * cover; alpha = cover;
  }
  // A halo just outside the limb, with the grain in it: red below, a little teal above.
  float outside = max(dist - uR, 0.0) / uR;
  float side = dot(off / max(dist, 1e-5), uPole);
  vec3 hc = mix(vec3(0.84, 0.17, 0.2), vec3(0.0, 0.58, 0.63), smoothstep(-0.6, 0.6, side));
  float hw = mix(0.95, 0.55, smoothstep(-0.6, 0.6, side));
  float hl = uReveal * (exp(-outside / 0.08) * 0.7 + exp(-outside / 0.3) * 0.22) * hw * uHalo * (1.0 - cover) * (0.65 + 0.7 * hash(gl_FragCoord.yx + 3.0));
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
uniform float uBloomAmt; uniform vec2 uRes; uniform float uFrame; uniform vec4 uShock; uniform float uAspect;
out vec4 o;
${GLSL_HASH}
vec3 shoulder(vec3 c) { vec3 k = vec3(0.88); return mix(c, k + (1.0 - k) * (1.0 - exp(-(c - k) / (1.0 - k))), step(k, c)); }
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
  c += vec3(0.2, 0.9, 0.9) * ring * 0.08;
  c = shoulder(c);
  // The brand's grain, only where there's light.
  float l = max(c.r, max(c.g, c.b));
  c += (hash(gl_FragCoord.xy + uFrame * 17.0) - 0.5) * 0.05 * smoothstep(0.02, 0.35, l);
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
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

export interface FrameState { p: number; beats: number[]; you: { x: number; y: number } | null; orb: { x: number; y: number; r: number }; paused: boolean }
export interface OrbNetOptions { still?: boolean; poster?: boolean; story?: HTMLElement; stage?: HTMLElement; faces?: string[]; onFrame?: (s: FrameState) => void }
export interface OrbNet { setPaused(v: boolean): void; paused(): boolean; setOrbHover(v: boolean): void }

/** Start the live model in `wrap` (it gets `is-live` once it draws). Returns null without WebGL 2. */
export function mountOrbNet(wrap: HTMLElement, opts: OrbNetOptions = {}): OrbNet | null {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: false, alpha: false, preserveDrawingBuffer: Boolean(opts.poster) });
  if (!gl) return null;
  const hdr = Boolean(gl.getExtension("EXT_color_buffer_float"));
  let P: Record<string, ReturnType<typeof compile>>;
  try {
    P = {
      actor: compile(gl, ACTOR_VS, POINT_FS), sprite: compile(gl, SPRITE_VS, POINT_FS), tie: compile(gl, TIE_VS, LINE_FS), trail: compile(gl, TRAIL_VS, LINE_FS),
      fab: compile(gl, FABRIC_VS, FABRIC_FS), disc: compile(gl, DISC_VS, DISC_FS), orb: compile(gl, ORB_VS, ORB_FS), bokeh: compile(gl, BOKEH_VS, BOKEH_FS),
      pre: compile(gl, FULL_VS, PREFILTER_FS), down: compile(gl, FULL_VS, DOWN_FS), up: compile(gl, FULL_VS, UP_FS), comp: compile(gl, FULL_VS, COMPOSITE_FS),
    };
  } catch (e) { console.warn("orbnet", e); return null; }
  wrap.appendChild(canvas);

  const still = Boolean(opts.still || opts.poster);
  const small = !opts.poster && (matchMedia("(max-width: 700px)").matches || (navigator.hardwareConcurrency || 8) <= 4);
  const model = new Model(small ? 0.6 : 1, !still);
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
  // Ties: per instance, [a, b, segment, tie] and [bridge, Lab a, Lab b, cursor].
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
  // Sparks (CPU points) and stars.
  const PT: [WebGLProgram, string, number][] = [[P.sprite.prog, "aP", 3], [P.sprite.prog, "aS", 4], [P.sprite.prog, "aC", 4]];
  const stars: number[] = [];
  for (let i = 0; i < 260; i++) stars.push(rnd() * 2 - 1, rnd() * 2 - 1, 0.3 + rnd(), 0.8 + rnd() * 1.1, 9, 0, 0.1 + Math.pow(rnd(), 2) * 0.45, ...(rnd() < 0.3 ? [0.24, 0.9, 0.88] : [0.9, 1, 0.98]), -1);
  const ST = vao(PT, new Float32Array(stars), gl.STATIC_DRAW);
  const sparkArr = new Float32Array(MAX_PULSES * TAIL * 11);
  const SP = vao(PT, sparkArr, gl.DYNAMIC_DRAW);
  // Orbits' dust.
  const grid: number[] = [];
  for (let R = 1.2; R < 6.3; R += 0.16 + rnd() * 0.14) {
    const k = rnd(), bright = 0.5 + rnd() * 0.7, n = Math.round((2 * Math.PI * R) / 0.03);
    for (let i = 0; i < n; i++) grid.push(R + (rnd() - 0.5) * 0.02, (i / n) * Math.PI * 2 + rnd() * 0.01, k, bright);
  }
  const FB = vao([[P.fab.prog, "aG", 4]], new Float32Array(grid), gl.STATIC_DRAW);
  const gridN = grid.length / 4;
  // Foreground dust.
  const bok: number[] = [];
  for (let i = 0; i < (small ? 12 : 20); i++) bok.push(rnd() * 2.2 - 1.1, rnd() * 2 - 1, Math.pow(rnd(), 1.5), rnd());
  const BK = vao([[P.bokeh.prog, "aB", 4]], new Float32Array(bok), gl.STATIC_DRAW);
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
  let W = 1, H = 1, cssW = 1, cssH = 1, dpr = 1, quality = small ? 0.8 : 1;
  const resize = () => {
    cssW = wrap.clientWidth; cssH = wrap.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(2, Math.round(cssW * dpr * quality)); H = Math.max(2, Math.round(cssH * dpr * quality));
    canvas.width = W; canvas.height = H;
    if (scene) freeRT(scene); mips.forEach(freeRT);
    scene = makeRT(W, H);
    mips = []; let w = W, h = H;
    for (let i = 0; i < 5; i++) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); mips.push(makeRT(w, h)); }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (still || pausedFlag) draw(performance.now());
  };

  /* inputs */
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, cx: -1e4, cy: -1e4, inside: false };
  let scrollP = 0, scrollE = 0, heroScroll = 0, focus = -1, focusAmt = 0, lastFocus = 0, pausedFlag = false, orbHoverT = 0, orbHover = 0;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const host = opts.stage ?? wrap;
  if (!still) {
    const move = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      ptr.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      ptr.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      ptr.cx = e.clientX - r.left; ptr.cy = e.clientY - r.top;
      ptr.inside = ptr.cx >= 0 && ptr.cy >= 0 && ptr.cx <= r.width && ptr.cy <= r.height;
    };
    if (fine) window.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", () => { ptr.inside = false; });
    // Click (or tap) anywhere on the stage that isn't a link or a button: you join the nearest Lab.
    host.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      move(e as PointerEvent);
      const at = pickPlane(ptr.cx, ptr.cy);
      if (at) { model.spawn(simT, at, true); ptr.inside = fine; }
    });
  }
  const readScroll = () => {
    if (opts.story) {
      const r = opts.story.getBoundingClientRect();
      scrollP = clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1);
    }
    heroScroll = clamp(window.scrollY / Math.max(1, window.innerHeight), 0, 3);
  };
  if (!still) window.addEventListener("scroll", readScroll, { passive: true });
  readScroll();

  /* the camera */
  let cam = { M: [1, 0, 0, 0, 1, 0, 0, 0, 1] as M3, O: [1, 0, 0, 0, 1, 0, 0, 0, 1] as M3, T: [0, 0, 0] as V3, halfW: 4.7, zoomW: 4.7, dense: 1, tanX: 0.15, tanY: 0.1, sh: [0, 0] as [number, number] };
  const D = 30;
  const shotTarget = (s: Shot): V3 => s.target === "pod" ? model.podCenter() : s.target === "dc" ? model.labs[0].c : s.target === "between" ? [model.labs[0].c[0] * 0.45, 0, model.labs[0].c[2] * 0.45] : [0, 0, 0];
  const camera = (p: number, t: number) => {
    let i = 0; while (i < SHOTS.length - 2 && p > SHOTS[i + 1].at) i++;
    const a = SHOTS[i], b = SHOTS[i + 1];
    const k = ease(clamp((p - a.at) / (b.at - a.at), 0, 1));
    const L = (x: keyof Shot) => lerp(a[x] as number, b[x] as number, k);
    const T = lerp3(shotTarget(a), shotTarget(b), k);
    const shake = 0;
    const yaw = (L("yaw") + ptr.x * 9 + (still ? 0 : Math.sin(t * 0.13) * 2.5) + Math.sin(t * 47) * shake * 0.5) * DEG, pitch = ptr.y * 6 * DEG;
    const par = mul(ry(yaw), rx(pitch));
    const M = mul(par, mul(rz(L("roll") * DEG), rx(L("elev") * DEG)));
    const orbV = mul(par, mul(rz(L("oRoll") * DEG), rx(L("oElev") * DEG)));
    // Portrait screens frame closer (the system runs off the sides), and keep the lower third for the lines.
    const portrait = cssW < cssH;
    const halfW = L("halfW") * (portrait ? lerp(a.pz ?? 0.6, b.pz ?? 0.6, k) : cssW < 900 ? 0.85 : 1) * (1 - 0.018 * shake);
    const tanX = halfW / D, tanY = tanX / (W / H);
    const sh: [number, number] = portrait ? [L("px"), L("py")] : [L("sx"), L("sy")];
    // Actors grow as the shot closes in, by the shot's own framing: a narrow screen's closer crop
    // doesn't make them bigger, or a Lab seen whole on a phone crowds into a white blur.
    // And how tightly the network packs onto this screen, next to a wide desktop's view of the same shot.
    const dense = clamp((cssW * L("halfW")) / (1440 * halfW), 0.45, 1);
    cam = { M, O: orbV, T, halfW, zoomW: L("halfW"), dense, tanX, tanY, sh };
  };
  /** Where the pointer (CSS px in the canvas) meets the network's plane. */
  const pickPlane = (cx: number, cy: number): V3 | null => {
    const nx = (cx / cssW) * 2 - 1 - cam.sh[0], ny = 1 - (cy / cssH) * 2 - cam.sh[1];
    const dir: V3 = [nx * cam.tanX, ny * cam.tanY, -1];
    const Mt = tr(cam.M);
    const a = apply(Mt, dir)[1], b = apply(Mt, [0, 0, D])[1] + cam.T[1];
    if (Math.abs(a) < 1e-5) return null;
    const s = -b / a; if (s <= 0) return null;
    const w = apply(Mt, [dir[0] * s, dir[1] * s, dir[2] * s + D]);
    const p: V3 = [w[0] + cam.T[0], 0, w[2] + cam.T[2]];
    return Math.hypot(p[0], p[2]) < 6.5 ? p : null;
  };
  const project = (p: V3): { x: number; y: number; z: number } => {
    const v = apply(cam.M, [p[0] - cam.T[0], p[1] - cam.T[1], p[2] - cam.T[2]]); v[2] -= D;
    return { x: ((v[0] / (-v[2] * cam.tanX) + cam.sh[0]) * 0.5 + 0.5) * cssW, y: (0.5 - (v[1] / (-v[2] * cam.tanY) + cam.sh[1]) * 0.5) * cssH, z: v[2] };
  };

  /* the frame */
  const t0 = performance.now();
  let last = t0, lastReal = t0, simT = 0, frame = 0, introT = 0;
  const fps = { acc: 0, n: 0 };
  if (still) { for (let i = 0; i < 720; i++) { simT += 1 / 60; model.step(1 / 60, simT, i > 320 && i < 570, false); } } // a still: the last sparks settling, not mid-burst

  function draw(now: number) {
    const dt = still || pausedFlag ? 0 : Math.min(0.05, (now - last) / 1000);
    // Adapt: if frames run slow, draw fewer pixels; if there's room again, more.
    if (!still && !pausedFlag && last !== now) { fps.acc += (now - last); fps.n++; if (fps.n >= 90) { const avg = fps.acc / fps.n; fps.acc = 0; fps.n = 0; const q0 = quality; if (avg > 24 && quality > 0.5) quality = Math.max(0.5, quality - 0.15); else if (avg < 13 && quality < 1) quality = Math.min(1, quality + 0.1); if (q0 !== quality) resize(); } }
    last = now;
    // Easing by time, not by frame, so the camera keeps up at any frame rate (and while paused).
    const rdt = Math.min(0.1, Math.max(0, (now - lastReal) / 1000)); lastReal = now;
    const ease60 = (k: number) => 1 - Math.pow(1 - k, rdt * 60);
    scrollE = still ? scrollP : lerp(scrollE, scrollP, ease60(0.1));
    const p = scrollE, beats = beatWeights(p);
    if (!still && !pausedFlag) { simT += dt; introT += dt; model.step(dt, simT, simT > 3.2, beats[3] > 0.5, beats[1] + beats[2] > 0.5, beats[2] > 0.5); }
    // The opening runs on the clock, not on simulated time: on a slow device (frames capped at 50 ms) the
    // orb would otherwise sit half painted for seconds.
    const openT = Math.max(introT, (now - t0) / 1000 - 0.2);
    const t = simT, grow = still ? 1 : clamp(openT / 3.4, 0, 1), g = 1 - Math.pow(1 - grow, 3);
    ptr.x = lerp(ptr.x, ptr.tx, ease60(0.06)); ptr.y = lerp(ptr.y, ptr.ty, ease60(0.06));
    orbHover = lerp(orbHover, orbHoverT, ease60(0.12));
    camera(p, t);
    const { M, T, tanX, tanY } = cam;

    // Your cursor, in the plane: a newcomer the actors near it notice.
    model.cursor = ptr.inside && fine && !still && orbHoverT < 0.5 ? pickPlane(ptr.cx, ptr.cy) : null;

    // Which Lab the pointer is over.
    let hit = -1;
    if (ptr.inside && grow > 0.9) {
      let best = 90 ** 2;
      model.labs.forEach((L, i) => { const s = project(L.c); const d2 = (s.x - ptr.cx) ** 2 + (s.y - ptr.cy) ** 2; if (d2 < best) { best = d2; hit = i; } });
    }
    if (hit >= 0) { focus = hit; lastFocus = hit; }
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
      const base = a.type === HUMAN ? 0.62 : a.type === YOU ? 1 : 0.9;
      posArr[o] = a.p[0]; posArr[o + 1] = a.p[1]; posArr[o + 2] = a.p[2]; posArr[o + 3] = base * lit * born * (a.arrive && !a.arrive.intro ? 0.7 : 1);
      const size = a.face !== undefined ? faceSize : a.type === YOU ? 12 : (a.type === HUMAN ? 7 : a.type === PLACE ? 9.5 : 10) * (1 + 0.08 * Math.sqrt(a.deg));
      if (a.face !== undefined) posArr[o + 3] = lit * born;
      stArr[o] = a.type === YOU ? Math.max(a.flash, 0.5) : a.face !== undefined ? Math.max(a.flash, 0.55 * beats[2]) : a.flash; stArr[o + 1] = size; stArr[o + 2] = a.face !== undefined ? 10 + a.face : a.type; stArr[o + 3] = a.c;
      const trail = a.anchor !== undefined || a.arrive ? 0 : a.c < 0 ? 1 : a.c + 2;
      orbArr[o] = a.r; orbArr[o + 1] = a.th; orbArr[o + 2] = a.y; orbArr[o + 3] = trail;
    }
    { // the cursor's slot
      const o = CURSOR * 4, c = model.cursor;
      posArr[o] = c ? c[0] : 0; posArr[o + 1] = 0; posArr[o + 2] = c ? c[2] : 0; posArr[o + 3] = c ? 1 : 0;
      stArr[o] = 0.55 + 0.25 * Math.sin(t * 3); stArr[o + 1] = 11; stArr[o + 2] = YOU; stArr[o + 3] = -1; orbArr[o + 3] = 0;
    }
    const rows = Math.ceil(N / TEXW);
    const up = (tex: WebGLTexture, arr: Float32Array) => { gl!.bindTexture(gl!.TEXTURE_2D, tex); gl!.texSubImage2D(gl!.TEXTURE_2D, 0, 0, 0, TEXW, rows, gl!.RGBA, gl!.FLOAT, arr, 0); gl!.texSubImage2D(gl!.TEXTURE_2D, 0, 0, ROWS - 1, TEXW, 1, gl!.RGBA, gl!.FLOAT, arr, (ROWS - 1) * TEXW * 4); };
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
    // The cursor's ties: the nearest few actors reach for it.
    tieCount = tieFixed;
    if (model.cursor) {
      const c = model.cursor; const near: [number, number][] = [];
      for (let i = 0; i < N; i++) { const a = model.nodes[i]; if (a.arrive) continue; const d = dist(a.p, c); if (d < 0.75) near.push([d, i]); }
      near.sort((x, y) => x[0] - y[0]).slice(0, 7).forEach(([, i]) => { const o = tieCount * 8; tieInst.set([i, CURSOR, -1, 0, 0, model.nodes[i].c, -1, 1], o); tieCount++; });
    }
    gl!.bindBuffer(gl!.ARRAY_BUFFER, TI.buf); gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, tieInst, 0, tieCount * 8);
    model.ties.forEach((e, i) => { tieArr[i * 4] = e.w; tieArr[i * 4 + 1] = e.flash; });
    gl!.bindTexture(gl!.TEXTURE_2D, tieTex); gl!.texSubImage2D(gl!.TEXTURE_2D, 0, 0, 0, TIEW, Math.ceil(model.ties.length / TIEW), gl!.RGBA, gl!.FLOAT, tieArr, 0);
    // Sparks.
    let sn = 0;
    // Smaller and softer where the network packs tight on screen, so a busy Lab on a phone stays a Lab.
    const sS = 0.55 + 0.45 * cam.dense, sA = 0.5 + 0.5 * cam.dense;
    const putS = (q: V3, size: number, alpha: number, c: V3) => { const o = sn * 11; sparkArr.set([q[0], q[1], q[2], size * sS, 5, 0, alpha * sA, c[0], c[1], c[2], -1], o); sn++; };
    for (const pu of model.pulses) {
      if (t < pu.t0) continue;
      const u = clamp((t - pu.t0) / pu.dur, 0, 1);
      const A = model.end(pu.from, pu.to), B = model.end(pu.to, pu.from);
      const c: V3 = pu.kind === 1 ? [1, 0.3, 0.2] : pu.kind === 2 ? [0.25, 1, 0.92] : [1, 0.97, 0.88];
      for (let k = 0; k < 5; k++) { const uu = u - k * 0.028; if (uu < 0) break; putS(lerp3(A, B, uu), k ? 8 - k * 1.1 : 13, (k ? 0.5 - k * 0.08 : 0.85) * (1 - 0.25 * u), c); }
    }
    gl!.bindBuffer(gl!.ARRAY_BUFFER, SP.buf); gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, sparkArr, 0, sn * 11);

    // Masses for the orbits' wells and the glows.
    const massU = new Float32Array(40), labU = new Float32Array(40), labC = new Float32Array(30), labTilt = new Float32Array(20);
    massU.set([0, 0, 1.0, 0.85], 0);
    model.labs.forEach((L, i) => {
      const k = Math.min(1.4, L.mass / 300);
      massU.set([L.c[0], L.c[2], 0.06 + 0.42 * k, 0.35 + L.size * 0.4], (i + 1) * 4);
      labU.set([L.c[0], L.c[2], (0.1 + 0.55 * k) * (L.lit ? 1.1 : 0.8) * (focus === i ? 1 + focusAmt : 1) * (1 + beats[2] * 0.8), L.size * 1.1], i * 4);
      labC.set(L.c, i * 3); labTilt.set(L.tilt, i * 2);
    });
    const ripU = new Float32Array(16);
    model.ripples.slice(-4).forEach((r, i) => { const age = t - r.t0; ripU.set([0, 0, 1.1 + age * 2.6, r.s * Math.max(0, 1 - age / 1.6)], i * 4); });

    /* draw the scene */
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, scene!.fbo);
    gl!.viewport(0, 0, W, H);
    gl!.clearColor(0, 0, 0, 1); gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.enable(gl!.BLEND);
    const add = () => gl!.blendFunc(gl!.ONE, gl!.ONE), over = () => gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
    const px = dpr * quality * clamp(cssH / 600, 0.8, 1.2);
    const camU = (U: Record<string, WebGLUniformLocation | null>, side: number) => {
      gl!.uniformMatrix3fv(U.uM, true, M); gl!.uniform3f(U.uT, T[0], T[1], T[2]); gl!.uniform1f(U.uD, D); gl!.uniform2f(U.uTan, tanX, tanY); gl!.uniform1f(U.uSide, side); gl!.uniform2f(U.uShift, cam.sh[0], cam.sh[1]);
    };
    const stateU = (U: Record<string, WebGLUniformLocation | null>) => {
      gl!.activeTexture(gl!.TEXTURE1); gl!.bindTexture(gl!.TEXTURE_2D, posTex); gl!.uniform1i(U.uPos, 1);
      gl!.activeTexture(gl!.TEXTURE2); gl!.bindTexture(gl!.TEXTURE_2D, stTex); gl!.uniform1i(U.uSt, 2);
      gl!.activeTexture(gl!.TEXTURE3); gl!.bindTexture(gl!.TEXTURE_2D, orbTex); gl!.uniform1i(U.uOrb, 3);
    };
    const focusU = (U: Record<string, WebGLUniformLocation | null>) => { gl!.uniform1f(U.uFocus, focus >= 0 ? focus : lastFocus); gl!.uniform1f(U.uFocusAmt, focus >= 0 ? focusAmt : 0); };
    gl!.useProgram(P.sprite.prog); gl!.activeTexture(gl!.TEXTURE5); gl!.bindTexture(gl!.TEXTURE_2D, facesTex); gl!.uniform1i(P.sprite.U.uFaces, 5);
    const drawStars = () => { add(); gl!.useProgram(P.sprite.prog); gl!.bindVertexArray(ST.v); camU(P.sprite.U, -1); gl!.uniform1f(P.sprite.U.uPx, px); gl!.uniform2f(P.sprite.U.uPar, ptr.x, -ptr.y); gl!.drawArrays(gl!.POINTS, 0, stars.length / 11); };
    const drawDisc = () => { add(); gl!.useProgram(P.disc.prog); gl!.bindVertexArray(QD); camU(P.disc.U, 1); gl!.uniform1f(P.disc.U.uR, 5.9); gl!.uniform1f(P.disc.U.uAmt, 0.11 * g); gl!.uniform4fv(P.disc.U.uLab, labU); gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4); };
    const drawFabric = (side: number) => {
      add(); gl!.useProgram(P.fab.prog); gl!.bindVertexArray(FB.v); camU(P.fab.U, side);
      gl!.uniform1f(P.fab.U.uPx, px); gl!.uniform1f(P.fab.U.uGrow, g); gl!.uniform1f(P.fab.U.uTime, t); gl!.uniform1f(P.fab.U.uBoost, 1 + beats[2] * 1.2);
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
      gl!.drawArraysInstanced(gl!.TRIANGLE_STRIP, 0, 4, N * 5);
    };
    const drawActors = (side: number) => {
      add(); gl!.useProgram(P.actor.prog); gl!.bindVertexArray(EMPTY); camU(P.actor.U, side); stateU(P.actor.U); focusU(P.actor.U);
      gl!.uniform1f(P.actor.U.uPx, px); gl!.uniform1i(P.actor.U.uFirst, 0); gl!.uniform1f(P.actor.U.uZoom, Math.pow(clamp(4.7 / cam.zoomW, 1, 2.8), 0.7)); gl!.uniform1f(P.actor.U.uDense, cam.dense);
      gl!.activeTexture(gl!.TEXTURE5); gl!.bindTexture(gl!.TEXTURE_2D, facesTex); gl!.uniform1i(P.actor.U.uFaces, 5); gl!.uniform1f(P.actor.U.uFacesReady, facesReady);
      gl!.drawArrays(gl!.POINTS, 0, N);
      if (model.cursor) { gl!.uniform1i(P.actor.U.uFirst, CURSOR); gl!.drawArrays(gl!.POINTS, 0, 1); }
    };
    const drawSparks = (side: number) => { add(); gl!.useProgram(P.sprite.prog); gl!.bindVertexArray(SP.v); camU(P.sprite.U, side); gl!.uniform1f(P.sprite.U.uPx, px); gl!.uniform2f(P.sprite.U.uPar, 0, 0); gl!.drawArrays(gl!.POINTS, 0, sn); };
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
    }).filter((b) => b.r > 0.02).sort((a, b) => a.v[2] - b.v[2]);
    const orbC = orbView([0, 0, 0]);
    const reveal = still ? 1 : clamp(openT / 1.3, 0, 1);

    drawStars(); drawDisc();
    drawFabric(-1); drawTrails(-1); drawTies(-1); drawActors(-1); drawSparks(-1);
    bodies.filter((b) => b.v[2] < orbC[2]).forEach((b) => drawOrb(b.v, b.r, b.bright, 1.1 * b.bright, 0, 1));
    drawOrb(orbC, 1 + 0.025 * orbHover, 1 + 0.45 * model.orbFlash + 0.18 * orbHover, 1 + 0.7 * model.orbFlash + 0.8 * orbHover, still ? 0.6 : 1 + 1.5 * orbHover, reveal);
    drawFabric(1); drawTrails(1); drawTies(1);
    bodies.filter((b) => b.v[2] >= orbC[2]).forEach((b) => drawOrb(b.v, b.r, b.bright, 1.1 * b.bright, 0, 1));
    drawActors(1); drawSparks(1);
    // Foreground dust.
    add(); gl!.useProgram(P.bokeh.prog); gl!.bindVertexArray(BK.v);
    gl!.uniform2f(P.bokeh.U.uPar, ptr.x, -ptr.y); gl!.uniform1f(P.bokeh.U.uScroll, heroScroll * 0.35 + p * 0.6); gl!.uniform1f(P.bokeh.U.uTime, t); gl!.uniform1f(P.bokeh.U.uPx, dpr * quality);
    gl!.drawArrays(gl!.POINTS, 0, bok.length / 4);

    /* the finishing pass: bloom, then everything together */
    gl!.disable(gl!.BLEND);
    const full = (prog: ReturnType<typeof compile>, src: RT, dst: RT | null, texel: [number, number]) => {
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, dst ? dst.fbo : null); gl!.viewport(0, 0, dst ? dst.w : W, dst ? dst.h : H);
      gl!.useProgram(prog.prog); gl!.bindVertexArray(EMPTY);
      gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, src.tex); gl!.uniform1i(prog.U.uSrc, 0); gl!.uniform2f(prog.U.uTexel, texel[0], texel[1]);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    };
    gl!.useProgram(P.pre.prog); gl!.uniform1f(P.pre.U.uThreshold, 1.05);
    full(P.pre, scene!, mips[0], [1 / W, 1 / H]);
    for (let i = 1; i < mips.length; i++) full(P.down, mips[i - 1], mips[i], [1 / mips[i - 1].w, 1 / mips[i - 1].h]);
    gl!.enable(gl!.BLEND); add();
    for (let i = mips.length - 2; i >= 0; i--) full(P.up, mips[i + 1], mips[i], [1 / mips[i + 1].w, 1 / mips[i + 1].h]);
    gl!.disable(gl!.BLEND);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null); gl!.viewport(0, 0, W, H);
    gl!.useProgram(P.comp.prog); gl!.bindVertexArray(EMPTY);
    gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, scene!.tex); gl!.uniform1i(P.comp.U.uScene, 0);
    gl!.activeTexture(gl!.TEXTURE1); gl!.bindTexture(gl!.TEXTURE_2D, mips[0].tex); gl!.uniform1i(P.comp.U.uBloom, 1);
    gl!.uniform1f(P.comp.U.uBloomAmt, 0.42 + 0.25 * model.orbFlash + 0.25 * orbHover); gl!.uniform2f(P.comp.U.uRes, W, H); gl!.uniform1f(P.comp.U.uFrame, Math.floor(t * 24) % 97);
    gl!.uniform1f(P.comp.U.uAspect, W / H);
    const sc = { x: (orbC[0] / (-orbC[2] * tanX) + cam.sh[0]) * 0.5 + 0.5, y: (orbC[1] / (-orbC[2] * tanY) + cam.sh[1]) * 0.5 + 0.5 };
    const shock = model.ripples.length ? model.ripples[model.ripples.length - 1] : null;
    const age = shock ? t - shock.t0 : 9;
    gl!.uniform4f(P.comp.U.uShock, sc.x, sc.y, 0.05 + age * 0.55, shock ? 0.35 * Math.max(0, 1 - age / 1.5) : 0);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    frame++;

    if (!wrap.classList.contains("is-live")) wrap.classList.add("is-live");

    // Tell the page what's on screen: the story's progress, each beat's weight, the orb, and you.
    if (opts.onFrame) {
      opts.onFrame({
        p, beats, paused: pausedFlag,
        you: model.cursor ? (() => { const s = project(model.cursor!); return { x: s.x, y: s.y }; })() : null,
        orb: (() => { const s = project([0, 0, 0]); return { x: s.x, y: s.y, r: (1 / (-s.z * cam.tanX)) * 0.5 * cssW }; })(),
      });
    }
  }

  new ResizeObserver(() => resize()).observe(wrap);
  resize();
  if (still) { draw(performance.now()); return { setPaused() {}, paused: () => true, setOrbHover() {} }; }

  let on = false, raf = 0, visible = false;
  const loop = (now: number) => { draw(now); raf = on ? requestAnimationFrame(loop) : 0; };
  const setOn = (v: boolean) => { if (v === on) return; on = v; if (on && !raf) { readScroll(); last = lastReal = performance.now(); raf = requestAnimationFrame(loop); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; setOn(visible && !document.hidden); }).observe(wrap);
  document.addEventListener("visibilitychange", () => setOn(visible && !document.hidden));
  return {
    setPaused(v: boolean) { pausedFlag = v; },
    paused: () => pausedFlag,
    setOrbHover(v: boolean) { orbHoverT = v ? 1 : 0; },
  };
}

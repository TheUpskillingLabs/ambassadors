/* The Labs, live: the home page's hero, a model of how The Labs works.

   What it models. The Upskilling Labs as a federated, practice-based research
   network: local Labs where people learn by building, a commons of
   contributors and shared knowledge that ties them together, and the national
   Labs at the centre. It's drawn the way actor-network theory sees an
   organisation: no given scale, only actors and their ties. People, places
   (the libraries), projects and knowledge (playbooks, code) are all actors,
   each its own mark:
     people     a warm dot          places     a teal square
     projects   a red diamond       knowledge  a pale ring
   A Lab is nothing but its ties, and it behaves like a complex adaptive
   system: newcomers drift in from outside and are pulled into the Lab with
   the strongest pull near them, new ties form as ideas spread, and the whole
   thing never stops rearranging itself.

   Gravity is the density of relationships. Each Lab's mass is the ties inside
   it, so a dense Lab pulls harder: its actors orbit tighter and faster, it
   draws in more newcomers, it glows, and it bends the fabric beneath it into
   a deeper well. Dense enough, a Lab closes into a body of its own, a small
   orb: in actor-network terms, a network so held together it reads as one
   thing. The Labs' own orb, the logo's, is the deepest well of all.

   Innovation arrives as jolts of energy. Somewhere a project makes something
   new: a spark runs out along its ties (white), adopters light up, and if it
   reaches the commons it runs up to the orb (red). The orb flares, a ripple
   crosses the fabric, and the idea comes back down (teal) to every Lab tied
   to the commons, where it spreads again. Every tie a spark crosses gets a
   little stronger, adopters form new ties, and an idea that reaches the orb
   leaves a new piece of knowledge in the commons: density grows, and with it
   gravity.

   The orb itself is the logo's: its three bands are latitude bands round one
   pole, fitted to orb-mark.png (rolled 22.5° left, tilted 15.4° toward the
   viewer), coloured from the mark by latitude, with the mark's grain.

   It moves with the page: the pointer turns the system and moves the light,
   pointing at a Lab lights its ties, and scrolling lifts the camera from the
   logo's view to above the network, where it reads as a map. Plain WebGL 2,
   no library; the model runs on the CPU (a thousand actors at most). It draws
   only while on screen; reduced motion gets one still frame; without WebGL 2
   the poster stays. */

// The mark's colours by latitude: d = n·pole from -1 (south) to 1 (north), 101 RGB steps.
const RAMP = "250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,40,27,249,40,27,249,40,26,248,39,26,247,38,26,245,38,26,244,37,26,242,36,26,240,36,26,238,35,27,235,34,26,232,33,26,229,32,26,226,32,26,222,31,26,218,30,26,214,29,26,209,29,27,204,28,27,199,27,27,193,27,27,187,26,27,180,26,28,173,25,28,166,25,28,158,24,28,150,24,28,141,23,28,132,23,29,123,23,29,114,22,29,105,22,30,97,22,30,88,21,30,80,21,30,72,21,30,65,21,31,59,21,31,52,21,31,46,21,31,40,21,31,35,22,31,30,22,31,26,22,31,23,23,32,19,23,32,16,24,33,13,25,34,11,26,35,10,25,34,9,24,32,9,22,30,8,22,30,6,22,30,5,22,31,4,22,31,3,23,32,2,23,32,2,24,33,1,25,33,1,26,34,1,27,36,2,29,37,2,31,39,2,33,42,3,36,44,3,38,46,4,41,48,5,43,51,5,47,54,6,51,58,7,55,62,8,61,67,9,67,73,10,74,80,11,82,87,12,90,96,13,100,105,14,110,114,15,120,124,16,130,133,16,140,143,16,149,152,16,159,161,16,167,169,16,176,177,15,184,185,14,193,193,13,201,200,12,207,206,11,210,208";

/** The logo's view of the orb: the pole rolled left and tilted toward the viewer. */
const LOGO = { roll: 22.5, elev: 15.4 };
/** The network's plane: a little more open than the bands, rolled like the swoosh. */
const NET = { roll: 28, elev: 27 };
/** Where scrolling takes them: above the network, which then reads as a map. */
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
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => t * t * (3 - 2 * t);
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function mulberry(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ── the model ── */

const HUMAN = 0, PLACE = 1, PROJECT = 2, KNOW = 3;
const COLOR: V3[] = [[1, 0.9, 0.82], [0.14, 0.84, 0.86], [1, 0.38, 0.3], [0.66, 1, 0.97]];
const SHAPE = [0, 1, 2, 3]; // disc, square, diamond, ring
const MAX_NODES = 2600, MAX_EDGES = 9000, MAX_PULSES = 480, TAIL = 7, MAX_TRAIL = 9000, MAX_CURVE = 9000;
/** The local Labs: [orbit radius, angle°, actors]. The first is DC, the one that's lit today. */
const LABS: [number, number, number][] = [[2.95, 28, 360], [3.4, 122, 140], [2.65, 192, 100], [3.75, 252, 170], [3.05, 314, 80], [4.25, 72, 60], [4.1, 162, 50], [4.45, 352, 40], [2.8, 88, 30]];
const COMMONS = { n: 150, r0: 1.32, r1: 2.05 };

interface Actor { c: number; type: number; r: number; th: number; y: number; deg: number; flash: number; seen: number; born: number; p: V3; anchor?: number; arrive?: { from: V3; t0: number; dur: number; spin: number } }
interface Tie { a: number; b: number; w: number; flash: number; bridge: boolean } // b = -1: the orb
interface Lab { R: number; th: number; mass: number; nodes: number[]; c: V3; lit: boolean; size: number; shells: number; cap?: number }
interface Pulse { e: number; from: number; to: number; t0: number; dur: number; kind: number; hop: number; inv: number }
interface Idea { id: number; t0: number; upSent: boolean; orbSent: boolean; down: boolean; origin: number; adopters: Map<number, number[]>; done: boolean }

class Model {
  rnd = mulberry(20251);
  nodes: Actor[] = []; ties: Tie[] = []; adj: number[][] = []; orbTies: number[] = [];
  labs: Lab[] = []; pulses: Pulse[] = []; ideas: Idea[] = []; ripples: { t0: number; s: number }[] = [];
  orbFlash = 0; ideaId = 0; nextIdea = 2.6; nextSpawn = 3.2; startN = 0;

  J(a: number) { return (this.rnd() * 2 - 1) * a; }
  pick<T>(a: T[]): T { return a[Math.floor(this.rnd() * a.length)]; }

  constructor() {
    const R = this.rnd;
    LABS.forEach(([rad, ang, n], li) => {
      const lab: Lab = { R: rad, th: ang * DEG, mass: 0, nodes: [], c: [0, 0, 0], lit: li === 0, size: 0.24 + 0.4 * Math.sqrt(n / 120), shells: Math.min(5, 2 + Math.round(n / 45)) };
      this.labs.push(lab);
      const types: number[] = [];
      const places = Math.max(1, Math.round(n * 0.05)), projects = Math.max(1, Math.round(n * 0.12)), know = Math.max(1, Math.round(n * 0.07));
      for (let i = 0; i < n; i++) types.push(i < places ? PLACE : i < places + projects ? PROJECT : i < places + projects + know ? KNOW : HUMAN);
      types.forEach((type) => {
        // On one of its Lab's orbits: places and knowledge on the inner ones, people further out.
        const shells = lab.shells, inner = type === PLACE ? 0.4 : type === KNOW ? 0.7 : 1;
        const sh = Math.min(shells - 1, Math.floor(Math.pow(R(), 0.8) * shells * inner + (type === HUMAN ? 0.5 : 0)));
        const r = lab.size * (0.4 + 0.6 * (sh + 0.5) / shells) + this.J(0.018);
        const idx = this.add({ c: li, type, r, th: R() * Math.PI * 2, y: this.J(0.05), deg: 0, flash: 0, seen: 0, born: 0.5 + li * 0.14 + r * 0.8 + R() * 0.3, p: [0, 0, 0] });
        lab.nodes.push(idx);
      });
      const of = (t: number) => lab.nodes.filter((i) => this.nodes[i].type === t);
      const people = of(HUMAN), placesN = of(PLACE), projectsN = of(PROJECT), knowN = of(KNOW);
      // Pods: a few people round each project, mostly tied to each other too.
      projectsN.forEach((pj) => {
        const pod = Array.from({ length: 3 + Math.floor(R() * 3) }, () => this.pick(people));
        pod.forEach((h, k) => { this.link(h, pj); if (k && R() < 0.55) this.link(h, pod[k - 1]); });
      });
      people.forEach((h) => {
        if (R() < 0.7) this.link(h, this.pick(placesN)); // their library
        if (R() < 0.35) this.link(h, this.pick(people)); // a weak tie
      });
      knowN.forEach((k) => { for (let i = 0; i < 2 + Math.floor(R() * 2); i++) this.link(k, this.pick(projectsN)); });
    });
    // The commons round the orb: shared knowledge and the contributors who keep it, turning
    // together, tied to the orb and to their neighbours round the ring.
    const commons: number[] = [];
    for (let i = 0; i < COMMONS.n; i++) {
      const type = R() < 0.45 ? HUMAN : KNOW;
      const r = lerp(COMMONS.r0, COMMONS.r1, R());
      commons.push(this.add({ c: -1, type, r, th: (i / COMMONS.n) * Math.PI * 2 + this.J(0.05), y: this.J(0.04), deg: 0, flash: 0, seen: 0, born: 0.15 + (i / COMMONS.n) * 0.6, p: [0, 0, 0] }));
    }
    commons.forEach((i, k) => {
      if (R() < 0.5) this.link(i, -1);
      this.link(i, commons[(k + 1) % commons.length]);
      if (R() < 0.3) this.link(i, commons[(k + 2) % commons.length]);
    });
    // Each Lab's contributors stand between it and the commons, and move with it: they are the
    // bridge, tied to the people in their Lab and to the orb or the commons.
    this.labs.forEach((lab, li) => {
      const bridges = 1 + Math.round(lab.nodes.length / 20);
      const inLab = lab.nodes.filter((i) => this.nodes[i].type !== PLACE);
      for (let b = 0; b < bridges; b++) {
        const r = lerp(COMMONS.r1 + 0.25, lab.R - lab.size * 0.9, 0.2 + 0.6 * R());
        const k = this.add({ c: -1, anchor: li, type: HUMAN, r, th: this.J(0.22 / lab.R * 2), y: this.J(0.05), deg: 0, flash: 0, seen: 0, born: 0.9 + li * 0.15 + R() * 0.3, p: [0, 0, 0] });
        this.link(k, this.pick(inLab), true);
        if (R() < 0.6) this.link(k, this.pick(inLab), true);
        if (R() < 0.55) this.link(k, -1, true);
        else { const near = commons.reduce((best, c) => (Math.abs(Math.sin((this.nodes[c].th - lab.th) / 2)) < Math.abs(Math.sin((this.nodes[best].th - lab.th) / 2)) ? c : best), commons[0]); this.link(k, near, true); }
      }
    });
    this.labs.forEach((L) => { L.cap = L.mass * 1.35; });
    this.startN = this.nodes.length;
    this.positions(0, 0);
  }

  add(a: Actor) { this.nodes.push(a); this.adj.push([]); return this.nodes.length - 1; }
  linked(a: number, b: number) { return this.adj[a].some((e) => { const t = this.ties[e]; return (t.a === a && t.b === b) || (t.b === a && t.a === b); }); }
  link(a: number, b: number, bridge = false) {
    if (a === b || this.ties.length >= MAX_EDGES || this.linked(a, b)) return;
    const e = this.ties.push({ a, b, w: 1, flash: 0, bridge }) - 1;
    this.adj[a].push(e); this.nodes[a].deg++;
    if (b >= 0) { this.adj[b].push(e); this.nodes[b].deg++; } else this.orbTies.push(e);
    const ca = this.nodes[a].c, cb = b >= 0 ? this.nodes[b].c : -2;
    if (ca >= 0 && ca === cb) this.labs[ca].mass += 1;
    else { if (ca >= 0) this.labs[ca].mass += 0.5; if (cb >= 0) this.labs[cb].mass += 0.5; }
  }
  /** Where an end of a tie is: an actor, or the point on the orb's surface facing the other end. */
  end(i: number, other: number): V3 {
    if (i >= 0) return this.nodes[i].p;
    const o = this.nodes[other].p, l = Math.hypot(o[0], o[1], o[2]) || 1;
    return [o[0] / l * 1.03, o[1] / l * 1.03, o[2] / l * 1.03];
  }

  /** Move everything along its orbit. A Lab's actors orbit it as fast as its mass (its ties) pulls. */
  positions(dt: number, t: number) {
    this.labs.forEach((L) => {
      L.th += dt * 0.03 * Math.pow(2.5 / L.R, 1.5);
      L.c = [Math.cos(L.th) * L.R, 0, Math.sin(L.th) * L.R];
    });
    for (const n of this.nodes) {
      let C: V3 = [0, 0, 0], w: number;
      if (n.c >= 0) {
        const L = this.labs[n.c];
        const pull = Math.sqrt(Math.max(L.mass, 6) / 260);
        w = clamp(0.13 * pull * Math.pow(0.45 / Math.max(n.r, 0.08), 1.5), 0.012, 0.42);
        C = L.c;
      } else w = 0.07;
      if (n.anchor !== undefined) { // a bridge: on its Lab's bearing, between it and the commons
        const La = this.labs[n.anchor];
        n.p = [Math.cos(La.th + n.th) * n.r, n.y, Math.sin(La.th + n.th) * n.r];
        n.flash = Math.max(0, n.flash - dt * 1.3);
        continue;
      }
      n.th += w * dt;
      const target: V3 = [C[0] + Math.cos(n.th) * n.r, C[1] + n.y + Math.sin(n.th * 2 + n.r * 9) * 0.015, C[2] + Math.sin(n.th) * n.r];
      if (n.arrive) {
        const k = (t - n.arrive.t0) / n.arrive.dur;
        if (k >= 1) { n.arrive = undefined; n.p = target; this.settle(this.nodes.indexOf(n)); continue; }
        // Spiral in: from outside, round and down into its Lab's orbit.
        const e = ease(clamp(k, 0, 1)), sw = (1 - e) * n.arrive.spin;
        const m: V3 = [lerp(n.arrive.from[0], target[0], e), lerp(n.arrive.from[1], target[1], e), lerp(n.arrive.from[2], target[2], e)];
        const cx = m[0] - C[0], cz = m[2] - C[2];
        n.p = [C[0] + cx * Math.cos(sw) - cz * Math.sin(sw), m[1], C[2] + cx * Math.sin(sw) + cz * Math.cos(sw)];
      } else n.p = target;
      n.flash = Math.max(0, n.flash - dt * 1.3);
    }
    for (const e of this.ties) { e.flash = Math.max(0, e.flash - dt * 2.2); e.w += (1 - e.w) * dt * 0.035; }
    this.orbFlash = Math.max(0, this.orbFlash - dt * 1.1);
    this.ripples = this.ripples.filter((r) => t - r.t0 < 3.4);
  }

  /** A newcomer has arrived: it takes a tie or two in its Lab. */
  settle(i: number) {
    const n = this.nodes[i]; const L = this.labs[n.c];
    const people = L.nodes.filter((j) => j !== i && this.nodes[j].type === HUMAN && !this.nodes[j].arrive);
    if (people.length) this.link(i, this.pick(people));
    if (people.length && this.rnd() < 0.5) this.link(i, this.pick(people));
    const places = L.nodes.filter((j) => this.nodes[j].type === PLACE);
    if (places.length && this.rnd() < 0.6) this.link(i, this.pick(places));
    n.flash = 0.8;
  }

  /** Someone new drifts in from outside, drawn to a Lab by its pull: its mass over the distance squared. */
  spawn(t: number) {
    if (this.nodes.length >= Math.min(MAX_NODES - 20, this.startN + 320)) return;
    const a = this.rnd() * Math.PI * 2, d = 5.2 + this.rnd() * 1.2;
    const from: V3 = [Math.cos(a) * d, this.J(0.4), Math.sin(a) * d];
    const pulls = this.labs.map((L) => (L.mass + 4) / (1 + (dist(from, L.c) ** 2)));
    let x = this.rnd() * pulls.reduce((s, v) => s + v, 0), li = 0;
    while (li < pulls.length - 1 && (x -= pulls[li]) > 0) li++;
    const L = this.labs[li];
    const idx = this.add({ c: li, type: HUMAN, r: L.size * (0.4 + 0.6 * this.rnd()), th: this.rnd() * Math.PI * 2, y: this.J(0.05), deg: 0, flash: 0.4, seen: 0, born: t, p: from, arrive: { from, t0: t, dur: 5 + this.rnd() * 2.5, spin: (this.rnd() < 0.5 ? -1 : 1) * (1.5 + this.rnd()) } });
    L.nodes.push(idx);
  }

  send(e: number, from: number, to: number, kind: number, hop: number, idea: Idea, t: number, delay = 0) {
    if (this.pulses.length >= MAX_PULSES) return;
    const L = dist(this.end(from, to), this.end(to, from));
    this.pulses.push({ e, from, to, t0: t + delay, dur: clamp(L / (kind === 0 ? 1.1 : 1.6), 0.12, 1.8), kind, hop, inv: idea.id });
  }

  /** A new idea starts at a project, somewhere: the denser the Lab, the likelier. */
  innovate(t: number) {
    const w = this.labs.map((L) => L.mass + 3);
    let x = this.rnd() * w.reduce((s, v) => s + v, 0), li = 0;
    while (li < w.length - 1 && (x -= w[li]) > 0) li++;
    const cands = this.labs[li].nodes.filter((i) => this.nodes[i].type === PROJECT && !this.nodes[i].arrive);
    if (!cands.length) return;
    const origin = this.pick(cands);
    const idea: Idea = { id: ++this.ideaId, t0: t, upSent: false, orbSent: false, down: false, origin, adopters: new Map(), done: false };
    this.ideas.push(idea);
    this.reach(origin, idea, 0, 0, t);
  }

  /** The spark arrives at an actor (or the orb) and goes on from there. Kinds: 0 spreading in a Lab, 1 going up, 2 coming down. */
  reach(i: number, idea: Idea, kind: number, hop: number, t: number) {
    if (i === -1) {
      if (idea.down) return;
      idea.down = true; this.orbFlash = 1; this.ripples.push({ t0: t, s: 1 });
      // What reaches the orb becomes knowledge in the commons, tied back to where it came from.
      const cm = this.nodes.filter((n) => n.c === -1).length;
      if (cm < 190 && this.nodes.length < MAX_NODES) {
        const r = lerp(COMMONS.r0, COMMONS.r1, this.rnd());
        const o = this.nodes[idea.origin].p;
        const k = this.add({ c: -1, type: KNOW, r, th: Math.atan2(o[2], o[0]) + this.J(0.2), y: this.J(0.04), deg: 0, flash: 1, seen: idea.id, born: t, p: [0, 0, 0] });
        this.link(k, -1);
        const bridge = this.nodes.findIndex((n) => n.anchor === this.nodes[idea.origin].c);
        if (bridge >= 0) this.link(k, bridge, true);
      }
      for (const e of this.orbTies) this.send(e, -1, this.ties[e].a, 2, 0, idea, t, 0.2 + this.rnd() * 0.4);
      return;
    }
    const n = this.nodes[i];
    if (n.seen === idea.id || n.arrive) return;
    n.seen = idea.id; n.flash = 1;
    if (n.c >= 0) { const a = idea.adopters.get(n.c) ?? []; a.push(i); idea.adopters.set(n.c, a); }
    for (const ei of this.adj[i]) {
      const e = this.ties[ei]; const o = e.a === i ? e.b : e.a;
      if (o === -1) { if (kind !== 2 && !idea.orbSent) { idea.orbSent = true; this.send(ei, i, -1, 1, hop + 1, idea, t); } continue; }
      const O = this.nodes[o];
      if (O.seen === idea.id || O.arrive) continue;
      if (kind === 0) {
        if (O.c === -1) { if (!idea.upSent && this.rnd() < 0.8) { idea.upSent = true; this.send(ei, i, o, 1, hop + 1, idea, t); } continue; }
        if (O.c !== n.c) continue;
        if (hop < 5 && this.rnd() < 0.9 * Math.pow(0.72, hop)) this.send(ei, i, o, 0, hop + 1, idea, t);
      } else if (kind === 1) {
        if (O.c === -1 && hop < 4 && this.rnd() < 0.7) this.send(ei, i, o, 1, hop + 1, idea, t);
      } else {
        if (O.c >= 0) this.send(ei, i, o, 0, 1, idea, t);
      }
    }
  }

  step(dt: number, t: number, live: boolean) {
    if (live) {
      if (t > this.nextIdea) { this.innovate(t); this.nextIdea = t + 1.8 + this.rnd() * 1.8; }
      if (t > this.nextSpawn) { this.spawn(t); this.nextSpawn = t + 0.8 + this.rnd() * 1.1; }
    }
    this.positions(dt, t);
    // Sparks in flight: light their tie; when they land, go on.
    const landed: Pulse[] = [];
    this.pulses = this.pulses.filter((p) => {
      if (t < p.t0) return true;
      const e = this.ties[p.e]; e.flash = 1; e.w = Math.min(2.6, e.w + 0.012);
      if (t >= p.t0 + p.dur) { landed.push(p); return false; }
      return true;
    });
    for (const p of landed) { const idea = this.ideas.find((d) => d.id === p.inv); if (idea) this.reach(p.to, idea, p.kind, p.hop, t); }
    // An idea that has spread leaves new ties among the people who took it up: density grows.
    for (const idea of this.ideas) {
      if (idea.done || t - idea.t0 < 7) continue;
      idea.done = true;
      idea.adopters.forEach((a, li) => { const L = this.labs[li]; for (let k = 0; k < Math.min(2, a.length - 1); k++) if (L.mass < (L.cap ?? 1e9)) this.link(this.pick(a), this.pick(a)); });
    }
    this.ideas = this.ideas.filter((d) => t - d.t0 < 12);
  }
}

/* ── shaders ── */

const GLSL_HASH = `
float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float hash3(vec3 p) { p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
vec3 hash33(vec3 p) { p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }`;

// Actors, sparks, orbit paths and stars. S: size, shape, flash, alpha. C: rgb, group (its Lab, or -1).
const POINT_VS = `#version 300 es
precision highp float;
in vec3 aP; in vec4 aS; in vec4 aC;
uniform mat3 uM; uniform float uD; uniform vec2 uTan; uniform float uPx; uniform float uSide;
uniform float uFocus; uniform float uFocusAmt; uniform vec2 uPar;
out vec4 vC; out float vShape; out float vFlash; out float vNear;
void main() {
  vShape = aS.y; vFlash = aS.z;
  if (aS.y > 8.5) { // a star, placed on screen
    if (uSide > 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
    gl_Position = vec4(aP.xy - uPar * 0.03 * aP.z, 0.0, 1.0);
    vC = vec4(aC.rgb, aS.w); vNear = 0.0; gl_PointSize = aS.x * uPx; return;
  }
  vec3 v = uM * aP;
  if (v.z * uSide < 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  v.z -= uD;
  gl_Position = vec4(v.x / (-v.z * uTan.x), v.y / (-v.z * uTan.y), 0.0, 1.0);
  float depth = clamp((v.z + uD) / 6.0, -1.0, 1.0);
  float g = aC.a;
  float f = g < -0.5 ? 1.0 - 0.4 * uFocusAmt : (abs(g - uFocus) < 0.5 ? 1.0 + 0.8 * uFocusAmt : 1.0 - 0.6 * uFocusAmt);
  vC = vec4(aC.rgb, aS.w * f * (1.0 + 0.12 * depth));
  vNear = max(depth, 0.0);
  gl_PointSize = aS.x * uPx * (uD / -v.z) * (1.0 + 0.22 * max(depth, 0.0) - 0.1 * max(-depth, 0.0)) * (1.0 + 1.1 * aS.z);
}`;

const POINT_FS = `#version 300 es
precision highp float;
in vec4 vC; in float vShape; in float vFlash; in float vNear;
out vec4 o;
${GLSL_HASH}
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r = length(c);
  if (r > 1.0) discard;
  // The mark sits in the middle half of the sprite; the rest is its glow when it lights up.
  vec2 q = c / 0.5; float aa = 0.18;
  float m;
  if (vShape < 0.5) m = smoothstep(1.0, 1.0 - aa * 2.0, length(q));                            // a person
  else if (vShape < 1.5) m = smoothstep(0.78, 0.78 - aa, max(abs(q.x), abs(q.y)));             // a place
  else if (vShape < 2.5) m = smoothstep(1.02, 1.02 - aa * 1.4, abs(q.x) + abs(q.y));            // a project
  else if (vShape < 3.5) m = smoothstep(0.26, 0.26 - aa, abs(length(q) - 0.72));                // knowledge
  else if (vShape < 4.5) m = exp(-r * r * 5.0) + smoothstep(0.3, 0.0, r);                       // a spark
  else m = smoothstep(1.0, 0.2, r);                                                             // a path's dust, a star
  float glow = vShape < 3.5 ? exp(-r * r * 3.2) * (0.16 + vFlash * 0.9) : 0.0;
  float a = (m + glow) * vC.a;
  a = mix(a, smoothstep(1.0, 0.0, r) * vC.a * 0.8, vNear * 0.3);
  a *= 0.8 + 0.4 * hash(gl_FragCoord.xy);
  vec3 col = mix(vC.rgb, vec3(1.0), vFlash * 0.5);
  o = vec4(col * a, a * 0.6);
}`;

// Ties: lines, each end knowing the tie's middle so both fall on the same side of the orb.
const LINE_VS = `#version 300 es
precision highp float;
in vec3 aP; in vec3 aM; in vec4 aC;
uniform mat3 uM; uniform float uD; uniform vec2 uTan; uniform float uSide;
out vec4 vC;
void main() {
  if ((uM * aM).z * uSide < 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec3 v = uM * aP; v.z -= uD;
  gl_Position = vec4(v.x / (-v.z * uTan.x), v.y / (-v.z * uTan.y), 0.0, 1.0);
  vC = aC;
}`;

const LINE_FS = `#version 300 es
precision highp float;
in vec4 vC; out vec4 o;
${GLSL_HASH}
void main() { float a = vC.a * (0.75 + 0.5 * hash(gl_FragCoord.xy)); o = vec4(vC.rgb * a, a * 0.5); }`;

// The fabric: orbits of fine dust round the orb, each a little uneven, each turning at its own speed
// (inner ones faster), drawn in toward every mass and sunk into a well beneath it, rippling when the orb flares.
// G: its orbit's radius, its angle, its unevenness seed, its brightness.
const FABRIC_VS = `#version 300 es
precision highp float;
in vec4 aG;
uniform mat3 uM; uniform float uD; uniform vec2 uTan; uniform float uPx; uniform float uSide; uniform float uGrow; uniform float uTime;
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
  vec3 w = vec3(p.x, -0.5 - 0.55 * well + 0.07 * rip, p.y);
  vec3 v = uM * w;
  if (v.z * uSide < 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  v.z -= uD;
  gl_Position = vec4(v.x / (-v.z * uTan.x), v.y / (-v.z * uTan.y), 0.0, 1.0);
  float r = length(p);
  vWell = clamp(well - 0.25, 0.0, 1.5); vRip = rip;
  // Each orbit is one or two arcs, bright at their head and trailing off behind it.
  float arcs = 1.0 + floor(k * 2.0), len = 0.25 + 0.45 * fract(k * 7.13);
  float sft = fract((k * 6.28 - aG.y) / 6.2832 * arcs);
  float clump = sft < len ? pow(1.0 - sft / len, 1.7) : 0.0;
  vA = (0.3 + 0.3 * vWell + 0.7 * rip) * aG.w * clump + 0.5 * rip * aG.w * (1.0 - clump) * smoothstep(6.3, 3.8, r) * smoothstep(1.05, 1.35, R) * uGrow;
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
  o = vec4(col * a, a * 0.5);
}`;

// The plane's own light: a grainy glow round the orb, and round each Lab as bright as it's dense.
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
in vec2 vP; uniform float uAmt; uniform vec4 uLab[10];
out vec4 o;
${GLSL_HASH}
void main() {
  float r = length(vP);
  float g = exp(-(r - 1.0) / 1.0) * 0.5 + exp(-(r - 1.0) / 3.0) * 0.14;
  vec3 c = vec3(0.0, 0.62, 0.66) * g;
  for (int i = 0; i < 10; i++) {
    vec2 d = vP - uLab[i].xy;
    float l = uLab[i].z * exp(-dot(d, d) / (uLab[i].w * uLab[i].w));
    c += mix(vec3(0.0, 0.62, 0.66), vec3(0.95, 0.55, 0.45), 0.25) * l;
    g += l;
  }
  float a = uAmt * smoothstep(5.8, 3.8, r) * smoothstep(0.9, 1.15, r) * (0.55 + 0.9 * hash(gl_FragCoord.xy));
  o = vec4(c * a, g * a * 0.5);
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

/** Start the live model in `wrap` (it gets `is-live` once it draws). Returns false without WebGL 2. */
export function mountOrbNet(wrap: HTMLElement, opts: OrbNetOptions = {}): boolean {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: Boolean(opts.poster) });
  if (!gl) return false;
  let pts: ReturnType<typeof compile>, lines: ReturnType<typeof compile>, orb: ReturnType<typeof compile>, disc: ReturnType<typeof compile>, fab: ReturnType<typeof compile>;
  try {
    pts = compile(gl, POINT_VS, POINT_FS); lines = compile(gl, LINE_VS, LINE_FS); orb = compile(gl, ORB_VS, ORB_FS);
    disc = compile(gl, DISC_VS, DISC_FS); fab = compile(gl, FABRIC_VS, FABRIC_FS);
  } catch (e) { console.warn("orbnet", e); return false; }
  wrap.appendChild(canvas);

  const model = new Model();
  const still = Boolean(opts.still || opts.poster);
  const rnd = mulberry(7);

  // Buffers.
  const vbo = (prog: WebGLProgram, layout: [string, number][], data: Float32Array, usage: number) => {
    const vao = gl.createVertexArray()!; gl.bindVertexArray(vao);
    const buf = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    const stride = layout.reduce((s, [, n]) => s + n, 0) * 4; let off = 0;
    for (const [name, n] of layout) { const loc = gl.getAttribLocation(prog, name); if (loc >= 0) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, gl.FLOAT, false, stride, off); } off += n * 4; }
    gl.bindVertexArray(null);
    return { vao, buf };
  };
  const PT: [string, number][] = [["aP", 3], ["aS", 4], ["aC", 4]]; // 11 floats a point
  // Static points: the Labs' orbit paths, the commons' path, and the stars.
  const stat: number[] = [];
  const pushPt = (a: number[], p: V3, size: number, shape: number, flash: number, alpha: number, c: V3, group: number) => a.push(p[0], p[1], p[2], size, shape, flash, alpha, c[0], c[1], c[2], group);
  // (No full orbits: each actor trails its own, and the fabric's orbits trail off.)
  for (let i = 0; i < 240; i++) pushPt(stat, [rnd() * 2 - 1, rnd() * 2 - 1, 0.3 + rnd()], 0.8 + rnd() * 1.1, 9, 0, 0.1 + Math.pow(rnd(), 2) * 0.45, rnd() < 0.3 ? [0.24, 0.9, 0.88] : [0.9, 1, 0.98], -1);
  const statN = stat.length / 11;
  const S = vbo(pts.prog, PT, new Float32Array(stat), gl.STATIC_DRAW);
  // Dynamic points: the actors and the sparks.
  const dynArr = new Float32Array((MAX_NODES + MAX_PULSES * TAIL + MAX_TRAIL) * 11);
  const DY = vbo(pts.prog, PT, dynArr, gl.DYNAMIC_DRAW);
  // Ties.
  const lineArr = new Float32Array((MAX_EDGES * 2 + MAX_CURVE) * 10);
  const LN = vbo(lines.prog, [["aP", 3], ["aM", 3], ["aC", 4]], lineArr, gl.DYNAMIC_DRAW);
  // The fabric's lattice.
  const grid: number[] = [];
  for (let R = 1.2; R < 6.3; R += 0.16 + rnd() * 0.14) {
    const k = rnd(), bright = 0.5 + rnd() * 0.7, n = Math.round((2 * Math.PI * R) / 0.03);
    for (let i = 0; i < n; i++) grid.push(R + (rnd() - 0.5) * 0.02, (i / n) * Math.PI * 2 + rnd() * 0.01, k, bright);
  }
  const FB = vbo(fab.prog, [["aG", 4]], new Float32Array(grid), gl.STATIC_DRAW);
  const gridN = grid.length / 4;
  // The orb's and the disc's quad.
  const quadVao = gl.createVertexArray(); gl.bindVertexArray(quadVao);
  const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const ramp = new Uint8Array(101 * 4); RAMP.split(",").map(Number).forEach((v, i) => { ramp[Math.floor(i / 3) * 4 + (i % 3)] = v; });
  for (let i = 0; i < 101; i++) ramp[i * 4 + 3] = 255;
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 101, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, ramp);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const D = 30;
  let W = 1, H = 1, dpr = 1, halfW = 4;
  const resize = () => {
    // Layout size, not the box on screen: the hero's entrance scales it for a moment.
    const w = wrap.clientWidth, h = wrap.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(w * dpr)); H = Math.max(1, Math.round(h * dpr));
    canvas.width = W; canvas.height = H;
    halfW = w < 620 ? 3.8 : 4.6;
    if (still) draw(performance.now());
  };

  // Inputs, eased.
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, cx: -1e4, cy: -1e4, inside: false };
  let scrollT = 0, scrollE = 0, focus = -1, focusAmt = 0, lastFocus = 0;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!still && fine) window.addEventListener("pointermove", (e) => {
    const r = wrap.getBoundingClientRect();
    ptr.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    ptr.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    ptr.cx = e.clientX - r.left; ptr.cy = e.clientY - r.top;
    ptr.inside = ptr.cx >= 0 && ptr.cy >= 0 && ptr.cx <= r.width && ptr.cy <= r.height;
  }, { passive: true });
  const readScroll = () => {
    const r = wrap.getBoundingClientRect();
    scrollT = clamp(window.scrollY / Math.max(1, r.top + window.scrollY + r.height * 0.55), 0, 1);
  };
  if (!still) window.addEventListener("scroll", readScroll, { passive: true });

  const t0 = performance.now();
  let last = t0, simT = 0;
  // A still frame shows the model a little way in, settled, with a spark or two in flight.
  if (still) { for (let i = 0; i < 540; i++) { simT += 1 / 60; model.step(1 / 60, simT, i > 300); } }

  function draw(now: number) {
    const dt = still ? 0 : Math.min(0.05, (now - last) / 1000); last = now;
    if (!still) { simT += dt; model.step(dt, simT, simT > 2.2); }
    const t = simT;
    const grow = still ? 1 : clamp((now - t0) / 1000 / 3.2, 0, 1);
    const g = 1 - Math.pow(1 - grow, 3);
    ptr.x = lerp(ptr.x, ptr.tx, 0.06); ptr.y = lerp(ptr.y, ptr.ty, 0.06);
    scrollE = lerp(scrollE, scrollT, 0.12);
    const s = ease(scrollE);

    const yaw = ptr.x * 9 * DEG + (still ? 0 : Math.sin(t * 0.13) * 2.5 * DEG), pitch = ptr.y * 6 * DEG;
    const par = mul(ry(yaw), rx(pitch));
    const spin = s * 38 * DEG;
    const view = mul(par, mul(rz(lerp(NET.roll, ABOVE.roll, s) * DEG), rx(lerp(NET.elev, ABOVE.elev, s) * DEG)));
    const M = mul(view, ry(spin));
    const orbView = mul(par, mul(rz(lerp(LOGO.roll, ABOVE_ORB.roll, s) * DEG), rx(lerp(LOGO.elev, ABOVE_ORB.elev, s) * DEG)));
    const O = mul(orbView, ry(spin + t * 2 * DEG));
    const pole = apply(orbView, [0, 1, 0]);
    const inv = [O[0], O[3], O[6], O[1], O[4], O[7], O[2], O[5], O[8]];
    const L = (() => { const v: V3 = [0.8 + ptr.x * 0.6, 0.3 - ptr.y * 0.6, 0.65]; const l = Math.hypot(...v); return v.map((x) => x / l) as V3; })();
    const aspect = W / H, tanX = halfW / D, tanY = tanX / aspect;

    // Which Lab the pointer is on.
    let hit = -1;
    if (ptr.inside && grow > 0.9) {
      let best = (80 * dpr) ** 2;
      model.labs.forEach((Lb, i) => {
        const v = apply(M, Lb.c); const z = v[2] - D;
        const sx = (v[0] / (-z * tanX) * 0.5 + 0.5) * W, sy = (0.5 - v[1] / (-z * tanY) * 0.5) * H;
        const d2 = (sx - ptr.cx * dpr) ** 2 + (sy - ptr.cy * dpr) ** 2;
        if (d2 < best) { best = d2; hit = i; }
      });
    }
    if (hit >= 0) { focus = hit; lastFocus = hit; }
    focusAmt = lerp(focusAmt, hit >= 0 ? 1 : 0, 0.08);
    if (hit < 0 && focusAmt < 0.01) focus = -1;

    // Fill the dynamic buffers: actors, then sparks with their tails.
    let n = 0;
    const put = (p: V3, size: number, shape: number, flash: number, alpha: number, c: V3, group: number) => {
      const o = n * 11; dynArr[o] = p[0]; dynArr[o + 1] = p[1]; dynArr[o + 2] = p[2]; dynArr[o + 3] = size; dynArr[o + 4] = shape; dynArr[o + 5] = flash; dynArr[o + 6] = alpha;
      dynArr[o + 7] = c[0]; dynArr[o + 8] = c[1]; dynArr[o + 9] = c[2]; dynArr[o + 10] = group; n++;
    };
    for (const a of model.nodes) {
      const born = still ? 1 : clamp((t - a.born) / 0.8, 0, 1);
      if (born <= 0) continue;
      const lit = a.c < 0 ? 0.95 : model.labs[a.c].lit ? 1 : 0.86;
      const size = (a.type === HUMAN ? 7 : a.type === PLACE ? 9.5 : a.type === PROJECT ? 10 : 10) * (1 + 0.08 * Math.sqrt(a.deg)) * (a.arrive ? 0.8 : 1);
      put(a.p, size * (0.6 + 0.4 * born), SHAPE[a.type], a.flash, (a.arrive ? 0.6 : 1) * lit * born, COLOR[a.type], a.c);
    }
    // Each actor trails its orbit behind it, fading: the orbits show only where things have just been.
    for (const a of model.nodes) {
      if (a.arrive || a.anchor !== undefined) continue;
      const born = still ? 1 : clamp((t - a.born) / 0.8, 0, 1);
      if (born <= 0 || n > MAX_NODES + MAX_TRAIL - 8) continue;
      const C = a.c >= 0 ? model.labs[a.c].c : [0, 0, 0];
      const lit = a.c < 0 ? 0.9 : model.labs[a.c].lit ? 1 : 0.85;
      const len = (a.c < 0 ? 0.5 : 0.32) / Math.max(a.r, 0.2); // radians of trail: about the same length everywhere
      for (let k = 1; k <= 6; k++) {
        const th = a.th - (k / 6) * len;
        put([C[0] + Math.cos(th) * a.r, C[1] + a.y, C[2] + Math.sin(th) * a.r], 2.4 - k * 0.2, 5, 0, 0.3 * (1 - k / 7) * lit * born, COLOR[a.type], a.c);
      }
    }
    for (const p of model.pulses) {
      if (t < p.t0) continue;
      const u = clamp((t - p.t0) / p.dur, 0, 1);
      const A = model.end(p.from, p.to), B = model.end(p.to, p.from);
      const c: V3 = p.kind === 1 ? [1, 0.3, 0.2] : p.kind === 2 ? [0.25, 1, 0.92] : [1, 0.98, 0.9];
      for (let k = 0; k < TAIL; k++) {
        const uu = clamp(u - k * 0.03, 0, 1);
        put([lerp(A[0], B[0], uu), lerp(A[1], B[1], uu), lerp(A[2], B[2], uu)], k ? 11 - k * 1.2 : 20, 4, 0, (k ? 0.7 - k * 0.09 : 1) * (1 - 0.25 * u) * (uu > 0 || k === 0 ? 1 : 0), c, -1);
      }
    }
    gl!.bindBuffer(gl!.ARRAY_BUFFER, DY.buf); gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, dynArr, 0, n * 11);
    // Ties.
    let m = 0;
    for (const e of model.ties) {
      const a = model.nodes[e.a], b = e.b >= 0 ? model.nodes[e.b] : null;
      const ba = still ? 1 : clamp((t - a.born - 0.3) / 0.8, 0, 1);
      const bb = b ? (still ? 1 : clamp((t - b.born - 0.3) / 0.8, 0, 1)) : g;
      if (a.arrive || (b && b.arrive) || ba * bb <= 0) continue;
      const P = a.p, Q = model.end(e.b, e.a);
      const mid: V3 = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2, (P[2] + Q[2]) / 2];
      const lit = a.c >= 0 && model.labs[a.c].lit ? 1 : 0.85;
      const foc = focus >= 0 && focusAmt > 0 ? (a.c === focus || (b && b.c === focus) ? 1 + 1.2 * focusAmt : 1 - 0.55 * focusAmt) : 1;
      const base = (e.bridge || e.b < 0 ? 0.28 : 0.17) * e.w * lit * foc * ba * bb;
      const front = e.b < 0 && apply(M, mid)[2] > 0 ? 0.3 : 1;
      const alpha = (base + e.flash * 0.55) * front;
      const col: V3 = e.flash > 0.05 ? [lerp(0.24, 0.95, e.flash), lerp(0.85, 1, e.flash), lerp(0.84, 0.98, e.flash)] : (e.bridge || e.b < 0 ? [0.24, 0.9, 0.88] : [0.55, 0.8, 0.8]);
      const vtx = (p: V3) => { const o = m * 10; lineArr[o] = p[0]; lineArr[o + 1] = p[1]; lineArr[o + 2] = p[2]; lineArr[o + 3] = mid[0]; lineArr[o + 4] = mid[1]; lineArr[o + 5] = mid[2]; lineArr[o + 6] = col[0]; lineArr[o + 7] = col[1]; lineArr[o + 8] = col[2]; lineArr[o + 9] = alpha; m++; };
      if ((e.bridge || e.b < 0) && m < MAX_EDGES * 2 + MAX_CURVE - 16) {
        // Ties between orbits curve like a spiral arm: the outer end trails, as outer orbits do.
        const cs = Math.cos(0.22), sn = Math.sin(0.22);
        const C: V3 = [mid[0] * cs - mid[2] * sn, mid[1], mid[0] * sn + mid[2] * cs];
        let prev = P;
        for (let k = 1; k <= 6; k++) {
          const u = k / 6, a1 = (1 - u) * (1 - u), b1 = 2 * u * (1 - u), c1 = u * u;
          const q: V3 = [a1 * P[0] + b1 * C[0] + c1 * Q[0], a1 * P[1] + b1 * C[1] + c1 * Q[1], a1 * P[2] + b1 * C[2] + c1 * Q[2]];
          vtx(prev); vtx(q); prev = q;
        }
      } else { vtx(P); vtx(Q); }
    }
    gl!.bindBuffer(gl!.ARRAY_BUFFER, LN.buf); gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, lineArr, 0, m * 10);

    // Masses for the fabric and the glow: the orb, then each Lab by its ties.
    const massU = new Float32Array(40), labU = new Float32Array(40);
    massU.set([0, 0, 1.0, 0.85], 0);
    model.labs.forEach((Lb, i) => {
      const k = Math.min(1.4, Lb.mass / 300);
      massU.set([Lb.c[0], Lb.c[2], 0.06 + 0.42 * k, 0.35 + Lb.size * 0.4], (i + 1) * 4);
      labU.set([Lb.c[0], Lb.c[2], (0.1 + 0.55 * k) * (Lb.lit ? 1.1 : 0.8) * (focus === i ? 1 + focusAmt : 1), Lb.size * 1.1], i * 4);
    });
    const ripU = new Float32Array(16);
    model.ripples.slice(-4).forEach((r, i) => { const age = t - r.t0; ripU.set([0, 0, 1.1 + age * 1.7, r.s * Math.max(0, 1 - age / 3.4)], i * 4); });

    gl!.viewport(0, 0, W, H);
    gl!.clearColor(0, 0, 0, 0); gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.enable(gl!.BLEND); gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
    const px = dpr * clamp(H / dpr / 600, 0.8, 1.2);

    const drawPts = (vao: WebGLVertexArrayObject, first: number, count: number, side: number) => {
      gl!.useProgram(pts.prog); gl!.bindVertexArray(vao);
      const U = pts.U;
      gl!.uniformMatrix3fv(U.uM, true, M); gl!.uniform1f(U.uD, D); gl!.uniform2f(U.uTan, tanX, tanY); gl!.uniform1f(U.uPx, px);
      gl!.uniform1f(U.uSide, side); gl!.uniform1f(U.uFocus, focus >= 0 ? focus : lastFocus); gl!.uniform1f(U.uFocusAmt, focus >= 0 ? focusAmt : 0);
      gl!.uniform2f(U.uPar, ptr.x, -ptr.y);
      gl!.drawArrays(gl!.POINTS, first, count);
    };
    const drawStatic = (side: number) => {
      // Orbit paths come in with the growth; stars too.
      gl!.useProgram(pts.prog); drawPts(S.vao, 0, g > 0.05 ? statN : 0, side);
    };
    const drawLines = (side: number) => {
      gl!.useProgram(lines.prog); gl!.bindVertexArray(LN.vao);
      gl!.uniformMatrix3fv(lines.U.uM, true, M); gl!.uniform1f(lines.U.uD, D); gl!.uniform2f(lines.U.uTan, tanX, tanY); gl!.uniform1f(lines.U.uSide, side);
      gl!.drawArrays(gl!.LINES, 0, m);
    };
    const drawFabric = (side: number) => {
      gl!.useProgram(fab.prog); gl!.bindVertexArray(FB.vao);
      const U = fab.U;
      gl!.uniformMatrix3fv(U.uM, true, M); gl!.uniform1f(U.uD, D); gl!.uniform2f(U.uTan, tanX, tanY); gl!.uniform1f(U.uPx, px);
      gl!.uniform1f(U.uSide, side); gl!.uniform1f(U.uGrow, g); gl!.uniform1f(U.uTime, t);
      gl!.uniform4fv(U.uMass, massU); gl!.uniform4fv(U.uRip, ripU);
      gl!.drawArrays(gl!.POINTS, 0, gridN);
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
    // A Lab dense enough closes into a small orb of its own.
    const bodies = model.labs.map((Lb, i) => {
      const r = clamp((Lb.mass - 150) / 700, 0, 0.21);
      const v = apply(M, Lb.c); v[2] -= D;
      return { v, r: r * (0.5 + 0.5 * g), bright: (Lb.lit ? 1.05 : 0.8) * (focus === i ? 1 + 0.4 * focusAmt : 1) * g, i };
    }).filter((b) => b.r > 0.02).sort((a, b) => a.v[2] - b.v[2]);

    gl!.useProgram(disc.prog); gl!.bindVertexArray(quadVao);
    gl!.uniformMatrix3fv(disc.U.uM, true, M); gl!.uniform1f(disc.U.uD, D); gl!.uniform2f(disc.U.uTan, tanX, tanY); gl!.uniform1f(disc.U.uR, 5.9);
    gl!.uniform1f(disc.U.uAmt, 0.2 * g); gl!.uniform4fv(disc.U.uLab, labU);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);

    drawStatic(-1);
    drawFabric(-1);
    drawLines(-1);
    drawPts(DY.vao, 0, n, -1);
    bodies.filter((b) => b.v[2] < -D).forEach((b) => drawOrb(b.v, b.r, b.bright, 1.1 * b.bright, 0));
    drawOrb([0, 0, -D], 1, 1 + 0.3 * model.orbFlash, 1 + 1.2 * model.orbFlash, still ? 0.6 : 1);
    drawFabric(1);
    drawStatic(1);
    drawLines(1);
    bodies.filter((b) => b.v[2] >= -D).forEach((b) => drawOrb(b.v, b.r, b.bright, 1.1 * b.bright, 0));
    drawPts(DY.vao, 0, n, 1);

    if (!wrap.classList.contains("is-live")) wrap.classList.add("is-live");
  }

  new ResizeObserver(resize).observe(wrap);
  resize();
  if (still) { draw(performance.now()); return true; }

  let on = false, raf = 0;
  const loop = (now: number) => { draw(now); raf = on ? requestAnimationFrame(loop) : 0; };
  const setOn = (v: boolean) => { if (v === on) return; on = v; if (on && !raf) { readScroll(); last = performance.now(); raf = requestAnimationFrame(loop); } };
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; setOn(visible && !document.hidden); }).observe(wrap);
  document.addEventListener("visibilitychange", () => setOn(visible && !document.hidden));
  return true;
}

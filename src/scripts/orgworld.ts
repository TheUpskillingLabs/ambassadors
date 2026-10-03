/* The For enterprise page's world (/enterprise/): an org chart that rewires
   into a network as you scroll. Canvas 2D, in the home page's visual language
   (ink, hairline rules, the teal and red glows, gold for the local and for
   Mentors, silver for the national commons) but none of its orb.

   The scenes, by scroll position p (the hero is 0):
   0  the org chart: leadership, five departments, people in their columns;
   1  a problem situation drops in, through the chart, to the open space below it;
   2  people from every department leave their boxes and gather round it: a Pod
      (their empty slots stay behind as rings);
   3  the knot unravels into three strands and teams of four form at their ends;
      Mentors arrive from outside, in gold;
   4  each team builds a first version (a teal tile); one hits a knot of its own,
      and its Mentor's workshop (a gold ring) frees it;
   5  everyone goes home and teaches: rings spread from each of them and the
      people around them light up;
   6  the chart fades back, rewired: the teams' ties now run across the
      departments, and more form between the people they taught;
   7  the camera pulls out: the company is one node in a wider network of Labs
      at public libraries and other companies round the open playbooks
      (silver), which reach every node, and what each improves flows back.

   The page sets p from the scroll; the world adds only an ambient drift (and
   not with reduced motion, or when paused). Words drawn here come from
   content/site/enterprise.json (model). */

type V = [number, number];
type RGB = [number, number, number];
export interface OrgLabels { top: string; departments: string[]; problem: string; mentor: string; company: string; labs: string; commons: string }
export interface OrgWorld { setProgress(p: number): void; pause(): void; play(): void; paused(): boolean; resize(): void; dispose(): void }

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const sm = (x: number) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const ramp = (p: number, a: number, b: number) => sm((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: V, b: V, t: number): V => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const polar = (r: number, deg: number): V => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)];
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const TEAL: RGB = [70, 200, 210], GOLD: RGB = [207, 171, 103], RED: RGB = [226, 70, 76], SILVER: RGB = [206, 216, 220], WHITE: RGB = [244, 248, 249];
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a, 0, 1)})`;
const FONT = '"Geologica Variable", "Geologica", system-ui, sans-serif';

// ── the chart ──
const DX = [-1.2, -0.6, 0, 0.6, 1.2], DEPT_Y = -0.66, TOP: V = [0, -0.92], TRUNK_Y = -0.79;
const BOX: V = [0.46, 0.1], TOP_BOX: V = [0.4, 0.1];
const PER = 10, ROW0 = -0.48, ROW_H = 0.13, COL = 0.09;
const K: V = [0, 0.56]; // where the problem situation lands
interface Person { d: number; i: number; home: V; ph: number }
const people: Person[] = [];
for (let d = 0; d < 5; d++) for (let i = 0; i < PER; i++) people.push({ d, i, home: [DX[d] + (i % 2 ? COL : -COL), ROW0 + Math.floor(i / 2) * ROW_H], ph: (d * 7 + i * 3) % 11 });
const at = (d: number, i: number) => d * PER + i;

// three teams of four, mixed across departments; each takes four neighbouring slots on the Pod's ring
const TEAMS = [[at(0, 3), at(1, 1), at(2, 4), at(3, 2)], [at(1, 8), at(2, 9), at(4, 0), at(0, 6)], [at(3, 7), at(4, 5), at(1, 5), at(2, 1)]];
const TEAM_DIR = [210, 90, 330];
const TEAM_C: V[] = TEAM_DIR.map((a) => add(K, polar(0.52, a)));
const MENTOR_OFF: V[] = [[-0.2, 0.02], [0.2, 0.02], [0.2, 0.02]];
const MENTOR_FROM: V[] = [[2.3, 0.3], [2.4, 0.75], [2.2, -0.1]];
interface Member { p: number; team: number; k: number; ring: V; spot: V; st: number }
const members: Member[] = [];
TEAMS.forEach((ids, t) => ids.forEach((p, k) => {
  members.push({ p, team: t, k, ring: add(K, polar(0.36, TEAM_DIR[t] - 45 + k * 30)), spot: add(TEAM_C[t], polar(0.135, 45 + k * 90)), st: (t * 4 + k) * 0.018 });
}));
const memberOf = new Map(members.map((m) => [m.p, m]));
// the colleagues each member teaches when they go home: distance (in seats) to the nearest member in the same department
const taught = people.map((pp, idx) => {
  if (memberOf.has(idx)) return 0;
  let best = 9;
  for (const m of members) { const q = people[m.p]; if (q.d !== pp.d) continue; best = Math.min(best, Math.abs(q.i % 2 - pp.i % 2) + Math.abs(Math.floor(q.i / 2) - Math.floor(pp.i / 2))); }
  return best;
});
// ties: within each team, then new ones across departments between the people they taught
const ties: [number, number, number][] = [];
for (const ids of TEAMS) for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) ties.push([ids[a], ids[b], 0]);
{
  const r = rng(7); let n = 0, guard = 0;
  while (n < 16 && guard++ < 400) {
    const a = Math.floor(r() * people.length), b = Math.floor(r() * people.length);
    if (people[a].d === people[b].d || Math.abs(people[a].d - people[b].d) > 2) continue;
    if (ties.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) continue;
    ties.push([a, b, 1]); n++;
  }
}

// ── the wider network (scene 7): the open playbooks at the centre, the company one node on its ring ──
const CM: V = [3.6, 0], NET_R = 3.6;
const NODES = [130, 85, 40, 0, -40, -85, -130].map((a, k) => ({ c: add(CM, polar(NET_R, a)), kind: k % 3 === 1 ? "co" : "lab" }));

// camera: a centre and a zoom for each scene, eased between them. The hero's
// zoom (0) fits the chart itself to the picture, so it opens large and centred.
const CAM: { c: V; z: number }[] = [
  { c: [0, -0.45], z: 0 }, { c: [0, 0], z: 1 }, { c: [0, 0.24], z: 1.08 }, { c: [0, 0.34], z: 1.14 },
  { c: [0, 0.34], z: 1.14 }, { c: [0, 0.06], z: 1 }, { c: [0, -0.02], z: 1 }, { c: [3.2, 0.02], z: 0.31 },
];

export function mountOrgWorld(canvas: HTMLCanvasElement, labels: OrgLabels, opts: { fixed?: number; still?: boolean } = {}): OrgWorld {
  const ctx = canvas.getContext("2d")!;
  // Safari before 16 has no roundRect: fall back to a plain rectangle.
  const rr = (x: number, y: number, w: number, h: number, r: number) => (ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h));
  const still = !!opts.still || opts.fixed !== undefined;
  let p = opts.fixed ?? 0, t = 0, last = performance.now(), born = still ? -1e9 : performance.now();
  let isPhone = false, W = 0, H = 0, dpr = 1, region = { x: 0, y: 0, w: 1, h: 1 }, raf = 0, dirty = true, isPaused = false, onScreen = true, disposed = false;
  const phone = () => matchMedia("(max-aspect-ratio: 1/1)").matches;

  // soft glows, drawn once per colour and stamped with "lighter"
  const sprites = new Map<string, HTMLCanvasElement>();
  const glow = (c: RGB) => {
    const key = c.join(",");
    let s = sprites.get(key);
    if (!s) {
      s = document.createElement("canvas"); s.width = s.height = 64;
      const g = s.getContext("2d")!, gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, rgba(c, 0.9)); gr.addColorStop(0.35, rgba(c, 0.35)); gr.addColorStop(1, rgba(c, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64); sprites.set(key, s);
    }
    return s;
  };

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    isPhone = phone();
    dpr = Math.min(devicePixelRatio || 1, isPhone ? 1.75 : 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const head = 72;
    region = isPhone ? { x: 0, y: head - 6, w: W, h: H * 0.86 - head } : { x: W * 0.4, y: head, w: W * 0.585, h: H * 0.97 - head };
    dirty = true;
  }

  function camera() {
    const i = clamp(Math.floor(p), 0, CAM.length - 1), j = Math.min(i + 1, CAM.length - 1), f = sm(p - i);
    const s0 = Math.min(region.w / (isPhone ? 3.02 : 3.4), region.h / 2.3);
    const fit = Math.min(1.35, Math.min(region.w / 3.05, region.h / 1.45) / s0);
    const a = CAM[i], b = CAM[j], za = a.z || fit, zb = b.z || fit;
    const z = Math.exp(lerp(Math.log(za), Math.log(zb), f));
    return { c: mix(a.c, b.c, f), s: s0 * z, z };
  }

  function frame(now: number) {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const moving = !still && !isPaused;
    if (moving) t += dt;
    const intro = still ? 1 : clamp((now - born) / 1600, 0, 1);
    draw(intro);
    dirty = false;
    if (onScreen && (moving || intro < 1)) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && onScreen && !disposed) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  function draw(intro: number) {
    const cam = camera(), S = cam.s;
    const cx = region.x + region.w / 2, cy = region.y + region.h / 2;
    const sx = (v: V) => cx + (v[0] - cam.c[0]) * S, sy = (v: V) => cy + (v[1] - cam.c[1]) * S;
    const amb = still ? 0 : 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const unit = clamp(S / 300, 0.5, 1.6); // a dot's size follows the zoom, within limits
    const dotR = 4.2 * unit;

    const net = ramp(p, 6.3, 6.95);
    const orgA = (1 - 0.62 * ramp(p, 5.35, 6.0)) * ramp(intro, 0, 0.45);
    const labelA = (1 - 0.45 * ramp(p, 5.35, 6.0)) * (1 - ramp(p, 6.35, 6.8)) * ramp(intro, 0.2, 0.6);

    // the wider network, behind everything
    if (net > 0) {
      ctx.lineWidth = 1;
      for (const n of NODES) {
        ctx.strokeStyle = rgba(SILVER, 0.16 * net);
        ctx.beginPath(); ctx.moveTo(sx(CM), sy(CM)); ctx.lineTo(sx(n.c), sy(n.c)); ctx.stroke();
      }
      ctx.strokeStyle = rgba(SILVER, 0.16 * net);
      ctx.beginPath(); ctx.moveTo(sx(CM), sy(CM)); ctx.lineTo(sx([0, 0]), sy([0, 0])); ctx.stroke();
      ctx.globalCompositeOperation = "lighter";
      const targets: { c: V; back: boolean }[] = [...NODES.map((n) => ({ c: n.c, back: n.kind === "lab" })), { c: [0, 0] as V, back: true }];
      targets.forEach((n, k) => {
        for (let j = 0; j < 2; j++) {
          const f = (t * 0.12 + j / 2 + k * 0.137) % 1;
          const q = mix(CM, n.c, f), r = 7 * unit;
          ctx.globalAlpha = net * Math.sin(f * Math.PI) * 0.9;
          ctx.drawImage(glow(SILVER), sx(q) - r, sy(q) - r, r * 2, r * 2);
          if (n.back) {
            const fb = (t * 0.1 + j / 2 + k * 0.211 + 0.25) % 1, qb = mix(n.c, CM, fb);
            ctx.globalAlpha = net * Math.sin(fb * Math.PI) * 0.8;
            ctx.drawImage(glow(TEAL), sx(qb) - r, sy(qb) - r, r * 2, r * 2);
          }
        }
      });
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      for (const n of NODES) drawNode(n.c, n.kind, net, sx, sy, unit);
      // the open playbooks, in silver
      const R = 46 * unit;
      ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = net;
      ctx.drawImage(glow(SILVER), sx(CM) - R * 1.6, sy(CM) - R * 1.6, R * 3.2, R * 3.2);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = rgba(SILVER, 0.7 * net); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(sx(CM), sy(CM), R * 0.55, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = rgba(SILVER, 0.95 * net);
      ctx.beginPath(); ctx.arc(sx(CM), sy(CM), R * 0.2, 0, Math.PI * 2); ctx.fill();
    }

    // the chart's lines: leadership down to each department, then each department's spine and seats
    const draw0 = ramp(intro, 0.1, 0.65);
    ctx.strokeStyle = rgba(WHITE, 0.2 * orgA); ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx(TOP), sy([0, TOP[1] + TOP_BOX[1] / 2])); ctx.lineTo(sx(TOP), sy([0, lerp(TOP[1] + TOP_BOX[1] / 2, TRUNK_Y, draw0)]));
    ctx.moveTo(sx([lerp(0, DX[0], draw0), 0]), sy([0, TRUNK_Y])); ctx.lineTo(sx([lerp(0, DX[4], draw0), 0]), sy([0, TRUNK_Y]));
    for (const x of DX) { ctx.moveTo(sx([x, 0]), sy([0, TRUNK_Y])); ctx.lineTo(sx([x, 0]), sy([0, lerp(TRUNK_Y, DEPT_Y - BOX[1] / 2, draw0)])); }
    for (const x of DX) {
      const top = DEPT_Y + BOX[1] / 2, bot = ROW0 + 4 * ROW_H;
      ctx.moveTo(sx([x, 0]), sy([0, top])); ctx.lineTo(sx([x, 0]), sy([0, lerp(top, bot, draw0)]));
      for (let r = 0; r < 5; r++) {
        const y = ROW0 + r * ROW_H;
        if (y > lerp(top, bot, draw0)) continue;
        ctx.moveTo(sx([x - COL + 0.03, 0]), sy([0, y])); ctx.lineTo(sx([x + COL - 0.03, 0]), sy([0, y]));
      }
    }
    ctx.stroke();
    // the boxes and their names
    const box = (c: V, size: V, label: string) => {
      const x = sx([c[0] - size[0] / 2, 0]), y = sy([0, c[1] - size[1] / 2]), w = size[0] * S, h = size[1] * S;
      ctx.fillStyle = rgba(WHITE, 0.035 * orgA); ctx.strokeStyle = rgba(WHITE, 0.32 * orgA); ctx.lineWidth = 1;
      ctx.beginPath(); rr(x, y, w, h, Math.min(8, h / 2.5)); ctx.fill(); ctx.stroke();
      if (labelA > 0.01) {
        let fs = clamp(S * 0.032, 9, 12);
        ctx.font = `600 ${fs}px ${FONT}`; ctx.letterSpacing = `${fs * 0.1}px`;
        let tw = ctx.measureText(label.toUpperCase()).width;
        if (tw > w - 8) { ctx.letterSpacing = "0px"; tw = ctx.measureText(label.toUpperCase()).width; if (tw > w - 8) { fs *= (w - 8) / tw; ctx.font = `600 ${fs}px ${FONT}`; } }
        if (fs < 5.5) { ctx.letterSpacing = "0px"; return; }
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = rgba(WHITE, 0.72 * labelA);
        ctx.fillText(label.toUpperCase(), x + w / 2, y + h / 2 + 0.5);
        ctx.letterSpacing = "0px";
      }
    };
    box(TOP, TOP_BOX, labels.top);
    DX.forEach((x, d) => box([x, DEPT_Y], BOX, labels.departments[d] ?? ""));

    // the problem situation: drops in through the chart, waits below it, then unravels into strands
    const drop = ramp(p, 0.5, 1.15), knotA = ramp(p, 0.45, 0.75) * (1 - ramp(p, 2.2, 2.75));
    const kp: V = [K[0], lerp(-1.35, K[1], drop)];
    if (knotA > 0.01) drawKnot(kp, 0.05 * (0.6 + 0.4 * drop), knotA, t * 0.25, RED, sx, sy, unit);
    const strand = ramp(p, 2.2, 2.9), strandA = (1 - ramp(p, 4.4, 4.9)) * ramp(p, 2.15, 2.4);
    if (strandA > 0.01) {
      ctx.lineWidth = 1.4 * unit;
      TEAM_C.forEach((c, k) => {
        const ctrl = add(mix(K, c, 0.5), polar(0.12, TEAM_DIR[k] + 90));
        ctx.strokeStyle = rgba(GOLD, 0.65 * strandA);
        ctx.beginPath(); ctx.moveTo(sx(K), sy(K));
        const N = 24;
        for (let n = 1; n <= N * strand; n++) {
          const u = n / N, a = mix(mix(K, ctrl, u), mix(ctrl, c, u), u);
          ctx.lineTo(sx(a), sy(a));
        }
        ctx.stroke();
      });
    }

    // where everyone is: home, then the Pod's ring, then their team, then home again
    const pos = people.map((pp, idx): V => {
      const w = still ? 0 : amb;
      const drift: V = [Math.sin(t * 0.7 + pp.ph) * 0.004 * w, Math.cos(t * 0.6 + pp.ph * 1.3) * 0.004 * w];
      const m = memberOf.get(idx);
      if (!m) return add(pp.home, drift);
      const toPod = ramp(p, 1.2 + m.st, 1.85 + m.st), toTeam = ramp(p, 2.3 + m.st * 0.5, 3.0 + m.st * 0.5), back = ramp(p, 4.45 + m.st, 5.15 + m.st);
      let v = mix(pp.home, m.ring, toPod);
      v = mix(v, m.spot, toTeam);
      v = mix(v, pp.home, back);
      // a lift on the way out and home, so the moves read as arcs
      const arc = Math.sin(toPod * Math.PI) * -0.05 + Math.sin(back * Math.PI) * -0.06;
      return add(add(v, [0, arc]), drift);
    });
    const lit = people.map((_, idx) => {
      const m = memberOf.get(idx);
      if (m) return ramp(p, 3.0, 4.0);
      const dd = taught[idx];
      return ramp(p, 5.1 + 0.07 * dd, 5.45 + 0.07 * dd);
    });

    // ties: the teams' first, while they work, then the new ones across the chart
    ctx.lineWidth = 1.1 * unit;
    for (const [a, b, kind] of ties) {
      const ta = kind === 0 ? ramp(p, 2.75, 3.15) : ramp(p, 5.5 + (a % 5) * 0.05, 6.05 + (a % 5) * 0.05);
      const alpha = ta * (1 - 0.4 * ramp(p, 6.5, 7)) * (kind === 0 ? 0.55 : 0.42);
      if (alpha < 0.01) continue;
      const A = pos[a], B = pos[b], mid = mix(A, B, 0.5), dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
      const bend = (kind === 0 ? 0.16 : 0.18) * len * ((a + b) % 2 ? 1 : -1);
      const ctrl: V = [mid[0] - (dy / len) * bend, mid[1] + (dx / len) * bend];
      ctx.strokeStyle = rgba(TEAL, alpha);
      ctx.beginPath(); ctx.moveTo(sx(A), sy(A)); ctx.quadraticCurveTo(sx(ctrl), sy(ctrl), sx(B), sy(B)); ctx.stroke();
    }

    // the empty seats people left behind
    for (const m of members) {
      const away = ramp(p, 1.2 + m.st, 1.6 + m.st) * (1 - ramp(p, 4.9 + m.st, 5.15 + m.st));
      if (away < 0.01) continue;
      const h = people[m.p].home;
      ctx.strokeStyle = rgba(WHITE, 0.32 * away * orgA); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(sx(h), sy(h), dotR, 0, Math.PI * 2); ctx.stroke();
    }

    // what each team builds: a first version, as a tile; team two hits a knot, and its Mentor's workshop frees it
    const build = ramp(p, 3.05, 3.7), buildA = 1 - ramp(p, 6.35, 6.8);
    if (build > 0.01) {
      TEAM_C.forEach((c, k) => {
        const s = 0.052 * build * (k === 1 ? 0.6 + 0.4 * ramp(p, 3.95, 4.25) : 1);
        const x = sx(c), y = sy(c), r = s * S;
        ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.55 * build * buildA;
        ctx.drawImage(glow(TEAL), x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = rgba([150, 230, 236], 0.9 * build * buildA);
        ctx.beginPath(); rr(x - r / 2, y - r / 2, r, r, r * 0.22); ctx.fill();
      });
      const snag = ramp(p, 3.35, 3.55) * (1 - ramp(p, 3.85, 4.05));
      if (snag > 0.01) drawKnot(TEAM_C[1], 0.016, snag, t * 0.6, RED, sx, sy, unit);
      const ws = ramp(p, 3.7, 4.15);
      if (ws > 0.01 && ws < 0.999) {
        const o = add(TEAM_C[1], MENTOR_OFF[1]);
        ctx.strokeStyle = rgba(GOLD, 0.8 * (1 - ws)); ctx.lineWidth = 1.6 * unit;
        ctx.beginPath(); ctx.arc(sx(o), sy(o), (0.03 + 0.26 * ws) * S, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // teaching: a ring from each of them as they get home
    for (const m of members) {
      const tr = ramp(p, 5.05 + m.st, 5.6 + m.st);
      if (tr <= 0.01 || tr >= 0.999) continue;
      const h = people[m.p].home;
      ctx.strokeStyle = rgba(TEAL, 0.75 * (1 - tr)); ctx.lineWidth = 1.4 * unit;
      ctx.beginPath(); ctx.arc(sx(h), sy(h), (0.02 + 0.15 * tr) * S, 0, Math.PI * 2); ctx.stroke();
    }

    // the people: a dot each, lit teal by what they've learned
    people.forEach((pp, idx) => {
      const appear = still ? 1 : ramp(intro, 0.3 + idx * 0.007, 0.55 + idx * 0.007);
      if (appear <= 0) return;
      const v = pos[idx], x = sx(v), y = sy(v), L = lit[idx];
      if (L > 0.01) {
        const r = dotR * 3.4 * (1 + 0.08 * Math.sin(t * 1.6 + pp.ph) * amb);
        ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.5 * L * appear;
        ctx.drawImage(glow(TEAL), x - r, y - r, r * 2, r * 2);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      }
      ctx.fillStyle = `rgba(${Math.round(lerp(236, 160, L))},${Math.round(lerp(242, 236, L))},${Math.round(lerp(244, 240, L))},${(0.62 + 0.38 * L) * appear})`;
      ctx.beginPath(); ctx.arc(x, y, dotR * (0.6 + 0.4 * appear), 0, Math.PI * 2); ctx.fill();
    });

    // Mentors, from outside, in gold
    const inM = ramp(p, 2.45, 3.15), outM = ramp(p, 4.8, 5.45);
    if (inM > 0.01 && outM < 0.999) {
      TEAM_C.forEach((c, k) => {
        const target = add(c, MENTOR_OFF[k]);
        let v = mix(MENTOR_FROM[k], target, inM);
        v = mix(v, MENTOR_FROM[k], outM);
        const x = sx(v), y = sy(v), r = dotR * 3.6;
        ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.6;
        ctx.drawImage(glow(GOLD), x - r, y - r, r * 2, r * 2);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = rgba([238, 210, 150], 1);
        ctx.beginPath(); ctx.arc(x, y, dotR * 1.12, 0, Math.PI * 2); ctx.fill();
      });
    }

    // words in the world: the problem, a Mentor, and in the wide shot the three kinds of node
    const tag = (v: V, text: string, a: number, c: RGB = WHITE, dyPx = 0) => {
      if (a < 0.01) return;
      const fs = 11;
      ctx.font = `600 ${fs}px ${FONT}`; ctx.letterSpacing = `${fs * 0.1}px`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = rgba(c, 0.85 * a);
      ctx.fillText(text.toUpperCase(), sx(v), sy(v) + dyPx);
      ctx.letterSpacing = "0px";
    };
    tag([kp[0], kp[1] + 0.17], labels.problem, ramp(p, 0.95, 1.2) * (1 - ramp(p, 1.3, 1.55)), [240, 170, 172]);
    tag(add(add(TEAM_C[0], MENTOR_OFF[0]), [0, 0.1]), labels.mentor, ramp(p, 3.0, 3.3) * (1 - ramp(p, 4.2, 4.5)), [238, 210, 150]);
    if (net > 0.01) {
      tag([0, 1.3], labels.company, net);
      tag(add(NODES[0].c, [0, 0.62]), labels.labs, net, [238, 210, 150]);
      tag(add(CM, [0, 0.7]), labels.commons, net, SILVER);
    }
  }

  function drawKnot(c: V, scale: number, a: number, rot: number, col: RGB, sx: (v: V) => number, sy: (v: V) => number, unit: number) {
    const pts: V[] = [];
    for (let n = 0; n <= 120; n++) {
      const u = (n / 120) * Math.PI * 2;
      const x = Math.sin(u) + 2 * Math.sin(2 * u), y = Math.cos(u) - 2 * Math.cos(2 * u);
      const cr = Math.cos(rot), sr = Math.sin(rot);
      pts.push([c[0] + (x * cr - y * sr) * scale, c[1] + (x * sr + y * cr) * scale]);
    }
    const R = scale * 5 * camera().s;
    ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.5 * a;
    ctx.drawImage(glow(col), sx(c) - R, sy(c) - R, R * 2, R * 2);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = rgba([250, 236, 236], 0.9 * a); ctx.lineWidth = 1.5 * unit;
    ctx.beginPath(); pts.forEach((q, n) => (n ? ctx.lineTo(sx(q), sy(q)) : ctx.moveTo(sx(q), sy(q)))); ctx.stroke();
  }

  function drawNode(c: V, kind: string, a: number, sx: (v: V) => number, sy: (v: V) => number, unit: number) {
    const r = 3 * unit;
    if (kind === "lab") {
      ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.5 * a;
      const R = 0.5 * camera().s;
      ctx.drawImage(glow(GOLD), sx(c) - R, sy(c) - R, R * 2, R * 2);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      for (let n = 0; n < 11; n++) {
        const q = add(c, polar(0.3, n * (360 / 11) + 10));
        ctx.fillStyle = rgba([238, 214, 160], 0.85 * a);
        ctx.beginPath(); ctx.arc(sx(q), sy(q), r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = rgba(GOLD, a);
      ctx.beginPath(); ctx.arc(sx(c), sy(c), r * 1.8, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = rgba(WHITE, 0.3 * a); ctx.lineWidth = 1;
      const w = 0.62 * camera().s, h = 0.42 * camera().s;
      ctx.beginPath(); rr(sx(c) - w / 2, sy(c) - h / 2, w, h, 6); ctx.stroke();
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
        const q: V = [c[0] - 0.22 + i * 0.147, c[1] - 0.1 + j * 0.1];
        ctx.fillStyle = rgba(i === j ? [160, 236, 240] : WHITE, 0.7 * a);
        ctx.beginPath(); ctx.arc(sx(q), sy(q), r * 0.9, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  resize();
  const ro = new ResizeObserver(() => { resize(); dirty = true; kick(); });
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) kick(); });
  io.observe(canvas);
  document.fonts?.ready.then(() => { dirty = true; kick(); });
  kick();

  return {
    setProgress(v: number) { if (opts.fixed !== undefined) return; if (Math.abs(v - p) > 1e-4) { p = v; dirty = true; kick(); } },
    pause() { isPaused = true; },
    play() { isPaused = false; kick(); },
    paused: () => isPaused,
    resize() { resize(); kick(); },
    dispose() { disposed = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); },
  };
}

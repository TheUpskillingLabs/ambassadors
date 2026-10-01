/* The weave: the three paths joining opens, braided into one thread through the home page.
   Learn is teal candy enamel, build red candy enamel, pass it on polished gold: the same
   colours as the hero's actors and its sparks, in the pins' materials (LabsPin.blend).

   It's one journey with the hero, in, through and with The Labs:
     in       as the hero's story ends, three strands grow out of the bottom of the orb and
              settle into a braid down the page's left edge;
     through  scrolling twists it, so the page weaves as you read. At "Learn it. Build it.
              Pass it on." it comes apart, each strand sweeping out to its own label (the
              label's gem a bead on it), then braids back. In each chapter its own strand is
              lit and the other two drop to bronze, and sparks run down the lit one;
     with     at the close the strands come back together and tie into a new orb: a Lab to
              come, so the weave grows back into the model it came from.

   Drawn with WebGL 2 on one fixed canvas over the page (it takes no pointer events), only
   in the room the layout leaves it. Each strand is a ribbon shaded as a tube: candy enamel
   (deep at the edges, glowing in the core, a clear gloss, fine glitter) or polished metal
   reflecting a studio's softboxes, the way the renders are lit. Over and under is real:
   each crossing is decided by depth. Everything is placed from the page itself: the hero's
   orb (the root), the gutter left of the text (the spine), [data-fan] and the gems in
   .hm-strands (the fan), the chapters (#learn, #build, #give, ended by #story) and
   [data-knot] (the new orb). Reduced motion gets the weave still: no twist, no sparks. */

type Pt = { x: number; y: number; r: number };
export interface WeaveOptions { root: () => Pt | null; still?: boolean }

const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** 1 inside [a, b], easing in and out over `ramp`. */
const band = (y: number, a: number, b: number, ramp: number) => ease((y - a) / ramp) * (1 - ease((y - (b - ramp)) / ramp));
const TAU = Math.PI * 2;

const TUBE_VS = `#version 300 es
in vec2 aP; in vec2 aN; in vec4 aA; in vec2 aB;
uniform vec2 uRes;
out vec2 vN; out float vU; out float vZ; out float vLit; out float vK; out float vR; out float vS;
void main() {
  vN = aN; vU = aA.x; vZ = aA.y; vLit = aA.z; vK = aA.w; vR = aB.x; vS = aB.y;
  gl_Position = vec4(aP.x / uRes.x * 2.0 - 1.0, 1.0 - aP.y / uRes.y * 2.0, 0.0, 1.0);
}`;

const TUBE_FS = `#version 300 es
precision highp float;
in vec2 vN; in float vU; in float vZ; in float vLit; in float vK; in float vR; in float vS;
uniform float uTime; uniform float uDpr;
out vec4 o;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main() {
  float u = clamp(vU, -1.0, 1.0), c = sqrt(max(1.0 - u * u, 0.0));
  vec3 n = normalize(vec3(vN * u, c));                       // the tube's normal; screen y runs down
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(vec3(-0.55, -0.7, 0.62));               // the key, from the upper left
  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(n, normalize(L + V)), 0.0), 70.0);
  float spec2 = pow(max(dot(n, normalize(normalize(vec3(0.65, -0.15, 0.75)) + V)), 0.0), 20.0);
  float fres = pow(1.0 - c, 3.0);
  vec3 R = reflect(-V, n);
  // the studio, as the metal sees it: a long softbox above, a strip to the right, a card to the left
  float env = 0.1 + 1.0 * exp(-pow((R.y + 0.55) / 0.2, 2.0)) + 0.5 * exp(-pow((R.x - 0.6) / 0.22, 2.0)) + 0.22 * exp(-pow((R.x + 0.7) / 0.18, 2.0));
  int k = int(vK + 0.5);
  vec3 gold = vec3(0.86, 0.64, 0.32), bronze = vec3(0.17, 0.125, 0.08);
  vec3 col;
  if (k == 2) {
    vec3 tint = mix(bronze, gold, vLit);
    col = tint * env * (0.75 + 0.25 * diff) + mix(vec3(0.42, 0.33, 0.2), vec3(1.0, 0.93, 0.76), vLit) * (spec * 1.4 + spec2 * 0.3);
  } else {
    vec3 candy = k == 0 ? vec3(0.0, 0.6, 0.68) : vec3(0.9, 0.06, 0.08);
    vec3 metal = bronze * env * (0.75 + 0.25 * diff) + vec3(0.42, 0.33, 0.2) * spec * 0.7;
    vec3 body = candy * (0.2 + 0.72 * diff) + candy * 0.6 * c * c * c;          // deep at the edges, glowing in the core
    body += vec3(1.0) * (spec * 1.15 + spec2 * 0.22) + candy * fres * 0.3;      // the clear coat
    body += vec3(0.9) * 0.2 * exp(-pow((R.y + 0.55) / 0.1, 2.0));
    vec2 cell = floor(vec2(vS, u * vR) / 1.35) + vec2(vK * 31.0, 0.0);          // fine glitter in the enamel
    float h = hash(cell);
    body += mix(candy, vec3(1.0), 0.6) * smoothstep(0.955, 1.0, h) * (0.45 + 0.55 * sin(uTime * 2.1 + h * 60.0)) * (0.4 + diff) * 1.7;
    col = mix(metal, body, vLit);
  }
  float aa = 1.4 / max(vR * uDpr, 1.0);
  float a = smoothstep(1.0, 1.0 - aa * 2.0, abs(vU));
  gl_FragDepth = 0.5 + 0.5 * clamp(-(vZ + vR * c) / 80.0, -1.0, 1.0);
  o = vec4(col * a, a);
}`;

// Sparks and the new orb share one quad shader: a sprite at a point, drawn as a spark or as the orb.
const QUAD_VS = `#version 300 es
in vec2 aQ;
uniform vec2 uRes; uniform vec3 uAt; // centre (px) and half-size (px)
out vec2 vQ;
void main() { vQ = aQ; vec2 p = uAt.xy + aQ * uAt.z; gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0); }`;

const SPARK_FS = `#version 300 es
precision highp float;
in vec2 vQ; uniform vec4 uCol; out vec4 o;
void main() {
  float r = length(vQ);
  float a = (exp(-r * r * 9.0) * 0.55 + smoothstep(0.16, 0.0, r) * 1.2) * uCol.a;
  o = vec4(mix(uCol.rgb, vec3(1.0), smoothstep(0.2, 0.0, r) * 0.6) * a, a * 0.5);
}`;

// The new orb, the logo's: teal over the ink band over red, rolled as the mark is, with its grain, a
// halo, and a thin gold orbit round it, behind it at the top and over it at the bottom.
const ORB_FS = `#version 300 es
precision highp float;
in vec2 vQ; uniform float uS; uniform float uPulse; uniform float uTime; out vec4 o;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main() {
  vec2 q = vQ * uS;                                           // in orb radii; y up
  q.y = -q.y;
  float r = length(q);
  vec3 col = vec3(0.0); float a = 0.0;
  // the halo: red below, a little teal above
  float side = clamp(q.y / max(r, 1e-3), -1.0, 1.0);
  vec3 hc = mix(vec3(0.84, 0.17, 0.2), vec3(0.0, 0.58, 0.63), smoothstep(-0.6, 0.6, side));
  float halo = r > 1.0 ? exp(-(r - 1.0) * 5.0) * (0.35 + 0.5 * uPulse) : 0.0;
  col += hc * halo; a += halo * 0.6;
  // the orbit, a gold ellipse
  vec2 e = vec2(q.x, q.y / 0.3);
  float d = abs(length(e) - 1.75) * 0.3;
  float ring = smoothstep(0.035, 0.0, d);
  bool behind = q.y > 0.0 && r < 1.0;
  // the orb
  if (r < 1.0) {
    vec3 n = vec3(q, sqrt(1.0 - r * r));
    vec3 pole = normalize(vec3(-0.36, 0.86, 0.36));
    float g = (hash(floor(gl_FragCoord.xy)) - 0.5) * 0.18;
    float lat = dot(n, pole) + g;
    float tealW = smoothstep(0.25, 0.75, lat), redW = smoothstep(-0.05, -0.5, lat);
    float lit = max(dot(n, normalize(vec3(-0.5, 0.6, 0.65))), 0.0);
    vec3 c = vec3(0.0, 0.03, 0.04) + vec3(0.04, 0.84, 0.82) * tealW * (0.35 + 0.75 * lit) + vec3(0.98, 0.16, 0.11) * redW * (0.45 + 0.6 * (1.0 - lit));
    c += vec3(1.0) * pow(max(dot(n, normalize(vec3(-0.4, 0.5, 1.0))), 0.0), 40.0) * 0.25;
    c *= 1.0 + uPulse * 0.35;
    float edge = smoothstep(1.0, 0.97, r);
    col = mix(col, c, edge); a = mix(a, 1.0, edge);
  }
  if (ring > 0.0 && !behind) {
    float sh = 0.55 + 0.45 * sin(atan(e.y, e.x) * 1.0 + 2.2) + 0.5 * exp(-pow((q.x + 1.0) / 0.4, 2.0));
    vec3 gc = vec3(0.86, 0.64, 0.32) * sh + vec3(1.0, 0.93, 0.76) * pow(max(sh - 0.8, 0.0), 2.0) * 3.0;
    col = mix(col, gc, ring); a = max(a, ring);
  }
  o = vec4(col, a);
}`;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
  const U: Record<string, WebGLUniformLocation | null> = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(p, i)!; U[u.name] = gl.getUniformLocation(p, u.name); }
  return { p, U };
}

interface Anchors {
  spineX: number; storyEnd: number; vh: number; vw: number;
  fan: { top: number; gemY: number; out: number; end: number; gems: number[] } | null;
  chapters: { top: number; end: number }[];
  knot: { x: number; y: number; r: number; from: number } | null;
  cta: { l: number; r: number } | null;
}

export function mountWeave(canvas: HTMLCanvasElement, opts: WeaveOptions) {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: true });
  if (!gl) return null;
  let tube, spark, orb;
  try {
    tube = compile(gl, TUBE_VS, TUBE_FS); spark = compile(gl, QUAD_VS, SPARK_FS); orb = compile(gl, QUAD_VS, ORB_FS);
  } catch (e) { console.warn("weave:", e); return null; }
  const root = document.documentElement;
  root.classList.add("has-weave");

  // The ribbons: position, across, (u, z, lit, strand), (radius, page y). 10 floats a vertex.
  const MAXV = 60000;
  const data = new Float32Array(MAXV * 10);
  const vao = gl.createVertexArray()!, buf = gl.createBuffer()!;
  gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
  const attr = (name: string, size: number, off: number) => { const l = gl.getAttribLocation(tube.p, name); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, 40, off * 4); };
  attr("aP", 2, 0); attr("aN", 2, 2); attr("aA", 4, 4); attr("aB", 2, 8);
  const qvao = gl.createVertexArray()!, qbuf = gl.createBuffer()!;
  gl.bindVertexArray(qvao); gl.bindBuffer(gl.ARRAY_BUFFER, qbuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  for (const pr of [spark, orb]) { const l = gl.getAttribLocation(pr.p, "aQ"); if (l >= 0) { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 8, 0); } }
  gl.bindVertexArray(null);

  /* where everything is, from the page */
  const pageBox = (el: Element | null) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height }; };
  const measure = (): Anchors => {
    const vw = innerWidth, vh = innerHeight;
    const wrap = document.querySelector("#what .rp-wrap");
    let textLeft = 60;
    if (wrap) { const r = wrap.getBoundingClientRect(); textLeft = r.left + parseFloat(getComputedStyle(wrap).paddingLeft); }
    const spineX = textLeft - Math.min(textLeft * 0.5, 64);
    const story = pageBox(document.getElementById("top"));
    const storyEnd = story ? story.y + story.h : 0;
    // The fan: only when the three labels sit side by side.
    let fan: Anchors["fan"] = null;
    const fanEl = pageBox(document.querySelector("[data-fan]"));
    const gems = [...document.querySelectorAll(".hm-strands .gem")].map((g) => pageBox(g)!).filter(Boolean);
    const list = pageBox(document.querySelector(".hm-strands"));
    const learn = pageBox(document.getElementById("learn"));
    if (fanEl && gems.length === 3 && list && learn && Math.abs(gems[0].y - gems[2].y) < 20) {
      const gemY = gems[0].y + gems[0].h / 2;
      fan = { top: fanEl.y, gemY, out: list.y + list.h + 24, end: learn.y + Math.min(140, (learn.h || 300) * 0.3), gems: gems.map((g) => g.x + g.w / 2) };
    }
    const ids = ["learn", "build", "give", "story"];
    const tops = ids.map((id) => pageBox(document.getElementById(id))?.y ?? NaN);
    const chapters = [0, 1, 2].map((i) => ({ top: tops[i], end: tops[i + 1] }));
    const kn = pageBox(document.querySelector("[data-knot]"));
    const close = pageBox(document.getElementById("start"));
    const knot = kn ? { x: kn.x + kn.w / 2, y: kn.y + kn.h / 2, r: kn.w * 0.2, from: close ? close.y : kn.y - vh * 0.4 } : null;
    const ctaEl = document.querySelector(".hm-beat-cta")?.getBoundingClientRect();
    const cta = ctaEl && ctaEl.width ? { l: ctaEl.left, r: ctaEl.right } : null;
    return { spineX, storyEnd, vh, vw, fan, chapters, knot, cta };
  };
  let A = measure();
  const remeasure = () => { A = measure(); };
  const ro = new ResizeObserver(remeasure); ro.observe(document.body);
  addEventListener("load", remeasure);
  document.fonts?.ready.then(remeasure);

  /* the canvas */
  let dpr = 1, W = 0, H = 0;
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    remeasure();
  };
  size();
  addEventListener("resize", size);

  const t0 = performance.now();
  let raf = 0;
  const frame = () => {
    raf = 0;
    const t = (performance.now() - t0) / 1000;
    const sy = scrollY, vh = H;
    const R0 = clamp(W * 0.0029, 2.7, 4.4), AMP = R0 * 2.3, LAM = R0 * 16;
    // The root: the bottom of the hero's orb (or, without the model, where its poster puts the orb).
    let rt = opts.root();
    if (!rt) rt = { x: W / 2, y: A.storyEnd - vh * 0.38, r: Math.min(W, vh) * 0.14 };
    const rootX = rt.x, rootY = rt.y + rt.r * 0.9, orbR = rt.r;
    // Out of the hero the strands drop straight down, then sweep into the spine before the intro.
    const dropY = Math.max(A.storyEnd + 8, rootY + 40), sweep = clamp(vh * 0.3, 160, 320);
    // Where the hero's own buttons sit under the orb (phones), the strands appear from its bottom edge instead.
    const clipTop = A.cta && A.cta.l < rootX + orbR * 0.6 && A.cta.r > rootX - orbR * 0.6 ? A.storyEnd : -Infinity;
    // In: the strands grow out of the orb as the story ends.
    const grow = opts.still ? 1 : clamp((sy + vh - A.storyEnd) / (vh * 0.65), 0, 1);
    const tip = grow < 1 ? rootY + grow * vh * 1.35 : Infinity;
    const knot = A.knot;
    const endY = knot ? knot.y : Infinity;
    const twist = opts.still ? 0 : sy * 0.35;
    const f = A.fan;

    const lit = (k: number, y: number) => {
      let off = 0;
      A.chapters.forEach((c, i) => { if (Number.isFinite(c.top) && Number.isFinite(c.end) && i !== k) off = Math.max(off, band(y, c.top, c.end, 160)); });
      return 1 - off;
    };
    const lead = (k: number, y: number) => { const c = A.chapters[k]; return c && Number.isFinite(c.top) ? band(y, c.top, c.end, 160) : 0; };
    const fanW = (y: number) => (f ? ease((y - f.top) / Math.max(f.gemY - 14 - f.top, 1)) * (1 - ease((y - f.out) / Math.max(f.end - f.out, 1))) : 0);
    const knotW = (y: number) => (knot ? ease((y - knot.from) / Math.max(knot.y - knot.from, 1)) : 0);
    const swell = (y: number) => A.chapters.reduce((s, c) => s + (Number.isFinite(c.top) ? Math.exp(-(((y - c.top - 60) / 110) ** 2)) : 0), 0);
    const pos = (k: number, y: number) => {
      const sw = ease((y - dropY) / sweep), kw = knotW(y), fw = fanW(y);
      let cx = mix(rootX, A.spineX, sw);
      if (knot) cx = mix(cx, knot.x, kw);
      const amp = AMP * mix(0.35, 1, sw) * ease((y - rootY) / 90) * (1 - fw) * (1 - kw) * (1 + 0.5 * swell(y));
      const th = (TAU * (y - twist)) / LAM + (TAU * k) / 3;
      let x = cx + amp * Math.sin(th) + (k - 1) * orbR * 0.28 * (1 - ease((y - rootY) / Math.max(dropY - rootY, 60)));
      if (f && fw > 0) x = mix(x, f.gems[k], fw);
      if (knot && kw > 0) x = mix(x, knot.x + (k - 1) * knot.r * 0.4 * (1 - kw), kw * kw);
      const z = AMP * 0.85 * (amp / AMP) * Math.sin(2 * th);
      return { x, z };
    };

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const y0 = Math.max(rootY, clipTop, sy - 60), y1 = Math.min(tip, endY, sy + vh + 60);
    const strips: [number, number][] = [];
    let nv = 0;
    if (y1 > y0) {
      for (let k = 0; k < 3; k++) {
        const pts: { x: number; y: number; z: number; l: number; r: number }[] = [];
        let y = y0, px = pos(k, y).x, dy = 1;
        while (y <= y1 && pts.length < MAXV / 6) {
          const p = pos(k, y);
          const slope = Math.abs(p.x - px) / dy;
          const r = R0 * (1 + 0.18 * lead(k, y)) * (y > tip - 40 ? clamp((tip - y) / 40, 0.15, 1) : 1) * (knot && y > knot.y - knot.r * 1.5 ? clamp((knot.y - y) / (knot.r * 1.5), 0.3, 1) : 1);
          pts.push({ x: p.x, y: y - sy, z: p.z, l: lit(k, y), r });
          px = p.x;
          dy = clamp(2.4 / Math.sqrt(1 + slope * slope), 0.3, 3);
          y += dy;
        }
        const start = nv;
        for (let i = 0; i < pts.length; i++) {
          const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)];
          let tx = b.x - a.x, ty = b.y - a.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
          const nx = -ty, ny = tx, p = pts[i];
          for (const side of [-1, 1]) {
            if (nv >= MAXV) break;
            data.set([p.x + nx * p.r * side, p.y + ny * p.r * side, nx, ny, side, p.z, p.l, k, p.r, p.y + sy], nv * 10); nv++;
          }
        }
        strips.push([start, nv - start]);
      }
      gl.useProgram(tube.p);
      gl.uniform2f(tube.U.uRes, W, H); gl.uniform1f(tube.U.uTime, t); gl.uniform1f(tube.U.uDpr, dpr);
      gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, nv * 10);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      for (const [s, n] of strips) if (n > 2) gl.drawArrays(gl.TRIANGLE_STRIP, s, n);
      gl.disable(gl.DEPTH_TEST);

      // Sparks: down the lit strand, faster than the page, drifting a little on their own.
      if (!opts.still) {
        gl.useProgram(spark.p); gl.bindVertexArray(qvao);
        gl.uniform2f(spark.U.uRes, W, H);
        gl.blendFunc(gl.ONE, gl.ONE);
        const glow: [number, number, number][] = [[0.25, 1, 0.92], [1, 0.42, 0.3], [1, 0.8, 0.42]];
        const gap = vh * 0.85, span = gap * 3, drift = sy * 0.6 + t * 26;
        for (let k = 0; k < 3; k++) {
          for (let i = 0; i < 3; i++) {
            const ys = sy - gap * 0.5 + ((((i + k * 0.37) * gap + drift) % span) + span) % span;
            if (ys < y0 || ys > y1 || ys < dropY + sweep) continue;
            const l = lit(k, ys);
            if (l < 0.5) continue;
            const inChapter = A.chapters.some((c) => ys > c.top && ys < c.end);
            if (!inChapter && (k + i) % 2) continue;
            const p = pos(k, ys);
            gl.uniform3f(spark.U.uAt, p.x, ys - sy, R0 * 4.5);
            gl.uniform4f(spark.U.uCol, glow[k][0], glow[k][1], glow[k][2], 0.9 * l);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          }
        }
        // The growing tips glow as they come.
        if (grow > 0 && grow < 1) for (let k = 0; k < 3; k++) {
          const p = pos(k, tip);
          gl.uniform3f(spark.U.uAt, p.x, tip - sy, R0 * 5);
          gl.uniform4f(spark.U.uCol, glow[k][0], glow[k][1], glow[k][2], 1);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }
    }
    // With: the new orb at the knot, once the strands reach it.
    if (knot && knot.y - sy > -knot.r * 4 && knot.y - sy < vh + knot.r * 4 && tip >= knot.y) {
      gl.useProgram(orb.p); gl.bindVertexArray(qvao);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const S = 2.6;
      gl.uniform2f(orb.U.uRes, W, H); gl.uniform3f(orb.U.uAt, knot.x, knot.y - sy, knot.r * S);
      gl.uniform1f(orb.U.uS, S); gl.uniform1f(orb.U.uTime, t);
      gl.uniform1f(orb.U.uPulse, opts.still ? 0.3 : 0.3 + 0.25 * Math.sin(t * 1.3));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    gl.bindVertexArray(null);
    if (!opts.still) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  kick();
  if (opts.still) { addEventListener("scroll", kick, { passive: true }); addEventListener("resize", kick); }
  return {
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener("resize", size); root.classList.remove("has-weave"); },
  };
}

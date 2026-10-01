/* The thread: the three paths joining opens (learn teal, build red, pass it on gold), braided into one
   thread that runs through the model's own world, so the journey down the page is a journey through The Labs.

   It's drawn every frame the model draws (src/scripts/orbnet.ts hands it its camera), on a canvas laid over
   the model's, in the same world:
     in       it stems from the bottom of the orb as you leave the whole-system view;
     through  it reaches into the DC Lab's library (learn), on to a team round its project (build), then
              rises over the commons to the top of the orb (pass it on);
     with     it carries on out to an empty stretch of orbit, where a new Lab is born (the model grows its orb).
   It grows with the page: each scene draws it as far as that scene. In each chapter its own strand is lit and
   the other two drop to bronze, and sparks run along the lit one toward the tip.

   The braid is laid out on screen, round the thread's projected path, so it reads the same at any zoom;
   which strand passes over which is decided by depth, and the thread hides where it passes behind the orb.
   Each strand is shaded as a tube in its material, from the pins (LabsPin.blend): candy enamel (deep at the
   edges, glowing in the core, a clear gloss, fine glitter) or polished gold reflecting a studio's softboxes. */

import type { FrameState } from "./orbnet";

type V3 = [number, number, number];
const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const TAU = Math.PI * 2;

const TUBE_VS = `#version 300 es
in vec2 aP; in vec2 aN; in vec4 aA; in vec3 aB;
uniform vec2 uRes;
out vec2 vN; out float vU; out float vZ; out float vLit; out float vK; out float vR; out float vS; out float vVis;
void main() {
  vN = aN; vU = aA.x; vZ = aA.y; vLit = aA.z; vK = aA.w; vR = aB.x; vS = aB.y; vVis = aB.z;
  gl_Position = vec4(aP.x / uRes.x * 2.0 - 1.0, 1.0 - aP.y / uRes.y * 2.0, 0.0, 1.0);
}`;

const TUBE_FS = `#version 300 es
precision highp float;
in vec2 vN; in float vU; in float vZ; in float vLit; in float vK; in float vR; in float vS; in float vVis;
uniform float uTime; uniform float uDpr;
out vec4 o;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main() {
  float u = clamp(vU, -1.0, 1.0), c = sqrt(max(1.0 - u * u, 0.0));
  vec3 n = normalize(vec3(vN * u, c));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(vec3(-0.55, -0.7, 0.62));
  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(n, normalize(L + V)), 0.0), 70.0);
  float spec2 = pow(max(dot(n, normalize(normalize(vec3(0.65, -0.15, 0.75)) + V)), 0.0), 20.0);
  float fres = pow(1.0 - c, 3.0);
  vec3 R = reflect(-V, n);
  float env = 0.1 + 1.0 * exp(-pow((R.y + 0.55) / 0.2, 2.0)) + 0.5 * exp(-pow((R.x - 0.6) / 0.22, 2.0)) + 0.22 * exp(-pow((R.x + 0.7) / 0.18, 2.0));
  int k = int(vK + 0.5);
  vec3 gold = vec3(0.86, 0.64, 0.32), bronze = vec3(0.17, 0.125, 0.08);
  vec3 col;
  if (k == 2) {
    col = mix(bronze, gold, vLit) * (0.3 * vLit + env) * (0.75 + 0.25 * diff) + mix(vec3(0.42, 0.33, 0.2), vec3(1.0, 0.93, 0.76), vLit) * (spec * 1.4 + spec2 * 0.3);
  } else {
    vec3 candy = k == 0 ? vec3(0.0, 0.6, 0.68) : vec3(0.9, 0.06, 0.08);
    vec3 metal = bronze * env * (0.75 + 0.25 * diff) + vec3(0.42, 0.33, 0.2) * spec * 0.7;
    vec3 body = candy * (0.2 + 0.72 * diff) + candy * 0.6 * c * c * c;
    body += vec3(1.0) * (spec * 1.15 + spec2 * 0.22) + candy * fres * 0.3;
    body += vec3(0.9) * 0.2 * exp(-pow((R.y + 0.55) / 0.1, 2.0));
    float h = hash(floor(vec2(vS, u * vR) / 1.35) + vec2(vK * 31.0, 0.0));
    body += mix(candy, vec3(1.0), 0.6) * smoothstep(0.955, 1.0, h) * (0.45 + 0.55 * sin(uTime * 2.1 + h * 60.0)) * (0.4 + diff) * 1.7;
    col = mix(metal, body, vLit);
  }
  float aa = 1.4 / max(vR * uDpr, 1.0);
  float a = smoothstep(1.0, 1.0 - aa * 2.0, abs(vU)) * vVis;
  gl_FragDepth = 0.5 + 0.5 * clamp(-(vZ + vR * c) / 80.0, -1.0, 1.0);
  o = vec4(col * a, a);
}`;

const SPARK_VS = `#version 300 es
in vec2 aQ;
uniform vec2 uRes; uniform vec3 uAt;
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

const cr = (a: number, b: number, c: number, d: number, t: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
/** How far along the thread (in its control points) each scene draws it: the whole, the paths, learn, build, pass it on, the close. */
const STOPS = [0, 1.55, 2, 3, 5, 7];

export function mountThread(canvas: HTMLCanvasElement, opts: { still?: boolean } = {}) {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: true });
  if (!gl) return null;
  let tube: ReturnType<typeof compile>, spark: ReturnType<typeof compile>;
  try { tube = compile(gl, TUBE_VS, TUBE_FS); spark = compile(gl, SPARK_VS, SPARK_FS); } catch (e) { console.warn("thread:", e); return null; }

  const FL = 11, MAXV = 24000;
  const data = new Float32Array(MAXV * FL);
  const vao = gl.createVertexArray()!, buf = gl.createBuffer()!;
  gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
  const attr = (name: string, size: number, off: number) => { const l = gl.getAttribLocation(tube.p, name); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, FL * 4, off * 4); };
  attr("aP", 2, 0); attr("aN", 2, 2); attr("aA", 4, 4); attr("aB", 3, 8);
  const qvao = gl.createVertexArray()!, qbuf = gl.createBuffer()!;
  gl.bindVertexArray(qvao); gl.bindBuffer(gl.ARRAY_BUFFER, qbuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  { const l = gl.getAttribLocation(spark.p, "aQ"); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 8, 0); }
  gl.bindVertexArray(null);

  let dpr = 1;
  const size = (w: number, h: number) => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
  };

  const draw = (f: FrameState) => {
    const W = f.width, H = f.height;
    size(W, H);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const s = f.s, n = STOPS.length - 1;
    const k0 = Math.min(Math.floor(s), n - 1);
    const uMax = STOPS[k0] + (STOPS[k0 + 1] - STOPS[k0]) * ease(clamp(s - k0, 0, 1));
    if (uMax < 0.02) return;

    // The thread's course through the world: out of the bottom of the orb, down and round to the DC Lab's
    // library, on to the team's project, up over the commons to the top of the orb, and out to a new Lab.
    const { orb, library, pod, dc, newLab } = f.world;
    const dl = Math.hypot(dc[0], dc[2]) || 1, dir: V3 = [dc[0] / dl, 0, dc[2] / dl];
    const nl = Math.hypot(newLab[0], newLab[2]) || 1, ndir: V3 = [newLab[0] / nl, 0, newLab[2] / nl];
    const C: V3[] = [
      [orb[0], orb[1] - 1.02, orb[2]],
      [dir[0] * 1.35, -0.85, dir[2] * 1.35],
      [library[0], library[1] + 0.04, library[2]],
      [pod[0], pod[1] + 0.04, pod[2]],
      [(pod[0] + orb[0]) * 0.5, 1.75, (pod[2] + orb[2]) * 0.5],
      [orb[0], orb[1] + 1.04, orb[2]],
      [ndir[0] * 1.9, 0.95, ndir[2] * 1.9],
      newLab,
    ];
    const at = (u: number): V3 => {
      const i = clamp(Math.floor(u), 0, C.length - 2), t = u - i;
      const a = C[Math.max(i - 1, 0)], b = C[i], c = C[i + 1], d = C[Math.min(i + 2, C.length - 1)];
      return [cr(a[0], b[0], c[0], d[0], t), cr(a[1], b[1], c[1], d[1], t), cr(a[2], b[2], c[2], d[2], t)];
    };
    // The orb, on screen, to hide the thread where it passes behind it.
    const oq = f.project(orb), orbR = f.unit(oq.z) * 0.99;

    // The centre line, projected.
    const pts: { x: number; y: number; z: number; L: number; vis: number; scale: number }[] = [];
    const steps = Math.ceil(uMax * 110);
    let L = 0;
    for (let i = 0; i <= steps; i++) {
      const u = (uMax * i) / steps, q = f.project(at(u));
      if (q.z > -0.5) continue;
      if (pts.length) { const pr = pts[pts.length - 1]; L += Math.hypot(q.x - pr.x, q.y - pr.y); }
      const behind = q.z < oq.z && Math.hypot(q.x - oq.x, q.y - oq.y) < orbR;
      pts.push({ x: q.x, y: q.y, z: q.z, L, vis: behind ? 0 : 1, scale: f.unit(q.z) });
    }
    if (pts.length < 3) return;
    for (let i = 1; i < pts.length - 1; i++) if (pts[i].vis === 0) { pts[i - 1].vis = Math.min(pts[i - 1].vis, 0.5); pts[i + 1].vis = Math.min(pts[i + 1].vis, 0.5); }

    // Which strand leads: the chapter on screen lights its own; elsewhere all three are lit.
    const ch = [f.w[2] ?? 0, f.w[3] ?? 0, f.w[4] ?? 0];
    const lit = [0, 1, 2].map((k) => 1 - Math.max(...ch.filter((_, c) => c !== k)));
    const twist = opts.still ? 0 : f.t * 0.6 + s * 3;
    let nv = 0;
    const strips: [number, number][] = [];
    for (let k = 0; k < 3; k++) {
      const start = nv;
      const sp: { x: number; y: number; z: number; r: number; vis: number; L: number }[] = [];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)];
        let tx = b.x - a.x, ty = b.y - a.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const R0 = clamp(p.scale * 0.016, 1.7, 7);
        const amp = R0 * 2.3 * ease(clamp(p.L / (R0 * 20), 0, 1));
        const th = (TAU * p.L) / (R0 * 16) + (TAU * k) / 3 - twist;
        const tip = clamp((pts[pts.length - 1].L - p.L) / (R0 * 8), 0.15, 1);
        sp.push({ x: p.x - ty * amp * Math.sin(th), y: p.y + tx * amp * Math.sin(th), z: amp * 0.85 * Math.sin(2 * th), r: R0 * (1 + 0.16 * (ch[k] ?? 0)) * tip, vis: p.vis, L: p.L });
      }
      for (let i = 0; i < sp.length; i++) {
        const a = sp[Math.max(i - 1, 0)], b = sp[Math.min(i + 1, sp.length - 1)], p = sp[i];
        let tx = b.x - a.x, ty = b.y - a.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const nx = -ty, ny = tx;
        for (const side of [-1, 1]) {
          if (nv >= MAXV) break;
          data.set([p.x + nx * p.r * side, p.y + ny * p.r * side, nx, ny, side, p.z, lit[k], k, p.r, p.L, p.vis], nv * FL); nv++;
        }
      }
      strips.push([start, nv - start]);
    }
    gl.useProgram(tube.p);
    gl.uniform2f(tube.U.uRes, W, H); gl.uniform1f(tube.U.uTime, f.t); gl.uniform1f(tube.U.uDpr, dpr);
    gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, nv * FL);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    for (const [st, c] of strips) if (c > 2) gl.drawArrays(gl.TRIANGLE_STRIP, st, c);
    gl.disable(gl.DEPTH_TEST);

    // Sparks run along the lit strands toward the tip, and the tip glows while the thread is still growing.
    if (!opts.still) {
      gl.useProgram(spark.p); gl.bindVertexArray(qvao); gl.uniform2f(spark.U.uRes, W, H);
      gl.blendFunc(gl.ONE, gl.ONE);
      const glow: V3[] = [[0.25, 1, 0.92], [1, 0.42, 0.3], [1, 0.8, 0.42]];
      const total = pts[pts.length - 1].L;
      const put = (x: number, y: number, r: number, k: number, a: number) => { gl.uniform3f(spark.U.uAt, x, y, r); gl.uniform4f(spark.U.uCol, glow[k][0], glow[k][1], glow[k][2], a); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
      for (let k = 0; k < 3; k++) {
        if (lit[k] < 0.5) continue;
        for (let i = 0; i < 2; i++) {
          const target = ((f.t * 0.07 + i * 0.5 + k * 0.17) % 1) * total;
          let j = 0; while (j < pts.length - 1 && pts[j].L < target) j++;
          const p = pts[j]; if (!p.vis) continue;
          put(p.x, p.y, clamp(p.scale * 0.05, 8, 22), k, 0.75 * lit[k]);
        }
      }
      const growing = s % 1 > 0.02 && s % 1 < 0.98;
      if (growing) { const e = pts[pts.length - 1]; for (let k = 0; k < 3; k++) put(e.x, e.y, clamp(e.scale * 0.06, 10, 26), k, 0.6); }
    }
    gl.bindVertexArray(null);
  };
  return { draw };
}

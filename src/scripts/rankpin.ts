/* Rank pins in live 3D, for /contributing/.

   The pin itself comes from public/join/pin3d.js (three.js and the pin mesh
   from LabsPin.blend, the same bundle the program page's hero uses). That
   bundle exposes the scene it builds but not three.js, so the rings are made
   with the classes of the objects it hands back: flat metal bands lathed
   around the pin's axis, each a step behind the one before, with a sunray
   (radially brushed) face and a polished chamfer. Their sizes are the
   design's (design/research/recognition-system.md): 3 mm bands from a 15.4 mm
   radius, 0.8 mm steps.

   Brass and silver: pin3d's `inject` hook lets the pin's metal take its
   material colour, so switching metal is a colour change, not a recompile.

   Units are the pin's own: millimetres, face toward +z, back at z = 0, the
   orb centred on the origin. */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Pin3D = {
  renderer: any;
  scene: any;
  camera: any;
  pivot: any;
  setPose(yaw: number, pitch: number): void;
  resize(size: number, dpr: number): void;
  render(): void;
  dispose(): void;
};
type Mount = (canvas: HTMLCanvasElement, opts: Record<string, unknown>) => Promise<Pin3D>;
type RGB = [number, number, number];

export type MetalId = "brass" | "silver";
/** Linear base colours, as in the Blender materials. */
export const METAL: Record<MetalId, RGB> = { brass: [0.887, 0.667, 0.33], silver: [0.74, 0.75, 0.76] };
/** Across, in mm: the pin alone, then with one, two and three rings. */
export const ACROSS = [32, 36.8, 42.8, 48.8];

const R_IN = 15.4, W = 3, T = 0.8, CHAMFER = 0.3, HIDDEN = 1.4, SEG = 192;
/** GLSL added to every pin material through pin3d's `inject` hook. The pin's
    metal (and only its metal: enamel never reaches full metalness) takes the
    material colour. Rings use the same shader; they're marked by a roughness
    uniform above 0.5, which carries their own roughness (+0.5), and the
    metalness uniform (otherwise unused here) carries the strength of the
    brushing. pin3d brushes along the circle around the pin's axis, which
    stretches the highlight around the rings: a sunray finish. */
const INJECT = "if ( pinMetal > 0.99 ) { pinCol = diffuse; if ( roughness > 0.5 ) { pinRough = roughness - 0.5; pinAniso = metalness; } }";

/* ── loading: one script, shared by every view on the page ── */
let loading: Promise<Mount> | null = null;
export function loadPin3D(src: string): Promise<Mount> {
  const w = window as unknown as { LabsPin3D?: { mount: Mount } };
  if (w.LabsPin3D) return Promise.resolve(w.LabsPin3D.mount);
  if (!loading) {
    loading = new Promise<Mount>((resolve, reject) => {
      addEventListener("labspin3d", () => resolve(w.LabsPin3D!.mount), { once: true });
      const sc = document.createElement("script");
      sc.src = src; sc.async = true;
      sc.onerror = () => reject(new Error("pin3d"));
      document.head.append(sc);
    });
  }
  return loading;
}

/** WebGL on a real GPU only (software renderers stall the page); "?pin3d" forces it for testing. */
export function gpuOk(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
    if (new URLSearchParams(location.search).has("pin3d")) return true;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch { return false; }
}

/* ── the rings ── */
type Ring = { mesh: any; f: number; v: number; target: number; delay: number; hidden: number };

/** One band's profile, (radius, z) in mm, walked so each segment's normal (−dz, dr) points out of the metal. */
function profile(i: number): { pts: [number, number][]; face: number } {
  const ro = R_IN + W * (i + 1), zt = -i * T, zb = zt - T;
  const ri = i === 0 ? 13.5 : R_IN + W * i - HIDDEN; // tucked under whatever is in front
  return {
    pts: [[ri, zt], [ro - CHAMFER, zt], [ro, zt - CHAMFER], [ro, zb], [ri, zb], [ri, zt]],
    face: 0, // the first segment (the top) is the brushed face; the rest are polished
  };
}

function buildRing(i: number, C: { Geometry: any; Attr: any }): any {
  const { pts, face } = profile(i);
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  const groups: { start: number; count: number; mat: number }[] = [];
  for (let s = 0; s < pts.length - 1; s++) {
    const [r0, z0] = pts[s], [r1, z1] = pts[s + 1];
    const dr = r1 - r0, dz = z1 - z0, len = Math.hypot(dr, dz) || 1;
    const nr = -dz / len, nz = dr / len;
    const base = pos.length / 3, start = idx.length;
    for (let k = 0; k <= SEG; k++) {
      const a = (k / SEG) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      for (const [r, z] of [[r0, z0], [r1, z1]]) {
        pos.push(r * c, r * sn, z);
        nor.push(nr * c, nr * sn, nz);
        uv.push(r * c * 0.04, r * sn * 0.04); // as pin3d gives the pin's meshes; the shader's tangent frame wants one
      }
    }
    for (let k = 0; k < SEG; k++) {
      const a = base + k * 2, b = a + 2;
      idx.push(a, a + 1, b, a + 1, b + 1, b); // counter-clockwise seen from the side the normal faces
    }
    groups.push({ start, count: idx.length - start, mat: s === face ? 0 : 1 });
  }
  const g = new C.Geometry();
  g.setAttribute("position", new C.Attr(new Float32Array(pos), 3));
  g.setAttribute("normal", new C.Attr(new Float32Array(nor), 3));
  g.setAttribute("uv", new C.Attr(new Float32Array(uv), 2));
  g.setIndex(idx);
  groups.forEach((gr) => g.addGroup(gr.start, gr.count, gr.mat));
  return g;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

export type RankPinOptions = { zoom?: number; metal?: MetalId; rings?: number };

export class RankPin {
  readonly pin: Pin3D;
  private rings: Ring[] = [];
  private metalMats: any[] = [];
  private col: RGB;
  private colFrom: RGB;
  private colTo: RGB;
  private colT = 1;

  constructor(pin: Pin3D, opts: RankPinOptions = {}) {
    this.pin = pin;
    const meshes: any[] = [];
    pin.pivot.traverse((o: any) => { if (o.isMesh) meshes.push(o); });
    const key = (m: any) => String(m.material?.customProgramCacheKey?.() ?? "");
    const polished = meshes.find((m) => key(m).startsWith("pin:polished")) ?? meshes[0];
    const orb = meshes.find((m) => key(m).startsWith("pin:orb")) ?? polished;
    this.metalMats = meshes.filter((m) => /^pin:(polished|satin)/.test(key(m))).map((m) => m.material);
    const holder = polished.parent;
    const C = { Geometry: polished.geometry.constructor, Attr: polished.geometry.attributes.position.constructor };
    const Mesh = polished.constructor, Physical = polished.material.constructor;

    // The rings share the pin's own shader (its studio, its softbox highlight),
    // with their roughness and brushing passed as above. The brushed face
    // reflects the studio without the big metal reflector, as in the Cycles
    // renders, so it shows light and dark rather than a flat white.
    const ringMat = (rough: number, brush: number, env: unknown) => {
      const m = new Physical({ color: 0xffffff, roughness: 0.5 + rough, metalness: brush, anisotropy: brush > 0 ? 1 : 0 });
      m.onBeforeCompile = polished.material.onBeforeCompile;
      m.customProgramCacheKey = polished.material.customProgramCacheKey;
      m.envMap = env;
      return m;
    };
    const faceMat = ringMat(0.2, 0.85, orb.material.envMap);
    const edgeMat = ringMat(0.07, 0, polished.material.envMap);
    this.metalMats.push(faceMat, edgeMat);

    for (let i = 0; i < 3; i++) {
      const mesh = new Mesh(buildRing(i, C), [faceMat, edgeMat]);
      mesh.renderOrder = -1 - i;
      holder.add(mesh);
      const ro = R_IN + W * (i + 1);
      const prevOuter = i === 0 ? 15.2 : R_IN + W * i;
      this.rings.push({ mesh, f: 0, v: 0, target: 0, delay: 0, hidden: (prevOuter - 0.35) / ro });
    }

    this.col = [...METAL[opts.metal ?? "brass"]] as RGB;
    this.colFrom = [...this.col] as RGB; this.colTo = [...this.col] as RGB;
    this.paint();
    if (opts.zoom) this.zoom(opts.zoom);
    this.setRings(opts.rings ?? 0, true);
  }

  /** Pull the camera back along its view, so three rings fit the frame. */
  zoom(k: number): void {
    const cam = this.pin.camera;
    const target = { x: 0.356, y: 0, z: 0.75 }; // pin3d's pivot and camera target
    cam.position.set(target.x + (cam.position.x - target.x) * k, target.y + (cam.position.y - target.y) * k, target.z + (cam.position.z - target.z) * k);
    cam.lookAt(target.x, target.y, target.z);
    cam.updateMatrixWorld();
  }

  /** Metal: a short cross-fade of the colour (instant with reduced motion). */
  setMetal(m: MetalId, instant = false): void {
    this.colFrom = [...this.col] as RGB;
    this.colTo = [...METAL[m]] as RGB;
    this.colT = instant ? 1 : 0;
    if (instant) { this.col = [...this.colTo] as RGB; this.paint(); }
  }

  /** How many rings to show; each springs in or out, one after another. */
  setRings(n: number, instant = false): void {
    const rising = n > this.rings.filter((r) => r.target === 1).length;
    this.rings.forEach((r, i) => {
      const t = i < n ? 1 : 0;
      if (t !== r.target) r.delay = instant ? 0 : 0.07 * (rising ? i : 2 - i);
      r.target = t;
      if (instant) { r.f = t; r.v = 0; }
    });
    this.place();
  }

  /** Scroll-driven: ring progress straight from a number (0..3), no spring. */
  setRingsExact(x: number): void {
    this.rings.forEach((r, i) => { r.f = ease(Math.max(0, Math.min(1, x - i))); r.v = 0; r.target = r.f; });
    this.place();
  }

  /** Advance springs and the colour fade; true while anything is still moving. */
  step(dt: number): boolean {
    let moving = false;
    for (const r of this.rings) {
      if (r.delay > 0) { r.delay -= dt; moving = true; continue; }
      // A soft spring with a little overshoot: the ring lands, settles, stops.
      const k = 160, d = 2 * Math.sqrt(k) * 0.72;
      r.v += ((r.target - r.f) * k - r.v * d) * dt;
      r.f += r.v * dt;
      if (Math.abs(r.target - r.f) + Math.abs(r.v) > 0.0005) moving = true; else { r.f = r.target; r.v = 0; }
    }
    if (this.colT < 1) {
      this.colT = Math.min(1, this.colT + dt / 0.45);
      const t = ease(this.colT);
      this.col = [0, 1, 2].map((j) => lerp(this.colFrom[j], this.colTo[j], t)) as RGB;
      this.paint();
      moving = true;
    }
    this.place();
    return moving;
  }

  private place(): void {
    for (const [i, r] of this.rings.entries()) {
      const f = Math.max(0, r.f), m = r.mesh;
      m.visible = f > 0.001;
      const s = lerp(r.hidden, 1, Math.min(1.04, f));
      m.scale.set(s, s, 1);
      m.position.z = -(1 - Math.min(1, f)) * (1.6 + 0.4 * i);
    }
  }

  private paint(): void {
    for (const mat of this.metalMats) mat.color.setRGB(this.col[0], this.col[1], this.col[2]);
  }
}

/* ── a view: one canvas, its own loop, paused off screen ── */
export type ViewHooks = {
  /** Called every frame with the time step; return true while the view is animating. */
  frame(rp: RankPin, dt: number, now: number): boolean;
};

export async function mountView(src: string, canvas: HTMLCanvasElement, stage: HTMLElement, opts: RankPinOptions, hooks: ViewHooks): Promise<RankPin> {
  const mount = await loadPin3D(src);
  const pin = await mount(canvas, { dpr: 2, inject: INJECT });
  const rp = new RankPin(pin, opts);
  let size = 0, dpr = 1, scale = 1, drawn = false, n = 0, sum = 0, raf = 0, onScreen = true, last = performance.now(), kick = true;
  const tick = (now: number) => {
    if (!onScreen) { raf = 0; return; }
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const cs = Math.round(canvas.clientWidth);
    let dirty = kick; kick = false;
    if (cs && cs !== size) { size = cs; dpr = Math.min(devicePixelRatio || 1, 2, 1400 / size) * scale; pin.resize(size, dpr); dirty = true; }
    const moving = hooks.frame(rp, dt, now);
    if (!(moving || dirty || !drawn)) return;
    pin.render();
    if (!drawn) { drawn = true; stage.classList.add("live"); }
    // Step the resolution down if frames run slow.
    n++; sum += dt;
    if (n >= 40) { if (sum / n > 0.024 && dpr > 1) { scale *= 0.8; size = 0; } n = 0; sum = 0; }
  };
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (onScreen && !raf) { last = performance.now(); kick = true; raf = requestAnimationFrame(tick); }
  }).observe(stage);
  raf = requestAnimationFrame(tick);
  addEventListener("pagehide", () => { cancelAnimationFrame(raf); pin.dispose(); }, { once: true });
  /** Ask for one more frame after a change made outside the hooks. */
  (rp as unknown as { kick: () => void }).kick = () => { kick = true; if (!raf && onScreen) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  return rp;
}

/** Ask a view for a fresh frame (after changing rings or metal from a control). */
export function kick(rp: RankPin): void {
  (rp as unknown as { kick?: () => void }).kick?.();
}

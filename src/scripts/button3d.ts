/* The Ambassador button in live 3D, for the program page's hero.

   It borrows the pin's 3D bundle (public/join/pin3d.js: three.js, the studio
   the pin is lit in, and the renderer) and swaps the pin for the button:
   the pin's meshes are hidden, and the button is lathed from its profile in
   LabsPin.blend ("Button Face" and "Button Back"), scaled from the 1.25"
   model to Sticker Mule's 1.5" button. The art is the button's own print
   file (design/button/ambassador-button-1.5in.png), mapped the way the paper
   is: flat across the dome, then wrapped around the rolled edge to the back.

   The face is laminated photo paper (a glossy clear coat over the print);
   the back is the tin shell. Both are lit by the pin's studio, so the button
   and the pins on the site read as one set.

   Units are millimetres, face toward +z, as in pin3d's scene. */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { loadPin3D, type Pin3D } from "./rankpin";

/** The face's profile from the 1.25" Blender model, centre to tucked edge: radius, height (mm) and the art's u at that point. */
const FACE_125: [number, number, number][] = [
  [0, 4, 0.5], [0.6, 3.998, 0.5129], [1.2, 3.994, 0.5259], [1.8, 3.986, 0.5388], [2.4, 3.975, 0.5518], [3, 3.961, 0.5647],
  [3.6, 3.944, 0.5777], [4.2, 3.923, 0.5906], [4.8, 3.9, 0.6036], [5.4, 3.873, 0.6165], [6, 3.844, 0.6295], [6.6, 3.811, 0.6424],
  [7.2, 3.775, 0.6554], [7.8, 3.736, 0.6684], [8.4, 3.694, 0.6814], [9, 3.648, 0.6943], [9.6, 3.6, 0.7073], [10.2, 3.548, 0.7203],
  [10.8, 3.494, 0.7333], [11.4, 3.436, 0.7463], [12, 3.375, 0.7593], [12.6, 3.311, 0.7723], [13.2, 3.244, 0.7854], [13.8, 3.173, 0.7984],
  [14.4, 3.1, 0.8114], [14.576, 3.088, 0.8152], [14.749, 3.054, 0.8191], [14.917, 2.997, 0.8229], [15.075, 2.919, 0.8267],
  [15.222, 2.821, 0.8305], [15.355, 2.705, 0.8343], [15.471, 2.572, 0.8381], [15.569, 2.425, 0.8419], [15.647, 2.267, 0.8457],
  [15.704, 2.099, 0.8495], [15.738, 1.926, 0.8533], [15.75, 1.75, 0.8571], [15.738, 1.574, 0.8635], [15.704, 1.401, 0.8699],
  [15.647, 1.233, 0.8762], [15.569, 1.075, 0.8826], [15.471, 0.928, 0.889], [15.355, 0.795, 0.8954], [15.222, 0.679, 0.9017],
  [15.075, 0.581, 0.9081], [14.917, 0.503, 0.9145], [14.749, 0.446, 0.9208], [14.2, 0.27, 0.9416], [13.9, 0.22, 0.9526], [13.6, 0.2, 0.9634],
];
/** The tin back, rim to centre (so its normals face out, away from the metal). */
const BACK_125: [number, number][] = [[13.9, 0.22], [13.7, -0.1], [13.2, -0.55], [12.4, -0.8], [6, -0.84], [0, -0.85]];

const SCALE = 1.5 / 1.25; // the 1.25" model, grown to the 1.5" button
const CANVAS_125 = 44.45, CANVAS_15 = 50.8; // the art canvases, mm: 1.75" and 2" squares at 600 dpi
const SEG = 160;
/** Pull the camera back so the button sits in the frame the pin did. */
const ZOOM = 1.2;

/** Lathe a profile around the z axis, with smooth normals; each point is [r, z, texture radius or null]. */
function lathe(C: { Geometry: any; Attr: any }, pts: [number, number, number | null][]): any {
  const n = pts.length, pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let p = 0; p < n; p++) {
    const [r, z, tr] = pts[p];
    const [ra, za] = pts[Math.max(0, p - 1)], [rb, zb] = pts[Math.min(n - 1, p + 1)];
    const tr_ = rb - ra, tz = zb - za, len = Math.hypot(tr_, tz) || 1;
    const nr = -tz / len, nz = tr_ / len; // outward: the metal (or paper) is on the right of the walk
    for (let k = 0; k <= SEG; k++) {
      const a = (k / SEG) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      pos.push(r * c, r * s, z);
      nor.push(nr * c, nr * s, nz);
      const t = tr ?? 0;
      uv.push(0.5 + t * c, 0.5 + t * s);
    }
  }
  const row = SEG + 1;
  for (let p = 0; p < n - 1; p++) {
    for (let k = 0; k < SEG; k++) {
      const a = p * row + k, b = a + 1, a2 = a + row, b2 = a2 + 1;
      idx.push(a, a2, b, a2, b2, b);
    }
  }
  const g = new C.Geometry();
  g.setAttribute("position", new C.Attr(new Float32Array(pos), 3));
  g.setAttribute("normal", new C.Attr(new Float32Array(nor), 3));
  g.setAttribute("uv", new C.Attr(new Float32Array(uv), 2));
  g.setIndex(idx);
  return g;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Mount the button on a canvas. Same interface as pin3d's pin: setPose, resize, render, dispose. */
export async function mountButton(pin3dSrc: string, canvas: HTMLCanvasElement, artSrc: string): Promise<Pin3D> {
  const [mount, art] = await Promise.all([loadPin3D(pin3dSrc), loadImage(artSrc)]);
  const pin = await mount(canvas, { dpr: 2 });

  const meshes: any[] = [];
  pin.pivot.traverse((o: any) => { if (o.isMesh) meshes.push(o); });
  const key = (m: any) => String(m.material?.customProgramCacheKey?.() ?? "");
  const polished = meshes.find((m) => key(m).startsWith("pin:polished")) ?? meshes[0];
  const orb = meshes.find((m) => key(m).startsWith("pin:orb")) ?? polished;
  const holder = polished.parent;
  const C = { Geometry: polished.geometry.constructor, Attr: polished.geometry.attributes.position.constructor };
  const Mesh = polished.constructor, Physical = polished.material.constructor;
  const Texture = orb.material.envMap.constructor; // a plain three.js Texture
  meshes.forEach((m) => { m.visible = false; });

  // The print, as a texture (sRGB, sharp at an angle).
  const map = new Texture(art);
  map.colorSpace = "srgb";
  map.anisotropy = Math.min(8, pin.renderer.capabilities?.getMaxAnisotropy?.() ?? 1);
  map.needsUpdate = true;

  // Face: the art's radius in texture units, from the 1.25" model's u, rescaled to the 1.5" canvas.
  const face = lathe(C, FACE_125.map(([r, z, u]) => [r * SCALE, z * SCALE, ((u - 0.5) * CANVAS_125 * SCALE) / CANVAS_15]));
  const faceMat = new Physical({ map, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08, envMap: orb.material.envMap });
  const back = lathe(C, BACK_125.map(([r, z]) => [r * SCALE, z * SCALE, null]));
  const backMat = new Physical({ color: 0xd4d7da, metalness: 1, roughness: 0.3, envMap: polished.material.envMap });
  // The studio's key light sits where the dome would mirror it straight across
  // the top of the art. Tipping the face's reflections back 30° parks it just
  // past the rim: at rest the art reads clean (as in the Cycles still, where
  // the key casts no reflection on the button), and a soft sheen rises over
  // the top edge when the button tilts up toward the pointer.
  faceMat.envMapRotation.x = (-30 * Math.PI) / 180;
  for (const [g, m] of [[face, faceMat], [back, backMat]] as const) holder.add(new Mesh(g, m));

  // The pin's framing, pulled back along the same view for the larger button.
  const cam = pin.camera, t = { x: 0.356, y: 0, z: 0.75 };
  cam.position.set(t.x + (cam.position.x - t.x) * ZOOM, t.y + (cam.position.y - t.y) * ZOOM, t.z + (cam.position.z - t.z) * ZOOM);
  cam.lookAt(t.x, t.y, t.z);
  cam.updateMatrixWorld();

  const dispose = pin.dispose.bind(pin);
  pin.dispose = () => { face.dispose(); back.dispose(); faceMat.dispose(); backMat.dispose(); map.dispose(); dispose(); };
  // Compile the new materials before the first frame, so it never hitches on screen.
  if (pin.renderer.compileAsync) await pin.renderer.compileAsync(pin.scene, pin.camera);
  return pin;
}

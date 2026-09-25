// One-off: derive web-weight brand assets from the OLOS repo's originals.
// Usage: node scripts/prepare-assets.mjs ../OLOS
import sharp from "sharp";
import path from "node:path";

const olos = process.argv[2] ?? "../OLOS";
const src = (p) => path.join(olos, p);
const out = (p) => path.join("public", p);

// White lockup, for dark surfaces only (nav, footer, dark slides).
await sharp(src("public/assets/logo-lockup-light.png")).trim().resize({ height: 144 }).png({ compressionLevel: 9, palette: true }).toFile(out("assets/logo-lockup-white.png"));
// Partner marks for the title slide's bottom rail.
for (const f of ["dcpl-knockout-logo.png", "superbloom-white.png", "levy-strategic-design-white.png"]) {
  await sharp(src(`public/assets/${f}`)).trim().resize({ height: 96, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true }).toFile(out(`assets/${f}`));
}
// Approved photo, pre-treated: grayscale; the cover tint is layered in CSS.
await sharp(src("public/assets/img_9531.jpg")).grayscale().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 55, mozjpeg: true }).toFile(out("assets/photo-community.jpg"));
// App icons.
for (const s of [192, 512]) {
  await sharp(src("app/icon.png")).resize(s, s).png({ compressionLevel: 9, palette: true }).toFile(out(`icons/icon-${s}.png`));
}
await sharp(src("app/apple-icon.png")).resize(180, 180).png({ compressionLevel: 9 }).toFile(out("icons/apple-touch-icon.png"));
await sharp(src("app/icon.png")).resize(32, 32).png().toFile(out("favicon.png"));
console.log("assets ready");

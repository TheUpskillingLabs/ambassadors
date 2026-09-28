// Portrait crops of the three chapter covers for phones. The landscape 1800w
// files are cropped 2:3 around each cover's focal point (join.json position)
// and written as {id}-p-900.webp and {id}-p-1400.webp. Run: npm run covers
import sharp from "sharp";
import { readFile } from "node:fs/promises";
const join = JSON.parse(await readFile("content/site/join.json", "utf8"));
for (const m of join.mission) {
  const src = `public/join/${m.id}-1800.webp`;
  const meta = await sharp(src).metadata();
  const [fx, fy] = (m.position || "50% 50%").split(" ").map((v) => parseFloat(v) / 100);
  const cropW = Math.round(meta.height * (2 / 3)), cropH = meta.height;
  const left = Math.max(0, Math.min(meta.width - cropW, Math.round(meta.width * fx - cropW / 2)));
  for (const w of [900, 1400]) {
    await sharp(src).extract({ left, top: 0, width: cropW, height: cropH }).resize(w, Math.round(w * 1.5)).webp({ quality: 80 }).toFile(`public/join/${m.id}-p-${w}.webp`);
  }
  console.log(m.id, `crop ${cropW}x${cropH} at ${left}`);
}

// Generates the app icon set (honeycomb mark on a dark square) with no dependencies.
// Usage: node scripts/make-icons.mjs
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

/* ---------------------------------- PNG ---------------------------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const tag = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([tag, data])));
  return Buffer.concat([len, tag, data, crc]);
}

function encodePNG(width, height, rgba) {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* -------------------------------- geometry ------------------------------- */

/** Pointy-top honeycomb: rows of 3 / 4 / 3 hexagons (matches the reference mark). */
function honeycomb(R, cx, cy, compact = false) {
  const w = Math.sqrt(3) * R; // row spacing between neighbours
  const MINI = [
    { count: 2, offset: 0.5, y: 0 },
    { count: 3, offset: 0, y: 1.5 * R },
    { count: 2, offset: 0.5, y: 3 * R },
  ];
  const rows = compact
    ? MINI
    : [
        { count: 3, offset: 0.5, y: 0 },
        { count: 4, offset: 0, y: 1.5 * R },
        { count: 3, offset: 0.5, y: 3 * R },
      ];
  const centres = [];
  for (const row of rows) {
    for (let i = 0; i < row.count; i += 1) {
      centres.push([cx + (row.offset + i) * w, cy + row.y]);
    }
  }
  const clusterW = compact ? 3 * w : 4 * w;
  const clusterH = 5 * R;
  const segments = [];
  for (const [hx, hy] of centres) {
    const pts = [];
    for (let k = 0; k < 6; k += 1) {
      const a = (Math.PI / 3) * k;
      pts.push([hx + R * Math.sin(a), hy - R * Math.cos(a)]);
    }
    for (let k = 0; k < 6; k += 1) {
      const p1 = pts[k];
      const p2 = pts[(k + 1) % 6];
      segments.push([p1[0], p1[1], p2[0], p2[1]]);
    }
  }
  return { segments, clusterW, clusterH };
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  let t = lengthSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const ox = px - (x1 + t * dx);
  const oy = py - (y1 + t * dy);
  return Math.sqrt(ox * ox + oy * oy);
}

/* ------------------------------- rendering ------------------------------- */

const BG = [28, 28, 28];
const LINE = [242, 242, 242];

function render({ size, radiusRatio = 0, fill = 0.7, strokeRatio = 0.015, compact = false }) {
  const radius = size * radiusRatio;
  // cluster silhouette: width 4*sqrt(3)*R, height 5*R
  const R = (size * fill) / ((compact ? 3 : 4) * Math.sqrt(3));
  const clusterW = (compact ? 3 : 4) * Math.sqrt(3) * R;
  const clusterH = 5 * R;
  // widest row (4 hexes) starts half a hex-width left of the cluster centre
  const cx = size / 2 - (clusterW / 2 - 0.866 * R);
  const cy = (size - clusterH) / 2 + R; // row 0 centre (top row spans cy-R .. cy+R)
  const { segments } = honeycomb(R, cx, cy, compact);

  const half = (size * strokeRatio) / 2;
  const rgba = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;

      // rounded-rect background coverage (all icons are dark squares)
      let bgCov = 1;
      if (radius > 0) {
        const hw = size / 2;
        const qx = Math.abs(px - hw) - (hw - radius);
        const qy = Math.abs(py - hw) - (hw - radius);
        const ox = Math.max(qx, 0);
        const oy = Math.max(qy, 0);
        const sd = Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - radius;
        bgCov = Math.min(1, Math.max(0, 0.5 - sd));
      }

      let dist = Infinity;
      for (let s = 0; s < segments.length; s += 1) {
        const seg = segments[s];
        const d = distanceToSegment(px, py, seg[0], seg[1], seg[2], seg[3]);
        if (d < dist) dist = d;
      }
      const lineCov = Math.min(1, Math.max(0, half + 0.5 - dist)) * bgCov;

      const idx = (y * size + x) * 4;
      rgba[idx] = Math.round(BG[0] + (LINE[0] - BG[0]) * lineCov);
      rgba[idx + 1] = Math.round(BG[1] + (LINE[1] - BG[1]) * lineCov);
      rgba[idx + 2] = Math.round(BG[2] + (LINE[2] - BG[2]) * lineCov);
      rgba[idx + 3] = Math.round(bgCov * 255);
    }
  }

  return encodePNG(size, size, rgba);
}

/* ---------------------------------- ICO ---------------------------------- */

function makeIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const dir = [];
  for (const entry of entries) {
    const d = Buffer.alloc(16);
    d[0] = entry.size >= 256 ? 0 : entry.size;
    d[1] = entry.size >= 256 ? 0 : entry.size;
    d[2] = 0;
    d[3] = 0;
    d.writeUInt16LE(1, 4);
    d.writeUInt16LE(32, 6);
    d.writeUInt32LE(entry.data.length, 8);
    d.writeUInt32LE(offset, 12);
    offset += entry.data.length;
    dir.push(d);
  }
  return Buffer.concat([header, ...dir, ...entries.map((e) => e.data)]);
}

/* ---------------------------------- main --------------------------------- */

const publicDir = path.join(process.cwd(), "public", "icons");
const appDir = path.join(process.cwd(), "src", "app");
fs.mkdirSync(publicDir, { recursive: true });

const icon512 = render({ size: 512, radiusRatio: 0.06, fill: 0.72, strokeRatio: 0.015 });
const icon192 = render({ size: 192, radiusRatio: 0.06, fill: 0.72, strokeRatio: 0.02 });
const maskable = render({ size: 512, radiusRatio: 0, fill: 0.5, strokeRatio: 0.018 });
const apple = render({ size: 180, radiusRatio: 0, fill: 0.7, strokeRatio: 0.02 });
const fav32 = render({ size: 32, radiusRatio: 0, fill: 0.72, strokeRatio: 0.062, compact: true });
const fav48 = render({ size: 48, radiusRatio: 0, fill: 0.72, strokeRatio: 0.05, compact: true });
const fav16 = render({ size: 16, radiusRatio: 0, fill: 0.7, strokeRatio: 0.12, compact: true });

fs.writeFileSync(path.join(publicDir, "icon-512.png"), icon512);
fs.writeFileSync(path.join(publicDir, "icon-192.png"), icon192);
fs.writeFileSync(path.join(publicDir, "maskable-512.png"), maskable);
fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), apple);
fs.writeFileSync(path.join(publicDir, "icon-32.png"), fav32);

// Next.js file conventions
fs.writeFileSync(path.join(appDir, "icon.png"), icon512);
fs.writeFileSync(path.join(appDir, "apple-icon.png"), apple);
fs.writeFileSync(
  path.join(appDir, "favicon.ico"),
  makeIco([
    { size: 16, data: fav16 },
    { size: 32, data: fav32 },
    { size: 48, data: fav48 },
  ]),
);

console.log("Wrote icon set:");
for (const file of fs.readdirSync(publicDir)) {
  console.log("  public/icons/" + file, fs.statSync(path.join(publicDir, file)).size + "b");
}
console.log("  src/app/icon.png, src/app/apple-icon.png, src/app/favicon.ico");

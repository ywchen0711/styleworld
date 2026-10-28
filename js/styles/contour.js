// Contour map: the world as a topographic survey. The ground, the stairs and the chimneys are high land, drawn as
// contour lines every few metres with hypsometric tints (green low, brown high), a thicker index line every fifth
// with its height written along it; the air is the low country, faint lines of distant hills; clouds are isobars.
// Everything that moves or can change is a little summit of its own: nested rings closing in on a peak.
import { world, screen, path, isLine, withFlip, decoAt, sceneShapes, groupsOf, TAU } from './paint.js';

const R = 4, STEP = 0.2, STATIC = { ground: 1, stone: 1, chim: 1, chimtop: 1 };
const PAPER = '#f4efe1', LINE = '#9a6432', TINT = ['#c8dfae', '#dbe4ac', '#e8dca0', '#e6c890', '#dcb07e', '#cf9a70', '#c08a68', '#b07a60'];
const PAL = { // per object: tints from the foot to the summit, and the line colour
  hero: [['#f6d2c4', '#f0b4a0', '#e89480', '#de7464'], '#a8302a'], beetle: [['#e0d0ee', '#c8b0e0', '#b090d0', '#9a70c0'], '#5a3a8a'], snail: [['#f4d4e4', '#e8b4d0', '#dc94bc', '#c874a8'], '#7a3a6a'],
  berry: [['#f8c8d8', '#f0a0bc', '#e878a0', '#de5084'], '#a02a52'], coin: [['#f8e8a8', '#f4d878', '#eec850', '#e6b830'], '#a07010'], brick: [['#ecd0b0', '#e4b890', '#dca070', '#d08858'], '#8a4a2a'],
  box: [['#f8e4a0', '#f0d070', '#e8bc48', '#dca830'], '#9a6a10'], boxg: [['#f8e4a0', '#f0d070', '#e8bc48', '#dca830'], '#9a6a10'], gate: [['#f0c8b8', '#e8a898', '#de8878', '#d46858'], '#8a2a22'],
};
let map = null;
function build(L) { // the survey of the land that never changes: a distance field, its contours, its tints, the far hills
  const nx = L.W * R, ny = L.H * R, solid = (x, y) => (y >= L.H ? 1 : y < 0 ? 0 : STATIC[L.grid[y][Math.max(0, Math.min(L.W - 1, x))]?.k] || 0);
  const ins = new Uint8Array(nx * ny); for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) ins[j * nx + i] = solid(Math.floor((i + 0.5) / R), Math.floor((j + 0.5) / R));
  const F = new Float32Array(nx * ny);
  for (const side of [1, 0]) { // chamfer distance from each node to the nearest node of the other kind
    const D = new Float32Array(nx * ny); for (let k = 0; k < nx * ny; k++) D[k] = ins[k] === side ? 1e6 : 0;
    const relax = (i, j, di, dj, w) => { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= ny) return; const k = j * nx + i, q = b * nx + a; if (D[q] + w < D[k]) D[k] = D[q] + w; };
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { relax(i, j, -1, 0, 1); relax(i, j, 0, -1, 1); relax(i, j, -1, -1, 1.414); relax(i, j, 1, -1, 1.414); }
    for (let j = ny - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { relax(i, j, 1, 0, 1); relax(i, j, 0, 1, 1); relax(i, j, 1, 1, 1.414); relax(i, j, -1, 1, 1.414); }
    for (let k = 0; k < nx * ny; k++) if (ins[k] === side) F[k] = (side ? 1 : -1) * (Math.min(D[k], 60) - 0.5) / R;
  }
  const lines = march(F, nx, ny, R, 0, 3.2, STEP, L.W);
  // tints, eight pixels a tile
  const P = 8, tint = document.createElement('canvas'); tint.width = L.W * P; tint.height = L.H * P; const tg = tint.getContext('2d'), im = tg.createImageData(tint.width, tint.height);
  const rgb = TINT.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  for (let py = 0; py < tint.height; py++) for (let px = 0; px < tint.width; px++) {
    const fx = (px + 0.5) / P * R - 0.5, fy = (py + 0.5) / P * R - 0.5, i = Math.max(0, Math.min(nx - 2, Math.floor(fx))), j = Math.max(0, Math.min(ny - 2, Math.floor(fy))), u = Math.min(1, Math.max(0, fx - i)), w = Math.min(1, Math.max(0, fy - j));
    const f = (F[j * nx + i] * (1 - u) + F[j * nx + i + 1] * u) * (1 - w) + (F[(j + 1) * nx + i] * (1 - u) + F[(j + 1) * nx + i + 1] * u) * w;
    if (f < 0) continue; const c = rgb[Math.min(rgb.length - 1, Math.floor(f / (STEP * 2)))], o = (py * tint.width + px) * 4; im.data[o] = c[0]; im.data[o + 1] = c[1]; im.data[o + 2] = c[2]; im.data[o + 3] = 255;
  }
  tg.putImageData(im, 0, 0);
  // the far country behind, at half speed: rolling noise and the hills of the decoration
  const BW = Math.ceil(L.W * 0.5 + 60), bnx = BW * 2, bny = L.H * 2, B = new Float32Array(bnx * bny);
  const hills = L.deco.filter((d) => d.k === 'hill');
  for (let j = 0; j < bny; j++) for (let i = 0; i < bnx; i++) {
    const x = (i + 0.5) / 2, y = (j + 0.5) / 2;
    let h = Math.sin(x * 0.21 + Math.sin(y * 0.3) * 2) * 0.8 + Math.sin(x * 0.07 - y * 0.15) * 1.2 + Math.sin(x * 0.5 + y * 0.6) * 0.25 + (y - 4) * 0.25;
    for (const d of hills) h += d.s * 0.9 * Math.exp(-(((x - d.x) / (d.s * 1.3)) ** 2) - (((y - 12.5) / (d.s * 0.9)) ** 2));
    B[j * bnx + i] = h;
  }
  const far = march(B, bnx, bny, 2, -3, 6, 0.6, BW);
  map = { L, lines, tint, P, far };
}
function march(F, nx, ny, R, lo, hi, step, W) { // marching squares: segments per level, bucketed by tile column
  const out = []; for (let n = 0, lv = lo; lv <= hi + 1e-6; n++, lv = lo + n * step) {
    const index = Math.abs(lv / (step * 5) - Math.round(lv / (step * 5))) < 1e-3, buckets = Array.from({ length: W + 1 }, () => []);
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = F[j * nx + i], b = F[j * nx + i + 1], c = F[(j + 1) * nx + i + 1], d = F[(j + 1) * nx + i];
      const m = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (d > lv ? 1 : 0); if (m === 0 || m === 15) continue;
      const X = (i + 0.5) / R, Y = (j + 0.5) / R, s = 1 / R;
      const T = [X + s * (lv - a) / (b - a), Y], Rt = [X + s, Y + s * (lv - b) / (c - b)], Bt = [X + s * (lv - d) / (c - d), Y + s], Lt = [X, Y + s * (lv - a) / (d - a)];
      const seg = { 1: [[Lt, Bt]], 2: [[Bt, Rt]], 3: [[Lt, Rt]], 4: [[T, Rt]], 5: [[T, Lt], [Bt, Rt]], 6: [[T, Bt]], 7: [[T, Lt]], 8: [[T, Lt]], 9: [[T, Bt]], 10: [[T, Rt], [Lt, Bt]], 11: [[T, Rt]], 12: [[Lt, Rt]], 13: [[Bt, Rt]], 14: [[Lt, Bt]] }[m];
      for (const sg of seg) buckets[Math.min(W, Math.floor(X))].push(sg);
    }
    out.push({ lv, index, buckets });
  }
  return out;
}
function stroke(g, lines, x0, x1, style) { for (const L of lines) { if (style(L) === false) continue; g.beginPath(); for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(L.buckets.length - 1, x1); x++) for (const [p, q] of L.buckets[x]) { g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); } g.stroke(); } }
function summit(g, G, what) { // an object as a little hill: its outline, then rings inside closing on the top
  const [tints, line] = PAL[what] || PAL.brick;
  for (const s of G) withFlip(g, s, () => {
    if (s.kind === 'mortar') return;
    if (isLine(s)) { path(g, s); g.strokeStyle = line; g.lineWidth = 0.05; g.lineCap = 'round'; g.stroke(); return; }
    if (s.part === 'eye' || s.part === 'seam') { path(g, s); g.fillStyle = line; g.fill(); return; }
    const size = s.kind === 'rect' ? Math.min(s.w, s.h) / 2 : s.kind === 'star' ? s.r * 0.45 : s.kind === 'poly' ? 0.12 : Math.min(s.rx, s.ry);
    const n = Math.max(1, Math.min(4, Math.floor(size / 0.07)));
    for (let i = 0; i < n; i++) { const ins = i * size / n; path(g, s, ins); g.fillStyle = tints[Math.min(tints.length - 1, i)]; g.fill(); g.strokeStyle = line; g.lineWidth = i ? 0.018 : 0.035; g.stroke(); }
    if (s.kind === 'ellipse' && s.rx > 0.2) { g.fillStyle = line; g.beginPath(); g.moveTo(s.cx, s.cy - 0.06); g.lineTo(s.cx + 0.05, s.cy + 0.04); g.lineTo(s.cx - 0.05, s.cy + 0.04); g.closePath(); g.fill(); } // the summit mark
  });
}
export const contour = {
  id: 'contour', name: { zh: '等高線世界', en: 'Contour map' },
  draw(g, v) {
    if (!map || map.L !== v.L) build(v.L);
    const cols = v.W / v.ts;
    screen(g); g.fillStyle = PAPER; g.fillRect(0, 0, v.W, v.H);
    // the far country
    world(g, v, 0.5); g.lineWidth = 0.025;
    stroke(g, map.far, v.camX * 0.5 - 1, v.camX * 0.5 + cols + 1, (L) => { g.strokeStyle = L.index ? 'rgba(154,100,50,0.42)' : 'rgba(154,100,50,0.2)'; g.lineWidth = L.index ? 0.04 : 0.02; });
    // the graticule
    world(g, v); g.strokeStyle = 'rgba(60,110,170,0.22)'; g.lineWidth = 0.02; g.font = '0.32px Georgia, serif'; g.fillStyle = 'rgba(60,110,170,0.6)';
    for (let x = Math.floor(v.camX / 5) * 5; x < v.camX + cols + 1; x += 5) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 15); g.stroke(); g.fillText(`${(121 + x / 600).toFixed(3)}°E`, x + 0.1, 14.8); }
    for (let y = 0; y <= 15; y += 5) { g.beginPath(); g.moveTo(v.camX - 1, y); g.lineTo(v.camX + cols + 1, y); g.stroke(); }
    // clouds: isobars, dashed
    world(g, v, 0); g.setLineDash([0.18, 0.1]); g.strokeStyle = 'rgba(40,90,180,0.55)';
    for (const d of v.deco) { const x = decoAt(d, v.camX); if (x < -6 || x > cols + 6) continue;
      if (d.k === 'cloud') { const r = 0.6 + d.s * 0.3; for (let i = 0; i < 3; i++) { g.lineWidth = i ? 0.02 : 0.035; g.beginPath(); g.ellipse(x, d.y, r * 1.8 * (1 - i * 0.3), r * 0.7 * (1 - i * 0.3), 0, 0, TAU); g.stroke(); } g.fillStyle = 'rgba(40,90,180,0.7)'; g.fillText(`${1004 + d.s * 4}`, x - 0.25, d.y + 0.1); }
      else if (d.k === 'bush') { g.setLineDash([]); for (let i = 0; i <= d.s; i++) { const cx = x + (i - d.s / 2) * 0.5; g.fillStyle = 'rgba(90,150,70,0.35)'; g.beginPath(); g.arc(cx, 12.6, 0.22, 0, TAU); g.fill(); g.strokeStyle = 'rgba(70,120,50,0.8)'; g.lineWidth = 0.02; g.stroke(); g.beginPath(); g.moveTo(cx, 12.82); g.lineTo(cx, 13); g.stroke(); } g.setLineDash([0.18, 0.1]); g.strokeStyle = 'rgba(40,90,180,0.55)'; }
    }
    g.setLineDash([]);
    // the land: tints, contours, index lines and their heights
    world(g, v); g.imageSmoothingEnabled = true;
    const sx = Math.max(0, Math.floor(v.camX - 1)), sw = Math.min(v.L.W - sx, Math.ceil(cols + 2));
    g.drawImage(map.tint, sx * map.P, 0, sw * map.P, v.L.H * map.P, sx, 0, sw, v.L.H);
    g.lineCap = 'round';
    stroke(g, map.lines, v.camX - 1, v.camX + cols + 1, (L) => { g.strokeStyle = LINE; g.lineWidth = L.lv === 0 ? 0.055 : L.index ? 0.045 : 0.018; });
    g.font = 'italic 0.3px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const L of map.lines) { if (!L.index || L.lv === 0) continue; for (let x = Math.max(0, Math.floor(v.camX / 9) * 9); x < v.camX + cols && x < L.buckets.length; x += 9) { const sg = L.buckets[x][0]; if (!sg) continue; const [p, q] = sg, mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; let a = Math.atan2(q[1] - p[1], q[0] - p[0]); if (a > Math.PI / 2) a -= Math.PI; if (a < -Math.PI / 2) a += Math.PI; g.save(); g.translate(mx, my); g.rotate(a); g.fillStyle = PAPER; g.fillRect(-0.28, -0.14, 0.56, 0.28); g.fillStyle = LINE; g.fillText(`${Math.round(L.lv * 50)}`, 0, 0.01); g.restore(); } }
    g.textAlign = 'start'; g.textBaseline = 'alphabetic';
    // what moves, and what can change: little hills of their own
    for (const G of groupsOf(sceneShapes(v))) { const w = G[0].what; if (STATIC[w]) continue; summit(g, G, w); }
    for (const p of v.parts) { g.strokeStyle = p.kind === 'shard' ? '#8a4a2a' : LINE; if (p.kind === 'shard') { g.lineWidth = 0.025; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(p.x, p.y, 0.18 - i * 0.06, 0, TAU); g.stroke(); } } else { g.lineWidth = 0.025; g.setLineDash([0.1, 0.08]); g.beginPath(); g.arc(p.x, p.y, 0.5 * (1 - p.life / 0.4) + 0.1, 0, TAU); g.stroke(); g.setLineDash([]); } }
    // the map's furniture: a compass rose, a scale bar
    screen(g); const u = v.ts, cx = v.W - u * 1.4, cy = u * 2.6;
    g.save(); g.translate(cx, cy); g.strokeStyle = LINE; g.fillStyle = LINE; g.lineWidth = Math.max(1, u * 0.03);
    g.beginPath(); g.arc(0, 0, u * 0.7, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, u * 0.55, 0, TAU); g.stroke();
    for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, -u * 0.95); g.lineTo(u * 0.12, 0); g.lineTo(-u * 0.12, 0); g.closePath(); i === 3 ? g.fill() : g.stroke(); }
    g.font = `bold ${u * 0.35}px Georgia, serif`; g.textAlign = 'center'; g.fillText('N', 0, -u * 1.05); g.restore();
    g.fillStyle = LINE; g.font = `${u * 0.3}px Georgia, serif`; const bx = u * 0.6, by = v.H - u * 0.5;
    for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? PAPER : LINE; g.fillRect(bx + i * u, by, u, u * 0.12); } g.strokeStyle = LINE; g.lineWidth = 1; g.strokeRect(bx, by, u * 4, u * 0.12);
    g.fillStyle = LINE; g.fillText('0', bx - u * 0.1, by - u * 0.1); g.fillText('200 m', bx + u * 3.6, by - u * 0.1); g.fillText(`等高距 10 m`, bx + u * 1.3, by - u * 0.1);
  },
};

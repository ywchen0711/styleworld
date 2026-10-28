// Cross-stitch: the whole world embroidered on aida cloth. The scene is drawn flat at the cloth's count (eight
// stitches a tile), each square takes the nearest of a few thread colours and is sewn as an X of two strands;
// the sky is left unstitched, and outlines are backstitched in dark thread. The world moves a whole stitch at a time.
import { path, isLine, withFlip, mortar, decoPath, decoAt, sceneShapes, TAU } from './paint.js';

const SPT = 8; // stitches a tile
const THREAD = {
  grass: '#4aa84a', soil: '#a8703a', brick: '#d0603a', mortar: '#7a3a22', box: '#f0b830', boxused: '#a89070', star: '#fff6d8', stone: '#8a94a8', chimtop: '#3a9ac0', chim: '#2a7aa0',
  body: '#e04848', head: '#f8d0a8', scarf: '#3a6ad0', foot: '#5a3020', legs: '#3a6ad0', leaf: '#5ac05a', stem: '#2a8a3a', eye: '#2a1a24', cheek: '#f08888', hand: '#f8d0a8',
  shell: '#7a48c0', seam: '#3a2070', beetlehead: '#4a2a68', snailbody: '#f8a8c8', berry: '#e83070', shine: '#ffffff', coin: '#f8c830', gatepost: '#c0403a', gatebeam: '#a0302a', lantern: '#f8d040',
  hill: '#a8d890', bush: '#5ab05a', cloud: '#ffffff', puff: '#ffffff',
};
const OUTLINE = '#3a2a30';
const PAL = [...new Set(Object.values(THREAD))], RGB = PAL.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
let lo = null, lg = null, sprites = null, cloth = null, size = '', st = 0, near = new Map();
function nearest(r, gg, b) { const key = (r << 16) | (gg << 8) | b; let k = near.get(key); if (k != null) return k; let best = 1e9; RGB.forEach(([R, G, B], i) => { const d = (R - r) ** 2 + (G - gg) ** 2 + (B - b) ** 2; if (d < best) { best = d; k = i; } }); near.set(key, k); return k; }
function shade(h, k) { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return `rgb(${c.map((x) => Math.round(k > 0 ? x + (255 - x) * k : x * (1 + k))).join(',')})`; }
function setup(v) {
  const key = v.W + 'x' + v.H; if (key === size) return; size = key;
  st = v.H / (15 * SPT); const sz = Math.ceil(st); // a stitch, in pixels (the sprites a pixel bigger so no gaps)
  lo = document.createElement('canvas'); lo.width = Math.ceil(v.W / st) + 2; lo.height = 15 * SPT; lg = lo.getContext('2d', { willReadFrequently: true });
  sprites = PAL.map((h) => { // one X stitch: the under strand, the over strand, a sheen along it
    const c = document.createElement('canvas'); c.width = c.height = sz; const p = c.getContext('2d'), m = sz * 0.14, w = sz * 0.34, st = sz;
    p.lineCap = 'round';
    for (const [a, b, c2, d, col] of [[m, m, st - m, st - m, shade(h, -0.25)], [st - m, m, m, st - m, h]]) { p.strokeStyle = 'rgba(0,0,0,0.25)'; p.lineWidth = w + 1; p.beginPath(); p.moveTo(a, b + 0.6); p.lineTo(c2, d + 0.6); p.stroke(); p.strokeStyle = col; p.lineWidth = w; p.beginPath(); p.moveTo(a, b); p.lineTo(c2, d); p.stroke(); }
    p.strokeStyle = shade(h, 0.35); p.lineWidth = Math.max(1, w * 0.25); p.beginPath(); p.moveTo(st - m - w * 0.2, m + w * 0.1); p.lineTo(m + w * 0.1, st - m - w * 0.2); p.stroke();
    return c;
  });
  cloth = document.createElement('canvas'); cloth.width = cloth.height = sz; const q = cloth.getContext('2d'); // aida: a woven square, a hole at each corner
  q.fillStyle = '#efe6d2'; q.fillRect(0, 0, st, st); q.fillStyle = '#f8f2e4'; q.fillRect(st * 0.18, st * 0.18, st * 0.64, st * 0.64); q.fillStyle = '#cfc2a6'; const hr = Math.max(1, st * 0.14); q.fillRect(0, 0, hr, hr); q.fillRect(st - hr, 0, hr, hr); q.fillRect(0, st - hr, hr, hr); q.fillRect(st - hr, st - hr, hr, hr);
  near = new Map();
}
function flat(g, s) { // a shape in its thread colour, no shading: what the pattern chart would show
  withFlip(g, s, () => {
    const col = THREAD[s.part] || '#888';
    if (s.kind === 'mortar') { mortar(g, s); g.strokeStyle = col; g.lineWidth = 1 / SPT; g.stroke(); return; }
    path(g, s);
    if (isLine(s)) { g.strokeStyle = col; g.lineWidth = 1.2 / SPT; g.stroke(); return; }
    g.fillStyle = s.kind === 'cross' ? THREAD.eye : col; g.fill();
  });
}
export const stitch = {
  id: 'stitch', name: { zh: '十字繡世界', en: 'Cross-stitch' },
  draw(g, v) {
    setup(v);
    const cam = Math.floor(v.camX * SPT) / SPT; // the world moves a stitch at a time
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, lo.width, lo.height);
    lg.setTransform(SPT, 0, 0, SPT, 0, 0); lg.imageSmoothingEnabled = false;
    const cols = lo.width / SPT;
    for (const d of v.deco) { const x = decoAt(d, cam); if (x < -6 || x > cols + 6) continue; decoPath(lg, d, x); lg.fillStyle = THREAD[d.k]; lg.fill(); }
    lg.setTransform(SPT, 0, 0, SPT, -cam * SPT, 0);
    for (const s of sceneShapes(v)) flat(lg, s);
    for (const p of v.parts) { lg.fillStyle = p.kind === 'shard' ? THREAD.brick : THREAD.puff; lg.beginPath(); if (p.kind === 'shard') lg.rect(p.x - 0.17, p.y - 0.17, 0.34, 0.34); else lg.arc(p.x, p.y, 0.45 * (1 - p.life / 0.4) + 0.15, 0, TAU); lg.fill(); }
    // the cloth, then the stitches
    g.setTransform(1, 0, 0, 1, 0, 0); const cp = g.createPattern(cloth, 'repeat'); cp.setTransform(new DOMMatrix().scale(st / Math.ceil(st))); g.fillStyle = cp; g.fillRect(0, 0, v.W, v.H);
    const img = lg.getImageData(0, 0, lo.width, lo.height).data, w = lo.width, h = lo.height, idx = new Int16Array(w * h).fill(-1);
    for (let i = 0; i < w * h; i++) if (img[i * 4 + 3] > 140) idx[i] = nearest(img[i * 4], img[i * 4 + 1], img[i * 4 + 2]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = idx[y * w + x]; if (k >= 0) g.drawImage(sprites[k], Math.floor(x * st), Math.floor(y * st)); }
    // backstitch: dark thread along the edge where a stitched area meets the bare cloth or a very different colour
    g.strokeStyle = OUTLINE; g.lineWidth = Math.max(1, st * 0.16); g.lineCap = 'round'; g.beginPath();
    const lum = (k) => (k < 0 ? -1 : (RGB[k][0] * 0.3 + RGB[k][1] * 0.59 + RGB[k][2] * 0.11) / 255);
    const edge = (a, b) => a !== b && (a < 0 || b < 0 ? a >= 0 && b < 0 ? lum(a) < 0.93 : b >= 0 && lum(b) < 0.93 : Math.abs(lum(a) - lum(b)) > 0.28);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = idx[y * w + x];
      if (x + 1 < w && edge(k, idx[y * w + x + 1]) && y > 0) { g.moveTo((x + 1) * st, y * st); g.lineTo((x + 1) * st, (y + 1) * st); }
      if (y + 1 < h && edge(k, idx[(y + 1) * w + x])) { g.moveTo(x * st, (y + 1) * st); g.lineTo((x + 1) * st, (y + 1) * st); }
    }
    g.stroke();
  },
};

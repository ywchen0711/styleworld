// Risograph: three inks only, fluorescent pink, blue and yellow, each printed as its own layer of halftone dots on
// off-white paper and laid over the others (so pink on blue makes purple, blue on yellow green). The layers never
// quite line up, the ink is uneven, the paper has grain.
import { world, screen, path, isLine, withFlip, mortar, decoPath, decoAt, sceneShapes, hash, TAU } from './paint.js';

const INK = ['#ff48b0', '#0078bf', '#ffe800'], PAPER = '#f2efe6';
// how much of each ink, by part, in quarters: [pink, blue, yellow]
const MIX = {
  grass: [0, 3, 4], soil: [2, 1, 3], brick: [4, 0, 2], mortar: [3, 3, 0], box: [1, 0, 4], boxused: [2, 1, 2], star: [0, 0, 0], stone: [1, 2, 1], chimtop: [0, 4, 3], chim: [0, 3, 2],
  body: [4, 0, 3], head: [1, 0, 1], scarf: [0, 4, 0], foot: [3, 3, 0], legs: [0, 4, 0], leaf: [0, 3, 4], stem: [0, 4, 4], eye: [4, 4, 0], cheek: [3, 0, 0], hand: [1, 0, 1],
  shell: [2, 4, 0], seam: [4, 4, 0], beetlehead: [4, 4, 1], snailbody: [2, 0, 1], berry: [4, 0, 1], shine: [0, 0, 0], coin: [1, 0, 4], gatepost: [4, 0, 2], gatebeam: [4, 1, 2], lantern: [0, 0, 4],
  hill: [0, 2, 2], bush: [0, 3, 3], cloud: [0, 0, 0], sky: [0, 1, 0],
};
const ANG = [0.26, 1.31, 0], OFF = [[0.9, -0.6], [-0.7, 0.5], [0.2, 0.9]];
let layers = null, pats = null, grain = null, size = '', cell = 0;
function setup(v) {
  const key = v.W + 'x' + v.H; if (key === size) return; size = key;
  layers = INK.map(() => { const c = document.createElement('canvas'); c.width = v.W; c.height = v.H; return c; });
  cell = Math.max(3, Math.round(v.ts / 9));
  pats = INK.map((ink) => [0, 1, 2, 3, 4].map((q) => { // a dot screen at a quarter step of coverage
    const c = document.createElement('canvas'); c.width = c.height = cell; const p = c.getContext('2d'); p.fillStyle = ink;
    if (q === 4) p.fillRect(0, 0, cell, cell); else if (q) { const r = cell * Math.sqrt(q / 4 / Math.PI) * 1.05; p.beginPath(); p.arc(cell / 2, cell / 2, r, 0, TAU); p.fill(); }
    return c;
  }));
  grain = document.createElement('canvas'); grain.width = grain.height = 192; const p = grain.getContext('2d');
  for (let i = 0; i < 2600; i++) { p.fillStyle = `rgba(0,0,0,${Math.random() * 0.5})`; p.fillRect(Math.random() * 192, Math.random() * 192, 1 + Math.random() * 1.5, 1 + Math.random()); }
}
// each ink layer gets the same transform; its patterns are pinned to the paper, turned to the ink's screen angle
function frame(cs, v, k) {
  for (let i = 0; i < 3; i++) { const g = cs[i]; world(g, v, k); const inv = g.getTransform().inverse(); for (const q of g.__pats) q.setTransform(inv.multiply(new DOMMatrix().rotate(ANG[i] * 57.3))); }
}
function ink(cs, mix, draw, line = 0) { // lay a shape into each ink: its share of dots, or knock the ink out
  for (let i = 0; i < 3; i++) {
    const g = cs[i], q = mix[i];
    g.globalCompositeOperation = q ? 'source-over' : 'destination-out';
    const st = q ? g.__pats[q] : '#000'; draw(g);
    if (line) { g.strokeStyle = st; g.lineWidth = line; g.lineCap = 'round'; g.stroke(); } else { g.fillStyle = st; g.fill(); }
  }
}
export const riso = {
  id: 'riso', name: { zh: 'Risograph 印刷', en: 'Risograph print' },
  draw(g, v) {
    setup(v);
    const cs = layers.map((c, i) => { const x = c.getContext('2d'); screen(x); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, v.W, v.H); if (!x.__pats) x.__pats = pats[i].map((p) => x.createPattern(p, 'repeat')); return x; });
    const cols = v.W / v.ts;
    // the sky, a pale blue screen; clouds knocked out of it, hills behind
    frame(cs, v, 0);
    ink(cs, MIX.sky, (x) => { x.beginPath(); x.rect(-1, -1, cols + 2, 17); });
    for (const d of v.deco) { const dx = decoAt(d, v.camX); if (dx < -6 || dx > cols + 6) continue; ink(cs, MIX[d.k], (x) => decoPath(x, d, dx)); }
    frame(cs, v, 1);
    for (const s of sceneShapes(v)) {
      const mix = MIX[s.part] || [2, 2, 2];
      if (s.kind === 'mortar') { ink(cs, mix, (x) => mortar(x, s), 0.07); continue; }
      ink(cs, mix, (x) => { if (s.flipY != null) { x.save(); x.translate(0, s.flipY * 2); x.scale(1, -1); path(x, s); x.restore(); } else path(x, s); }, isLine(s) ? 0.08 : 0);
      if (s.kind === 'cross') ink(cs, MIX.eye, (x) => { x.beginPath(); x.moveTo(s.cx - 0.06, s.cy - 0.06); x.lineTo(s.cx + 0.06, s.cy + 0.06); x.moveTo(s.cx + 0.06, s.cy - 0.06); x.lineTo(s.cx - 0.06, s.cy + 0.06); }, 0.05);
    }
    for (const p of v.parts) {
      if (p.kind === 'shard') ink(cs, MIX.brick, (x) => { const c = Math.cos(p.r), s = Math.sin(p.r), r = 0.16; x.beginPath(); x.moveTo(p.x + c * r, p.y + s * r); x.lineTo(p.x - s * r, p.y + c * r); x.lineTo(p.x - c * r, p.y - s * r); x.lineTo(p.x + s * r, p.y - c * r); x.closePath(); });
      else ink(cs, [3, 0, 0], (x) => { x.beginPath(); x.arc(p.x, p.y, 0.5 * (1 - p.life / 0.4) + 0.1, 0, TAU); }, 0.08);
    }
    // the ink is uneven: a few starved patches in each layer
    for (let i = 0; i < 3; i++) { const x = cs[i]; screen(x); x.globalCompositeOperation = 'destination-out'; x.globalAlpha = 0.35; const pt = x.createPattern(grain, 'repeat'); pt.setTransform(new DOMMatrix().translate(i * 61, i * 37).scale(1.5)); x.fillStyle = pt; x.fillRect(0, 0, v.W, v.H); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
    // print: paper, then each ink over it, a little off register
    screen(g); g.fillStyle = PAPER; g.fillRect(0, 0, v.W, v.H);
    const u = v.ts * 0.045;
    g.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 3; i++) g.drawImage(layers[i], OFF[i][0] * u + Math.sin(v.t * 0.7 + i) * u * 0.15, OFF[i][1] * u);
    g.globalAlpha = 0.18; const gp = g.createPattern(grain, 'repeat'); g.fillStyle = gp; g.fillRect(0, 0, v.W, v.H); g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  },
};

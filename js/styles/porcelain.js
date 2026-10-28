// Blue-and-white porcelain (青花瓷): only the white of the porcelain and cobalt blue, the blue in strokes and
// washes, every surface under a glaze that catches the light. The ground has waves along its rim, bricks a key-fret
// border, gift boxes a medallion, chimneys are painted like vases. A struck brick shows the crackle of the glaze
// (冰裂紋), and when it breaks it goes to shards, each with its piece of the painting and its cracks.
import { world, screen, path, isLine, withFlip, decoPath, decoAt, sceneShapes, groupsOf, hash, TAU } from './paint.js';

const W0 = '#f7f8fb', B0 = '#1f3f9e', ink = (a) => `rgba(31,63,158,${a})`;
function glaze(g, s) { // a highlight streaking across the top, a pool of colour at the bottom edge
  g.save(); path(g, s); g.clip();
  const x0 = s.x ?? s.cx - s.rx, y0 = s.y ?? s.cy - s.ry, w = s.w ?? s.rx * 2, h = s.h ?? s.ry * 2;
  const gr = g.createLinearGradient(x0, y0, x0 + w * 0.4, y0 + h); gr.addColorStop(0, 'rgba(255,255,255,0.85)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.0)'); gr.addColorStop(0.85, 'rgba(31,63,158,0.0)'); gr.addColorStop(1, 'rgba(31,63,158,0.12)');
  g.fillStyle = gr; g.fillRect(x0, y0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(x0 + w * 0.28, y0 + h * 0.22, w * 0.12, h * 0.05, -0.6, 0, TAU); g.fill();
  g.restore();
}
function crackle(g, x, y, w, h, seed, k = 1) { // 冰裂紋: a net of fine cracks across the glaze
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.strokeStyle = ink(0.45); g.lineWidth = 0.015;
  const pts = []; for (let i = 0; i < 7 * k; i++) pts.push([x + hash(seed, i) * w, y + hash(seed + 9, i) * h]);
  for (const [px, py] of pts) { g.beginPath(); let cx = px, cy = py; g.moveTo(cx, cy); for (let j = 0; j < 4; j++) { const a = hash(px * 13 + j, py * 7) * TAU; cx += Math.cos(a) * 0.22; cy += Math.sin(a) * 0.22; g.lineTo(cx, cy); } g.stroke(); }
  g.restore();
}
function waves(g, x, y, w) { g.strokeStyle = B0; g.lineWidth = 0.035; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x + 0.125 + i * 0.25, y + 0.2, 0.12, Math.PI, 0); g.stroke(); g.beginPath(); g.arc(x + 0.125 + i * 0.25, y + 0.2, 0.06, Math.PI, 0); g.stroke(); } }
function fret(g, x, y, w, h) { g.strokeStyle = B0; g.lineWidth = 0.03; g.strokeRect(x + 0.07, y + 0.07, w - 0.14, h - 0.14); for (let i = 0; i < 4; i++) { const px = x + 0.18 + i * 0.2; g.beginPath(); g.moveTo(px, y + 0.18); g.lineTo(px + 0.1, y + 0.18); g.lineTo(px + 0.1, y + 0.26); g.lineTo(px + 0.04, y + 0.26); g.stroke(); } g.beginPath(); g.ellipse(x + 0.5, y + 0.62, 0.16, 0.12, 0, 0, TAU); g.fillStyle = ink(0.55); g.fill(); for (const a of [0, 1.6, 3.2, 4.7]) { g.beginPath(); g.ellipse(x + 0.5 + Math.cos(a) * 0.22, y + 0.62 + Math.sin(a) * 0.15, 0.08, 0.04, a, 0, TAU); g.fill(); } }
function draw1(g, s) { // one shape, painted
  withFlip(g, s, () => {
    if (s.kind === 'mortar') return;
    if (isLine(s)) { path(g, s); g.strokeStyle = B0; g.lineWidth = 0.05; g.lineCap = 'round'; g.stroke(); return; }
    path(g, s);
    const blue = { stone: 1, shell: 1, scarf: 1, eye: 1, beetlehead: 1, legs: 1, gatebeam: 1, foot: 1 }[s.part], wash = { soil: 0.08, body: 0, chim: 0.12, chimtop: 0.2, berry: 0.6, lantern: 0.35, snailbody: 0.25, boxused: 0.18, cheek: 0.3, legs: 1 }[s.part];
    g.fillStyle = blue ? B0 : W0; g.fill(); if (wash) { g.fillStyle = ink(wash); g.fill(); }
    g.save(); path(g, s); g.clip();
    if (s.part === 'grass') { waves(g, s.x, s.y, 1); g.fillStyle = ink(0.12); g.fillRect(s.x, s.y + 0.36, 1, 0.64); g.fillStyle = ink(0.5); for (let i = 0; i < 3; i++) g.fillRect(s.x + 0.15 + i * 0.3, s.y + 0.6 + (i % 2) * 0.15, 0.12, 0.12); }
    if (s.part === 'soil') { g.strokeStyle = ink(0.35); g.lineWidth = 0.02; g.beginPath(); g.moveTo(s.x, s.y + 0.5); g.lineTo(s.x + 0.5, s.y); g.lineTo(s.x + 1, s.y + 0.5); g.lineTo(s.x + 0.5, s.y + 1); g.closePath(); g.stroke(); }
    if (s.part === 'brick') fret(g, s.x, s.y, s.w, s.h);
    if (s.part === 'box' || s.part === 'boxused') { g.strokeStyle = B0; g.lineWidth = 0.04; g.beginPath(); g.arc(s.x + 0.5, s.y + 0.5, 0.38, 0, TAU); g.stroke(); g.lineWidth = 0.02; g.beginPath(); g.arc(s.x + 0.5, s.y + 0.5, 0.3, 0, TAU); g.stroke(); for (const [cx, cy] of [[0.12, 0.12], [0.88, 0.12], [0.12, 0.88], [0.88, 0.88]]) { g.fillStyle = B0; g.beginPath(); g.arc(s.x + cx, s.y + cy, 0.05, 0, TAU); g.fill(); } }
    if (s.part === 'stone') { g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.03; g.strokeRect(s.x + 0.12, s.y + 0.12, 0.76, 0.76); g.beginPath(); g.moveTo(s.x + 0.12, s.y + 0.12); g.lineTo(s.x + 0.88, s.y + 0.88); g.moveTo(s.x + 0.88, s.y + 0.12); g.lineTo(s.x + 0.12, s.y + 0.88); g.stroke(); }
    if (s.part === 'chim' || s.part === 'chimtop') { g.strokeStyle = B0; g.lineWidth = 0.03; for (const dx of [0.2, 0.8]) { g.beginPath(); g.moveTo(s.x + dx, s.y); g.lineTo(s.x + dx, s.y + s.h); g.stroke(); } if (s.part === 'chimtop') { for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(s.x + 0.1 + i * (s.w - 0.2) / 4, s.y + 0.7, 0.09, 0.22, 0, Math.PI, 0); g.fillStyle = ink(0.7); g.fill(); } g.fillStyle = B0; g.fillRect(s.x, s.y + 0.05, s.w, 0.12); } else { g.beginPath(); g.moveTo(s.x + 0.5, s.y); for (let k = 0; k <= 8; k++) g.lineTo(s.x + 0.5 + Math.sin(k * 1.2) * 0.12, s.y + k / 8); g.stroke(); } }
    if (s.part === 'body') { g.strokeStyle = ink(0.7); g.lineWidth = 0.025; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(s.cx, s.cy + s.ry * 0.3, s.rx * (0.3 + i * 0.2), Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } }
    if (s.part === 'shell') { g.fillStyle = W0; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(s.cx + Math.cos(i * 2.4) * s.rx * 0.5, s.cy + Math.sin(i * 2.4) * s.ry * 0.4, 0.05, 0, TAU); g.fill(); } }
    if (s.part === 'coin') { g.fillStyle = B0; g.fillRect(s.cx - s.rx * 0.3, s.cy - 0.07, s.rx * 0.6, 0.14); }
    if (s.part === 'gatepost') { for (let y = s.y; y < s.y + s.h; y += 0.5) { g.fillStyle = ink(0.6); g.fillRect(s.x, y, s.w, 0.06); } }
    g.restore();
    path(g, s); g.strokeStyle = B0; g.lineWidth = s.part === 'grass' || s.part === 'soil' ? 0.02 : 0.04; g.stroke();
    if (s.kind === 'cross') { g.strokeStyle = B0; g.lineWidth = 0.04; g.beginPath(); g.moveTo(s.cx - 0.05, s.cy - 0.05); g.lineTo(s.cx + 0.05, s.cy + 0.05); g.moveTo(s.cx + 0.05, s.cy - 0.05); g.lineTo(s.cx - 0.05, s.cy + 0.05); g.stroke(); }
    if (!blue && (s.kind === 'rect' || s.rx > 0.15)) glaze(g, s);
  });
}
function shard(g, p) { // a piece of the broken glaze: white with a scrap of the blue painting, cracked, its edge catching the light
  g.save(); g.translate(p.x, p.y); g.rotate(p.r);
  const poly = () => { g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU, r = 0.17 + hash(p.seed, i) * 0.16; g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.8); } g.closePath(); };
  poly(); g.fillStyle = W0; g.fill();
  g.save(); poly(); g.clip(); g.fillStyle = B0; g.fillRect(-0.4, -0.4 + p.seed * 0.25, 0.8, 0.12); g.fillStyle = ink(0.35); g.fillRect(-0.4, -0.2 + p.seed * 0.25, 0.8, 0.18);
  g.strokeStyle = ink(0.6); g.lineWidth = 0.014; g.beginPath(); g.moveTo(-0.25, 0.08); g.lineTo(0.02, -0.06); g.lineTo(0.28, 0.12); g.moveTo(0.02, -0.06); g.lineTo(0.06, -0.3); g.stroke(); g.restore();
  poly(); g.strokeStyle = B0; g.lineWidth = 0.025; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(-0.06, -0.08, 0.06, 0.025, -0.5, 0, TAU); g.fill();
  g.restore();
}
export const porcelain = {
  id: 'porcelain', name: { zh: '青花瓷世界', en: 'Blue-and-white porcelain' },
  draw(g, v) {
    screen(g); g.fillStyle = W0; g.fillRect(0, 0, v.W, v.H);
    // the painting behind: mountains in washes of cobalt, ruyi clouds, waves below
    const k1 = 0.25; world(g, v, k1); const cols = v.W / v.ts;
    for (const [base, amp, a] of [[8.5, 2.4, 0.1], [10, 1.6, 0.18]]) { g.fillStyle = ink(a); g.beginPath(); g.moveTo(v.camX * k1 - 2, 14); for (let x = v.camX * k1 - 2; x <= v.camX * k1 + cols + 2; x += 0.25) g.lineTo(x, base - amp * Math.abs(Math.sin(x * 0.31 + base)) - amp * 0.4 * Math.sin(x * 0.9)); g.lineTo(v.camX * k1 + cols + 2, 14); g.fill(); }
    world(g, v, 0);
    for (const d of v.deco) { const x = decoAt(d, v.camX); if (x < -6 || x > cols + 6) continue; if (d.k === 'cloud') { g.strokeStyle = ink(0.55); g.lineWidth = 0.05; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x + (i - 1) * 0.7, d.y, 0.35, Math.PI * 0.9, Math.PI * 2.4); g.stroke(); g.beginPath(); g.arc(x + (i - 1) * 0.7 + 0.1, d.y + 0.05, 0.15, 0, TAU); g.stroke(); } } else { decoPath(g, d, x); g.fillStyle = d.k === 'hill' ? ink(0.14) : ink(0.3); g.fill(); g.strokeStyle = ink(0.6); g.lineWidth = 0.03; g.stroke(); } }
    world(g, v);
    const S = sceneShapes(v);
    for (const G of groupsOf(S)) for (const s of G) draw1(g, s);
    // the crackle on what has been struck, and on every used box
    for (const T of v.tiles) if ((T.crack || 0) > 0 || (T.used && (T.k === 'box' || T.k === 'boxg'))) crackle(g, T.x, T.y, 1, 1, T.x * 31 + T.y, Math.min(3, 1 + (T.crack || 0)));
    // the shards of a broken brick: each a piece of the painting, cracked, spinning down
    for (const p of v.parts) {
      if (p.kind === 'shard') shard(g, p);
      else { g.strokeStyle = ink(p.life / 0.4); g.lineWidth = 0.04; g.beginPath(); g.arc(p.x, p.y, 0.5 * (1 - p.life / 0.4) + 0.1, 0, TAU); g.stroke(); }
    }
  },
};

// Sticker world: everything is a die-cut sticker on a page of a notebook: a white margin round each piece, a soft
// shadow under it, a slight tilt, a corner lifting; the hero and the beetles are puffy stickers with a gloss on top.
// A broken brick peels off in sticker scraps that curl as they fall.
import { world, screen, path, isLine, withFlip, mortar, decoPath, decoAt, sceneShapes, groupsOf, hash, TAU } from './paint.js';

const C = { grass: '#5ccf5a', soil: '#c98a4a', brick: '#e8673e', mortar: '#a8401e', box: '#ffc83a', boxused: '#c8a878', star: '#ffffff', stone: '#9aa6b8', chimtop: '#3ab0d8', chim: '#3aa0c8',
  body: '#ff6a6a', head: '#ffd8b0', scarf: '#3a7ae8', foot: '#6a3a2a', legs: '#3a7ae8', leaf: '#3ac86a', stem: '#2a9a4a', eye: '#2a1a2a', cheek: '#ff9a9a', hand: '#ffd8b0',
  shell: '#7a4ac8', seam: '#4a2a8a', beetlehead: '#4a2a6a', legs2: '#2a1a3a', snailbody: '#ffb0d0', berry: '#ff3a7a', shine: '#ffffff', coin: '#ffd23a',
  gatepost: '#c8463a', gatebeam: '#c8463a', lantern: '#ffd23a', hill: '#8ad870', bush: '#4ab84a', cloud: '#ffffff' };
// one sticker: its parts' shadow, a white margin round them all, then the colours
function sticker(g, parts, tilt, cx, cy, margin = 0.07, lift = 0) {
  g.save(); g.translate(cx, cy); g.rotate(tilt); g.translate(-cx, -cy);
  g.save(); g.translate(0.05, 0.07); g.fillStyle = 'rgba(40,30,50,0.22)'; for (const s of parts) withFlip(g, s, () => { path(g, s); if (isLine(s)) { g.lineWidth = 0.1 + margin * 2; g.strokeStyle = g.fillStyle; g.stroke(); } else { g.lineWidth = margin * 2; g.strokeStyle = g.fillStyle; g.fill(); g.stroke(); } }); g.restore();
  g.fillStyle = '#ffffff'; g.strokeStyle = '#ffffff'; g.lineJoin = 'round'; g.lineCap = 'round';
  for (const s of parts) withFlip(g, s, () => { path(g, s); g.lineWidth = margin * 2 + (isLine(s) ? 0.07 : 0); g.stroke(); if (!isLine(s)) g.fill(); });
  for (const s of parts) withFlip(g, s, () => {
    if (s.kind === 'mortar') { mortar(g, s); g.strokeStyle = C.mortar; g.lineWidth = 0.05; g.stroke(); return; }
    path(g, s); const col = C[s.part] || '#888';
    if (isLine(s)) { g.strokeStyle = s.part === 'legs' ? C.legs2 : col; g.lineWidth = 0.07; g.stroke(); return; }
    g.fillStyle = col; g.fill();
    if (s.kind === 'cross') { g.strokeStyle = C.eye; g.lineWidth = 0.04; g.beginPath(); g.moveTo(s.cx - 0.05, s.cy - 0.05); g.lineTo(s.cx + 0.05, s.cy + 0.05); g.moveTo(s.cx + 0.05, s.cy - 0.05); g.lineTo(s.cx - 0.05, s.cy + 0.05); g.stroke(); }
  });
  // the gloss, and a lifting corner
  g.save(); g.globalAlpha = 0.35; g.fillStyle = '#ffffff'; for (const s of parts) if (s.kind === 'ellipse' && s.rx > 0.15) { g.beginPath(); g.ellipse(s.cx - s.rx * 0.35, s.cy - s.ry * 0.45, s.rx * 0.35, s.ry * 0.18, -0.5, 0, TAU); g.fill(); } g.restore();
  if (lift) { const r = parts[0]; if (r.kind === 'rect') { const x = r.x + r.w + margin, y = r.y - margin, k = 0.16 * lift; g.fillStyle = '#e8e4dc'; g.beginPath(); g.moveTo(x - k, y); g.lineTo(x, y + k); g.lineTo(x - k * 0.9, y + k * 0.9); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 0.01; g.stroke(); } }
  g.restore();
}
let paper = null;
function page(g, v) { // a notebook page: cream, blue lines, a red margin, slowly passing
  if (!paper) { paper = document.createElement('canvas'); paper.width = 256; paper.height = 256; const p = paper.getContext('2d'); p.fillStyle = '#fbf7ec'; p.fillRect(0, 0, 256, 256); p.strokeStyle = 'rgba(80,130,220,0.35)'; p.lineWidth = 2; for (let y = 16; y < 256; y += 32) { p.beginPath(); p.moveTo(0, y); p.lineTo(256, y); p.stroke(); } for (let i = 0; i < 900; i++) { p.fillStyle = `rgba(150,120,80,${Math.random() * 0.05})`; p.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); } }
  screen(g); const pat = g.createPattern(paper, 'repeat'); pat.setTransform(new DOMMatrix().translate(-v.camX * v.ts * 0.3, 0).scale(v.ts / 64)); g.fillStyle = pat; g.fillRect(0, 0, v.W, v.H);
  g.strokeStyle = 'rgba(230,80,90,0.5)'; g.lineWidth = 3; const mx = ((-v.camX * v.ts * 0.3) % (v.W * 1.5) + v.W * 1.5) % (v.W * 1.5); g.beginPath(); g.moveTo(mx, 0); g.lineTo(mx, v.H); g.stroke();
}
export const sticker_style = {
  id: 'sticker', name: { zh: '貼紙世界', en: 'Sticker world' },
  draw(g, v) {
    page(g, v);
    // the background stickers: hills and clouds, bushes, each a little crooked
    world(g, v, 0);
    for (const d of v.deco) { const x = decoAt(d, v.camX); if (x < -6 || x > v.W / v.ts + 6) continue; g.save(); const tilt = (hash(d.x) - 0.5) * 0.12; g.translate(x, d.k === 'cloud' ? d.y : 13); g.rotate(tilt); g.translate(-x, d.k === 'cloud' ? -d.y : -13);
      g.fillStyle = 'rgba(40,30,50,0.15)'; g.save(); g.translate(0.06, 0.08); decoPath(g, d, x); g.fill(); g.restore(); decoPath(g, d, x); g.lineWidth = 0.18; g.strokeStyle = '#ffffff'; g.lineJoin = 'round'; g.stroke(); g.fillStyle = C[d.k]; g.fill(); g.restore(); }
    world(g, v);
    const S = sceneShapes(v);
    const groups = groupsOf(S); // each tile one sticker, each creature one
    for (const G of groups) {
      const a = G[0], cx = a.cx ?? (a.x + (a.w || 1) / 2) ?? a.pts[0][0], cy = a.cy ?? (a.y + (a.h || 1) / 2) ?? a.pts[0][1];
      const tile = a.kind === 'rect', tilt = tile ? (a.part === 'grass' || a.part === 'soil' ? 0 : (hash(a.x, a.y) - 0.5) * 0.08) : Math.sin(v.t * 3 + cx) * 0.04;
      sticker(g, G, tilt, cx, cy, tile && (a.part === 'soil' || a.part === 'grass') ? 0.03 : 0.07, tile && hash(a.x, a.y) > 0.8 ? 1 : 0);
    }
    // scraps of a broken brick, curling as they fall
    for (const p of v.parts) { if (p.kind === 'shard') { g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(Math.cos(v.t * 9 + p.seed * 9), 1); g.fillStyle = '#ffffff'; g.fillRect(-0.2, -0.2, 0.4, 0.4); g.fillStyle = C.brick; g.fillRect(-0.15, -0.15, 0.3, 0.3); g.restore(); } else { g.globalAlpha = p.life / 0.4; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(p.x, p.y, 0.4 * (1 - p.life / 0.4) + 0.1, 0, TAU); g.fill(); g.globalAlpha = 1; } }
  },
};

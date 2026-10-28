// Pop-up book: the level is a spread of a children's pop-up book. The far scenery is printed on the standing back
// page; the ground, the blocks and the chimneys are paper cards, with a thickness at the edge and a shadow on the
// page behind; floating blocks stand on folded paper struts. Cards fold up off the page as they come in from the
// right and fold flat again as they leave on the left; the hero and the beetles are cut-outs on pull tabs.
import { world, screen, path, isLine, withFlip, mortar, decoPath, decoAt, sceneShapes, groupsOf, hash, TAU } from './paint.js';

const C = { grass: '#7cbf5a', soil: '#d8a868', brick: '#d8704a', mortar: '#a84a2a', box: '#f2c24a', boxused: '#c8aa80', star: '#fff4d0', stone: '#a8aab8', chimtop: '#58a8c8', chim: '#4a98b8',
  body: '#e8584a', head: '#f8d8b4', scarf: '#3a78c8', foot: '#6a3a2a', legs: '#3a78c8', leaf: '#5ab85a', stem: '#3a8a3a', eye: '#2a1a24', cheek: '#f09a8a', hand: '#f8d8b4',
  shell: '#8a58c0', seam: '#4a2a7a', beetlehead: '#5a3a70', snailbody: '#f4b0c8', berry: '#e83a6a', shine: '#ffffff', coin: '#f4c838', gatepost: '#c84a3a', gatebeam: '#b03a2a', lantern: '#f8d048' };
const EDGE = '#cbb894';
let shadow = null, sg = null, size = '', tex = null;
function setup(v) {
  const key = v.W + 'x' + v.H; if (key === size) return; size = key;
  shadow = document.createElement('canvas'); shadow.width = Math.ceil(v.W / 4); shadow.height = Math.ceil(v.H / 4); sg = shadow.getContext('2d');
  tex = document.createElement('canvas'); tex.width = tex.height = 160; const p = tex.getContext('2d');
  for (let i = 0; i < 1800; i++) { p.fillStyle = Math.random() < 0.5 ? `rgba(255,255,255,${Math.random() * 0.12})` : `rgba(90,60,30,${Math.random() * 0.07})`; p.fillRect(Math.random() * 160, Math.random() * 160, 1 + Math.random() * 3, 1); }
}
// how far up a card stands, from its place on screen: flat off the right edge, up in the middle, flat again at left
const fold = (sx, cols) => Math.max(0, Math.min(1, (cols + 0.5 - sx) / 3.5, (sx + 1.5) / 2.5));
function hinge(g, base, p, f) { g.save(); g.translate(0, base); g.scale(1, Math.max(0.02, p)); g.translate(0, -base); f(); g.restore(); }
function card(g, G, dark) { // a cut-out: its thick edge, its printed face, a thin cut line
  g.lineJoin = 'round'; g.lineCap = 'round';
  for (const s of G) withFlip(g, s, () => { if (s.kind === 'mortar') return; g.save(); g.translate(0.05, 0.05); path(g, s); if (isLine(s)) { g.strokeStyle = EDGE; g.lineWidth = 0.09; g.stroke(); } else { g.fillStyle = EDGE; g.fill(); } g.restore(); });
  for (const s of G) withFlip(g, s, () => {
    if (s.kind === 'mortar') { mortar(g, s); g.strokeStyle = C.mortar; g.lineWidth = 0.04; g.stroke(); return; }
    path(g, s); const col = C[s.part] || '#999';
    if (isLine(s)) { g.strokeStyle = s.part === 'legs' && s.what !== 'hero' ? '#3a2a3a' : col; g.lineWidth = 0.07; g.stroke(); return; }
    g.fillStyle = s.kind === 'cross' ? C.eye : col; g.fill(); g.strokeStyle = 'rgba(60,40,30,0.45)'; g.lineWidth = 0.02; g.stroke();
    if (s.part === 'grass') { g.fillStyle = '#5ea044'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(s.x + i * 0.25, s.y); g.lineTo(s.x + i * 0.25 + 0.12, s.y - 0.14); g.lineTo(s.x + i * 0.25 + 0.25, s.y); g.fill(); } }
    if (s.part === 'soil' || s.part === 'grass') { g.fillStyle = 'rgba(120,80,40,0.25)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(s.x + 0.2 + hash(s.x, i) * 0.6, s.y + 0.4 + hash(s.y, i) * 0.5, 0.05, 0, TAU); g.fill(); } }
  });
  if (dark > 0.01) { g.save(); g.globalAlpha = dark; for (const s of G) withFlip(g, s, () => { if (s.kind === 'mortar') return; path(g, s); if (isLine(s)) { g.strokeStyle = '#3a2a1a'; g.lineWidth = 0.07; g.stroke(); } else { g.fillStyle = '#3a2a1a'; g.fill(); } }); g.restore(); }
}
const box = (G) => { let x0 = 1e9, x1 = -1e9, y1 = -1e9; for (const s of G) { const a = s.x ?? (s.cx != null ? s.cx - (s.rx ?? s.r ?? 0) : Math.min(...s.pts.map((p) => p[0]))), b = s.x != null ? s.x + s.w : s.cx != null ? s.cx + (s.rx ?? s.r ?? 0) : Math.max(...s.pts.map((p) => p[0])), c = s.y != null ? s.y + s.h : s.cy != null ? s.cy + (s.ry ?? s.r ?? 0) : Math.max(...s.pts.map((p) => p[1])); x0 = Math.min(x0, a); x1 = Math.max(x1, b); y1 = Math.max(y1, c); } return { x0, x1, y1 }; };
export const popup = {
  id: 'popup', name: { zh: '立體書', en: 'Pop-up book' },
  draw(g, v) {
    setup(v);
    const cols = v.W / v.ts;
    // the back page, standing: a printed sky, printed hills and clouds, slow parallax
    screen(g); const sky = g.createLinearGradient(0, 0, 0, v.H); sky.addColorStop(0, '#bfe0ea'); sky.addColorStop(0.75, '#f4ecd6'); g.fillStyle = sky; g.fillRect(0, 0, v.W, v.H);
    world(g, v, 0);
    for (const d of v.deco) { const x = decoAt(d, v.camX); if (x < -6 || x > cols + 6) continue; decoPath(g, d, x, 13); g.fillStyle = d.k === 'cloud' ? '#fffaf0' : d.k === 'hill' ? '#a8cf88' : '#84bc68'; g.fill(); g.strokeStyle = 'rgba(80,60,40,0.3)'; g.lineWidth = 0.025; g.stroke(); }
    // the page's gutter: the fold down the middle of the spread
    screen(g); const gx = v.W / 2 - ((v.camX * v.ts * 0.2) % v.W), gut = g.createLinearGradient(gx - v.ts * 1.5, 0, gx + v.ts * 1.5, 0);
    gut.addColorStop(0, 'rgba(90,60,30,0)'); gut.addColorStop(0.5, 'rgba(90,60,30,0.28)'); gut.addColorStop(1, 'rgba(90,60,30,0)'); for (const o of [0, v.W]) { g.save(); g.translate(o, 0); g.fillStyle = gut; g.fillRect(gx - v.ts * 1.5, 0, v.ts * 3, v.H); g.restore(); }
    // the floor page, lying flat under the cards, seen in perspective
    const fy = v.ts * 13.6, fl = g.createLinearGradient(0, fy, 0, v.H); fl.addColorStop(0, '#e2d4b4'); fl.addColorStop(1, '#f4ead4'); g.fillStyle = fl; g.fillRect(0, fy, v.W, v.H - fy);
    g.strokeStyle = 'rgba(120,90,50,0.25)'; g.lineWidth = 1; for (let i = -4; i < cols + 4; i++) { const x = (i - (v.camX % 1)) * v.ts; g.beginPath(); g.moveTo(v.W / 2 + (x - v.W / 2) * 0.82, fy); g.lineTo(x, v.H); g.stroke(); }
    const S = sceneShapes(v), groups = groupsOf(S);
    // each card's fold and its hinge
    const info = groups.map((G) => { const b = box(G), w = G[0].what, tile = /^(ground|brick|box|boxg|stone|chim|chimtop)$/.test(w); const base = tile ? 13 : b.y1; return { G, b, w, tile, base, p: fold((b.x0 + b.x1) / 2 - v.camX, cols) }; });
    // shadows on the back page, soft (drawn small and blown up)
    sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, shadow.width, shadow.height); sg.setTransform(v.ts / 4, 0, 0, v.ts / 4, -v.camX * v.ts / 4, 0); sg.fillStyle = '#000';
    for (const I of info) hinge(sg, I.base, I.p, () => { sg.save(); sg.translate(0.28, -0.12); for (const s of I.G) { if (s.kind === 'mortar' || isLine(s)) continue; withFlip(sg, s, () => { path(sg, s); sg.fill(); }); } sg.restore(); });
    screen(g); g.globalAlpha = 0.2; g.imageSmoothingEnabled = true; g.drawImage(shadow, 0, 0, shadow.width * 4, shadow.height * 4); g.globalAlpha = 1;
    world(g, v);
    // paper struts under floating blocks; pull tabs under the cut-outs
    const struts = [], key = new Set(v.tiles.map((T) => T.x + ',' + T.y)); // a strut under each end of a floating row, and one every few blocks
    for (const T of v.tiles) {
      if (T.k === 'ground' || T.y >= 13 || key.has(T.x + ',' + (T.y + 1))) continue;
      const l = key.has(T.x - 1 + ',' + T.y), r = key.has(T.x + 1 + ',' + T.y); if (l && r && T.x % 3) continue;
      let y1 = T.y + 1; while (y1 < 13 && !v.L.grid[y1][T.x]) y1++;
      struts.push({ x: T.x + (l && !r ? 0.7 : !l && r ? 0.3 : 0.5), y0: T.y + 1, y1, p: fold(T.x + 0.5 - v.camX, cols) });
    }
    for (const t of struts) if (t.p > 0.05) hinge(g, 13, t.p, () => { const { x, y0, y1 } = t; g.fillStyle = '#efe2c4'; g.strokeStyle = 'rgba(90,60,30,0.35)'; g.lineWidth = 0.02; g.beginPath(); g.moveTo(x - 0.1, y0); g.lineTo(x + 0.1, y0); g.lineTo(x + 0.22, y1); g.lineTo(x - 0.22, y1); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); });
    for (const I of info) {
      if (!I.tile && (I.w === 'hero' || I.w === 'beetle' || I.w === 'snail') && v.state !== 'dead') { const x = (I.b.x0 + I.b.x1) / 2; g.fillStyle = '#f2e6cc'; g.strokeStyle = 'rgba(90,60,30,0.4)'; g.lineWidth = 0.02; g.fillRect(x - 0.07, I.b.y1 - 0.1, 0.14, 15 - I.b.y1); g.strokeRect(x - 0.07, I.b.y1 - 0.1, 0.14, 15 - I.b.y1); }
      const sway = I.tile ? 0 : Math.sin(v.t * 4 + I.b.x0) * 0.03;
      hinge(g, I.base, I.p, () => { g.save(); if (sway) { const x = (I.b.x0 + I.b.x1) / 2; g.translate(x, I.base); g.rotate(sway); g.translate(-x, -I.base); } card(g, I.G, (1 - I.p) * 0.45); g.restore(); });
    }
    // scraps of a torn card, and puffs of paper confetti
    for (const p of v.parts) { g.save(); g.translate(p.x, p.y); if (p.kind === 'shard') { g.rotate(p.r); g.scale(Math.cos(v.t * 8 + p.seed * 7), 1); g.fillStyle = EDGE; g.fillRect(-0.16, -0.14, 0.34, 0.32); g.fillStyle = C.brick; g.beginPath(); g.moveTo(-0.18, -0.16); g.lineTo(0.16, -0.12); g.lineTo(0.12, 0.16); g.lineTo(-0.14, 0.12); g.closePath(); g.fill(); } else { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, r = 0.5 * (1 - p.life / 0.4) + 0.1; g.fillStyle = ['#f2c24a', '#e8584a', '#3a78c8'][i % 3]; g.fillRect(Math.cos(a) * r - 0.05, Math.sin(a) * r - 0.05, 0.1, 0.1); } } g.restore(); }
    // paper texture over all
    screen(g); g.fillStyle = g.createPattern(tex, 'repeat'); g.fillRect(0, 0, v.W, v.H);
    const vig = g.createRadialGradient(v.W / 2, v.H / 2, v.H * 0.4, v.W / 2, v.H / 2, v.W * 0.75); vig.addColorStop(0, 'rgba(60,40,20,0)'); vig.addColorStop(1, 'rgba(60,40,20,0.25)'); g.fillStyle = vig; g.fillRect(0, 0, v.W, v.H);
  },
};

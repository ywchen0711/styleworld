// Drawing helpers the styles share: the path of a shape, the world's transform, the background's shapes.
import { sceneShapes, decoAt, groupsOf } from './common.js';
export { sceneShapes, decoAt, groupsOf };
export const TAU = Math.PI * 2;

// put the context in world units (tiles): x from the camera, y down from the top of the course
export function world(g, v, k = 1) { g.setTransform(v.ts, 0, 0, v.ts, -v.camX * k * v.ts, 0); }
export function screen(g) { g.setTransform(1, 0, 0, 1, 0, 0); }

// the path of a shape (filled or stroked by the caller); inset grows or shrinks it
export function path(g, s, inset = 0) {
  g.beginPath();
  if (s.kind === 'rect' || s.kind === 'mortar') { const r = Math.max(0, Math.min(0.12, (s.w - 2 * inset) / 3)); rr(g, s.x + inset, s.y + inset, s.w - 2 * inset, s.h - 2 * inset, r); }
  else if (s.kind === 'ellipse' || s.kind === 'cross') { if (s.rx - inset > 0 && s.ry - inset > 0) g.ellipse(s.cx, s.cy, s.rx - inset, s.ry - inset, s.rot || 0, 0, TAU); }
  else if (s.kind === 'poly') { const c = centroid(s.pts); s.pts.forEach(([x, y], i) => { const dx = x - c[0], dy = y - c[1], l = Math.hypot(dx, dy) || 1, k = Math.max(0, (l - inset) / l); i ? g.lineTo(c[0] + dx * k, c[1] + dy * k) : g.moveTo(c[0] + dx * k, c[1] + dy * k); }); g.closePath(); }
  else if (s.kind === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = (i % 2 ? s.r * 0.45 : s.r) - inset; g.lineTo(s.cx + Math.cos(a) * r, s.cy + Math.sin(a) * r); } g.closePath(); }
  else if (s.kind === 'line') { s.pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); }
  else if (s.kind === 'spiral') { for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU * 1.6 + (s.rot || 0), r = s.r * (1 - i / 46); i ? g.lineTo(s.cx + Math.cos(a) * r, s.cy + Math.sin(a) * r) : g.moveTo(s.cx + Math.cos(a) * r, s.cy + Math.sin(a) * r); } }
}
export function rr(g, x, y, w, h, r) { g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); }
export const centroid = (pts) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
export const isLine = (s) => s.kind === 'line' || s.kind === 'spiral';
// a flipped (knocked-out) creature: turned upside down about a line
export function withFlip(g, s, f) { if (s.flipY == null) return f(); g.save(); g.translate(0, s.flipY * 2); g.scale(1, -1); f(); g.restore(); }
// the mortar lines of a brick, the crack lines of a struck one
export function mortar(g, s) { g.beginPath(); g.moveTo(s.x, s.y + 0.5); g.lineTo(s.x + 1, s.y + 0.5); g.moveTo(s.x + 0.5, s.y); g.lineTo(s.x + 0.5, s.y + 0.5); g.moveTo(s.x + 0.25, s.y + 0.5); g.lineTo(s.x + 0.25, s.y + 1); g.moveTo(s.x + 0.75, s.y + 0.5); g.lineTo(s.x + 0.75, s.y + 1); }
// the background's own shapes, in screen-tile units (already slid by parallax)
export function decoPath(g, d, x, ground = 13) {
  g.beginPath();
  if (d.k === 'hill') { const w = d.s * 1.6, h = d.s * 0.9; g.moveTo(x - w, ground); g.quadraticCurveTo(x - w * 0.5, ground - h * 1.25, x, ground - h); g.quadraticCurveTo(x + w * 0.5, ground - h * 1.25, x + w, ground); g.closePath(); }
  else if (d.k === 'bush') { const w = d.s * 0.55; for (let i = 0; i < d.s + 1; i++) { const cx = x - (d.s * 0.5 - i) * w * 0.9; g.moveTo(cx + w * 0.55, ground); g.arc(cx, ground, w * 0.55, 0, Math.PI, true); } g.closePath(); }
  else if (d.k === 'cloud') { const r = 0.5 + d.s * 0.15; for (const [dx, dy, k] of [[-1, 0.15, 0.8], [0, -0.1, 1], [1, 0.1, 0.85], [0.45, 0.3, 0.7], [-0.5, 0.3, 0.7]]) { g.moveTo(x + dx * r * 1.1 + r * k, d.y + dy * r); g.arc(x + dx * r * 1.1, d.y + dy * r, r * k, 0, TAU); } }
}
export const hash = (a, b = 0) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };

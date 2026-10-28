// What every style draws, as plain shapes with a role: so the six worlds share one cast and one course and each
// only decides how a shape of a given role looks. All in tile units, y down.
//   shapes(view) -> [{ role, depth, kind: 'rect'|'ellipse'|'poly'|'line', ... }]
// The hero, Pip: a round little body, a sprout on the head, a scarf that flies; beetles; snails and their shells;
// the growth berry; coins; gift boxes with a star; bricks; stone; chimneys; hills, bushes, clouds; the gate.
export const rnd = (s) => { let x = Math.floor(s * 1e6) % 2147483647 || 7; return () => ((x = (x * 16807) % 2147483647) / 2147483647); };

export function heroShapes(P, t, state) {
  const out = [], big = P.big, s = big ? 1.35 : 1, f = P.face, x = P.x, foot = P.y, run = P.run, moving = Math.abs(P.vx) > 0.3 && P.onGround;
  const air = !P.onGround && state !== 'dead', ph = run * 2.2, step = moving ? Math.sin(ph) : 0, bob = moving ? Math.abs(Math.cos(ph)) * 0.05 : 0;
  const bodyR = 0.36 * s, cy = foot - (big ? 1.0 : 0.5) - bob, headR = 0.3 * s;
  // feet
  for (const k of [-1, 1]) out.push({ kind: 'ellipse', part: 'foot', cx: x + k * 0.16 * s + (air ? k * 0.08 : step * k * 0.12), cy: foot - 0.07 - (air && k > 0 ? 0.12 : 0), rx: 0.15 * s, ry: 0.08 * s, rot: 0 });
  if (big) out.push({ kind: 'rect', part: 'legs', x: x - 0.22, y: foot - 0.55, w: 0.44, h: 0.45 });
  out.push({ kind: 'ellipse', part: 'body', cx: x, cy, rx: bodyR, ry: bodyR * 1.05, rot: 0 });
  // the scarf, streaming behind
  const sw = Math.sin(t * 9) * 0.06, back = -f;
  out.push({ kind: 'poly', part: 'scarf', pts: [[x - bodyR * 0.8, cy - bodyR * 0.55], [x + bodyR * 0.8, cy - bodyR * 0.55], [x + bodyR * 0.75, cy - bodyR * 0.3], [x - bodyR * 0.75, cy - bodyR * 0.3]] });
  out.push({ kind: 'poly', part: 'scarf', pts: [[x + back * bodyR * 0.6, cy - bodyR * 0.45], [x + back * (bodyR + 0.35 + Math.abs(P.vx) * 0.03), cy - bodyR * 0.35 + sw], [x + back * (bodyR + 0.3), cy - bodyR * 0.1 + sw], [x + back * bodyR * 0.5, cy - bodyR * 0.25]] });
  // the head, the sprout
  const hy = cy - bodyR - headR * 0.75;
  out.push({ kind: 'ellipse', part: 'head', cx: x + f * 0.04, cy: hy, rx: headR, ry: headR * 0.95, rot: 0 });
  out.push({ kind: 'line', part: 'stem', pts: [[x, hy - headR * 0.9], [x - f * 0.02, hy - headR * 1.4]] });
  for (const k of [-1, 1]) out.push({ kind: 'ellipse', part: 'leaf', cx: x + k * 0.13 * s, cy: hy - headR * 1.45 + Math.sin(t * 6 + k) * 0.01, rx: 0.13 * s, ry: 0.06 * s, rot: k * 0.5 });
  // eyes, and the cheek
  const dead = state === 'dead';
  for (const k of [0, 1]) out.push({ kind: dead ? 'cross' : 'ellipse', part: 'eye', cx: x + f * (0.06 + k * 0.14) * s, cy: hy - 0.02, rx: 0.045 * s, ry: 0.07 * s, rot: 0 });
  out.push({ kind: 'ellipse', part: 'cheek', cx: x + f * 0.2 * s, cy: hy + 0.1 * s, rx: 0.06 * s, ry: 0.035 * s, rot: 0 });
  // arms: little mittens swinging (up when it jumps)
  for (const k of [-1, 1]) out.push({ kind: 'ellipse', part: 'hand', cx: x + k * (bodyR + 0.02) + (air ? 0 : -step * k * 0.05 * f), cy: cy + (air ? -bodyR * 0.9 : 0.05), rx: 0.09 * s, ry: 0.09 * s, rot: 0 });
  return out;
}
export function beetleShapes(e, t) {
  const out = [], x = e.x, y = e.y, w = 0.42, flat = e.flat, ph = t * 10 + x;
  if (flat) { out.push({ kind: 'ellipse', part: 'shell', cx: x, cy: y - 0.1, rx: w * 1.2, ry: 0.1, rot: 0 }); return out; }
  for (const k of [-1, 0, 1]) out.push({ kind: 'line', part: 'legs', pts: [[x + k * 0.22, y - 0.25], [x + k * 0.3 + Math.sin(ph + k) * 0.06, y - 0.02]] });
  out.push({ kind: 'ellipse', part: 'shell', cx: x, cy: y - 0.38, rx: w, ry: 0.32, rot: 0 });
  out.push({ kind: 'line', part: 'seam', pts: [[x, y - 0.68], [x, y - 0.1]] });
  const d = Math.sign(e.vx || -1);
  out.push({ kind: 'ellipse', part: 'beetlehead', cx: x + d * 0.38, cy: y - 0.3, rx: 0.17, ry: 0.15, rot: 0 });
  out.push({ kind: 'ellipse', part: 'eye', cx: x + d * 0.44, cy: y - 0.34, rx: 0.035, ry: 0.05, rot: 0 });
  for (const k of [-1, 1]) out.push({ kind: 'line', part: 'legs', pts: [[x + d * 0.46, y - 0.42], [x + d * 0.6, y - 0.6 + k * 0.05]] });
  return out;
}
export function snailShapes(e, t) {
  const out = [], x = e.x, y = e.y, d = Math.sign(e.vx || -1);
  if (!e.shell) out.push({ kind: 'poly', part: 'snailbody', pts: [[x - 0.45, y - 0.02], [x + d * 0.55, y - 0.02], [x + d * 0.55, y - 0.32], [x + d * 0.4, y - 0.4], [x - 0.3, y - 0.12]] });
  if (!e.shell) for (const k of [0, 1]) out.push({ kind: 'line', part: 'legs', pts: [[x + d * (0.45 + k * 0.05), y - 0.35], [x + d * (0.5 + k * 0.1), y - 0.62]] });
  const spin = e.moving ? t * 14 * d : 0;
  out.push({ kind: 'ellipse', part: 'shell', cx: x - (e.shell ? 0 : d * 0.05), cy: y - 0.33, rx: 0.34, ry: 0.32, rot: spin });
  out.push({ kind: 'spiral', part: 'seam', cx: x - (e.shell ? 0 : d * 0.05), cy: y - 0.33, r: 0.24, rot: spin });
  return out;
}
export function berryShapes(e, t) { return [{ kind: 'ellipse', part: 'berry', cx: e.x, cy: e.y - 0.32, rx: 0.32, ry: 0.3, rot: 0 }, { kind: 'ellipse', part: 'leaf', cx: e.x + 0.12, cy: e.y - 0.66, rx: 0.14, ry: 0.06, rot: -0.4 }, { kind: 'ellipse', part: 'shine', cx: e.x - 0.1, cy: e.y - 0.42, rx: 0.07, ry: 0.05, rot: 0 }]; }
export function coinShape(c, t) { const sq = Math.abs(Math.cos(t * 3 + c.x)); return { kind: 'ellipse', part: 'coin', cx: c.x, cy: c.y + Math.sin(t * 3 + c.x) * 0.05, rx: 0.08 + 0.2 * sq, ry: 0.3, rot: 0 }; }

// the course's own pieces: a tile, by kind
export function tileShapes(T) {
  const x = T.x, y = T.y - (T.bump > 0 ? Math.sin(T.bump / 0.2 * Math.PI) * 0.25 : 0), out = [];
  if (T.k === 'ground') { out.push({ kind: 'rect', part: T.n.u ? 'soil' : 'grass', x, y, w: 1, h: 1, top: !T.n.u }); }
  else if (T.k === 'brick') { out.push({ kind: 'rect', part: 'brick', x, y, w: 1, h: 1 }); out.push({ kind: 'mortar', part: 'mortar', x, y, w: 1, h: 1 }); }
  else if (T.k === 'box' || T.k === 'boxg') { out.push({ kind: 'rect', part: T.used ? 'boxused' : 'box', x, y, w: 1, h: 1 }); if (!T.used) out.push({ kind: 'star', part: 'star', cx: x + 0.5, cy: y + 0.5, r: 0.3 }); }
  else if (T.k === 'stone') out.push({ kind: 'rect', part: 'stone', x, y, w: 1, h: 1 });
  else if (T.k === 'chimtop') out.push({ kind: 'rect', part: 'chimtop', x: x - (T.n.l ? 0 : 0.08), y, w: 1 + (T.n.l ? 0 : 0.08) + (T.n.r ? 0 : 0.08), h: 1 });
  else if (T.k === 'chim') out.push({ kind: 'rect', part: 'chim', x, y, w: 1, h: 1 });
  return out;
}
export function gateShapes(L) { const x = L.gate.x, y = L.H - 2; return [{ kind: 'rect', part: 'gatepost', x: x - 1.3, y: y - 4, w: 0.35, h: 5 }, { kind: 'rect', part: 'gatepost', x: x + 0.95, y: y - 4, w: 0.35, h: 5 }, { kind: 'rect', part: 'gatebeam', x: x - 1.7, y: y - 4.4, w: 3.4, h: 0.45 }, { kind: 'rect', part: 'gatebeam', x: x - 1.4, y: y - 3.5, w: 2.8, h: 0.3 }, { kind: 'ellipse', part: 'lantern', cx: x, cy: y - 2.6, rx: 0.35, ry: 0.45, rot: 0 }]; }
// every shape in view, back to front
export function sceneShapes(v) {
  const out = []; let n = 0;
  const put = (list, what) => { const id = n++; for (const s of list) { s.g = id; s.what = what; out.push(s); } };
  put(gateShapes(v.L), 'gate');
  for (const T of v.tiles) put(tileShapes(T), T.k);
  for (const c of v.coins) put([coinShape(c, v.t)], 'coin');
  for (const q of v.pops) put([{ ...coinShape({ x: q.x, y: q.y - q.t * 3 }, v.t * 4), pop: q.t }], 'coin');
  for (const e of v.ents) { if (e.eaten) continue; const sh = e.kind === 'beetle' ? beetleShapes(e, v.t) : e.kind === 'snail' ? snailShapes(e, v.t) : berryShapes(e, v.t); if (e.flip) for (const s of sh) s.flipY = e.y - 0.35; put(sh, e.kind); }
  if (!(v.P.inv > 0 && Math.floor(v.t * 20) % 2)) put(heroShapes(v.P, v.t, v.state), 'hero');
  return out;
}
// shapes gathered by the object they belong to
export function groupsOf(S) { const m = new Map(); for (const s of S) { if (!m.has(s.g)) m.set(s.g, []); m.get(s.g).push(s); } return [...m.values()]; }
// the parallax decoration: hills and bushes slide slower, clouds slower still
export const decoAt = (d, camX) => (d.k === 'cloud' ? d.x - camX * 0.7 : d.k === 'hill' ? d.x - camX * 0.5 : d.x - camX);

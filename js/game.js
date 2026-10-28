// The game: one level, run and jump, the same rules whatever it looks like. Each frame it hands the style a
// description of what is on screen (tiles, the hero, beetles, coins, bits flying) and the style draws it its way.
import { loadLevel } from './level.js';
import { STYLES } from './styles/index.js';
import { sfx } from './sound.js';

const $ = (id) => document.getElementById(id);
const cv = $('cv'), g = cv.getContext('2d');
const VIEW_H = 15; // tiles the screen is tall
let L, P, parts, score, coinsN, state, t, camX, styleI, shake, pops;
const keys = {};

function reset() {
  L = loadLevel(); parts = []; pops = []; score = 0; coinsN = 0; t = 0; shake = 0; state = 'play';
  P = { x: L.start.x, y: L.start.y, vx: 0, vy: 0, w: 0.7, h: 0.9, big: false, face: 1, onGround: false, coyote: 0, buf: 0, inv: 0, dead: 0, run: 0, win: 0 };
  camX = 0;
}
// ---------------------------------------------------------------- tiles
const solid = (k) => k && k !== null;
const at = (x, y) => (y < 0 || y >= L.H || x < 0 || x >= L.W ? null : L.grid[Math.floor(y)]?.[Math.floor(x)]);
function hit(tx, ty) { // the hero's head meets a tile from below
  const c = L.grid[ty]?.[tx]; if (!c) return;
  c.bump = 0.2;
  for (const e of L.ents) if (e.alive && Math.abs(e.x - (tx + 0.5)) < 0.8 && Math.abs(e.y - ty) < 0.3) { e.alive = false; e.flip = true; e.vy = -8; score += 100; sfx('stomp'); }
  if ((c.k === 'box' || c.k === 'boxg') && !c.used) {
    c.used = true; sfx(c.k === 'boxg' ? 'sprout' : 'coin');
    if (c.k === 'boxg') L.ents.push({ kind: 'berry', x: tx + 0.5, y: ty, vx: 1.6, vy: 0, alive: true, w: 0.7, h: 0.7, rise: 0.8 });
    else { coinsN++; score += 200; pops.push({ x: tx + 0.5, y: ty - 0.5, t: 0 }); }
  } else if (c.k === 'brick') {
    if (P.big) { L.grid[ty][tx] = null; sfx('break'); shake = 0.15; score += 50; for (let i = 0; i < 6; i++) parts.push({ kind: 'shard', of: 'brick', x: tx + 0.25 + (i % 3) * 0.25, y: ty + 0.25 + Math.floor(i / 3) * 0.5, vx: (i % 3 - 1) * 3 + (Math.random() - 0.5), vy: -7 - Math.random() * 3, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, life: 1.6, seed: Math.random() }); }
    else { sfx('bump'); c.crack = (c.crack || 0) + 1; } // a small hero only cracks it
  } else sfx('bump');
}
// move a box (the hero or a beetle) through the tiles, one axis at a time
function move(o, dt, onHead) {
  o.x += o.vx * dt; let side = 0;
  for (const y of [o.y - o.h + 0.05, o.y - 0.05]) for (const x of [o.x - o.w / 2, o.x + o.w / 2]) if (solid(at(x, y))) { side = Math.sign(o.vx); if (o.vx > 0) o.x = Math.floor(x) - o.w / 2 - 0.001; else if (o.vx < 0) o.x = Math.floor(x) + 1 + o.w / 2 + 0.001; }
  if (side) o.vx = o.bounce ? -o.vx : 0;
  o.y += o.vy * dt; o.onGround = false;
  if (o.vy > 0) { for (const x of [o.x - o.w / 2 + 0.05, o.x + o.w / 2 - 0.05]) if (solid(at(x, o.y))) { o.y = Math.floor(o.y); o.vy = 0; o.onGround = true; } }
  else if (o.vy < 0) { const hx = []; for (const x of [o.x - o.w / 2 + 0.08, o.x + o.w / 2 - 0.08]) if (solid(at(x, o.y - o.h))) hx.push(Math.floor(x)); if (hx.length) { o.y = Math.floor(o.y - o.h) + 1 + o.h; o.vy = 0; if (onHead) { const ux = [...new Set(hx)].sort((a, b) => Math.abs(a + 0.5 - o.x) - Math.abs(b + 0.5 - o.x))[0]; onHead(ux, Math.floor(o.y - o.h - 0.5)); } } }
  return side;
}

// ---------------------------------------------------------------- one step of the world
const GRAV = 38, RUN = 7.5, WALK = 4.6, ACC = 30, AIR = 18, JUMP = 18;
function step(dt) {
  t += dt; shake = Math.max(0, shake - dt);
  if (state === 'play') {
    const left = keys.ArrowLeft || keys.KeyA || keys.tl, right = keys.ArrowRight || keys.KeyD || keys.tr, fast = keys.ShiftLeft || keys.KeyX || keys.tb || true;
    const want = (right ? 1 : 0) - (left ? 1 : 0), top = fast ? RUN : WALK, a = P.onGround ? ACC : AIR;
    if (want) { P.vx += want * a * dt; P.face = want; } else { const f = (P.onGround ? 26 : 6) * dt; P.vx = Math.abs(P.vx) < f ? 0 : P.vx - Math.sign(P.vx) * f; }
    P.vx = Math.max(-top, Math.min(top, P.vx));
    P.coyote = P.onGround ? 0.1 : P.coyote - dt; P.buf -= dt;
    if (P.buf > 0 && P.coyote > 0) { P.vy = -JUMP - Math.abs(P.vx) * 0.25; P.coyote = 0; P.buf = 0; sfx('jump'); }
    const holding = keys.Space || keys.ArrowUp || keys.KeyW || keys.KeyZ || keys.tj;
    P.vy += GRAV * (P.vy < 0 && !holding ? 2.2 : 1) * dt; P.vy = Math.min(P.vy, 22);
    move(P, dt, hit); P.run += Math.abs(P.vx) * dt; P.inv = Math.max(0, P.inv - dt);
    if (P.x < camX + 0.4) { P.x = camX + 0.4; P.vx = Math.max(0, P.vx); }
    if (P.y > L.H + 2) die();
    // coins in the air
    for (const c of L.coins) if (!c.got && Math.abs(c.x - P.x) < 0.7 && Math.abs(c.y - (P.y - P.h / 2)) < 0.8) { c.got = true; coinsN++; score += 200; sfx('coin'); }
    // the gate
    if (P.x > L.gate.x - 0.3) { state = 'win'; P.win = 0; sfx('win'); score += 1000; }
  } else if (state === 'win') { P.win += dt; P.vx = 0; P.vy += GRAV * dt; move(P, dt); }
  else if (state === 'dead') { P.dead += dt; P.vy += GRAV * 0.7 * dt; P.y += P.vy * dt; if (P.dead > 2.6) reset(); }
  // beetles, snails, berries
  for (const e of L.ents) {
    if (!e.alive) { if (e.flip) { e.vy += GRAV * dt; e.y += e.vy * dt; } else e.squash = (e.squash || 0) + dt; continue; }
    if (Math.abs(e.x - P.x) > 18 && !e.woke) continue; e.woke = true;
    if (e.rise > 0) { e.rise -= dt; e.y -= dt * 1.2; continue; }
    e.bounce = true; e.vy += GRAV * dt; move(e, dt); if (e.y > L.H + 2) e.alive = false;
    // beetles turn back at the edge of a platform? no: like the classics, they walk off
    if (state !== 'play') continue;
    const dx = e.x - P.x, dy = e.y - P.y;
    if (Math.abs(dx) < (e.w + P.w) / 2 && dy > -0.1 - (e.h) && dy < P.h + 0.1) {
      if (e.kind === 'berry') { e.alive = false; e.eaten = true; if (!P.big) { P.big = true; P.h = 1.8; P.y -= 0; } score += 1000; sfx('grow'); continue; }
      if (e.shell && !e.moving) { e.moving = true; e.vx = Math.sign(dx || 1) * 9; sfx('stomp'); P.inv = 0.3; continue; }
      if (P.vy > 0 && P.y - e.y < -0.15 + 0.5) { // from above: a stomp
        if (e.kind === 'snail' && !e.shell) { e.shell = true; e.vx = 0; e.h = 0.6; } else if (e.kind === 'snail') { e.moving = false; e.vx = 0; } else { e.alive = false; e.flat = true; }
        P.vy = -10; score += 100; sfx('stomp'); parts.push({ kind: 'puff', x: e.x, y: e.y - 0.3, life: 0.4 });
      } else if (P.inv <= 0) { if (P.big) { P.big = false; P.h = 0.9; P.inv = 1.6; sfx('shrink'); } else die(); }
    }
    if (e.shell && e.moving) for (const o of L.ents) if (o !== e && o.alive && o.kind !== 'berry' && Math.abs(o.x - e.x) < 0.8 && Math.abs(o.y - e.y) < 0.8) { o.alive = false; o.flip = true; o.vy = -8; score += 200; sfx('stomp'); }
  }
  for (const p of parts) { p.life -= dt; if (p.vx != null) { p.vy += GRAV * 0.8 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += (p.vr || 0) * dt; } }
  parts = parts.filter((p) => p.life > 0);
  for (const q of pops) q.t += dt; pops = pops.filter((q) => q.t < 0.6);
  for (const row of L.grid) for (const c of row) if (c?.bump > 0) c.bump = Math.max(0, c.bump - dt);
  // the camera follows ahead of the hero, never back
  const cols = cv.width / cv.height * VIEW_H, target = P.x - cols * 0.4;
  camX = Math.max(camX, Math.min(L.W - cols, target));
}
function die() { if (state !== 'play') return; state = 'dead'; P.dead = 0; P.vy = -12; sfx('die'); }

// ---------------------------------------------------------------- drawing: the style draws what is in view
function draw() {
  const S = STYLES[styleI], W = cv.width, H = cv.height, ts = H / VIEW_H, cols = Math.ceil(W / ts) + 2;
  const view = {
    t, ts, W, H, camX: camX + (shake > 0 ? (Math.random() - 0.5) * 0.08 : 0), camY: 0, L, P, state,
    tiles: [], ents: L.ents.filter((e) => e.x > camX - 2 && e.x < camX + cols + 2), coins: L.coins.filter((c) => !c.got && c.x > camX - 1 && c.x < camX + cols + 1),
    parts, pops, deco: L.deco.filter((d) => d.x > camX * 0.5 - 10 && d.x < camX + cols + 10), score, coinsN,
  };
  const x0 = Math.floor(camX) - 1;
  for (let y = 0; y < L.H; y++) for (let x = x0; x < x0 + cols + 1; x++) { const c = at(x, y); if (c) view.tiles.push({ x, y, ...c, n: neighbours(x, y) }); }
  S.draw(g, view);
  $('hud').innerHTML = `<b>${S.name.zh}</b> <span>${S.name.en}</span><i>★ ${coinsN}　${String(score).padStart(6, '0')}</i>`;
  if (state === 'win') $('msg').textContent = P.win > 1.2 ? '過關！ Clear!' : ''; else $('msg').textContent = '';
}
function neighbours(x, y) { const k = at(x, y)?.k, same = (a, b) => at(a, b)?.k === k || (k === 'ground' && at(a, b)?.k === 'ground'); return { u: !!at(x, y - 1), d: !!at(x, y + 1), l: same(x - 1, y), r: same(x + 1, y), su: same(x, y - 1) }; }

// ---------------------------------------------------------------- the loop, the keys, the buttons
let last = performance.now();
function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; for (let i = 0; i < 2; i++) step(dt / 2); draw(); requestAnimationFrame(loop); }
const jump = () => { P.buf = 0.12; };
addEventListener('keydown', (e) => { if (['Space', 'ArrowUp', 'KeyW', 'KeyZ'].includes(e.code) && !keys[e.code]) jump(); keys[e.code] = true; if (/^Digit[1-6]$/.test(e.code)) setStyle(+e.code.slice(5) - 1); if (e.code === 'KeyR') reset(); if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', (e) => { keys[e.code] = false; });
for (const [id, k] of [['bl', 'tl'], ['br', 'tr'], ['bj', 'tj']]) { const b = $(id); b.addEventListener('pointerdown', (e) => { e.preventDefault(); keys[k] = true; if (k === 'tj') jump(); }); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { keys[k] = false; }); }
function setStyle(i) { styleI = (i + STYLES.length) % STYLES.length; document.querySelectorAll('#styles button').forEach((b, j) => b.classList.toggle('on', j === styleI)); try { localStorage.setItem('styleworld.style', styleI); } catch (e) { /* */ } STYLES[styleI].enter?.(); document.body.dataset.style = STYLES[styleI].id; }
$('styles').innerHTML = STYLES.map((s, i) => `<button title="${s.name.en}">${i + 1}<span>${s.name.zh}</span></button>`).join('');
$('styles').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setStyle([...b.parentNode.children].indexOf(b)); });
function resize() { const d = Math.min(2, devicePixelRatio || 1), r = cv.getBoundingClientRect(); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
new ResizeObserver(resize).observe(cv);
reset(); resize();
const q = new URLSearchParams(location.search);
setStyle(q.has('style') ? +q.get('style') : (() => { try { return +(localStorage.getItem('styleworld.style') || 0); } catch (e) { return 0; } })());
requestAnimationFrame(loop);
// for tests: jump ahead along the course, pick a style, step the world
window.GAME = { setStyle, reset: () => reset(), get L() { return L; }, get P() { return P; }, warp: (x) => { P.x = x; P.y = 12; camX = Math.max(0, x - 8); }, step: (n = 1) => { for (let i = 0; i < n; i++) step(1 / 120); draw(); }, keys, hit: (x, y) => hit(x, y), big: () => { P.big = true; P.h = 1.8; } };

// The first level: an original course in the spirit of the classic opening stage — a gentle start, boxes to
// head-butt, a growth berry, beetles to stomp, pits, floating rows, a staircase, and a gate at the end.
// One character a tile:  # ground   B brick   ? gift box (a coin)   G gift box (a berry)   = stone block (stairs)
//   C chimney top   c chimney body   o coin in the air   e beetle   s snail   P start   F the gate   ~ (nothing: air)
const ROWS = [
  '                                                                                                                                                                                                          ',
  '                                                                                                                                                                                                          ',
  '                                                                                                                                                                                                          ',
  '                                                                                                                                                                                                          ',
  '                      ?                                                            BBBBBBBB   BBB?              ?           BBB    B??B                                                 ==         ',
  '                                                                                                                                                                                       ===         ',
  '                                                                                                                                                                                      ====      F  ',
  '                                                                                                                                                                                     =====         ',
  '                ?   B?BGB                         o o o                          BGB              B     BB    ?  ?  ?     B          BB      =  =          ==  =             BBGB          ======         ',
  '                                    CC        CC                 CC                                                                         ==  ==        ===  ==                       =======         ',
  '                          CC        cc        cc         CC      cc                                                                        ===  ===      ====  ===     CC          CC  ========         ',
  '                          cc        cc        cc         cc      cc                                                                       ====  ====    =====  ====    cc          cc =========         ',
  '   P                      cc    e   cc   e    cc  e  e   cc      cc        e          e e       s      e e   e e     e e   e e          =====  =====  ======  =====   cc  e e     cc==========       = ',
  '#######################################################################  #############   ################################################################  ######################################',
  '#######################################################################  #############   ################################################################  ######################################',
];
export const TILE = 1; // the world is measured in tiles
export function loadLevel() {
  const H = ROWS.length, W = Math.max(...ROWS.map((r) => r.length)), grid = [], ents = [], coins = [];
  let start = { x: 3, y: 12 }, gate = { x: W - 3, y: 6 };
  for (let y = 0; y < H; y++) { grid.push([]); for (let x = 0; x < W; x++) {
    const c = ROWS[y][x] || ' ';
    let k = null;
    if (c === '#') k = 'ground'; else if (c === 'B') k = 'brick'; else if (c === '?') k = 'box'; else if (c === 'G') k = 'boxg'; else if (c === '=') k = 'stone'; else if (c === 'C') k = 'chimtop'; else if (c === 'c') k = 'chim';
    grid[y].push(k ? { k, used: false, bump: 0 } : null);
    if (c === 'o') coins.push({ x: x + 0.5, y: y + 0.5, got: false });
    if (c === 'e' || c === 's') ents.push({ kind: c === 'e' ? 'beetle' : 'snail', x: x + 0.5, y: y + 1, vx: -1.2, vy: 0, alive: true, w: 0.8, h: 0.8 });
    if (c === 'P') start = { x: x + 0.5, y: y + 1 };
    if (c === 'F') gate = { x: x + 0.5, y: H - 2 };
  } }
  // decoration behind the course: hills, bushes, clouds, by position along it (the same for every style)
  const deco = [];
  for (let x = 0; x < W; x += 1) { const h = (x * 7919) % 97; if (h < 6) deco.push({ k: 'hill', x, s: 2 + (h % 3) }); else if (h < 11) deco.push({ k: 'bush', x, s: 1 + (h % 3) }); if ((x * 104729) % 89 < 5) deco.push({ k: 'cloud', x, y: 2 + ((x * 31) % 4), s: 1 + (x % 3) }); }
  return { grid, W, H, ents, coins, start, gate, deco };
}

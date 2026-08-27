/*
 * Builds the 48 maps for Ninja Master and writes levels.js.
 *
 * How it works
 *   1. A run level is made of small pieces called segments. Every segment
 *      begins and ends on plain flat ground, so any two of them can be put
 *      side by side and the join is always safe.
 *   2. A maze level is made of a grid of rooms. A random tree says which
 *      rooms are joined. A tree has only one way to each room, so the other
 *      branches become dead ends that you must walk back out of.
 *   3. Every finished level is played by a solver. The solver is a breadth
 *      first search over tile states. Its moves are a little weaker than the
 *      real game, so anything it can do the player can do too. If it cannot
 *      reach the flag, the key and the three gems, the level is thrown away
 *      and built again with the next seed.
 *   4. All the random numbers come from a seed, so two runs give the same
 *      levels.
 *
 * Run it with:  node tools\genlevels.cjs
 */

'use strict';

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'levels.js');

// ---------------------------------------------------------------------------
// numbers that describe the game
// ---------------------------------------------------------------------------

const RUN_H = 17;        // a run level is one screen tall
const ROOM_W = 15;       // a maze room is 15 tiles wide
const ROOM_H = 17;       // and 17 tiles tall

const RUN_FLOOR = 14;    // top row of the ground in a run level
const RUN_STAND = 13;    // where a thing standing on that ground sits

// How far one jump carries you. Index is how many rows you climb.
// These are smaller than the real game can do, on purpose.
const MAXDX_UP = [4, 3, 3, 2];
const MAXDX_WALL = [0, 3, 3, 2];
const SPRING_RISE = 6;   // a spring lifts 7.6 rows, we only trust 6
const SPRING_DX = 2;

const SOLID_SET = '#=T/';

// ---------------------------------------------------------------------------
// the letters
// ---------------------------------------------------------------------------

const WORLD_NAMES = [
  'Green Woods', 'Frost Peak', 'Sand Tomb', 'Fire Keep',
  'Shadow Fort', 'Sky Temple', 'Deep Cave', 'Iron Works'
];

const ENEMIES = [
  ['Z', 'S'], ['W', 'V'], ['U', 'C'], ['I', 'G'],
  ['N', 'Y'], ['A', 'E'], ['L', 'O'], ['f', 'j']
];
const BOSSES = ['K', 'J', 'Q', 'D', 'X', '7', '8', '9'];
const ALL_ENEMY_CH = 'ZSWVUCIGNYAELOfj';
const ALL_BOSS_CH = 'KJQDX789';
const WEAPONS = ['1', '2', '3', '4', '5', '6'];
const LEGAL = '.#=^~T%+|/PFoHM*BRkg123456' + ALL_ENEMY_CH + ALL_BOSS_CH;

// lava and deep water belong only to Fire Keep and Deep Cave
const LAVA_WORLDS = [3, 6];

const LEVEL_NAMES = [
  ['Green Start', 'Log Hop', 'Root Maze', 'Deep Woods', 'Old Tree Halls', 'Skull King'],
  ['Cold Start', 'Ice Slide', 'Frozen Halls', 'Snow Storm', 'Glacier Deeps', 'Frost Giant'],
  ['Dry Dunes', 'Spike Sands', 'First Tomb', 'Sun Scorch', 'Lost Pyramid', 'Mummy Lord'],
  ['Hot Rocks', 'Ash Path', 'Lava Vaults', 'Fire Bridge', 'Magma Keep', 'Fire Dragon'],
  ['Dark Gate', 'Night Walk', 'Shadow Cells', 'Black Bridge', 'Fort Deeps', 'Shadow Master'],
  ['Cloud Steps', 'Wind Run', 'Sky Vaults', 'High Winds', 'Temple Spires', 'Storm Bird'],
  ['Cave Mouth', 'Crystal Run', 'Wet Tunnels', 'Deep Drop', 'Crystal Deeps', 'Crystal Queen'],
  ['Iron Gate', 'Gear Run', 'Machine Halls', 'Steam Line', 'Iron Core', 'Iron Titan']
];

// which level of each world holds the one and only max up
const MAXUP_LEVEL = [1, 3, 0, 4, 2, 3, 1, 4];

// ---------------------------------------------------------------------------
// random numbers we can repeat
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function irnd(rng, lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); }
function pick(rng, list) { return list[Math.min(list.length - 1, Math.floor(rng() * list.length))]; }
function shuffle(rng, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = out[i]; out[i] = out[j]; out[j] = t;
  }
  return out;
}

// ---------------------------------------------------------------------------
// grids
// ---------------------------------------------------------------------------

function makeGrid(w, h, ch) {
  const g = [];
  for (let r = 0; r < h; r++) g.push(new Array(w).fill(ch));
  return g;
}
function gridRows(g) { return g.map(function (row) { return row.join(''); }); }
function toGrid(rows) { return rows.map(function (r) { return r.split(''); }); }
function findAll(g, set) {
  const out = [];
  for (let y = 0; y < g.length; y++) {
    for (let x = 0; x < g[y].length; x++) {
      if (set.indexOf(g[y][x]) >= 0) out.push({ x: x, y: y, ch: g[y][x] });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// the solver
// ---------------------------------------------------------------------------
//
// A state is one tile, plus a mode, plus whether we carry the key.
//   mode 0  standing on the ground or holding a ladder
//   mode 1  hanging on a wall, ready to wall jump
//
// Solid: # = T / and + while we have no key.  Deadly: ^ and ~.

function makeSolver(rows) {
  const H = rows.length;
  const W = rows[0].length;

  function at(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return '#';
    return rows[y][x];
  }
  function solidCh(c, key) {
    return c === '#' || c === '=' || c === 'T' || c === '/' || (c === '+' && !key);
  }
  function solid(x, y, key) { return solidCh(at(x, y), key); }
  function free(x, y, key) {
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    const c = rows[y][x];
    return !solidCh(c, key) && c !== '^' && c !== '~';
  }
  function ladder(x, y) { return at(x, y) === '|'; }
  function rest(x, y, key) {
    return free(x, y, key) && (solid(x, y + 1, key) || ladder(x, y));
  }
  function cling(x, y, key) {
    if (!free(x, y, key)) return false;
    if (solid(x, y + 1, key) || ladder(x, y)) return false;
    return solid(x - 1, y, key) || solid(x + 1, y, key);
  }

  // The flight path of a jump: straight up out of the start tile, across at
  // the top, then down on to the landing tile. R is how many rows we climb
  // before crossing, which also stands for the head room the jump needs.
  function pathOk(x, y, nx, ny, key, R) {
    const top = y - R;
    if (top < 0) return false;
    for (let r = y - 1; r >= top; r--) if (!free(x, r, key)) return false;
    const lo = Math.min(x, nx), hi = Math.max(x, nx);
    const midLow = Math.min(y - 1, ny);
    for (let mx = lo + 1; mx < hi; mx++) {
      for (let r = top; r <= midLow; r++) if (!free(mx, r, key)) return false;
    }
    for (let r = top; r <= ny; r++) if (!free(nx, r, key)) return false;
    return true;
  }

  function landing(x, y, key, nx, ny, R, push) {
    if (!pathOk(x, y, nx, ny, key, R)) return;
    if (rest(nx, ny, key)) push(nx, ny, 0);
    else if (cling(nx, ny, key)) push(nx, ny, 1);
  }

  function moves(x, y, mode, key, push) {
    if (mode === 0) {
      if (rest(x - 1, y, key)) push(x - 1, y, 0);
      if (rest(x + 1, y, key)) push(x + 1, y, 0);

      if (ladder(x, y - 1) && free(x, y - 1, key)) push(x, y - 1, 0);
      if (ladder(x, y) && ladder(x, y + 1)) push(x, y + 1, 0);

      for (let u = 0; u <= 3; u++) {
        const ny = y - u;
        const m = MAXDX_UP[u];
        for (let dx = -m; dx <= m; dx++) {
          if (dx === 0 && u === 0) continue;
          const R = Math.max(u + 1, Math.abs(dx), 1);
          landing(x, y, key, x + dx, ny, R, push);
        }
      }

      for (let d = -1; d <= 1; d += 2) {
        for (let k = 1; k <= 4; k++) {
          const nx = x + d * k;
          if (k > 1 && !free(x + d * (k - 1), y, key)) break;
          for (let ny = y + 1; ny < H; ny++) {
            if (!free(nx, ny, key)) break;
            if (rest(nx, ny, key) || cling(nx, ny, key)) {
              landing(x, y, key, nx, ny, Math.max(k, 1), push);
            }
          }
        }
      }

      if (at(x, y + 1) === 'T') {
        for (let u = 1; u <= SPRING_RISE; u++) {
          for (let dx = -SPRING_DX; dx <= SPRING_DX; dx++) {
            const R = Math.max(u + 1, Math.abs(dx), 1);
            landing(x, y, key, x + dx, y - u, R, push);
          }
        }
      }
      return;
    }

    const wallLeft = solid(x - 1, y, key);
    const wallRight = solid(x + 1, y, key);
    for (let rise = 1; rise <= 3; rise++) {
      const m = MAXDX_WALL[rise];
      for (let d = -1; d <= 1; d += 2) {
        if (d < 0 && !wallRight) continue;
        if (d > 0 && !wallLeft) continue;
        for (let k = 1; k <= m; k++) {
          const R = Math.max(rise + 1, k);
          landing(x, y, key, x + d * k, y - rise, R, push);
        }
      }
    }
    for (let d = -1; d <= 1; d++) {
      for (let ny = y + 1; ny < H; ny++) {
        const nx = x + d;
        if (!free(nx, ny, key)) break;
        if (rest(nx, ny, key) || cling(nx, ny, key)) {
          landing(x, y, key, nx, ny, 1, push);
        }
      }
    }
  }

  return { W: W, H: H, at: at, rest: rest, moves: moves };
}

// Walk the whole state graph from P, then walk it backwards from F.
function analyse(rows, opts) {
  opts = opts || {};
  const s = makeSolver(rows);
  const W = s.W, H = s.H;
  const grid = toGrid(rows);
  const start = findAll(grid, 'P')[0];
  const flag = findAll(grid, 'F')[0];
  if (!start || !flag) return null;

  const allowKey = opts.allowKey !== false;
  const N = W * H * 4;
  const dist = new Int32Array(N).fill(-1);
  const from = [];
  const to = [];

  function id(x, y, mode, key) { return ((y * W + x) * 2 + mode) * 2 + (key ? 1 : 0); }

  const startKey = allowKey && s.at(start.x, start.y) === 'k';
  const s0 = id(start.x, start.y, 0, startKey);
  dist[s0] = 0;
  const queue = [s0];
  let head = 0;

  while (head < queue.length) {
    const cur = queue[head++];
    const key = (cur & 1) === 1;
    const mode = (cur >> 1) & 1;
    const cell = cur >> 2;
    const x = cell % W;
    const y = (cell - x) / W;
    const d = dist[cur];

    s.moves(x, y, mode, key, function (nx, ny, nmode) {
      let nkey = key;
      if (allowKey && s.at(nx, ny) === 'k') nkey = true;
      const nid = id(nx, ny, nmode, nkey);
      from.push(cur); to.push(nid);
      if (dist[nid] < 0) { dist[nid] = d + 1; queue.push(nid); }
    });
  }

  const back = new Int32Array(N).fill(-1);
  const heads = new Int32Array(N).fill(-1);
  const nextEdge = new Int32Array(from.length).fill(-1);
  for (let i = 0; i < from.length; i++) {
    nextEdge[i] = heads[to[i]];
    heads[to[i]] = i;
  }
  const goals = [];
  for (let mode = 0; mode < 2; mode++) {
    for (let key = 0; key < 2; key++) {
      const gid = id(flag.x, flag.y, mode, key);
      if (dist[gid] >= 0) { back[gid] = 0; goals.push(gid); }
    }
  }
  const q2 = goals.slice();
  head = 0;
  while (head < q2.length) {
    const cur = q2[head++];
    for (let e = heads[cur]; e >= 0; e = nextEdge[e]) {
      const src = from[e];
      if (back[src] < 0) { back[src] = back[cur] + 1; q2.push(src); }
    }
  }

  let goalDist = -1;
  goals.forEach(function (g) { if (goalDist < 0 || dist[g] < goalDist) goalDist = dist[g]; });

  function best(arr, x, y) {
    let v = -1;
    for (let mode = 0; mode < 2; mode++) {
      for (let key = 0; key < 2; key++) {
        const t = arr[id(x, y, mode, key)];
        if (t >= 0 && (v < 0 || t < v)) v = t;
      }
    }
    return v;
  }

  return {
    ok: goalDist >= 0,
    goalDist: goalDist,
    reachable: function (x, y) { return best(dist, x, y) >= 0; },
    distTo: function (x, y) { return best(dist, x, y); },
    detour: function (x, y) {
      const a = best(dist, x, y), b = best(back, x, y);
      if (a < 0 || b < 0) return false;
      return a + b > goalDist;
    }
  };
}

// ---------------------------------------------------------------------------
// counting things to do
// ---------------------------------------------------------------------------

function countFeatures(rows) {
  const H = rows.length, W = rows[0].length;
  let n = 0;
  const seen = {};
  function at(x, y) { return (x < 0 || y < 0 || x >= W || y >= H) ? '#' : rows[y][x]; }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== 'o' || seen[y + ':' + x]) continue;
      n++;
      const stack = [[x, y]];
      while (stack.length) {
        const p = stack.pop();
        const k = p[1] + ':' + p[0];
        if (seen[k]) continue;
        seen[k] = true;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          const xx = p[0] + d[0], yy = p[1] + d[1];
          if (at(xx, yy) === 'o' && !seen[yy + ':' + xx]) stack.push([xx, yy]);
        });
      }
    }
  }
  '=^~/%|'.split('').forEach(function (ch) {
    for (let y = 0; y < H; y++) {
      let run = false;
      for (let x = 0; x < W; x++) {
        const on = at(x, y) === ch;
        if (on && !run) n++;
        run = on;
      }
    }
  });
  let inGap = false, lastTop = null;
  for (let x = 0; x < W; x++) {
    let top = null;
    for (let y = 0; y < H; y++) {
      if (SOLID_SET.indexOf(at(x, y)) >= 0) { top = y; break; }
    }
    const gap = top === null;
    if (gap && !inGap) n++;
    inGap = gap;
    if (top !== null && lastTop !== null && top !== lastTop) n++;
    if (top !== null) lastTop = top;
  }
  n += findAll(toGrid(rows), ALL_ENEMY_CH + ALL_BOSS_CH + 'THM*BRkg123456+').length;
  return n;
}

function groupCount(grid, ch) {
  const H = grid.length, W = grid[0].length;
  const seen = {};
  let n = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x] !== ch || seen[y + ':' + x]) continue;
      n++;
      const st = [[x, y]];
      while (st.length) {
        const p = st.pop();
        const k = p[1] + ':' + p[0];
        if (seen[k]) continue;
        seen[k] = true;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          const xx = p[0] + d[0], yy = p[1] + d[1];
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) return;
          if (grid[yy][xx] === ch && !seen[yy + ':' + xx]) st.push([xx, yy]);
        });
      }
    }
  }
  return n;
}

// ---------------------------------------------------------------------------
// rooms
// ---------------------------------------------------------------------------

function roomOf(x, y) { return Math.floor(x / ROOM_W) + ',' + Math.floor(y / ROOM_H); }

function roomBounds(C, R, W, H, c, r) {
  const wallCol = c < C - 1 ? (c + 1) * ROOM_W : W - 1;
  const floor = r < R - 1 ? (r + 1) * ROOM_H : H - 1;
  return {
    c: c, r: r, key: c + ',' + r,
    x0: c * ROOM_W + 1, x1: wallCol - 1,
    y0: r * ROOM_H + 1, y1: floor - 1,
    wallCol: wallCol, floor: floor, sr: floor - 1
  };
}

function roomGraph(rows, C, R) {
  const W = rows[0].length, H = rows.length;
  function open(ch) { return SOLID_SET.indexOf(ch) < 0; }
  const nodes = [];
  const adj = {};
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) { nodes.push(c + ',' + r); adj[c + ',' + r] = []; }
  }
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const b = roomBounds(C, R, W, H, c, r);
      if (c + 1 < C) {
        let joined = false;
        for (let y = b.y0; y <= b.y1; y++) if (open(rows[y][b.wallCol])) joined = true;
        if (joined) {
          adj[c + ',' + r].push((c + 1) + ',' + r);
          adj[(c + 1) + ',' + r].push(c + ',' + r);
        }
      }
      if (r + 1 < R) {
        let joined = false;
        for (let x = b.x0; x <= b.x1; x++) if (open(rows[b.floor][x])) joined = true;
        if (joined) {
          adj[c + ',' + r].push(c + ',' + (r + 1));
          adj[c + ',' + (r + 1)].push(c + ',' + r);
        }
      }
    }
  }
  return { adj: adj, nodes: nodes };
}

function bfsRooms(adj, from) {
  const d = {}; d[from] = 0;
  const q = [from];
  let h = 0;
  while (h < q.length) {
    const cur = q[h++];
    adj[cur].forEach(function (n) { if (d[n] === undefined) { d[n] = d[cur] + 1; q.push(n); } });
  }
  return d;
}

// ---------------------------------------------------------------------------
// the rules every level must obey
// ---------------------------------------------------------------------------

function checkLevel(level) {
  const bad = [];
  const rows = level.rows;
  const world = level.world;
  const boss = level.boss;
  const kind = level.kind;
  const H = rows.length;
  const W = rows[0].length;
  const grid = toGrid(rows);
  function say(m) { bad.push(m); }

  rows.forEach(function (row, y) {
    if (row.length !== W) say('row ' + y + ' is ' + row.length + ' wide, wanted ' + W);
  });
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (LEGAL.indexOf(rows[y][x]) < 0) say('odd letter "' + rows[y][x] + '" at ' + x + ',' + y);
    }
  }

  if (kind === 'run') {
    if (H !== RUN_H) say('a run level needs 17 rows, has ' + H);
    if (boss) {
      if (W < 90 || W > 130) say('a boss level is ' + W + ' wide, wanted 90 to 130');
    } else if (W < 160 || W > 240) {
      say('is ' + W + ' wide, wanted 160 to 240');
    }
  } else {
    if (H !== 34 && H !== 51) say('a maze needs 34 or 51 rows, has ' + H);
    if (W < 90 || W > 150) say('a maze is ' + W + ' wide, wanted 90 to 150');
    if (W % ROOM_W !== 0) say('a maze width must divide by ' + ROOM_W);
  }

  const starts = findAll(grid, 'P');
  const flags = findAll(grid, 'F');
  const gems = findAll(grid, 'g');
  if (starts.length !== 1) say('wants one P, found ' + starts.length);
  if (flags.length !== 1) say('wants one F, found ' + flags.length);
  if (gems.length !== 3) say('wants three gems, found ' + gems.length);

  const mine = ENEMIES[world];
  findAll(grid, ALL_ENEMY_CH).forEach(function (e) {
    if (mine.indexOf(e.ch) < 0) say('enemy "' + e.ch + '" is not from world ' + world);
  });
  const bossHere = findAll(grid, ALL_BOSS_CH);
  if (boss) {
    if (bossHere.length !== 1) say('a boss level wants one boss, found ' + bossHere.length);
    else if (bossHere[0].ch !== BOSSES[world]) say('wrong boss for world ' + world);
  } else if (bossHere.length) {
    say('a normal level must have no boss');
  }

  findAll(grid, ALL_ENEMY_CH + ALL_BOSS_CH).forEach(function (e) {
    const under = e.y + 1 < H ? rows[e.y + 1][e.x] : '.';
    if (SOLID_SET.indexOf(under) < 0) {
      say('"' + e.ch + '" at ' + e.x + ',' + e.y + ' stands on nothing');
    }
  });

  if (LAVA_WORLDS.indexOf(world) < 0 && findAll(grid, '~').length) {
    say('world ' + world + ' must have no lava or deep water');
  }

  findAll(grid, 'T').forEach(function (t) {
    for (let i = 1; i <= 7; i++) {
      const c = t.y - i >= 0 ? rows[t.y - i][t.x] : '#';
      if (SOLID_SET.indexOf(c) >= 0) say('the spring at ' + t.x + ',' + t.y + ' is blocked above');
    }
  });

  if (starts.length !== 1 || flags.length !== 1) return bad;

  const solve = analyse(rows);
  if (!solve) { say('no start or no flag'); return bad; }
  if (!solve.ok) say('the solver cannot reach the flag');

  gems.forEach(function (g) {
    if (!solve.ok) return;
    if (!solve.reachable(g.x, g.y)) say('the gem at ' + g.x + ',' + g.y + ' cannot be reached');
    else if (!solve.detour(g.x, g.y)) say('the gem at ' + g.x + ',' + g.y + ' sits on the main path');
  });

  const stars = findAll(grid, '*');
  if (boss) {
    if (stars.length) say('a boss level must have no star, found ' + stars.length);
  } else if (kind === 'run') {
    if (stars.length !== 1) say('a run level wants one star, found ' + stars.length);
    stars.forEach(function (st) {
      const part = st.x / W;
      if (part < 0.35 || part > 0.55) {
        say('the star at ' + st.x + ' is at ' + Math.round(part * 100) + ' percent, wanted 35 to 55');
      }
    });
  } else if (stars.length > 1) {
    say('a maze wants at most one star');
  }

  const weapons = findAll(grid, '123456');
  if (weapons.length < 1 || weapons.length > 2) say('wants 1 or 2 weapons, found ' + weapons.length);
  if (kind === 'run') {
    weapons.forEach(function (wp) {
      if (wp.x > W * 0.68) say('a weapon at ' + wp.x + ' is past the first two thirds');
    });
  }

  const coins = findAll(grid, 'o').length;
  const foes = findAll(grid, ALL_ENEMY_CH).length;
  if (kind === 'run' && !boss) {
    if (coins < 30 || coins > 60) say('wants 30 to 60 coins, found ' + coins);
    if (foes < 12 || foes > 22) say('wants 12 to 22 enemies, found ' + foes);
  } else if (kind === 'maze') {
    if (coins < 25 || coins > 50) say('wants 25 to 50 coins, found ' + coins);
    if (foes < 10 || foes > 20) say('wants 10 to 20 enemies, found ' + foes);
  } else {
    if (coins < 10 || coins > 40) say('a boss level wants 10 to 40 coins, found ' + coins);
    if (foes < 2 || foes > 8) say('a boss level wants 2 to 8 enemies, found ' + foes);
  }

  if (kind === 'run') {
    let run = 0;
    for (let x = 0; x <= W; x++) {
      let hard = false;
      if (x < W) {
        for (let y = 0; y < H; y++) if (SOLID_SET.indexOf(rows[y][x]) >= 0) hard = true;
      }
      if (x < W && !hard) run++;
      else { if (run > 4) say('a hole of ' + run + ' columns ends at ' + x); run = 0; }
    }
    const feats = countFeatures(rows);
    if (W / feats > 4) say('only one thing to do every ' + (W / feats).toFixed(1) + ' columns');
    if (world >= 1 && !boss && findAll(grid, 'T').length < 1) say('wants at least one spring');
  }

  if (boss && bossHere.length === 1) {
    const b = bossHere[0];
    function plainCol(x) {
      if (x < 1 || x >= W - 1) return false;
      for (let y = 0; y < H; y++) {
        const c = rows[y][x];
        if (y >= RUN_FLOOR) { if (c !== '#') return false; continue; }
        if (c === '.' || c === 'o' || c === b.ch) continue;
        return false;
      }
      return true;
    }
    let left = b.x, right = b.x;
    while (plainCol(left - 1)) left--;
    while (plainCol(right + 1)) right++;
    const wide = right - left + 1;
    if (wide < 26) say('the boss arena is only ' + wide + ' columns, wanted 26');
    if (flags.length && flags[0].x < right) say('the flag must be past the arena');
    gems.forEach(function (g) {
      if (g.x > left) say('a gem at ' + g.x + ' is not before the arena');
    });
  }

  if (kind === 'maze') {
    for (let x = 0; x < W; x++) {
      if (rows[0][x] !== '#') say('the top border leaks at ' + x);
      if (rows[H - 1][x] !== '#') say('the bottom border leaks at ' + x);
    }
    for (let y = 0; y < H; y++) {
      if (rows[y][0] !== '#') say('the left border leaks at ' + y);
      if (rows[y][W - 1] !== '#') say('the right border leaks at ' + y);
    }

    const keys = findAll(grid, 'k');
    if (keys.length !== 1) say('a maze wants one key, found ' + keys.length);
    const doorTiles = findAll(grid, '+');
    const doorGroups = groupCount(grid, '+');
    if (doorGroups < 1 || doorGroups > 2) say('a maze wants 1 or 2 doors, found ' + doorGroups);
    if (!doorTiles.length) say('a maze wants at least one door tile');
    if (!findAll(grid, '%').length) say('a maze wants a fake wall');

    if (keys.length === 1) {
      const noKey = analyse(rows, { allowKey: false });
      if (!solve.reachable(keys[0].x, keys[0].y)) say('the key cannot be reached');
      if (noKey && !noKey.reachable(keys[0].x, keys[0].y)) say('the key is behind the door');
      if (noKey && noKey.ok) say('the flag can be reached without the key');
    }

    const C = W / ROOM_W, R = H / ROOM_H;
    const g = roomGraph(rows, C, R);
    const startRoom = roomOf(starts[0].x, starts[0].y);
    const flagRoom = roomOf(flags[0].x, flags[0].y);
    const dist = bfsRooms(g.adj, startRoom);
    g.nodes.forEach(function (n) { if (dist[n] === undefined) say('room ' + n + ' is cut off'); });
    let far = 0;
    g.nodes.forEach(function (n) { if (dist[n] !== undefined && dist[n] > far) far = dist[n]; });
    if (dist[flagRoom] !== far) {
      say('the flag room is ' + dist[flagRoom] + ' rooms away, the furthest is ' + far);
    }
    const distFlag = bfsRooms(g.adj, flagRoom);
    const main = {};
    g.nodes.forEach(function (n) {
      if (dist[n] !== undefined && dist[n] + distFlag[n] === dist[flagRoom]) main[n] = true;
    });
    let deep = 0;
    g.nodes.forEach(function (n) {
      if (main[n] || g.adj[n].length !== 1) return;
      let d = 0, cur = n, prev = null;
      while (!main[cur] && d < 60) {
        const nxt = g.adj[cur].filter(function (m) { return m !== prev; })[0];
        if (!nxt) break;
        prev = cur; cur = nxt; d++;
      }
      if (d >= 2) deep++;
    });
    if (deep < 2) say('wants two dead ends two or more rooms deep, found ' + deep);

    const perRoom = {};
    findAll(grid, ALL_ENEMY_CH).forEach(function (e) {
      const k = roomOf(e.x, e.y);
      perRoom[k] = (perRoom[k] || 0) + 1;
    });
    Object.keys(perRoom).forEach(function (k) {
      if (perRoom[k] > 3) say('room ' + k + ' holds ' + perRoom[k] + ' enemies');
    });
  }

  return bad;
}

// ---------------------------------------------------------------------------
// pieces of a run level
// ---------------------------------------------------------------------------
//
// Every piece is 17 rows tall. Its first two and last two columns are always
// plain flat ground with clear air above, so pieces join safely.

function segBase(w) {
  const g = makeGrid(w, RUN_H, '.');
  for (let x = 0; x < w; x++) {
    for (let y = RUN_FLOOR; y < RUN_H; y++) g[y][x] = '#';
  }
  return g;
}

function segFlat(rng) { return segBase(irnd(rng, 5, 9)); }

function segGap(rng) {
  const n = irnd(rng, 2, 3);
  const g = segBase(n + 8);
  for (let i = 0; i < n; i++) {
    for (let y = RUN_FLOOR; y < RUN_H; y++) g[y][3 + i] = '.';
  }
  return g;
}

function segLava(rng) {
  const n = irnd(rng, 2, 3);
  const g = segBase(n + 8);
  for (let i = 0; i < n; i++) {
    for (let y = RUN_FLOOR; y < RUN_H; y++) g[y][3 + i] = '~';
  }
  return g;
}

function segSpikes(rng) {
  const n = irnd(rng, 1, 3);
  const g = segBase(n + 8);
  for (let i = 0; i < n; i++) g[RUN_STAND][3 + i] = '^';
  return g;
}

function segSteps(rng) {
  const up = irnd(rng, 1, 2);
  const w = 12;
  const g = makeGrid(w, RUN_H, '.');
  const top = [];
  for (let x = 0; x < w; x++) {
    let t = RUN_FLOOR;
    if (x >= 3 && x < w - 3) t = RUN_FLOOR - up;
    if (x === 2 || x === w - 3) t = RUN_FLOOR - (up > 1 ? 1 : 0);
    top.push(t);
  }
  for (let x = 0; x < w; x++) {
    for (let y = top[x]; y < RUN_H; y++) g[y][x] = '#';
  }
  return g;
}

function segPillar(rng) {
  const g = segBase(9);
  g[RUN_STAND][4] = '#';
  g[RUN_STAND - 1][4] = '#';
  return g;
}

function segBlocks(rng) {
  const g = segBase(11);
  g[RUN_STAND][3] = '/';
  if (rng() < 0.6) g[RUN_STAND][6] = '/';
  g[RUN_STAND - 2][4] = '/';
  return g;
}

function segPlat(rng) {
  const g = segBase(11);
  const n = irnd(rng, 3, 4);
  for (let i = 0; i < n; i++) g[11][3 + i] = '=';
  for (let i = 0; i < n; i++) g[10][3 + i] = 'o';
  return g;
}

function segTower(rng) {
  const g = segBase(13);
  for (let i = 0; i < 3; i++) g[11][2 + i] = '=';
  for (let i = 0; i < 3; i++) g[8][6 + i] = '=';
  g[10][3] = 'o';
  g[7][7] = 'o';
  return g;
}

function segCeiling(rng) {
  const g = segBase(11);
  for (let x = 2; x < 9; x++) { g[8][x] = '#'; g[9][x] = '#'; }
  g[RUN_STAND][4] = 'o';
  g[RUN_STAND][6] = 'o';
  return g;
}

function segSpring(rng) {
  const g = segBase(11);
  g[RUN_STAND][4] = 'T';
  g[10][4] = 'o';
  g[9][4] = 'o';
  g[8][4] = 'o';
  return g;
}

// gem piece 1: a hidden room inside a rock block, entered through a fake wall
function segGemBlock(rng) {
  const c = 4;
  const g = segBase(c + 6 + 4);
  for (let i = 0; i < 6; i++) { g[11][c + i] = '#'; g[12][c + i] = '#'; }
  g[RUN_STAND][c] = '%';
  for (let i = 1; i <= 4; i++) g[RUN_STAND][c + i] = '.';
  g[RUN_STAND][c + 5] = '#';
  g[RUN_STAND][c + 2] = 'g';
  g[RUN_STAND][c + 3] = 'o';
  g[10][c + 2] = 'o';
  return g;
}

// gem piece 2: a hole in the ground with a side room off it
function segGemPit(rng) {
  const c = 4;
  const g = segBase(c + 6 + 4);
  for (let i = 0; i < 3; i++) { g[14][c + i] = '.'; g[15][c + i] = '.'; }
  for (let i = 3; i < 6; i++) g[15][c + i] = '.';
  g[15][c + 3] = '%';
  g[15][c + 4] = 'g';
  g[15][c + 1] = 'o';
  return g;
}

// gem piece 3: a spring that throws you up to a high ledge
function segGemSpring(rng) {
  const c = 4;
  const g = segBase(12);
  g[RUN_STAND][c] = 'T';
  for (let i = 1; i <= 3; i++) g[7][c + i] = '=';
  g[6][c + 2] = 'g';
  g[6][c + 1] = 'o';
  g[6][c + 3] = 'o';
  return g;
}

function hcat(list) {
  const w = list.reduce(function (a, g) { return a + g[0].length; }, 0);
  const out = makeGrid(w, RUN_H, '.');
  let ox = 0;
  list.forEach(function (g) {
    for (let y = 0; y < RUN_H; y++) {
      for (let x = 0; x < g[0].length; x++) out[y][ox + x] = g[y][x];
    }
    ox += g[0].length;
  });
  return out;
}

// ---------------------------------------------------------------------------
// putting items into a finished shape
// ---------------------------------------------------------------------------

function restSpots(grid, solve, lo, hi) {
  const H = grid.length, W = grid[0].length;
  const out = [];
  for (let y = 0; y < H; y++) {
    for (let x = Math.max(0, lo); x < Math.min(W, hi); x++) {
      if (grid[y][x] !== '.') continue;
      const below = y + 1 < H ? grid[y + 1][x] : '#';
      if (SOLID_SET.indexOf(below) < 0) continue;
      if (!solve.reachable(x, y)) continue;
      out.push({ x: x, y: y });
    }
  }
  return out;
}

function spread(rng, spots, want, minD) {
  const order = shuffle(rng, spots);
  const kept = [];
  for (let i = 0; i < order.length && kept.length < want; i++) {
    const s = order[i];
    let ok = true;
    for (let j = 0; j < kept.length; j++) {
      if (Math.abs(kept[j].x - s.x) + Math.abs(kept[j].y - s.y) < minD) { ok = false; break; }
    }
    if (ok) kept.push(s);
  }
  return kept;
}

function used(grid, s) { return grid[s.y][s.x] !== '.'; }

// ---------------------------------------------------------------------------
// run levels
// ---------------------------------------------------------------------------

function buildRun(world, index, inWorld, seed) {
  const rng = mulberry32(seed);
  const hard = inWorld === 0 ? 0 : (inWorld === 1 ? 1 : 2);

  const makers = [segFlat, segGap, segSpikes, segSteps, segPlat, segTower,
    segPillar, segBlocks, segCeiling, segSpring];
  if (LAVA_WORLDS.indexOf(world) >= 0) makers.push(segLava, segLava);
  if (world >= 1) makers.push(segSpring);

  const body = [segGemBlock(rng), segGemPit(rng), segGemSpring(rng)];
  if (world >= 1) body.push(segSpring(rng));

  const target = 170 + irnd(rng, 0, 45);
  let w = 10 + 12; // start piece and end piece
  body.forEach(function (g) { w += g[0].length; });
  let guard = 0;
  while (w < target && guard++ < 200) {
    const mk = makers[Math.floor(rng() * makers.length) % makers.length];
    const g = mk(rng);
    if (w + g[0].length > 236) break;
    body.push(g);
    w += g[0].length;
  }

  const mixed = shuffle(rng, body);
  const start = segBase(10);
  start[RUN_STAND][3] = 'P';
  const end = segBase(12);
  end[RUN_STAND][8] = 'F';
  const grid = hcat([start].concat(mixed, [end]));
  const W = grid[0].length;

  let solve = analyse(gridRows(grid));
  if (!solve || !solve.ok) return null;

  // enemies
  const foes = Math.min(22, 12 + hard * 3 + Math.floor(world / 3));
  const spotsAll = restSpots(grid, solve, 12, W - 14);
  const foeSpots = spread(rng, spotsAll.filter(function (s) {
    return s.y >= 6 && grid[s.y][s.x] === '.';
  }), foes, 7);
  if (foeSpots.length < 12) return null;
  foeSpots.forEach(function (s, i) {
    grid[s.y][s.x] = ENEMIES[world][i % 2 === 0 ? 0 : 1];
  });

  // star, in the middle band
  const lo = Math.ceil(W * 0.38), hi = Math.floor(W * 0.52);
  const starSpots = restSpots(grid, solve, lo, hi).filter(function (s) {
    return !used(grid, s);
  });
  if (!starSpots.length) return null;
  const star = starSpots[Math.floor(rng() * starSpots.length) % starSpots.length];
  grid[star.y][star.x] = '*';

  // weapons in the first two thirds
  const wCount = 1 + (rng() < 0.5 ? 1 : 0);
  const wpSpots = spread(rng, restSpots(grid, solve, 14, Math.floor(W * 0.6))
    .filter(function (s) { return !used(grid, s); }), wCount, 25);
  if (!wpSpots.length) return null;
  wpSpots.forEach(function (s) { grid[s.y][s.x] = pick(rng, WEAPONS); });

  // helpers
  const extra = [];
  extra.push('H');
  if (rng() < 0.5) extra.push('H');
  if (rng() < 0.5) extra.push('B');
  if (rng() < 0.5) extra.push('R');
  if (inWorld === MAXUP_LEVEL[world]) extra.push('M');
  const exSpots = spread(rng, restSpots(grid, solve, 20, W - 16)
    .filter(function (s) { return !used(grid, s); }), extra.length, 18);
  exSpots.forEach(function (s, i) { grid[s.y][s.x] = extra[i]; });

  // coins
  const wantCoins = 34 + irnd(rng, 0, 18);
  const have = findAll(grid, 'o').length;
  const need = Math.max(0, wantCoins - have);
  const coinSpots = spread(rng, restSpots(grid, solve, 6, W - 8)
    .filter(function (s) { return !used(grid, s); }), need, 3);
  coinSpots.forEach(function (s) { grid[s.y][s.x] = 'o'; });

  return {
    name: LEVEL_NAMES[world][inWorld], world: world, boss: false,
    kind: 'run', index: index, rows: gridRows(grid)
  };
}

// ---------------------------------------------------------------------------
// boss levels
// ---------------------------------------------------------------------------

function buildBoss(world, index, inWorld, seed) {
  const rng = mulberry32(seed);
  const runUp = [segBase(10)];
  runUp[0][RUN_STAND][3] = 'P';
  const parts = shuffle(rng, [segGemBlock(rng), segGemPit(rng), segGemSpring(rng)]);
  const filler = [segFlat, segSpikes, segPlat, segPillar, segBlocks];
  parts.forEach(function (p, i) {
    runUp.push(p);
    if (i < 2) runUp.push(filler[Math.floor(rng() * filler.length) % filler.length](rng));
  });
  let head = hcat(runUp);
  while (head[0].length < 52) head = hcat([head, segBase(4)]);

  const gateW = 2;
  const arenaW = 28 + irnd(rng, 0, 4);
  const tailW = 8;
  const gate = segBase(gateW);
  gate[10][0] = '='; gate[10][1] = '=';
  gate[11][0] = '='; gate[11][1] = '=';
  const arena = segBase(arenaW);
  const gate2 = segBase(gateW);
  gate2[10][0] = '='; gate2[10][1] = '=';
  gate2[11][0] = '='; gate2[11][1] = '=';
  const tail = segBase(tailW);
  tail[RUN_STAND][5] = 'F';

  const grid = hcat([head, gate, arena, gate2, tail]);
  const W = grid[0].length;
  const arenaX = head[0].length + gateW;
  grid[RUN_STAND][arenaX + Math.floor(arenaW / 2)] = BOSSES[world];

  const solve = analyse(gridRows(grid));
  if (!solve || !solve.ok) return null;

  const before = restSpots(grid, solve, 12, head[0].length - 2);
  const foes = 3 + irnd(rng, 0, 3);
  const foeSpots = spread(rng, before.filter(function (s) { return !used(grid, s); }), foes, 7);
  if (foeSpots.length < 2) return null;
  foeSpots.forEach(function (s, i) { grid[s.y][s.x] = ENEMIES[world][i % 2]; });

  // A boss level gets rapid fire, never a star. A star makes you invincible,
  // so you can just walk into the boss and win. Rapid fire helps the fight
  // but you still have to keep out of the way.
  const lo = Math.ceil(W * 0.38), hi = Math.floor(W * 0.52);
  const giftSpots = restSpots(grid, solve, lo, Math.min(hi, head[0].length - 2))
    .filter(function (s) { return !used(grid, s); });
  if (!giftSpots.length) return null;
  const gt = giftSpots[Math.floor(rng() * giftSpots.length) % giftSpots.length];
  grid[gt.y][gt.x] = 'R';

  const wpSpots = spread(rng, restSpots(grid, solve, 14, Math.floor(W * 0.6))
    .filter(function (s) { return !used(grid, s); }), 1, 10);
  if (!wpSpots.length) return null;
  wpSpots.forEach(function (s) { grid[s.y][s.x] = pick(rng, WEAPONS); });

  const hSpots = spread(rng, restSpots(grid, solve, 20, head[0].length - 2)
    .filter(function (s) { return !used(grid, s); }), 1, 5);
  hSpots.forEach(function (s) { grid[s.y][s.x] = 'H'; });

  const wantCoins = 16 + irnd(rng, 0, 10);
  const have = findAll(grid, 'o').length;
  const coinSpots = spread(rng, restSpots(grid, solve, 6, head[0].length - 2)
    .filter(function (s) { return !used(grid, s); }), Math.max(0, wantCoins - have), 3);
  coinSpots.forEach(function (s) { grid[s.y][s.x] = 'o'; });

  return {
    name: LEVEL_NAMES[world][inWorld], world: world, boss: true,
    kind: 'run', index: index, rows: gridRows(grid)
  };
}

// ---------------------------------------------------------------------------
// maze levels
// ---------------------------------------------------------------------------

function buildMaze(world, index, inWorld, seed, roomRows) {
  const rng = mulberry32(seed);
  const R = roomRows;
  const C = irnd(rng, 6, 10);
  const W = C * ROOM_W;
  const H = R * ROOM_H;
  const grid = makeGrid(W, H, '#');

  const rooms = {};
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const b = roomBounds(C, R, W, H, c, r);
      rooms[b.key] = b;
      for (let y = b.y0; y <= b.y1; y++) {
        for (let x = b.x0; x <= b.x1; x++) grid[y][x] = '.';
      }
    }
  }

  // a random tree over the rooms
  function nbrs(c, r) {
    const out = [];
    if (c > 0) out.push((c - 1) + ',' + r);
    if (c < C - 1) out.push((c + 1) + ',' + r);
    if (r > 0) out.push(c + ',' + (r - 1));
    if (r < R - 1) out.push(c + ',' + (r + 1));
    return out;
  }
  const startRoom = irnd(rng, 0, C - 1) + ',' + irnd(rng, 0, R - 1);
  const seen = {}; seen[startRoom] = true;
  const edges = [];
  const stack = [startRoom];
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const parts = cur.split(',');
    const open = shuffle(rng, nbrs(+parts[0], +parts[1])).filter(function (n) { return !seen[n]; });
    if (!open.length) { stack.pop(); continue; }
    const nxt = open[0];
    seen[nxt] = true;
    edges.push([cur, nxt]);
    stack.push(nxt);
  }

  const adj = {};
  Object.keys(rooms).forEach(function (k) { adj[k] = []; });
  edges.forEach(function (e) { adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); });

  // the flag goes in the room furthest away by room steps
  const dRoom = bfsRooms(adj, startRoom);
  let flagRoom = startRoom, far = -1;
  Object.keys(dRoom).forEach(function (k) {
    if (dRoom[k] > far || (dRoom[k] === far && rng() < 0.3)) { far = dRoom[k]; flagRoom = k; }
  });
  if (far < 2) return null;

  // the way from the start room to the flag room
  const parent = {}; parent[startRoom] = null;
  const q = [startRoom];
  let h = 0;
  while (h < q.length) {
    const cur = q[h++];
    adj[cur].forEach(function (n) { if (parent[n] === undefined) { parent[n] = cur; q.push(n); } });
  }
  const mainPath = [];
  for (let cur = flagRoom; cur !== null; cur = parent[cur]) mainPath.unshift(cur);
  const onMain = {};
  mainPath.forEach(function (k) { onMain[k] = true; });

  // dig every join
  const ladderCols = {};
  const doorEdges = [];
  function markCol(roomKey, x) {
    if (!ladderCols[roomKey]) ladderCols[roomKey] = {};
    ladderCols[roomKey][x] = true;
  }
  function carveEdge(a, b) {
    const A = rooms[a], B = rooms[b];
    if (A.r === B.r) {
      const lft = A.c < B.c ? A : B;
      const x = lft.wallCol;
      for (let y = lft.sr - 2; y <= lft.sr; y++) grid[y][x] = '.';
      return { type: 'h', x: x, y: lft.sr, room: lft.key };
    }
    const up = A.r < B.r ? A : B;
    const dn = A.r < B.r ? B : A;
    let x = irnd(rng, up.x0 + 2, up.x1 - 2);
    for (let y = up.sr; y <= dn.sr; y++) grid[y][x] = '|';
    markCol(up.key, x); markCol(dn.key, x);
    markCol(up.key, x - 1); markCol(dn.key, x - 1);
    markCol(up.key, x + 1); markCol(dn.key, x + 1);
    return { type: 'v', x: x, room: up.key };
  }
  const carved = edges.map(function (e) {
    const info = carveEdge(e[0], e[1]);
    info.a = e[0]; info.b = e[1];
    return info;
  });

  // the door goes on a side to side join that is on the way to the flag
  const mainEdges = carved.filter(function (e) {
    if (e.type !== 'h') return false;
    const ia = mainPath.indexOf(e.a), ib = mainPath.indexOf(e.b);
    return ia >= 0 && ib >= 0 && Math.abs(ia - ib) === 1;
  });
  if (!mainEdges.length) return null;
  const door = mainEdges[mainEdges.length - 1];
  for (let y = door.y - 2; y <= door.y; y++) grid[y][door.x] = '+';

  // rooms you can reach before the door
  const cutAdj = {};
  Object.keys(adj).forEach(function (k) { cutAdj[k] = adj[k].slice(); });
  cutAdj[door.a] = cutAdj[door.a].filter(function (k) { return k !== door.b; });
  cutAdj[door.b] = cutAdj[door.b].filter(function (k) { return k !== door.a; });
  const nearSide = bfsRooms(cutAdj, startRoom);
  const nearRooms = Object.keys(nearSide);
  if (nearRooms.length < 2) return null;

  // room space book keeping
  const taken = {};
  Object.keys(rooms).forEach(function (k) { taken[k] = {}; });
  Object.keys(ladderCols).forEach(function (k) {
    Object.keys(ladderCols[k]).forEach(function (x) { taken[k][x] = true; });
  });
  function spanFree(rk, x0, x1) {
    const b = rooms[rk];
    if (x0 < b.x0 || x1 > b.x1) return false;
    for (let x = x0; x <= x1; x++) if (taken[rk][x]) return false;
    return true;
  }
  function claim(rk, x0, x1) {
    for (let x = x0; x <= x1; x++) taken[rk][x] = true;
  }
  function findSpan(rk, wide, rng2) {
    const b = rooms[rk];
    const tries = shuffle(rng2, rangeList(b.x0, b.x1 - wide + 1));
    for (let i = 0; i < tries.length; i++) {
      if (spanFree(rk, tries[i], tries[i] + wide - 1)) return tries[i];
    }
    return -1;
  }
  function rangeList(a, b) {
    const out = [];
    for (let i = a; i <= b; i++) out.push(i);
    return out;
  }

  // the player and the flag
  const sb = rooms[startRoom];
  const px = findSpan(startRoom, 3, rng);
  if (px < 0) return null;
  grid[sb.sr][px + 1] = 'P';
  claim(startRoom, px, px + 2);
  const fb = rooms[flagRoom];
  const fx = findSpan(flagRoom, 3, rng);
  if (fx < 0) return null;
  grid[fb.sr][fx + 1] = 'F';
  claim(flagRoom, fx, fx + 2);

  // the key, on the near side of the door
  const keyRooms = shuffle(rng, nearRooms).sort(function (a, b2) {
    return (adj[a].length - adj[b2].length);
  });
  let keyPlaced = false;
  for (let i = 0; i < keyRooms.length && !keyPlaced; i++) {
    const rk = keyRooms[i];
    const x = findSpan(rk, 1, rng);
    if (x < 0) continue;
    grid[rooms[rk].sr][x] = 'k';
    claim(rk, x, x);
    keyPlaced = true;
  }
  if (!keyPlaced) return null;

  // three gems, each in its own hiding place
  const gemRooms = shuffle(rng, Object.keys(rooms)).sort(function (a, b2) {
    return (onMain[a] ? 1 : 0) - (onMain[b2] ? 1 : 0);
  });
  const gemMakers = shuffle(rng, ['box', 'chimney', 'spring']);
  let gemsDone = 0;
  let fakeWall = false;
  for (let i = 0; i < gemRooms.length && gemsDone < 3; i++) {
    const rk = gemRooms[i];
    const b = rooms[rk];
    const want = gemMakers[gemsDone];
    if (want === 'box') {
      const x = findSpan(rk, 6, rng);
      if (x < 0) continue;
      for (let k = 0; k < 5; k++) grid[b.sr - 2][x + k] = '#';
      grid[b.sr][x] = '%';
      grid[b.sr - 1][x] = '#';
      grid[b.sr][x + 4] = '#';
      grid[b.sr - 1][x + 4] = '#';
      grid[b.sr][x + 2] = 'g';
      grid[b.sr][x + 1] = 'o';
      grid[b.sr - 1][x + 2] = 'o';
      claim(rk, x, x + 5);
      fakeWall = true;
      gemsDone++;
    } else if (want === 'chimney') {
      if (b.sr - 13 < b.y0) continue;
      const x = findSpan(rk, 5, rng);
      if (x < 0) continue;
      const x0 = x + 1;
      for (let y = b.sr - 9; y <= b.sr - 1; y++) {
        grid[y][x0 - 1] = '#';
        grid[y][x0 + 3] = '#';
      }
      grid[b.sr - 11][x0 + 1] = '=';
      grid[b.sr - 11][x0 + 2] = '=';
      grid[b.sr - 12][x0 + 1] = 'g';
      grid[b.sr - 12][x0 + 2] = 'o';
      claim(rk, x, x + 4);
      gemsDone++;
    } else {
      if (b.sr - 8 < b.y0) continue;
      const x = findSpan(rk, 5, rng);
      if (x < 0) continue;
      const sx = x + 1;
      grid[b.sr][sx] = 'T';
      grid[b.sr - 6][sx + 1] = '=';
      grid[b.sr - 6][sx + 2] = '=';
      grid[b.sr - 7][sx + 1] = 'g';
      grid[b.sr - 7][sx + 2] = 'o';
      claim(rk, x, x + 4);
      gemsDone++;
    }
  }
  if (gemsDone < 3) return null;
  if (!fakeWall) return null;

  // a little furniture so the rooms are not empty boxes
  //
  // Every landing pad is at least four tiles wide and at most one jump above
  // the thing you jump from, and no hazard ever sits under a platform, so you
  // can never drop on to spikes you could not see.
  function platAbove(x, y) {
    for (let k = 1; k <= 9; k++) {
      const yy = y - k;
      if (yy < 0) break;
      const c = grid[yy][x];
      if (c === '=' || c === '/' || c === '#') return true;
    }
    return false;
  }
  function floorClear(x0, x1, y) {
    for (let x = x0; x <= x1; x++) if (platAbove(x, y)) return false;
    return true;
  }

  Object.keys(rooms).forEach(function (rk) {
    const b = rooms[rk];
    const tries = irnd(rng, 3, 5);
    for (let t = 0; t < tries; t++) {
      const kind = rng();
      if (kind < 0.34) {
        // two wide shelves, nearly on top of each other, one jump apart.
        // The span is one column wider than the shelves on each side, so
        // there is always a way to step off and drop back down.
        if (b.sr - 8 < b.y0) continue;
        const x = findSpan(rk, 7, rng);
        if (x < 0) continue;
        for (let k = 1; k <= 4; k++) grid[b.sr - 3][x + k] = '=';
        for (let k = 2; k <= 5; k++) grid[b.sr - 6][x + k] = '=';
        grid[b.sr - 4][x + 1] = 'o';
        grid[b.sr - 7][x + 4] = 'o';
        claim(rk, x, x + 6);
      } else if (kind < 0.5) {
        // one wide ledge, never more than one jump off the floor
        const x = findSpan(rk, 6, rng);
        if (x < 0) continue;
        const y = b.sr - irnd(rng, 3, 4);
        if (y - 1 < b.y0) continue;
        for (let k = 1; k <= 4; k++) grid[y][x + k] = '=';
        grid[y - 1][x + 2] = 'o';
        claim(rk, x, x + 5);
      } else if (kind < 0.68) {
        // spikes on the floor, two clear tiles either side and open sky above
        const n = irnd(rng, 1, 2);
        const x = findSpan(rk, n + 4, rng);
        if (x < 0) continue;
        if (!floorClear(x, x + n + 3, b.sr)) continue;
        for (let k = 0; k < n; k++) grid[b.sr][x + 2 + k] = '^';
        claim(rk, x, x + n + 3);
      } else if (kind < 0.88) {
        // a cracked step on the floor and a wide cracked ledge over it
        const x = findSpan(rk, 6, rng);
        if (x < 0) continue;
        grid[b.sr][x + 1] = '/';
        for (let k = 1; k <= 4; k++) grid[b.sr - 3][x + k] = '/';
        claim(rk, x, x + 5);
      } else if (LAVA_WORLDS.indexOf(world) >= 0) {
        // a lava pool wide enough to read from far off, two clear tiles
        // either side, and nothing above it to drop you in
        const n = 2;
        const x = findSpan(rk, n + 4, rng);
        if (x < 0) continue;
        if (!floorClear(x, x + n + 3, b.sr)) continue;
        for (let k = 0; k < n; k++) grid[b.sr][x + 2 + k] = '~';
        claim(rk, x, x + n + 3);
      }
    }
  });

  const rows0 = gridRows(grid);
  const solve = analyse(rows0);
  if (!solve || !solve.ok) return null;
  const keyTile = findAll(grid, 'k')[0];
  if (!solve.reachable(keyTile.x, keyTile.y)) return null;
  const gemTiles = findAll(grid, 'g');
  for (let i = 0; i < gemTiles.length; i++) {
    if (!solve.reachable(gemTiles[i].x, gemTiles[i].y)) return null;
    if (!solve.detour(gemTiles[i].x, gemTiles[i].y)) return null;
  }

  // enemies, at most three to a room
  //
  // They stand on the room floor or on a wide ledge, never on a small landing
  // pad, and never within two tiles of spikes or lava, so a knock back cannot
  // throw you into a hazard.
  function standWidth(x, y) {
    const r = y + 1;
    if (r >= H) return 0;
    if (SOLID_SET.indexOf(grid[r][x]) < 0) return 0;
    let a = x, z = x;
    while (a - 1 >= 0 && SOLID_SET.indexOf(grid[r][a - 1]) >= 0) a--;
    while (z + 1 < W && SOLID_SET.indexOf(grid[r][z + 1]) >= 0) z++;
    return z - a + 1;
  }
  function nearHazard(x, y) {
    for (let dy = 0; dy <= 1; dy++) {
      const yy = y + dy;
      if (yy >= H) break;
      for (let dx = -2; dx <= 2; dx++) {
        const xx = x + dx;
        if (xx < 0 || xx >= W) continue;
        const c = grid[yy][xx];
        if (c === '^' || c === '~') return true;
      }
    }
    return false;
  }
  function foeOk(s) {
    if (used(grid, s)) return false;
    if (roomOf(s.x, s.y) === startRoom) return false;
    if (nearHazard(s.x, s.y)) return false;
    return standWidth(s.x, s.y) >= 5;
  }

  const perRoom = {};
  const wantFoes = 12 + irnd(rng, 0, 6);
  const foeSpots = spread(rng, restSpots(grid, solve, 1, W - 1).filter(foeOk), wantFoes + 14, 5);
  let placed = 0;
  for (let i = 0; i < foeSpots.length && placed < wantFoes; i++) {
    const s = foeSpots[i];
    const rk = roomOf(s.x, s.y);
    if ((perRoom[rk] || 0) >= 3) continue;
    perRoom[rk] = (perRoom[rk] || 0) + 1;
    grid[s.y][s.x] = ENEMIES[world][placed % 2];
    placed++;
  }
  if (placed < 10) return null;

  // weapons, a star and a heart, tucked into side rooms when we can
  const sideSpots = restSpots(grid, solve, 1, W - 1).filter(function (s) {
    return !used(grid, s) && !onMain[roomOf(s.x, s.y)];
  });
  const anySpots = restSpots(grid, solve, 1, W - 1).filter(function (s) { return !used(grid, s); });
  const pool = sideSpots.length >= 4 ? sideSpots : anySpots;
  const gifts = [pick(rng, WEAPONS)];
  if (rng() < 0.5) gifts.push(pick(rng, WEAPONS));
  if (rng() < 0.6) gifts.push('*');
  gifts.push('H');
  if (inWorld === MAXUP_LEVEL[world]) gifts.push('M');
  if (rng() < 0.4) gifts.push('B');
  const giftSpots = spread(rng, pool, gifts.length, 6);
  giftSpots.forEach(function (s, i) { grid[s.y][s.x] = gifts[i]; });

  // coins as a trail
  const wantCoins = 30 + irnd(rng, 0, 14);
  const have = findAll(grid, 'o').length;
  const coinPool = restSpots(grid, solve, 1, W - 1).filter(function (s) { return !used(grid, s); });
  const coinSpots = spread(rng, coinPool, Math.max(0, wantCoins - have), 3);
  coinSpots.forEach(function (s) { grid[s.y][s.x] = 'o'; });

  return {
    name: LEVEL_NAMES[world][inWorld], world: world, boss: false,
    kind: 'maze', index: index, rows: gridRows(grid)
  };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function build() {
  const levels = [];
  for (let world = 0; world < 8; world++) {
    for (let i = 0; i < 6; i++) {
      const index = world * 6 + i;
      const boss = i === 5;
      const kind = (i === 2 || i === 4) ? 'maze' : 'run';
      const roomRows = (i === 4 && world >= 4) ? 3 : 2;
      let done = null;
      let last = ['no attempt made'];
      for (let att = 0; att < 140 && !done; att++) {
        const seed = 7 + index * 7919 + att * 997;
        let cand = null;
        try {
          if (boss) cand = buildBoss(world, index, i, seed);
          else if (kind === 'run') cand = buildRun(world, index, i, seed);
          else cand = buildMaze(world, index, i, seed, roomRows);
        } catch (err) {
          last = ['crash: ' + err.message];
          cand = null;
        }
        if (!cand) continue;
        const problems = checkLevel(cand);
        if (!problems.length) done = cand;
        else last = problems;
      }
      if (!done) {
        console.error('could not build level ' + index + ' (' + LEVEL_NAMES[world][i] + ')');
        last.slice(0, 6).forEach(function (p) { console.error('   ' + p); });
        process.exit(1);
      }
      levels.push(done);
      process.stdout.write('.');
    }
  }
  process.stdout.write('\n');
  return levels;
}

const levels = build();

// one max up per world at most
for (let world = 0; world < 8; world++) {
  let n = 0;
  levels.filter(function (l) { return l.world === world; }).forEach(function (l) {
    n += findAll(toGrid(l.rows), 'M').length;
  });
  if (n > 1) { console.error('world ' + world + ' has ' + n + ' max ups'); process.exit(1); }
}

const out = [];
out.push('/* Generated by tools/genlevels.cjs - do not edit by hand. */');
out.push('const LEVELS = [');
levels.forEach(function (lv, i) {
  out.push('  { name: \'' + lv.name + '\', world: ' + lv.world + ', boss: ' + lv.boss +
    ', kind: \'' + lv.kind + '\', rows: [');
  lv.rows.forEach(function (row, j) {
    out.push('    \'' + row + '\'' + (j === lv.rows.length - 1 ? '' : ','));
  });
  out.push('  ] }' + (i === levels.length - 1 ? '' : ','));
});
out.push('];');
out.push('');
fs.writeFileSync(OUT, out.join('\n'), 'utf8');

console.log('wrote ' + OUT);
console.log('');
console.log('idx  world         name              kind  size      foes coins gems');
levels.forEach(function (lv) {
  const g = toGrid(lv.rows);
  const foes = findAll(g, ALL_ENEMY_CH).length;
  const coins = findAll(g, 'o').length;
  const gems = findAll(g, 'g').length;
  console.log(
    String(lv.index).padStart(3) + '  ' +
    WORLD_NAMES[lv.world].padEnd(13) + ' ' +
    lv.name.padEnd(17) + ' ' +
    (lv.boss ? 'boss' : lv.kind).padEnd(5) + ' ' +
    (lv.rows[0].length + 'x' + lv.rows.length).padEnd(9) + ' ' +
    String(foes).padStart(4) + ' ' +
    String(coins).padStart(5) + ' ' +
    String(gems).padStart(4));
});

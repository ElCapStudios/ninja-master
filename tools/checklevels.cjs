// Checks the levels in levels.js. It reads the finished file, not the
// generator, so a bug in the generator cannot hide from it.
//
// It does two jobs:
//   1. it reads every grid and tests all of the safety rules;
//   2. it plays every level with a simple bot that only runs right and
//      jumps when it has to, and never uses the double jump.
//
// Run it with:  node tools\checklevels.cjs

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'levels.js');
const LEVELS = new Function(fs.readFileSync(FILE, 'utf8') + '\nreturn LEVELS;')();

const ROWS = 17;
const GROUND_TOP = 14;

const AIR = '.';
const WALKERS = 'ZSWUCNI';
const FLYERS = 'VY';
const STILL = 'G';
const BOSS_FOR_WORLD = ['K', 'J', 'Q', 'D', 'X'];
const ALL_BOSSES = 'KJQDX';
const ITEMS = 'HM*BR';
const LEGAL = '.#=^~ToPF' + WALKERS + FLYERS + STILL + ALL_BOSSES + ITEMS;

// things on the floor that must keep away from a hole edge
const FLOOR_DANGER = '^' + WALKERS;

const problems = [];
function fail(level, msg) { problems.push(level + ': ' + msg); }

// ---------------------------------------------------------------------------
// small helpers that read a grid
// ---------------------------------------------------------------------------

function at(rows, r, x) {
  if (r < 0 || r >= ROWS || x < 0 || x >= rows[0].length) return '#';
  return rows[r][x];
}
function isSolid(ch) { return ch === '#' || ch === '=' || ch === 'T'; }
function standable(rows, x) {
  for (let r = GROUND_TOP; r < ROWS; r++) {
    const ch = rows[r][x];
    if (ch === '#' || ch === 'T') return true;
  }
  return false;
}
function floorRow(rows, x) {
  if (!standable(rows, x)) return null;
  let r = ROWS - 1;
  while (r >= 0 && (rows[r][x] === '#' || rows[r][x] === 'T')) r--;
  return r + 1;
}
function each(rows, fn) {
  for (let r = 0; r < ROWS; r++) {
    for (let x = 0; x < rows[r].length; x++) fn(rows[r][x], r, x);
  }
}
function where(rows, set) {
  const list = [];
  each(rows, function (ch, r, x) { if (set.indexOf(ch) >= 0) list.push({ r: r, x: x, ch: ch }); });
  return list;
}

// ---------------------------------------------------------------------------
// the bot, using the real player numbers
// ---------------------------------------------------------------------------

const TILE = 16;
const PW = 10;
const PH = 15;
const GRAVITY = 0.45;
const MAX_FALL = 8;
const RUN = 2.1;
const JUMP = -7.6;
const SPRING = -10.8;

function blockedAt(rows, px, py, vy, fromY) {
  // is any solid tile inside the box at px, py
  const x0 = Math.floor(px / TILE), x1 = Math.floor((px + PW - 1) / TILE);
  const y0 = Math.floor(py / TILE), y1 = Math.floor((py + PH - 1) / TILE);
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const ch = at(rows, y, x);
      if (ch === '#' || ch === 'T') return ch;
      if (ch === '=') {
        // a plank is only solid when you come down on to it
        const plankTop = y * TILE;
        if (vy >= 0 && fromY + PH <= plankTop + 1) return '=';
      }
    }
  }
  return null;
}

function deadlyAt(rows, px, py) {
  const x0 = Math.floor((px + 2) / TILE), x1 = Math.floor((px + PW - 3) / TILE);
  const y0 = Math.floor((py + 2) / TILE), y1 = Math.floor((py + PH - 2) / TILE);
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const ch = at(rows, y, x);
      if (ch === '^' || ch === '~') return true;
    }
  }
  return false;
}

function playLevel(level) {
  const rows = level.rows;
  const W = rows[0].length;
  const start = where(rows, 'P')[0];
  const goalList = where(rows, 'F').concat(where(rows, ALL_BOSSES));
  const goalX = goalList[0].x;

  let px = start.x * TILE + 3;
  let py = start.r * TILE + (TILE - PH);
  let vy = 0;
  let onGround = false;
  let jumpsUsed = 0;

  for (let step = 0; step < 12000; step++) {
    // ---- decide ----
    const footTile = Math.floor((py + PH) / TILE);   // the row we stand on
    const frontTile = Math.floor((px + PW - 1) / TILE);
    let wantJump = false;
    if (onGround) {
      const ahead = frontTile + 1;
      if (ahead < W) {
        const chest = at(rows, footTile - 1, ahead);  // the row just above the floor
        if (!standable(rows, ahead)) wantJump = true;
        if (chest === '#' || chest === 'T') wantJump = true;
        if (chest === '^') wantJump = true;
        if (at(rows, footTile, ahead) === '~') wantJump = true;
      }
    }

    // ---- move sideways ----
    const oldX = px;
    px += RUN;
    if (blockedAt(rows, px, py, 0, py)) {
      px = oldX;
      if (onGround) wantJump = true;
    }

    // ---- jump ----
    if (wantJump && onGround) {
      vy = JUMP;
      onGround = false;
      jumpsUsed++;
    }

    // ---- move up and down ----
    vy = Math.min(vy + GRAVITY, MAX_FALL);
    const oldY = py;
    py += vy;
    const hit = blockedAt(rows, px, py, vy, oldY);
    if (hit) {
      if (vy > 0) {
        py = Math.floor((py + PH) / TILE) * TILE - PH;
        onGround = true;
        vy = hit === 'T' ? SPRING : 0;
        if (hit === 'T') onGround = false;
      } else {
        py = (Math.floor(py / TILE) + 1) * TILE;
        vy = 0;
      }
    } else {
      onGround = false;
    }

    if (deadlyAt(rows, px, py)) {
      return { ok: false, why: 'the bot died at col ' + Math.floor(px / TILE), jumps: jumpsUsed };
    }
    if (py > ROWS * TILE + 40) {
      return { ok: false, why: 'the bot fell off at col ' + Math.floor(px / TILE), jumps: jumpsUsed };
    }
    if (Math.floor(px / TILE) >= goalX) {
      return { ok: true, why: 'reached col ' + goalX + ' in ' + step + ' steps', jumps: jumpsUsed };
    }
  }
  return { ok: false, why: 'the bot ran out of time at col ' + Math.floor(px / TILE) };
}

// ---------------------------------------------------------------------------
// the rules
// ---------------------------------------------------------------------------

function checkOne(level, index) {
  const name = level.name + ' [' + index + ']';
  const rows = level.rows;

  // shape
  if (!Array.isArray(rows) || rows.length !== ROWS) {
    fail(name, 'needs ' + ROWS + ' rows, has ' + (rows ? rows.length : 0));
    return null;
  }
  const W = rows[0].length;
  rows.forEach(function (row, r) {
    if (row.length !== W) fail(name, 'row ' + r + ' is ' + row.length + ' wide, wanted ' + W);
  });

  // fields
  if (level.world !== Math.floor(index / 5)) fail(name, 'world should be ' + Math.floor(index / 5));
  const shouldBoss = index % 5 === 4;
  if (level.boss !== shouldBoss) fail(name, 'boss should be ' + shouldBoss);

  // only letters we know about
  each(rows, function (ch, r, x) {
    if (LEGAL.indexOf(ch) < 0) fail(name, 'strange letter "' + ch + '" at row ' + r + ' col ' + x);
  });

  // rule 7
  const starts = where(rows, 'P');
  const flags = where(rows, 'F');
  const bosses = where(rows, ALL_BOSSES);
  if (starts.length !== 1) fail(name, 'wants one P, found ' + starts.length);
  if (shouldBoss) {
    if (bosses.length !== 1) fail(name, 'wants one boss, found ' + bosses.length);
    if (flags.length !== 0) fail(name, 'a boss level must have no F');
    if (bosses.length === 1 && bosses[0].ch !== BOSS_FOR_WORLD[level.world]) {
      fail(name, 'wrong boss for world ' + level.world);
    }
  } else {
    if (flags.length !== 1) fail(name, 'wants one F, found ' + flags.length);
    if (bosses.length !== 0) fail(name, 'a normal level must have no boss');
  }
  if (!starts.length) return null;

  // rule 1: holes and lava runs of 3 or less
  let worstGap = 0;
  let run = 0;
  for (let x = 0; x <= W; x++) {
    if (x < W && !standable(rows, x)) {
      run++;
    } else {
      if (run > worstGap) worstGap = run;
      if (run > 3) fail(name, 'a gap of ' + run + ' columns ends at col ' + x);
      run = 0;
    }
  }

  // rule 2: floor dangers keep 3 columns from a hole
  where(rows, FLOOR_DANGER).forEach(function (d) {
    for (let i = d.x - 3; i <= d.x + 3; i++) {
      if (i < 0 || i >= W) continue;
      if (!standable(rows, i)) fail(name, '"' + d.ch + '" at col ' + d.x + ' is too near a hole');
    }
    if (floorRow(rows, d.x) === null || floorRow(rows, d.x) !== d.r + 1) {
      fail(name, '"' + d.ch + '" at col ' + d.x + ' is not standing on the floor');
    }
  });

  // rule 3: no plank above a floor danger, give or take 2 columns
  where(rows, FLOOR_DANGER).forEach(function (d) {
    for (let i = d.x - 2; i <= d.x + 2; i++) {
      if (i < 0 || i >= W) continue;
      for (let r = 0; r < d.r; r++) {
        if (rows[r][i] === '=') fail(name, 'a plank at col ' + i + ' is above "' + d.ch + '"');
      }
    }
  });

  // rule 4: no plank over a hole or lava
  where(rows, '=').forEach(function (p) {
    if (!standable(rows, p.x)) fail(name, 'a plank at col ' + p.x + ' hangs over a hole or lava');
  });

  // rule 5: the floor steps by 2 rows at most
  let lastFloor = null;
  for (let x = 0; x < W; x++) {
    const f = floorRow(rows, x);
    if (f === null) continue;
    if (lastFloor !== null && Math.abs(f - lastFloor) > 2) {
      fail(name, 'the floor steps ' + Math.abs(f - lastFloor) + ' rows at col ' + x);
    }
    lastFloor = f;
  }

  // rule 6: stars sit in the middle of a normal level
  if (!shouldBoss) {
    where(rows, '*').forEach(function (s) {
      const part = s.x / W;
      if (part < 0.35 || part > 0.65) {
        fail(name, 'a star at col ' + s.x + ' is at ' + Math.round(part * 100) + ' percent, wanted 35 to 65');
      }
    });
  }

  // rule 8: flyers and blobs keep away from the start and the flag
  where(rows, FLYERS + STILL).forEach(function (f) {
    if (Math.abs(f.x - starts[0].x) <= 3) fail(name, '"' + f.ch + '" is too near the start');
    if (flags.length && Math.abs(f.x - flags[0].x) <= 3) fail(name, '"' + f.ch + '" is too near the flag');
  });

  // rule 9: springs stand on the ground with 7 clear rows above
  where(rows, 'T').forEach(function (t) {
    if (at(rows, t.r + 1, t.x) !== '#') fail(name, 'the spring at col ' + t.x + ' has no ground under it');
    for (let i = 1; i <= 7; i++) {
      if (isSolid(at(rows, t.r - i, t.x))) fail(name, 'the spring at col ' + t.x + ' is blocked above');
    }
  });

  // rule 10: a clear start, and nothing nasty by the flag
  const px = starts[0].x;
  for (let i = px - 3; i <= px + 3; i++) {
    if (i < 0 || i >= W) continue;
    for (let r = 0; r < ROWS; r++) {
      const ch = rows[r][i];
      if (ch === AIR || ch === '#') continue;
      if (r === starts[0].r && i === px) continue;
      fail(name, '"' + ch + '" is too near the start at col ' + i);
    }
  }
  if (flags.length) {
    const nasty = FLOOR_DANGER + FLYERS + STILL + ALL_BOSSES + '~';
    for (let i = flags[0].x - 3; i <= flags[0].x + 3; i++) {
      if (i < 0 || i >= W) continue;
      for (let r = 0; r < ROWS; r++) {
        if (nasty.indexOf(rows[r][i]) >= 0) fail(name, 'something nasty is near the flag at col ' + i);
      }
    }
  }

  // P and F must stand on the ground
  if (at(rows, starts[0].r + 1, px) !== '#') fail(name, 'P has no ground under it');
  if (flags.length && at(rows, flags[0].r + 1, flags[0].x) !== '#') fail(name, 'F has no ground under it');

  // boss levels want a wide clear arena
  if (shouldBoss && bosses.length === 1) {
    const bx = bosses[0].x;
    let clear = 0;
    for (let i = bx - 10; i <= bx + 10; i++) {
      if (i < 0 || i >= W) { fail(name, 'the arena runs off the map'); break; }
      let plain = true;
      for (let r = 0; r < ROWS; r++) {
        const want = r >= GROUND_TOP ? '#' : AIR;
        if (rows[r][i] !== want && !(r === bosses[0].r && i === bx)) plain = false;
      }
      if (plain) clear++;
    }
    if (clear < 21) fail(name, 'the boss arena has only ' + clear + ' clear columns, wanted 21');
    if (where(rows, '^~').length) fail(name, 'a boss level must have no spikes and no lava');
  }

  // width bands
  const bands = [[120, 140], [135, 155], [150, 170], [160, 180], [170, 200]];
  if (shouldBoss) {
    if (W < 64 || W > 80) fail(name, 'a boss level is ' + W + ' wide, wanted 64 to 80');
  } else {
    const band = bands[level.world];
    if (W < band[0] || W > band[1]) {
      fail(name, 'is ' + W + ' wide, wanted ' + band[0] + ' to ' + band[1]);
    }
  }

  // the bot has to be able to finish
  const run2 = playLevel(level);
  if (!run2.ok) fail(name, 'the bot could not finish: ' + run2.why);

  return {
    index: index,
    world: level.world,
    name: level.name,
    width: W,
    foes: where(rows, WALKERS + FLYERS + STILL + ALL_BOSSES).length,
    coins: where(rows, 'o').length,
    items: where(rows, ITEMS).length,
    gap: worstGap,
    bot: run2.ok ? 'ok' : 'FAILED'
  };
}

// ---------------------------------------------------------------------------
// go
// ---------------------------------------------------------------------------

if (LEVELS.length !== 25) fail('levels.js', 'has ' + LEVELS.length + ' levels, wanted 25');

const table = [];
LEVELS.forEach(function (level, i) {
  const line = checkOne(level, i);
  if (line) table.push(line);
});

function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
function padLeft(s, n) { s = String(s); while (s.length < n) s = ' ' + s; return s; }

console.log('');
console.log(pad('idx', 4) + pad('world', 6) + pad('name', 15) + padLeft('width', 6) +
  padLeft('foes', 6) + padLeft('coins', 6) + padLeft('items', 6) + padLeft('gap', 5) + padLeft('bot', 6));
console.log(new Array(60).join('-'));
table.forEach(function (r) {
  console.log(pad(r.index, 4) + pad(r.world, 6) + pad(r.name, 15) + padLeft(r.width, 6) +
    padLeft(r.foes, 6) + padLeft(r.coins, 6) + padLeft(r.items, 6) + padLeft(r.gap, 5) + padLeft(r.bot, 6));
});
console.log('');

if (problems.length) {
  console.log('FOUND ' + problems.length + ' PROBLEMS');
  problems.forEach(function (p) { console.log('  ' + p); });
  process.exit(1);
}
console.log('all 25 levels passed every rule, and the bot finished all 25');

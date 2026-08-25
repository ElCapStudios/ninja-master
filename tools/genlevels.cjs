// Builds the level maps for Ninja Master and writes levels.js.
//
// How it works:
//   1. There is a library of small hand made pieces called chunks.
//      Every chunk starts and ends on plain flat ground, so any two
//      chunks can be joined together and the join is always safe.
//   2. Each level picks a list of chunks with a repeatable random
//      number generator, so levels are long, busy and all different,
//      but they come out the same every time you run this file.
//   3. Power ups are dropped in afterwards, into safe empty spots.
//   4. Every finished level is checked against the safety rules.
//      If one rule is broken this file throws an error and writes nothing.
//
// Run it with:  node tools\genlevels.cjs

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'levels.js');

const H = 17;          // every level is 17 rows tall
const GROUND_TOP = 14; // rows 14, 15 and 16 are the normal ground
const STAND = 13;      // a thing that stands on the normal ground sits here

// ---------------------------------------------------------------------------
// characters
// ---------------------------------------------------------------------------

const WALK_ENEMIES = ['Z', 'S', 'W', 'U', 'C', 'N', 'I'];
const FLYERS = ['V', 'Y'];
const STATIONARY = ['G'];
const BOSSES = ['K', 'J', 'Q', 'D', 'X'];
const ITEMS = ['H', 'M', '*', 'B', 'R'];
const SOLID = ['#', '=', 'T'];

// Things that stand on the floor and hurt you. These must keep away from
// the edge of a hole, or you land on them at the end of a jump.
const GROUND_DANGER = ['^'].concat(WALK_ENEMIES);

const WORLD_NAMES = ['Green Woods', 'Frost Peak', 'Sand Tomb', 'Fire Keep', 'Shadow Fort'];
const WALKERS_BY_WORLD = [['Z', 'S'], ['W'], ['U', 'C'], ['I'], ['N']];
const FLYERS_BY_WORLD = [[], ['V'], [], [], ['Y']];
const BLOBS_BY_WORLD = [[], [], [], ['G'], []];

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

function pickOne(list, rng) {
  return list[Math.floor(rng() * list.length) % list.length];
}

// ---------------------------------------------------------------------------
// a drawing board for one chunk or one whole hand made level
// ---------------------------------------------------------------------------

function canvas(name, width) {
  const cells = [];
  for (let r = 0; r < H; r++) cells.push(new Array(width).fill('.'));

  function need(r, x, what) {
    if (r < 0 || r >= H || x < 0 || x >= width) {
      throw new Error(name + ': "' + what + '" at row ' + r + ' col ' + x + ' is off the map');
    }
  }

  const slots = [];

  const api = {
    name: name,
    width: width,
    cells: cells,
    slots: slots,

    fill: function (r0, r1, x0, x1, ch) {
      for (let r = r0; r <= r1; r++) {
        for (let x = x0; x <= x1; x++) {
          need(r, x, ch);
          cells[r][x] = ch;
        }
      }
    },

    // put one thing down. Two things may never share a cell.
    put: function (r, x, ch) {
      need(r, x, ch);
      if (cells[r][x] !== '.') {
        throw new Error(name + ': two things share row ' + r + ' col ' + x);
      }
      cells[r][x] = ch;
    },

    ground: function (x0, x1, top) { api.fill(top, H - 1, x0, x1, '#'); },
    carve: function (x0, x1) { api.fill(GROUND_TOP, H - 1, x0, x1, '.'); },
    lava: function (x0, x1) { api.fill(GROUND_TOP, H - 1, x0, x1, '~'); },
    plat: function (r, x0, x1) { for (let x = x0; x <= x1; x++) api.put(r, x, '='); },
    coins: function (r, x0, x1) { for (let x = x0; x <= x1; x++) api.put(r, x, 'o'); },
    coin: function (r, x) { api.put(r, x, 'o'); },
    spikes: function (x0, x1) { for (let x = x0; x <= x1; x++) api.put(STAND, x, '^'); },

    // a good empty place for a power up, saved for later
    slot: function (r, x) { slots.push([r, x]); }
  };

  api.ground(0, width - 1, GROUND_TOP);
  return api;
}

// ---------------------------------------------------------------------------
// the chunk library
// ---------------------------------------------------------------------------
//
// Chunk contract, checked by checkChunk below:
//   - the first 2 and the last 2 columns are plain ground with clear air
//     above them, so joins are always safe;
//   - nothing that hurts you lives in the first 3 or the last 3 columns;
//   - holes, lava and platforms stay inside the middle of the chunk.

function chunk(name, width, tags, build) {
  return { name: name, width: width, tags: tags, build: build };
}

const CHUNKS = [
  chunk('coin-arc', 14, ['coin', 'easy'], function (a) {
    a.coin(12, 3); a.coin(11, 4); a.coin(10, 5);
    a.coin(10, 6); a.coin(11, 7); a.coin(12, 8);
    a.plat(11, 9, 11);
  }),

  chunk('hop-two', 12, ['hole', 'easy'], function (a) {
    a.carve(5, 6);
    a.coins(12, 5, 6);
  }),

  chunk('hop-three', 16, ['hole'], function (a) {
    a.carve(8, 10);
    a.coins(12, 8, 10);
    a.plat(11, 2, 5); a.coins(10, 2, 5);
  }),

  chunk('lava-small', 13, ['lava'], function (a) {
    a.lava(5, 6);
    a.coins(12, 5, 6);
  }),

  chunk('lava-wide', 16, ['lava'], function (a) {
    a.lava(7, 9);
    a.coins(12, 7, 9);
    a.plat(11, 2, 4); a.coins(10, 2, 4);
  }),

  chunk('lava-pair', 18, ['lava'], function (a) {
    a.lava(4, 5); a.lava(10, 11);
    a.coins(12, 4, 5); a.coins(12, 10, 11);
    a.plat(11, 14, 15); a.coins(10, 14, 15);
  }),

  chunk('lava-step', 16, ['lava', 'step'], function (a) {
    a.lava(5, 6);
    a.ground(9, 13, 12);
    a.coins(12, 5, 6);
    a.coins(11, 10, 12);
  }),

  chunk('step-up', 14, ['step', 'easy'], function (a) {
    a.ground(5, 9, 12);
    a.coins(11, 6, 8);
  }),

  chunk('staircase', 18, ['step'], function (a) {
    const tops = [13, 13, 12, 12, 11, 11, 10, 10, 10, 11, 11, 12, 12, 13];
    for (let i = 0; i < tops.length; i++) a.ground(2 + i, 2 + i, tops[i]);
    a.coins(9, 8, 10);
    a.coins(11, 4, 5);
  }),

  chunk('spikes-side-plat', 16, ['spike'], function (a) {
    a.spikes(8, 9);
    a.coins(12, 8, 9);
    a.plat(11, 2, 5); a.coins(10, 3, 5);
  }),

  chunk('spike-pair', 20, ['spike', 'hard'], function (a) {
    a.spikes(5, 6); a.spikes(11, 12);
    a.coins(12, 5, 6); a.coins(12, 11, 12);
    a.plat(11, 15, 17); a.coins(10, 15, 17);
  }),

  chunk('low-plat', 14, ['plat', 'coin'], function (a) {
    a.plat(11, 3, 8); a.coins(10, 3, 8);
    a.coins(13, 10, 11);
  }),

  chunk('plat-stack', 16, ['plat'], function (a) {
    a.plat(11, 2, 5); a.coins(10, 2, 5);
    a.plat(9, 8, 12); a.coins(8, 8, 12);
  }),

  chunk('tower', 18, ['plat', 'item'], function (a) {
    a.plat(11, 3, 6); a.coins(10, 3, 4);
    a.plat(9, 7, 10); a.coins(8, 7, 8);
    a.plat(7, 11, 14); a.coins(6, 11, 12);
    a.slot(6, 14);
  }),

  chunk('spring-high', 14, ['spring', 'item'], function (a) {
    a.put(STAND, 6, 'T');
    a.plat(5, 4, 8);
    a.coins(4, 4, 5); a.coins(4, 7, 8);
    a.slot(4, 6);
  }),

  chunk('spring-pit', 16, ['spring', 'hole'], function (a) {
    a.carve(4, 6);
    a.coins(12, 4, 6);
    a.put(STAND, 10, 'T');
    a.plat(5, 9, 12); a.coins(4, 9, 12);
  }),

  chunk('spring-plats', 18, ['spring', 'plat'], function (a) {
    a.put(STAND, 5, 'T');
    a.plat(5, 3, 7); a.coins(4, 3, 7);
    a.plat(11, 10, 14); a.coins(10, 10, 14);
  }),

  chunk('enemy-flat', 14, ['enemy'], function (a, ctx) {
    a.put(STAND, 7, ctx.walker());
    a.coins(13, 10, 11);
  }),

  chunk('enemy-pair', 18, ['enemy', 'hard'], function (a, ctx) {
    a.put(STAND, 6, ctx.walker());
    a.put(STAND, 11, ctx.walker());
    a.coins(12, 2, 3);
    a.plat(11, 14, 15); a.coins(10, 14, 15);
  }),

  chunk('enemy-block', 16, ['enemy', 'step'], function (a, ctx) {
    a.ground(5, 10, 12);
    a.put(11, 8, ctx.walker());
    a.coins(11, 5, 6);
  }),

  chunk('enemy-pit', 18, ['enemy', 'hole'], function (a, ctx) {
    a.carve(8, 10);
    a.coins(12, 8, 10);
    a.put(STAND, 14, ctx.walker());
    a.plat(11, 2, 5); a.coins(10, 2, 5);
  }),

  chunk('flyer-hole', 16, ['flyer', 'hole'], function (a, ctx) {
    a.carve(8, 10);
    a.coins(12, 8, 10);
    a.put(9, 9, ctx.flyer());
    a.plat(11, 2, 5); a.coins(10, 2, 5);
  }),

  chunk('flyer-flat', 14, ['flyer'], function (a, ctx) {
    a.put(10, 6, ctx.flyer());
    a.coins(12, 2, 4);
  }),

  chunk('flyer-plat', 18, ['flyer', 'plat'], function (a, ctx) {
    a.put(8, 8, ctx.flyer());
    a.plat(11, 3, 6); a.coins(10, 3, 6);
    a.plat(11, 11, 14); a.coins(10, 11, 14);
  }),

  chunk('gauntlet', 20, ['hole', 'hard'], function (a) {
    a.carve(4, 5); a.carve(9, 10); a.carve(14, 15);
    a.coins(12, 4, 5); a.coins(12, 14, 15);
  }),

  chunk('coin-room', 18, ['coin', 'plat'], function (a) {
    a.plat(11, 3, 7); a.coins(10, 3, 7);
    a.plat(9, 9, 14); a.coins(8, 9, 14);
  }),

  chunk('rest-stop', 13, ['rest', 'item', 'easy'], function (a) {
    a.coins(12, 3, 5);
    a.slot(STAND, 8);
    a.coins(12, 9, 10);
  }),

  chunk('mixed-trouble', 18, ['spike', 'enemy', 'hard'], function (a, ctx) {
    a.put(STAND, 5, ctx.walker());
    a.spikes(10, 11);
    a.coins(12, 10, 11);
    a.plat(11, 14, 15); a.coins(10, 14, 15);
  }),

  chunk('lava-blob', 16, ['lava', 'blob'], function (a, ctx) {
    a.lava(7, 9);
    a.put(STAND, 8, ctx.blob());
    a.coin(11, 7); a.coin(11, 9);
    a.plat(11, 2, 4); a.coins(10, 2, 4);
  }),

  chunk('blob-flat', 14, ['blob'], function (a, ctx) {
    a.put(STAND, 7, ctx.blob());
    a.coins(12, 2, 4);
  }),

  chunk('long-plats', 20, ['plat', 'coin'], function (a) {
    a.plat(11, 2, 7); a.coins(10, 2, 7);
    a.plat(9, 9, 13); a.coins(8, 9, 13);
    a.plat(11, 15, 17); a.coins(10, 15, 17);
  }),

  chunk('coin-hill', 16, ['step', 'coin', 'easy'], function (a) {
    a.ground(4, 11, 13);
    a.coins(12, 5, 9);
  }),

  chunk('two-holes-plat', 18, ['hole', 'plat'], function (a) {
    a.carve(3, 4); a.carve(13, 14);
    a.coins(12, 3, 4);
    a.plat(11, 8, 10); a.coins(10, 8, 10);
  }),

  chunk('zigzag', 20, ['plat'], function (a) {
    a.plat(11, 2, 4);
    a.plat(9, 6, 8); a.coins(8, 6, 8);
    a.plat(11, 10, 12);
    a.plat(9, 14, 17); a.coins(8, 14, 17);
  }),

  chunk('spike-step', 16, ['spike', 'step'], function (a) {
    a.ground(8, 13, 12);
    a.spikes(4, 5);
    a.coins(12, 4, 5);
    a.coins(11, 9, 12);
  }),

  chunk('mini-coins', 9, ['filler', 'coin', 'easy'], function (a) {
    a.coins(12, 3, 6);
  }),

  chunk('mini-hole', 10, ['filler', 'hole'], function (a) {
    a.carve(4, 5);
    a.coins(12, 4, 5);
  }),

  chunk('mini-step', 10, ['filler', 'step'], function (a) {
    a.ground(4, 6, 13);
    a.coins(12, 4, 6);
  })
];

// How much each world likes each kind of chunk. A zero means never.
const WORLD_BIAS = [
  // world 0, Green Woods: gentle, lots of coins and small hops
  { easy: 3, coin: 2, plat: 2, step: 2, hole: 1.5, enemy: 1.5, spike: 0.4,
    lava: 0.1, spring: 0.6, flyer: 0, blob: 0, hard: 0.3, rest: 1, item: 1, filler: 1 },
  // world 1, Frost Peak: springs, platforms and bats
  { easy: 1, coin: 1, plat: 2.5, step: 1, hole: 1.5, enemy: 1, spike: 0.6,
    lava: 0.3, spring: 3, flyer: 3, blob: 0, hard: 0.8, rest: 1, item: 1.5, filler: 1 },
  // world 2, Sand Tomb: spikes, slow mummies and coin rooms
  { easy: 0.8, coin: 2, plat: 1.2, step: 2, hole: 1.2, enemy: 2, spike: 3,
    lava: 0.5, spring: 0.8, flyer: 0, blob: 0, hard: 1.2, rest: 1, item: 1, filler: 1 },
  // world 3, Fire Keep: lava and lava blobs
  { easy: 0.6, coin: 1, plat: 1, step: 1, hole: 1.2, enemy: 1.5, spike: 1.2,
    lava: 3, spring: 1, flyer: 0, blob: 3, hard: 1.5, rest: 0.8, item: 1, filler: 1 },
  // world 4, Shadow Fort: ghosts, dart ninjas and long platform runs
  { easy: 0.5, coin: 1, plat: 2.5, step: 1, hole: 1.5, enemy: 2, spike: 1.5,
    lava: 1, spring: 1.2, flyer: 3, blob: 0, hard: 2, rest: 0.8, item: 1, filler: 1 }
];

function chunkWeight(c, world) {
  const bias = WORLD_BIAS[world];
  let sum = 0;
  for (let i = 0; i < c.tags.length; i++) {
    const m = bias[c.tags[i]] === undefined ? 1 : bias[c.tags[i]];
    if (m === 0) return 0;
    sum += m;
  }
  return sum / c.tags.length;
}

// ---------------------------------------------------------------------------
// building one chunk
// ---------------------------------------------------------------------------

function buildChunk(c, ctx) {
  const a = canvas(c.name, c.width);
  c.build(a, ctx);
  checkChunk(a, c);
  return a;
}

function checkChunk(a, c) {
  const w = a.width;
  const cells = a.cells;
  const edge = [0, 1, w - 2, w - 1];
  edge.forEach(function (x) {
    for (let r = 0; r < H; r++) {
      const want = r >= GROUND_TOP ? '#' : '.';
      if (cells[r][x] !== want) {
        throw new Error(c.name + ': edge column ' + x + ' must be plain ground, found "' + cells[r][x] + '"');
      }
    }
  });
  for (let x = 0; x < w; x++) {
    for (let r = 0; r < H; r++) {
      const ch = cells[r][x];
      if (GROUND_DANGER.indexOf(ch) >= 0 && (x < 3 || x > w - 4)) {
        throw new Error(c.name + ': danger "' + ch + '" too close to the chunk edge at col ' + x);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// reading a finished grid
// ---------------------------------------------------------------------------

function isSolid(ch) { return SOLID.indexOf(ch) >= 0; }

// true when you can stand on this column
function supported(cells, x) {
  for (let r = GROUND_TOP; r < H; r++) {
    if (cells[r][x] === '#' || cells[r][x] === 'T') return true;
  }
  return false;
}

// the row you stand on in this column, or null for a hole or lava
function groundTop(cells, x) {
  if (!supported(cells, x)) return null;
  let r = H - 1;
  while (r >= 0 && (cells[r][x] === '#' || cells[r][x] === 'T')) r--;
  return r + 1;
}

function findAll(cells, wanted) {
  const found = [];
  for (let r = 0; r < H; r++) {
    for (let x = 0; x < cells[r].length; x++) {
      if (wanted.indexOf(cells[r][x]) >= 0) found.push([r, x, cells[r][x]]);
    }
  }
  return found;
}

function gapRuns(cells, width) {
  const runs = [];
  let start = -1;
  for (let x = 0; x < width; x++) {
    if (!supported(cells, x)) {
      if (start < 0) start = x;
    } else if (start >= 0) {
      runs.push([start, x - 1]);
      start = -1;
    }
  }
  if (start >= 0) runs.push([start, width - 1]);
  return runs;
}

// ---------------------------------------------------------------------------
// the safety rules
// ---------------------------------------------------------------------------

function checkLevel(level) {
  const name = level.name;
  const cells = level.cells;
  const W = cells[0].length;
  const bad = function (msg) { throw new Error(name + ': ' + msg); };

  // rule 11: 17 rows, all the same length
  if (cells.length !== H) bad('has ' + cells.length + ' rows, needs ' + H);
  cells.forEach(function (row, r) {
    if (row.length !== W) bad('row ' + r + ' is ' + row.length + ' wide, needs ' + W);
  });

  // rule 1: a hole or lava run is 3 columns or less
  const runs = gapRuns(cells, W);
  let worstGap = 0;
  runs.forEach(function (run) {
    const size = run[1] - run[0] + 1;
    if (size > worstGap) worstGap = size;
    if (size > 3) bad('a gap of ' + size + ' columns at ' + run[0] + ' is too wide');
  });

  // extra rule: never more than 2 spikes in a row, so one jump clears them
  for (let r = 0; r < H; r++) {
    let run = 0;
    for (let x = 0; x < W; x++) {
      run = cells[r][x] === '^' ? run + 1 : 0;
      if (run > 2) bad('more than 2 spikes in a row at col ' + x);
    }
  }

  // rules 2 and 3: floor dangers keep away from holes and from platforms
  findAll(cells, GROUND_DANGER).forEach(function (item) {
    const r = item[0], x = item[1], ch = item[2];
    for (let i = x - 3; i <= x + 3; i++) {
      if (i < 0 || i >= W) continue;
      if (!supported(cells, i)) bad('"' + ch + '" at col ' + x + ' is too near a hole');
    }
    for (let i = x - 2; i <= x + 2; i++) {
      if (i < 0 || i >= W) continue;
      for (let rr = 0; rr < r; rr++) {
        if (cells[rr][i] === '=') bad('a platform sits above "' + ch + '" at col ' + x);
      }
    }
  });

  // rule 4: no platform above a hole or lava
  findAll(cells, ['=']).forEach(function (item) {
    if (!supported(cells, item[1])) bad('a platform at col ' + item[1] + ' hangs over a hole or lava');
  });

  // rule 5: the floor never steps more than 2 rows at once
  for (let x = 0; x + 1 < W; x++) {
    const a = groundTop(cells, x), b = groundTop(cells, x + 1);
    if (a !== null && b !== null && Math.abs(a - b) > 2) {
      bad('the floor jumps ' + Math.abs(a - b) + ' rows between col ' + x + ' and ' + (x + 1));
    }
  }
  runs.forEach(function (run) {
    if (run[0] === 0 || run[1] === W - 1) return;
    const a = groundTop(cells, run[0] - 1), b = groundTop(cells, run[1] + 1);
    if (Math.abs(a - b) > 2) bad('the floor jumps ' + Math.abs(a - b) + ' rows across the hole at col ' + run[0]);
  });

  // extra rule: room to walk, and room to jump near a hole
  for (let x = 0; x < W; x++) {
    const top = groundTop(cells, x);
    if (top === null) continue;
    for (let i = 1; i <= 2; i++) {
      if (top - i >= 0 && isSolid(cells[top - i][x])) bad('no room to walk at col ' + x);
    }
  }
  runs.forEach(function (run) {
    for (let x = run[0] - 2; x <= run[1] + 2; x++) {
      if (x < 0 || x >= W) continue;
      const top = groundTop(cells, x);
      if (top === null) continue;
      for (let i = 1; i <= 4; i++) {
        if (top - i >= 0 && isSolid(cells[top - i][x])) bad('no room to jump the hole at col ' + x);
      }
    }
  });

  // rule 9: a spring stands on the ground with 7 clear rows above it
  findAll(cells, ['T']).forEach(function (item) {
    const r = item[0], x = item[1];
    if (r + 1 >= H || cells[r + 1][x] !== '#') bad('the spring at col ' + x + ' has no ground under it');
    for (let i = 1; i <= 7; i++) {
      if (r - i >= 0 && isSolid(cells[r - i][x])) bad('the spring at col ' + x + ' is blocked above');
    }
  });

  // rule 7: one start, one flag or one boss
  const starts = findAll(cells, ['P']);
  const flags = findAll(cells, ['F']);
  const bosses = findAll(cells, BOSSES);
  if (starts.length !== 1) bad('needs exactly one P, found ' + starts.length);
  if (level.boss) {
    if (bosses.length !== 1) bad('a boss level needs exactly one boss, found ' + bosses.length);
    if (flags.length !== 0) bad('a boss level must not have a flag');
  } else {
    if (flags.length !== 1) bad('needs exactly one F, found ' + flags.length);
    if (bosses.length !== 0) bad('a normal level must not have a boss');
  }

  const px = starts[0][1];
  if (cells[starts[0][0] + 1][px] !== '#') bad('P has no ground under it');

  // rule 10: nothing at all near the start
  for (let i = px - 3; i <= px + 3; i++) {
    if (i < 0 || i >= W) continue;
    for (let r = 0; r < H; r++) {
      const ch = cells[r][i];
      if (ch === '.' || ch === '#' || (r === starts[0][0] && i === px)) continue;
      bad('"' + ch + '" is too close to the start at col ' + i);
    }
  }

  // rule 10: nothing dangerous near the flag
  const nasty = GROUND_DANGER.concat(FLYERS, STATIONARY, BOSSES, ['~']);
  if (flags.length) {
    const fx = flags[0][1];
    if (cells[flags[0][0] + 1][fx] !== '#') bad('F has no ground under it');
    for (let i = fx - 3; i <= fx + 3; i++) {
      if (i < 0 || i >= W) continue;
      for (let r = 0; r < H; r++) {
        if (nasty.indexOf(cells[r][i]) >= 0) bad('something nasty is too close to the flag at col ' + i);
      }
    }
  }

  // rule 8: flying things and blobs keep away from the start and the flag
  findAll(cells, FLYERS.concat(STATIONARY)).forEach(function (item) {
    const x = item[1];
    if (Math.abs(x - px) <= 3) bad('"' + item[2] + '" is too close to the start at col ' + x);
    if (flags.length && Math.abs(x - flags[0][1]) <= 3) {
      bad('"' + item[2] + '" is too close to the flag at col ' + x);
    }
  });

  // rule 6: a star sits in the middle of a normal level
  if (!level.boss) {
    findAll(cells, ['*']).forEach(function (item) {
      const frac = item[1] / W;
      if (frac < 0.35 || frac > 0.65) {
        bad('a star at col ' + item[1] + ' is not in the middle (' + Math.round(frac * 100) + ' percent)');
      }
    });
  }

  // boss levels need a big clear arena
  if (level.boss) {
    const bx = bosses[0][1];
    for (let i = bx - 10; i <= bx + 10; i++) {
      if (i < 0 || i >= W) bad('the boss arena runs off the map at col ' + i);
      for (let r = 0; r < H; r++) {
        const ch = cells[r][i];
        const want = r >= GROUND_TOP ? '#' : '.';
        if (ch !== want && !(r === bosses[0][0] && i === bx)) {
          bad('the boss arena is not clear at row ' + r + ' col ' + i);
        }
      }
    }
  }

  // the ground route must work for a bot that runs right and jumps
  botWalk(level, cells, W, px, flags.length ? flags[0][1] : bosses[0][1], bad);

  return worstGap;
}

// A very simple bot. It walks right on the ground, steps up 2 rows at most
// and jumps over holes of 3 columns at most.
function botWalk(level, cells, W, from, to, bad) {
  let x = from;
  let guard = 0;
  while (x < to) {
    if (guard++ > W * 2) bad('the bot got stuck at col ' + x);
    const here = groundTop(cells, x);
    let next = x + 1;
    while (next < W && !supported(cells, next)) next++;
    if (next >= W) bad('the bot fell off the end at col ' + x);
    if (next - x - 1 > 3) bad('the bot cannot jump ' + (next - x - 1) + ' columns at col ' + x);
    const there = groundTop(cells, next);
    if (here !== null && there !== null && there < here - 2) {
      bad('the bot cannot climb ' + (here - there) + ' rows at col ' + next);
    }
    x = next;
  }
}

// ---------------------------------------------------------------------------
// power ups
// ---------------------------------------------------------------------------

function itemSpots(cells, W, extraSlots) {
  const spots = [];
  const dangerCols = [];
  findAll(cells, GROUND_DANGER.concat(FLYERS, STATIONARY, ['~'])).forEach(function (d) {
    dangerCols.push(d[1]);
  });
  const nearDanger = function (x) {
    for (let i = 0; i < dangerCols.length; i++) {
      if (Math.abs(dangerCols[i] - x) <= 3) return true;
    }
    return false;
  };
  const startCol = findAll(cells, ['P'])[0][1];
  const flag = findAll(cells, ['F']);
  const flagCol = flag.length ? flag[0][1] : -99;
  const tooNearEnds = function (x) {
    return Math.abs(x - startCol) <= 6 || Math.abs(x - flagCol) <= 5;
  };

  extraSlots.forEach(function (s) {
    if (cells[s[0]][s[1]] === '.' && !tooNearEnds(s[1]) && !nearDanger(s[1])) {
      spots.push({ r: s[0], x: s[1], kind: 'slot' });
    }
  });

  for (let x = 2; x < W - 2; x++) {
    if (tooNearEnds(x) || nearDanger(x)) continue;
    const top = groundTop(cells, x);
    if (top === null) continue;
    let solidNear = true;
    for (let i = x - 2; i <= x + 2; i++) {
      if (i < 0 || i >= W || groundTop(cells, i) !== top) solidNear = false;
    }
    const r = top - 1;
    if (solidNear && cells[r][x] === '.' && cells[r][x - 1] === '.' && cells[r][x + 1] === '.') {
      spots.push({ r: r, x: x, kind: 'ground' });
    }
    for (let rr = 4; rr < GROUND_TOP; rr++) {
      if (cells[rr][x] === '=' && cells[rr - 1][x] === '.' &&
          cells[rr - 1][x - 1] === '.' && cells[rr - 1][x + 1] === '.') {
        spots.push({ r: rr - 1, x: x, kind: 'plat' });
      }
    }
  }
  return spots;
}

function placeItem(level, spots, taken, ch, wants, rng) {
  const tries = [
    function (s) { return wants(s) && far(s.x, taken, 10); },
    function (s) { return wants(s) && far(s.x, taken, 6); },
    function (s) { return wants(s) && far(s.x, taken, 3); }
  ];
  for (let t = 0; t < tries.length; t++) {
    const ok = spots.filter(tries[t]);
    if (ok.length) {
      const pick = ok[Math.floor(rng() * ok.length) % ok.length];
      level.cells[pick.r][pick.x] = ch;
      taken.push(pick.x);
      const i = spots.indexOf(pick);
      spots.splice(i, 1);
      return pick;
    }
  }
  throw new Error(level.name + ': found nowhere to put "' + ch + '"');
}

function far(x, taken, gap) {
  for (let i = 0; i < taken.length; i++) if (Math.abs(taken[i] - x) < gap) return false;
  return true;
}

// ---------------------------------------------------------------------------
// more baddies
// ---------------------------------------------------------------------------
//
// The chunks alone can leave a level a bit quiet, so we top the baddies up
// afterwards. Every new baddy is only dropped into a spot that already obeys
// all the safety rules.

const ENEMY_PACE = [36, 32, 28, 27, 25]; // one baddy per this many columns

function walkerSpots(cells, W) {
  const spots = [];
  const busy = [];
  findAll(cells, GROUND_DANGER.concat(FLYERS, STATIONARY, ITEMS, ['T'])).forEach(function (d) {
    busy.push(d[1]);
  });
  const startCol = findAll(cells, ['P'])[0][1];
  const flag = findAll(cells, ['F']);
  const flagCol = flag.length ? flag[0][1] : -99;

  for (let x = 4; x < W - 4; x++) {
    if (Math.abs(x - startCol) <= 10 || Math.abs(x - flagCol) <= 6) continue;
    let clash = false;
    busy.forEach(function (b) { if (Math.abs(b - x) <= 4) clash = true; });
    if (clash) continue;

    const top = groundTop(cells, x);
    if (top === null) continue;

    // flat and solid all around, so the baddy cannot fall in a hole
    let flat = true;
    for (let i = x - 3; i <= x + 3; i++) {
      if (i < 0 || i >= W || !supported(cells, i)) flat = false;
    }
    for (let i = x - 2; i <= x + 2; i++) {
      if (i < 0 || i >= W || groundTop(cells, i) !== top) flat = false;
    }
    if (!flat) continue;

    // no platform anywhere above it, or you bonk your head and drop on it
    let roof = false;
    for (let i = x - 2; i <= x + 2; i++) {
      for (let r = 0; r < top - 1; r++) if (cells[r][i] === '=') roof = true;
    }
    if (roof) continue;

    const r = top - 1;
    if (cells[r][x] !== '.' || cells[r][x - 1] !== '.' || cells[r][x + 1] !== '.') continue;
    spots.push({ r: r, x: x });
  }
  return spots;
}

function flyerSpots(cells, W) {
  const spots = [];
  const startCol = findAll(cells, ['P'])[0][1];
  const flag = findAll(cells, ['F']);
  const flagCol = flag.length ? flag[0][1] : -99;
  const busy = [];
  findAll(cells, FLYERS.concat(STATIONARY)).forEach(function (d) { busy.push(d[1]); });

  for (let x = 4; x < W - 4; x++) {
    if (Math.abs(x - startCol) <= 10 || Math.abs(x - flagCol) <= 6) continue;
    let clash = false;
    busy.forEach(function (b) { if (Math.abs(b - x) <= 5) clash = true; });
    if (clash) continue;
    [9, 8, 10].forEach(function (r) {
      if (spots.length && spots[spots.length - 1].x === x) return;
      let clear = true;
      for (let i = x - 1; i <= x + 1; i++) {
        for (let rr = r - 1; rr <= r + 1; rr++) {
          if (cells[rr][i] !== '.') clear = false;
        }
      }
      if (clear) spots.push({ r: r, x: x });
    });
  }
  return spots;
}

function topUpEnemies(level, ctx, rng) {
  const cells = level.cells;
  const W = level.width;
  const world = level.world;
  const want = Math.round(W / ENEMY_PACE[world]);
  const flyers = FLYERS_BY_WORLD[world];
  const blobs = BLOBS_BY_WORLD[world];

  let have = countChars(cells, WALK_ENEMIES.concat(FLYERS, STATIONARY));
  let guard = 0;
  while (have < want && guard++ < 60) {
    const wantFlyer = flyers.length && rng() < 0.35;
    const wantBlob = blobs.length && rng() < 0.3;
    let placed = false;

    if (wantFlyer) {
      const spots = flyerSpots(cells, W);
      if (spots.length) {
        const s = spots[Math.floor(rng() * spots.length) % spots.length];
        cells[s.r][s.x] = ctx.flyer();
        placed = true;
      }
    }
    if (!placed) {
      const spots = walkerSpots(cells, W);
      if (!spots.length) break;
      const s = spots[Math.floor(rng() * spots.length) % spots.length];
      cells[s.r][s.x] = wantBlob ? ctx.blob() : ctx.walker();
      placed = true;
    }
    if (!placed) break;
    have++;
  }
  return have;
}

// Which normal level in each world gets which treat.
const STAR_PLAN = [
  [false, true, true, true],
  [true, true, false, true],
  [true, false, true, true],
  [false, true, true, true],
  [true, true, true, false]
];
const MAXUP_PLAN = [1, 2, 0, 3, 2];
const BOOTS_OR_RAPID = ['B', 'R', 'B', 'R'];

// ---------------------------------------------------------------------------
// building a normal level out of chunks
// ---------------------------------------------------------------------------

const WIDTHS = [[120, 140], [135, 155], [150, 170], [160, 180], [170, 200]];

const LEVEL_NAMES = [
  ['First Steps', 'Log Jump', 'Bug Hunt', 'Deep Woods', 'Skull King'],
  ['Cold Start', 'Ice Slide', 'Snow Drift', 'Frozen Cave', 'Frost Giant'],
  ['Dry Sand', 'Spike Dunes', 'Lost Tomb', 'Gold Room', 'Mummy Lord'],
  ['Hot Rocks', 'Ash Path', 'Lava Falls', 'Fire Bridge', 'Fire Dragon'],
  ['Dark Gate', 'Night Walk', 'Ghost Hall', 'Last Climb', 'Shadow Master']
];

function startPiece() {
  const a = canvas('start', 10);
  a.put(STAND, 3, 'P');
  return a;
}

function endPiece() {
  const a = canvas('end', 14);
  a.coins(12, 2, 3);
  a.put(STAND, 8, 'F');
  return a;
}

function plainPiece(width) {
  return canvas('plain', width);
}

function joinPieces(name, world, boss, pieces) {
  let width = 0;
  pieces.forEach(function (p) { width += p.width; });
  const cells = [];
  for (let r = 0; r < H; r++) cells.push([]);
  const slots = [];
  let offset = 0;
  pieces.forEach(function (p) {
    for (let r = 0; r < H; r++) {
      for (let x = 0; x < p.width; x++) cells[r].push(p.cells[r][x]);
    }
    p.slots.forEach(function (s) { slots.push([s[0], s[1] + offset]); });
    offset += p.width;
  });
  return { name: name, world: world, boss: boss, cells: cells, slots: slots, width: width };
}

// Every level must have at least this many chunks of each kind, so a world
// always feels like itself and no level ends up missing a whole idea.
const WORLD_QUOTA = [
  { plat: 2, hole: 1, coin: 1, enemy: 1, step: 1 },
  { plat: 2, hole: 1, spring: 2, flyer: 2 },
  { plat: 2, hole: 1, spike: 2, enemy: 2, step: 1 },
  { plat: 2, hole: 1, lava: 3, blob: 2, spike: 1 },
  { plat: 3, hole: 1, flyer: 2, enemy: 2, spike: 1 }
];

function buildNormalLevel(index) {
  const world = Math.floor(index / 5);
  const inWorld = index % 5;
  const rng = mulberry32(1000 + index * 7919);
  const range = WIDTHS[world];
  const target = range[0] + Math.floor(rng() * (range[1] - range[0] + 1));

  const walkers = WALKERS_BY_WORLD[world];
  const flyers = FLYERS_BY_WORLD[world];
  const blobs = BLOBS_BY_WORLD[world];
  const ctx = {
    world: world,
    walker: function () { return pickOne(walkers, rng); },
    flyer: function () { return pickOne(flyers, rng); },
    blob: function () { return pickOne(blobs, rng); }
  };

  const endW = 14;
  const pieces = [startPiece()];
  let used = pieces[0].width;
  const counts = {};
  let last = '';

  const quota = {};
  Object.keys(WORLD_QUOTA[world]).forEach(function (k) { quota[k] = WORLD_QUOTA[world][k]; });

  for (;;) {
    const room = target - endW - used;
    let options = CHUNKS.filter(function (c) {
      return c.width <= room && c.name !== last &&
        (counts[c.name] || 0) < 3 && chunkWeight(c, world) > 0;
    });
    if (!options.length) break;

    // if a kind of chunk is still owed, lean towards it, and the less room
    // is left the harder we lean
    let owed = 0;
    Object.keys(quota).forEach(function (k) { owed += quota[k]; });
    if (owed > 0) {
      const guessLeft = Math.max(1, Math.floor(room / 16));
      if (rng() < owed / guessLeft) {
        const wanted = options.filter(function (c) {
          return c.tags.some(function (t) { return quota[t] > 0; });
        });
        if (wanted.length) options = wanted;
      }
    }

    let total = 0;
    const weights = options.map(function (c) {
      const w = chunkWeight(c, world);
      total += w;
      return w;
    });
    let roll = rng() * total;
    let pick = options[options.length - 1];
    for (let i = 0; i < options.length; i++) {
      roll -= weights[i];
      if (roll <= 0) { pick = options[i]; break; }
    }
    pieces.push(buildChunk(pick, ctx));
    pick.tags.forEach(function (t) { if (quota[t] > 0) quota[t]--; });
    counts[pick.name] = (counts[pick.name] || 0) + 1;
    used += pick.width;
    last = pick.name;
  }

  const pad = target - endW - used;
  if (pad > 0) pieces.push(plainPiece(pad));
  pieces.push(endPiece());

  const level = joinPieces(LEVEL_NAMES[world][inWorld], world, false, pieces);
  level.chunks = Object.keys(counts);

  topUpEnemies(level, ctx, rng);

  // now drop the power ups in
  const spots = itemSpots(level.cells, level.width, level.slots);
  const taken = [];
  const W = level.width;

  if (STAR_PLAN[world][inWorld]) {
    placeItem(level, spots, taken, '*', function (s) {
      return s.x >= W * 0.36 && s.x <= W * 0.64;
    }, rng);
  }
  placeItem(level, spots, taken, 'H', function (s) {
    return s.x > W * 0.55;
  }, rng);
  if (MAXUP_PLAN[world] === inWorld) {
    placeItem(level, spots, taken, 'M', function (s) {
      return s.kind !== 'ground' || s.x < W * 0.5;
    }, rng);
  }
  placeItem(level, spots, taken, BOOTS_OR_RAPID[inWorld], function () { return true; }, rng);

  return level;
}

// ---------------------------------------------------------------------------
// boss levels, made by hand
// ---------------------------------------------------------------------------

const BOSS_WIDTHS = [68, 70, 72, 74, 76];
const BOSS_EXTRA = ['R', 'B', 'R', 'B', 'R'];
const BOSS_STAR = [false, false, true, true, true];

function buildBossLevel(world) {
  const W = BOSS_WIDTHS[world];
  const name = LEVEL_NAMES[world][4];
  const a = canvas(name, W);

  // the way in: two platforms with coins on them
  a.put(STAND, 3, 'P');
  a.plat(11, 10, 14); a.coins(10, 10, 14);
  a.plat(9, 17, 21); a.coins(8, 17, 21);
  a.coins(12, 7, 8);

  const bx = W - 18;          // where the boss waits
  a.put(STAND, bx, BOSSES[world]);

  // help before the fight, all of it left of the clear arena
  a.put(STAND, 29, 'H');
  a.plat(11, 32, 35);
  a.put(10, 33, BOSS_EXTRA[world]);
  a.coin(10, 35);
  if (BOSS_STAR[world]) a.put(STAND, 37, '*');

  // a ledge on the far side to dodge on to
  a.plat(11, bx + 11, bx + 14);
  a.coins(10, bx + 11, bx + 14);

  return { name: name, world: world, boss: true, cells: a.cells, slots: [], width: W };
}

// ---------------------------------------------------------------------------
// counting things, so we can see how busy a level is
// ---------------------------------------------------------------------------

function countFeatures(cells, W) {
  let features = 0;

  // groups of coins that touch each other count as one thing
  const seen = {};
  for (let r = 0; r < H; r++) {
    for (let x = 0; x < W; x++) {
      if (cells[r][x] !== 'o' || seen[r + ':' + x]) continue;
      features++;
      const stack = [[r, x]];
      while (stack.length) {
        const at = stack.pop();
        const key = at[0] + ':' + at[1];
        if (seen[key]) continue;
        seen[key] = true;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          const rr = at[0] + d[0], xx = at[1] + d[1];
          if (rr < 0 || rr >= H || xx < 0 || xx >= W) return;
          if (cells[rr][xx] === 'o' && !seen[rr + ':' + xx]) stack.push([rr, xx]);
        });
      }
    }
  }

  // runs of platforms and runs of spikes
  ['=', '^'].forEach(function (ch) {
    for (let r = 0; r < H; r++) {
      let run = false;
      for (let x = 0; x < W; x++) {
        const on = cells[r][x] === ch;
        if (on && !run) features++;
        run = on;
      }
    }
  });

  // runs of holes and runs of lava
  let inGap = false;
  let inLava = false;
  for (let x = 0; x < W; x++) {
    const gap = !supported(cells, x);
    if (gap && !inGap) features++;
    inGap = gap;
    const lava = cells[GROUND_TOP][x] === '~';
    if (lava && !inLava) features++;
    inLava = lava;
  }

  // runs of ground that is higher than normal
  let inHill = false;
  for (let x = 0; x < W; x++) {
    const top = groundTop(cells, x);
    const hill = top !== null && top < GROUND_TOP;
    if (hill && !inHill) features++;
    inHill = hill;
  }

  // every enemy, boss, spring and power up counts as one thing
  features += findAll(cells, WALK_ENEMIES.concat(FLYERS, STATIONARY, BOSSES, ITEMS, ['T'])).length;

  return features;
}

function countChars(cells, wanted) {
  return findAll(cells, wanted).length;
}

// ---------------------------------------------------------------------------
// build them all
// ---------------------------------------------------------------------------

const levels = [];
for (let world = 0; world < 5; world++) {
  for (let inWorld = 0; inWorld < 5; inWorld++) {
    const index = world * 5 + inWorld;
    levels.push(inWorld === 4 ? buildBossLevel(world) : buildNormalLevel(index));
  }
}

const report = [];
levels.forEach(function (level, i) {
  const worst = checkLevel(level);
  const W = level.width;
  const features = countFeatures(level.cells, W);
  report.push({
    i: i,
    world: level.world,
    name: level.name,
    width: W,
    enemies: countChars(level.cells, WALK_ENEMIES.concat(FLYERS, STATIONARY, BOSSES)),
    coins: countChars(level.cells, ['o']),
    items: countChars(level.cells, ITEMS),
    gap: worst,
    perFeature: (W / features).toFixed(1)
  });
});

// ---------------------------------------------------------------------------
// write levels.js
// ---------------------------------------------------------------------------

let out = '';
out += '// Level maps for Ninja Master.\n';
out += '// Made by tools/genlevels.cjs. Run "node tools/genlevels.cjs" to make it again.\n';
out += '//\n';
out += '// Each level is a grid of letters. Every row must be the same length,\n';
out += '// and every level is 17 rows tall.\n';
out += '//\n';
out += '// The ground and the traps:\n';
out += '//   .  empty air        #  solid ground     =  platform (a thin plank)\n';
out += '//   ^  spikes (ouch)    ~  lava (ouch)      T  spring, it bounces you high\n';
out += '//   o  coin             P  where you start  F  the flag, touch it to win\n';
out += '//\n';
out += '// The baddies, two for each world:\n';
out += '//   Z  zombie, slow      S  skeleton, throws bones\n';
out += '//   W  snowman, throws snowballs             V  bat, it flies\n';
out += '//   U  mummy, slow and tough                 C  scorpion, fast\n';
out += '//   I  imp, it hops at you                   G  lava blob, jumps up and down\n';
out += '//   N  shadow ninja, throws darts            Y  ghost, goes through walls\n';
out += '//\n';
out += '// The bosses, one at the end of each world:\n';
out += '//   K  Skull King       J  Frost Giant      Q  Mummy Lord\n';
out += '//   D  Fire Dragon      X  Shadow Master\n';
out += '//\n';
out += '// Power ups you can pick up:\n';
out += '//   H  one heart back                        M  one more heart for ever\n';
out += '//   *  star power, for 8 seconds nothing can hurt you\n';
out += '//   B  jump boots, triple jump               R  rapid stars, throw much faster\n';
out += '//\n';
out += '// Rules that keep a level possible to finish:\n';
out += '//   1. Holes and lava are 3 columns wide or less. One jump goes about 4.\n';
out += '//   2. Spikes and walking baddies stay 3 columns away from a hole edge.\n';
out += '//   3. No platform sits above spikes or a walking baddy.\n';
out += '//   4. No platform hangs over a hole or over lava.\n';
out += '//   5. The floor never steps up or down more than 2 rows at a time.\n';
out += '//   6. A star only ever sits in the middle of a level.\n';
out += '//   7. Nothing at all sits next to the start, and nothing nasty next to the flag.\n';
out += '//\n';
out += '// There are 25 levels: 5 worlds with 5 levels each. The last level of\n';
out += '// every world is a boss fight, so it has a boss and no flag.\n';
out += '\n';
out += 'const LEVELS = [\n';

levels.forEach(function (level, i) {
  const rows = level.cells.map(function (row) { return row.join(''); });
  rows.forEach(function (row) {
    if (row.length !== level.width) throw new Error(level.name + ': a row came out the wrong width');
  });
  const joined = rows.map(function (row) { return "      '" + row + "'"; }).join(',\n');
  out += '  {\n';
  out += "    name: '" + level.name + "',\n";
  out += '    world: ' + level.world + ',\n';
  out += '    boss: ' + (level.boss ? 'true' : 'false') + ',\n';
  out += '    rows: [\n' + joined + '\n    ]\n';
  out += '  }' + (i < levels.length - 1 ? ',' : '') + '\n';
});

out += '];\n';

fs.writeFileSync(OUT, out);

// ---------------------------------------------------------------------------
// tell us what we made
// ---------------------------------------------------------------------------

function pad(s, n) {
  s = String(s);
  while (s.length < n) s += ' ';
  return s;
}
function padLeft(s, n) {
  s = String(s);
  while (s.length < n) s = ' ' + s;
  return s;
}

console.log('');
console.log(pad('idx', 4) + pad('world', 6) + pad('name', 15) + padLeft('width', 6) +
  padLeft('foes', 6) + padLeft('coins', 6) + padLeft('items', 6) + padLeft('gap', 5) +
  padLeft('cols/thing', 12));
console.log(new Array(66).join('-'));
report.forEach(function (r) {
  console.log(pad(r.i, 4) + pad(r.world, 6) + pad(r.name, 15) + padLeft(r.width, 6) +
    padLeft(r.enemies, 6) + padLeft(r.coins, 6) + padLeft(r.items, 6) + padLeft(r.gap, 5) +
    padLeft(r.perFeature, 12));
});

const avg = report.reduce(function (s, r) { return s + Number(r.perFeature); }, 0) / report.length;
console.log('');
console.log('average columns per thing to do: ' + avg.toFixed(2));
console.log('chunks in the library: ' + CHUNKS.length);
console.log('wrote ' + OUT);

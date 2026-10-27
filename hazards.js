(function (root) {
  'use strict';
  var terrain = typeof module !== 'undefined' && module.exports ? require('./terrain.js') : root.NinjaTerrain;
  var BARREL_LIMIT = 24, FUSE = 48, RADIUS = 38;

  function create(rows) {
    var barrels = [];
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        if (rows[y][x] === 'e') {
          barrels.push({ x: x * 16 + 2, y: y * 16 + 2, w: 12, h: 14, fuse: -1, spent: false });
        }
      }
    }
    if (barrels.length > BARREL_LIMIT) { throw new RangeError('Use at most 24 barrels in a level.'); }
    return { barrels: barrels };
  }

  function arm(b) {
    if (b.spent || b.fuse >= 0) { return false; }
    b.fuse = FUSE;
    return true;
  }

  function ignite(state, x, y, radius) {
    state.barrels.forEach(function (b) {
      var dx = b.x + b.w / 2 - x, dy = b.y + b.h / 2 - y;
      if (dx * dx + dy * dy <= radius * radius) { arm(b); }
    });
  }

  function tick(state, blast) {
    var ready = [];
    state.barrels.forEach(function (b) {
      if (!b.spent && b.fuse >= 0 && --b.fuse <= 0) {
        b.spent = true;
        ready.push(b);
      }
    });
    /* Finish the tick before arming another fuse. Chains never recurse or
       skip the warning, even when the next barrel is earlier in the list. */
    ready.forEach(function (b) { blast(b.x + b.w / 2, b.y + b.h / 2, RADIUS, 3); });
  }

  /* The campaign checker runs the same fuses, chains and blast footprint.
     The caller keeps the original protection mask after excavation. */
  function simulate(rows, mask, triggers) {
    var grid = rows.map(function (row) { return row.split(''); });
    var state = create(rows), count = 0;
    state.barrels.forEach(function (b, i) { if (triggers & (1 << i)) { arm(b); } });
    for (var t = 0; t < FUSE * (BARREL_LIMIT + 1); t++) {
      tick(state, function (x, y, radius) {
        count++;
        ignite(state, x, y, radius);
        terrain.blastCells(grid, x, y, radius, function (cx, cy) {
          if (terrain.canBreak(grid, mask, cx, cy)) { grid[cy][cx] = '.'; }
        });
      });
      if (!state.barrels.some(function (b) { return !b.spent && b.fuse >= 0; })) { break; }
    }
    return { rows: grid.map(function (row) { return row.join(''); }), detonations: count, ticks: t + 1 };
  }

  var api = { create: create, arm: arm, ignite: ignite, tick: tick,
    simulate: simulate,
    barrelLimit: BARREL_LIMIT, fuseFrames: FUSE, blastRadius: RADIUS };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  else { root.NinjaHazards = api; }
})(typeof window !== 'undefined' ? window : this);

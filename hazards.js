(function (root) {
  'use strict';
  var terrain = typeof module !== 'undefined' && module.exports ? require('./terrain.js') : root.NinjaTerrain;
  var BARREL_LIMIT = 24, FALL_LIMIT = 24, FUSE = 48, RADIUS = 38, WARNING = 60;

  function create(rows, mask) {
    var barrels = [], blocks = [];
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        if (rows[y][x] === 'e') {
          barrels.push({ x: x * 16 + 2, y: y * 16 + 2, w: 12, h: 14, fuse: -1, spent: false });
        } else if (rows[y][x] === 'v') {
          blocks.push({ cx: x, cy: y, x: x * 16, y: y * 16, w: 16, h: 16,
            phase: 'idle', warning: 0, vy: 0, anchored: !!(mask && mask[y][x]) });
        }
      }
    }
    if (barrels.length > BARREL_LIMIT) { throw new RangeError('Use at most 24 barrels in a level.'); }
    if (blocks.length > FALL_LIMIT) { throw new RangeError('Use at most 24 falling blocks in a level.'); }
    return { barrels: barrels, blocks: blocks };
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

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function fall(state, grid, hit, crumble) {
    var changed = false;
    state.blocks.forEach(function (b) {
      if (b.anchored || b.phase === 'spent') { return; }
      if (b.phase === 'idle' || b.phase === 'warning') {
        var supported = b.cy + 1 >= grid.length || terrain.solid(grid[b.cy + 1][b.cx]);
        if (supported) { b.phase = 'idle'; b.warning = 0; return; }
        if (b.phase === 'idle') { b.phase = 'warning'; b.warning = WARNING; return; }
        if (--b.warning > 0) { return; }
        b.phase = 'fall';
        grid[b.cy][b.cx] = '.';
        changed = true;
        return;
      }
      var oldY = b.y, nextY = b.y + Math.min(4, b.vy + 0.35), landed = false;
      b.vy = Math.min(4, b.vy + 0.35);
      /* Sweep every crossed row, including a sub-pixel first step. */
      for (var y = Math.floor((oldY + 16) / 16); y <= Math.floor((nextY + 16) / 16); y++) {
        if (y >= grid.length || terrain.solid(grid[y][b.cx])) {
          nextY = y * 16 - 16; landed = true; break;
        }
      }
      var sweep = { x: b.x, y: oldY, w: 16, h: nextY - oldY + 16 };
      b.y = nextY;
      var contact = false;
      state.barrels.forEach(function (barrel) {
        if (!barrel.spent && overlap(sweep, barrel)) { arm(barrel); contact = true; }
      });
      if (hit && hit(sweep)) { contact = true; }
      if (landed || contact) {
        b.phase = 'spent';
        if (crumble) { crumble(b); }
      }
    });
    return changed;
  }

  function reset(state) {
    state.barrels.forEach(function (b) { if (!b.spent) { b.fuse = -1; } });
    state.blocks.forEach(function (b) {
      if (b.phase === 'warning') { b.phase = 'idle'; b.warning = 0; }
      /* Never put a falling tile back on top of a respawning actor. */
      if (b.phase === 'fall') { b.phase = 'spent'; }
    });
  }

  function threatens(state, box) {
    return state.blocks.some(function (b) {
      return !b.anchored && b.phase !== 'spent' && b.x < box.x + box.w &&
        b.x + 16 > box.x && b.y < box.y + box.h;
    });
  }

  /* The campaign checker runs the same fuses, chains and blast footprint.
     The caller keeps the original protection mask after excavation. */
  function simulate(rows, mask, triggers) {
    var grid = rows.map(function (row) { return row.split(''); });
    var state = create(rows, mask), count = 0, snapshots = [], previous = '';
    function snapshot() {
      var next = grid.map(function (row) { return row.join(''); });
      var signature = next.join('\n');
      if (signature !== previous) { snapshots.push(next); previous = signature; }
    }
    snapshot();
    state.barrels.forEach(function (b, i) { if (Math.floor(triggers / Math.pow(2, i)) % 2) { arm(b); } });
    state.blocks.forEach(function (b, i) {
      if (Math.floor(triggers / Math.pow(2, i + state.barrels.length)) % 2 && terrain.canBreak(grid, mask, b.cx, b.cy + 1)) {
        grid[b.cy + 1][b.cx] = '.';
      }
    });
    snapshot();
    for (var t = 0; t < 4096; t++) {
      tick(state, function (x, y, radius) {
        count++;
        ignite(state, x, y, radius);
        terrain.blastCells(grid, x, y, radius, function (cx, cy) {
          if (terrain.canBreak(grid, mask, cx, cy)) { grid[cy][cx] = '.'; }
        });
        snapshot();
      });
      if (fall(state, grid)) { snapshot(); }
      if (!state.barrels.some(function (b) { return !b.spent && b.fuse >= 0; }) &&
          !state.blocks.some(function (b) { return b.phase === 'warning' || b.phase === 'fall'; })) { break; }
    }
    if (t === 4096) { throw Error('Hazard simulation did not settle within 4096 play ticks.'); }
    return { rows: snapshots[snapshots.length - 1], snapshots: snapshots,
      detonations: count, ticks: t + 1 };
  }

  var api = { create: create, arm: arm, ignite: ignite, tick: tick, fall: fall,
    reset: reset, threatens: threatens, warningFrames: WARNING, fallLimit: FALL_LIMIT,
    simulate: simulate,
    barrelLimit: BARREL_LIMIT, fuseFrames: FUSE, blastRadius: RADIUS };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  else { root.NinjaHazards = api; }
})(typeof window !== 'undefined' ? window : this);

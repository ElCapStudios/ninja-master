(function (root) {
  'use strict';

  function solid(ch) { return '#=T/+v'.indexOf(ch) >= 0; }

  /* Keep the original footholds in mazes, and a two-tile-deep bedrock
     trench in runs. Digging can open routes, never remove a required jump. */
  function protection(rows, boss, kind) {
    var h = rows.length, w = rows[0].length;
    var mask = rows.map(function () { return new Uint8Array(w); });
    function pin(x, y) {
      if (x >= 0 && y >= 0 && x < w && y < h) { mask[y][x] = 1; }
    }
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var ch = rows[y][x];
        if (x === 0 || x === w - 1 || y === 0 || y === h - 1 ||
            ch === '=' || ch === 'T' || ch === '+' ||
            (boss && ch === '#')) { pin(x, y); }
        if (ch === '#' && y > 0 && !solid(rows[y - 1][x]) &&
            (kind === 'maze' || y < h - 3)) {
          pin(x, y);
          /* A wall-jump face under a raised ledge stays intact too. */
          if (kind === 'maze') {
            for (var down = y + 1; down < h && rows[down][x] === '#'; down++) { pin(x, down); }
          }
        }
        if (kind !== 'maze' && y === h - 3 && x % 3 === 0) { pin(x, y); }
        if ('PFkg+|T^~'.indexOf(ch) >= 0) {
          for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) { pin(x + dx, y + dy); }
          }
        }
      }
    }
    if (kind !== 'maze') {
      var floor = h - 3;
      for (var fx = 1; fx < w - 1; fx++) {
        /* A trench must not lower the approach to a low tunnel, a spring
           jump or an existing gap. Leave room to jump out on either side. */
        for (var nx = Math.max(0, fx - 3); nx <= Math.min(w - 1, fx + 3); nx++) {
          if (rows[floor][nx] !== '#' || solid(rows[floor - 1][nx]) ||
              solid(rows[floor - 2][nx]) || solid(rows[floor - 3][nx])) { pin(fx, floor); }
        }
        if (mask[floor][fx]) { pin(fx, floor + 1); }
      }
    }
    return mask;
  }

  function canBreak(grid, mask, x, y) {
    return y >= 0 && y < grid.length && x >= 0 && x < grid[0].length &&
      !mask[y][x] && (grid[y][x] === '#' || grid[y][x] === '/');
  }

  function blastCells(grid, x, y, radius, visit) {
    var c0 = Math.floor((x - radius) / 16), c1 = Math.floor((x + radius) / 16);
    var r0 = Math.floor((y - radius) / 16), r1 = Math.floor((y + radius) / 16);
    for (var cy = Math.max(0, r0); cy <= Math.min(grid.length - 1, r1); cy++) {
      for (var cx = Math.max(0, c0); cx <= Math.min(grid[0].length - 1, c1); cx++) {
        var dx = cx * 16 + 8 - x, dy = cy * 16 + 8 - y;
        if (dx * dx + dy * dy <= (radius + 6) * (radius + 6)) { visit(cx, cy); }
      }
    }
  }

  var api = { protection: protection, canBreak: canBreak, blastCells: blastCells, solid: solid };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  else { root.NinjaTerrain = api; }
})(typeof window !== 'undefined' ? window : this);

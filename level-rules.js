(function (root) {
  'use strict';

  /* Shared with the campaign checker. This is a conservative movement
     model, not a proof of what the live physics or digging can reach. */
  function makeSolver(rows) {
    var H = rows.length, W = rows[0].length;
    var MAXDX_UP = [4, 3, 3, 2], MAXDX_WALL = [0, 3, 3, 2];
    function at(x, y) {
      if (x < 0 || y < 0 || x >= W || y >= H) { return '#'; }
      return rows[y][x];
    }
    function solidCh(c, key) {
      return c === '#' || c === '=' || c === 'T' || c === '/' || (c === '+' && !key);
    }
    function solid(x, y, key) { return solidCh(at(x, y), key); }
    function free(x, y, key) {
      if (x < 0 || y < 0 || x >= W || y >= H) { return false; }
      var c = rows[y][x];
      return !solidCh(c, key) && c !== '^' && c !== '~';
    }
    function ladder(x, y) { return at(x, y) === '|'; }
    function rest(x, y, key) {
      return free(x, y, key) && (solid(x, y + 1, key) || ladder(x, y));
    }
    function cling(x, y, key) {
      if (!free(x, y, key)) { return false; }
      if (solid(x, y + 1, key) || ladder(x, y)) { return false; }
      return solid(x - 1, y, key) || solid(x + 1, y, key);
    }
    function pathOk(x, y, nx, ny, key, R) {
      var top = y - R;
      if (top < 0) { return false; }
      for (var r = y - 1; r >= top; r--) { if (!free(x, r, key)) { return false; } }
      var lo = Math.min(x, nx), hi = Math.max(x, nx), midLow = Math.min(y - 1, ny);
      for (var mx = lo + 1; mx < hi; mx++) {
        for (r = top; r <= midLow; r++) { if (!free(mx, r, key)) { return false; } }
      }
      for (r = top; r <= ny; r++) { if (!free(nx, r, key)) { return false; } }
      return true;
    }
    function landing(x, y, key, nx, ny, R, push) {
      if (!pathOk(x, y, nx, ny, key, R)) { return; }
      if (rest(nx, ny, key)) { push(nx, ny, 0); }
      else if (cling(nx, ny, key)) { push(nx, ny, 1); }
    }
    function moves(x, y, mode, key, push) {
      var u, dx, R, d, k, nx, ny;
      if (mode === 0) {
        if (rest(x - 1, y, key)) { push(x - 1, y, 0); }
        if (rest(x + 1, y, key)) { push(x + 1, y, 0); }
        if (ladder(x, y - 1) && free(x, y - 1, key)) { push(x, y - 1, 0); }
        if (ladder(x, y) && ladder(x, y + 1)) { push(x, y + 1, 0); }
        for (u = 0; u <= 3; u++) {
          for (dx = -MAXDX_UP[u]; dx <= MAXDX_UP[u]; dx++) {
            if (dx === 0 && u === 0) { continue; }
            R = Math.max(u + 1, Math.abs(dx), 1);
            landing(x, y, key, x + dx, y - u, R, push);
          }
        }
        for (d = -1; d <= 1; d += 2) {
          for (k = 1; k <= 4; k++) {
            nx = x + d * k;
            if (k > 1 && !free(x + d * (k - 1), y, key)) { break; }
            for (ny = y + 1; ny < H; ny++) {
              if (!free(nx, ny, key)) { break; }
              if (rest(nx, ny, key) || cling(nx, ny, key)) {
                landing(x, y, key, nx, ny, Math.max(k, 1), push);
              }
            }
          }
        }
        if (at(x, y + 1) === 'T') {
          for (u = 1; u <= 6; u++) {
            for (dx = -2; dx <= 2; dx++) {
              R = Math.max(u + 1, Math.abs(dx), 1);
              landing(x, y, key, x + dx, y - u, R, push);
            }
          }
        }
        return;
      }
      var wallLeft = solid(x - 1, y, key), wallRight = solid(x + 1, y, key);
      for (var rise = 1; rise <= 3; rise++) {
        for (d = -1; d <= 1; d += 2) {
          if (d < 0 && !wallRight) { continue; }
          if (d > 0 && !wallLeft) { continue; }
          for (k = 1; k <= MAXDX_WALL[rise]; k++) {
            landing(x, y, key, x + d * k, y - rise, Math.max(rise + 1, k), push);
          }
        }
      }
      for (d = -1; d <= 1; d++) {
        for (ny = y + 1; ny < H; ny++) {
          nx = x + d;
          if (!free(nx, ny, key)) { break; }
          if (rest(nx, ny, key) || cling(nx, ny, key)) { landing(x, y, key, nx, ny, 1, push); }
        }
      }
    }
    return { W: W, H: H, at: at, moves: moves };
  }

  var api = { makeSolver: makeSolver };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  else { root.NinjaLevelRules = api; }
})(typeof window !== 'undefined' ? window : this);

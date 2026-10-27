(function (root) {
  'use strict';
  var rules = typeof module !== 'undefined' && module.exports ? require('./level-rules.js') : root.NinjaLevelRules;
  var hazards = typeof module !== 'undefined' && module.exports ? require('./hazards.js') : root.NinjaHazards;
  var terrain = typeof module !== 'undefined' && module.exports ? require('./terrain.js') : root.NinjaTerrain;
  var WIDTH = 24, HEIGHT = 17;
  var tiles = [
    ['#', 'Earth'], ['.', 'Erase'], ['P', 'Start'], ['F', 'Flag'],
    ['=', 'Ledge'], ['|', 'Ladder'], ['T', 'Spring'], ['/', 'Cracked rock'],
    ['o', 'Coin'], ['g', 'Gem'], ['H', 'Heart'], ['Z', 'Zombie'],
    ['^', 'Spikes'], ['~', 'Lava'], ['k', 'Key'], ['+', 'Door'],
    ['1', 'Shotgun'], ['4', 'Laser'], ['e', 'Barrel'], ['v', 'Falling block']
  ];
  var legal = tiles.map(function (t) { return t[0]; }).join('');

  function template() {
    var rows = [];
    for (var y = 0; y < HEIGHT; y++) {
      rows.push(y >= 14 ? '#'.repeat(WIDTH) : '#' + '.'.repeat(WIDTH - 2) + '#');
    }
    rows[13] = '#.P.................F..#';
    return { v: 1, name: 'My level', world: 0, rows: rows };
  }

  function validate(value, forPlay) {
    if (!value || value.v !== 1 || typeof value.name !== 'string' ||
        !value.name.trim() || value.name.length > 24 ||
        !Number.isInteger(value.world) || value.world < 0 || value.world > 7 ||
        !Array.isArray(value.rows) || value.rows.length !== HEIGHT) {
      return { error: 'This is not a valid saved level. Your draft is still here.' };
    }
    var starts = [], flags = [], gems = 0, foes = 0, items = 0, barrels = 0, blocks = 0;
    for (var y = 0; y < HEIGHT; y++) {
      var row = value.rows[y];
      if (typeof row !== 'string' || row.length !== WIDTH) {
        return { error: 'A level must have 24 columns and 17 rows.' };
      }
      for (var x = 0; x < WIDTH; x++) {
        if (legal.indexOf(row[x]) < 0) { return { error: 'This level has an unknown tile.' }; }
        if (row[x] === 'P') { starts.push({ x: x, y: y }); }
        if (row[x] === 'F') { flags.push({ x: x, y: y }); }
        if (row[x] === 'g') { gems++; }
        if (row[x] === 'Z') { foes++; }
        if (row[x] === 'e') { barrels++; }
        if (row[x] === 'v') { blocks++; }
        if ('ogHZk14'.indexOf(row[x]) >= 0) { items++; }
      }
    }
    if (barrels > 16) { return { error: 'Use up to 16 barrels. Erase a few, then try again.' }; }
    if (blocks > 16) { return { error: 'Use up to 16 falling blocks. Erase a few, then try again.' }; }
    if (!forPlay) { return { value: copy(value) }; }
    if (starts.length !== 1 || flags.length !== 1) {
      return { error: 'Place one Start and one Flag, then try again.' };
    }
    if (gems > 3 || foes > 16 || items > 64) {
      return { error: 'Use up to 3 gems, 16 zombies and 64 items in all. Erase a few, then try again.' };
    }
    function supported(p) {
      return p.x > 0 && p.x < WIDTH - 1 && p.y >= 2 && p.y < HEIGHT - 1 &&
        '#=T/|v'.indexOf(value.rows[p.y + 1][p.x]) >= 0;
    }
    if (!supported(starts[0]) || !supported(flags[0])) {
      return { error: 'Put Start and Flag on a floor or ladder, away from the top and side edges.' };
    }
    var s = starts[0], f = flags[0];
    function route(rows) {
      var solver = rules.makeSolver(rows), seen = new Uint8Array(WIDTH * HEIGHT * 4);
      var queue = [[s.x, s.y, 0, false]], head = 0, reachable = false;
      function push(x, y, mode, key) {
        key = key || rows[y][x] === 'k';
        var id = ((y * WIDTH + x) * 2 + mode) * 2 + (key ? 1 : 0);
        if (!seen[id]) { seen[id] = 1; queue.push([x, y, mode, key]); }
      }
      while (head < queue.length) {
        var p = queue[head++];
        if (p[0] === f.x && p[1] === f.y) { reachable = true; }
        solver.moves(p[0], p[1], p[2], p[3], function (x, y, mode) { push(x, y, mode, p[3]); });
      }
      var gemsReachable = true;
      for (var y = 0; y < HEIGHT; y++) for (var x = 0; x < WIDTH; x++) {
        if (rows[y][x] === 'g' && ![0, 1, 2, 3].some(function (mode) { return seen[(y * WIDTH + x) * 4 + mode]; })) {
          gemsReachable = false;
        }
      }
      return reachable && gemsReachable;
    }
    var reachable = route(value.rows), uncertain = false;
    if (barrels || blocks) {
      var mask = terrain.protection(value.rows, false, 'run'), count = barrels + blocks;
      /* At most 33 tests: each trigger alone and all triggers together.
         This is a conservative warning, never a proof for a custom map. */
      var triggers = [];
      for (var i = 0; i < count; i++) { triggers.push(Math.pow(2, i)); }
      triggers.push(Math.pow(2, count) - 1);
      for (var j = 0; j < triggers.length; j++) {
        var state = hazards.simulate(value.rows, mask, triggers[j]);
        if (!state.snapshots.every(route)) { uncertain = true; break; }
      }
    }
    return {
      value: copy(value),
      warning: !reachable ? 'No clear path found. Add ledges or ladders. This check can miss wall jumps and digging.' :
        uncertain ? 'A hazard may cut off the flag or a gem. Add a safe floor or ladder, then test again. This is a path warning, not proof.' :
        barrels || blocks ? 'Hazards change paths. Sample paths passed, but this is not proof. Test the flag and gems after each chain or fall.' : '',
      reachable: reachable, hazardWarning: uncertain
    };
  }

  function copy(draft) { return { v: 1, name: draft.name, world: draft.world, rows: draft.rows.slice() }; }
  function paint(draft, x, y, tile) {
    if (typeof tile !== 'string' || !Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 ||
        x >= WIDTH || y >= HEIGHT || legal.indexOf(tile) < 0 || tile.length !== 1) { return false; }
    if (draft.rows[y][x] === tile) { return false; }
    if (tile === 'P' || tile === 'F') {
      draft.rows = draft.rows.map(function (row) { return row.split(tile).join('.'); });
    }
    draft.rows[y] = draft.rows[y].slice(0, x) + tile + draft.rows[y].slice(x + 1);
    return true;
  }
  function read(storage, slot) {
    if (!/^[123]$/.test(String(slot))) { return { error: 'Choose Level 1, 2 or 3.' }; }
    try {
      var raw = storage.getItem('ninjaMasterLevelSlot' + slot);
      if (raw === null) { return { error: 'This slot is empty. Save your draft here first.' }; }
      if (raw.length > 4096) { return { error: 'This saved level is too large. Your draft is still here.' }; }
      return validate(JSON.parse(raw), false);
    } catch (e) { return { error: 'Cannot read this slot. Storage may be blocked or the saved level is damaged. Your draft is still here.' }; }
  }
  function save(storage, slot, draft) {
    if (!/^[123]$/.test(String(slot))) { return { error: 'Choose Level 1, 2 or 3.' }; }
    var checked = validate(draft, false);
    if (checked.error) { return checked; }
    try {
      var raw = JSON.stringify(checked.value), key = 'ninjaMasterLevelSlot' + slot;
      storage.setItem(key, raw);
      if (storage.getItem(key) !== raw) { return { error: 'Not saved. This browser did not keep the draft. Keep this page open.' }; }
    }
    catch (e) { return { error: 'Not saved. Device storage is full or blocked. Keep this page open to keep your draft.' }; }
    return checked;
  }
  var api = { width: WIDTH, height: HEIGHT, tiles: tiles, template: template, copy: copy,
    validate: validate, paint: paint, read: read, save: save };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  else { root.NinjaLevelData = api; }
})(typeof window !== 'undefined' ? window : this);

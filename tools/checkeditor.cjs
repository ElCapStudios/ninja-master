'use strict';
const assert = require('node:assert/strict');
const data = require('../level-data.js');
const rules = require('../level-rules.js');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const tests = {
  'falling blocks are solid in the solver and saved without a version change': function () {
    const terrain = require('../terrain.js'), hazards = require('../hazards.js');
    const draft = data.template();
    data.paint(draft, 8, 11, 'v'); data.paint(draft, 8, 12, '/'); data.paint(draft, 7, 13, 'e');
    const checked = data.validate(draft, true);
    assert.equal(checked.error, undefined);
    assert.equal(checked.reachable, true);
    assert.match(checked.warning, /not proof/);
    assert.equal(checked.hazardWarning, false);
    const solver = rules.makeSolver(draft.rows), moves = [];
    solver.moves(8, 10, 0, false, (...p) => moves.push(p));
    assert.ok(moves.length > 0, 'a falling tile is a solid foothold before it falls');
    const mask = terrain.protection(draft.rows, false, 'run');
    const result = hazards.simulate(draft.rows, mask, 1);
    assert.equal(result.rows[11][8], '.', 'mixed hazards are not ignored');
    assert.equal(draft.rows[11][8], 'v');
    const slots = new Map(), storage = { getItem: k => slots.get(k), setItem: (k, v) => slots.set(k, v) };
    for (let slot = 1; slot <= 3; slot++) {
      assert.ok(data.save(storage, slot, draft).value);
      assert.deepEqual(data.read(storage, slot).value, draft);
      assert.equal(JSON.parse(slots.get('ninjaMasterLevelSlot' + slot)).v, 1);
    }
    for (let x = 1; x <= 16; x++) data.paint(draft, x, 9, 'v');
    assert.match(data.validate(draft, true).error, /up to 16 falling blocks/);
    assert.match(data.save(storage, 1, draft).error, /up to 16 falling blocks/);
    assert.equal(data.read(storage, 1).value.rows[9][8], '.', 'oversized draft cannot overwrite a slot');
  },
  'safe hazard control warns without claiming proof, and a disappearing bridge gives a path warning': function () {
    const safe = data.template();
    for (const x of [8, 12, 16]) data.paint(safe, x, 13, 'v');
    const clean = data.validate(safe, true);
    assert.equal(clean.reachable, true); assert.equal(clean.hazardWarning, false);
    assert.match(clean.warning, /not proof/);
    const bad = data.copy(safe);
    for (let x = 6; x <= 17; x++) { data.paint(bad, x, 14, '.'); data.paint(bad, x, 15, '^'); }
    const unsafe = data.validate(bad, true);
    assert.equal(unsafe.reachable, true, 'initial solid falling bridge provides a path');
    assert.equal(unsafe.hazardWarning, true, 'transformed map cannot keep its initial green path result');
    assert.match(unsafe.warning, /cut off the flag or a gem/);
    assert.equal(unsafe.error, undefined, 'conservative warning still permits intentional test-play');
  },
  'barrels round-trip in old slot format with explicit limits': function () {
    const draft = data.template(), slots = new Map();
    const storage = { getItem: key => slots.get(key) || null, setItem: (key, value) => slots.set(key, value) };
    assert.ok(data.paint(draft, 8, 13, 'e'));
    assert.equal(data.validate(draft, true).error, undefined);
    assert.ok(data.save(storage, 1, draft).value);
    assert.deepEqual(data.read(storage, 1).value, draft);
    for (let x = 1; x <= 16; x++) data.paint(draft, x, 10, 'e');
    assert.match(data.validate(draft, true).error, /up to 16 barrels/);
    assert.match(data.save(storage, 1, draft).error, /up to 16 barrels/);
    assert.equal(data.read(storage, 1).value.rows[13][8], 'e', 'bad draft does not replace saved slot');
  },
  'safe floor, eight themes and bounded palette': function () {
    for (let world = 0; world < 8; world++) {
      const draft = data.template(); draft.world = world;
      assert.equal(data.validate(draft, true).reachable, true);
      assert.equal(draft.rows.length, 17);
      assert.ok(draft.rows.every(row => row.length === 24));
    }
    assert.equal(data.tiles.length, 20);
  },
  'painting, erasing and moving unique start and flag': function () {
    const draft = data.template(), original = data.copy(draft);
    for (const [tile] of data.tiles) {
      assert.ok(data.paint(draft, 8, 8, tile));
      assert.equal(draft.rows[8][8], tile);
    }
    for (const tile of ['P', 'F']) {
      data.paint(draft, 5, 13, tile);
      assert.equal(draft.rows.join('').split(tile).length - 1, 1);
    }
    data.paint(draft, 5, 13, '.'); assert.equal(draft.rows[13][5], '.');
    for (const args of [[-1, 1, '#'], [24, 1, '#'], [1, 17, '#'], [0.5, 2, '#'], [1, 1, 'bad'], [1, 1, null]]) {
      assert.equal(data.paint(draft, ...args), false);
    }
    assert.equal(original.rows[13][2], 'P', 'copies remain independent');
  },
  'invalid shape, size, tile, metadata and endpoints are rejected': function () {
    for (const mutate of [
      d => { d.rows.pop(); }, d => { d.rows[0] += '.'; }, d => { d.rows[0] = null; },
      d => { d.rows[0] = '!'.repeat(24); }, d => { d.world = 8; }, d => { d.world = '0'; },
      d => { d.world = NaN; }, d => { d.v = 99; }, d => { d.name = 'x'.repeat(25); },
      d => { d.name = ''; }
    ]) {
      const draft = data.template(); mutate(draft); assert.ok(data.validate(draft, false).error);
    }
    for (const value of [null, [], {}, 'bad']) { assert.ok(data.validate(value, true).error); }
    for (const tile of ['P', 'F']) {
      let draft = data.template(); draft.rows = draft.rows.map(row => row.replace(tile, '.'));
      assert.ok(data.validate(draft, true).error, 'missing ' + tile);
      draft = data.template(); draft.rows[13] = draft.rows[13].slice(0, 8) + tile + draft.rows[13].slice(9);
      assert.ok(data.validate(draft, true).error, 'duplicate ' + tile);
      draft = data.template(); data.paint(draft, 0, 0, tile);
      assert.ok(data.validate(draft, true).error, 'unsafe edge ' + tile);
    }
    const falling = data.template(); data.paint(falling, 2, 14, '.');
    assert.match(data.validate(falling, true).error, /floor/);
    for (const [tile, count] of [['g', 4], ['Z', 17], ['o', 65]]) {
      const draft = data.template();
      for (let i = 0; i < count; i++) data.paint(draft, 1 + i % 22, 3 + Math.floor(i / 22), tile);
      assert.match(data.validate(draft, true).error, /up to 3 gems/);
    }
  },
  'conservative no-path warning permits a deliberate test': function () {
    const draft = data.template();
    for (let y = 0; y < 14; y++) data.paint(draft, 10, y, '#');
    const result = data.validate(draft, true);
    assert.equal(result.error, undefined);
    assert.equal(result.reachable, false);
    assert.match(result.warning, /No clear path.*wall jumps and digging/);
  },
  'three independent device slots round-trip drafts without campaign writes': function () {
    const slots = new Map([['ninjaMasterSaveV2', '{"untouched":true}']]);
    const storage = { getItem: k => slots.has(k) ? slots.get(k) : null, setItem: (k, v) => slots.set(k, v) };
    assert.match(data.read(storage, 1).error, /empty/);
    for (let slot = 1; slot <= 3; slot++) {
      const draft = data.template(); draft.name = 'Level ' + slot; draft.world = slot;
      data.paint(draft, 2, 13, '.');
      assert.ok(data.save(storage, slot, draft).value, 'unfinished drafts can be saved');
      assert.deepEqual(data.read(storage, slot).value, draft);
    }
    assert.equal(slots.get('ninjaMasterSaveV2'), '{"untouched":true}');
    assert.equal(slots.size, 4);
    assert.ok(data.save(storage, 4, data.template()).error);
    assert.ok(data.read(storage, 0).error);
    for (const raw of ['{', 'null', JSON.stringify({ rows: ['P.F'] }), 'x'.repeat(4097)]) {
      slots.set('ninjaMasterLevelSlot1', raw);
      assert.ok(data.read(storage, 1).error);
    }
  },
  'blocked, full and non-persistent storage give explicit errors': function () {
    const storage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('full'); } };
    assert.match(data.read(storage, 1).error, /Cannot read/);
    assert.match(data.save(storage, 1, data.template()).error, /Not saved/);
    assert.match(data.save({ getItem: () => null, setItem() {} }, 1, data.template()).error, /did not keep/);
  },
  'shared solver matches the independent generator on all campaign tiles': function () {
    const src = fs.readFileSync(path.join(root, 'tools/genlevels.cjs'), 'utf8');
    const makeOriginal = new Function('MAXDX_UP', 'MAXDX_WALL', 'SPRING_RISE', 'SPRING_DX',
      src.slice(src.indexOf('function makeSolver('), src.indexOf('function analyse(')) + '\nreturn makeSolver;')([4, 3, 3, 2], [0, 3, 3, 2], 6, 2);
    const levels = new Function(fs.readFileSync(path.join(root, 'levels.js'), 'utf8') + '\nreturn LEVELS;')();
    for (const level of levels) {
      const old = makeOriginal(level.rows), current = rules.makeSolver(level.rows);
      for (let y = 0; y < old.H; y++) {
        for (let x = 0; x < old.W; x++) {
          if ('#=T/+v'.includes(level.rows[y][x])) continue;
          for (const mode of [0, 1]) for (const key of [false, true]) {
            const a = [], b = [];
            old.moves(x, y, mode, key, (...p) => a.push(p));
            current.moves(x, y, mode, key, (...p) => b.push(p));
            assert.deepEqual(b, a, level.name + ' ' + x + ',' + y + ',' + mode + ',' + key);
          }
        }
      }
    }
  }
};
let failures = 0;
for (const [name, test] of Object.entries(tests)) {
  try { test(); console.log('PASS ' + name); }
  catch (e) { failures++; console.error('FAIL ' + name + '\n' + e.stack); }
}
if (failures) process.exitCode = 1;
else console.log(Object.keys(tests).length + ' editor checks pass');

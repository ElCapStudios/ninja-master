'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const ref = process.env.GAME_SOURCE_REF;
function source(file) {
  return ref ? execFileSync('git', ['show', ref + ':' + file], { cwd: root, encoding: 'utf8' }) :
    fs.readFileSync(path.join(root, file), 'utf8');
}

function game(save) {
  const nodes = {};
  function node(id) {
    if (nodes[id]) return nodes[id];
    const events = {};
    const classes = new Set();
    return (nodes[id] = {
      hidden: false, textContent: '', attributes: {}, events: events,
      classList: {
        add: function (c) { classes.add(c); },
        remove: function (c) { classes.delete(c); },
        toggle: function (c, on) { if (on) classes.add(c); else classes.delete(c); }
      },
      addEventListener: function (type, fn) { (events[type] || (events[type] = [])).push(fn); },
      fire: function (type, data) {
        (events[type] || []).forEach(function (fn) { fn(Object.assign({ preventDefault: function () {} }, data)); });
      },
      setAttribute: function (key, value) { this.attributes[key] = value; },
      getBoundingClientRect: function () { return { left: 0, top: 0, width: 384, height: 272 }; },
      blur: function () {}
    });
  }
  const drawing = new Proxy({
    createLinearGradient: function () { return { addColorStop: function () {} }; },
    measureText: function (text) { return { width: text.length * 5 }; }
  }, { get: function (obj, key) { return key in obj ? obj[key] : function () {}; } });
  node('game').getContext = function () { return drawing; };
  const win = node('window');
  const doc = node('document');
  doc.getElementById = node;
  doc.querySelectorAll = function () { return []; };
  doc.body = node('body');
  doc.documentElement = node('html');
  const storage = new Map(save ? [['ninjaMasterSaveV2', JSON.stringify(save)]] : []);
  const sandbox = {
    window: win, document: doc, console: console,
    localStorage: { getItem: function (k) { return storage.get(k) || null; }, setItem: function (k, v) { storage.set(k, v); } },
    requestAnimationFrame: function () {}, setTimeout: function () {},
    Uint8Array: Uint8Array, Int32Array: Int32Array, Math: Math
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(source('levels.js'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'terrain.js'), 'utf8'), context);
  sandbox.NinjaTerrain = win.NinjaTerrain;
  const exports = `window.CHECK = {
    update: update, render: render, goMode: goMode, startLevel: startLevel,
    breakBlock: breakBlock, chipBlock: typeof chipBlock === 'function' ? chipBlock : null,
    doBlast: doBlast, damageEnemy: damageEnemy, enemyShoot: enemyShoot,
    updateEnemies: updateEnemies, respawn: respawnAtSafeSpot,
    doThrow: doThrow, updateShurikens: updateShurikens,
    get safeSpot() { return safeSpot; }, get spawn() { return spawn; },
    get bones() { return bones; }, get particles() { return particles; }
  };`;
  const code = source('game.js').replace('  loadProgress();\n  game.best', exports + '\n  loadProgress();\n  game.best');
  assert.ok(code.includes(exports), 'test hook must attach to the actual boot path');
  vm.runInContext(code, context);
  const n = win.NINJA, t = win.CHECK;
  function tick(count = 1) { for (let i = 0; i < count; i++) { t.update(); t.render(); } }
  function key(code) { win.fire('keydown', { code: code }); tick(); win.fire('keyup', { code: code }); }
  function tap(action, i) {
    t.render();
    const target = n.menuHits.find(function (h) { return h.act === action && (i === undefined || h.i === i); });
    assert.ok(target, 'missing touch target: ' + action + ' ' + i);
    node('game').fire('pointerdown', { clientX: target.x + target.w / 2, clientY: target.y + target.h / 2 });
    tick();
  }
  return { n, t, tick, key, tap, node, win, doc, storage };
}

const tests = {
  'old saves keep progress, shop items, gems and medals': function () {
    const save = { v: 4, max: 19, best: 700, gems: { 0: 7, 2: 3 }, coins: 230, spentGems: 4, buys: { ice: 1, heart: 2 }, medals: { 0: 5 } };
    const g = game(save);
    for (const k of Object.keys(save).filter(function (k) { return k !== 'v'; })) {
      assert.equal(JSON.stringify(g.n.progress[k]), JSON.stringify(save[k]), k);
    }
  },
  'keyboard pause freezes the whole run and clears held input': function () {
    const g = game(); g.n.goTo(0); g.tick();
    g.n.input.right = true;
    g.key('KeyP');
    assert.equal(g.n.game.mode, 'paused');
    const snapshot = JSON.stringify([g.n.game, g.n.player, g.n.enemies, g.n.shurikens]);
    g.tick(120);
    assert.equal(JSON.stringify([g.n.game, g.n.player, g.n.enemies, g.n.shurikens]), snapshot);
    g.key('Escape');
    assert.equal(g.n.game.mode, 'play');
    assert.equal(g.n.input.right, false);
    g.key('Escape'); assert.equal(g.n.game.mode, 'paused');
    g.key('ArrowDown'); assert.equal(g.n.menu.pause, 1);
    g.key('ArrowUp'); assert.equal(g.n.menu.pause, 0);
    assert.equal(g.n.game.mode, 'paused');
  },
  'touch pause offers resume, restart and map with no input bleed': function () {
    const g = game(); g.n.goTo(0); g.tick();
    const vy = g.n.player.vy;
    g.node('btn-pause').fire('click'); g.tick();
    assert.equal(g.n.game.mode, 'paused');
    g.tap('pause', 0); assert.equal(g.n.game.mode, 'play');
    assert.equal(g.n.player.vy, vy);
    assert.equal(g.n.input.jumpHeld, false);
    g.node('btn-menu').fire('click'); g.tick();
    assert.equal(g.n.game.mode, 'paused');
    g.tap('pause', 1); assert.equal(g.n.game.mode, 'play');
    g.node('btn-pause').fire('click'); g.tick();
    g.tap('pause', 2); assert.equal(g.n.game.mode, 'levels');
  },
  'losing focus or hiding the page pauses without auto-resume': function () {
    const g = game(); g.n.goTo(0);
    g.win.fire('blur'); assert.equal(g.n.game.mode, 'paused');
    g.win.fire('focus'); g.tick(10); assert.equal(g.n.game.mode, 'paused');
    g.key('KeyP'); g.doc.hidden = true; g.doc.fire('visibilitychange');
    assert.equal(g.n.game.mode, 'paused');
  },
  'big hits freeze simulation briefly, and pause still works': function () {
    const g = game(); g.n.goTo(5);
    g.t.damageEnemy(g.n.boss, 2, 'shot');
    assert.ok(g.n.game.hitStop >= 3);
    const frame = g.n.game.frame, hp = g.n.player.invuln;
    g.tick(3); assert.equal(g.n.game.frame, frame); assert.equal(g.n.player.invuln, hp);
    g.tick(); assert.ok(g.n.game.frame > frame);
    g.t.doBlast(700, 200, 30, 3); g.key('KeyP');
    assert.equal(g.n.game.mode, 'paused');
  },
  'ranged foes warn before firing and frozen foes cannot fire': function () {
    const g = game(); g.n.goTo(0);
    const e = g.n.enemies.find(function (e) { return e.shot; });
    g.n.enemies.forEach(function (it) { it.alive = it === e; });
    g.n.player.x = e.x - 80; g.n.player.y = e.y; e.cd = 0;
    g.t.enemyShoot(e);
    assert.ok(e.windups.shot > 0); assert.equal(g.t.bones.length, 0);
    for (let i = 0; i < 22; i++) g.t.enemyShoot(e);
    assert.equal(g.t.bones.length, 0);
    g.t.enemyShoot(e); assert.equal(g.t.bones.length, 1);
    e.cd = 0; e.frozen = 100; g.t.bones.length = 0;
    for (let i = 0; i < 30; i++) g.t.updateEnemies();
    assert.equal(g.t.bones.length, 0);
  },
  'all eight bosses warn before their main attack': function () {
    for (let world = 0; world < 8; world++) {
      const g = game(); g.n.goTo(world * 6 + 5);
      const b = g.n.boss;
      g.n.enemies.forEach(function (e) { e.alive = e === b; });
      b.cd = 0; b.jumpCd = 999; b.warpCd = 999; b.phase = 1;
      g.n.player.x = b.x - 80; g.n.player.y = b.y;
      g.t.updateEnemies();
      assert.ok(b.windups.shot > 0, b.bossName);
      assert.equal(g.t.bones.length, 0, b.bossName);
      for (let i = 0; i < 23; i++) g.t.updateEnemies();
      assert.ok(g.t.bones.length > 0, b.bossName);
    }
  },
  'keyboard and touch dig open real maze walls': function () {
    for (const touch of [false, true]) {
      const g = game(); g.n.goTo(2);
      g.n.player.x = 15 * 16 - 11; g.n.player.y = 20 * 16 + 1;
      g.n.player.facing = 1; g.n.player.invuln = 999;
      assert.equal(g.n.level.grid[20][15], '#');
      if (touch) g.node('btn-dig').fire('pointerdown');
      else g.win.fire('keydown', { code: 'KeyC' });
      g.tick();
      assert.equal(g.n.level.grid[20][15], '.');
      assert.ok(g.n.hint.dist, 'maze hints rebuild after digging');
      if (touch) g.node('btn-dig').fire('pointerup');
      else g.win.fire('keyup', { code: 'KeyC' });
      assert.equal(g.n.input.digHeld, false);
    }
  },
  'a quick touch dig tap is not lost between frames': function () {
    const g = game(); g.n.goTo(2);
    g.n.player.x = 15 * 16 - 11; g.n.player.y = 20 * 16 + 1;
    g.n.player.facing = 1; g.n.player.invuln = 999;
    g.node('btn-dig').fire('pointerdown'); g.node('btn-dig').fire('pointerup');
    g.tick();
    assert.equal(g.n.level.grid[20][15], '.');
    assert.equal(g.n.input.digHeld, false);
  },
  'fired stars, lasers and rockets use the terrain rules': function () {
    for (const weapon of ['star', 'laser', 'rocket']) {
      const g = game(); g.n.goTo(0); g.n.giveWeapon(weapon);
      g.n.player.x = 31 * 16 - 11; g.n.player.y = 14 * 16 - 6;
      g.n.player.facing = 1;
      g.t.doThrow(); g.t.updateShurikens();
      if (weapon === 'star') {
        assert.equal(g.n.level.grid[14][31], '#');
        g.n.player.throwCd = 0; g.t.doThrow(); g.t.updateShurikens();
      }
      assert.equal(g.n.level.grid[14][31], '.', weapon);
      assert.equal(g.n.level.grid[16][31], '#', weapon + ' must leave bedrock');
      if (weapon === 'laser') assert.ok(g.n.shurikens.length, 'laser must pass through broken earth');
    }
  },
  'up and down aim dig without changing world boundaries': function () {
    const g = game(); g.n.goTo(0);
    g.n.player.x = 31 * 16 + 3; g.n.player.y = 14 * 16 - 15;
    g.n.input.down = true; g.n.input.digHeld = true; g.tick();
    assert.equal(g.n.level.grid[14][31], '.');
    g.n.input.down = false; g.n.input.up = true;
    g.n.goTo(2);
    g.t.breakBlock(15, 20);
    g.n.player.x = 15 * 16 + 3; g.n.player.y = 20 * 16;
    g.n.input.up = true; g.n.input.digHeld = true; g.tick();
    assert.equal(g.n.level.grid[19][15], '.');
    assert.equal(g.t.breakBlock(15, 0), false);
  },
  'stars chip earth, blasts carve holes and protected blocks survive': function () {
    const g = game(); g.n.goTo(0);
    assert.equal(g.t.chipBlock(31, 14, 1), false);
    assert.equal(g.n.level.grid[14][31], '#');
    assert.equal(g.t.chipBlock(31, 14, 1), true);
    g.n.goTo(0);
    g.t.doBlast(31 * 16 + 8, 14 * 16 + 8, 30, 4);
    assert.equal(g.n.level.grid[14][31], '.');
    assert.equal(g.n.level.grid[16][31], '#');
    assert.equal(g.t.breakBlock(0, 14), false);
    g.n.goTo(5);
    const original = g.n.level.grid.map(function (r) { return r.join(''); }).join('\n');
    g.t.doBlast(g.n.boss.x, g.n.boss.y + 30, 60, 4);
    assert.equal(g.n.level.grid.map(function (r) { return r.join(''); }).join('\n'), original);
  },
  'removed checkpoint footing cannot cause a death loop': function () {
    const g = game(); g.n.goTo(0);
    g.t.safeSpot.x = 31 * 16 + 3; g.t.safeSpot.y = 14 * 16 - 15;
    g.t.breakBlock(31, 14);
    g.t.respawn();
    assert.equal(g.n.player.x, g.t.spawn.x);
    assert.equal(g.n.player.y, g.t.spawn.y);
  },
  'effects have a fixed particle cap': function () {
    const g = game(); g.n.goTo(0);
    for (let i = 0; i < 50; i++) g.t.doBlast(500, 500, 30, 4);
    assert.ok(g.t.particles.length <= 180);
  },
  'map touch targets and keyboard routes reach levels, code and shop': function () {
    const g = game(); g.key('Space');
    assert.equal(g.n.game.mode, 'worlds');
    assert.equal(g.n.menuHits.filter(function (h) { return h.act === 'world'; }).length, 8);
    g.tap('world', 0); assert.equal(g.n.game.mode, 'levels');
    assert.equal(g.n.menuHits.filter(function (h) { return h.act === 'level'; }).length, 6);
    g.tap('play'); assert.equal(g.n.game.mode, 'play');
    g.key('Escape'); g.tap('pause', 2); g.key('Escape');
    assert.equal(g.n.game.mode, 'worlds');
    g.n.menu.wsel = 7; g.key('ArrowRight'); g.key('Enter');
    assert.equal(g.n.game.mode, 'code');
    g.key('Escape'); g.n.menu.wsel = 8; g.key('ArrowRight'); g.key('Enter');
    assert.equal(g.n.game.mode, 'shop');
  }
};

let failures = 0;
console.log('Game source: ' + (ref || 'worktree') + ', Node ' + process.version);
for (const [name, test] of Object.entries(tests)) {
  try { test(); console.log('PASS ' + name); }
  catch (err) { failures++; console.error('FAIL ' + name + '\n  ' + err.message); }
}
if (failures) process.exitCode = 1;
else console.log(Object.keys(tests).length + ' game checks pass');

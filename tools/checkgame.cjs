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
  const draws = [];
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
    measureText: function (text) { return { width: text.length * 5 }; },
    fillText: function (...args) { draws.push(['text', ...args]); },
    save: function () { draws.push(['save']); },
    restore: function () { draws.push(['restore']); },
    translate: function (...args) { draws.push(['translate', ...args]); },
    scale: function (...args) { draws.push(['scale', ...args]); }
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
  vm.runInContext(fs.readFileSync(path.join(root, 'hazards.js'), 'utf8'), context);
  sandbox.NinjaHazards = win.NinjaHazards;
  for (const file of ['level-rules.js', 'level-data.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  }
  const exports = `window.CHECK = {
    update: update, render: render, goMode: goMode, startLevel: startLevel,
    updatePlayer: updatePlayer, doJump: doJump, resolveY: resolveY, drawNinja: drawNinja,
    breakBlock: breakBlock, chipBlock: typeof chipBlock === 'function' ? chipBlock : null,
    doBlast: doBlast, damageEnemy: damageEnemy, enemyShoot: enemyShoot,
    updateEnemies: updateEnemies, respawn: respawnAtSafeSpot,
    doThrow: doThrow, updateShurikens: updateShurikens,
    makeShot: makeShot, spotIsSafe: spotIsSafe,
    killPlayer: killPlayer, gameOver: gameOver, bankRun: bankRun, saveBest: saveBest, saveProgress: saveProgress,
    markGem: markGem, awardMedals: awardMedals, unlockUpTo: unlockUpTo,
    get safeSpot() { return safeSpot; }, get spawn() { return spawn; },
    get bones() { return bones; }, get particles() { return particles; }
  };`;
  const code = source('game.js').replace('  loadProgress();\n  game.best', exports + '\n  loadProgress();\n  game.best');
  assert.ok(code.includes(exports), 'test hook must attach to the actual boot path');
  vm.runInContext(code, context);
  const n = win.NINJA, t = win.CHECK;
  function tick(count = 1) { for (let i = 0; i < count; i++) { t.update(); draws.length = 0; t.render(); } }
  function key(code) { win.fire('keydown', { code: code }); tick(); win.fire('keyup', { code: code }); }
  function tap(action, i) {
    t.render();
    const target = n.menuHits.find(function (h) { return h.act === action && (i === undefined || h.i === i); });
    assert.ok(target, 'missing touch target: ' + action + ' ' + i);
    node('game').fire('pointerdown', { clientX: target.x + target.w / 2, clientY: target.y + target.h / 2 });
    tick();
  }
  return { n, t, tick, key, tap, node, win, doc, storage, draws };
}

function arena() {
  const g = game();
  g.n.goTo(0);
  const l = g.n.level;
  l.w = 32; l.h = 48; l.pxW = l.w * 16; l.pxH = l.h * 16;
  l.grid = Array.from({ length: l.h }, function () { return Array(l.w).fill('.'); });
  g.n.enemies.length = 0;
  Object.assign(g.n.player, {
    x: 120, y: 400, vx: 0, vy: 0, onGround: false,
    jumpsLeft: 0, coyote: 0, invuln: 9999
  });
  g.jump = function (touch = false) {
    if (touch) g.node('btn-jump').fire('pointerdown');
    else g.win.fire('keydown', { code: 'Space' });
    g.t.updatePlayer();
    if (touch) g.node('btn-jump').fire('pointerup');
    else g.win.fire('keyup', { code: 'Space' });
  };
  return g;
}

function oldFlight(speed, held) {
  let y = 0, vy = speed, rise = 0, frames = 0, apexFrames = 0;
  do {
    if (Math.abs(vy) < 0.7) apexFrames++;
    if (!held && vy < -2) vy += 0.35;
    vy = Math.min(8, vy + 0.45);
    y += vy;
    rise = Math.max(rise, -y);
    frames++;
  } while (y < 0 && frames < 120);
  return { rise, frames, apexFrames };
}

const tests = {
  'all eight weapons light barrels, with a full fuse and no touch trigger': function () {
    for (const weapon of ['star', 'shotgun', 'rocket', 'flame', 'laser', 'boomerang', 'bombs', 'ice']) {
      const g = game({ v: 4, buys: { ice: 1 } }), data = g.win.NinjaLevelData;
      const draft = data.template(); data.paint(draft, 8, 13, 'e');
      g.n.openEditor(); assert.equal(g.n.playCustom(draft).error, undefined);
      assert.ok(g.n.hazards, 'hazard state must be loaded from the map');
      const b = g.n.hazards.barrels[0], p = g.n.player;
      p.x = b.x; p.y = b.y - 1; g.tick(3);
      assert.equal(b.fuse, -1, weapon + ': walking through is safe');
      p.x = 2 * 16 + 3;
      g.n.shurikens.push(g.t.makeShot(weapon, b.x - 3, b.y + 3, 3, 0));
      g.t.updateShurikens();
      assert.equal(b.fuse, 48, weapon + ': real shot arms the barrel');
      const enemy = g.n.enemies[0] || { x: b.x + 14, y: b.y, w: 12, h: 14,
        alive: true, hp: 3, maxHp: 3, color: '#ffffff' };
      g.n.enemies.push(enemy);
      g.n.game.hitStop = 0;
      for (let i = 0; i < 47; i++) g.win.NinjaHazards.tick(g.n.hazards, g.t.doBlast);
      assert.equal(b.spent, false, 'no early detonation');
      assert.equal(enemy.hp, 3);
      g.win.NinjaHazards.tick(g.n.hazards, g.t.doBlast);
      assert.equal(b.spent, true);
      assert.equal(enemy.alive, false, 'real shared blast kills a nearby foe');
      const score = g.n.game.score;
      for (let i = 0; i < 100; i++) g.win.NinjaHazards.tick(g.n.hazards, g.t.doBlast);
      assert.equal(g.n.game.score, score, 'spent barrels cannot detonate twice');
    }
  },
  'barrel chains are bounded, ordered by full fuses, and use protected terrain': function () {
    const g = game(), data = g.win.NinjaLevelData, h = g.win.NinjaHazards;
    const draft = data.template();
    for (const x of [6, 8, 10]) data.paint(draft, x, 13, 'e');
    g.n.openEditor(); g.n.playCustom(draft);
    assert.ok(g.n.hazards, 'barrels must be present in game state');
    const state = g.n.hazards, grid = g.n.level.grid;
    const mask = g.n.level.protected, before = grid.map(row => row.slice());
    const b = state.barrels[2], p = g.n.player;
    p.x = b.x + 15; p.y = b.y; p.vx = 0; p.vy = 0;
    const hearts = g.n.game.hearts;
    h.arm(b);
    for (let i = 0; i < 48; i++) h.tick(state, g.t.doBlast);
    assert.equal(state.barrels[1].fuse, 48, 'new chain link gets the full fuse in either list order');
    assert.equal(state.barrels[1].spent, false);
    assert.equal(g.n.game.hearts, hearts, 'blast pushes, never takes hearts');
    assert.ok(p.vx > 0 && p.vy < 0);
    assert.equal(grid[14][11], '.', 'unprotected earth is removed by real barrel blast');
    for (let i = 0; i < 96; i++) h.tick(state, g.t.doBlast);
    assert.ok(state.barrels.every(b => b.spent), 'chain completes');
    for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y].length; x++) {
      if (mask[y][x]) assert.equal(grid[y][x], before[y][x], 'protected ' + x + ',' + y);
    }
    const rows = ['e'.repeat(h.barrelLimit)];
    const full = h.create(rows); let depth = 0, maximum = 0, count = 0;
    const blast = (x, y, radius) => { depth++; maximum = Math.max(maximum, depth); count++; h.ignite(full, x, y, radius); depth--; };
    h.arm(full.barrels[0]);
    for (let i = 0; i < 48 * 25; i++) h.tick(full, blast);
    assert.equal(count, 24); assert.equal(maximum, 1, 'no recursive explosions');
    assert.throws(() => h.create(['e'.repeat(25)]), /at most 24/);
  },
  'barrel fuse freezes during pause and hit-stop, and retry restores the draft': function () {
    const g = game(), data = g.win.NinjaLevelData, draft = data.template();
    data.paint(draft, 8, 13, 'e');
    g.n.openEditor(); g.n.playCustom(draft);
    assert.ok(g.n.hazards, 'barrels must exist');
    const h = g.win.NinjaHazards, b = g.n.hazards.barrels[0];
    h.arm(b);
    g.n.game.hitStop = 4; g.tick(4); assert.equal(b.fuse, 48);
    g.key('KeyP'); assert.equal(g.n.game.mode, 'paused');
    g.tick(90); assert.equal(b.fuse, 48);
    g.key('Escape'); g.tick();
    assert.ok(b.fuse < 48);
    g.n.restartCustom();
    assert.equal(g.n.hazards.barrels[0].fuse, -1);
    assert.equal(g.n.hazards.barrels[0].spent, false);
    assert.equal(draft.rows[13][8], 'e');
  },
  'old saves keep progress, shop items, gems and medals': function () {
    const save = { v: 4, max: 19, best: 700, gems: { 0: 7, 2: 3 }, coins: 230, spentGems: 4, buys: { ice: 1, heart: 2 }, medals: { 0: 5 } };
    const g = game(save);
    for (const k of Object.keys(save).filter(function (k) { return k !== 'v'; })) {
      assert.equal(JSON.stringify(g.n.progress[k]), JSON.stringify(save[k]), k);
    }
  },
  'custom maps validate before loading and never replace the campaign': function () {
    const g = game(), data = g.win.NinjaLevelData;
    const originalWidth = g.n.level.w;
    assert.equal(typeof g.n.openEditor, 'function', 'level editor entry must exist in the game');
    assert.ok(g.n.openEditor());
    const invalid = data.template(); invalid.rows.pop();
    assert.ok(g.n.playCustom(invalid).error);
    assert.equal(g.n.game.mode, 'editor');
    for (let world = 0; world < 8; world++) {
      const draft = data.template(); draft.world = world;
      assert.equal(g.n.playCustom(draft).error, undefined);
      assert.equal(g.n.level.w, 24); assert.equal(g.n.level.h, 17);
      assert.equal(g.n.level.world, world);
      assert.equal(g.n.level.pal, g.n.editorPalette(world));
      g.n.level.grid[14][6] = '.';
      g.n.restartCustom();
      assert.equal(g.n.level.grid[14][6], '#', 'retry restores the draft tiles');
      assert.equal(draft.rows[14][6], '#', 'play never digs into the draft');
      g.n.returnToEditor();
      assert.equal(g.n.game.mode, 'editor');
    }
    g.n.closeEditor();
    assert.equal(g.n.game.mode, 'title');
    assert.equal(g.n.level.w, originalWidth, 'original campaign level stays intact');
  },
  'custom gems, coins, medals, unlocks, shop and best scores never write campaign data': function () {
    const save = { v: 4, max: 19, best: 700, gems: { 0: 7 }, coins: 230, spentGems: 0,
      buys: { ice: 1 }, medals: { 0: 5 } };
    const g = game(save), data = g.win.NinjaLevelData;
    assert.equal(typeof g.n.playCustom, 'function', 'custom play must exist');
    const draft = data.template();
    data.paint(draft, 3, 13, 'g'); data.paint(draft, 4, 13, 'o');
    const raw = g.storage.get('ninjaMasterSaveV2'), progress = JSON.stringify(g.n.progress);
    g.n.openEditor(); g.n.playCustom(draft);
    function unchanged(label) {
      assert.equal(g.storage.get('ninjaMasterSaveV2'), raw, label + ': stored save is byte-for-byte unchanged');
      assert.equal(JSON.stringify(g.n.progress), progress, label + ': no in-memory rewards');
    }
    g.n.player.x = 3 * 16 + 3; g.n.player.y = 13 * 16 + 1; g.tick();
    assert.equal(g.n.gems[0].taken, true, 'collect a real custom gem');
    unchanged('gem');
    g.n.player.x = 4 * 16 + 3; g.n.player.y = 13 * 16 + 1; g.tick();
    assert.ok(g.n.game.runCoins > 0, 'collect a real custom coin'); unchanged('coin');
    g.n.game.score = 99999;
    g.n.game.best = 99999; g.t.saveProgress(); unchanged('save guard'); g.n.game.best = 700;
    g.t.markGem(1, 1); g.t.awardMedals(0, 7); g.t.unlockUpTo(48);
    g.t.bankRun(); g.t.saveBest();
    assert.equal(g.n.game.best, 700, 'custom scores do not change best score in memory');
    assert.equal(g.n.buy('heart'), false);
    g.n.giveCoins(500); g.n.unlockAll(); g.n.wipeSave(); g.n.openShop();
    g.n.goTo(47);
    assert.equal(g.n.game.score, 99999, 'debug goTo cannot reset the custom run');
    assert.equal(g.n.customPlaying, true, 'debug goTo cannot bypass the custom boundary');
    assert.equal(g.n.game.mode, 'play');
    unchanged('direct reward and debug paths');
    g.n.player.x = g.n.flag.x; g.n.player.y = g.n.flag.y + 32;
    g.n.player.vx = 0; g.n.player.vy = 0; g.tick();
    assert.equal(g.n.game.mode, 'clear', 'real flag completion');
    g.tick(150); assert.equal(g.n.game.mode, 'clear', 'never advance into campaign'); unchanged('clear');
    g.key('Space'); assert.equal(g.n.game.mode, 'play'); unchanged('completion replay');
    for (const mode of ['gameover', 'win']) {
      g.t.goMode(mode); g.tick(150); unchanged(mode);
      g.key('Space'); assert.equal(g.n.game.mode, 'play'); unchanged(mode + ' replay');
    }
    g.n.game.hearts = 1; g.t.killPlayer(); g.tick(60);
    assert.equal(g.n.game.mode, 'gameover'); unchanged('death');
    g.key('Escape'); assert.equal(g.n.game.mode, 'editor'); unchanged('exit after death');
    g.n.closeEditor(); unchanged('back to game');
  },
  'custom pause, retry and all exits return to the same campaign selection': function () {
    const g = game({ v: 4, max: 19, best: 700, coins: 230, buys: { heart: 2 } });
    assert.equal(typeof g.n.openEditor, 'function', 'editor entry must exist');
    g.n.goTo(8); g.t.goMode('levels');
    const snapshot = JSON.stringify([g.n.game.level, g.n.game.score, g.n.game.hearts, g.n.game.maxHearts, g.n.game.best, g.n.menu.world, g.n.menu.level]);
    const raw = g.storage.get('ninjaMasterSaveV2'), progress = JSON.stringify(g.n.progress);
    const draft = g.win.NinjaLevelData.template();
    for (const exit of ['direct', 'pause', 'menu', 'clear-back', 'gameover-back', 'win-back']) {
      assert.ok(g.n.openEditor());
      g.n.playCustom(draft);
      assert.equal(g.n.game.maxHearts, 5);
      assert.equal(g.n.openEditor(), false, 'cannot open a nested editor from play');
      if (exit === 'direct') { g.n.returnToEditor(); }
      else if (exit === 'pause' || exit === 'menu') {
        g.node('btn-pause').fire('click'); g.tick();
        g.tap('pause', 1); assert.equal(g.n.game.mode, 'play');
        assert.equal(g.n.game.maxHearts, 5, 'pause restart stays in custom play');
        g.node('btn-pause').fire('click'); g.tick();
        if (exit === 'pause') { g.tap('pause', 2); }
        else { g.node('btn-menu').fire('click'); }
      } else {
        g.t.goMode(exit.split('-')[0]); g.key('Escape');
      }
      assert.equal(g.n.game.mode, 'editor', exit);
      g.n.closeEditor(); assert.equal(g.n.game.mode, 'levels', exit);
      assert.equal(JSON.stringify([g.n.game.level, g.n.game.score, g.n.game.hearts, g.n.game.maxHearts, g.n.game.best, g.n.menu.world, g.n.menu.level]), snapshot, exit + ': resume state');
      assert.equal(JSON.stringify(g.n.progress), progress);
      assert.equal(g.storage.get('ninjaMasterSaveV2'), raw);
    }
    g.t.startLevel(8);
    assert.equal(g.n.level.world, 1); assert.equal(g.n.customPlaying, false);
    g.t.markGem(8, 0);
    assert.ok(g.n.progress.gems[8] & 1, 'campaign saving still works after leaving custom play');
    assert.notEqual(g.storage.get('ninjaMasterSaveV2'), raw);
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
  },
  'rising head corners nudge by exactly 1-4 px on both sides': function () {
    for (const side of [-1, 1]) {
      for (let clip = 1; clip <= 4; clip++) {
        const g = arena(), p = g.n.player;
        g.n.level.grid[9][10] = '#';
        p.x = side < 0 ? 160 - p.w + clip : 176 - clip;
        p.y = 160; p.vy = -3;
        const x = p.x;
        g.n.input.jumpHeld = true;
        g.t.updatePlayer();
        assert.equal(p.x, x + side * clip, 'side ' + side + ', clip ' + clip);
        assert.ok(p.y < 160 && p.vy < 0, 'the jump must keep rising');
        assert.equal(g.n.level.grid[9][10], '#', 'no terrain is removed');
      }
    }
  },
  'corner nudges cannot pass wide ceilings, walls, floors or world edges': function () {
    for (const side of [-1, 1]) {
      const g = arena(), p = g.n.player;
      g.n.level.grid[9][10] = '#';
      p.x = side < 0 ? 155 : 171; p.y = 160; p.vy = -3;
      const x = p.x;
      g.t.updatePlayer();
      assert.equal(p.x, x, 'a 5 px clip must stop the jump');
      assert.equal(p.y, 160); assert.equal(p.vy, 0);
    }
    for (const setup of ['ceiling', 'edge', 'sidewall', 'fall']) {
      const g = arena(), p = g.n.player;
      p.y = 160; p.vy = -3;
      if (setup === 'edge') {
        g.n.level.grid[9][0] = '#'; p.x = 0;
      } else {
        g.n.level.grid[9][10] = '#'; p.x = 153;
        if (setup === 'ceiling') g.n.level.grid[9][9] = '#';
        if (setup === 'sidewall') g.n.level.grid[10][10] = '#';
        if (setup === 'fall') { p.y = 128; p.vy = 3; }
      }
      const x = p.x;
      g.t.updatePlayer();
      assert.equal(p.x, x, setup);
      assert.equal(p.vy, 0, setup);
    }
    const g = arena();
    g.n.level.grid[9][10] = '#';
    const enemy = { x: 153, y: 158, w: 10, h: 15, vy: -3 };
    g.t.resolveY(enemy);
    assert.equal(enemy.x, 153); assert.equal(enemy.vy, 0, 'enemy physics stay unchanged');
  },
  'held jump uses half gravity only in the narrow apex band': function () {
    for (const held of [false, true]) {
      for (const speed of [-4, -0.8, -0.4, 0.4, 0.8, 7.9]) {
        const g = arena(), p = g.n.player;
        p.vy = speed; g.n.input.jumpHeld = held;
        g.t.updatePlayer();
        const cut = !held && speed < -2 ? 0.35 : 0;
        const gravity = held && Math.abs(speed) < 0.7 ? 0.225 : 0.45;
        assert.ok(Math.abs(p.vy - Math.min(8, speed + cut + gravity)) < 1e-9,
          'held ' + held + ', speed ' + speed + ', got ' + p.vy);
      }
    }
  },
  'floaty top adds time but keeps jump height within 1 px and tap hops unchanged': function () {
    for (const boots of [false, true]) {
      for (const air of [false, true]) {
        for (const held of [false, true]) {
          const g = arena(), p = g.n.player;
          p.onGround = !air; p.jumpsLeft = air ? 1 : 2;
          p.bootT = boots ? 999 : 0;
          g.n.input.jumpHeld = held;
          g.t.doJump();
          const speed = -7.6 * (air ? 0.92 : 1) * (boots ? 1.16 : 1);
          assert.equal(p.vy, speed, 'take-off speed must not change');
          const old = oldFlight(speed, held);
          let rise = 0, frames = 0, apexFrames = 0;
          do {
            if (Math.abs(p.vy) < 0.7) apexFrames++;
            g.t.updatePlayer();
            rise = Math.max(rise, 400 - p.y);
            frames++;
          } while (p.y < 400 && frames < 120);
          assert.ok(Math.abs(rise - old.rise) < 1, JSON.stringify({ boots, air, held, rise, old }));
          if (held) {
            assert.ok(apexFrames >= old.apexFrames + 2, 'held jump must linger at the top');
            assert.ok(frames >= old.frames + 2, 'held jump must stay in the air longer');
          } else {
            assert.equal(frames, old.frames, 'tap timing must stay unchanged');
            assert.ok(Math.abs(rise - old.rise) < 1e-9, 'tap height must stay unchanged');
          }
        }
      }
    }
    const g = arena(), p = g.n.player;
    p.coyote = 6;
    for (let i = 0; i < 5; i++) g.t.updatePlayer();
    assert.equal(p.coyote, 1);
    g.jump();
    assert.ok(p.vy < -7, 'last coyote frame still allows a ground jump');
    const h = arena();
    h.n.player.coyote = 6;
    for (let i = 0; i < 6; i++) h.t.updatePlayer();
    assert.equal(h.n.player.coyote, 0, 'coyote time still expires after six frames');
    h.jump(); assert.ok(h.n.player.vy > 0, 'expired coyote time must not allow a jump');
  },
  'wall kicks reach 3 px on either side by keyboard and touch, but not 4 px': function () {
    for (const touch of [false, true]) {
      for (const side of [-1, 1]) {
        for (const gap of [0, 1, 2, 3, 4]) {
          const g = arena(), p = g.n.player;
          for (const row of g.n.level.grid) row[10] = '#';
          p.x = side > 0 ? 160 - p.w - gap : 176 + gap;
          p.vy = 1; p.facing = side;
          g.n.input[side > 0 ? 'right' : 'left'] = true;
          g.jump(touch);
          if (gap <= 3) {
            assert.ok(p.vy < -6, 'side ' + side + ', gap ' + gap + ', touch ' + touch);
            assert.equal(p.vx, -side * 3);
          } else {
            assert.ok(p.vy > 0, '4 px is out of reach');
          }
        }
      }
    }
    for (const rising of [false, true]) {
      const g = arena(), p = g.n.player;
      for (const row of g.n.level.grid) row[10] = '#';
      p.x = 147; p.vy = rising ? -1 : 1;
      g.n.input.right = rising;
      g.jump();
      assert.ok(p.vy > -2, 'still requires falling and holding towards the wall');
    }
  },
  'wall slides refill an air jump and same-wall kicks remain repeatable': function () {
    for (const touch of [false, true]) {
      for (const side of [-1, 1]) {
        const g = arena(), p = g.n.player;
        for (const row of g.n.level.grid) row[10] = '#';
        g.n.input[side > 0 ? 'right' : 'left'] = true;
        for (let i = 0; i < 4; i++) {
          Object.assign(p, {
            x: side > 0 ? 150 : 176, y: 400, vy: 1, vx: 0,
            wallLock: 0, jumpsLeft: 0
          });
          g.t.updatePlayer();
          assert.equal(p.jumpsLeft, 1, 'every wall slide refills one air jump');
          g.jump(touch);
          assert.ok(p.vy < -6, 'the same wall must allow another kick');
          assert.equal(p.vx, -side * 3);
          assert.equal(p.wallLock, 9);
          assert.equal(p.jumpsLeft, 1, 'wall kicks keep the old spare air jump');
        }
      }
    }
  },
  'lone walls and shafts remain climbable with the old wall-jump rules': function () {
    for (const shaft of [false, true]) {
      const g = arena(), p = g.n.player;
      for (const row of g.n.level.grid) {
        row[10] = '#';
        if (shaft) row[6] = '#';
      }
      p.x = 150; p.y = 600; p.vy = 1;
      let side = 1, kicks = 0, best = p.y;
      for (let frame = 0; frame < 1500 && p.y < 720 && p.y > 100; frame++) {
        g.n.input.right = side > 0; g.n.input.left = side < 0;
        g.n.input.jumpHeld = true;
        const near = side > 0 ? p.x + p.w >= 159 : p.x <= 113;
        if (near && p.vy > 0) {
          g.win.fire('keydown', { code: 'Space' });
        }
        g.t.updatePlayer();
        if (p.wallLock === 9) { kicks++; side = shaft ? -side : 1; }
        best = Math.min(best, p.y);
      }
      assert.ok(kicks >= 6 && best < 300, JSON.stringify({ shaft, kicks, best }));
    }
  },
  'both level solvers keep the old wall-kick and landing model': function () {
    for (const file of ['tools/checklevels.cjs', 'tools/genlevels.cjs']) {
      const code = source(file);
      const solverCode = code.slice(code.indexOf('function makeSolver('), code.indexOf('function analyse('));
      const makeSolver = file === 'tools/checklevels.cjs' && !code.includes('function makeSolver(') ?
        require('../level-rules.js').makeSolver :
        new Function('MAXDX_UP', 'MAXDX_WALL', 'SPRING_RISE', 'SPRING_DX',
          solverCode + '\nreturn makeSolver;')([4, 3, 3, 2], [0, 3, 3, 2], 6, 2);
      const rows = Array.from({ length: 48 }, function () {
        const row = Array(32).fill('.'); row[6] = '#'; row[10] = '#'; return row;
      });
      const solver = makeSolver(rows);
      for (const side of [-1, 1]) {
        const x = side < 0 ? 7 : 9;
        const moves = [];
        solver.moves(x, 30, 1, false, function (nx, ny, next) { moves.push({ nx, ny, next }); });
        const rising = moves.filter(function (m) { return m.ny < 30; });
        assert.ok(rising.length > 0, file + ': wall kicks are available on both sides');
        assert.ok(rising.every(function (m) { return m.next === 1; }),
          file + ': wall landings allow another kick without a side lock');
        assert.ok(moves.some(function (m) { return m.ny > 30 && m.next === 1; }),
          file + ': falling along a wall keeps wall kicks available');
      }
      rows[28][7] = '#';
      const landings = [];
      solver.moves(9, 30, 1, false, function (nx, ny, next) { landings.push({ nx, ny, next }); });
      assert.ok(landings.some(function (m) { return m.nx === 7 && m.ny === 27 && m.next === 0; }),
        file + ': a solid landing returns to ground mode');
    }
  },
  'take-off stretch and speed-scaled landing squash only change drawing': function () {
    for (const touch of [false, true]) {
      const g = arena(), p = g.n.player;
      p.onGround = true; p.jumpsLeft = 2;
      g.jump(touch);
      assert.ok(p.drawScaleX < 1 && p.drawScaleY > 1, 'take-off stretches');
      p.invuln = 0;
      const before = JSON.stringify(p);
      g.draws.length = 0; g.t.drawNinja(p);
      assert.ok(g.draws.some(function (d) { return d[0] === 'scale' && d[1] === p.drawScaleX && d[2] === p.drawScaleY; }),
        'the sprite must use the scale values');
      assert.equal(JSON.stringify(p), before, 'drawing cannot change physics');
      assert.deepEqual(g.draws.filter(function (d) { return d[0] === 'translate'; }), [
        ['translate', Math.round(p.x) + p.w / 2, Math.round(p.y) + p.h],
        ['translate', -Math.round(p.x) - p.w / 2, -Math.round(p.y) - p.h]
      ], 'scale around the feet');
      assert.equal(g.draws[0][0], 'save'); assert.equal(g.draws.at(-1)[0], 'restore');
      for (let i = 0; i < 20; i++) g.t.updatePlayer();
      assert.equal(p.drawScaleX, 1); assert.equal(p.drawScaleY, 1, 'stretch settles quickly');
      assert.equal(p.w, 10); assert.equal(p.h, 15);
    }
    const widths = [];
    for (const impact of [1, 8]) {
      const g = arena(), p = g.n.player;
      g.n.level.grid[26].fill('#');
      p.y = 401; p.vy = impact;
      g.t.updatePlayer();
      assert.ok(p.onGround); assert.equal(p.y, 401); assert.equal(p.vy, 0);
      assert.ok(p.drawScaleX > 1 && p.drawScaleY < 1, 'landing squashes');
      widths.push(p.drawScaleX);
      for (let i = 0; i < 20; i++) g.t.updatePlayer();
      assert.equal(p.drawScaleX, 1); assert.equal(p.drawScaleY, 1);
      assert.equal(p.w, 10); assert.equal(p.h, 15);
    }
    assert.ok(widths[1] > widths[0], 'hard landings squash more');
    for (const kind of ['air', 'wall', 'spring', 'ice']) {
      const g = arena(), p = g.n.player;
      if (kind === 'air') {
        p.jumpsLeft = 1; g.jump();
      } else if (kind === 'wall') {
        for (const row of g.n.level.grid) row[10] = '#';
        p.x = 147; p.vy = 1; g.n.input.right = true; g.jump();
      } else if (kind === 'spring') {
        g.n.level.grid[26].fill('T'); p.y = 401; p.vy = 3; g.t.updatePlayer();
      } else {
        g.n.enemies.push({ x: 112, y: 416, w: 24, h: 16, frozen: 99, alive: true });
        p.y = 400; p.vy = 3; g.t.updatePlayer();
      }
      if (kind === 'ice') {
        assert.ok(p.onGround && p.drawScaleX > 1 && p.drawScaleY < 1, 'ice landing squashes too');
      } else {
        assert.ok(p.vy < 0 && p.drawScaleX < 1 && p.drawScaleY > 1, kind + ' take-off stretches too');
      }
      assert.equal(p.w, 10); assert.equal(p.h, 15, kind + ' keeps its hitbox');
    }
    const g = arena(), p = g.n.player;
    p.drawScaleX = 1.3; p.drawScaleY = 0.7;
    g.t.respawn();
    assert.equal(p.drawScaleX, 1); assert.equal(p.drawScaleY, 1, 'respawn clears the effect');
  },
  'title explains dig and pause for keyboard and touch without clipped text': function () {
    const g = game(); g.tick();
    const texts = g.draws.filter(function (d) { return d[0] === 'text'; });
    const strings = texts.map(function (d) { return d[1]; });
    assert.ok(strings.some(function (s) { return /hold c.*dig.*p or escape.*pause/i.test(s); }), 'keyboard dig and pause');
    assert.ok(strings.some(function (s) { return /hold dig.*dig.*tap pause.*pause/i.test(s); }), 'touch dig and pause');
    for (const d of texts) {
      assert.ok(d[1].length * 5 <= 376, 'hint fits within the canvas: ' + d[1]);
      assert.ok(d[3] >= 0 && d[3] <= 272, 'hint stays on screen');
    }
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

/* ============================================================
   NINJA MASTER
   A platform game. Runs in any browser. Keyboard or touch.
   ============================================================ */

(function () {
  'use strict';

  var TILE = 16;
  var VIEW_W = 384;
  var VIEW_H = 272;
  var STEP = 1000 / 60;

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  /* ---------------- palettes ---------------- */

  var PALETTES = [
    { skyTop: '#0d1330', skyBot: '#2b2550', hillFar: '#1b2450', hillNear: '#121a38',
      rock: '#3c4a63', rockTop: '#5b708c', plank: '#6b5136', plankTop: '#8d6c49' },
    { skyTop: '#180d2c', skyBot: '#3c1f4c', hillFar: '#2a1a45', hillNear: '#190f30',
      rock: '#463a58', rockTop: '#6d5a7a', plank: '#5d4630', plankTop: '#7f6140' },
    { skyTop: '#280b0e', skyBot: '#5a171b', hillFar: '#3a1214', hillNear: '#20080a',
      rock: '#553028', rockTop: '#7d4b3a', plank: '#5a3a28', plankTop: '#7c5238' },
    { skyTop: '#04202a', skyBot: '#0d4a52', hillFar: '#0c313e', hillNear: '#06202b',
      rock: '#2f4f55', rockTop: '#4a757c', plank: '#5b5030', plankTop: '#7d6e44' },
    { skyTop: '#1d1a10', skyBot: '#4a3f20', hillFar: '#2e2716', hillNear: '#17130a',
      rock: '#4d4534', rockTop: '#736850', plank: '#63492c', plankTop: '#87663f' },
    { skyTop: '#0a1a3d', skyBot: '#2e5aa8', hillFar: '#1d3a76', hillNear: '#102450',
      rock: '#48597e', rockTop: '#7089b5', plank: '#7a6a4a', plankTop: '#a08c62' },
    { skyTop: '#150410', skyBot: '#480a2a', hillFar: '#2c0720', hillNear: '#150312',
      rock: '#4a2438', rockTop: '#743a56', plank: '#5a2f3c', plankTop: '#7d4352' }
  ];
  /* ---------------- sound ---------------- */

  var Sound = {
    ac: null,
    on: true,
    init: function () {
      if (!this.ac) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) { this.ac = new AC(); }
      }
      if (this.ac && this.ac.state === 'suspended') { this.ac.resume(); }
    },
    tone: function (freq, dur, type, vol, sweepTo) {
      if (!this.on || !this.ac) { return; }
      var t = this.ac.currentTime;
      var osc = this.ac.createOscillator();
      var gain = this.ac.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, t);
      if (sweepTo) { osc.frequency.exponentialRampToValueAtTime(sweepTo, t + dur); }
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(this.ac.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },
    jump: function () { this.tone(320, 0.12, 'square', 0.09, 620); },
    flip: function () { this.tone(480, 0.14, 'triangle', 0.09, 880); },
    coin: function () { this.tone(880, 0.06, 'square', 0.08); var s = this; setTimeout(function () { s.tone(1320, 0.09, 'square', 0.08); }, 55); },
    star: function () { this.tone(1000, 0.06, 'sawtooth', 0.05, 500); },
    bonk: function () { this.tone(180, 0.18, 'sawtooth', 0.11, 70); },
    squish: function () { this.tone(240, 0.1, 'square', 0.09, 90); },
    stomp: function () { this.tone(520, 0.08, 'square', 0.09, 260); },
    hurt: function () { this.tone(260, 0.28, 'sawtooth', 0.13, 80); },
    power: function () {
      var s = this, notes = [523, 698, 880];
      notes.forEach(function (n, i) { setTimeout(function () { s.tone(n, 0.12, 'square', 0.1); }, i * 70); });
    },
    heal: function () { this.tone(660, 0.1, 'triangle', 0.11); var s = this; setTimeout(function () { s.tone(990, 0.16, 'triangle', 0.11); }, 90); },
    roar: function () { this.tone(120, 0.5, 'sawtooth', 0.14, 55); },
    win: function () {
      var s = this, notes = [523, 659, 784, 1046];
      notes.forEach(function (n, i) { setTimeout(function () { s.tone(n, 0.16, 'square', 0.1); }, i * 110); });
    },
    lose: function () {
      var s = this, notes = [400, 330, 260, 160];
      notes.forEach(function (n, i) { setTimeout(function () { s.tone(n, 0.22, 'sawtooth', 0.11); }, i * 150); });
    }
  };

  /* ---------------- input ---------------- */

  var input = { left: false, right: false, jumpHeld: false, throwHeld: false };
  var jumpBuffer = 0;
  var throwEdge = false;
  var confirmEdge = false;

  var KEY_LEFT = { ArrowLeft: 1, KeyA: 1 };
  var KEY_RIGHT = { ArrowRight: 1, KeyD: 1 };
  var KEY_JUMP = { Space: 1, ArrowUp: 1, KeyW: 1, KeyZ: 1 };
  var KEY_THROW = { KeyX: 1, KeyJ: 1, KeyK: 1, ShiftLeft: 1, ShiftRight: 1, Enter: 1 };

  window.addEventListener('keydown', function (e) {
    Sound.init();
    if (e.repeat) {
      if (KEY_LEFT[e.code] || KEY_RIGHT[e.code] || KEY_JUMP[e.code] || KEY_THROW[e.code]) { e.preventDefault(); }
      return;
    }
    if (KEY_LEFT[e.code]) { input.left = true; e.preventDefault(); }
    else if (KEY_RIGHT[e.code]) { input.right = true; e.preventDefault(); }
    else if (KEY_JUMP[e.code]) { input.jumpHeld = true; jumpBuffer = 8; confirmEdge = true; e.preventDefault(); }
    else if (KEY_THROW[e.code]) { input.throwHeld = true; throwEdge = true; confirmEdge = true; e.preventDefault(); }
  });

  window.addEventListener('keyup', function (e) {
    if (KEY_LEFT[e.code]) { input.left = false; }
    else if (KEY_RIGHT[e.code]) { input.right = false; }
    else if (KEY_JUMP[e.code]) { input.jumpHeld = false; }
    else if (KEY_THROW[e.code]) { input.throwHeld = false; }
  });

  window.addEventListener('blur', function () {
    input.left = input.right = input.jumpHeld = input.throwHeld = false;
  });

  function bindHold(el, onDown, onUp) {
    if (!el) { return; }
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      Sound.init();
      if (el.setPointerCapture) { try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
      el.classList.add('held');
      onDown();
    });
    var release = function (e) {
      if (e) { e.preventDefault(); }
      el.classList.remove('held');
      onUp();
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('lostpointercapture', release);
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  bindHold(document.getElementById('btn-left'),
    function () { input.left = true; confirmEdge = true; },
    function () { input.left = false; });

  bindHold(document.getElementById('btn-right'),
    function () { input.right = true; confirmEdge = true; },
    function () { input.right = false; });

  bindHold(document.getElementById('btn-jump'),
    function () { input.jumpHeld = true; jumpBuffer = 8; confirmEdge = true; },
    function () { input.jumpHeld = false; });

  bindHold(document.getElementById('btn-throw'),
    function () { input.throwHeld = true; throwEdge = true; confirmEdge = true; },
    function () { input.throwHeld = false; });

  canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    Sound.init();
    confirmEdge = true;
    if (game.mode === 'play') { jumpBuffer = 8; }
  });

  window.addEventListener('touchstart', function () {
    document.body.classList.add('touch');
  }, { once: true, passive: true });

  var soundBtn = document.getElementById('btn-sound');
  soundBtn.addEventListener('click', function () {
    Sound.init();
    Sound.on = !Sound.on;
    soundBtn.textContent = Sound.on ? 'SOUND ON' : 'SOUND OFF';
  });

  var fullBtn = document.getElementById('btn-full');
  fullBtn.addEventListener('click', function () {
    var el = document.documentElement;
    if (!document.fullscreenElement) {
      var req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) { req.call(el); }
    } else {
      var ex = document.exitFullscreen || document.webkitExitFullscreen;
      if (ex) { ex.call(document); }
    }
  });

  /* ---------------- helpers ---------------- */

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  /* ---------------- world ---------------- */

  var game = {
    mode: 'title',
    level: 0,
    score: 0,
    hearts: 5,
    maxHearts: 5,
    timer: 0,
    shake: 0,
    frame: 0,
    best: 0
  };

  var START_HEARTS = 5;
  var HEART_CAP = 8;

  /* The things you can pick up. Each one has a letter you put in levels.js. */
  var POWERUPS = {
    'H': { name: 'HEART', color: '#ff5a6e', help: 'one heart back' },
    'M': { name: 'MAX UP', color: '#ff9ad0', help: 'one more heart for ever' },
    '*': { name: 'STAR', color: '#ffd93d', help: 'enemies die if you touch them' },
    'B': { name: 'BOOTS', color: '#5ad2ff', help: 'higher jumps and a triple jump' },
    'R': { name: 'RAPID', color: '#a8ff5a', help: 'throw ninja stars much faster' }
  };

  var STAR_TIME = 8 * 60;
  var BOOT_TIME = 14 * 60;
  var RAPID_TIME = 14 * 60;

  try { game.best = parseInt(localStorage.getItem('ninjaMasterBest') || '0', 10) || 0; } catch (e) { game.best = 0; }

  var level = null;
  var player = null;
  var enemies = [];
  var coins = [];
  var powerups = [];
  var shurikens = [];
  var bones = [];
  var particles = [];
  var flag = null;
  var boss = null;
  var bossDown = 0;
  var toasts = [];
  var spawn = { x: 40, y: 40 };
  var safeSpot = { x: 40, y: 40 };
  var cam = { x: 0 };
  var backdrop = { stars: [], hillFar: [], hillNear: [] };

  function isSolid(ch) { return ch === '#' || ch === '='; }

  function tileAt(cx, cy) {
    if (cx < 0 || cx >= level.w) { return '#'; }
    if (cy < 0 || cy >= level.h) { return '.'; }
    return level.grid[cy][cx];
  }

  function buildBackdrop(seed) {
    var rnd = mulberry32(seed * 7919 + 13);
    backdrop.stars = [];
    for (var i = 0; i < 90; i++) {
      backdrop.stars.push({ x: rnd() * VIEW_W * 1.5, y: rnd() * 170, s: rnd() < 0.25 ? 2 : 1, a: 0.25 + rnd() * 0.75 });
    }
    backdrop.hillFar = [];
    backdrop.hillNear = [];
    for (var j = 0; j < 24; j++) {
      backdrop.hillFar.push(40 + rnd() * 55);
      backdrop.hillNear.push(25 + rnd() * 40);
    }
  }

  function loadLevel(index) {
    var def = LEVELS[index];
    var rows = def.rows;
    level = {
      name: def.name,
      w: rows[0].length,
      h: rows.length,
      grid: rows.map(function (r) { return r.split(''); }),
      pxW: rows[0].length * TILE,
      pxH: rows.length * TILE,
      pal: PALETTES[index % PALETTES.length]
    };

    enemies = [];
    coins = [];
    powerups = [];
    shurikens = [];
    bones = [];
    particles = [];
    toasts = [];
    flag = null;
    boss = null;
    bossDown = 0;

    for (var r = 0; r < level.h; r++) {
      for (var c = 0; c < level.w; c++) {
        var ch = level.grid[r][c];
        if (ch === 'P') {
          spawn = { x: c * TILE + 3, y: r * TILE + 1 };
          level.grid[r][c] = '.';
        } else if (ch === 'o') {
          coins.push({ x: c * TILE + 4, y: r * TILE + 4, w: 8, h: 8, taken: false, t: (c * 3 + r * 5) % 60 });
          level.grid[r][c] = '.';
        } else if (POWERUPS[ch]) {
          powerups.push({ kind: ch, x: c * TILE + 2, y: r * TILE + 2, w: 12, h: 12, taken: false, t: (c * 7 + r * 11) % 60 });
          level.grid[r][c] = '.';
        } else if (ch === 'Z' || ch === 'S') {
          enemies.push(makeEnemy(ch, c, r));
          level.grid[r][c] = '.';
        } else if (ch === 'K') {
          boss = makeBoss(c, r);
          enemies.push(boss);
          level.grid[r][c] = '.';
        } else if (ch === 'F') {
          flag = { x: c * TILE + 3, y: r * TILE - 32, w: 11, h: 48 };
          level.grid[r][c] = '.';
        }
      }
    }

    buildBackdrop(index + 1);
    resetPlayer();
    cam.x = clamp(player.x + player.w / 2 - VIEW_W / 2, 0, Math.max(0, level.pxW - VIEW_W));
  }

  function resetPlayer() {
    player = {
      x: spawn.x, y: spawn.y, w: 10, h: 15,
      vx: 0, vy: 0,
      onGround: false, facing: 1,
      jumpsLeft: 2, coyote: 0, invuln: 0,
      throwCd: 0, animT: 0, dying: false,
      starT: 0, bootT: 0, rapidT: 0
    };
    safeSpot.x = spawn.x;
    safeSpot.y = spawn.y;
  }

  /* After losing a heart the ninja comes back at the last safe piece of
     ground, not at the very start of the level. Boots and rapid stars keep
     working. Star power stops, because you get flashing safe time instead. */
  function respawnAtSafeSpot() {
    player.x = safeSpot.x;
    player.y = safeSpot.y;
    player.vx = 0;
    player.vy = 0;
    player.jumpsLeft = maxJumps();
    player.coyote = 0;
    player.invuln = 90;
    player.starT = 0;
    player.dying = false;
    bones = [];
    shurikens = [];
    burst(player.x + 5, player.y + 7, '#8fa7ff', 12, 3);
  }

  function maxJumps() { return player && player.bootT > 0 ? 3 : 2; }

  function makeEnemy(kind, cx, cy) {
    var isZombie = kind === 'Z';
    return {
      kind: isZombie ? 'zombie' : 'skeleton',
      x: cx * TILE + 2,
      y: cy * TILE + 1,
      w: 12, h: 15,
      dir: -1,
      speed: isZombie ? 0.35 : 0.6,
      vx: 0,
      vy: 0,
      hp: isZombie ? 1 : 2,
      alive: true,
      hurt: 0,
      cd: 60 + Math.floor(Math.random() * 80),
      animT: Math.random() * 40
    };
  }

  /* The Skull King. A big skeleton boss. He chases you, jumps, and spits
     bones. Stomp his head or hit him with ninja stars. */
  function makeBoss(cx, cy) {
    return {
      kind: 'boss',
      x: cx * TILE,
      y: (cy + 1) * TILE - 30,
      w: 26, h: 30,
      dir: -1,
      speed: 0.5,
      vx: 0,
      vy: 0,
      hp: 10,
      maxHp: 10,
      alive: true,
      hurt: 0,
      cd: 120,
      jumpCd: 200,
      mouth: 0,
      animT: 0
    };
  }

  /* ---------------- physics ---------------- */

  var GRAVITY = 0.45;
  var MAX_FALL = 8;
  var RUN_SPEED = 2.1;
  var ACCEL = 0.55;
  var FRICTION = 0.55;
  var JUMP_V = -7.6;

  function resolveX(e) {
    var y0 = Math.floor(e.y / TILE), y1 = Math.floor((e.y + e.h - 1) / TILE);
    var x0 = Math.floor(e.x / TILE), x1 = Math.floor((e.x + e.w - 1) / TILE);
    for (var cy = y0; cy <= y1; cy++) {
      for (var cx = x0; cx <= x1; cx++) {
        if (!isSolid(tileAt(cx, cy))) { continue; }
        if (e.vx > 0) { e.x = cx * TILE - e.w; }
        else if (e.vx < 0) { e.x = (cx + 1) * TILE; }
        e.vx = 0;
        e.bumped = true;
        return;
      }
    }
  }

  function resolveY(e) {
    e.onGround = false;
    var y0 = Math.floor(e.y / TILE), y1 = Math.floor((e.y + e.h - 1) / TILE);
    var x0 = Math.floor(e.x / TILE), x1 = Math.floor((e.x + e.w - 1) / TILE);
    for (var cy = y0; cy <= y1; cy++) {
      for (var cx = x0; cx <= x1; cx++) {
        if (!isSolid(tileAt(cx, cy))) { continue; }
        if (e.vy > 0) { e.y = cy * TILE - e.h; e.onGround = true; }
        else if (e.vy < 0) { e.y = (cy + 1) * TILE; }
        e.vy = 0;
        return;
      }
    }
  }

  function hazardRect(ch, cx, cy) {
    if (ch === '~') { return { x: cx * TILE, y: cy * TILE + 2, w: TILE, h: TILE - 2 }; }
    if (ch === '^') { return { x: cx * TILE + 1, y: cy * TILE + 7, w: TILE - 2, h: TILE - 7 }; }
    return null;
  }

  function touchesHazard(e) {
    var box = { x: e.x + 2, y: e.y + 3, w: e.w - 4, h: e.h - 3 };
    var x0 = Math.floor(box.x / TILE), x1 = Math.floor((box.x + box.w - 1) / TILE);
    var y0 = Math.floor(box.y / TILE), y1 = Math.floor((box.y + box.h - 1) / TILE);
    for (var cy = y0; cy <= y1; cy++) {
      for (var cx = x0; cx <= x1; cx++) {
        var rect = hazardRect(tileAt(cx, cy), cx, cy);
        if (rect && overlap(box, rect)) { return true; }
      }
    }
    return false;
  }

  /* ---------------- effects ---------------- */

  function burst(x, y, color, count, power) {
    for (var i = 0; i < count; i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * power,
        vy: (Math.random() - 0.8) * power,
        life: 20 + Math.random() * 20,
        color: color,
        size: 1 + Math.floor(Math.random() * 2)
      });
    }
  }

  /* ---------------- player actions ---------------- */

  function doJump() {
    var boost = player.bootT > 0 ? 1.16 : 1;
    if (player.onGround || player.coyote > 0) {
      player.vy = JUMP_V * boost;
      player.jumpsLeft = maxJumps() - 1;
      player.coyote = 0;
      player.onGround = false;
      Sound.jump();
      burst(player.x + 5, player.y + 15, player.bootT > 0 ? '#5ad2ff' : '#8899bb', 5, 1.8);
    } else if (player.jumpsLeft > 0) {
      player.vy = JUMP_V * 0.92 * boost;
      player.jumpsLeft--;
      Sound.flip();
      burst(player.x + 5, player.y + 12, player.bootT > 0 ? '#5ad2ff' : '#ffffff', 7, 2.4);
    }
  }

  function doThrow() {
    var rapid = player.rapidT > 0;
    if (player.throwCd > 0 || shurikens.length >= (rapid ? 6 : 3)) { return; }
    player.throwCd = rapid ? 6 : 16;
    shurikens.push({
      x: player.x + (player.facing > 0 ? 8 : -2),
      y: player.y + 5,
      w: 6, h: 6,
      vx: player.facing * (rapid ? 5.6 : 4.4),
      rot: 0,
      life: 90
    });
    Sound.star();
  }

  function hurtPlayer(fromX) {
    if (player.invuln > 0 || player.starT > 0 || player.dying) { return; }
    game.hearts--;
    player.invuln = 100;
    player.vx = (player.x + 5 < fromX ? -1 : 1) * 3;
    player.vy = -3.6;
    game.shake = 10;
    Sound.hurt();
    burst(player.x + 5, player.y + 7, '#ff5a5a', 10, 3);
    if (game.hearts <= 0) { gameOver(); }
  }

  /* A short word that floats up the screen when you pick something up. */
  function toast(str, color) {
    toasts.push({ t: str, c: color, life: 80, x: player.x + 5, y: player.y - 4 });
  }

  function healHearts(n) {
    var before = game.hearts;
    game.hearts = Math.min(game.maxHearts, game.hearts + n);
    return game.hearts - before;
  }

  function takePowerup(pu) {
    pu.taken = true;
    var info = POWERUPS[pu.kind];
    burst(pu.x + 6, pu.y + 6, info.color, 16, 3.2);
    game.score += 3;

    if (pu.kind === 'H') {
      if (healHearts(1) > 0) { toast('+1 HEART', info.color); }
      else { game.score += 10; toast('+10 POINTS', '#ffd93d'); }
      Sound.heal();
    } else if (pu.kind === 'M') {
      if (game.maxHearts < HEART_CAP) {
        game.maxHearts++;
        game.hearts = game.maxHearts;
        toast('MAX HEARTS UP', info.color);
      } else {
        healHearts(game.maxHearts);
        toast('ALL HEARTS FULL', info.color);
      }
      Sound.heal();
    } else if (pu.kind === '*') {
      player.starT = STAR_TIME;
      toast('STAR POWER', info.color);
      Sound.power();
    } else if (pu.kind === 'B') {
      player.bootT = BOOT_TIME;
      player.jumpsLeft = Math.max(player.jumpsLeft, 1);
      toast('JUMP BOOTS', info.color);
      Sound.power();
    } else if (pu.kind === 'R') {
      player.rapidT = RAPID_TIME;
      toast('RAPID STARS', info.color);
      Sound.power();
    }
  }

  function killPlayer() {
    if (player.dying) { return; }
    player.dying = true;
    game.hearts--;
    game.shake = 14;
    game.mode = 'dead';
    game.timer = 0;
    Sound.hurt();
    burst(player.x + 5, player.y + 7, '#ff9a3c', 16, 4);
  }

  function gameOver() {
    game.mode = 'gameover';
    game.timer = 0;
    Sound.lose();
  }

  function killEnemy(e) {
    e.alive = false;
    if (e.kind === 'boss') {
      game.score += 100;
      game.shake = 26;
      bossDown = 130;
      burst(e.x + 13, e.y + 15, '#f2f0e6', 40, 5);
      burst(e.x + 13, e.y + 15, '#ff6b6b', 30, 4);
      Sound.win();
      return;
    }
    game.score += 5;
    burst(e.x + 6, e.y + 7, e.kind === 'zombie' ? '#7fd05f' : '#e8e6dd', 14, 3.4);
    Sound.squish();
  }

  function damageEnemy(e, n) {
    e.hp -= n;
    e.hurt = 12;
    if (e.hp <= 0) { killEnemy(e); return true; }
    burst(e.x + e.w / 2, e.y + 6, '#ffffff', 6, 2);
    Sound.bonk();
    return false;
  }

  function saveBest() {
    if (game.score > game.best) {
      game.best = game.score;
      try { localStorage.setItem('ninjaMasterBest', String(game.best)); } catch (e) { /* ignore */ }
    }
  }

  /* ---------------- update ---------------- */

  function update() {
    game.frame++;
    game.timer++;
    if (game.shake > 0) { game.shake--; }
    if (jumpBuffer > 0) { jumpBuffer--; }

    if (game.mode === 'title') {
      if (consumeConfirm()) {
        game.level = 0;
        game.score = 0;
        game.maxHearts = START_HEARTS;
        game.hearts = START_HEARTS;
        loadLevel(0);
        game.mode = 'play';
        game.timer = 0;
      }
      throwEdge = false;
      return;
    }

    if (game.mode === 'dead') {
      updateParticles();
      if (game.timer > 55) {
        if (game.hearts <= 0) {
          gameOver();
        } else {
          respawnAtSafeSpot();
          game.mode = 'play';
          game.timer = 0;
        }
      }
      throwEdge = false;
      confirmEdge = false;
      return;
    }

    if (game.mode === 'clear') {
      updateParticles();
      updateToasts();
      if (game.timer > 100 || (game.timer > 30 && consumeConfirm())) {
        game.level++;
        if (game.level >= LEVELS.length) {
          saveBest();
          game.mode = 'win';
          game.timer = 0;
          Sound.win();
        } else {
          healHearts(1);
          loadLevel(game.level);
          game.mode = 'play';
          game.timer = 0;
        }
      }
      throwEdge = false;
      return;
    }

    if (game.mode === 'gameover') {
      updateParticles();
      saveBest();
      if (game.timer > 40 && consumeConfirm()) {
        game.hearts = game.maxHearts;
        loadLevel(game.level);
        game.mode = 'play';
        game.timer = 0;
      }
      throwEdge = false;
      return;
    }

    if (game.mode === 'win') {
      if (game.timer > 60 && consumeConfirm()) {
        game.mode = 'title';
        game.timer = 0;
      }
      throwEdge = false;
      return;
    }

    /* ----- playing ----- */

    updatePlayer();
    updateEnemies();
    updateShurikens();
    updateBones();
    updateCoins();
    updatePowerups();
    updateParticles();
    updateToasts();

    /* The boss level ends when the Skull King falls over. */
    if (bossDown > 0) {
      bossDown--;
      if (game.frame % 9 === 0 && boss) {
        burst(boss.x + 4 + Math.random() * 18, boss.y + 8 + Math.random() * 16, '#ffd93d', 6, 3);
      }
      if (bossDown === 0) {
        game.score += 25;
        game.mode = 'clear';
        game.timer = 0;
      }
    }

    if (flag && overlap(player, flag) && !player.dying) {
      game.score += 25;
      game.mode = 'clear';
      game.timer = 0;
      Sound.win();
      burst(flag.x + 5, flag.y + 10, '#ffd93d', 24, 4);
    }

    var target = clamp(player.x + player.w / 2 - VIEW_W / 2, 0, Math.max(0, level.pxW - VIEW_W));
    cam.x += (target - cam.x) * 0.16;
    if (Math.abs(cam.x - target) < 0.4) { cam.x = target; }

    throwEdge = false;
    confirmEdge = false;
  }

  function consumeConfirm() {
    if (confirmEdge) { confirmEdge = false; jumpBuffer = 0; return true; }
    return false;
  }

  function updatePlayer() {
    var p = player;
    p.animT++;
    if (p.invuln > 0) { p.invuln--; }
    if (p.throwCd > 0) { p.throwCd--; }
    if (p.starT > 0) {
      p.starT--;
      if (p.starT === 0) { toast('STAR GONE', '#ffd93d'); }
      if (game.frame % 3 === 0) {
        burst(p.x + 5, p.y + 8, ['#ffd93d', '#ff6b6b', '#5ad2ff'][game.frame % 3], 1, 1.4);
      }
    }
    if (p.bootT > 0) {
      p.bootT--;
      if (p.bootT === 0) { toast('BOOTS GONE', '#5ad2ff'); }
    }
    if (p.rapidT > 0) {
      p.rapidT--;
      if (p.rapidT === 0) { toast('RAPID GONE', '#a8ff5a'); }
    }

    var dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir !== 0) {
      p.vx += dir * ACCEL;
      p.vx = clamp(p.vx, -RUN_SPEED, RUN_SPEED);
      p.facing = dir;
    } else {
      if (Math.abs(p.vx) < FRICTION) { p.vx = 0; }
      else { p.vx -= Math.sign(p.vx) * FRICTION; }
    }

    if (jumpBuffer > 0 && (p.onGround || p.coyote > 0 || p.jumpsLeft > 0)) {
      jumpBuffer = 0;
      doJump();
    }
    if (!input.jumpHeld && p.vy < -2) { p.vy += 0.35; }
    if (throwEdge) { doThrow(); }

    p.vy += GRAVITY;
    if (p.vy > MAX_FALL) { p.vy = MAX_FALL; }

    p.x += p.vx;
    resolveX(p);
    p.y += p.vy;
    resolveY(p);

    p.x = clamp(p.x, 0, level.pxW - p.w);

    if (p.onGround) { p.coyote = 6; p.jumpsLeft = maxJumps(); }
    else if (p.coyote > 0) { p.coyote--; }

    if (p.y > level.pxH + 8) { killPlayer(); return; }
    if (touchesHazard(p)) { killPlayer(); return; }

    if (p.onGround && p.invuln <= 0) {
      var safe = true;
      for (var s = 0; s < enemies.length; s++) {
        var en = enemies[s];
        if (en.alive && Math.abs(en.x - p.x) < 30 + en.w && Math.abs(en.y - p.y) < 24 + en.h) { safe = false; break; }
      }
      if (safe) { safeSpot.x = p.x; safeSpot.y = p.y; }
    }

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.alive) { continue; }
      if (!overlap(p, e)) { continue; }
      var headTop = e.y + (e.kind === 'boss' ? 14 : 9);
      if (p.vy > 0.8 && (p.y + p.h) < headTop) {
        if (e.kind === 'boss') {
          damageEnemy(e, 1);
          p.vy = -6.6;
          game.shake = 8;
        } else {
          e.hp = 0;
          killEnemy(e);
          p.vy = -5.6;
        }
        p.jumpsLeft = Math.max(p.jumpsLeft, 1);
        Sound.stomp();
      } else if (p.starT > 0 && e.kind !== 'boss') {
        e.hp = 0;
        killEnemy(e);
        game.score += 3;
      } else if (p.starT > 0 && e.kind === 'boss') {
        if (e.hurt <= 0) { damageEnemy(e, 1); game.shake = 8; }
        p.vx = (p.x + 5 < e.x + e.w / 2 ? -1 : 1) * 3.4;
      } else {
        hurtPlayer(e.x + e.w / 2);
      }
    }
  }

  function updateEnemies() {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.alive) { continue; }
      e.animT++;
      if (e.hurt > 0) { e.hurt--; }
      if (e.cd > 0) { e.cd--; }

      e.vy += GRAVITY;
      if (e.vy > MAX_FALL) { e.vy = MAX_FALL; }

      if (e.kind === 'boss') { bossThink(e); }
      else { e.vx = e.dir * e.speed; }

      e.bumped = false;
      e.x += e.vx;
      resolveX(e);
      if (e.bumped && e.kind !== 'boss') { e.dir = -e.dir; }
      e.y += e.vy;
      resolveY(e);
      e.x = clamp(e.x, 0, level.pxW - e.w);

      if (e.kind === 'boss') { continue; }

      var acx = Math.floor((e.dir > 0 ? e.x + e.w + 1 : e.x - 1) / TILE);
      var footCy = Math.floor((e.y + e.h + 2) / TILE);
      var bodyCy = Math.floor((e.y + e.h / 2) / TILE);
      var groundAhead = isSolid(tileAt(acx, footCy));
      var wallAhead = isSolid(tileAt(acx, bodyCy));
      var dangerAhead = hazardRect(tileAt(acx, bodyCy), acx, bodyCy) ||
                        hazardRect(tileAt(acx, footCy), acx, footCy);

      if ((!groundAhead && e.onGround) || wallAhead || dangerAhead) {
        e.dir = -e.dir;
      }

      if (e.kind === 'skeleton' && e.cd <= 0) {
        var dx = (player.x + 5) - (e.x + 6);
        var dy = (player.y + 7) - (e.y + 7);
        if (Math.abs(dx) < 150 && Math.abs(dy) < 36) {
          e.cd = 115;
          var sd = dx >= 0 ? 1 : -1;
          e.dir = sd;
          bones.push({ x: e.x + 4, y: e.y + 3, w: 6, h: 6, vx: sd * 2.3, vy: -1.1, rot: 0 });
          Sound.bonk();
        }
      }
    }
  }

  /* Boss brain. He walks at you, jumps, and spits bones.
     When he is down to half health he gets angry and speeds up. */
  function bossThink(e) {
    if (e.jumpCd > 0) { e.jumpCd--; }
    if (e.mouth > 0) { e.mouth--; }

    var toward = (player.x + 5) < (e.x + e.w / 2) ? -1 : 1;
    e.dir = toward;
    var rage = e.hp <= Math.ceil(e.maxHp / 2);
    if (rage && !e.raged) { e.raged = true; game.shake = 12; Sound.roar(); }

    var acx = Math.floor((toward > 0 ? e.x + e.w + 1 : e.x - 1) / TILE);
    var footCy = Math.floor((e.y + e.h + 2) / TILE);
    var bodyCy = Math.floor((e.y + e.h / 2) / TILE);
    var blocked = !isSolid(tileAt(acx, footCy)) || isSolid(tileAt(acx, bodyCy)) ||
                  hazardRect(tileAt(acx, bodyCy), acx, bodyCy) ||
                  hazardRect(tileAt(acx, footCy), acx, footCy);

    if (e.hurt > 8 || (blocked && e.onGround)) { e.vx = 0; }
    else { e.vx = toward * (rage ? 0.95 : 0.55); }

    if (e.cd <= 0) {
      e.cd = rage ? 75 : 115;
      e.mouth = 24;
      var shots = rage ? 3 : 2;
      for (var i = 0; i < shots; i++) {
        bones.push({
          x: e.x + e.w / 2 - 3, y: e.y + 10, w: 6, h: 6,
          vx: toward * (1.9 + i * 0.8), vy: -2.4 + i * 0.6, rot: 0
        });
      }
      Sound.bonk();
    }

    if (e.jumpCd <= 0 && e.onGround) {
      e.jumpCd = rage ? 130 : 200;
      e.vy = -7.4;
      game.shake = 4;
      Sound.jump();
    }

    if (e.onGround && e.vy === 0 && e.landShake) {
      e.landShake = false;
      game.shake = 6;
      burst(e.x + e.w / 2, e.y + e.h, '#8d7f6a', 8, 2.4);
    }
    if (!e.onGround) { e.landShake = true; }
  }

  function updatePowerups() {
    for (var i = 0; i < powerups.length; i++) {
      var pu = powerups[i];
      if (pu.taken) { continue; }
      pu.t++;
      if (overlap(pu, player) && !player.dying) { takePowerup(pu); }
    }
  }

  function updateToasts() {
    for (var i = toasts.length - 1; i >= 0; i--) {
      var t = toasts[i];
      t.y -= 0.35;
      t.life--;
      if (t.life <= 0) { toasts.splice(i, 1); }
    }
  }

  function updateShurikens() {
    for (var i = shurikens.length - 1; i >= 0; i--) {
      var s = shurikens[i];
      s.x += s.vx;
      s.rot += 0.5;
      s.life--;
      var cx = Math.floor((s.x + 3) / TILE), cy = Math.floor((s.y + 3) / TILE);
      if (s.life <= 0 || isSolid(tileAt(cx, cy)) || s.x < -20 || s.x > level.pxW + 20) {
        burst(s.x + 3, s.y + 3, '#cfd8e8', 4, 1.6);
        shurikens.splice(i, 1);
        continue;
      }
      var hitSomething = false;
      for (var j = 0; j < enemies.length; j++) {
        var e = enemies[j];
        if (!e.alive || !overlap(s, e)) { continue; }
        hitSomething = true;
        damageEnemy(e, 1);
        break;
      }
      if (hitSomething) { shurikens.splice(i, 1); }
    }
  }

  function updateBones() {
    for (var i = bones.length - 1; i >= 0; i--) {
      var b = bones[i];
      b.vy += 0.055;
      b.x += b.vx;
      b.y += b.vy;
      b.rot += 0.28;
      var cx = Math.floor((b.x + 3) / TILE), cy = Math.floor((b.y + 3) / TILE);
      if (isSolid(tileAt(cx, cy)) || b.y > level.pxH + 20 || b.x < -20 || b.x > level.pxW + 20) {
        bones.splice(i, 1);
        continue;
      }
      if (overlap(b, player) && !player.dying) {
        hurtPlayer(b.x);
        bones.splice(i, 1);
      }
    }
  }

  function updateCoins() {
    for (var i = 0; i < coins.length; i++) {
      var c = coins[i];
      if (c.taken) { continue; }
      c.t++;
      if (overlap(c, player)) {
        c.taken = true;
        game.score += 1;
        Sound.coin();
        burst(c.x + 4, c.y + 4, '#ffd93d', 6, 2);
      }
    }
  }

  function updateParticles() {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.14;
      p.life--;
      if (p.life <= 0) { particles.splice(i, 1); }
    }
  }

  /* ---------------- drawing ---------------- */

  function text(str, x, y, size, color, align) {
    ctx.font = 'bold ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText(str, x + 1, y + 1);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  function drawBackground() {
    var pal = level ? level.pal : PALETTES[0];
    var g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, pal.skyTop);
    g.addColorStop(1, pal.skyBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    for (var i = 0; i < backdrop.stars.length; i++) {
      var s = backdrop.stars[i];
      var sx = (s.x - cam.x * 0.08) % (VIEW_W * 1.5);
      if (sx < -4) { sx += VIEW_W * 1.5; }
      ctx.globalAlpha = s.a * (0.6 + 0.4 * Math.sin((game.frame + i * 9) * 0.05));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.floor(sx), Math.floor(s.y), s.s, s.s);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(255,247,214,0.9)';
    var mx = VIEW_W - 90 - cam.x * 0.05;
    ctx.beginPath();
    ctx.arc(mx, 48, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = level ? level.pal.skyTop : '#0d1330';
    ctx.beginPath();
    ctx.arc(mx - 8, 42, 18, 0, Math.PI * 2);
    ctx.fill();

    drawHills(0.22, 214, pal.hillFar, 96, backdrop.hillFar);
    drawHills(0.46, 232, pal.hillNear, 74, backdrop.hillNear);
  }

  function drawHills(factor, baseY, color, step, arr) {
    if (!arr.length) { return; }
    ctx.fillStyle = color;
    var start = Math.floor((cam.x * factor) / step) - 1;
    var count = Math.ceil(VIEW_W / step) + 3;
    for (var i = 0; i < count; i++) {
      var idx = start + i;
      var h = arr[((idx % arr.length) + arr.length) % arr.length];
      var x = idx * step - cam.x * factor;
      ctx.beginPath();
      ctx.moveTo(x - step * 0.75, baseY);
      ctx.lineTo(x, baseY - h);
      ctx.lineTo(x + step * 0.75, baseY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillRect(0, baseY, VIEW_W, VIEW_H - baseY);
  }

  function drawTiles() {
    var pal = level.pal;
    var c0 = Math.max(0, Math.floor(cam.x / TILE) - 1);
    var c1 = Math.min(level.w - 1, Math.floor((cam.x + VIEW_W) / TILE) + 1);
    for (var cy = 0; cy < level.h; cy++) {
      for (var cx = c0; cx <= c1; cx++) {
        var ch = level.grid[cy][cx];
        if (ch === '.') { continue; }
        var x = cx * TILE, y = cy * TILE;
        if (ch === '#') {
          ctx.fillStyle = pal.rock;
          ctx.fillRect(x, y, TILE, TILE);
          if (!isSolid(tileAt(cx, cy - 1))) {
            ctx.fillStyle = pal.rockTop;
            ctx.fillRect(x, y, TILE, 4);
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fillRect(x, y, TILE, 1);
          }
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.fillRect(x, y + TILE - 2, TILE, 2);
          ctx.fillRect(x + TILE - 1, y, 1, TILE);
        } else if (ch === '=') {
          ctx.fillStyle = pal.plank;
          ctx.fillRect(x, y, TILE, 8);
          ctx.fillStyle = pal.plankTop;
          ctx.fillRect(x, y, TILE, 3);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(x, y + 7, TILE, 1);
          ctx.fillRect(x + TILE - 1, y, 1, 8);
        } else if (ch === '^') {
          ctx.fillStyle = '#aeb9cb';
          for (var k = 0; k < 2; k++) {
            var sx = x + k * 8;
            ctx.beginPath();
            ctx.moveTo(sx + 1, y + TILE);
            ctx.lineTo(sx + 4, y + 5);
            ctx.lineTo(sx + 7, y + TILE);
            ctx.closePath();
            ctx.fill();
          }
          ctx.fillStyle = '#5a6478';
          ctx.fillRect(x, y + TILE - 2, TILE, 2);
        } else if (ch === '~') {
          var surface = tileAt(cx, cy - 1) !== '~';
          var wob = Math.sin((game.frame * 0.06) + cx * 0.7) * 1.5;
          ctx.fillStyle = '#3a1410';
          ctx.fillRect(x, y, TILE, TILE);
          var top = surface ? y + 6 + wob : y;
          ctx.fillStyle = '#c8280d';
          ctx.fillRect(x, top, TILE, y + TILE - top);
          ctx.fillStyle = '#ff6a00';
          ctx.fillRect(x, top + 2, TILE, y + TILE - top - 2);
          if (surface) {
            ctx.fillStyle = '#ffc33f';
            ctx.fillRect(x, top, TILE, 2);
            if ((cx + Math.floor(game.frame / 24)) % 5 === 0) {
              ctx.fillStyle = 'rgba(255,240,180,0.85)';
              ctx.fillRect(x + 6, top - 3, 2, 2);
            }
          }
        }
      }
    }
  }

  function drawCoins() {
    for (var i = 0; i < coins.length; i++) {
      var c = coins[i];
      if (c.taken) { continue; }
      var bob = Math.sin((c.t) * 0.09) * 2;
      var squash = Math.abs(Math.cos(c.t * 0.06));
      var w = 2 + squash * 6;
      var cx = c.x + 4, cy = c.y + 4 + bob;
      ctx.fillStyle = '#b8860b';
      ctx.fillRect(cx - w / 2, cy - 4, w, 8);
      ctx.fillStyle = '#ffd93d';
      ctx.fillRect(cx - w / 2 + 1, cy - 3, Math.max(1, w - 2), 6);
      ctx.fillStyle = '#fff5b0';
      ctx.fillRect(cx - w / 2 + 1, cy - 3, Math.max(1, w / 3), 2);
    }
  }

  function drawFlag() {
    if (!flag) { return; }
    var x = flag.x, y = flag.y;
    ctx.fillStyle = '#d8d8d8';
    ctx.fillRect(x + 4, y, 3, flag.h);
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(x + 6, y, 1, flag.h);
    var wave = Math.sin(game.frame * 0.12) * 3;
    ctx.fillStyle = '#e23c3c';
    ctx.beginPath();
    ctx.moveTo(x + 7, y + 2);
    ctx.lineTo(x + 26 + wave, y + 9);
    ctx.lineTo(x + 7, y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 11, y + 7, 3, 3);
  }

  /* Draws a list of [x, y, w, h, colour] rectangles with a dark outline
     around the whole shape, so sprites stand out against the background. */
  function drawSprite(parts) {
    var i, p;
    ctx.fillStyle = '#05060d';
    for (i = 0; i < parts.length; i++) {
      p = parts[i];
      ctx.fillRect(p[0] - 1, p[1] - 1, p[2] + 2, p[3] + 2);
    }
    for (i = 0; i < parts.length; i++) {
      p = parts[i];
      ctx.fillStyle = p[4];
      ctx.fillRect(p[0], p[1], p[2], p[3]);
    }
  }

  function drawNinja(p) {
    if (p.invuln > 0 && Math.floor(game.frame / 4) % 2 === 0) { return; }
    var dx = Math.round(p.x) - 1;
    var dy = Math.round(p.y) - 1;
    var f = p.facing;
    var running = p.onGround && Math.abs(p.vx) > 0.3;
    var swing = running ? Math.round(Math.sin(p.animT * 0.35) * 2.4) : 0;
    var airborne = !p.onGround;
    var tail = Math.round(Math.sin(game.frame * 0.25) * 1.5);

    var SUIT = '#3b4570';
    var SUIT_DARK = '#2a3155';
    var SKIN = '#4f5c8c';
    var RED = '#e8483a';
    if (p.starT > 0) {
      var RAINBOW = ['#ffd93d', '#ff6b6b', '#5ad2ff', '#a8ff5a'];
      var k = Math.floor(game.frame / 4) % 4;
      SUIT = RAINBOW[k];
      SUIT_DARK = RAINBOW[(k + 1) % 4];
      RED = RAINBOW[(k + 2) % 4];
      SKIN = RAINBOW[(k + 3) % 4];
    }
    var parts = [];

    // scarf trailing behind
    parts.push([f > 0 ? dx - 3 : dx + 9, dy + 4 + tail, 5, 2, RED]);
    parts.push([f > 0 ? dx - 5 : dx + 13, dy + 6 + tail, 3, 2, '#b8352a']);

    // legs
    if (airborne) {
      parts.push([dx + 3, dy + 12, 3, 3, SUIT_DARK]);
      parts.push([dx + 7, dy + 11, 3, 4, SUIT_DARK]);
    } else {
      parts.push([dx + 3 + swing, dy + 12, 3, 4, SUIT_DARK]);
      parts.push([dx + 7 - swing, dy + 12, 3, 4, SUIT_DARK]);
    }

    // body and belt
    parts.push([dx + 2, dy + 6, 8, 6, SUIT]);
    parts.push([dx + 2, dy + 10, 8, 1, RED]);

    // arms
    if (p.throwCd > 8) {
      parts.push([f > 0 ? dx + 9 : dx - 2, dy + 6, 4, 2, SUIT_DARK]);
    } else {
      parts.push([dx + 1 - (running ? Math.round(swing * 0.5) : 0), dy + 7, 2, 4, SUIT_DARK]);
      parts.push([dx + 9 + (running ? Math.round(swing * 0.5) : 0), dy + 7, 2, 4, SUIT_DARK]);
    }

    // head, headband, eyes
    parts.push([dx + 2, dy + 1, 8, 5, SKIN]);
    parts.push([dx + 1, dy + 2, 10, 2, RED]);
    if (f > 0) {
      parts.push([dx + 5, dy + 4, 2, 1, '#ffffff']);
      parts.push([dx + 8, dy + 4, 2, 1, '#ffffff']);
    } else {
      parts.push([dx + 2, dy + 4, 2, 1, '#ffffff']);
      parts.push([dx + 5, dy + 4, 2, 1, '#ffffff']);
    }

    drawSprite(parts);
  }

  function drawZombie(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir;
    var swing = Math.round(Math.sin(e.animT * 0.12) * 2);
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var skin = flash ? '#ffffff' : '#7fd05f';
    var shirt = flash ? '#ffffff' : '#4d8f3f';
    var dark = flash ? '#dddddd' : '#2f5a2a';

    drawSprite([
      [dx + 3 + swing, dy + 12, 3, 4, dark],
      [dx + 8 - swing, dy + 12, 3, 4, dark],
      [f > 0 ? dx + 11 : dx - 4, dy + 6 + Math.round(swing * 0.5), 5, 2, skin],
      [dx + 2, dy + 6, 10, 6, shirt],
      [dx + 2, dy + 9, 10, 1, dark],
      [dx + 3, dy + 1, 8, 5, skin],
      [dx + 4, dy + 3, 2, 2, flash ? '#888888' : '#1f3d1a'],
      [dx + 8, dy + 3, 2, 2, flash ? '#888888' : '#1f3d1a'],
      [dx + 4, dy + 6, 6, 1, dark]
    ]);
  }

  function drawSkeleton(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir;
    var swing = Math.round(Math.sin(e.animT * 0.2) * 2);
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var bone = flash ? '#ff9a9a' : '#f2f0e6';
    var dark = flash ? '#cc6666' : '#a9a69a';

    drawSprite([
      [dx + 4 + swing, dy + 12, 2, 4, bone],
      [dx + 8 - swing, dy + 12, 2, 4, bone],
      [dx + 6, dy + 6, 2, 6, dark],
      [dx + 3, dy + 7, 8, 1, bone],
      [dx + 3, dy + 9, 8, 1, bone],
      [dx + 4, dy + 11, 6, 1, bone],
      [f > 0 ? dx + 10 : dx - 2, e.cd > 95 ? dy + 3 : dy + 7, 4, 2, bone],
      [dx + 3, dy + 1, 8, 5, bone],
      [dx + 4, dy + 2, 2, 2, '#1a1a1a'],
      [dx + 8, dy + 2, 2, 2, '#1a1a1a'],
      [dx + 5, dy + 5, 4, 1, dark]
    ]);
  }

  function drawShurikens() {
    for (var i = 0; i < shurikens.length; i++) {
      var s = shurikens[i];
      ctx.save();
      ctx.translate(s.x + 3, s.y + 3);
      ctx.rotate(s.rot);
      ctx.fillStyle = '#dfe7f2';
      ctx.fillRect(-4, -1, 8, 2);
      ctx.fillRect(-1, -4, 2, 8);
      ctx.fillStyle = '#8fa0b8';
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    }
  }

  function drawBones() {
    for (var i = 0; i < bones.length; i++) {
      var b = bones[i];
      ctx.save();
      ctx.translate(b.x + 3, b.y + 3);
      ctx.rotate(b.rot);
      ctx.fillStyle = '#efece2';
      ctx.fillRect(-4, -1, 8, 2);
      ctx.fillRect(-4, -2, 2, 4);
      ctx.fillRect(2, -2, 2, 4);
      ctx.restore();
    }
  }

  function drawPowerups() {
    for (var i = 0; i < powerups.length; i++) {
      var pu = powerups[i];
      if (pu.taken) { continue; }
      var info = POWERUPS[pu.kind];
      var bob = Math.sin(pu.t * 0.08) * 2;
      var x = Math.round(pu.x), y = Math.round(pu.y + bob);

      ctx.globalAlpha = 0.28 + 0.22 * Math.sin(pu.t * 0.1);
      ctx.fillStyle = info.color;
      ctx.fillRect(x - 3, y - 3, 18, 18);
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#05060d';
      ctx.fillRect(x - 1, y - 1, 14, 14);
      ctx.fillStyle = info.color;
      ctx.fillRect(x, y, 12, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(x + 1, y + 1, 10, 2);

      ctx.fillStyle = '#1a1030';
      if (pu.kind === 'H' || pu.kind === 'M') {
        ctx.fillRect(x + 2, y + 3, 2, 2);
        ctx.fillRect(x + 8, y + 3, 2, 2);
        ctx.fillRect(x + 2, y + 5, 8, 2);
        ctx.fillRect(x + 3, y + 7, 6, 1);
        ctx.fillRect(x + 5, y + 8, 2, 1);
        if (pu.kind === 'M') { ctx.fillRect(x + 1, y + 1, 3, 1); ctx.fillRect(x + 2, y, 1, 3); }
      } else if (pu.kind === '*') {
        ctx.fillRect(x + 5, y + 1, 2, 3);
        ctx.fillRect(x + 1, y + 4, 10, 2);
        ctx.fillRect(x + 3, y + 6, 6, 2);
        ctx.fillRect(x + 2, y + 8, 2, 2);
        ctx.fillRect(x + 8, y + 8, 2, 2);
      } else if (pu.kind === 'B') {
        ctx.fillRect(x + 3, y + 2, 3, 6);
        ctx.fillRect(x + 3, y + 8, 7, 2);
        ctx.fillRect(x + 6, y + 1, 2, 2);
      } else if (pu.kind === 'R') {
        ctx.fillRect(x + 5, y + 1, 2, 10);
        ctx.fillRect(x + 1, y + 5, 10, 2);
        ctx.fillRect(x + 3, y + 3, 2, 2);
        ctx.fillRect(x + 7, y + 7, 2, 2);
      }
    }
  }

  function drawToasts() {
    for (var i = 0; i < toasts.length; i++) {
      var t = toasts[i];
      ctx.globalAlpha = clamp(t.life / 30, 0, 1);
      text(t.t, t.x, t.y, 9, t.c);
      ctx.globalAlpha = 1;
    }
  }

  /* The Skull King. Same idea as the small sprites, just bigger. */
  function drawBoss(e) {
    var dx = Math.round(e.x), dy = Math.round(e.y);
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var rage = e.hp <= Math.ceil(e.maxHp / 2);
    var bone = flash ? '#ffb0b0' : '#f2f0e6';
    var dark = flash ? '#cc7070' : '#a9a69a';
    var eye = rage ? '#ff3b1f' : '#ff8a2b';
    var f = e.dir;
    var sway = Math.round(Math.sin(e.animT * 0.09) * 2);
    var jaw = e.mouth > 0 ? 2 : 0;

    drawSprite([
      [dx + 4 + sway, dy + 24, 5, 6, dark],
      [dx + 17 - sway, dy + 24, 5, 6, dark],
      [dx + 6, dy + 14, 14, 10, bone],
      [dx + 6, dy + 17, 14, 1, dark],
      [dx + 6, dy + 20, 14, 1, dark],
      [f > 0 ? dx + 20 : dx - 2, dy + 15 + sway, 8, 3, bone],
      [dx + 3, dy + 2, 20, 13, bone],
      [dx + 6, dy + 6, 5, 5, '#120b1a'],
      [dx + 15, dy + 6, 5, 5, '#120b1a'],
      [dx + 7, dy + 7, 3, 3, eye],
      [dx + 16, dy + 7, 3, 3, eye],
      [dx + 8, dy + 13 + jaw, 10, 2, '#120b1a'],
      [dx + 1, dy, 4, 5, rage ? '#ff3b1f' : '#c9b03a'],
      [dx + 21, dy, 4, 5, rage ? '#ff3b1f' : '#c9b03a'],
      [dx + 5, dy - 2, 16, 3, rage ? '#ff6b3b' : '#e0c552']
    ]);
  }

  function drawBossBar() {
    if (!boss || (!boss.alive && bossDown <= 0)) { return; }
    var w = 180, x = (VIEW_W - w) / 2, y = 34;
    var pct = clamp(boss.hp / boss.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(4,6,14,0.75)';
    ctx.fillRect(x - 2, y - 2, w + 4, 10);
    ctx.fillStyle = '#3a2030';
    ctx.fillRect(x, y, w, 6);
    ctx.fillStyle = pct > 0.5 ? '#7fd05f' : (pct > 0.25 ? '#ffd93d' : '#ff4d4d');
    ctx.fillRect(x, y, Math.round(w * pct), 6);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x, y, Math.round(w * pct), 2);
    text('SKULL KING', VIEW_W / 2, y + 13, 9, '#ffffff');
  }

  function drawParticles() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = clamp(p.life / 22, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawHeart(x, y, filled) {
    ctx.fillStyle = filled ? '#e83c48' : 'rgba(255,255,255,0.22)';
    ctx.fillRect(x + 1, y, 3, 2);
    ctx.fillRect(x + 6, y, 3, 2);
    ctx.fillRect(x, y + 2, 10, 3);
    ctx.fillRect(x + 1, y + 5, 8, 2);
    ctx.fillRect(x + 3, y + 7, 4, 1);
    if (filled) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(x + 2, y + 2, 2, 1);
    }
  }

  function drawTimerBar(x, y, t, max, color, label) {
    var w = 28;
    ctx.fillStyle = 'rgba(4,6,14,0.6)';
    ctx.fillRect(x - 1, y - 1, w + 2, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.round(w * clamp(t / max, 0, 1)), 4);
    text(label, x + w / 2, y + 10, 8, color);
  }

  function drawHUD() {
    for (var i = 0; i < game.maxHearts; i++) {
      drawHeart(8 + i * 13, 8, i < game.hearts);
    }
    ctx.fillStyle = '#ffd93d';
    ctx.fillRect(9, 22, 6, 8);
    ctx.fillStyle = '#fff5b0';
    ctx.fillRect(10, 23, 2, 3);
    text(String(game.score), 21, 26, 12, '#ffffff', 'left');
    text('LEVEL ' + (game.level + 1) + ' - ' + level.name, VIEW_W / 2, 13, 10, 'rgba(255,255,255,0.75)');

    var bx = VIEW_W - 34;
    if (player.starT > 0) { drawTimerBar(bx, 8, player.starT, STAR_TIME, '#ffd93d', 'STAR'); bx -= 34; }
    if (player.bootT > 0) { drawTimerBar(bx, 8, player.bootT, BOOT_TIME, '#5ad2ff', 'BOOTS'); bx -= 34; }
    if (player.rapidT > 0) { drawTimerBar(bx, 8, player.rapidT, RAPID_TIME, '#a8ff5a', 'RAPID'); }

    drawBossBar();
  }

  function panel(alpha) {
    ctx.fillStyle = 'rgba(4,6,14,' + alpha + ')';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  function drawTitle() {
    drawBackground();
    panel(0.35);

    var bob = Math.sin(game.frame * 0.05) * 3;
    text('NINJA MASTER', VIEW_W / 2, 58 + bob, 34, '#e8483a');

    drawNinjaBig(VIEW_W / 2 - 18, 96 + bob * 0.5, 3);

    text('KEYBOARD', VIEW_W / 2, 166, 11, '#ffd93d');
    text('ARROWS or A D to move    SPACE to jump', VIEW_W / 2, 180, 10, 'rgba(255,255,255,0.85)');
    text('X to throw a ninja star', VIEW_W / 2, 192, 10, 'rgba(255,255,255,0.85)');
    text('PHONE or TABLET:  use the round buttons', VIEW_W / 2, 208, 10, 'rgba(255,255,255,0.85)');
    text('Grab boxes for power ups.  7 levels.  1 boss.', VIEW_W / 2, 224, 10, '#ffd93d');

    if (Math.floor(game.frame / 30) % 2 === 0) {
      text('PRESS SPACE  or  TAP TO START', VIEW_W / 2, 250, 13, '#ffffff');
    }
    if (game.best > 0) {
      text('BEST: ' + game.best, VIEW_W - 8, 265, 9, 'rgba(255,255,255,0.6)', 'right');
    }
  }

  function drawNinjaBig(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    var fake = { x: 1, y: 1, vx: 0, facing: 1, onGround: true, animT: 0, invuln: 0, throwCd: 0 };
    drawNinja(fake);
    ctx.restore();
  }

  function drawOverlayCentre(lines) {
    panel(0.55);
    var y = VIEW_H / 2 - (lines.length - 1) * 16;
    lines.forEach(function (l) {
      text(l.t, VIEW_W / 2, y, l.s || 16, l.c || '#ffffff');
      y += (l.s || 16) + 12;
    });
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    if (game.mode === 'title') { drawTitle(); return; }

    drawBackground();

    ctx.save();
    var sx = 0, sy = 0;
    if (game.shake > 0) {
      sx = (Math.random() - 0.5) * game.shake;
      sy = (Math.random() - 0.5) * game.shake;
    }
    ctx.translate(-Math.round(cam.x) + sx, sy);

    drawTiles();
    drawFlag();
    drawCoins();
    drawPowerups();

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.alive) { continue; }
      if (e.x - cam.x < -60 || e.x - cam.x > VIEW_W + 60) { continue; }
      if (e.kind === 'boss') { drawBoss(e); }
      else if (e.kind === 'zombie') { drawZombie(e); }
      else { drawSkeleton(e); }
    }

    /* The beaten Skull King sinks into the ground before the level ends. */
    if (boss && !boss.alive && bossDown > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(bossDown / 130, 0, 1);
      ctx.translate(0, (130 - bossDown) * 0.16);
      drawBoss(boss);
      ctx.restore();
    }

    drawBones();
    drawShurikens();
    if (game.mode !== 'dead') { drawNinja(player); }
    drawParticles();
    drawToasts();

    ctx.restore();

    drawHUD();

    if (game.mode === 'clear') {
      drawOverlayCentre([
        { t: 'LEVEL CLEAR', s: 30, c: '#ffd93d' },
        { t: 'Score ' + game.score, s: 14 }
      ]);
    } else if (game.mode === 'dead') {
      drawOverlayCentre([{ t: 'OUCH', s: 30, c: '#ff6b6b' }]);
    } else if (game.mode === 'gameover') {
      drawOverlayCentre([
        { t: 'GAME OVER', s: 30, c: '#ff6b6b' },
        { t: 'Score ' + game.score, s: 14 },
        { t: 'PRESS SPACE or TAP TO TRY AGAIN', s: 13, c: '#ffffff' }
      ]);
    } else if (game.mode === 'win') {
      drawOverlayCentre([
        { t: 'YOU ARE THE NINJA MASTER', s: 24, c: '#ffd93d' },
        { t: 'Final score ' + game.score + '    Best ' + game.best, s: 14 },
        { t: 'PRESS SPACE or TAP TO PLAY AGAIN', s: 13, c: '#ffffff' }
      ]);
    }
  }

  /* ---------------- main loop ---------------- */

  var last = 0;
  var acc = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) { last = now; }
    var dt = now - last;
    last = now;
    if (dt > 250) { dt = 250; }
    acc += dt;
    var guard = 0;
    while (acc >= STEP && guard < 5) { update(); acc -= STEP; guard++; }
    if (acc > STEP * 5) { acc = 0; }
    render();
  }

  /* A little door into the game, handy for testing and for tinkering.
     Open the browser console and try:  NINJA.game.score = 100  */
  window.NINJA = {
    game: game,
    input: input,
    get player() { return player; },
    get level() { return level; },
    get enemies() { return enemies; },
    get powerups() { return powerups; },
    get boss() { return boss; },
    get flag() { return flag; },
    jump: function () { jumpBuffer = 8; confirmEdge = true; },
    attack: function () { throwEdge = true; },
    /* Jump straight to a level. Try:  NINJA.goTo(6)  for the boss. */
    goTo: function (n) {
      game.level = clamp(n, 0, LEVELS.length - 1);
      game.mode = 'play';
      game.timer = 0;
      loadLevel(game.level);
    }
  };

  loadLevel(0);
  game.mode = 'title';
  requestAnimationFrame(frame);
})();

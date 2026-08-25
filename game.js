/* ============================================================
   NINJA MASTER
   A platform game. Runs in any browser. Keyboard or touch.
   ============================================================ */

(function () {
  'use strict';

  var TILE = 16;
  var VIEW_W = 480;
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
      rock: '#553028', rockTop: '#7d4b3a', plank: '#5a3a28', plankTop: '#7c5238' }
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
    hearts: 3,
    timer: 0,
    shake: 0,
    frame: 0,
    best: 0
  };

  try { game.best = parseInt(localStorage.getItem('ninjaMasterBest') || '0', 10) || 0; } catch (e) { game.best = 0; }

  var level = null;
  var player = null;
  var enemies = [];
  var coins = [];
  var shurikens = [];
  var bones = [];
  var particles = [];
  var flag = null;
  var spawn = { x: 40, y: 40 };
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
    shurikens = [];
    bones = [];
    particles = [];
    flag = null;

    for (var r = 0; r < level.h; r++) {
      for (var c = 0; c < level.w; c++) {
        var ch = level.grid[r][c];
        if (ch === 'P') {
          spawn = { x: c * TILE + 3, y: r * TILE + 1 };
          level.grid[r][c] = '.';
        } else if (ch === 'o') {
          coins.push({ x: c * TILE + 4, y: r * TILE + 4, w: 8, h: 8, taken: false, t: (c * 3 + r * 5) % 60 });
          level.grid[r][c] = '.';
        } else if (ch === 'Z' || ch === 'S') {
          enemies.push(makeEnemy(ch, c, r));
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
      throwCd: 0, animT: 0, dying: false
    };
  }

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
    if (player.onGround || player.coyote > 0) {
      player.vy = JUMP_V;
      player.jumpsLeft = 1;
      player.coyote = 0;
      player.onGround = false;
      Sound.jump();
      burst(player.x + 5, player.y + 15, '#8899bb', 4, 1.6);
    } else if (player.jumpsLeft > 0) {
      player.vy = JUMP_V * 0.92;
      player.jumpsLeft = 0;
      Sound.flip();
      burst(player.x + 5, player.y + 12, '#ffffff', 7, 2.4);
    }
  }

  function doThrow() {
    if (player.throwCd > 0 || shurikens.length >= 3) { return; }
    player.throwCd = 16;
    shurikens.push({
      x: player.x + (player.facing > 0 ? 8 : -2),
      y: player.y + 5,
      w: 6, h: 6,
      vx: player.facing * 4.4,
      rot: 0,
      life: 90
    });
    Sound.star();
  }

  function hurtPlayer(fromX) {
    if (player.invuln > 0 || player.dying) { return; }
    game.hearts--;
    player.invuln = 100;
    player.vx = (player.x + 5 < fromX ? -1 : 1) * 3;
    player.vy = -3.6;
    game.shake = 10;
    Sound.hurt();
    burst(player.x + 5, player.y + 7, '#ff5a5a', 10, 3);
    if (game.hearts <= 0) { gameOver(); }
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
    game.score += 5;
    burst(e.x + 6, e.y + 7, e.kind === 'zombie' ? '#7fd05f' : '#e8e6dd', 14, 3.4);
    Sound.squish();
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
        game.hearts = 3;
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
        if (game.hearts <= 0) { gameOver(); }
        else { loadLevel(game.level); game.mode = 'play'; game.timer = 0; }
      }
      throwEdge = false;
      confirmEdge = false;
      return;
    }

    if (game.mode === 'clear') {
      updateParticles();
      if (game.timer > 100 || (game.timer > 30 && consumeConfirm())) {
        game.level++;
        if (game.level >= LEVELS.length) {
          saveBest();
          game.mode = 'win';
          game.timer = 0;
          Sound.win();
        } else {
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
        game.hearts = 3;
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
    updateParticles();

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

    if (p.onGround) { p.coyote = 6; p.jumpsLeft = 2; }
    else if (p.coyote > 0) { p.coyote--; }

    if (p.y > level.pxH + 8) { killPlayer(); return; }
    if (touchesHazard(p)) { killPlayer(); return; }

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.alive) { continue; }
      if (!overlap(p, e)) { continue; }
      if (p.vy > 0.8 && (p.y + p.h) < e.y + 9) {
        e.hp = 0;
        killEnemy(e);
        p.vy = -5.6;
        p.jumpsLeft = Math.max(p.jumpsLeft, 1);
        Sound.stomp();
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

      e.vx = e.dir * e.speed;
      e.bumped = false;
      e.x += e.vx;
      resolveX(e);
      if (e.bumped) { e.dir = -e.dir; }
      e.y += e.vy;
      resolveY(e);

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
        e.hp--;
        e.hurt = 10;
        hitSomething = true;
        if (e.hp <= 0) { killEnemy(e); }
        else { burst(e.x + 6, e.y + 6, '#ffffff', 6, 2); Sound.bonk(); }
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
    var mx = 380 - cam.x * 0.05;
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
          var wob = Math.sin((game.frame * 0.06) + cx * 0.7) * 1.6;
          ctx.fillStyle = '#c8280d';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = '#ff6a00';
          ctx.fillRect(x, y + 3 + wob, TILE, TILE - 3 - wob);
          ctx.fillStyle = '#ffc33f';
          ctx.fillRect(x, y + 3 + wob, TILE, 2);
          if ((cx + Math.floor(game.frame / 24)) % 5 === 0) {
            ctx.fillStyle = 'rgba(255,240,180,0.8)';
            ctx.fillRect(x + 6, y + 1 + wob, 2, 2);
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

  function drawNinja(p) {
    if (p.invuln > 0 && Math.floor(game.frame / 4) % 2 === 0) { return; }
    var dx = Math.round(p.x) - 1;
    var dy = Math.round(p.y) - 1;
    var f = p.facing;
    var running = p.onGround && Math.abs(p.vx) > 0.3;
    var swing = running ? Math.sin(p.animT * 0.35) * 2.4 : 0;
    var airborne = !p.onGround;

    // trailing scarf
    ctx.fillStyle = '#c0392b';
    var tailWave = Math.sin(game.frame * 0.25) * 1.5;
    var tx = f > 0 ? dx - 1 : dx + 9;
    ctx.fillRect(tx, dy + 4 + tailWave, 4, 2);
    ctx.fillRect(tx - f * 2, dy + 6 + tailWave, 3, 1);

    // legs
    ctx.fillStyle = '#1b1e2e';
    if (airborne) {
      ctx.fillRect(dx + 3, dy + 12, 3, 3);
      ctx.fillRect(dx + 7, dy + 11, 3, 4);
    } else {
      ctx.fillRect(dx + 3 + swing, dy + 12, 3, 4);
      ctx.fillRect(dx + 7 - swing, dy + 12, 3, 4);
    }

    // body
    ctx.fillStyle = '#262b40';
    ctx.fillRect(dx + 2, dy + 6, 8, 6);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(dx + 2, dy + 10, 8, 1);

    // arms
    ctx.fillStyle = '#1b1e2e';
    if (p.throwCd > 8) {
      ctx.fillRect(f > 0 ? dx + 9 : dx - 1, dy + 6, 4, 2);
    } else {
      ctx.fillRect(dx + 1 - (running ? swing * 0.4 : 0), dy + 7, 2, 4);
      ctx.fillRect(dx + 9 + (running ? swing * 0.4 : 0), dy + 7, 2, 4);
    }

    // head
    ctx.fillStyle = '#2f3550';
    ctx.fillRect(dx + 2, dy + 1, 8, 5);
    // headband
    ctx.fillStyle = '#e04b3c';
    ctx.fillRect(dx + 1, dy + 2, 10, 2);
    // eyes
    ctx.fillStyle = '#ffffff';
    if (f > 0) {
      ctx.fillRect(dx + 5, dy + 4, 2, 1);
      ctx.fillRect(dx + 8, dy + 4, 2, 1);
    } else {
      ctx.fillRect(dx + 2, dy + 4, 2, 1);
      ctx.fillRect(dx + 5, dy + 4, 2, 1);
    }
  }

  function drawZombie(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir;
    var swing = Math.sin(e.animT * 0.12) * 2;
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;

    ctx.fillStyle = flash ? '#ffffff' : '#2f5a2a';
    ctx.fillRect(dx + 3 + swing * 0.4, dy + 12, 3, 4);
    ctx.fillRect(dx + 8 - swing * 0.4, dy + 12, 3, 4);

    ctx.fillStyle = flash ? '#ffffff' : '#4d8f3f';
    ctx.fillRect(dx + 2, dy + 6, 10, 6);
    ctx.fillStyle = flash ? '#ffffff' : '#3a6f30';
    ctx.fillRect(dx + 2, dy + 9, 10, 1);

    ctx.fillStyle = flash ? '#ffffff' : '#6fbf5a';
    ctx.fillRect(f > 0 ? dx + 11 : dx - 3, dy + 6 + swing * 0.5, 5, 2);

    ctx.fillStyle = flash ? '#ffffff' : '#6fbf5a';
    ctx.fillRect(dx + 3, dy + 1, 8, 5);
    ctx.fillStyle = flash ? '#888888' : '#1f3d1a';
    ctx.fillRect(dx + 4, dy + 3, 2, 2);
    ctx.fillRect(dx + 8, dy + 3, 2, 2);
    ctx.fillStyle = flash ? '#ffffff' : '#3a6f30';
    ctx.fillRect(dx + 4, dy + 6, 6, 1);
  }

  function drawSkeleton(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir;
    var swing = Math.sin(e.animT * 0.2) * 2;
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var bone = flash ? '#ff9a9a' : '#e8e6dd';
    var dark = flash ? '#cc6666' : '#a9a69a';

    ctx.fillStyle = bone;
    ctx.fillRect(dx + 4 + swing * 0.4, dy + 12, 2, 4);
    ctx.fillRect(dx + 8 - swing * 0.4, dy + 12, 2, 4);

    ctx.fillStyle = dark;
    ctx.fillRect(dx + 6, dy + 6, 2, 6);
    ctx.fillStyle = bone;
    ctx.fillRect(dx + 3, dy + 7, 8, 1);
    ctx.fillRect(dx + 3, dy + 9, 8, 1);
    ctx.fillRect(dx + 4, dy + 11, 6, 1);

    ctx.fillStyle = bone;
    if (e.cd > 95) {
      ctx.fillRect(f > 0 ? dx + 10 : dx - 2, dy + 3, 4, 2);
    } else {
      ctx.fillRect(f > 0 ? dx + 10 : dx - 2, dy + 7, 4, 2);
    }

    ctx.fillStyle = bone;
    ctx.fillRect(dx + 3, dy + 1, 8, 5);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(dx + 4, dy + 2, 2, 2);
    ctx.fillRect(dx + 8, dy + 2, 2, 2);
    ctx.fillStyle = dark;
    ctx.fillRect(dx + 5, dy + 5, 4, 1);
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

  function drawHUD() {
    for (var i = 0; i < 3; i++) {
      drawHeart(8 + i * 14, 8, i < game.hearts);
    }
    ctx.fillStyle = '#ffd93d';
    ctx.fillRect(VIEW_W - 74, 9, 6, 8);
    ctx.fillStyle = '#fff5b0';
    ctx.fillRect(VIEW_W - 73, 10, 2, 3);
    text(String(game.score), VIEW_W - 62, 13, 12, '#ffffff', 'left');
    text('LEVEL ' + (game.level + 1) + ' - ' + level.name, VIEW_W / 2, 13, 11, 'rgba(255,255,255,0.85)');
  }

  function panel(alpha) {
    ctx.fillStyle = 'rgba(4,6,14,' + alpha + ')';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  function drawTitle() {
    drawBackground();
    panel(0.35);

    var bob = Math.sin(game.frame * 0.05) * 3;
    text('NINJA MASTER', VIEW_W / 2, 62 + bob, 40, '#e04b3c');

    drawNinjaBig(VIEW_W / 2 - 24, 104 + bob * 0.5, 3);

    text('KEYBOARD:  ARROWS or A D to move    SPACE to jump    X to throw a star',
      VIEW_W / 2, 186, 11, 'rgba(255,255,255,0.8)');
    text('TOUCH:  use the round buttons on the screen',
      VIEW_W / 2, 202, 11, 'rgba(255,255,255,0.8)');
    text('Jump twice in the air for a DOUBLE JUMP', VIEW_W / 2, 218, 11, '#ffd93d');

    if (Math.floor(game.frame / 30) % 2 === 0) {
      text('PRESS SPACE  or  TAP THE SCREEN  TO START', VIEW_W / 2, 244, 13, '#ffffff');
    }
    if (game.best > 0) {
      text('BEST SCORE: ' + game.best, VIEW_W - 10, 262, 10, 'rgba(255,255,255,0.6)', 'right');
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

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.alive) { continue; }
      if (e.x - cam.x < -40 || e.x - cam.x > VIEW_W + 40) { continue; }
      if (e.kind === 'zombie') { drawZombie(e); } else { drawSkeleton(e); }
    }

    drawBones();
    drawShurikens();
    if (game.mode !== 'dead') { drawNinja(player); }
    drawParticles();

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

  loadLevel(0);
  game.mode = 'title';
  requestAnimationFrame(frame);
})();

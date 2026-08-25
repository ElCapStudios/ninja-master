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

  /* Two looks for every world. The second one is for the boss level. */
  var PALETTES = [
    /* 0 Green Woods */
    { skyTop: '#0a1a24', skyBot: '#1c4433', hillFar: '#123a2c', hillNear: '#0a2018',
      rock: '#3d5140', rockTop: '#5f7d5c', plank: '#6b5136', plankTop: '#8d6c49' },
    /* 1 Green Woods boss */
    { skyTop: '#0a1416', skyBot: '#2a1f38', hillFar: '#1a2830', hillNear: '#0d161c',
      rock: '#40485a', rockTop: '#616e85', plank: '#5d4630', plankTop: '#7f6140' },
    /* 2 Frost Peak */
    { skyTop: '#0a2340', skyBot: '#3d7fb8', hillFar: '#2a5c8a', hillNear: '#173d63',
      rock: '#4a6d8c', rockTop: '#8fb8d6', plank: '#7a8ea0', plankTop: '#a8bfd0' },
    /* 3 Frost Peak boss */
    { skyTop: '#061a30', skyBot: '#245a86', hillFar: '#1a4568', hillNear: '#0c2a45',
      rock: '#3d5c78', rockTop: '#7aa3c4', plank: '#6b8296', plankTop: '#98b4c8' },
    /* 4 Sand Tomb */
    { skyTop: '#2b1a3c', skyBot: '#b8763c', hillFar: '#7a4a2e', hillNear: '#472a1c',
      rock: '#8a6a3e', rockTop: '#c4a468', plank: '#7a5a30', plankTop: '#a88448' },
    /* 5 Sand Tomb boss */
    { skyTop: '#1a0f1e', skyBot: '#5a3a1e', hillFar: '#3d2a18', hillNear: '#22160e',
      rock: '#6e5432', rockTop: '#a08454', plank: '#6a4a28', plankTop: '#94743c' },
    /* 6 Fire Keep */
    { skyTop: '#280b0e', skyBot: '#8a2a10', hillFar: '#4a1512', hillNear: '#22080a',
      rock: '#5c3228', rockTop: '#8a533c', plank: '#5a3a28', plankTop: '#7c5238' },
    /* 7 Fire Keep boss */
    { skyTop: '#1a0406', skyBot: '#a83208', hillFar: '#5a1408', hillNear: '#280604',
      rock: '#663026', rockTop: '#9a5638', plank: '#63382a', plankTop: '#8a5236' },
    /* 8 Shadow Fort */
    { skyTop: '#0a0616', skyBot: '#2e1b52', hillFar: '#1d1038', hillNear: '#0e0820',
      rock: '#3a2c56', rockTop: '#5f4a86', plank: '#4a3560', plankTop: '#6b4f88' },
    /* 9 Shadow Fort boss */
    { skyTop: '#050310', skyBot: '#1e0d3a', hillFar: '#140a2a', hillNear: '#080418',
      rock: '#2c2044', rockTop: '#4c3870', plank: '#3a2850', plankTop: '#563e72' }
  ];

  /* Five worlds. Five levels in each one. The last one is always a boss.
     The code lets you open a world again on another phone or computer. */
  var WORLDS = [
    { name: 'GREEN WOODS', code: 'LEAF', pal: 0, bossPal: 1, tint: '#7fd05f' },
    { name: 'FROST PEAK', code: 'SNOW', pal: 2, bossPal: 3, tint: '#8fd6ff' },
    { name: 'SAND TOMB', code: 'SAND', pal: 4, bossPal: 5, tint: '#f0c46a' },
    { name: 'FIRE KEEP', code: 'LAVA', pal: 6, bossPal: 7, tint: '#ff8a3c' },
    { name: 'SHADOW FORT', code: 'DARK', pal: 8, bossPal: 9, tint: '#b98cff' }
  ];
  var MASTER_CODE = 'BOSS';
  var LEVELS_PER_WORLD = 5;

  function worldOf(i) { return LEVELS[i] && LEVELS[i].world != null ? LEVELS[i].world : Math.floor(i / LEVELS_PER_WORLD); }
  function firstLevelOf(w) { return w * LEVELS_PER_WORLD; }
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
    spring: function () { this.tone(240, 0.18, 'square', 0.1, 1100); },
    warp: function () { this.tone(900, 0.16, 'sine', 0.09, 180); },
    slam: function () { this.tone(90, 0.3, 'square', 0.15, 40); },
    menu: function () { this.tone(700, 0.05, 'square', 0.06); },
    deny: function () { this.tone(200, 0.16, 'square', 0.09, 120); },
    unlock: function () {
      var s = this, notes = [523, 659, 784, 1046, 1318];
      notes.forEach(function (n, i) { setTimeout(function () { s.tone(n, 0.12, 'square', 0.1); }, i * 80); });
    },
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
  var navEdge = 0;
  var backEdge = false;
  var typedKey = '';
  var tapPoint = null;

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
    /* Letters and Backspace are only used by the secret code screen. */
    if (/^Key[A-Z]$/.test(e.code)) { typedKey = e.code.slice(3); }
    else if (e.code === 'Backspace') { typedKey = '<'; e.preventDefault(); }
    else if (e.code === 'Escape') { backEdge = true; }

    if (KEY_LEFT[e.code]) { input.left = true; navEdge = -1; e.preventDefault(); }
    else if (KEY_RIGHT[e.code]) { input.right = true; navEdge = 1; e.preventDefault(); }
    else if (KEY_JUMP[e.code]) { input.jumpHeld = true; jumpBuffer = 8; confirmEdge = true; e.preventDefault(); }
    else if (KEY_THROW[e.code]) { input.throwHeld = true; throwEdge = true; confirmEdge = true; backEdge = true; e.preventDefault(); }
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
    function () { input.left = true; navEdge = -1; confirmEdge = true; },
    function () { input.left = false; });

  bindHold(document.getElementById('btn-right'),
    function () { input.right = true; navEdge = 1; confirmEdge = true; },
    function () { input.right = false; });

  bindHold(document.getElementById('btn-jump'),
    function () { input.jumpHeld = true; jumpBuffer = 8; confirmEdge = true; },
    function () { input.jumpHeld = false; });

  bindHold(document.getElementById('btn-throw'),
    function () { input.throwHeld = true; throwEdge = true; confirmEdge = true; backEdge = true; },
    function () { input.throwHeld = false; });

  /* Turns a real screen tap into a spot inside the 384 x 272 picture,
     so you can just touch a world or a level to choose it. */
  function canvasPoint(ev) {
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) { return null; }
    return {
      x: (ev.clientX - r.left) * (VIEW_W / r.width),
      y: (ev.clientY - r.top) * (VIEW_H / r.height)
    };
  }

  canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    Sound.init();
    tapPoint = canvasPoint(e);
    if (isMenuMode()) { return; }
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
    world: 0,
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

  /* Every kind of bad guy. Two new ones live in every world.
       walk   = walks along the floor and turns at walls and holes
       fly    = flies in the air and dives at you
       hop    = jumps towards you
       jumper = stays in one place and jumps straight up
       float  = floats through walls to chase you */
  var ENEMY_TYPES = {
    'Z': { kind: 'zombie', w: 12, h: 15, speed: 0.35, hp: 1, ai: 'walk', color: '#7fd05f' },
    'S': { kind: 'skeleton', w: 12, h: 15, speed: 0.60, hp: 2, ai: 'walk', shot: 'bone', range: 150, rate: 115, color: '#e8e6dd' },
    'W': { kind: 'snowman', w: 13, h: 15, speed: 0.25, hp: 2, ai: 'walk', shot: 'snow', range: 140, rate: 105, color: '#dff2ff' },
    'V': { kind: 'bat', w: 12, h: 10, speed: 0.85, hp: 1, ai: 'fly', color: '#b07de0' },
    'U': { kind: 'mummy', w: 12, h: 15, speed: 0.25, hp: 3, ai: 'walk', color: '#ded3b4' },
    'C': { kind: 'scorpion', w: 14, h: 11, speed: 1.15, hp: 1, ai: 'walk', color: '#e0913c' },
    'I': { kind: 'imp', w: 11, h: 13, speed: 0.55, hp: 1, ai: 'hop', color: '#ff8a3c' },
    'G': { kind: 'blob', w: 13, h: 13, speed: 0, hp: 2, ai: 'jumper', color: '#ff6a00' },
    'N': { kind: 'shadow', w: 12, h: 15, speed: 0.80, hp: 2, ai: 'walk', shot: 'dart', range: 170, rate: 95, color: '#b98cff' },
    'Y': { kind: 'ghost', w: 13, h: 13, speed: 0.42, hp: 1, ai: 'float', color: '#cfe6ff' }
  };

  /* One big boss at the end of every world. artDy lifts the picture up a
     little when the drawing is taller than the box you can hit. */
  var BOSS_TYPES = {
    'K': { name: 'SKULL KING', w: 26, h: 30, hp: 10, brain: 'skull', color: '#f2f0e6', artDy: 0 },
    'J': { name: 'FROST GIANT', w: 30, h: 30, hp: 12, brain: 'frost', color: '#bfe9ff', artDy: 4 },
    'Q': { name: 'MUMMY LORD', w: 26, h: 30, hp: 12, brain: 'mummy', color: '#ded3b4', artDy: 2 },
    'D': { name: 'FIRE DRAGON', w: 34, h: 26, hp: 11, brain: 'dragon', color: '#ff6a00', artDy: 0, fly: true },
    'X': { name: 'SHADOW MASTER', w: 26, h: 30, hp: 13, brain: 'shadow', color: '#b98cff', artDy: 0 }
  };

  var STAR_TIME = 8 * 60;
  var BOOT_TIME = 14 * 60;
  var RAPID_TIME = 14 * 60;
  var SPRING_V = -10.8;

  /* What the game remembers on this device: how far you got and your best
     score. It is kept in the browser, so it is still there tomorrow. */
  var SAVE_KEY = 'ninjaMasterSave';
  var progress = { max: 0, best: 0 };

  function loadProgress() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        progress.max = Math.max(0, o.max | 0);
        progress.best = Math.max(0, o.best | 0);
      } else {
        progress.best = parseInt(localStorage.getItem('ninjaMasterBest') || '0', 10) || 0;
      }
    } catch (e) { /* a browser with no storage still plays fine */ }
    game.best = progress.best;
  }

  function saveProgress() {
    if (game.best > progress.best) { progress.best = game.best; }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 2, max: progress.max, best: progress.best }));
    } catch (e) { /* ignore */ }
  }

  function unlockUpTo(n) {
    if (n > progress.max) { progress.max = Math.min(n, LEVELS.length); saveProgress(); }
  }

  function levelUnlocked(i) { return i <= progress.max; }
  function worldUnlocked(w) { return firstLevelOf(w) <= progress.max; }
  function levelsDoneIn(w) {
    var n = 0;
    for (var i = 0; i < LEVELS_PER_WORLD; i++) {
      if (firstLevelOf(w) + i < progress.max) { n++; }
    }
    return n;
  }

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
  var springs = {};
  var spawn = { x: 40, y: 40 };
  var safeSpot = { x: 40, y: 40 };
  var cam = { x: 0 };
  var backdrop = { stars: [], hillFar: [], hillNear: [] };

  /* What is picked on the menu screens. */
  var menu = { world: 0, level: 0, code: ['A', 'A', 'A', 'A'], slot: 0, msg: '', msgT: 0, from: 'title' };
  var menuHits = [];

  function isMenuMode() {
    return game.mode === 'title' || game.mode === 'worlds' || game.mode === 'levels' ||
           game.mode === 'code' || game.mode === 'worldclear';
  }

  function isSolid(ch) { return ch === '#' || ch === '=' || ch === 'T'; }

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
    var w = worldOf(index);
    var info = WORLDS[w] || WORLDS[0];
    game.world = w;
    level = {
      name: def.name,
      world: w,
      boss: !!def.boss,
      w: rows[0].length,
      h: rows.length,
      grid: rows.map(function (r) { return r.split(''); }),
      pxW: rows[0].length * TILE,
      pxH: rows.length * TILE,
      pal: PALETTES[def.boss ? info.bossPal : info.pal]
    };

    enemies = [];
    coins = [];
    powerups = [];
    shurikens = [];
    bones = [];
    particles = [];
    toasts = [];
    springs = {};
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
        } else if (ENEMY_TYPES[ch]) {
          enemies.push(makeEnemy(ch, c, r));
          level.grid[r][c] = '.';
        } else if (BOSS_TYPES[ch]) {
          boss = makeBoss(ch, c, r);
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

  function makeEnemy(ch, cx, cy) {
    var t = ENEMY_TYPES[ch];
    var e = {
      char: ch,
      kind: t.kind,
      ai: t.ai,
      x: cx * TILE + Math.round((TILE - t.w) / 2),
      y: (cy + 1) * TILE - t.h,
      w: t.w, h: t.h,
      dir: -1,
      speed: t.speed,
      shot: t.shot || null,
      range: t.range || 0,
      rate: t.rate || 120,
      color: t.color,
      vx: 0, vy: 0,
      hp: t.hp,
      alive: true,
      hurt: 0,
      cd: 40 + Math.floor(Math.random() * 90),
      animT: Math.random() * 40
    };
    e.homeY = e.y;
    e.homeX = e.x;
    return e;
  }

  /* The big boss at the end of a world. Stomp its head or throw ninja
     stars at it. Each one fights in its own way. */
  function makeBoss(ch, cx, cy) {
    var t = BOSS_TYPES[ch];
    var e = {
      char: ch,
      kind: 'boss',
      brain: t.brain,
      bossName: t.name,
      color: t.color,
      artDy: t.artDy || 0,
      fly: !!t.fly,
      x: cx * TILE,
      y: (cy + 1) * TILE - t.h,
      w: t.w, h: t.h,
      dir: -1,
      speed: 0.5,
      vx: 0, vy: 0,
      hp: t.hp,
      maxHp: t.hp,
      alive: true,
      hurt: 0,
      cd: 120,
      jumpCd: 200,
      warpCd: 240,
      mouth: 0,
      phase: 0,
      minions: 0,
      ghostT: 0,
      animT: 0
    };
    e.homeY = e.y;
    return e;
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
    e.hitTile = '';
    var y0 = Math.floor(e.y / TILE), y1 = Math.floor((e.y + e.h - 1) / TILE);
    var x0 = Math.floor(e.x / TILE), x1 = Math.floor((e.x + e.w - 1) / TILE);
    for (var cy = y0; cy <= y1; cy++) {
      for (var cx = x0; cx <= x1; cx++) {
        var ch = tileAt(cx, cy);
        if (!isSolid(ch)) { continue; }
        if (e.vy > 0) { e.y = cy * TILE - e.h; e.onGround = true; }
        else if (e.vy < 0) { e.y = (cy + 1) * TILE; }
        e.vy = 0;
        e.hitTile = ch;
        e.hitCx = cx;
        e.hitCy = cy;
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

  function toastAt(x, y, str, color) {
    toasts.push({ t: str, c: color, life: 80, x: x, y: y });
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
      burst(e.x + e.w / 2, e.y + e.h / 2, '#f2f0e6', 40, 5);
      burst(e.x + e.w / 2, e.y + e.h / 2, e.color || '#ff6b6b', 30, 4);
      Sound.win();
      return;
    }
    game.score += 5;
    burst(e.x + e.w / 2, e.y + e.h / 2, e.color || '#ffffff', 14, 3.4);
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
    if (game.score > game.best) { game.best = game.score; }
    saveProgress();
  }

  /* ---------------- update ---------------- */

  function update() {
    game.frame++;
    game.timer++;
    if (game.shake > 0) { game.shake--; }
    if (jumpBuffer > 0) { jumpBuffer--; }
    if (menu.msgT > 0) { menu.msgT--; }
    for (var sk in springs) { if (springs[sk] > 0) { springs[sk]--; } }
    step();
    clearEdges();
  }

  function clearEdges() {
    throwEdge = false;
    confirmEdge = false;
    navEdge = 0;
    backEdge = false;
    typedKey = '';
    tapPoint = null;
  }

  /* Move to a new screen and forget any button press that got us here. */
  function goMode(m) {
    game.mode = m;
    game.timer = 0;
    menuHits = [];
    clearEdges();
  }

  function step() {
    if (game.mode === 'title') { return updateTitle(); }
    if (game.mode === 'worlds') { return updateWorldSelect(); }
    if (game.mode === 'levels') { return updateLevelSelect(); }
    if (game.mode === 'code') { return updateCodeScreen(); }
    if (game.mode === 'worldclear') { return updateWorldClear(); }

    if (game.mode === 'dead') {
      updateParticles();
      if (game.timer > 55) {
        if (game.hearts <= 0) {
          gameOver();
        } else {
          respawnAtSafeSpot();
          goMode('play');
        }
      }
      return;
    }

    if (game.mode === 'clear') {
      updateParticles();
      updateToasts();
      if (game.timer > 100 || (game.timer > 30 && consumeConfirm())) {
        unlockUpTo(game.level + 1);
        saveBest();
        var next = game.level + 1;
        if (next >= LEVELS.length) {
          Sound.win();
          goMode('win');
        } else if (worldOf(next) !== worldOf(game.level)) {
          game.world = worldOf(game.level);
          Sound.unlock();
          goMode('worldclear');
        } else {
          game.level = next;
          menu.level = next - firstLevelOf(worldOf(next));
          healHearts(1);
          loadLevel(next);
          goMode('play');
        }
      }
      return;
    }

    if (game.mode === 'gameover') {
      updateParticles();
      saveBest();
      if (game.timer > 40) {
        if (backEdge) { Sound.menu(); goMode('levels'); return; }
        if (consumeConfirm()) {
          game.hearts = game.maxHearts;
          loadLevel(game.level);
          goMode('play');
        }
      }
      return;
    }

    if (game.mode === 'win') {
      progress.max = LEVELS.length;
      saveProgress();
      if (game.timer > 60 && consumeConfirm()) { goMode('title'); }
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

    /* A boss level ends when the big one falls over. */
    if (bossDown > 0) {
      bossDown--;
      if (game.frame % 9 === 0 && boss) {
        burst(boss.x + 4 + Math.random() * 18, boss.y + 8 + Math.random() * 16, '#ffd93d', 6, 3);
      }
      if (bossDown === 0) {
        game.score += 25;
        goMode('clear');
      }
    }

    if (flag && overlap(player, flag) && !player.dying) {
      game.score += 25;
      Sound.win();
      burst(flag.x + 5, flag.y + 10, '#ffd93d', 24, 4);
      goMode('clear');
    }

    var target = clamp(player.x + player.w / 2 - VIEW_W / 2, 0, Math.max(0, level.pxW - VIEW_W));
    cam.x += (target - cam.x) * 0.16;
    if (Math.abs(cam.x - target) < 0.4) { cam.x = target; }
  }

  /* ---------------------------------------------------------------
     MENU SCREENS
     --------------------------------------------------------------- */

  /* Did the player tap one of the boxes we drew last frame? */
  function tappedAction() {
    if (!tapPoint) { return null; }
    for (var i = 0; i < menuHits.length; i++) {
      var h = menuHits[i];
      if (tapPoint.x >= h.x && tapPoint.x <= h.x + h.w &&
          tapPoint.y >= h.y && tapPoint.y <= h.y + h.h) { return h; }
    }
    return null;
  }

  function hit(x, y, w, h, act, i) {
    menuHits.push({ x: x, y: y, w: w, h: h, act: act, i: i });
  }

  function updateTitle() {
    if (consumeConfirm() || tapPoint) {
      Sound.menu();
      menu.world = clamp(worldOf(Math.min(progress.max, LEVELS.length - 1)), 0, WORLDS.length - 1);
      goMode('worlds');
    }
  }

  function updateWorldSelect() {
    var h = tappedAction();
    if (h) {
      if (h.act === 'world') { menu.world = h.i; pickWorld(); }
      else if (h.act === 'code') { openCode(); }
      else if (h.act === 'back') { Sound.menu(); goMode('title'); }
      return;
    }
    if (backEdge) { Sound.menu(); goMode('title'); return; }
    if (navEdge) { menu.world = (menu.world + navEdge + WORLDS.length) % WORLDS.length; Sound.menu(); }
    if (consumeConfirm()) { pickWorld(); }
  }

  function pickWorld() {
    if (!worldUnlocked(menu.world)) {
      Sound.deny();
      menu.msg = 'LOCKED. BEAT THE WORLD BEFORE IT.';
      menu.msgT = 150;
      return;
    }
    menu.level = 0;
    if (worldOf(Math.min(progress.max, LEVELS.length - 1)) === menu.world) {
      menu.level = clamp(progress.max - firstLevelOf(menu.world), 0, LEVELS_PER_WORLD - 1);
    }
    Sound.menu();
    goMode('levels');
  }

  function updateLevelSelect() {
    var h = tappedAction();
    if (h) {
      if (h.act === 'level') { menu.level = h.i; pickLevel(); }
      else if (h.act === 'back') { Sound.menu(); goMode('worlds'); }
      return;
    }
    if (backEdge) { Sound.menu(); goMode('worlds'); return; }
    if (navEdge) { menu.level = clamp(menu.level + navEdge, 0, LEVELS_PER_WORLD - 1); Sound.menu(); }
    if (consumeConfirm()) { pickLevel(); }
  }

  function pickLevel() {
    var idx = firstLevelOf(menu.world) + menu.level;
    if (idx >= LEVELS.length || !levelUnlocked(idx)) {
      Sound.deny();
      menu.msg = 'LOCKED. FINISH THE LEVEL BEFORE IT.';
      menu.msgT = 150;
      return;
    }
    startLevel(idx);
  }

  function startLevel(idx) {
    game.level = idx;
    game.world = worldOf(idx);
    game.score = 0;
    game.maxHearts = START_HEARTS;
    game.hearts = START_HEARTS;
    menu.world = game.world;
    menu.level = idx - firstLevelOf(game.world);
    loadLevel(idx);
    goMode('play');
  }

  function openCode() {
    menu.code = ['A', 'A', 'A', 'A'];
    menu.slot = 0;
    menu.msg = '';
    menu.msgT = 0;
    Sound.menu();
    goMode('code');
  }

  function bumpLetter(d) {
    var a = menu.code[menu.slot].charCodeAt(0) - 65;
    a = (a + d + 26) % 26;
    menu.code[menu.slot] = String.fromCharCode(65 + a);
    Sound.menu();
  }

  function updateCodeScreen() {
    var h = tappedAction();
    if (h) {
      if (h.act === 'slot') { menu.slot = h.i; Sound.menu(); }
      else if (h.act === 'up') { menu.slot = h.i; bumpLetter(1); }
      else if (h.act === 'down') { menu.slot = h.i; bumpLetter(-1); }
      else if (h.act === 'ok') { tryCode(); }
      else if (h.act === 'back') { Sound.menu(); goMode('worlds'); }
      return;
    }
    /* Typing a letter beats every other key job on this screen. */
    if (typedKey === '<') {
      menu.slot = Math.max(0, menu.slot - 1);
      menu.code[menu.slot] = 'A';
      Sound.menu();
      return;
    }
    if (typedKey) {
      menu.code[menu.slot] = typedKey;
      if (menu.slot < 3) { menu.slot++; }
      Sound.menu();
      return;
    }
    if (backEdge) { Sound.menu(); goMode('worlds'); return; }
    if (navEdge) { bumpLetter(navEdge); return; }
    if (consumeConfirm()) { tryCode(); }
  }

  function tryCode() {
    var s = menu.code.join('');
    if (s === MASTER_CODE) {
      progress.max = LEVELS.length - 1;
      saveProgress();
      menu.msg = 'EVERY LEVEL IS OPEN';
      menu.msgT = 220;
      Sound.unlock();
      goMode('worlds');
      return;
    }
    for (var i = 0; i < WORLDS.length; i++) {
      if (WORLDS[i].code === s) {
        unlockUpTo(firstLevelOf(i));
        menu.world = i;
        menu.msg = WORLDS[i].name + ' IS OPEN';
        menu.msgT = 220;
        Sound.unlock();
        goMode('worlds');
        return;
      }
    }
    menu.msg = 'THAT CODE DOES NOT WORK';
    menu.msgT = 150;
    Sound.deny();
  }

  function updateWorldClear() {
    updateParticles();
    if (game.timer > 45 && (consumeConfirm() || tapPoint)) {
      Sound.menu();
      menu.world = clamp(game.world + 1, 0, WORLDS.length - 1);
      menu.level = 0;
      goMode('worlds');
    }
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

    /* Springs throw you high in the air. */
    if (p.onGround && p.hitTile === 'T') {
      p.vy = SPRING_V;
      p.onGround = false;
      p.coyote = 0;
      p.jumpsLeft = maxJumps();
      springs[p.hitCx + ':' + p.hitCy] = 12;
      Sound.spring();
      burst(p.x + 5, p.y + 15, '#a8ff5a', 10, 3);
    }

    p.x = clamp(p.x, 0, level.pxW - p.w);

    if (p.onGround) { p.coyote = 6; p.jumpsLeft = maxJumps(); }
    else if (p.coyote > 0) { p.coyote--; }

    if (p.y > level.pxH + 8) { killPlayer(); return; }
    if (touchesHazard(p)) { killPlayer(); return; }

    if (p.onGround && p.invuln <= 0) {
      var safe = true;
      for (var s = 0; s < enemies.length; s++) {
        var en = enemies[s];
        if (!en.alive || en.ai === 'float') { continue; }
        if (Math.abs(en.x - p.x) < 30 + en.w && Math.abs(en.y - p.y) < 24 + en.h) { safe = false; break; }
      }
      if (safe) { safeSpot.x = p.x; safeSpot.y = p.y; }
    }

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.alive || e.ghostT > 0) { continue; }
      if (!overlap(p, e)) { continue; }
      var headTop = e.y + (e.kind === 'boss' ? Math.round(e.h * 0.45) : 9);
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

      if (e.kind === 'boss') { bossThink(e); continue; }

      if (e.ai === 'float') { updateFloater(e); continue; }
      if (e.ai === 'fly') { updateFlyer(e); enemyShoot(e); continue; }

      e.vy += GRAVITY;
      if (e.vy > MAX_FALL) { e.vy = MAX_FALL; }

      if (e.ai === 'hop') { updateHopper(e); }
      else if (e.ai === 'jumper') { updateJumper(e); }
      else { e.vx = e.dir * e.speed; }

      e.bumped = false;
      e.x += e.vx;
      resolveX(e);
      if (e.bumped) { e.dir = -e.dir; }
      e.y += e.vy;
      resolveY(e);
      e.x = clamp(e.x, 0, level.pxW - e.w);

      if (e.y > level.pxH + 24) { e.alive = false; continue; }

      if (e.ai === 'walk') { turnAtEdges(e); }
      enemyShoot(e);
    }
  }

  /* Walkers turn round at a wall, at the edge of a hole, and at spikes. */
  function turnAtEdges(e) {
    var acx = Math.floor((e.dir > 0 ? e.x + e.w + 1 : e.x - 1) / TILE);
    var footCy = Math.floor((e.y + e.h + 2) / TILE);
    var bodyCy = Math.floor((e.y + e.h / 2) / TILE);
    var groundAhead = isSolid(tileAt(acx, footCy));
    var wallAhead = isSolid(tileAt(acx, bodyCy));
    var dangerAhead = hazardRect(tileAt(acx, bodyCy), acx, bodyCy) ||
                      hazardRect(tileAt(acx, footCy), acx, footCy);
    if ((!groundAhead && e.onGround) || wallAhead || dangerAhead) { e.dir = -e.dir; }
  }

  /* Bats fly. They float up and down, and dive at you when you get near. */
  function updateFlyer(e) {
    e.vx = e.dir * e.speed;
    e.bumped = false;
    e.x += e.vx;
    resolveX(e);
    if (e.bumped) { e.dir = -e.dir; }

    var target = e.homeY + Math.sin(e.animT * 0.045) * 16;
    var gap = Math.abs((player.x + 5) - (e.x + e.w / 2));
    if (gap < 95) { target = clamp(player.y - 2, e.homeY - 34, e.homeY + 48); }
    e.vy = clamp(target - e.y, -1.5, 1.5);
    e.y += e.vy;
    resolveY(e);
    e.x = clamp(e.x, 0, level.pxW - e.w);
  }

  /* Ghosts drift straight at you and go through walls. They are slow, so
     you can always run away, and one ninja star kills them. */
  function updateFloater(e) {
    var dx = (player.x + 5) - (e.x + e.w / 2);
    var dy = (player.y + 7) - (e.y + e.h / 2);
    var d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    e.x += (dx / d) * e.speed;
    e.y += (dy / d) * e.speed * 0.85;
    e.dir = dx >= 0 ? 1 : -1;
    e.x = clamp(e.x, 0, level.pxW - e.w);
    e.y = clamp(e.y, 0, level.pxH - e.h);
    e.vy = 0;
    e.onGround = false;
  }

  /* Imps hop. They hop at you when you are close, and hop on the spot
     when you are far away. */
  function updateHopper(e) {
    if (!e.onGround) { return; }
    e.vx *= 0.6;
    if (Math.abs(e.vx) < 0.1) { e.vx = 0; }
    if (e.cd > 0) { return; }
    e.cd = 55 + Math.floor(Math.random() * 40);
    var dx = (player.x + 5) - (e.x + e.w / 2);
    var near = Math.abs(dx) < 130;
    if (near) { e.dir = dx >= 0 ? 1 : -1; }
    e.vy = -5.2;
    e.vx = (near ? 1.15 : 0.5) * e.dir;
    Sound.tone(420, 0.06, 'square', 0.05, 700);
  }

  /* Lava blobs stay in one spot and jump straight up. */
  function updateJumper(e) {
    e.vx = 0;
    e.dir = (player.x + 5) < (e.x + e.w / 2) ? -1 : 1;
    if (e.onGround && e.cd <= 0) {
      e.cd = 78;
      e.vy = -6.4;
    }
  }

  /* Some bad guys throw things at you. */
  function enemyShoot(e) {
    if (!e.shot || e.cd > 0) { return; }
    var dx = (player.x + 5) - (e.x + e.w / 2);
    var dy = (player.y + 7) - (e.y + e.h / 2);
    if (Math.abs(dx) > e.range || Math.abs(dy) > 42) { return; }
    e.cd = e.rate;
    var sd = dx >= 0 ? 1 : -1;
    if (e.ai === 'walk') { e.dir = sd; }
    if (e.shot === 'bone') {
      bones.push({ kind: 'bone', x: e.x + 4, y: e.y + 3, w: 6, h: 6, vx: sd * 2.3, vy: -1.1, g: 0.055, rot: 0 });
    } else if (e.shot === 'snow') {
      bones.push({ kind: 'snow', x: e.x + 4, y: e.y + 3, w: 7, h: 7, vx: sd * 2.1, vy: -1.7, g: 0.075, rot: 0 });
    } else {
      bones.push({ kind: 'dart', x: e.x + 4, y: e.y + 6, w: 8, h: 4, vx: sd * 3.5, vy: 0, g: 0, rot: 0 });
    }
    Sound.bonk();
  }

  /* ---------------- bosses ---------------- */

  function bossRage(e) { return e.hp <= Math.ceil(e.maxHp / 2); }

  function bossThink(e) {
    if (e.jumpCd > 0) { e.jumpCd--; }
    if (e.warpCd > 0) { e.warpCd--; }
    if (e.mouth > 0) { e.mouth--; }
    if (e.swoop > 0) { e.swoop--; }

    if (bossRage(e) && !e.raged) {
      e.raged = true;
      game.shake = 14;
      Sound.roar();
      toastAt(e.x + e.w / 2, e.y - 6, 'ANGRY NOW', '#ff4d4d');
    }

    if (e.ghostT > 0) {
      e.ghostT--;
      e.vx = 0;
      e.vy = 0;
      if (e.ghostT === 0) { shadowLand(e); }
      return;
    }

    if (e.brain === 'skull') { brainSkull(e); }
    else if (e.brain === 'frost') { brainFrost(e); }
    else if (e.brain === 'mummy') { brainMummy(e); }
    else if (e.brain === 'dragon') { brainDragon(e); }
    else { brainShadow(e); }

    if (e.fly) {
      e.x += e.vx;
      e.y += e.vy;
      e.x = clamp(e.x, 0, level.pxW - e.w);
      e.y = clamp(e.y, 10, level.pxH - e.h - 18);
      e.onGround = false;
      return;
    }

    e.vy += GRAVITY;
    if (e.vy > MAX_FALL) { e.vy = MAX_FALL; }
    e.x += e.vx;
    resolveX(e);
    e.y += e.vy;
    resolveY(e);
    e.x = clamp(e.x, 0, level.pxW - e.w);

    if (e.onGround && e.landShake) {
      e.landShake = false;
      game.shake = 6;
      burst(e.x + e.w / 2, e.y + e.h, '#8d7f6a', 8, 2.4);
      if (e.slamming) { e.slamming = false; frostShockwave(e); }
    }
    if (!e.onGround) { e.landShake = true; }
  }

  /* Walks towards you, but stops at a wall, a hole or lava. */
  function bossWalk(e, speed) {
    var toward = (player.x + 5) < (e.x + e.w / 2) ? -1 : 1;
    e.dir = toward;
    var acx = Math.floor((toward > 0 ? e.x + e.w + 1 : e.x - 1) / TILE);
    var footCy = Math.floor((e.y + e.h + 2) / TILE);
    var bodyCy = Math.floor((e.y + e.h / 2) / TILE);
    var blocked = !isSolid(tileAt(acx, footCy)) || isSolid(tileAt(acx, bodyCy)) ||
                  hazardRect(tileAt(acx, bodyCy), acx, bodyCy) ||
                  hazardRect(tileAt(acx, footCy), acx, footCy);
    if (e.hurt > 8 || (blocked && e.onGround)) { e.vx = 0; }
    else { e.vx = toward * speed; }
    return blocked;
  }

  /* World 1. The Skull King chases you, jumps, and spits bones. */
  function brainSkull(e) {
    var rage = bossRage(e);
    bossWalk(e, rage ? 0.95 : 0.55);
    if (e.cd <= 0) {
      e.cd = rage ? 75 : 115;
      e.mouth = 24;
      for (var i = 0; i < (rage ? 3 : 2); i++) {
        bones.push({ kind: 'bone', x: e.x + e.w / 2 - 3, y: e.y + 10, w: 6, h: 6,
          vx: e.dir * (1.9 + i * 0.8), vy: -2.4 + i * 0.6, g: 0.055, rot: 0 });
      }
      Sound.bonk();
    }
    if (e.jumpCd <= 0 && e.onGround) {
      e.jumpCd = rage ? 130 : 200;
      e.vy = -7.4;
      game.shake = 4;
      Sound.jump();
    }
  }

  /* World 2. The Frost Giant throws ice and slams the ground. */
  function brainFrost(e) {
    var rage = bossRage(e);
    bossWalk(e, rage ? 0.72 : 0.44);
    if (e.cd <= 0) {
      e.cd = rage ? 90 : 130;
      e.mouth = 20;
      for (var i = 0; i < (rage ? 3 : 2); i++) {
        bones.push({ kind: 'ice', x: e.x + e.w / 2 - 3, y: e.y + 8, w: 7, h: 7,
          vx: e.dir * (1.6 + i * 0.9), vy: -3.2 + i * 0.5, g: 0.09, rot: 0 });
      }
      Sound.bonk();
    }
    if (e.jumpCd <= 0 && e.onGround) {
      e.jumpCd = rage ? 150 : 235;
      e.vy = -6.2;
      e.vx = 0;
      e.slamming = true;
      Sound.jump();
    }
  }

  /* When the Frost Giant lands, ice runs along the floor both ways.
     Jump over it. */
  function frostShockwave(e) {
    game.shake = 18;
    Sound.slam();
    for (var s = -1; s <= 1; s += 2) {
      for (var i = 0; i < 2; i++) {
        bones.push({ kind: 'shard', x: e.x + e.w / 2 - 4, y: e.y + e.h - 10, w: 8, h: 9,
          vx: s * (2.4 + i * 1.2), vy: 0, g: 0, rot: 0 });
      }
    }
    burst(e.x + e.w / 2, e.y + e.h, '#bfe9ff', 22, 4);
  }

  /* World 3. The Mummy Lord calls up little mummies and throws bandages. */
  function brainMummy(e) {
    var rage = bossRage(e);
    bossWalk(e, rage ? 0.62 : 0.38);
    if (e.cd <= 0) {
      e.cd = rage ? 82 : 125;
      e.mouth = 20;
      if (e.phase % 2 === 0 && countMinions() < 3) {
        summonMummy(e);
      } else {
        for (var i = 0; i < (rage ? 3 : 2); i++) {
          bones.push({ kind: 'wrap', x: e.x + e.w / 2 - 4, y: e.y + 12 + i * 4, w: 8, h: 6,
            vx: e.dir * (2.6 + i * 0.6), vy: -0.5 + i * 0.4, g: 0.03, rot: 0 });
        }
        Sound.bonk();
      }
      e.phase++;
    }
    if (e.jumpCd <= 0 && e.onGround) {
      e.jumpCd = 260;
      e.vy = -6.4;
      Sound.jump();
    }
  }

  function countMinions() {
    var n = 0;
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].alive && enemies[i].summoned) { n++; }
    }
    return n;
  }

  function summonMummy(e) {
    var m = makeEnemy('U', 1, 1);
    m.summoned = true;
    m.hp = 1;
    m.speed = 0.5;
    m.x = clamp(e.x + (e.dir > 0 ? e.w + 2 : -15), 4, level.pxW - m.w - 4);
    m.y = e.y + e.h - m.h;
    m.dir = e.dir;
    m.homeY = m.y;
    enemies.push(m);
    burst(m.x + 6, m.y + 8, '#ded3b4', 16, 3);
    Sound.warp();
  }

  /* World 4. The Fire Dragon flies. It keeps away from you and breathes
     fire, then swoops right at you. Ninja stars work best. */
  function brainDragon(e) {
    var rage = bossRage(e);
    var px = player.x + 5;
    var toward = px < (e.x + e.w / 2) ? -1 : 1;
    e.dir = toward;

    if (e.jumpCd <= 0) {
      e.jumpCd = rage ? 210 : 300;
      e.swoop = 54;
      Sound.roar();
    }

    var wantX, wantY;
    if (e.swoop > 0) {
      /* The swoop sweeps past you instead of parking on your head, so you
         always get a gap to run through. */
      wantX = px - toward * 26;
      wantY = player.y - 26;
    } else {
      wantX = px - toward * 74;
      wantY = player.y - 30 + Math.sin(e.animT * 0.028) * 30;
    }
    wantY = clamp(wantY, 22, level.pxH - e.h - 20);

    e.vx += clamp((wantX - e.x) * 0.006, -0.18, 0.18);
    e.vx = clamp(e.vx * 0.94, -1.9, 1.9);
    e.vy += clamp((wantY - e.y) * 0.02, -0.3, 0.3);
    e.vy = clamp(e.vy * 0.9, -2.1, 2.1);
    if (e.hurt > 8) { e.vx *= 0.4; e.vy *= 0.4; }

    if (e.cd <= 0) {
      e.cd = rage ? 95 : 135;
      e.mouth = 26;
      for (var i = 0; i < (rage ? 3 : 2); i++) {
        bones.push({ kind: 'fire', x: e.x + (toward > 0 ? e.w - 8 : 0), y: e.y + 11, w: 8, h: 8,
          vx: toward * (2.6 + i * 0.5), vy: -0.8 + i * 0.9, g: 0.045, rot: 0 });
      }
      Sound.roar();
    }
  }

  /* World 5. The Shadow Master is fast, throws darts, and vanishes to pop
     up beside you. He is the hardest one. */
  function brainShadow(e) {
    var rage = bossRage(e);
    bossWalk(e, rage ? 1.15 : 0.75);
    if (e.cd <= 0) {
      e.cd = rage ? 80 : 125;
      e.mouth = 18;
      for (var i = 0; i < (rage ? 3 : 2); i++) {
        bones.push({ kind: 'dart', x: e.x + e.w / 2 - 4, y: e.y + 11 + i * 5, w: 8, h: 4,
          vx: e.dir * 3.0, vy: 0, g: 0, rot: 0 });
      }
      Sound.star();
    }
    if (e.warpCd <= 0) {
      e.warpCd = rage ? 155 : 235;
      e.ghostT = 26;
      burst(e.x + 13, e.y + 15, '#b98cff', 26, 4);
      Sound.warp();
    }
    if (e.jumpCd <= 0 && e.onGround) {
      e.jumpCd = 190;
      e.vy = -7.2;
      Sound.jump();
    }
  }

  function shadowLand(e) {
    var side = (player.x + 5) < (e.x + e.w / 2) ? -1 : 1;
    var base = Math.floor((player.x + 5) / TILE);
    var spot = null;
    /* He never lands right on top of you. There is always room to move. */
    var tries = [side * 7, -side * 7, side * 9, -side * 9, side * 5, -side * 5];
    for (var i = 0; i < tries.length && spot === null; i++) {
      var cx = base + tries[i];
      var y = groundTopAt(cx, e.h);
      if (y !== null) { spot = { cx: cx, y: y }; }
    }
    if (spot) {
      e.x = clamp(spot.cx * TILE, 0, level.pxW - e.w);
      e.y = spot.y;
    }
    e.vx = 0;
    e.vy = 0;
    burst(e.x + 13, e.y + 15, '#ff4d4d', 26, 4);
    Sound.warp();
  }

  /* Finds the floor in a column, and the y where a thing of this height
     would stand on it. Gives back null if there is no room. */
  function groundTopAt(cx, h) {
    if (cx < 1 || cx >= level.w - 1) { return null; }
    for (var cy = 0; cy < level.h; cy++) {
      if (tileAt(cx, cy) !== '#') { continue; }
      var y = cy * TILE - h;
      if (y < 0) { return null; }
      for (var k = Math.floor(y / TILE); k < cy; k++) {
        if (isSolid(tileAt(cx, k))) { return null; }
      }
      return y;
    }
    return null;
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
        if (!e.alive || e.ghostT > 0 || !overlap(s, e)) { continue; }
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
      b.vy += (b.g === undefined ? 0.055 : b.g);
      b.x += b.vx;
      b.y += b.vy;
      b.rot += 0.28;
      var cx = Math.floor((b.x + b.w / 2) / TILE), cy = Math.floor((b.y + b.h / 2) / TILE);
      if (isSolid(tileAt(cx, cy)) || b.y > level.pxH + 20 || b.x < -20 || b.x > level.pxW + 20) {
        burst(b.x + b.w / 2, b.y + b.h / 2, boltColor(b), 4, 1.6);
        bones.splice(i, 1);
        continue;
      }
      if (overlap(b, player) && !player.dying) {
        hurtPlayer(b.x);
        bones.splice(i, 1);
      }
    }
  }

  function boltColor(b) {
    if (b.kind === 'snow' || b.kind === 'ice' || b.kind === 'shard') { return '#bfe9ff'; }
    if (b.kind === 'fire') { return '#ff9a3c'; }
    if (b.kind === 'dart') { return '#d8c0ff'; }
    if (b.kind === 'wrap') { return '#ded3b4'; }
    return '#efece2';
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
        } else if (ch === 'T') {
          var sq = springs[cx + ':' + cy] || 0;
          var top = y + (sq > 0 ? 10 : 3);
          ctx.fillStyle = '#05060d';
          ctx.fillRect(x, top - 1, TILE, TILE - (top - y) + 1);
          ctx.fillStyle = '#4a3a6e';
          ctx.fillRect(x + 1, y + TILE - 4, TILE - 2, 4);
          ctx.fillStyle = '#cbb9ff';
          var span = (y + TILE - 4) - (top + 5);
          for (var ci = 0; ci < 3; ci++) {
            ctx.fillRect(x + 3, top + 5 + Math.round(ci * span / 3), TILE - 6, 2);
          }
          ctx.fillStyle = '#ffd93d';
          ctx.fillRect(x + 1, top, TILE - 2, 5);
          ctx.fillStyle = '#fff3b0';
          ctx.fillRect(x + 1, top, TILE - 2, 2);
          ctx.fillStyle = '#7a5a10';
          ctx.fillRect(x + 6, top + 1, 1, 3);
          ctx.fillRect(x + 9, top + 1, 1, 3);
          if (sq === 0) {
            ctx.fillStyle = 'rgba(255,217,61,0.8)';
            var bob = Math.round(Math.sin(game.frame * 0.12 + cx) * 1.5);
            ctx.fillRect(x + 7, y - 7 + bob, 2, 5);
            ctx.fillRect(x + 5, y - 5 + bob, 6, 2);
          }
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
      ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
      var k = b.kind || 'bone';
      if (k === 'snow') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#bfe9ff';
        ctx.beginPath(); ctx.arc(-1, -1, 2, 0, Math.PI * 2); ctx.fill();
      } else if (k === 'ice' || k === 'shard') {
        ctx.rotate(k === 'shard' ? 0 : b.rot);
        ctx.fillStyle = '#7fd7ff';
        ctx.beginPath();
        ctx.moveTo(0, -5); ctx.lineTo(4, 0); ctx.lineTo(0, 5); ctx.lineTo(-4, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e8faff';
        ctx.fillRect(-1, -3, 2, 6);
      } else if (k === 'fire') {
        ctx.fillStyle = '#ff9a3c';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd93d';
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath(); ctx.arc(0, -1, 1.4, 0, Math.PI * 2); ctx.fill();
      } else if (k === 'dart') {
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.fillStyle = '#d8c0ff';
        ctx.fillRect(-5, -1, 10, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(3, -2, 3, 4);
      } else if (k === 'wrap') {
        ctx.rotate(b.rot);
        ctx.fillStyle = '#ded3b4';
        ctx.fillRect(-5, -2, 10, 4);
        ctx.fillStyle = '#a89768';
        ctx.fillRect(-5, 0, 10, 1);
        ctx.fillRect(-1, -2, 1, 4);
      } else {
        ctx.rotate(b.rot);
        ctx.fillStyle = '#efece2';
        ctx.fillRect(-4, -1, 8, 2);
        ctx.fillRect(-4, -2, 2, 4);
        ctx.fillRect(2, -2, 2, 4);
      }
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
  function drawSkullKing(e) {
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
    text(boss.bossName || 'BOSS', VIEW_W / 2, y + 13, 9, '#ffffff');
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
    var wname = WORLDS[worldOf(game.level)].name;
    text(wname + '  ' + (worldOf(game.level) + 1) + '-' + (game.level - firstLevelOf(worldOf(game.level)) + 1) + '  ' + level.name,
      VIEW_W / 2, 13, 10, 'rgba(255,255,255,0.75)');

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

    text('KEYBOARD', VIEW_W / 2, 168, 11, '#ffd93d');
    text('ARROWS or A D to move    SPACE to jump', VIEW_W / 2, 182, 10, 'rgba(255,255,255,0.85)');
    text('X to throw a ninja star', VIEW_W / 2, 194, 10, 'rgba(255,255,255,0.85)');
    text('PHONE or TABLET:  use the round buttons', VIEW_W / 2, 210, 10, 'rgba(255,255,255,0.85)');
    text('5 worlds.  25 levels.  5 bosses.', VIEW_W / 2, 226, 10, '#ffd93d');

    if (Math.floor(game.frame / 30) % 2 === 0) {
      text('PRESS SPACE  or  TAP TO START', VIEW_W / 2, 250, 13, '#ffffff');
    }
    if (game.best > 0) {
      text('BEST: ' + game.best, VIEW_W - 8, 265, 9, 'rgba(255,255,255,0.6)', 'right');
    }
  }

  /* ---------------------------------------------------------------
     MENU DRAWING.  Every box we draw is also added to menuHits so a
     finger tap on it does the same job as the buttons.
     --------------------------------------------------------------- */

  function menuTop(title, sub) {
    drawBackground();
    panel(0.55);
    text(title, VIEW_W / 2, 26, 20, '#ffd93d');
    if (sub) { text(sub, VIEW_W / 2, 42, 9, 'rgba(255,255,255,0.7)'); }
  }

  function backBox() {
    box(6, 248, 52, 20, false, false, 'rgba(255,255,255,0.2)');
    hit(6, 248, 52, 20, 'back', 0);
    text('BACK', 32, 262, 11, '#ffffff');
  }

  function menuFoot(hintLeft, hintRight) {
    if (menu.msgT > 0) {
      ctx.globalAlpha = clamp(menu.msgT / 40, 0, 1);
      text(menu.msg, VIEW_W / 2, 244, 10, '#ffd93d');
      ctx.globalAlpha = 1;
    }
    text(hintLeft, 8, 264, 9, 'rgba(255,255,255,0.6)', 'left');
    text(hintRight, VIEW_W - 8, 264, 9, 'rgba(255,255,255,0.6)', 'right');
  }

  function box(x, y, w, h, on, locked, tint) {
    ctx.fillStyle = locked ? 'rgba(10,12,22,0.85)' : 'rgba(12,16,30,0.92)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = locked ? 'rgba(255,255,255,0.12)' : tint;
    ctx.fillRect(x, y, w, 3);
    ctx.strokeStyle = on ? '#ffd93d' : 'rgba(255,255,255,0.22)';
    ctx.lineWidth = on ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.lineWidth = 1;
  }

  function drawLock(x, y) {
    ctx.fillStyle = '#c9b03a';
    ctx.fillRect(x + 1, y + 4, 8, 6);
    ctx.fillStyle = '#8a7620';
    ctx.fillRect(x + 4, y + 6, 2, 2);
    ctx.strokeStyle = '#c9b03a';
    ctx.beginPath();
    ctx.arc(x + 5, y + 4, 2.6, Math.PI, 0);
    ctx.stroke();
  }

  function drawWorldSelect() {
    menuTop('PICK A WORLD', 'levels done: ' + Math.min(progress.max, LEVELS.length) + ' of ' + LEVELS.length);
    menuHits = [];
    var bw = 68, bh = 84, gap = 6;
    var total = WORLDS.length * bw + (WORLDS.length - 1) * gap;
    var x0 = Math.round((VIEW_W - total) / 2), y0 = 62;

    for (var i = 0; i < WORLDS.length; i++) {
      var wd = WORLDS[i];
      var x = x0 + i * (bw + gap);
      var open = worldUnlocked(i);
      var on = menu.world === i;
      box(x, y0, bw, bh, on, !open, wd.tint);
      hit(x, y0, bw, bh, 'world', i);

      if (!open) {
        drawLock(x + bw / 2 - 5, y0 + 30);
        text('LOCKED', x + bw / 2, y0 + 56, 9, 'rgba(255,255,255,0.45)');
      } else {
        var done = levelsDoneIn(i);
        text(String(i + 1), x + bw / 2, y0 + 26, 18, wd.tint);
        for (var k = 0; k < LEVELS_PER_WORLD; k++) {
          ctx.fillStyle = k < done ? '#7fd05f' : 'rgba(255,255,255,0.2)';
          ctx.fillRect(x + 8 + k * 11, y0 + 34, 8, 5);
        }
        text(done + '/' + LEVELS_PER_WORLD, x + bw / 2, y0 + 52, 9, 'rgba(255,255,255,0.7)');
      }
      var nm = wd.name.split(' ');
      text(nm[0], x + bw / 2, y0 + 66, 9, open ? '#ffffff' : 'rgba(255,255,255,0.4)');
      text(nm[1] || '', x + bw / 2, y0 + 76, 9, open ? '#ffffff' : 'rgba(255,255,255,0.4)');
    }

    var cx = VIEW_W / 2 - 55;
    box(cx, 160, 110, 22, false, false, '#b98cff');
    hit(cx, 160, 110, 22, 'code', 0);
    text('I HAVE A CODE', VIEW_W / 2, 175, 11, '#ffffff');

    text('LEFT and RIGHT to pick.  SPACE to go in.', VIEW_W / 2, 200, 9, 'rgba(255,255,255,0.75)');
    text('Or just tap a world.', VIEW_W / 2, 212, 9, 'rgba(255,255,255,0.75)');
    backBox();
    menuFoot('', 'BEST ' + game.best);
  }

  function drawLevelSelect() {
    var wd = WORLDS[menu.world];
    menuTop(wd.name, 'world ' + (menu.world + 1) + ' of ' + WORLDS.length);
    menuHits = [];
    var bw = 62, bh = 62, gap = 6;
    var total = LEVELS_PER_WORLD * bw + (LEVELS_PER_WORLD - 1) * gap;
    var x0 = Math.round((VIEW_W - total) / 2), y0 = 74;

    for (var i = 0; i < LEVELS_PER_WORLD; i++) {
      var idx = firstLevelOf(menu.world) + i;
      var def = LEVELS[idx];
      var open = levelUnlocked(idx);
      var on = menu.level === i;
      var x = x0 + i * (bw + gap);
      box(x, y0, bw, bh, on, !open, wd.tint);
      hit(x, y0, bw, bh, 'level', i);

      if (!open) {
        drawLock(x + bw / 2 - 5, y0 + 22);
      } else if (def && def.boss) {
        text('BOSS', x + bw / 2, y0 + 22, 12, '#ff6b6b');
        text(String(i + 1), x + bw / 2, y0 + 40, 16, '#ffffff');
      } else {
        text(String(i + 1), x + bw / 2, y0 + 32, 24, '#ffffff');
      }
      if (open && idx < progress.max) {
        ctx.fillStyle = '#7fd05f';
        ctx.fillRect(x + bw - 12, y0 + 6, 6, 6);
      }
      text(def ? def.name : '?', x + bw / 2, y0 + 54, 8, open ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)');
    }

    text('LEFT and RIGHT to pick.  SPACE to play.', VIEW_W / 2, 158, 9, 'rgba(255,255,255,0.75)');
    text('Or just tap a level.', VIEW_W / 2, 170, 9, 'rgba(255,255,255,0.75)');
    text('CODE FOR THIS WORLD:  ' + wd.code, VIEW_W / 2, 192, 11, wd.tint);
    text('Type it in on the code screen on any device.', VIEW_W / 2, 206, 9, 'rgba(255,255,255,0.6)');
    backBox();
    menuFoot('', 'BEST ' + game.best);
  }

  function drawCodeScreen() {
    menuTop('TYPE A CODE', 'four letters');
    menuHits = [];
    var bw = 40, gap = 10;
    var total = 4 * bw + 3 * gap;
    var x0 = Math.round((VIEW_W - total) / 2), y0 = 92;

    for (var i = 0; i < 4; i++) {
      var x = x0 + i * (bw + gap);
      var on = menu.slot === i;
      box(x, y0, bw, 44, on, false, '#b98cff');
      hit(x, y0, bw, 44, 'slot', i);
      text(menu.code[i], x + bw / 2, y0 + 32, 26, on ? '#ffd93d' : '#ffffff');

      box(x + 8, y0 - 24, 24, 20, false, false, 'rgba(255,255,255,0.2)');
      hit(x + 8, y0 - 24, 24, 20, 'up', i);
      text('+', x + bw / 2, y0 - 9, 14, '#ffffff');

      box(x + 8, y0 + 48, 24, 20, false, false, 'rgba(255,255,255,0.2)');
      hit(x + 8, y0 + 48, 24, 20, 'down', i);
      text('-', x + bw / 2, y0 + 63, 14, '#ffffff');
    }

    var ox = VIEW_W / 2 - 40;
    box(ox, 182, 80, 24, false, false, '#7fd05f');
    hit(ox, 182, 80, 24, 'ok', 0);
    text('GO', VIEW_W / 2, 199, 14, '#ffffff');

    text('Type the letters, or tap + and -', VIEW_W / 2, 220, 9, 'rgba(255,255,255,0.75)');
    text('Then press SPACE or tap GO.', VIEW_W / 2, 231, 9, 'rgba(255,255,255,0.75)');
    backBox();
    menuFoot('', '');
  }

  function drawWorldClear() {
    drawBackground();
    panel(0.6);
    var nextW = Math.min(game.world + 1, WORLDS.length - 1);
    text('WORLD ' + (game.world + 1) + ' DONE', VIEW_W / 2, 60, 26, '#ffd93d');
    text(WORLDS[game.world].name + ' is beaten', VIEW_W / 2, 84, 11, '#ffffff');
    text('NEW WORLD OPEN', VIEW_W / 2, 122, 14, WORLDS[nextW].tint);
    text(WORLDS[nextW].name, VIEW_W / 2, 142, 20, '#ffffff');
    text('CODE:  ' + WORLDS[nextW].code, VIEW_W / 2, 172, 22, '#ffd93d');
    text('Write this down. It opens this world on any device.', VIEW_W / 2, 192, 9, 'rgba(255,255,255,0.75)');
    text('Score ' + game.score, VIEW_W / 2, 212, 11, '#ffffff');
    if (game.timer > 45 && Math.floor(game.frame / 30) % 2 === 0) {
      text('PRESS SPACE or TAP TO GO ON', VIEW_W / 2, 240, 12, '#ffffff');
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

  /* ==== NEW SPRITES START ==== */

  /* A waddling snowman with a bucket hat, coal face and twig arms. */
  function drawSnowman(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir;
    var swing = Math.round(Math.sin(e.animT * 0.15) * 2);
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var sway = Math.round(Math.sin(e.animT * 0.15));
    var snow = flash ? '#ffffff' : '#f2fbff';
    var ice = flash ? '#e0e0e0' : '#a9d8f0';
    var shade = flash ? '#c0c0c0' : '#6fa8cc';
    var coal = flash ? '#909090' : '#14161f';
    var twig = flash ? '#c8c8c8' : '#7a5230';
    var carrot = flash ? '#ffffff' : '#ff8a2b';
    var parts = [];

    // twig arms with a fork on the end, swinging as it waddles
    parts.push([dx + 11, dy + 9 + swing, 4, 1, twig]);
    parts.push([dx + 14, dy + 7 + swing, 1, 2, twig]);
    parts.push([dx - 2, dy + 9 - swing, 4, 1, twig]);
    parts.push([dx - 2, dy + 7 - swing, 1, 2, twig]);

    // three stacked snow balls, each capped so the seams show
    parts.push([dx + 3, dy + 12, 7, 1, snow]);
    parts.push([dx + 1, dy + 13, 11, 3, snow]);
    parts.push([dx + 4, dy + 8, 5, 1, snow]);
    parts.push([dx + 2, dy + 9, 9, 3, snow]);
    parts.push([dx + 4 + sway, dy + 3, 5, 1, snow]);
    parts.push([dx + 3 + sway, dy + 4, 7, 4, snow]);

    // icy blue shading down the right hand side
    parts.push([dx + 8, dy + 13, 4, 3, ice]);
    parts.push([dx + 9, dy + 9, 2, 3, ice]);
    parts.push([dx + 8 + sway, dy + 4, 2, 4, ice]);
    parts.push([dx + 1, dy + 15, 11, 1, shade]);

    // coal buttons
    parts.push([dx + 4, dy + 10, 2, 2, coal]);
    parts.push([dx + 4, dy + 14, 2, 2, coal]);

    // little dark bucket hat
    parts.push([dx + 2 + sway, dy + 2, 9, 1, flash ? '#dddddd' : '#232840']);
    parts.push([dx + 4 + sway, dy, 5, 2, flash ? '#eeeeee' : '#2f3550']);

    // coal face
    parts.push([dx + 4 + sway, dy + 4, 2, 2, coal]);
    parts.push([dx + 7 + sway, dy + 4, 2, 2, coal]);
    parts.push([dx + 5 + sway, dy + 7, 3, 1, coal]);

    // carrot nose pointing the way it walks
    if (f > 0) {
      parts.push([dx + 10 + sway, dy + 5, 3, 2, carrot]);
      parts.push([dx + 13 + sway, dy + 5, 1, 1, flash ? '#dddddd' : '#e06a12']);
    } else {
      parts.push([dx + sway, dy + 5, 3, 2, carrot]);
      parts.push([dx - 1 + sway, dy + 6, 1, 1, flash ? '#dddddd' : '#e06a12']);
    }

    drawSprite(parts);
  }

  /* A small dark purple bat with flapping wings and glowing pink eyes. */
  function drawBat(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir;
    var swing = Math.round(Math.sin(e.animT * 0.15) * 2);
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var bob = -Math.round(swing * 0.5);
    var fur = flash ? '#ffffff' : '#7a45b5';
    var wing = flash ? '#dcdcdc' : '#3d2263';
    var vein = flash ? '#b4b4b4' : '#5c3488';
    var eye = flash ? '#ffffff' : '#ff3b6b';

    drawSprite([
      // wings sweeping up and out, flapping with the walk cycle
      [dx + 10, dy + 3 + swing, 2, 4, wing],
      [dx + 12, dy + 1 + swing, 3, 4, wing],
      [dx + 12, dy + 1 + swing, 1, 4, vein],
      [dx + 1, dy + 3 + swing, 2, 4, wing],
      [dx - 2, dy + 1 + swing, 3, 4, wing],
      [dx, dy + 1 + swing, 1, 4, vein],
      // pointy ears
      [dx + 4, dy + 1 + bob, 2, 3, fur],
      [dx + 7, dy + 1 + bob, 2, 3, fur],
      // body and snout
      [dx + 3, dy + 4 + bob, 7, 5, fur],
      [f > 0 ? dx + 10 : dx + 2, dy + 6 + bob, 1, 2, fur],
      // glowing eyes and little fangs
      [dx + 4, dy + 5 + bob, 2, 2, eye],
      [dx + 7, dy + 5 + bob, 2, 2, eye],
      [dx + 5, dy + 8 + bob, 1, 1, '#ffffff'],
      [dx + 7, dy + 8 + bob, 1, 1, '#ffffff']
    ]);
  }

  /* A bandage wrapped mummy shambling along with both arms out in front. */
  function drawMummy(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir;
    var swing = Math.round(Math.sin(e.animT * 0.15) * 2);
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var wrap = flash ? '#ffffff' : '#ded3b4';
    var band = flash ? '#cbcbcb' : '#a89877';
    var deep = flash ? '#b0b0b0' : '#7d6f52';
    var socket = flash ? '#888888' : '#16130c';
    var glow = flash ? '#ffffff' : '#c9ab35';
    var ax = f > 0 ? dx + 10 : dx - 2;
    var parts = [];

    // loose bandage flapping behind
    parts.push([f > 0 ? dx - 2 : dx + 10, dy + 7 + Math.round(swing * 0.5), 4, 2, wrap]);

    // legs
    parts.push([dx + 3 + swing, dy + 12, 3, 4, deep]);
    parts.push([dx + 7 - swing, dy + 12, 3, 4, deep]);

    // wrapped body with bandage stripe lines
    parts.push([dx + 2, dy + 6, 9, 6, wrap]);
    parts.push([dx + 2, dy + 8, 5, 1, band]);
    parts.push([dx + 5, dy + 10, 6, 1, band]);
    parts.push([dx + 3, dy + 6, 8, 1, band]);

    // both arms held straight out in front
    parts.push([ax, dy + 6, 5, 3, wrap]);
    parts.push([ax, dy + 7, 5, 1, band]);
    parts.push([f > 0 ? ax + 4 : ax, dy + 9, 1, 3, wrap]);

    // head with hollow eyes and a faint yellow glow
    parts.push([dx + 3, dy + 1, 8, 5, wrap]);
    parts.push([dx + 3, dy + 1, 5, 1, band]);
    parts.push([dx + 4, dy + 3, 2, 2, socket]);
    parts.push([dx + 8, dy + 3, 2, 2, socket]);
    parts.push([dx + 4, dy + 4, 2, 1, glow]);
    parts.push([dx + 8, dy + 4, 2, 1, glow]);

    drawSprite(parts);
  }

  /* A low sandy scorpion with a snapping claw and a stinger curled over its back. */
  function drawScorpion(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir;
    var swing = Math.round(Math.sin(e.animT * 0.15) * 2);
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var sand = flash ? '#ffffff' : '#e0913c';
    var deep = flash ? '#d0d0d0' : '#a8631f';
    var dark = flash ? '#9a9a9a' : '#5e3310';
    var sting = flash ? '#ffffff' : '#4a2a5e';
    var snap = swing > 0 ? 0 : 1;
    var lift = Math.round(Math.sin(e.animT * 0.15));

    function mx(x, w) { return f > 0 ? dx + x : dx + 15 - x - w; }

    drawSprite([
      // tail arcing up over its back, tapering to a dark sting
      [mx(0, 3), dy + 4, 3, 4, deep],
      [mx(1, 3), dy + 1 + lift, 3, 3, deep],
      [mx(4, 3), dy + lift, 3, 2, deep],
      [mx(7, 2), dy + 1 + lift, 2, 2, deep],
      [mx(8, 2), dy + 3 + lift, 2, 2, sting],
      [mx(8, 1), dy + 5 + lift, 1, 1, sting],
      // flat wide body
      [mx(2, 9), dy + 6, 9, 4, sand],
      [mx(2, 9), dy + 8, 9, 1, deep],
      // small head with beady eyes
      [mx(10, 2), dy + 6, 2, 3, sand],
      [mx(10, 2), dy + 7, 2, 1, dark],
      // big claw that snaps open and shut
      [mx(11, 2), dy + 7, 2, 2, deep],
      [mx(12, 2), dy + 5 + snap, 2, 5, deep],
      [mx(14, 3), dy + 5 + snap, 3, 2, sand],
      [mx(14, 3), dy + 8, 3, 2, sand],
      // little legs, alternating as it scuttles
      [mx(3, 1), dy + 10, 1, 2, dark],
      [mx(5, 1), dy + 10 - snap, 1, 2, dark],
      [mx(7, 1), dy + 10, 1, 2, dark],
      [mx(9, 1), dy + 10 - snap, 1, 2, dark]
    ]);
  }

  /* A little fire imp with horns, big yellow eyes and a flame on its head. */
  function drawImp(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir;
    var swing = Math.round(Math.sin(e.animT * 0.15) * 2);
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var fx = (Math.floor(e.animT / 5) % 3) - 1;
    var fy = Math.floor(e.animT / 4) % 2;
    var skin = flash ? '#ffffff' : '#ff7a1f';
    var deep = flash ? '#dadada' : '#d13a12';
    var dark = flash ? '#a4a4a4' : '#8c2410';
    var eye = flash ? '#ffffff' : '#ffe14d';
    var tip = flash ? '#ffffff' : '#fff2a8';
    var pupil = flash ? '#888888' : '#4a1000';

    drawSprite([
      // flame flickering above its head
      [dx + 4, dy, 4, 2, deep],
      [dx + 5 + fx, dy - 2, 2, 2, skin],
      [dx + 5 + fx, dy - 2 + fy, 1, 1, tip],
      // horns poking up at the corners
      [dx + 1, dy, 2, 3, dark],
      [dx + 9, dy, 2, 3, dark],
      // forked tail flicking behind
      [f > 0 ? dx - 2 : dx + 9, dy + 9 + Math.round(swing * 0.5), 3, 1, deep],
      // legs and arms
      [dx + 3 + swing, dy + 11, 3, 3, dark],
      [dx + 6 - swing, dy + 11, 3, 3, dark],
      [dx + 1, dy + 8 + swing, 2, 3, deep],
      [dx + 9, dy + 8 - swing, 2, 3, deep],
      // body
      [dx + 3, dy + 7, 6, 4, skin],
      [dx + 3, dy + 9, 6, 1, deep],
      // head with a heavy brow and big yellow eyes
      [dx + 2, dy + 2, 8, 5, skin],
      [dx + 2, dy + 2, 8, 1, dark],
      [dx + 3, dy + 3, 3, 2, eye],
      [dx + 7, dy + 3, 3, 2, eye],
      [dx + 4 + f, dy + 3, 1, 2, pupil],
      [dx + 8 + f, dy + 3, 1, 2, pupil],
      [dx + 4, dy + 6, 4, 1, pupil]
    ]);
  }

  /* A molten lava blob that squashes flat when it lands and stretches when it hops. */
  function drawBlob(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir;
    var swing = Math.round(Math.sin(e.animT * 0.15) * 2);
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var st;
    if (e.onGround) {
      st = -2 + Math.round(Math.sin(e.animT * 0.18));
    } else {
      st = Math.max(-1, Math.min(3, Math.round(Math.abs(e.vy) * 0.9)));
    }
    var bw = Math.max(7, Math.min(16, 13 - st * 2));
    var bh = Math.max(8, Math.min(16, 13 + st * 2));
    var bx = dx + Math.round((14 - bw) / 2);
    var by = dy + 14 - bh;
    var core = flash ? '#ffffff' : '#ff6a00';
    var hot = flash ? '#ffffff' : '#ffc33f';
    var crust = flash ? '#cccccc' : '#c8280d';
    var dark = flash ? '#8f8f8f' : '#5e1204';
    var bub = Math.floor(e.animT / 6) % 3;
    var ew = bw >= 11 ? 2 : 1;
    var eo = bw >= 11 ? 3 : 2;
    var ey = by + Math.max(3, Math.round(bh * 0.42));

    drawSprite([
      // rounded top, flat bottom sitting on the floor
      [bx + 3, by, bw - 6, 1, core],
      [bx + 1, by + 1, bw - 2, 1, core],
      [bx, by + 2, bw, bh - 4, core],
      // dark red crust along the bottom
      [bx, by + bh - 3, bw, 3, crust],
      [bx + 1, by + bh - 1, bw - 2, 1, dark],
      // hot yellow highlight and bubbles on top
      [bx + 3, by + 1, Math.max(2, bw - 8), 1, hot],
      [bx + 2, by + 2, Math.max(2, bw - 6), 2, hot],
      [bx + 2 + bub, by + 5, 1, 1, hot],
      [bx + bw - 3 - bub, by + 4, 1, 1, hot],
      [bx + 3 + swing, by + bh - 5, 2, 1, hot],
      // eyes so it reads as a creature, not a rock
      [bx + eo + (f > 0 ? 1 : 0), ey, ew, 2, dark],
      [bx + bw - eo - ew + (f > 0 ? 1 : 0), ey, ew, 2, dark]
    ]);
  }

  /* An evil shadow ninja, the hero's dark twin, with a purple scarf and red eyes. */
  function drawShadow(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir;
    var swing = Math.round(Math.sin(e.animT * 0.15) * 2);
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var tail = Math.round(Math.sin(e.animT * 0.22) * 1.5);
    var suit = flash ? '#ffffff' : '#2d1b4e';
    var dark = flash ? '#d6d6d6' : '#160d2b';
    var skin = flash ? '#eaeaea' : '#432f6d';
    var scarf = flash ? '#ffffff' : '#8a3bd6';
    var scarf2 = flash ? '#d6d6d6' : '#5d21a0';
    var eye = flash ? '#ffffff' : '#ff2b2b';

    drawSprite([
      // scarf trailing behind
      [f > 0 ? dx - 3 : dx + 9, dy + 4 + tail, 5, 2, scarf],
      [f > 0 ? dx - 5 : dx + 13, dy + 6 + tail, 3, 2, scarf2],
      // legs
      [dx + 3 + swing, dy + 12, 3, 4, dark],
      [dx + 7 - swing, dy + 12, 3, 4, dark],
      // body and sash
      [dx + 2, dy + 6, 8, 6, suit],
      [dx + 2, dy + 10, 8, 1, scarf2],
      // arms
      [dx + 1 - Math.round(swing * 0.5), dy + 7, 2, 4, dark],
      [dx + 9 + Math.round(swing * 0.5), dy + 7, 2, 4, dark],
      // masked head with a glowing red stare
      [dx + 2, dy + 1, 8, 5, skin],
      [dx + 1, dy + 2, 10, 2, scarf],
      [dx + 2, dy + 4, 8, 1, dark],
      [f > 0 ? dx + 5 : dx + 2, dy + 4, 2, 1, eye],
      [f > 0 ? dx + 8 : dx + 5, dy + 4, 2, 1, eye]
    ]);
  }

  /* A see through ghost with a rounded top and a tattered rippling hem. */
  function drawGhost(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir;
    var swing = Math.round(Math.sin(e.animT * 0.15) * 2);
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var bob = Math.round(swing * 0.5);
    var pale = flash ? '#ffffff' : '#dff2ff';
    var cool = flash ? '#e6e6e6' : '#a8cfe8';
    var dark = flash ? '#6f6f6f' : '#1b2340';
    var parts = [];
    var i, h, step = Math.floor(e.animT / 5);

    // tattered hem, long ragged tongues with dark splits between them
    for (i = 0; i < 3; i++) {
      h = 2 + ((step + i) % 4);
      parts.push([dx + i * 5, dy + 9 + bob, 4, h, i === 1 ? cool : pale]);
    }

    // rounded stepped top over a body that flares out at the bottom
    parts.push([dx + 4, dy + bob, 6, 1, pale]);
    parts.push([dx + 3, dy + 1 + bob, 8, 1, pale]);
    parts.push([dx + 2, dy + 2 + bob, 10, 2, pale]);
    parts.push([dx + 1, dy + 4 + bob, 12, 5, pale]);
    parts.push([dx, dy + 7 + bob, 14, 3, pale]);
    parts.push([dx + 11, dy + 4 + bob, 2, 3, cool]);
    parts.push([dx + 11, dy + 7 + bob, 3, 3, cool]);
    parts.push([dx + 3, dy + 1 + bob, 3, 1, cool]);

    // face, looking the way it drifts
    parts.push([dx + 3 + f, dy + 4 + bob, 2, 3, dark]);
    parts.push([dx + 8 + f, dy + 4 + bob, 2, 3, dark]);
    parts.push([dx + 6, dy + 7 + bob, 2, 2, dark]);

    ctx.globalAlpha = flash ? 1 : 0.74;
    drawSprite(parts);
    ctx.globalAlpha = 1;
  }

  /* Boss: a huge ice giant with shard shoulders and a crown of icicles. */
  function drawFrostGiant(e) {
    var dx = Math.round(e.x), dy = Math.round(e.y);
    var f = e.dir;
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var rage = e.hp <= Math.ceil(e.maxHp / 2);
    var sway = Math.round(Math.sin(e.animT * 0.09) * 2);
    var ice = flash ? '#ffffff' : '#bfe9ff';
    var mid = flash ? '#dedede' : '#7fc0e0';
    var deep = flash ? '#b4b4b4' : '#4a86b8';
    var dark = flash ? '#7d7d7d' : '#14324a';
    var eye = rage ? '#ff3b1f' : '#6ff0ff';
    var open = e.mouth > 0;
    var parts = [];

    // legs
    parts.push([dx + 5 + sway, dy + 27, 8, 7, deep]);
    parts.push([dx + 17 - sway, dy + 27, 8, 7, deep]);
    parts.push([dx + 5 + sway, dy + 32, 8, 2, mid]);
    parts.push([dx + 17 - sway, dy + 32, 8, 2, mid]);

    // arms hanging clear of the body with big fists on the end
    parts.push([dx - 1, dy + 18 + sway, 6, 7, mid]);
    parts.push([dx + 25, dy + 18 - sway, 6, 7, mid]);
    parts.push([dx - 2, dy + 24 + sway, 8, 8, ice]);
    parts.push([dx + 24, dy + 24 - sway, 8, 8, ice]);
    parts.push([dx - 2, dy + 27 + sway, 8, 1, deep]);
    parts.push([dx + 24, dy + 27 - sway, 8, 1, deep]);
    parts.push([dx - 2, dy + 30 + sway, 8, 1, deep]);
    parts.push([dx + 24, dy + 30 - sway, 8, 1, deep]);

    // thick body
    parts.push([dx + 7, dy + 15, 16, 13, ice]);
    parts.push([dx + 16, dy + 15, 7, 13, mid]);
    parts.push([dx + 9, dy + 18, 12, 2, deep]);
    parts.push([dx + 8, dy + 23, 14, 2, deep]);

    // blocky ice shard shoulders
    parts.push([dx + 1, dy + 13, 9, 6, mid]);
    parts.push([dx + 20, dy + 13, 9, 6, mid]);
    parts.push([dx + 2, dy + 9, 3, 5, ice]);
    parts.push([dx + 6, dy + 10, 3, 4, ice]);
    parts.push([dx + 21, dy + 10, 3, 4, ice]);
    parts.push([dx + 25, dy + 9, 3, 5, ice]);

    // head
    parts.push([dx + 9, dy + 1, 12, 11, ice]);
    parts.push([dx + 9, dy + 3, 12, 2, deep]);

    // jagged crown of icicles
    parts.push([dx + 9, dy - 1, 2, 4, mid]);
    parts.push([dx + 12, dy - 2, 3, 5, ice]);
    parts.push([dx + 16, dy - 1, 2, 4, mid]);
    parts.push([dx + 19, dy - 2, 2, 5, ice]);

    // deep set glowing eyes
    parts.push([dx + 10, dy + 5, 4, 4, dark]);
    parts.push([dx + 16, dy + 5, 4, 4, dark]);
    parts.push([dx + 11, dy + 6, 3, 3, eye]);
    parts.push([dx + 17, dy + 6, 3, 3, eye]);
    parts.push([f > 0 ? dx + 20 : dx + 9, dy + 8, 1, 1, eye]);

    // mouth full of icy teeth, opens wide when it attacks
    if (open) {
      parts.push([dx + 11, dy + 8, 8, 5, dark]);
      parts.push([dx + 12, dy + 8, 1, 2, ice]);
      parts.push([dx + 15, dy + 8, 1, 2, ice]);
      parts.push([dx + 17, dy + 8, 1, 2, ice]);
      parts.push([dx + 13, dy + 11, 1, 2, ice]);
      parts.push([dx + 16, dy + 11, 1, 2, ice]);
    } else {
      parts.push([dx + 11, dy + 9, 8, 2, dark]);
      parts.push([dx + 12, dy + 9, 1, 2, ice]);
      parts.push([dx + 15, dy + 9, 1, 2, ice]);
      parts.push([dx + 17, dy + 9, 1, 2, ice]);
    }

    drawSprite(parts);
  }

  /* Boss: a tall royal mummy in a gold pharaoh headdress with crossed arms. */
  function drawMummyLord(e) {
    var dx = Math.round(e.x), dy = Math.round(e.y);
    var f = e.dir;
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var rage = e.hp <= Math.ceil(e.maxHp / 2);
    var sway = Math.round(Math.sin(e.animT * 0.08) * 2);
    var breathe = Math.round(Math.sin(e.animT * 0.07));
    var wrap = flash ? '#ffffff' : '#ded3b4';
    var band = flash ? '#bdbdbd' : '#9a8963';
    var deep = flash ? '#9a9a9a' : '#6b5e42';
    var gold = flash ? '#ffffff' : '#e8c33a';
    var gold2 = flash ? '#c4c4c4' : '#a8871c';
    var dark = flash ? '#7d7d7d' : '#1a150c';
    var eye = rage ? '#ff3b1f' : '#ffe14d';
    var jaw = e.mouth > 0 ? 2 : 0;
    var ay = breathe;

    drawSprite([
      // wrapped legs
      [dx + 5 + sway, dy + 25, 6, 7, wrap],
      [dx + 15 - sway, dy + 25, 6, 7, wrap],
      [dx + 5 + sway, dy + 28, 6, 1, deep],
      [dx + 15 - sway, dy + 28, 6, 1, deep],
      // bandaged body with stripe lines
      [dx + 5, dy + 16, 16, 10, wrap],
      [dx + 18, dy + 16, 3, 10, band],
      [dx + 5, dy + 17, 9, 1, deep],
      [dx + 8, dy + 24, 13, 1, deep],
      // one arm crossing up to the right, the other crossing down
      [dx + 3, dy + 23 + ay, 6, 3, band],
      [dx + 8, dy + 21 + ay, 6, 3, band],
      [dx + 13, dy + 19 + ay, 6, 3, band],
      [dx + 8, dy + 19 + ay, 6, 3, wrap],
      [dx + 13, dy + 21 + ay, 6, 3, wrap],
      [dx + 18, dy + 23 + ay, 5, 3, wrap],
      [dx + 2, dy + 22 + ay, 3, 4, wrap],
      [dx + 21, dy + 22 + ay, 3, 4, band],
      // gold collar sitting under the headdress
      [dx + 2, dy + 13, 22, 4, gold],
      [dx + 7, dy + 13, 1, 4, gold2],
      [dx + 12, dy + 13, 1, 4, gold2],
      [dx + 17, dy + 13, 1, 4, gold2],
      [dx + 2, dy + 16, 22, 1, gold2],
      // bandaged face
      [dx + 8, dy + 3, 10, 10, wrap],
      [dx + 8, dy + 4, 6, 1, band],
      [dx + 11, dy + 12, 7, 1, band],
      // gold headdress with stripes and side flaps
      [dx + 6, dy, 14, 4, gold],
      [dx + 8, dy, 1, 4, gold2],
      [dx + 11, dy, 1, 4, gold2],
      [dx + 14, dy, 1, 4, gold2],
      [dx + 17, dy, 1, 4, gold2],
      [dx + 3, dy + 2, 4, 12, gold],
      [dx + 19, dy + 2, 4, 12, gold],
      [dx + 3, dy + 5, 4, 1, gold2],
      [dx + 3, dy + 9, 4, 1, gold2],
      [dx + 19, dy + 5, 4, 1, gold2],
      [dx + 19, dy + 9, 4, 1, gold2],
      [dx + 12, dy - 2, 2, 3, rage ? '#ff3b1f' : '#3fbf7f'],
      // hollow glowing eyes
      [dx + 9, dy + 6, 3, 3, dark],
      [dx + 14, dy + 6, 3, 3, dark],
      [dx + 9, dy + 7, 3, 2, eye],
      [dx + 14, dy + 7, 3, 2, eye],
      [f > 0 ? dx + 17 : dx + 8, dy + 8, 1, 1, eye],
      // mouth and the gold pharaoh beard
      [dx + 11, dy + 10, 4, 1 + jaw, dark],
      [dx + 12, dy + 12, 3, 7, gold],
      [dx + 12, dy + 15, 3, 1, gold2],
      [dx + 12, dy + 18, 3, 1, gold2]
    ]);
  }

  /* Boss: a flying fire dragon with a spread bat wing and a snapping snout. */
  function drawFireDragon(e) {
    var dx = Math.round(e.x), dy = Math.round(e.y);
    var f = e.dir;
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var rage = e.hp <= Math.ceil(e.maxHp / 2);
    var flap = Math.round(Math.sin(e.animT * 0.12) * 3);
    var tw = Math.round(Math.sin(e.animT * 0.1) * 2);
    var body = flash ? '#ffffff' : '#c8280d';
    var belly = flash ? '#e4e4e4' : '#ff6a00';
    var wing = flash ? '#c0c0c0' : '#8c1a08';
    var vein = flash ? '#909090' : '#5e1004';
    var horn = flash ? '#ffffff' : '#f2d9a8';
    var dark = flash ? '#787878' : '#2a0a04';
    var eye = rage ? '#fff6c8' : '#ffe14d';
    var parts = [];

    function mx(x, w) { return f > 0 ? dx + x : dx + 34 - x - w; }

    // far wing, a darker hint peeking out behind the near one
    parts.push([mx(14, 3), dy + 4 - flap, 3, 8 + flap, vein]);
    parts.push([mx(10, 3), dy + 2 - flap, 3, 8 + flap, vein]);

    // near wing, separate finger bars with dark splits so it reads as a bat wing
    parts.push([mx(16, 3), dy + 7 - flap, 3, 8 + flap, wing]);
    parts.push([mx(12, 3), dy + 5 - flap, 3, 7 + flap, wing]);
    parts.push([mx(8, 3), dy + 3 - flap, 3, 7 + flap, wing]);
    parts.push([mx(4, 3), dy + 2 - flap, 3, 6 + flap, wing]);
    parts.push([mx(1, 2), dy + 3 - flap, 2, 4 + flap, wing]);
    parts.push([mx(1, 2), dy + 1 - flap, 2, 2, horn]);

    // tail swishing behind with a spade tip
    parts.push([mx(4, 7), dy + 16 + tw, 7, 4, body]);
    parts.push([mx(0, 5), dy + 17 + tw, 5, 3, body]);
    parts.push([mx(-2, 3), dy + 15 + tw, 3, 5, belly]);

    // body and orange belly
    parts.push([mx(10, 14), dy + 12, 14, 8, body]);
    parts.push([mx(11, 12), dy + 16, 12, 4, belly]);
    parts.push([mx(11, 12), dy + 14, 12, 1, vein]);

    // clawed feet tucked under
    parts.push([mx(12, 4), dy + 20, 4, 3, wing]);
    parts.push([mx(18, 4), dy + 20, 4, 3, wing]);
    parts.push([mx(12, 4), dy + 22, 4, 1, horn]);
    parts.push([mx(18, 4), dy + 22, 4, 1, horn]);

    // neck and head
    parts.push([mx(21, 6), dy + 8, 6, 7, body]);
    parts.push([mx(25, 7), dy + 6, 7, 7, body]);
    parts.push([mx(24, 2), dy + 1, 2, 5, horn]);
    parts.push([mx(25, 1), dy, 1, 2, horn]);
    parts.push([mx(27, 2), dy + 2, 2, 4, horn]);
    parts.push([mx(27, 4), dy + 7, 4, 3, dark]);
    parts.push([mx(28, 3), dy + 7, 3, 2, eye]);

    // long snout, open wide when it breathes fire
    if (e.mouth > 0) {
      parts.push([mx(30, 6), dy + 6, 6, 3, body]);
      parts.push([mx(30, 5), dy + 12, 5, 2, body]);
      parts.push([mx(30, 5), dy + 9, 5, 3, eye]);
      parts.push([mx(31, 1), dy + 9, 1, 1, horn]);
      parts.push([mx(33, 1), dy + 9, 1, 1, horn]);
      parts.push([mx(31, 1), dy + 11, 1, 1, horn]);
    } else {
      parts.push([mx(30, 5), dy + 9, 5, 4, body]);
      parts.push([mx(30, 5), dy + 11, 5, 1, dark]);
      parts.push([mx(31, 1), dy + 12, 1, 1, horn]);
      parts.push([mx(33, 1), dy + 12, 1, 1, horn]);
    }

    drawSprite(parts);
  }

  /* Boss: the shadow master, a tall ninja lord in a wide hat and rippling cloak. */
  function drawShadowMaster(e) {
    var dx = Math.round(e.x), dy = Math.round(e.y);
    var f = e.dir;
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var rage = e.hp <= Math.ceil(e.maxHp / 2);
    var sway = Math.round(Math.sin(e.animT * 0.09) * 2);
    var tail = Math.round(Math.sin(e.animT * 0.16) * 2);
    var cloak = flash ? '#ffffff' : '#1a1030';
    var robe = flash ? '#d8d8d8' : '#2d1b4e';
    var deep = flash ? '#a8a8a8' : '#0f0a1c';
    var red = flash ? '#ffffff' : '#c2202a';
    var eye = flash ? '#ffffff' : (rage ? '#ff6a4a' : '#ff2b2b');
    var aura = Math.floor(e.animT / 6) % 2 === 0 ? '#ff2b2b' : '#a01424';
    var parts = [];
    var i, h, step = Math.floor(e.animT / 5);

    // red rage aura hugging the silhouette
    if (rage) {
      parts.push([dx, dy + 9, 26, 17, aura]);
      parts.push([dx, dy + 1, 26, 5, aura]);
      parts.push([dx + 7, dy - 2, 12, 4, aura]);
    }

    // red scarf trailing behind
    parts.push([f > 0 ? dx + 20 : dx, dy + 12 + tail, 6, 3, red]);
    parts.push([f > 0 ? dx + 25 : dx - 3, dy + 14 + tail, 4, 2, '#8c1620']);

    // rippling cloak hem with dark splits between the tongues
    for (i = 0; i < 6; i++) {
      h = 2 + ((step + i) % 3);
      parts.push([dx + 2 + i * 4, dy + 23, 3, h + 2, i % 2 === 0 ? cloak : robe]);
    }

    // flowing cloak
    parts.push([dx + 4, dy + 11, 18, 13, cloak]);
    parts.push([dx + 2, dy + 18, 22, 6, cloak]);
    parts.push([dx + 7, dy + 13, 12, 8, robe]);
    parts.push([dx + 5, dy + 20, 16, 2, red]);
    parts.push([dx + 11, dy + 19, 4, 3, red]);

    // arms over the cloak so they read
    parts.push([dx + 1, dy + 13 + sway, 4, 8, robe]);
    parts.push([dx + 21, dy + 13 - sway, 4, 8, robe]);
    parts.push([dx + 1, dy + 19 + sway, 4, 2, deep]);
    parts.push([dx + 21, dy + 19 - sway, 4, 2, deep]);

    // scarf around the neck
    parts.push([dx + 7, dy + 10, 12, 2, red]);

    // hooded head behind a dark mask
    parts.push([dx + 8, dy + 4, 10, 7, robe]);
    parts.push([dx + 9, dy + 6, 8, 5, deep]);
    parts.push([f > 0 ? dx + 11 : dx + 9, dy + 7, 3, 2, eye]);
    parts.push([f > 0 ? dx + 15 : dx + 13, dy + 7, 3, 2, eye]);

    // wide brimmed hat
    parts.push([dx + 1, dy + 2, 24, 3, deep]);
    parts.push([dx + 1, dy + 5, 24, 1, robe]);
    parts.push([dx + 8, dy - 1, 10, 4, cloak]);
    parts.push([dx + 8, dy - 1, 10, 1, robe]);

    drawSprite(parts);
  }

  /* ==== NEW SPRITES END ==== */

  var ART = null;

  function drawEnemyArt(e) {
    if (!ART) {
      ART = {
        'Z': drawZombie, 'S': drawSkeleton, 'W': drawSnowman, 'V': drawBat,
        'U': drawMummy, 'C': drawScorpion, 'I': drawImp, 'G': drawBlob,
        'N': drawShadow, 'Y': drawGhost,
        'K': drawSkullKing, 'J': drawFrostGiant, 'Q': drawMummyLord,
        'D': drawFireDragon, 'X': drawShadowMaster
      };
    }
    var fn = ART[e.char] || (e.kind === 'boss' ? drawSkullKing : drawZombie);
    if (e.artDy) {
      ctx.save();
      ctx.translate(0, -e.artDy);
      fn(e);
      ctx.restore();
    } else {
      fn(e);
    }
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    if (game.mode === 'title') { drawTitle(); return; }
    if (game.mode === 'worlds') { drawWorldSelect(); return; }
    if (game.mode === 'levels') { drawLevelSelect(); return; }
    if (game.mode === 'code') { drawCodeScreen(); return; }
    if (game.mode === 'worldclear') { drawWorldClear(); return; }

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
      if (e.x - cam.x < -70 || e.x - cam.x > VIEW_W + 70) { continue; }
      if (e.ghostT > 0) { ctx.globalAlpha = 0.35; }
      drawEnemyArt(e);
      ctx.globalAlpha = 1;
    }

    /* The beaten boss sinks into the ground before the level ends. */
    if (boss && !boss.alive && bossDown > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(bossDown / 130, 0, 1);
      ctx.translate(0, (130 - bossDown) * 0.16);
      drawEnemyArt(boss);
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
    get menu() { return menu; },
    get progress() { return progress; },
    worlds: WORLDS,
    jump: function () { jumpBuffer = 8; confirmEdge = true; },
    attack: function () { throwEdge = true; },
    /* Jump straight to a level. NINJA.goTo(4) is the first boss.
       You can also say NINJA.goTo(1, 2) for world 2, level 3. */
    goTo: function (a, b) {
      var n = (b === undefined) ? a : firstLevelOf(a) + b;
      n = clamp(n, 0, LEVELS.length - 1);
      unlockUpTo(n);
      startLevel(n);
    },
    unlockAll: function () { progress.max = LEVELS.length - 1; saveProgress(); },
    wipeSave: function () {
      progress = { max: 0, best: 0 };
      game.best = 0;
      saveProgress();
    }
  };

  loadProgress();
  game.best = progress.best;
  loadLevel(0);
  game.mode = 'title';
  requestAnimationFrame(frame);
})();

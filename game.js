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
      rock: '#2c2044', rockTop: '#4c3870', plank: '#3a2850', plankTop: '#563e72' },
    /* 10 Sky Temple */
    { skyTop: '#123a6e', skyBot: '#7fc4e8', hillFar: '#4e8cba', hillNear: '#2b5c8e',
      rock: '#c8d4e2', rockTop: '#f0f6ff', plank: '#d8b87a', plankTop: '#f2d99a' },
    /* 11 Sky Temple boss */
    { skyTop: '#0c2450', skyBot: '#4a86b8', hillFar: '#356a96', hillNear: '#1d4470',
      rock: '#aebdd0', rockTop: '#dfe9f6', plank: '#c2a476', plankTop: '#e0c68a' },
    /* 12 Deep Cave */
    { skyTop: '#050a14', skyBot: '#122436', hillFar: '#0d1c2c', hillNear: '#060e18',
      rock: '#2c3a4e', rockTop: '#4a6280', plank: '#3e2f52', plankTop: '#5e4a7c' },
    /* 13 Deep Cave boss */
    { skyTop: '#0a0618', skyBot: '#2a1848', hillFar: '#1a1030', hillNear: '#0a0618',
      rock: '#33294c', rockTop: '#584a7e', plank: '#4a2f60', plankTop: '#6f4a90' },
    /* 14 Iron Works */
    { skyTop: '#140f10', skyBot: '#3a2e28', hillFar: '#2a2220', hillNear: '#151110',
      rock: '#4a4a52', rockTop: '#72747e', plank: '#7a5a2c', plankTop: '#a8802e' },
    /* 15 Iron Works boss */
    { skyTop: '#0e0a0a', skyBot: '#2e2018', hillFar: '#201814', hillNear: '#0f0b0a',
      rock: '#42424a', rockTop: '#64666e', plank: '#8a5a1c', plankTop: '#c08a24' }
  ];

  /* Eight worlds. Six levels in each one. The last one is always a boss.
     The code lets you open a world again on another phone or computer. */
  var WORLDS = [
    { name: 'GREEN WOODS', code: 'LEAF', pal: 0, bossPal: 1, tint: '#7fd05f' },
    { name: 'FROST PEAK', code: 'SNOW', pal: 2, bossPal: 3, tint: '#8fd6ff' },
    { name: 'SAND TOMB', code: 'SAND', pal: 4, bossPal: 5, tint: '#f0c46a' },
    { name: 'FIRE KEEP', code: 'LAVA', pal: 6, bossPal: 7, tint: '#ff8a3c' },
    { name: 'SHADOW FORT', code: 'DARK', pal: 8, bossPal: 9, tint: '#b98cff' },
    { name: 'SKY TEMPLE', code: 'WIND', pal: 10, bossPal: 11, tint: '#bfe4ff' },
    { name: 'DEEP CAVE', code: 'GEMS', pal: 12, bossPal: 13, tint: '#7ad8c8' },
    { name: 'IRON WORKS', code: 'IRON', pal: 14, bossPal: 15, tint: '#ffab3d' }
  ];
  var MASTER_CODE = 'BOSS';
  var LEVELS_PER_WORLD = 6;

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

  var input = { left: false, right: false, jumpHeld: false, throwHeld: false, up: false, down: false };
  var jumpBuffer = 0;
  var throwEdge = false;
  var confirmEdge = false;
  var navEdge = 0;
  var backEdge = false;
  /* Escape (or the MENU button) only. Throw keys must never quit a level. */
  var escEdge = false;
  /* H, to turn the maze arrows off and on. */
  var hintEdge = false;
  var typedKey = '';
  var tapPoint = null;

  var KEY_LEFT = { ArrowLeft: 1, KeyA: 1 };
  var KEY_RIGHT = { ArrowRight: 1, KeyD: 1 };
  var KEY_JUMP = { Space: 1, ArrowUp: 1, KeyW: 1, KeyZ: 1 };
  var KEY_THROW = { KeyX: 1, KeyJ: 1, KeyK: 1, ShiftLeft: 1, ShiftRight: 1, Enter: 1 };
  /* These throw keys also mean "go back" on a menu. Enter is left out on
     purpose, because Enter must always mean "yes, do it". */
  var KEY_BACK_TOO = { KeyX: 1, KeyJ: 1, KeyK: 1, ShiftLeft: 1, ShiftRight: 1 };
  /* Up and down are only used for climbing ladders. */
  var KEY_UP = { ArrowUp: 1, KeyW: 1, Space: 1 };
  var KEY_DOWN = { ArrowDown: 1, KeyS: 1 };

  window.addEventListener('keydown', function (e) {
    Sound.init();
    if (e.repeat) {
      if (KEY_LEFT[e.code] || KEY_RIGHT[e.code] || KEY_JUMP[e.code] || KEY_THROW[e.code]) { e.preventDefault(); }
      return;
    }
    /* Letters and Backspace are only used by the secret code screen. */
    if (/^Key[A-Z]$/.test(e.code)) { typedKey = e.code.slice(3); }
    else if (e.code === 'Backspace') { typedKey = '<'; e.preventDefault(); }
    else if (e.code === 'Escape') { backEdge = true; escEdge = true; }

    /* H turns the maze arrows off and on. */
    if (e.code === 'KeyH' && game.mode === 'play') { hintEdge = true; }

    if (KEY_UP[e.code]) { input.up = true; }
    if (KEY_DOWN[e.code]) { input.down = true; navEdge = 1; e.preventDefault(); }

    if (KEY_LEFT[e.code]) { input.left = true; navEdge = -1; e.preventDefault(); }
    else if (KEY_RIGHT[e.code]) { input.right = true; navEdge = 1; e.preventDefault(); }
    else if (KEY_JUMP[e.code]) { input.jumpHeld = true; jumpBuffer = 8; confirmEdge = true; e.preventDefault(); }
    else if (KEY_THROW[e.code]) { input.throwHeld = true; throwEdge = true; confirmEdge = true; if (KEY_BACK_TOO[e.code]) { backEdge = true; } e.preventDefault(); }
  });

  window.addEventListener('keyup', function (e) {
    if (KEY_UP[e.code]) { input.up = false; }
    if (KEY_DOWN[e.code]) { input.down = false; }
    if (KEY_LEFT[e.code]) { input.left = false; }
    else if (KEY_RIGHT[e.code]) { input.right = false; }
    else if (KEY_JUMP[e.code]) { input.jumpHeld = false; }
    else if (KEY_THROW[e.code]) { input.throwHeld = false; }
  });

  window.addEventListener('blur', function () {
    input.left = input.right = input.jumpHeld = input.throwHeld = false;
    input.up = input.down = false;
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
    function () { input.jumpHeld = true; input.up = true; jumpBuffer = 8; confirmEdge = true; },
    function () { input.jumpHeld = false; input.up = false; });

  bindHold(document.getElementById('btn-throw'),
    function () { input.throwHeld = true; throwEdge = true; confirmEdge = true; backEdge = true; },
    function () { input.throwHeld = false; });

  /* Ladders need a down press, and a phone has no arrow keys. This button
     also moves the yellow box down a menu. */
  bindHold(document.getElementById('btn-down'),
    function () { input.down = true; navEdge = 1; },
    function () { input.down = false; });

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

  var menuBtn = document.getElementById('btn-menu');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      Sound.init();
      escEdge = true;
      backEdge = true;
      menuBtn.blur();
    });
  }

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
     Every one of them now needs more than one hit.
       walk   = walks along the floor and turns at walls and holes
       fly    = flies in the air and dives at you
       hop    = jumps towards you
       jumper = stays in one place and jumps straight up
       float  = floats through walls to chase you
       dive   = waits up high, then swoops down at you
     armour 'top'  = you can only hurt it by landing on its head
     shield true   = it blocks shots that come at its face */
  var ENEMY_TYPES = {
    'Z': { kind: 'zombie', w: 12, h: 15, speed: 0.35, hp: 2, ai: 'walk', color: '#7fd05f' },
    'S': { kind: 'skeleton', w: 12, h: 15, speed: 0.60, hp: 3, ai: 'walk', shot: 'bone', range: 150, rate: 115, color: '#e8e6dd' },
    'W': { kind: 'snowman', w: 13, h: 15, speed: 0.25, hp: 3, ai: 'walk', shot: 'snow', range: 140, rate: 105, color: '#dff2ff' },
    'V': { kind: 'bat', w: 12, h: 10, speed: 0.85, hp: 2, ai: 'fly', color: '#b07de0' },
    'U': { kind: 'mummy', w: 12, h: 15, speed: 0.25, hp: 4, ai: 'walk', color: '#ded3b4' },
    'C': { kind: 'scorpion', w: 14, h: 11, speed: 1.15, hp: 2, ai: 'walk', color: '#e0913c' },
    'I': { kind: 'imp', w: 11, h: 13, speed: 0.55, hp: 2, ai: 'hop', color: '#ff8a3c' },
    'G': { kind: 'blob', w: 13, h: 13, speed: 0, hp: 3, ai: 'jumper', color: '#ff6a00' },
    'N': { kind: 'shadow', w: 12, h: 15, speed: 0.80, hp: 3, ai: 'walk', shot: 'dart', range: 170, rate: 95, color: '#b98cff' },
    'Y': { kind: 'ghost', w: 13, h: 13, speed: 0.42, hp: 2, ai: 'float', color: '#cfe6ff' },
    'A': { kind: 'harpy', w: 18, h: 16, speed: 1.05, hp: 3, ai: 'dive', color: '#ffe9a8' },
    'E': { kind: 'golem', w: 20, h: 22, speed: 0.28, hp: 5, ai: 'walk', color: '#c6d6e6' },
    'L': { kind: 'slime', w: 16, h: 14, speed: 0.70, hp: 3, ai: 'hop', splits: true, color: '#6fdc7a' },
    'O': { kind: 'crab', w: 20, h: 14, speed: 0.85, hp: 4, ai: 'walk', armour: 'top', color: '#c07ae8' },
    'f': { kind: 'drone', w: 16, h: 14, speed: 0.55, hp: 3, ai: 'float', shot: 'bolt', range: 165, rate: 100, color: '#8fe3ff' },
    'j': { kind: 'sentry', w: 18, h: 20, speed: 0.42, hp: 4, ai: 'walk', shield: true, shot: 'bolt', range: 155, rate: 125, color: '#9aa2b0' }
  };

  /* A slime that is beaten splits into two small ones. */
  var SLIME_CHILD = { kind: 'slime', w: 10, h: 9, speed: 1.05, hp: 1, ai: 'hop', color: '#a8f0a8' };

  /* One big boss at the end of every world. artDy lifts the picture up a
     little when the drawing is taller than the box you can hit. */
  var BOSS_TYPES = {
    'K': { name: 'SKULL KING', w: 26, h: 30, hp: 10, brain: 'skull', color: '#f2f0e6', artDy: 0 },
    'J': { name: 'FROST GIANT', w: 30, h: 30, hp: 12, brain: 'frost', color: '#bfe9ff', artDy: 4 },
    'Q': { name: 'MUMMY LORD', w: 26, h: 30, hp: 12, brain: 'mummy', color: '#ded3b4', artDy: 2 },
    'D': { name: 'FIRE DRAGON', w: 34, h: 26, hp: 11, brain: 'dragon', color: '#ff6a00', artDy: 0, fly: true },
    'X': { name: 'SHADOW MASTER', w: 26, h: 30, hp: 13, brain: 'shadow', color: '#b98cff', artDy: 0 },
    '7': { name: 'STORM BIRD', w: 36, h: 26, hp: 13, brain: 'storm', color: '#bfe4ff', artDy: 0, fly: true },
    '8': { name: 'CRYSTAL QUEEN', w: 28, h: 30, hp: 14, brain: 'queen', color: '#ff8ad8', artDy: 6 },
    '9': { name: 'IRON TITAN', w: 32, h: 30, hp: 16, brain: 'titan', color: '#ffab3d', artDy: 8 }
  };

  /* Weapons you can pick up. They swap out your ninja star until the
     ammo runs out, then the ninja star comes back. */
  var WEAPONS = {
    'star':      { name: 'NINJA STAR', color: '#cfd8e8', dmg: 1, ammo: -1, cd: 16, rapidCd: 6, max: 3, life: 90, speed: 5.4 },
    'shotgun':   { name: 'SHOTGUN', color: '#d8a05a', dmg: 1, ammo: 14, cd: 26, max: 9, pellets: 3, life: 26, speed: 5.2 },
    'rocket':    { name: 'ROCKET', color: '#ff5a4a', dmg: 4, ammo: 6, cd: 44, max: 2, blast: 26, breaks: true, life: 130, speed: 2.9 },
    'flame':     { name: 'FLAME', color: '#ff9a2a', dmg: 1, ammo: 50, cd: 6, max: 24, pierce: true, life: 30, speed: 4.8 },
    'laser':     { name: 'LASER', color: '#6ff0ff', dmg: 2, ammo: 16, cd: 18, max: 4, pierce: true, breaks: true, life: 70, speed: 8.2 },
    'boomerang': { name: 'BOOMERANG', color: '#ffd93d', dmg: 2, ammo: 12, cd: 30, max: 1, life: 120, speed: 5.0, returns: true },
    'bombs':     { name: 'BOMBS', color: '#c8c8d4', dmg: 3, ammo: 10, cd: 34, max: 3, blast: 30, breaks: true, life: 110, speed: 3.6, arc: true }
  };
  /* The letter you write in levels.js for each weapon box. */
  var WEAPON_CHARS = { '1': 'shotgun', '2': 'rocket', '3': 'flame', '4': 'laser', '5': 'boomerang', '6': 'bombs' };

  var STAR_TIME = 8 * 60;
  var BOOT_TIME = 14 * 60;
  var RAPID_TIME = 14 * 60;
  var SPRING_V = -10.8;
  var CLIMB_SPEED = 1.5;
  var WALL_SLIDE_MAX = 1.5;

  /* What the game remembers on this device: how far you got, your best
     score, and which hidden gems you found. It is kept in the browser,
     so it is still there tomorrow. */
  /* V2 keeps its own save, so the old V1 game in /v1/ never loses your place. */
  var SAVE_KEY = 'ninjaMasterSaveV2';
  var progress = { max: 0, best: 0, gems: {} };

  function loadProgress() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        progress.max = Math.max(0, o.max | 0);
        progress.best = Math.max(0, o.best | 0);
        progress.gems = (o.gems && typeof o.gems === 'object') ? o.gems : {};
      }
    } catch (e) { /* a browser with no storage still plays fine */ }
    game.best = progress.best;
  }

  function saveProgress() {
    if (game.best > progress.best) { progress.best = game.best; }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 3, max: progress.max, best: progress.best, gems: progress.gems
      }));
    } catch (e) { /* ignore */ }
  }

  /* Gems are remembered for ever, one bit per gem, so finding one is
     never lost even if you die later in the level. */
  function gemsFound(levelIndex) {
    var s = progress.gems[levelIndex];
    return typeof s === 'number' ? s : 0;
  }
  function gemCount(levelIndex) {
    var s = gemsFound(levelIndex), n = 0;
    for (var i = 0; i < 3; i++) { if (s & (1 << i)) { n++; } }
    return n;
  }
  function markGem(levelIndex, slot) {
    var s = gemsFound(levelIndex);
    if (s & (1 << slot)) { return false; }
    progress.gems[levelIndex] = s | (1 << slot);
    saveProgress();
    return true;
  }
  function totalGems() {
    var n = 0;
    for (var i = 0; i < LEVELS.length; i++) { n += gemCount(i); }
    return n;
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
  var doors = {};      /* doors you have already opened, key is 'cx:cy' */
  var keys = [];       /* the keys lying in the level */
  var gems = [];       /* the three hidden gems */
  var weaponBoxes = [];/* weapon boxes you can pick up */
  var blasts = [];     /* the round bang from a rocket or a bomb */
  var spawn = { x: 40, y: 40 };
  var safeSpot = { x: 40, y: 40 };
  var cam = { x: 0, y: 0 };
  var backdrop = { stars: [], hillFar: [], hillNear: [] };

  /* What is picked on the menu screens. */
  var menu = { world: 0, level: 0, code: ['A', 'A', 'A', 'A'], slot: 0, msg: '', msgT: 0, from: 'title' };
  var menuHits = [];

  function isMenuMode() {
    return game.mode === 'title' || game.mode === 'worlds' || game.mode === 'levels' ||
           game.mode === 'code' || game.mode === 'worldclear';
  }

  /* A fake wall '%' is NOT solid. It only looks like rock.
     A door '+' is solid until you use a key on it. */
  function isSolid(ch) { return ch === '#' || ch === '=' || ch === 'T' || ch === '/' || ch === '+'; }

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

  /* ---- maze hints --------------------------------------------------------
     Maze levels are big and it is easy to get lost. We work out the way to
     the next thing you need, the key first and then the flag, and we draw a
     soft trail of arrows. The trail only shows the next few steps, so you
     still have to do the jumping and the fighting yourself. */
  var hint = { on: false, off: false, dist: null, need: '', dirty: false, t: 0 };
  var HDX = [1, -1, 0, 0];
  var HDY = [0, 0, 1, -1];

  /* A tile the arrow trail is allowed to go through. Walls, spikes, lava,
     a shut door and a secret wall all stop it. */
  function hintOpen(ch, haveKey) {
    if (ch === '#' || ch === '=' || ch === 'T' || ch === '/' || ch === '%') { return false; }
    if (ch === '+' && !haveKey) { return false; }
    if (ch === '^' || ch === '~') { return false; }
    return true;
  }

  /* True when you could stand here. The trail likes floors and ladders
     much more than open air, so it follows the ground you walk on. */
  function hintFooting(x, y) {
    if (level.grid[y][x] === '|') { return true; }
    if (y + 1 >= level.h) { return false; }
    return isSolid(level.grid[y + 1][x]);
  }

  function buildHint() {
    hint.on = false;
    hint.dist = null;
    hint.need = '';
    hint.dirty = false;
    if (!level || level.kind !== 'maze' || !player) { return; }

    var haveKey = player.hasKey > 0;
    var gx = -1, gy = -1, i;

    /* A locked door is on the way, so send them for the key first. */
    if (!haveKey) {
      for (i = 0; i < keys.length; i++) {
        if (!keys[i].taken) {
          gx = Math.floor(keys[i].x / TILE);
          gy = Math.floor(keys[i].y / TILE);
          hint.need = 'KEY';
          break;
        }
      }
    }
    if (gx < 0 && flag) {
      gx = flag.tx;
      gy = flag.ty;
      hint.need = 'FLAG';
    }
    if (gx < 0) { return; }

    var W = level.w, H = level.h;
    var dist = new Int32Array(W * H);
    for (i = 0; i < dist.length; i++) { dist[i] = -1; }

    var buckets = [];
    function drop(idx, d) {
      if (!buckets[d]) { buckets[d] = []; }
      buckets[d].push(idx);
    }

    var g0 = gy * W + gx;
    dist[g0] = 0;
    drop(g0, 0);

    for (var d = 0; d < buckets.length; d++) {
      var bag = buckets[d];
      if (!bag) { continue; }
      for (var bi = 0; bi < bag.length; bi++) {
        var idx = bag[bi];
        if (dist[idx] !== d) { continue; }
        var x = idx % W;
        var y = (idx - x) / W;
        for (var k = 0; k < 4; k++) {
          var nx = x + HDX[k], ny = y + HDY[k];
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) { continue; }
          if (!hintOpen(level.grid[ny][nx], haveKey)) { continue; }
          var nd = d + (hintFooting(nx, ny) ? 1 : 4);
          var ni = ny * W + nx;
          if (dist[ni] >= 0 && dist[ni] <= nd) { continue; }
          dist[ni] = nd;
          drop(ni, nd);
        }
      }
    }

    hint.dist = dist;
    hint.on = true;
  }

  /* Walk downhill from where you stand and hand back the next few steps. */
  function hintTrail() {
    var out = [];
    if (!hint.on || !hint.dist) { return out; }
    var W = level.w, H = level.h;
    var x = clamp(Math.floor((player.x + player.w / 2) / TILE), 0, W - 1);
    var y = clamp(Math.floor((player.y + player.h / 2) / TILE), 0, H - 1);
    var k, ax, ay, dv;

    /* If you are somewhere the map calls shut, such as inside a secret,
       borrow the best open tile close by. */
    if (hint.dist[y * W + x] < 0) {
      var best = -1, bx = -1, by = -1;
      for (var oy = -2; oy <= 2; oy++) {
        for (var ox = -2; ox <= 2; ox++) {
          ax = x + ox; ay = y + oy;
          if (ax < 0 || ay < 0 || ax >= W || ay >= H) { continue; }
          dv = hint.dist[ay * W + ax];
          if (dv < 0) { continue; }
          if (best < 0 || dv < best) { best = dv; bx = ax; by = ay; }
        }
      }
      if (best < 0) { return out; }
      x = bx; y = by;
    }

    for (var step = 0; step < 30; step++) {
      var cur = hint.dist[y * W + x];
      if (cur <= 0) { break; }
      var nx = -1, ny = -1, low = cur;
      for (k = 0; k < 4; k++) {
        ax = x + HDX[k]; ay = y + HDY[k];
        if (ax < 0 || ay < 0 || ax >= W || ay >= H) { continue; }
        dv = hint.dist[ay * W + ax];
        if (dv < 0 || dv >= low) { continue; }
        low = dv; nx = ax; ny = ay;
      }
      if (nx < 0) { break; }
      out.push({ x: x, y: y, dx: nx - x, dy: ny - y });
      x = nx; y = ny;
    }
    return out;
  }

  /* Little gold arrows floating along the way. They fade out the further
     ahead they are, so you only ever see the next bit of the route. */
  function drawHint() {
    if (!hint.on || hint.off) { return; }
    var trail = hintTrail();
    if (!trail.length) { return; }
    hint.t++;
    var gold = hint.need === 'KEY' ? '#ffd93d' : '#7ef0b0';
    var last = Math.min(trail.length, 15);
    for (var i = 1; i < last; i += 2) {
      var a = trail[i];
      var px = a.x * TILE + 8, py = a.y * TILE + 8;
      if (px - cam.x < -20 || px - cam.x > VIEW_W + 20) { continue; }
      if (py - cam.y < -20 || py - cam.y > VIEW_H + 20) { continue; }
      var fade = 0.95 - (i / 15) * 0.55;
      var bob = Math.sin((hint.t + i * 7) * 0.09) * 1.8;
      ctx.save();
      ctx.globalAlpha = Math.max(0.18, fade);
      ctx.translate(px, py + bob);
      ctx.rotate(Math.atan2(a.dy, a.dx));
      ctx.fillStyle = '#05060d';
      ctx.beginPath();
      ctx.moveTo(9, 0); ctx.lineTo(-5, -7); ctx.lineTo(-2, 0); ctx.lineTo(-5, 7);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.moveTo(6.8, 0); ctx.lineTo(-3.6, -5); ctx.lineTo(-1.2, 0); ctx.lineTo(-3.6, 5);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
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
      pal: PALETTES[def.boss ? info.bossPal : info.pal],
      kind: def.kind || 'run'
    };
    /* 'seen' remembers which fake walls you have already walked into,
       so a secret you found stays easy to see. */
    level.seen = [];
    for (var sr = 0; sr < level.h; sr++) {
      var row = [];
      for (var sc = 0; sc < level.w; sc++) { row.push(false); }
      level.seen.push(row);
    }

    enemies = [];
    coins = [];
    powerups = [];
    shurikens = [];
    bones = [];
    particles = [];
    toasts = [];
    springs = {};
    doors = {};
    keys = [];
    gems = [];
    weaponBoxes = [];
    blasts = [];
    flag = null;
    boss = null;
    bossDown = 0;
    var gemSlot = 0;

    for (var r = 0; r < level.h; r++) {
      for (var c = 0; c < level.w; c++) {
        var ch = level.grid[r][c];
        if (ch === 'P') {
          spawn = { x: c * TILE + 3, y: r * TILE + 1 };
          level.grid[r][c] = '.';
        } else if (ch === 'o') {
          coins.push({ x: c * TILE + 4, y: r * TILE + 4, w: 8, h: 8, taken: false, t: (c * 3 + r * 5) % 60 });
          level.grid[r][c] = '.';
        } else if (ch === 'k') {
          keys.push({ x: c * TILE + 3, y: r * TILE + 4, w: 10, h: 9, taken: false, t: (c * 5 + r * 3) % 60 });
          level.grid[r][c] = '.';
        } else if (ch === 'g') {
          gems.push({ slot: gemSlot++, x: c * TILE + 3, y: r * TILE + 3, w: 10, h: 11, taken: false, t: (c * 9 + r * 4) % 60 });
          level.grid[r][c] = '.';
        } else if (WEAPON_CHARS[ch]) {
          weaponBoxes.push({ kind: WEAPON_CHARS[ch], x: c * TILE + 1, y: r * TILE + 2, w: 14, h: 13, taken: false, t: (c * 6 + r * 8) % 60 });
          level.grid[r][c] = '.';
        } else if (POWERUPS[ch]) {
          /* No star on a boss level. With a star you just run at the boss
             and win, and that is no fun. */
          if (!(ch === '*' && level.boss)) {
            powerups.push({ kind: ch, x: c * TILE + 2, y: r * TILE + 2, w: 12, h: 12, taken: false, t: (c * 7 + r * 11) % 60 });
          }
          level.grid[r][c] = '.';
        } else if (ENEMY_TYPES[ch]) {
          enemies.push(makeEnemy(ch, c, r));
          level.grid[r][c] = '.';
        } else if (BOSS_TYPES[ch]) {
          boss = makeBoss(ch, c, r);
          enemies.push(boss);
          level.grid[r][c] = '.';
        } else if (ch === 'F') {
          flag = { x: c * TILE + 3, y: r * TILE - 32, w: 11, h: 48, tx: c, ty: r };
          level.grid[r][c] = '.';
        }
      }
    }

    buildBackdrop(index + 1);
    resetPlayer();
    buildHint();
    cam.x = clamp(player.x + player.w / 2 - VIEW_W / 2, 0, Math.max(0, level.pxW - VIEW_W));
    cam.y = clamp(player.y + player.h / 2 - VIEW_H / 2, 0, Math.max(0, level.pxH - VIEW_H));
  }

  function resetPlayer() {
    player = {
      x: spawn.x, y: spawn.y, w: 10, h: 15,
      vx: 0, vy: 0,
      onGround: false, facing: 1,
      jumpsLeft: 2, coyote: 0, invuln: 0,
      throwCd: 0, animT: 0, dying: false,
      starT: 0, bootT: 0, rapidT: 0,
      /* new in V2 */
      weapon: 'star', ammo: -1,
      hasKey: 0,
      onLadder: false, climbT: 0,
      wallDir: 0, wallSlide: 0, wallLock: 0, wallKickT: 0
    };
    safeSpot.x = spawn.x;
    safeSpot.y = spawn.y;
  }

  /* After losing a heart the ninja comes back at the last safe piece of
     ground, not at the very start of the level. Boots and rapid stars keep
     working. Star power stops, because you get flashing safe time instead. */
  /* Is this a spot the ninja can come back to? It must be clear of
     spikes and lava, and the tiles right beside it must be clear too,
     or the ninja lands and dies again straight away. */
  function spotIsSafe(x, y) {
    if (touchesHazard({ x: x, y: y, w: player.w, h: player.h })) { return false; }
    var cx = Math.floor((x + player.w / 2) / TILE);
    var cy = Math.floor((y + player.h - 2) / TILE);
    for (var dx = -1; dx <= 1; dx++) {
      for (var dy = -1; dy <= 1; dy++) {
        var ch = tileAt(cx + dx, cy + dy);
        if (ch === '^' || ch === '~') { return false; }
      }
    }
    return true;
  }

  function respawnAtSafeSpot() {
    if (!spotIsSafe(safeSpot.x, safeSpot.y)) { safeSpot.x = spawn.x; safeSpot.y = spawn.y; }
    player.x = safeSpot.x;
    player.y = safeSpot.y;
    player.vx = 0;
    player.vy = 0;
    player.jumpsLeft = maxJumps();
    player.coyote = 0;
    player.invuln = 90;
    player.starT = 0;
    player.dying = false;
    player.wallDir = 0;
    player.wallSlide = 0;
    player.wallLock = 0;
    player.onLadder = false;
    bones = [];
    shurikens = [];
    blasts = [];
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
      maxHp: t.hp,
      armour: t.armour || null,
      shield: !!t.shield,
      splits: !!t.splits,
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

  /* One button fires whatever weapon you hold. When the ammo runs out
     the ninja star comes back, and that one never runs out. */
  function doThrow() {
    var p = player;
    var wk = WEAPONS[p.weapon] ? p.weapon : 'star';
    var W = WEAPONS[wk];
    var rapid = p.rapidT > 0;
    var cd = (wk === 'star' && rapid) ? W.rapidCd : W.cd;
    var cap = (wk === 'star' && rapid) ? 6 : W.max;

    if (p.throwCd > 0) { return; }
    var mine = 0;
    for (var i = 0; i < shurikens.length; i++) { if (shurikens[i].wk === wk) { mine++; } }
    if (mine >= cap) { return; }

    p.throwCd = cd;
    var fx = p.x + (p.facing > 0 ? p.w - 2 : -2);
    var fy = p.y + 5;

    if (wk === 'shotgun') {
      for (var s = 0; s < W.pellets; s++) {
        shurikens.push(makeShot(wk, fx, fy + (s - 1) * 3, p.facing * W.speed, (s - 1) * 1.05));
      }
      game.shake = 4;
      Sound.star();
    } else if (wk === 'flame') {
      /* Fire comes out a bit higher than the other weapons, and it only
         spreads a little, so a shot on the ground does not hit the floor. */
      var spread = (Math.random() - 0.5) * 0.7;
      shurikens.push(makeShot(wk, fx, p.y + 2, p.facing * W.speed, spread));
      Sound.star();
    } else if (wk === 'bombs') {
      var b = makeShot(wk, fx, fy - 2, p.facing * W.speed, -3.4);
      b.arc = true;
      shurikens.push(b);
      Sound.star();
    } else if (wk === 'boomerang') {
      var bm = makeShot(wk, fx, fy, p.facing * W.speed, 0);
      bm.home = true;
      bm.turn = 34;
      shurikens.push(bm);
      Sound.star();
    } else {
      shurikens.push(makeShot(wk, fx, fy, p.facing * W.speed, 0));
      if (wk === 'rocket') { game.shake = 5; }
      Sound.star();
    }

    if (p.ammo > 0) {
      p.ammo--;
      if (p.ammo <= 0) {
        p.weapon = 'star';
        p.ammo = -1;
        toast('STAR AGAIN', '#cfd8e8');
      }
    }
  }

  function makeShot(wk, x, y, vx, vy) {
    var W = WEAPONS[wk];
    var size = wk === 'rocket' ? 8 : (wk === 'bombs' ? 7 : (wk === 'laser' ? 10 : (wk === 'flame' ? 9 : 6)));
    return {
      wk: wk, x: x, y: y, w: size, h: wk === 'laser' ? 4 : size,
      vx: vx, vy: vy || 0, rot: 0,
      life: W.life || 90,
      dmg: W.dmg, pierce: !!W.pierce, breaks: !!W.breaks,
      blast: W.blast || 0, arc: false, home: false,
      hitList: null
    };
  }

  /* The round bang from a rocket or a bomb. It hurts everything close by
     and it smashes cracked blocks. */
  function doBlast(x, y, radius, dmg) {
    blasts.push({ x: x, y: y, r: 4, max: radius, t: 0 });
    game.shake = Math.max(game.shake, 10);
    Sound.stomp();
    burst(x, y, '#ffb04a', 18, 4.2);
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.alive) { continue; }
      var dx = (e.x + e.w / 2) - x, dy = (e.y + e.h / 2) - y;
      if (dx * dx + dy * dy < radius * radius) { damageEnemy(e, dmg, 'blast'); }
    }
    /* Break every cracked block inside the bang. */
    var c0 = Math.floor((x - radius) / TILE), c1 = Math.floor((x + radius) / TILE);
    var r0 = Math.floor((y - radius) / TILE), r1 = Math.floor((y + radius) / TILE);
    for (var cy = r0; cy <= r1; cy++) {
      if (cy < 0 || cy >= level.h) { continue; }
      for (var cx = c0; cx <= c1; cx++) {
        if (cx < 0 || cx >= level.w) { continue; }
        if (level.grid[cy][cx] === '/') { breakBlock(cx, cy); }
      }
    }
    /* The bang pushes the ninja too, but it never hurts you. */
    var pdx = (player.x + 5) - x, pdy = (player.y + 7) - y;
    var d2 = pdx * pdx + pdy * pdy;
    if (d2 < radius * radius * 1.4 && d2 > 1) {
      var d = Math.sqrt(d2);
      player.vx += (pdx / d) * 2.6;
      player.vy = Math.min(player.vy, -3.2);
    }
  }

  function breakBlock(cx, cy) {
    level.grid[cy][cx] = '.';
    burst(cx * TILE + 8, cy * TILE + 8, level.pal.rockTop, 10, 3);
    Sound.bonk();
  }

  /* Picking up a weapon box. */
  function takeWeapon(kind) {
    var W = WEAPONS[kind];
    if (!W) { return; }
    player.weapon = kind;
    player.ammo = W.ammo;
    player.throwCd = 0;
    toast(W.name, W.color);
    Sound.power();
    game.score += 5;
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
    /* A big slime splits into two small fast ones. */
    if (e.splits) { splitSlime(e); }
  }

  function splitSlime(e) {
    for (var s = 0; s < 2; s++) {
      var t = SLIME_CHILD;
      var kid = {
        char: e.char, kind: t.kind, ai: t.ai,
        x: clamp(e.x + (s === 0 ? -6 : e.w + 6 - t.w), 0, level.pxW - t.w),
        y: e.y + e.h - t.h,
        w: t.w, h: t.h,
        dir: s === 0 ? -1 : 1,
        speed: t.speed, shot: null, range: 0, rate: 120,
        color: t.color,
        vx: 0, vy: -3.2,
        hp: t.hp, maxHp: t.hp,
        armour: null, shield: false, splits: false, child: true,
        alive: true, hurt: 0, cd: 20, animT: 0
      };
      kid.homeY = kid.y;
      kid.homeX = kid.x;
      enemies.push(kid);
    }
  }

  /* from: 'stomp' goes through armour, 'shot' does not.
     A shield stops shots that hit the face, but not ones from behind. */
  function damageEnemy(e, n, from) {
    if (e.kind !== 'boss' && n < 99) {
      if (e.armour === 'top' && from !== 'stomp' && from !== 'blast') {
        e.hurt = 6;
        burst(e.x + e.w / 2, e.y + e.h / 2, '#ffffff', 3, 1.6);
        Sound.bonk();
        return false;
      }
    }
    e.hp -= n;
    e.hurt = 12;
    if (e.hp <= 0) { killEnemy(e); return true; }
    burst(e.x + e.w / 2, e.y + 6, '#ffffff', 6, 2);
    Sound.bonk();
    return false;
  }

  /* A shot that hits the front of a shield bounces off.
     The Crystal Queen's magic shield blocks every side. */
  function shieldBlocks(e, fromX) {
    if (e.shieldT > 0) { return true; }
    if (!e.shield) { return false; }
    var face = e.dir >= 0 ? 1 : -1;
    var side = fromX > e.x + e.w / 2 ? 1 : -1;
    return face === side;
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
    escEdge = false;
    hintEdge = false;
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

    /* Press Escape, or tap MENU, to leave a level and pick a new one. */
    if (escEdge) {
      Sound.menu();
      menu.world = worldOf(game.level);
      menu.level = game.level - firstLevelOf(menu.world);
      goMode('levels');
      return;
    }

    /* Press H to turn the maze arrows off and on. */
    if (hintEdge && level.kind === 'maze') {
      hint.off = !hint.off;
      toast(hint.off ? 'ARROWS OFF' : 'ARROWS ON', '#7ef0b0');
    }

    updatePlayer();
    updateEnemies();
    updateShurikens();
    updateBlasts();
    updateBones();
    updateCoins();
    updatePowerups();
    updateKeysGemsWeapons();
    if (hint.dirty) { buildHint(); }
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

    updateCamera();
  }

  /* The camera follows you sideways all the time. Up and down it only
     moves when you leave a calm band in the middle of the screen, so a
     normal jump does not make the whole picture bounce. */
  function updateCamera() {
    var tx = clamp(player.x + player.w / 2 - VIEW_W / 2, 0, Math.max(0, level.pxW - VIEW_W));
    cam.x += (tx - cam.x) * 0.16;
    if (Math.abs(cam.x - tx) < 0.4) { cam.x = tx; }

    var maxY = Math.max(0, level.pxH - VIEW_H);
    if (maxY <= 0) { cam.y = 0; return; }

    var py = player.y + player.h / 2;
    var band = player.onGround ? 44 : 66;
    var mid = cam.y + VIEW_H / 2;
    var ty = cam.y;
    if (py < mid - band) { ty = py + band - VIEW_H / 2; }
    else if (py > mid + band) { ty = py - band - VIEW_H / 2; }
    ty = clamp(ty, 0, maxY);
    cam.y += (ty - cam.y) * (player.onGround ? 0.14 : 0.09);
    if (Math.abs(cam.y - ty) < 0.4) { cam.y = ty; }
    cam.y = clamp(cam.y, 0, maxY);
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

    /* --- LADDERS ------------------------------------------------- */
    var onLadderTile = tileHere(p, '|');
    if (onLadderTile && (input.up || input.down || p.onLadder)) {
      if (!p.onLadder && (input.up || input.down)) { p.onLadder = true; }
    }
    if (!onLadderTile) { p.onLadder = false; }
    if (p.onLadder) {
      p.climbT++;
      p.vy = ((input.down ? 1 : 0) - (input.up ? 1 : 0)) * CLIMB_SPEED;
      p.vx = dir * (RUN_SPEED * 0.55);
      if (dir !== 0) { p.facing = dir; }
      p.jumpsLeft = maxJumps();
      p.wallDir = 0;
      p.wallSlide = 0;
      if (throwEdge) { doThrow(); }
      p.x += p.vx;
      resolveX(p);
      p.y += p.vy;
      resolveY(p);
      p.x = clamp(p.x, 0, level.pxW - p.w);
      /* Stepping sideways off the ladder makes you fall like normal. */
      if (!tileHere(p, '|')) { p.onLadder = false; }
      afterPlayerMove();
      return;
    }

    if (p.wallLock > 0) { p.wallLock--; }
    if (p.wallKickT > 0) { p.wallKickT--; }

    if (dir !== 0 && p.wallLock <= 0) {
      p.vx += dir * ACCEL;
      p.vx = clamp(p.vx, -RUN_SPEED, RUN_SPEED);
      p.facing = dir;
    } else if (dir !== 0) {
      p.facing = dir;
    } else {
      if (Math.abs(p.vx) < FRICTION) { p.vx = 0; }
      else { p.vx -= Math.sign(p.vx) * FRICTION; }
    }

    /* --- WALL SLIDE ---------------------------------------------- */
    /* Push into a wall while you drop and the ninja grabs it and slides
       down slowly. Then you can jump off it. Do it again and again to
       climb a tall shaft. */
    p.wallDir = 0;
    if (!p.onGround && p.vy > 0 && dir !== 0 && wallBeside(p, dir)) {
      p.wallDir = dir;
      if (p.vy > WALL_SLIDE_MAX) { p.vy = WALL_SLIDE_MAX; }
      p.wallSlide++;
      p.jumpsLeft = Math.max(p.jumpsLeft, 1);
      if (game.frame % 6 === 0) {
        burst(p.x + (dir > 0 ? p.w : 0), p.y + 12, '#cfd8e8', 1, 1.2);
      }
    } else {
      p.wallSlide = 0;
    }

    if (jumpBuffer > 0 && p.wallDir !== 0 && !p.onGround) {
      jumpBuffer = 0;
      doWallJump(p.wallDir);
    } else if (jumpBuffer > 0 && (p.onGround || p.coyote > 0 || p.jumpsLeft > 0)) {
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
    afterPlayerMove();
  }

  /* Everything that happens once the ninja has moved. */
  function afterPlayerMove() {
    var p = player;
    if (p.onGround) { p.coyote = 6; p.jumpsLeft = maxJumps(); }
    else if (p.coyote > 0) { p.coyote--; }

    revealSecrets(p);
    tryOpenDoor(p);

    if (p.y > level.pxH + 8) { killPlayer(); return; }
    if (touchesHazard(p)) { killPlayer(); return; }

    if (p.onGround && p.invuln <= 0) {
      var safe = true;
      for (var s = 0; s < enemies.length; s++) {
        var en = enemies[s];
        if (!en.alive || en.ai === 'float') { continue; }
        if (Math.abs(en.x - p.x) < 30 + en.w && Math.abs(en.y - p.y) < 24 + en.h) { safe = false; break; }
      }
      if (safe && spotIsSafe(p.x, p.y)) { safeSpot.x = p.x; safeSpot.y = p.y; }
    }

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.alive || e.ghostT > 0) { continue; }
      if (!overlap(p, e)) { continue; }
      var headTop = e.y + (e.kind === 'boss' ? Math.round(e.h * 0.45) : Math.round(e.h * 0.55));
      if (p.vy > 0.8 && (p.y + p.h) < headTop) {
        /* Landing on a head always hurts, even through armour. */
        damageEnemy(e, e.kind === 'boss' ? 1 : stompDamage(e), 'stomp');
        p.vy = e.kind === 'boss' ? -6.6 : -5.6;
        if (e.kind === 'boss') { game.shake = 8; }
        p.jumpsLeft = Math.max(p.jumpsLeft, 1);
        Sound.stomp();
      } else if (p.starT > 0 && e.kind !== 'boss') {
        damageEnemy(e, 99);
        game.score += 3;
      } else if (p.starT > 0 && e.kind === 'boss') {
        if (e.hurt <= 0) { damageEnemy(e, 1); game.shake = 8; }
        p.vx = (p.x + 5 < e.x + e.w / 2 ? -1 : 1) * 3.4;
      } else {
        hurtPlayer(e.x + e.w / 2);
      }
    }
  }

  /* Big enemies take one hit from a stomp. Small ones take two, so a
     jump still feels strong. */
  function stompDamage(e) { return e.maxHp >= 4 ? 1 : 2; }

  /* True when any part of the ninja is inside a tile of this kind. */
  function tileHere(p, ch) {
    var x0 = Math.floor((p.x + 3) / TILE), x1 = Math.floor((p.x + p.w - 3) / TILE);
    var y0 = Math.floor((p.y + 2) / TILE), y1 = Math.floor((p.y + p.h - 2) / TILE);
    for (var cy = y0; cy <= y1; cy++) {
      for (var cx = x0; cx <= x1; cx++) {
        if (tileAt(cx, cy) === ch) { return true; }
      }
    }
    return false;
  }

  /* Is there a wall to grab on this side of the ninja? */
  function wallBeside(p, d) {
    var px = d > 0 ? p.x + p.w + 1 : p.x - 1;
    var cx = Math.floor(px / TILE);
    var c1 = Math.floor((p.y + 3) / TILE);
    var c2 = Math.floor((p.y + p.h - 3) / TILE);
    var a = tileAt(cx, c1), b = tileAt(cx, c2);
    /* Thin platforms are too small to hold on to. */
    return (a === '#' || a === '/' || a === '+') || (b === '#' || b === '/' || b === '+');
  }

  function doWallJump(wallDir) {
    var p = player;
    p.vy = JUMP_V * 0.97;
    p.vx = -wallDir * 3.0;
    p.facing = -wallDir;
    p.wallLock = 9;
    p.wallKickT = 12;
    p.wallSlide = 0;
    p.jumpsLeft = Math.max(0, maxJumps() - 1);
    p.onGround = false;
    p.coyote = 0;
    Sound.jump();
    burst(p.x + (wallDir > 0 ? p.w : 0), p.y + 10, '#8fa7ff', 6, 2.4);
  }

  /* Walking into a fake wall shows what is behind it. */
  function revealSecrets(p) {
    var x0 = Math.floor(p.x / TILE), x1 = Math.floor((p.x + p.w) / TILE);
    var y0 = Math.floor(p.y / TILE), y1 = Math.floor((p.y + p.h) / TILE);
    for (var cy = y0; cy <= y1; cy++) {
      if (cy < 0 || cy >= level.h) { continue; }
      for (var cx = x0; cx <= x1; cx++) {
        if (cx < 0 || cx >= level.w) { continue; }
        if (level.grid[cy][cx] === '%' && !level.seen[cy][cx]) {
          level.seen[cy][cx] = true;
          burst(cx * TILE + 8, cy * TILE + 8, '#ffd93d', 6, 2);
          if (!level.foundSecret) {
            level.foundSecret = true;
            toast('SECRET!', '#ffd93d');
            Sound.power();
            game.score += 10;
          }
        }
      }
    }
  }

  /* A key opens the door you touch. Each key opens one door. */
  function tryOpenDoor(p) {
    if (p.hasKey <= 0) { return; }
    var x0 = Math.floor((p.x - 1) / TILE), x1 = Math.floor((p.x + p.w + 1) / TILE);
    var y0 = Math.floor(p.y / TILE), y1 = Math.floor((p.y + p.h) / TILE);
    for (var cy = y0; cy <= y1; cy++) {
      if (cy < 0 || cy >= level.h) { continue; }
      for (var cx = x0; cx <= x1; cx++) {
        if (cx < 0 || cx >= level.w) { continue; }
        if (level.grid[cy][cx] !== '+') { continue; }
        /* Open the whole door, top to bottom. */
        var top = cy;
        while (top > 0 && level.grid[top - 1][cx] === '+') { top--; }
        var bot = cy;
        while (bot < level.h - 1 && level.grid[bot + 1][cx] === '+') { bot++; }
        for (var d = top; d <= bot; d++) {
          level.grid[d][cx] = '.';
          doors[cx + ':' + d] = true;
          burst(cx * TILE + 8, d * TILE + 8, '#ffd93d', 5, 2);
        }
        p.hasKey--;
        hint.dirty = true;
        toast('DOOR OPEN', '#ffd93d');
        Sound.power();
        game.shake = 4;
        return;
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

      if (e.ai === 'float') { updateFloater(e); enemyShoot(e); continue; }
      if (e.ai === 'fly') { updateFlyer(e); enemyShoot(e); continue; }
      if (e.ai === 'dive') { updateDiver(e); continue; }

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

  /* Harpies wait up high. When you walk under them they fold their wings
     and drop on you, then climb back up. */
  function updateDiver(e) {
    if (e.diveT === undefined) { e.diveT = 0; e.homeY = e.homeY || e.y; }
    var dx = (player.x + 5) - (e.x + e.w / 2);
    var dy = (player.y + 7) - (e.y + e.h / 2);

    if (e.diveT > 0) {
      e.diveT--;
      e.vy = 3.4;
      e.vx = clamp(dx * 0.05, -1.6, 1.6);
    } else if (e.cd <= 0 && Math.abs(dx) < 46 && dy > 10 && dy < 130) {
      e.diveT = 30;
      e.cd = 130;
      Sound.tone(300, 0.1, 'sawtooth', 0.05, 140);
    } else {
      /* Slide over the top of you and wait. */
      e.vx = clamp(dx * 0.02, -e.speed, e.speed);
      var want = e.homeY + Math.sin(e.animT * 0.04) * 8;
      e.vy = clamp(want - e.y, -1.3, 1.3);
    }
    e.dir = dx >= 0 ? 1 : -1;
    e.bumped = false;
    e.x += e.vx;
    resolveX(e);
    if (e.bumped) { e.vx = 0; }
    e.y += e.vy;
    resolveY(e);
    if (e.onGround && e.diveT > 0) { e.diveT = 0; e.cd = 90; }
    e.x = clamp(e.x, 0, level.pxW - e.w);
  }
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
    } else if (e.shot === 'bolt') {
      bones.push({ kind: 'bolt', x: e.x + e.w / 2 - 4, y: e.y + e.h / 2 - 2, w: 8, h: 5, vx: sd * 3.0, vy: 0, g: 0, rot: 0 });
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
    else if (e.brain === 'storm') { brainStorm(e); }
    else if (e.brain === 'queen') { brainQueen(e); }
    else if (e.brain === 'titan') { brainTitan(e); }
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

  /* World 6. The Storm Bird flies in big circles and drops feather
     blades. Every so often it dives across the room. */
  function brainStorm(e) {
    var rage = bossRage(e);
    var px = player.x + 5;
    var toward = px < (e.x + e.w / 2) ? -1 : 1;
    e.dir = toward;

    if (e.jumpCd <= 0) {
      e.jumpCd = rage ? 190 : 265;
      e.swoop = 62;
      Sound.roar();
    }

    var wantX, wantY;
    if (e.swoop > 0) {
      /* It sweeps past on one side, never right on your head. The dive
         comes down to your own height so your stars can hit it. */
      wantX = px - toward * 30;
      wantY = player.y - 2;
    } else {
      /* Circle above the ninja, not above the level. Two tiles up is
         inside jump range, so you can stomp it as well as shoot it. */
      wantX = px - toward * 80 + Math.sin(e.animT * 0.02) * 26;
      wantY = player.y - 46 + Math.sin(e.animT * 0.035) * 18;
    }
    wantY = clamp(wantY, 20, level.pxH - e.h - 24);

    e.vx += clamp((wantX - e.x) * 0.007, -0.20, 0.20);
    e.vx = clamp(e.vx * 0.94, -2.1, 2.1);
    e.vy += clamp((wantY - e.y) * 0.022, -0.32, 0.32);
    e.vy = clamp(e.vy * 0.9, -2.2, 2.2);
    if (e.hurt > 8) { e.vx *= 0.4; e.vy *= 0.4; }

    if (e.cd <= 0) {
      e.cd = rage ? 92 : 132;
      e.mouth = 22;
      /* Feathers fall straight down, so you can walk out of the way. */
      var n = rage ? 3 : 2;
      for (var i = 0; i < n; i++) {
        bones.push({ kind: 'feather', x: e.x + 6 + i * 11, y: e.y + e.h - 4, w: 6, h: 8,
          vx: (i - (n - 1) / 2) * 0.55, vy: 1.0, g: 0.055, rot: 0 });
      }
      Sound.star();
    }
  }

  /* World 7. The Crystal Queen walks slowly and puts up a shield. While
     the shield is up, shots bounce off, so jump on her head instead. */
  function brainQueen(e) {
    var rage = bossRage(e);
    if (e.shieldT === undefined) { e.shieldT = 0; }
    if (e.shieldT > 0) { e.shieldT--; }

    bossWalk(e, rage ? 0.85 : 0.55);

    if (e.warpCd <= 0) {
      e.warpCd = rage ? 250 : 330;
      e.shieldT = rage ? 130 : 100;
      burst(e.x + e.w / 2, e.y + e.h / 2, '#ff8ad8', 18, 3.4);
      Sound.warp();
      toastAt(e.x + e.w / 2, e.y - 6, 'SHIELD UP', '#ff8ad8');
    }

    if (e.cd <= 0) {
      e.cd = rage ? 88 : 128;
      e.mouth = 20;
      /* Crystal shards spray out in a fan. */
      var n = rage ? 4 : 3;
      for (var i = 0; i < n; i++) {
        bones.push({ kind: 'crystal', x: e.x + e.w / 2 - 4, y: e.y + 10, w: 7, h: 7,
          vx: e.dir * (1.8 + i * 0.55), vy: -2.4 + i * 0.6, g: 0.07, rot: 0 });
      }
      Sound.star();
    }
    if (e.jumpCd <= 0 && e.onGround) {
      e.jumpCd = rage ? 165 : 230;
      e.vy = -6.6;
      Sound.jump();
    }
  }

  /* World 8. The Iron Titan is big and slow. It stamps the ground to
     make a shock wave, and fires three bolts. It is the last boss. */
  function brainTitan(e) {
    var rage = bossRage(e);
    if (e.stampT === undefined) { e.stampT = 0; }
    if (e.stampT > 0) { e.stampT--; }

    bossWalk(e, rage ? 0.72 : 0.48);

    if (e.jumpCd <= 0 && e.onGround) {
      e.jumpCd = rage ? 170 : 240;
      e.vy = -7.4;
      e.stampT = 1;
      Sound.jump();
    }
    /* When it lands after a jump the floor shakes and rocks fly out. */
    if (e.stampT === 1 && e.onGround && e.vy >= 0 && e.jumpCd < (rage ? 150 : 220)) {
      e.stampT = 0;
      game.shake = 16;
      Sound.roar();
      for (var s = 0; s < 2; s++) {
        var sd = s === 0 ? -1 : 1;
        bones.push({ kind: 'rock', x: e.x + e.w / 2 - 4, y: e.y + e.h - 8, w: 8, h: 8,
          vx: sd * 2.5, vy: -2.2, g: 0.16, rot: 0 });
      }
      burst(e.x + e.w / 2, e.y + e.h, '#ffab3d', 20, 4);
    }

    if (e.cd <= 0) {
      e.cd = rage ? 96 : 140;
      e.mouth = 24;
      for (var i = 0; i < 3; i++) {
        bones.push({ kind: 'bolt', x: e.x + (e.dir > 0 ? e.w - 8 : 0), y: e.y + 8 + i * 7, w: 8, h: 5,
          vx: e.dir * (2.6 + i * 0.3), vy: 0, g: 0, rot: 0 });
      }
      Sound.star();
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
      s.life--;
      s.rot += 0.5;

      /* A bomb falls in an arc and bounces. */
      if (s.arc) {
        s.vy += GRAVITY * 0.62;
        if (s.vy > 6) { s.vy = 6; }
      }
      /* A boomerang flies out, stops, then comes back to you. */
      if (s.home) {
        s.turn--;
        /* Once it turns round it is a fresh pass, so it can hit again. */
        if (s.turn === 0) { s.hitList = null; }
        if (s.turn <= 0) {
          var tx = player.x + 5, ty = player.y + 7;
          var dx = tx - s.x, dy = ty - s.y;
          var d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          var sp = WEAPONS.boomerang.speed;
          s.vx += ((dx / d) * sp - s.vx) * 0.18;
          s.vy += ((dy / d) * sp - s.vy) * 0.18;
          if (d < 10) { shurikens.splice(i, 1); continue; }
        }
      }
      /* Flame slows down as it flies, and it floats up a little like real fire. */
      if (s.wk === 'flame') { s.vx *= 0.975; s.vy = s.vy * 0.975 - 0.02; }

      s.x += s.vx;
      s.y += s.vy;

      var cx = Math.floor((s.x + s.w / 2) / TILE);
      var cy = Math.floor((s.y + s.h / 2) / TILE);
      var tile = tileAt(cx, cy);
      var hitWall = isSolid(tile);

      if (hitWall && s.breaks && tile === '/') {
        breakBlock(cx, cy);
        hitWall = s.wk !== 'laser';
      }

      if (hitWall && s.arc) {
        /* Bombs bounce off the floor once or twice. */
        s.y -= s.vy;
        s.vy = -Math.abs(s.vy) * 0.42;
        s.vx *= 0.7;
        if (Math.abs(s.vy) < 1.2) { s.vy = 0; s.vx *= 0.5; }
        hitWall = false;
        if (s.life > 40) { s.life = 40; }
      }

      var gone = s.life <= 0 || hitWall || s.x < -30 || s.x > level.pxW + 30 ||
                 s.y < -40 || s.y > level.pxH + 40;

      if (gone) {
        if (s.blast > 0) { doBlast(s.x + s.w / 2, s.y + s.h / 2, s.blast, s.dmg); }
        else { burst(s.x + s.w / 2, s.y + s.h / 2, WEAPONS[s.wk] ? WEAPONS[s.wk].color : '#cfd8e8', 4, 1.6); }
        shurikens.splice(i, 1);
        continue;
      }

      var died = false;
      for (var j = 0; j < enemies.length; j++) {
        var e = enemies[j];
        if (!e.alive || e.ghostT > 0 || !overlap(s, e)) { continue; }
        /* A laser or flame goes through. A boomerang comes back. Either way
           it only hurts the same enemy once on each pass. */
        if (s.pierce || s.home) {
          if (!s.hitList) { s.hitList = []; }
          if (s.hitList.indexOf(e) >= 0) { continue; }
          s.hitList.push(e);
        }
        if (shieldBlocks(e, s.x + s.w / 2)) {
          burst(s.x + s.w / 2, s.y + s.h / 2, '#cfe6ff', 5, 2);
          Sound.bonk();
          if (s.home) { if (s.turn > 4) { s.turn = 4; } continue; }
          if (!s.pierce) { died = true; break; }
          continue;
        }
        if (s.blast > 0) {
          doBlast(s.x + s.w / 2, s.y + s.h / 2, s.blast, s.dmg);
          died = true;
          break;
        }
        damageEnemy(e, s.dmg, 'shot');
        if (s.pierce) { continue; }
        if (s.home) {
          /* A boomerang keeps flying and comes back. */
          if (s.turn > 4) { s.turn = 4; }
        } else {
          died = true;
        }
        break;
      }
      if (died) { shurikens.splice(i, 1); continue; }
    }
  }

  function updateBlasts() {
    for (var i = blasts.length - 1; i >= 0; i--) {
      var b = blasts[i];
      b.t++;
      b.r += (b.max - b.r) * 0.34;
      if (b.t > 14) { blasts.splice(i, 1); }
    }
  }

  function updateKeysGemsWeapons() {
    var i, it;
    for (i = 0; i < keys.length; i++) {
      it = keys[i];
      if (it.taken) { continue; }
      it.t++;
      if (overlap(it, player) && !player.dying) {
        it.taken = true;
        player.hasKey++;
        hint.dirty = true;
        toast('KEY', '#ffd93d');
        Sound.power();
        game.score += 5;
      }
    }
    for (i = 0; i < gems.length; i++) {
      it = gems[i];
      if (it.taken) { continue; }
      it.t++;
      if (overlap(it, player) && !player.dying) {
        it.taken = true;
        var isNew = markGem(game.level, it.slot);
        game.score += isNew ? 50 : 10;
        toast(isNew ? 'GEM ' + gemCount(game.level) + '/3' : 'GEM AGAIN', '#7ad8c8');
        Sound.power();
        burst(it.x + 5, it.y + 5, '#7ad8c8', 16, 3.4);
      }
    }
    for (i = 0; i < weaponBoxes.length; i++) {
      it = weaponBoxes[i];
      if (it.taken) { continue; }
      it.t++;
      if (overlap(it, player) && !player.dying) {
        it.taken = true;
        takeWeapon(it.kind);
        burst(it.x + 7, it.y + 6, WEAPONS[it.kind].color, 12, 3);
      }
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
    var r0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
    var r1 = Math.min(level.h - 1, Math.floor((cam.y + VIEW_H) / TILE) + 1);
    for (var cy = r0; cy <= r1; cy++) {
      for (var cx = c0; cx <= c1; cx++) {
        var ch = level.grid[cy][cx];
        if (ch === '.') { continue; }
        var x = cx * TILE, y = cy * TILE;
        if (ch === '#' || ch === '%') {
          /* A fake wall looks exactly the same as rock. You walk through it. */
          ctx.fillStyle = pal.rock;
          ctx.fillRect(x, y, TILE, TILE);
          if (!isSolid(tileAt(cx, cy - 1)) && tileAt(cx, cy - 1) !== '%') {
            ctx.fillStyle = pal.rockTop;
            ctx.fillRect(x, y, TILE, 4);
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fillRect(x, y, TILE, 1);
          }
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.fillRect(x, y + TILE - 2, TILE, 2);
          ctx.fillRect(x + TILE - 1, y, 1, TILE);
          if (ch === '%' && level.seen[cy][cx]) {
            /* Once you have been inside it, a soft sparkle shows the way. */
            ctx.fillStyle = 'rgba(255,217,61,0.30)';
            ctx.fillRect(x, y, TILE, TILE);
          }
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
        } else if (ch === '|') {
          /* A ladder. Hold up or down to climb it. */
          ctx.fillStyle = '#05060d';
          ctx.fillRect(x + 3, y, 3, TILE);
          ctx.fillRect(x + 10, y, 3, TILE);
          ctx.fillStyle = '#a9793f';
          ctx.fillRect(x + 3, y, 2, TILE);
          ctx.fillRect(x + 10, y, 2, TILE);
          ctx.fillStyle = '#d6a45e';
          ctx.fillRect(x + 3, y, 1, TILE);
          ctx.fillRect(x + 10, y, 1, TILE);
          ctx.fillStyle = '#c39150';
          ctx.fillRect(x + 4, y + 3, 8, 2);
          ctx.fillRect(x + 4, y + 11, 8, 2);
        } else if (ch === '/') {
          /* A cracked block. Only a big weapon can smash it. */
          ctx.fillStyle = pal.rock;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = 'rgba(255,255,255,0.10)';
          ctx.fillRect(x, y, TILE, 2);
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.fillRect(x + 7, y + 1, 2, 5);
          ctx.fillRect(x + 4, y + 6, 2, 4);
          ctx.fillRect(x + 10, y + 6, 2, 4);
          ctx.fillRect(x + 6, y + 10, 2, 5);
          ctx.fillStyle = 'rgba(255,255,255,0.16)';
          ctx.fillRect(x + 1, y + 1, 2, 2);
          ctx.fillRect(x + 12, y + 12, 2, 2);
        } else if (ch === '+') {
          /* A locked door. Find the key in the same level. */
          var open = doors[cx + ':' + cy];
          ctx.fillStyle = '#05060d';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = open ? '#4a3a24' : '#7a5a2c';
          ctx.fillRect(x + 1, y, TILE - 2, TILE);
          ctx.fillStyle = open ? '#5e4a30' : '#a8802e';
          ctx.fillRect(x + 1, y, TILE - 2, 2);
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(x + 7, y, 2, TILE);
          if (!open) {
            ctx.fillStyle = '#ffd93d';
            ctx.fillRect(x + 4, y + 6, 8, 6);
            ctx.fillStyle = '#7a5a10';
            ctx.fillRect(x + 7, y + 8, 2, 3);
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
      var W = WEAPONS[s.wk] || WEAPONS.star;
      ctx.save();
      ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
      if (s.wk === 'shotgun') {
        ctx.fillStyle = '#05060d';
        ctx.fillRect(-3, -2, 6, 4);
        ctx.fillStyle = '#ffd08a';
        ctx.fillRect(-2, -1, 4, 2);
      } else if (s.wk === 'rocket') {
        if (s.vx < 0) { ctx.scale(-1, 1); }
        ctx.fillStyle = '#ff9a3c';
        ctx.fillRect(-8, -1, 5, 2);
        ctx.fillStyle = '#ffe08a';
        ctx.fillRect(-6, -1, 3, 2);
        ctx.fillStyle = '#05060d';
        ctx.fillRect(-4, -4, 9, 8);
        ctx.fillStyle = '#d0d6e2';
        ctx.fillRect(-3, -3, 6, 6);
        ctx.fillStyle = '#ff5a4a';
        ctx.fillRect(2, -3, 3, 6);
        ctx.fillRect(-4, -4, 2, 2);
        ctx.fillRect(-4, 2, 2, 2);
      } else if (s.wk === 'flame') {
        /* Fire grows into a big ball as it flies, then fades away. */
        var age = clamp(1 - s.life / WEAPONS.flame.life, 0, 1);
        var f = 0.55 + age * 1.35;
        ctx.globalAlpha = 1 - age * 0.72;
        ctx.fillStyle = '#ff5a1a';
        ctx.beginPath(); ctx.arc(0, 0, 5 * f + 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffa42a';
        ctx.beginPath(); ctx.arc(0, 0, 3.4 * f + 1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff0a8';
        ctx.beginPath(); ctx.arc(0, 0, 1.6 * f + 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (s.wk === 'laser') {
        if (s.vx < 0) { ctx.scale(-1, 1); }
        ctx.fillStyle = 'rgba(111,240,255,0.35)';
        ctx.fillRect(-14, -3, 22, 6);
        ctx.fillStyle = '#6ff0ff';
        ctx.fillRect(-8, -2, 16, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -1, 14, 2);
      } else if (s.wk === 'boomerang') {
        ctx.rotate(s.rot * 1.9);
        ctx.fillStyle = '#05060d';
        ctx.fillRect(-5, -5, 10, 4);
        ctx.fillRect(-5, -5, 4, 10);
        ctx.fillStyle = '#ffd93d';
        ctx.fillRect(-4, -4, 8, 2);
        ctx.fillRect(-4, -4, 2, 8);
        ctx.fillStyle = '#fff3b0';
        ctx.fillRect(-4, -4, 6, 1);
      } else if (s.wk === 'bombs') {
        ctx.rotate(s.rot);
        ctx.fillStyle = '#05060d';
        ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3a3f4c';
        ctx.beginPath(); ctx.arc(0, 0, 3.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6a7182';
        ctx.beginPath(); ctx.arc(-1.2, -1.2, 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = (game.frame % 8 < 4) ? '#ffd93d' : '#ff5a4a';
        ctx.fillRect(-1, -7, 2, 3);
      } else {
        ctx.rotate(s.rot);
        ctx.fillStyle = '#dfe7f2';
        ctx.fillRect(-4, -1, 8, 2);
        ctx.fillRect(-1, -4, 2, 8);
        ctx.fillStyle = '#8fa0b8';
        ctx.fillRect(-1, -1, 2, 2);
      }
      ctx.restore();
      if (W.color && s.wk === 'rocket' && game.frame % 2 === 0) {
        burst(s.x + s.w / 2 - Math.sign(s.vx) * 5, s.y + s.h / 2, '#ff9a3c', 1, 0.9);
      }
    }
  }

  function drawBlasts() {
    for (var i = 0; i < blasts.length; i++) {
      var b = blasts[i];
      var a = clamp(1 - b.t / 14, 0, 1);
      ctx.globalAlpha = a * 0.85;
      ctx.fillStyle = '#ffd07a';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ff8a2a';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.66, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff3c8';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawKeysGemsWeapons() {
    var i, it, bob;
    for (i = 0; i < keys.length; i++) {
      it = keys[i];
      if (it.taken) { continue; }
      bob = Math.sin(it.t * 0.09) * 2;
      var kx = it.x, ky = it.y + bob;
      ctx.fillStyle = '#05060d';
      ctx.fillRect(kx - 1, ky - 1, 12, 11);
      ctx.fillStyle = '#ffd93d';
      ctx.beginPath(); ctx.arc(kx + 3, ky + 4, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#05060d';
      ctx.beginPath(); ctx.arc(kx + 3, ky + 4, 1.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd93d';
      ctx.fillRect(kx + 6, ky + 3, 5, 2);
      ctx.fillRect(kx + 9, ky + 5, 2, 2);
      ctx.fillStyle = '#fff3b0';
      ctx.fillRect(kx + 1, ky + 1, 2, 1);
    }
    for (i = 0; i < gems.length; i++) {
      it = gems[i];
      if (it.taken) { continue; }
      bob = Math.sin(it.t * 0.07) * 2;
      var gx = it.x + 5, gy = it.y + 5 + bob;
      var sh = 1 + Math.abs(Math.sin(it.t * 0.05)) * 0.25;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.fillStyle = 'rgba(122,216,200,0.25)';
      ctx.beginPath(); ctx.arc(0, 0, 9 * sh, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#05060d';
      ctx.beginPath();
      ctx.moveTo(0, -7); ctx.lineTo(6, -1); ctx.lineTo(0, 7); ctx.lineTo(-6, -1);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7ad8c8';
      ctx.beginPath();
      ctx.moveTo(0, -5.5); ctx.lineTo(4.6, -1); ctx.lineTo(0, 5.5); ctx.lineTo(-4.6, -1);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d6fff4';
      ctx.beginPath();
      ctx.moveTo(0, -5.5); ctx.lineTo(2.4, -1.4); ctx.lineTo(0, 1); ctx.lineTo(-2.4, -1.4);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    for (i = 0; i < weaponBoxes.length; i++) {
      it = weaponBoxes[i];
      if (it.taken) { continue; }
      bob = Math.sin(it.t * 0.08) * 2;
      drawWeaponBox(it.x, it.y + bob, it.kind, true);
    }
  }

  /* The box you run into to get a new weapon. */
  function drawWeaponBox(x, y, kind, glow) {
    var W = WEAPONS[kind];
    if (glow) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x - 2, y - 2, 18, 17);
    }
    ctx.fillStyle = '#05060d';
    ctx.fillRect(x - 1, y - 1, 16, 15);
    ctx.fillStyle = '#5a4632';
    ctx.fillRect(x, y, 14, 13);
    ctx.fillStyle = '#7d6244';
    ctx.fillRect(x, y, 14, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x, y + 11, 14, 2);
    ctx.save();
    ctx.translate(x + 7, y + 7);
    drawWeaponIcon(ctx, kind, -6, -6);
    ctx.restore();
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
      } else if (k === 'bolt') {
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.fillStyle = 'rgba(143,227,255,0.35)';
        ctx.fillRect(-7, -3, 14, 6);
        ctx.fillStyle = '#8fe3ff';
        ctx.fillRect(-4, -2, 9, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -1, 6, 2);
      } else if (k === 'feather') {
        ctx.rotate(Math.sin(b.rot + game.frame * 0.09) * 0.5);
        ctx.fillStyle = '#05060d';
        ctx.beginPath();
        ctx.moveTo(0, -5); ctx.lineTo(3, 2); ctx.lineTo(0, 5); ctx.lineTo(-3, 2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#dff0ff';
        ctx.beginPath();
        ctx.moveTo(0, -4); ctx.lineTo(2, 1.6); ctx.lineTo(0, 4); ctx.lineTo(-2, 1.6);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8fb8d8';
        ctx.fillRect(-0.5, -3, 1, 7);
      } else if (k === 'crystal') {
        ctx.rotate(b.rot + game.frame * 0.07);
        ctx.fillStyle = '#05060d';
        ctx.beginPath();
        ctx.moveTo(0, -5); ctx.lineTo(4, 0); ctx.lineTo(0, 5); ctx.lineTo(-4, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ff8ad8';
        ctx.beginPath();
        ctx.moveTo(0, -3.8); ctx.lineTo(3, 0); ctx.lineTo(0, 3.8); ctx.lineTo(-3, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffd6f2';
        ctx.fillRect(-1, -2.4, 1.6, 2.4);
      } else if (k === 'rock') {
        ctx.rotate(b.rot + game.frame * 0.1);
        ctx.fillStyle = '#05060d';
        ctx.fillRect(-4, -4, 9, 9);
        ctx.fillStyle = '#7b6a58';
        ctx.fillRect(-3, -3, 7, 7);
        ctx.fillStyle = '#a08d76';
        ctx.fillRect(-3, -3, 4, 3);
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

    drawWeaponHUD();
    drawGemHUD();
    drawBossBar();
  }

  /* Bottom left: the weapon you hold and how many shots are left. */
  function drawWeaponHUD() {
    var wk = WEAPONS[player.weapon] ? player.weapon : 'star';
    var W = WEAPONS[wk];
    var y = VIEW_H - 18;
    ctx.fillStyle = 'rgba(4,6,14,0.55)';
    ctx.fillRect(4, y - 8, wk === 'star' ? 66 : 84, 18);
    ctx.save();
    ctx.translate(13, y + 1);
    drawWeaponIcon(ctx, wk, -6, -6);
    ctx.restore();
    text(W.name, 23, y + 4, 9, W.color, 'left');
    if (player.ammo >= 0) {
      text('x' + player.ammo, 23 + W.name.length * 5.6 + 4, y + 4, 9,
        player.ammo <= 3 ? '#ff6b6b' : '#ffffff', 'left');
    }
    if (player.hasKey > 0) {
      var kx = 4 + (wk === 'star' ? 70 : 88);
      ctx.fillStyle = '#ffd93d';
      ctx.beginPath(); ctx.arc(kx + 4, y + 1, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#05060d';
      ctx.beginPath(); ctx.arc(kx + 4, y + 1, 1.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd93d';
      ctx.fillRect(kx + 7, y, 5, 2);
      ctx.fillRect(kx + 10, y + 2, 2, 2);
      if (player.hasKey > 1) { text('x' + player.hasKey, kx + 15, y + 4, 9, '#ffd93d', 'left'); }
    }
  }

  /* Top right under the hearts: how many of the three gems you have. */
  function drawGemHUD() {
    if (!gems.length) { return; }
    var got = 0;
    for (var i = 0; i < gems.length; i++) { if (gems[i].taken) { got++; } }
    var bx = VIEW_W - 10;
    for (var g = gems.length - 1; g >= 0; g--) {
      var on = g < got;
      ctx.save();
      ctx.translate(bx - 5, 30);
      ctx.globalAlpha = on ? 1 : 0.3;
      ctx.fillStyle = '#05060d';
      ctx.beginPath();
      ctx.moveTo(0, -5); ctx.lineTo(4, -0.5); ctx.lineTo(0, 5); ctx.lineTo(-4, -0.5);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = on ? '#7ad8c8' : '#31404a';
      ctx.beginPath();
      ctx.moveTo(0, -3.8); ctx.lineTo(3, -0.5); ctx.lineTo(0, 3.8); ctx.lineTo(-3, -0.5);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
      bx -= 12;
    }
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

    text('KEYBOARD', VIEW_W / 2, 162, 11, '#ffd93d');
    text('ARROWS or A D to move    SPACE to jump', VIEW_W / 2, 176, 10, 'rgba(255,255,255,0.85)');
    text('X to shoot.  Jump at a wall to wall jump.', VIEW_W / 2, 188, 10, 'rgba(255,255,255,0.85)');
    text('PHONE or TABLET:  use the round buttons', VIEW_W / 2, 204, 10, 'rgba(255,255,255,0.85)');
    text('8 worlds.  48 levels.  8 bosses.', VIEW_W / 2, 220, 10, '#ffd93d');
    text('Find 3 gems hidden in every level.', VIEW_W / 2, 232, 10, '#7ad8c8');

    if (Math.floor(game.frame / 30) % 2 === 0) {
      text('PRESS SPACE  or  TAP TO START', VIEW_W / 2, 252, 13, '#ffffff');
    }
    if (game.best > 0) {
      text('BEST: ' + game.best, VIEW_W - 8, 265, 9, 'rgba(255,255,255,0.6)', 'right');
    }
    var tg = totalGems();
    if (tg > 0) {
      text('GEMS: ' + tg + '/' + (LEVELS.length * 3), 8, 265, 9, 'rgba(122,216,200,0.8)', 'left');
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
    var cols = 4, rows = Math.ceil(WORLDS.length / cols);
    var bw = 88, bh = 68, gap = 6;
    var x0 = Math.round((VIEW_W - (cols * bw + (cols - 1) * gap)) / 2), y0 = 54;

    for (var i = 0; i < WORLDS.length; i++) {
      var wd = WORLDS[i];
      var col = i % cols, row = Math.floor(i / cols);
      var x = x0 + col * (bw + gap);
      var y = y0 + row * (bh + gap);
      var open = worldUnlocked(i);
      var on = menu.world === i;
      box(x, y, bw, bh, on, !open, wd.tint);
      hit(x, y, bw, bh, 'world', i);

      if (!open) {
        drawLock(x + bw / 2 - 5, y + 18);
        text('LOCKED', x + bw / 2, y + 42, 9, 'rgba(255,255,255,0.45)');
      } else {
        var done = levelsDoneIn(i);
        text(String(i + 1), x + 14, y + 26, 17, wd.tint);
        for (var k = 0; k < LEVELS_PER_WORLD; k++) {
          ctx.fillStyle = k < done ? '#7fd05f' : 'rgba(255,255,255,0.2)';
          ctx.fillRect(x + 26 + k * 10, y + 16, 7, 5);
        }
        text(done + '/' + LEVELS_PER_WORLD, x + 48, y + 30, 9, 'rgba(255,255,255,0.7)');
        var wg = worldGems(i);
        if (wg > 0) {
          text(wg + ' GEMS', x + bw / 2, y + 42, 8, 'rgba(122,216,200,0.9)');
        }
      }
      var nm = wd.name.split(' ');
      text(nm[0] + ' ' + (nm[1] || ''), x + bw / 2, y + 58, 9, open ? '#ffffff' : 'rgba(255,255,255,0.4)');
    }

    var cy2 = y0 + rows * (bh + gap) + 4;
    var cx = VIEW_W / 2 - 55;
    box(cx, cy2, 110, 20, false, false, '#b98cff');
    hit(cx, cy2, 110, 20, 'code', 0);
    text('I HAVE A CODE', VIEW_W / 2, cy2 + 14, 11, '#ffffff');

    text('ARROWS to pick.  SPACE to go in.  Or tap.', VIEW_W / 2, cy2 + 34, 9, 'rgba(255,255,255,0.75)');
    backBox();
    menuFoot('', 'BEST ' + game.best);
  }

  function worldGems(w) {
    var n = 0, a = firstLevelOf(w);
    for (var i = a; i < a + LEVELS_PER_WORLD && i < LEVELS.length; i++) { n += gemCount(i); }
    return n;
  }

  function drawLevelSelect() {
    var wd = WORLDS[menu.world];
    menuTop(wd.name, 'world ' + (menu.world + 1) + ' of ' + WORLDS.length);
    menuHits = [];
    var cols = 3, rows = Math.ceil(LEVELS_PER_WORLD / cols);
    var bw = 90, bh = 66, gap = 8;
    var x0 = Math.round((VIEW_W - (cols * bw + (cols - 1) * gap)) / 2), y0 = 56;

    for (var i = 0; i < LEVELS_PER_WORLD; i++) {
      var idx = firstLevelOf(menu.world) + i;
      var def = LEVELS[idx];
      var open = levelUnlocked(idx);
      var on = menu.level === i;
      var col = i % cols, row = Math.floor(i / cols);
      var x = x0 + col * (bw + gap);
      var y = y0 + row * (bh + gap);
      box(x, y, bw, bh, on, !open, wd.tint);
      hit(x, y, bw, bh, 'level', i);

      if (!open) {
        drawLock(x + bw / 2 - 5, y + 22);
      } else if (def && def.boss) {
        text('BOSS', x + bw / 2, y + 22, 12, '#ff6b6b');
        text(String(i + 1), x + bw / 2, y + 40, 15, '#ffffff');
      } else {
        text(String(i + 1), x + bw / 2, y + 32, 22, '#ffffff');
        if (def && def.kind === 'maze') {
          text('MAZE', x + bw / 2, y + 43, 8, '#b98cff');
        }
      }
      if (open && idx < progress.max) {
        ctx.fillStyle = '#7fd05f';
        ctx.fillRect(x + bw - 12, y + 6, 6, 6);
      }
      if (open) {
        /* Three little gems show what you still have to find. */
        var got = gemCount(idx);
        for (var g = 0; g < 3; g++) {
          var gx = x + 8 + g * 9, gy = y + 10;
          ctx.fillStyle = g < got ? '#7ad8c8' : 'rgba(255,255,255,0.18)';
          ctx.beginPath();
          ctx.moveTo(gx, gy - 4); ctx.lineTo(gx + 3, gy); ctx.lineTo(gx, gy + 4); ctx.lineTo(gx - 3, gy);
          ctx.closePath(); ctx.fill();
        }
      }
      text(def ? def.name : '?', x + bw / 2, y + 58, 8, open ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)');
    }

    var fy = y0 + rows * (bh + gap) + 6;
    text('ARROWS to pick.  SPACE to play.  Or tap.', VIEW_W / 2, fy, 9, 'rgba(255,255,255,0.75)');
    text('CODE FOR THIS WORLD:  ' + wd.code, VIEW_W / 2, fy + 16, 11, wd.tint);
    text('Type it in on the code screen on any device.', VIEW_W / 2, fy + 28, 9, 'rgba(255,255,255,0.6)');
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

  /* ============================================================
     NINJA MASTER - SPRITE PACK 2
     Paste straight into the game IIFE. Plain ES5, uses var only.
     Assumes drawSprite(parts), ctx and clamp(v,a,b) already exist.

     ENEMIES  (all sit inside their own box, so artDy = 0)
       drawHarpy(e)         Harpy         box 18 x 16   artDy 0   Sky Temple
       drawCloudGolem(e)    Cloud Golem   box 20 x 22   artDy 0   Sky Temple
       drawSlime(e)         Slime         box 16 x 14   artDy 0   Deep Cave
       drawCrystalCrab(e)   Crystal Crab  box 20 x 14   artDy 0   Deep Cave
       drawDrone(e)         Drone         box 16 x 14   artDy 0   Iron Works
       drawSentry(e)        Sentry        box 18 x 20   artDy 0   Iron Works

     BOSSES   (box height is capped at 30 by the tile layout)
       drawStormBird(e)     Storm Bird    box 36 x 26   artDy 0   Sky Temple
                            flies, so no feet. Art bleeds a little
                            above the box on the wing up-beat, which is
                            what you want for a flier.
       drawCrystalQueen(e)  Crystal Queen box 28 x 30   artDy 6   Deep Cave
                            art is 36 tall, feet land on the box bottom.
       drawIronTitan(e)     Iron Titan    box 32 x 30   artDy 8   Iron Works
                            art is 38 tall, feet land on the box bottom.

     Suggested BOSS_TYPES rows (letters are a suggestion only):
       B: { name:'Storm Bird',    w:36, h:26, artDy:0, fly:true  }
       P: { name:'Crystal Queen', w:28, h:30, artDy:6 }
       R: { name:'Iron Titan',    w:32, h:30, artDy:8 }

     OTHER
       drawWeaponIcon(c, kind, x, y)          12 x 12 pickup / HUD icon
       drawDoorTile(c, x, y, TILE, pal, open)
       drawLadderTile(c, x, y, TILE, pal)
       drawBreakableTile(c, x, y, TILE, pal)
       drawGemPickup(c, x, y, t)              12 x 12
       drawKeyPickup(c, x, y, t)              12 x 12

     NAME CLASH TO SORT OUT WHEN YOU PASTE THIS IN
       game.js already has an older drawWeaponIcon(kind, color) that draws
       around 0,0 on an already-translated ctx. Delete that one and keep
       this one, then change its two call sites to pass a context and a
       top-left corner instead:
         drawWeaponIcon(kind, W.color)  ->  drawWeaponIcon(ctx, kind, x, y)
       (they are around lines 2990 and 3302). Every other function name
       here is new and does not clash.
     ============================================================ */

  /* Same outline + fill pass as drawSprite, but on a context you pass in.
     Lets the icons and pickups share the house look. */
  function drawSpriteOn(c, parts) {
    var i, p;
    c.fillStyle = '#05060d';
    for (i = 0; i < parts.length; i++) {
      p = parts[i];
      c.fillRect(p[0] - 1, p[1] - 1, p[2] + 2, p[3] + 2);
    }
    for (i = 0; i < parts.length; i++) {
      p = parts[i];
      c.fillStyle = p[4];
      c.fillRect(p[0], p[1], p[2], p[3]);
    }
  }

  /* ---------------------------------------------------------- HARPY
     18 x 16, artDy 0. Bird woman. Wings are the silhouette: three
     stepped feather bars a side that sweep out and up as she flaps.
     Front view with a centred hooked beak, so facing is shown by the
     pupils rather than by flipping the whole bird. */
  function drawHarpy(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir < 0 ? -1 : 1;
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var flap = Math.round(Math.sin(e.animT * 0.22) * 3);
    var bob = Math.round(Math.sin(e.animT * 0.22 + 1.6));
    var px = f > 0 ? 1 : 0;

    var wing = flash ? '#ffffff' : '#dbe6ff';
    var vane = flash ? '#ffffff' : '#8fa6cc';
    var gold = flash ? '#ffffff' : '#ffd24a';
    var gld2 = flash ? '#e8ecf5' : '#c98a17';
    var skin = flash ? '#ffffff' : '#f0c9a0';
    var robe = flash ? '#ffffff' : '#ffffff';
    var dark = flash ? '#8f97ad' : '#22283a';

    drawSprite([
      /* left wing, outer to inner */
      [dx + 0, dy + 1 - flap, 3, 9, wing],
      [dx + 3, dy + 3 - flap, 3, 9, wing],
      [dx + 6, dy + 6 - flap, 3, 7, wing],
      [dx + 2, dy + 3 - flap, 1, 9, vane],
      [dx + 5, dy + 6 - flap, 1, 7, vane],
      [dx + 0, dy + 1 - flap, 3, 2, gold],
      [dx + 0, dy + 7 - flap, 3, 3, vane],
      /* right wing, mirrored */
      [dx + 17, dy + 1 - flap, 3, 9, wing],
      [dx + 14, dy + 3 - flap, 3, 9, wing],
      [dx + 11, dy + 6 - flap, 3, 7, wing],
      [dx + 17, dy + 3 - flap, 1, 9, vane],
      [dx + 14, dy + 6 - flap, 1, 7, vane],
      [dx + 17, dy + 1 - flap, 3, 2, gold],
      [dx + 17, dy + 7 - flap, 3, 3, vane],
      /* tail */
      [dx + 8, dy + 12 + bob, 4, 4, wing],
      [dx + 9, dy + 15 + bob, 2, 2, vane],
      /* legs and talons */
      [dx + 7, dy + 12 + bob, 2, 4, gld2],
      [dx + 11, dy + 12 + bob, 2, 4, gld2],
      [dx + 6, dy + 15 + bob, 3, 1, gold],
      [dx + 11, dy + 15 + bob, 3, 1, gold],
      /* body */
      [dx + 7, dy + 7 + bob, 6, 6, robe],
      [dx + 11, dy + 7 + bob, 2, 6, vane],
      [dx + 7, dy + 9 + bob, 6, 2, gold],
      [dx + 7, dy + 10 + bob, 6, 1, gld2],
      /* head */
      [dx + 7, dy + 2 + bob, 6, 6, skin],
      [dx + 6, dy + 1 + bob, 8, 2, gold],
      [dx + 6, dy + 3 + bob, 1, 3, gold],
      [dx + 13, dy + 3 + bob, 1, 3, gold],
      [dx + 9, dy - 1 + bob, 2, 3, gold],
      [dx + 7, dy + 4 + bob, 2, 2, '#ffffff'],
      [dx + 11, dy + 4 + bob, 2, 2, '#ffffff'],
      [dx + 7 + px, dy + 4 + bob, 1, 2, dark],
      [dx + 11 + px, dy + 4 + bob, 1, 2, dark],
      [dx + 9, dy + 5 + bob, 2, 2, gold],
      [dx + 9, dy + 7 + bob, 2, 1, gld2]
    ]);
  }

  /* ---------------------------------------------------- CLOUD GOLEM
     20 x 22, artDy 0. Heavy stone brute with a fat white cloud
     collar and cloud puffs round the ankles. Arms are a darker tone
     than the torso so they never merge into it. Slow rocking walk. */
  function drawCloudGolem(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir < 0 ? -1 : 1;
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var sw = Math.round(Math.sin(e.animT * 0.09));
    var puff = Math.round(Math.sin(e.animT * 0.06 + 1));
    var px = f > 0 ? 1 : 0;

    var stone = flash ? '#ffffff' : '#8d9db4';
    var deep = flash ? '#c9cfda' : '#5d6b80';
    var lite = flash ? '#ffffff' : '#b6c4d6';
    var cloud = flash ? '#ffffff' : '#f2f7ff';
    var eye = flash ? '#ffffff' : '#5fe8ff';
    var dark = flash ? '#9aa2b2' : '#333d4f';

    drawSprite([
      /* short legs */
      [dx + 7 + sw, dy + 17, 4, 6, deep],
      [dx + 11 - sw, dy + 17, 4, 6, deep],
      [dx + 7 + sw, dy + 17, 2, 6, stone],
      [dx + 11 - sw, dy + 17, 2, 6, stone],
      /* ankle clouds */
      [dx + 5 + sw, dy + 21, 6, 2, cloud],
      [dx + 11 - sw, dy + 21, 6, 2, cloud],
      [dx + 7 + sw, dy + 20, 3, 1, cloud],
      [dx + 12 - sw, dy + 20, 3, 1, cloud],
      /* arms, one pixel clear of the torso */
      [dx + 3, dy + 10 + sw, 4, 7, deep],
      [dx + 15, dy + 10 - sw, 4, 7, deep],
      /* narrow torso under a wide cloud overhang */
      [dx + 7, dy + 9, 8, 9, stone],
      [dx + 11, dy + 9, 4, 9, deep],
      [dx + 7, dy + 9, 2, 9, lite],
      [dx + 9, dy + 12, 1, 4, dark],
      /* big stone fists, mid tone so they never merge with the clouds */
      [dx + 1, dy + 15 + sw, 6, 7, stone],
      [dx + 15, dy + 15 - sw, 6, 7, stone],
      [dx + 1, dy + 15 + sw, 6, 1, lite],
      [dx + 15, dy + 15 - sw, 6, 1, lite],
      [dx + 1, dy + 18 + sw, 6, 1, dark],
      [dx + 15, dy + 18 - sw, 6, 1, dark],
      [dx + 6, dy + 15 + sw, 1, 7, dark],
      [dx + 15, dy + 15 - sw, 1, 7, dark],
      /* cloud shoulders, wider than anything else and bumpy on top */
      [dx + 0, dy + 5, 8, 6, cloud],
      [dx + 14, dy + 5, 8, 6, cloud],
      [dx + 6, dy + 4 + puff, 5, 6, cloud],
      [dx + 11, dy + 4 + puff, 5, 6, cloud],
      [dx + 2, dy + 3 + puff, 4, 3, cloud],
      [dx + 16, dy + 3 + puff, 4, 3, cloud],
      [dx + 0, dy + 10, 22, 1, lite],
      /* head */
      [dx + 7, dy + 0, 8, 7, stone],
      [dx + 7, dy + 0, 8, 2, deep],
      [dx + 7, dy + 2, 2, 5, lite],
      [dx + 8 + px, dy + 3, 2, 2, eye],
      [dx + 12 + px, dy + 3, 2, 2, eye],
      [dx + 9, dy + 6, 4, 1, dark]
    ]);
  }

  /* ---------------------------------------------------------- SLIME
     16 x 14, artDy 0. Green blob that squashes and stretches. Big
     white eyes with dark pupils so the face survives on green, one
     fat shine down the left side, and a happy little mouth. */
  function drawSlime(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir < 0 ? -1 : 1;
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var air = (e.onGround === false) || (e.vy !== undefined && Math.abs(e.vy) > 0.6);
    var st = air ? 2 : Math.round(Math.sin(e.animT * 0.16));
    var bw = clamp(14 - st * 2, 12, 16);
    var bh = clamp(13 + st * 2, 11, 15);
    if (bw % 2 !== 0) { bw += 1; }
    var bx = dx + 9 - (bw >> 1);
    var by = dy + 15 - bh;
    var px = f > 0 ? 1 : 0;

    var goo = flash ? '#ffffff' : '#5ecb52';
    var deep = flash ? '#d8dde6' : '#2f8a35';
    var dark = flash ? '#a8aebb' : '#1b5a26';
    var shine = flash ? '#ffffff' : '#b7f58f';
    var eyew = '#ffffff';
    var eyed = flash ? '#8f97ad' : '#12331a';

    /* eyes stay a fixed size and keep a real gap at every squash width */
    var gap = bw >= 15 ? 4 : 2;
    var ey = by + 3;
    var e1 = bx + ((bw - 6 - gap) >> 1);
    var e2 = e1 + 3 + gap;
    /* mouth hangs off the body bottom so it never lands on the eyes */
    var mw = 4;
    var mx = bx + ((bw - mw) >> 1);
    var my = by + bh - 4;
    var mh = bh >= 13 ? 2 : 1;

    var parts = [
      [bx + 4, by, bw - 8, 1, goo],
      [bx + 2, by + 1, bw - 4, 1, goo],
      [bx + 1, by + 2, bw - 2, 2, goo],
      [bx, by + 4, bw, bh - 4, goo],
      [bx, by + bh - 2, bw, 2, deep],
      [bx + 1, by + bh - 1, bw - 2, 1, dark],
      [bx + 2, by + 1, 4, 2, shine],
      [bx + 1, by + 3, 2, 4, shine],
      [bx + bw - 3, by + 5, 1, 3, deep],
      [e1, ey, 3, 4, eyew],
      [e2, ey, 3, 4, eyew],
      [e1 + px, ey + 1, 2, 2, eyed],
      [e2 + px, ey + 1, 2, 2, eyed],
      [mx, my, mw, mh, eyed]
    ];
    if (mh > 1) {
      parts.push([mx - 1, my - 1, 1, 1, eyed]);
      parts.push([mx + mw, my - 1, 1, 1, eyed]);
    }
    drawSprite(parts);
  }

  /* --------------------------------------------------- CRYSTAL CRAB
     20 x 14, artDy 0. Armoured, not spiky, so a kid reads "hard shell,
     jump on it" and not "spikes, keep away". The shell is a stepped
     faceted gem dome with a thick dark rim, and the two claws are
     open pincers held clear of the shell with a dark gap between the
     prongs. Claws snap on a slow beat. */
  function drawCrystalCrab(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir < 0 ? -1 : 1;
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var snap = Math.floor(e.animT / 14) % 2;
    var step = Math.round(Math.sin(e.animT * 0.25));
    var px = f > 0 ? 1 : 0;

    var shell = flash ? '#ffffff' : '#b478e8';
    var lite = flash ? '#ffffff' : '#e0bcff';
    var glint = flash ? '#ffffff' : '#faf0ff';
    var deep = flash ? '#c9c2d6' : '#6d3ba8';
    var dark = flash ? '#9a94a8' : '#3a1a5c';
    var eye = flash ? '#ffffff' : '#ffe14d';

    drawSprite([
      /* legs */
      [dx + 5, dy + 11 + step, 2, 4, deep],
      [dx + 8, dy + 11 - step, 2, 4, deep],
      [dx + 12, dy + 11 - step, 2, 4, deep],
      [dx + 15, dy + 11 + step, 2, 4, deep],
      [dx + 4, dy + 14 + step, 4, 1, dark],
      [dx + 7, dy + 14 - step, 4, 1, dark],
      [dx + 11, dy + 14 - step, 4, 1, dark],
      [dx + 14, dy + 14 + step, 4, 1, dark],
      /* eye stalks, the thing that says crab */
      [dx + 8, dy + 1, 2, 3, deep],
      [dx + 12, dy + 1, 2, 3, deep],
      [dx + 7, dy + 0, 3, 2, dark],
      [dx + 12, dy + 0, 3, 2, dark],
      [dx + 7 + px, dy + 0, 2, 2, eye],
      [dx + 12 + px, dy + 0, 2, 2, eye],
      /* shell dome, stepped like a cut gem, brightest thing on the sprite */
      [dx + 8, dy + 2, 6, 2, shell],
      [dx + 6, dy + 4, 10, 2, shell],
      [dx + 4, dy + 6, 14, 4, shell],
      [dx + 3, dy + 10, 16, 2, deep],
      [dx + 3, dy + 10, 16, 1, lite],
      /* glassy highlight down the left face */
      [dx + 8, dy + 2, 3, 2, lite],
      [dx + 6, dy + 4, 3, 2, lite],
      [dx + 4, dy + 6, 3, 4, lite],
      [dx + 9, dy + 2, 1, 1, glint],
      [dx + 7, dy + 4, 1, 1, glint],
      /* shaded right face */
      [dx + 13, dy + 4, 3, 2, deep],
      [dx + 15, dy + 6, 3, 4, deep],
      /* armour seam and facet cuts */
      [dx + 4, dy + 8, 14, 1, dark],
      [dx + 9, dy + 2, 1, 8, dark],
      [dx + 12, dy + 4, 1, 6, dark],
      /* claws, darker than the shell, slot cut out of the far end */
      [dx + 0, dy + 6 - snap, 6, 5, deep],
      [dx + 16, dy + 6 - snap, 6, 5, deep],
      [dx + 0, dy + 6 - snap, 6, 1, shell],
      [dx + 16, dy + 6 - snap, 6, 1, shell],
      [dx + 0, dy + 6 - snap, 2, 2, lite],
      [dx + 20, dy + 6 - snap, 2, 2, lite],
      [dx + 0, dy + 8 - snap, 4, 2, '#05060d'],
      [dx + 18, dy + 8 - snap, 4, 2, '#05060d']
    ]);
  }

  /* ---------------------------------------------------------- DRONE
     16 x 14, artDy 0. Small hovering robot. The rotor blade changes
     width every few frames to fake a spin, with blur ticks out at the
     sweep line when the blade is edge on. One big red lens eye that
     slides to the side it is facing, and two blue thruster jets. */
  function drawDrone(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir < 0 ? -1 : 1;
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var bob = Math.round(Math.sin(e.animT * 0.2));
    var spin = Math.floor(e.animT / 2) % 4;
    var rw = [10, 6, 2, 6][spin];
    var rx = 9 - (rw >> 1);
    var jet = Math.floor(e.animT / 3) % 2;
    var px = f > 0 ? 3 : 0;

    var steel = flash ? '#ffffff' : '#8b95a6';
    var lite = flash ? '#ffffff' : '#c3ccd9';
    var deep = flash ? '#c9cfda' : '#525c6d';
    var dark = flash ? '#9aa2b2' : '#2b3242';
    var red = flash ? '#ffffff' : '#ff4a4a';
    var hot = flash ? '#ffffff' : '#ffd0d0';
    var blue = flash ? '#ffffff' : '#5fe8ff';

    drawSprite([
      /* rotor */
      [dx + rx, dy + 1 + bob, rw, 2, lite],
      [dx + rx, dy + 2 + bob, rw, 1, deep],
      [dx + 2, dy + 1 + bob, 1, 2, rw > 6 ? lite : deep],
      [dx + 15, dy + 1 + bob, 1, 2, rw > 6 ? lite : deep],
      [dx + 7, dy + 2 + bob, 4, 2, dark],
      [dx + 8, dy + 1 + bob, 2, 1, lite],
      [dx + 8, dy + 4 + bob, 2, 2, deep],
      /* hull, tapered top and bottom so it reads round */
      [dx + 5, dy + 5 + bob, 8, 1, lite],
      [dx + 3, dy + 6 + bob, 12, 4, steel],
      [dx + 3, dy + 6 + bob, 12, 1, lite],
      [dx + 3, dy + 9 + bob, 12, 2, deep],
      [dx + 4, dy + 11 + bob, 10, 1, deep],
      [dx + 5, dy + 12 + bob, 8, 1, dark],
      [dx + 1, dy + 7 + bob, 2, 3, deep],
      [dx + 15, dy + 7 + bob, 2, 3, deep],
      /* single red eye */
      [dx + 5 + px, dy + 6 + bob, 6, 4, dark],
      [dx + 6 + px, dy + 7 + bob, 4, 2, red],
      [dx + 6 + px, dy + 7 + bob, 1, 1, hot],
      /* thrusters */
      [dx + 4, dy + 12 + bob, 2, 1 + jet, blue],
      [dx + 12, dy + 12 + bob, 2, 2 - jet, blue]
    ]);
  }

  /* --------------------------------------------------------- SENTRY
     18 x 20, artDy 0. Boxy walking robot. The big riot shield rides
     on the front arm with a one pixel dark gap down the side, so it
     never welds itself to the torso. Chest lamp is cyan on purpose,
     so it does not fight the yellow hazard band on the shield. */
  function drawSentry(e) {
    var dx = Math.round(e.x) - 1, dy = Math.round(e.y) - 1;
    var f = e.dir < 0 ? -1 : 1;
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var sw = Math.round(Math.sin(e.animT * 0.16));
    var sx = f > 0 ? 16 : 0;
    var ax = f > 0 ? 14 : 4;
    var bx = f > 0 ? 2 : 16;
    var ex = f > 0 ? 10 : 6;

    var steel = flash ? '#ffffff' : '#98a3b3';
    var lite = flash ? '#ffffff' : '#ccd5e0';
    var deep = flash ? '#c9cfda' : '#5c6676';
    var dark = flash ? '#9aa2b2' : '#2a3140';
    var lamp = flash ? '#ffffff' : '#5fe8ff';
    var warn = flash ? '#ffffff' : '#ffc22e';
    var eye = flash ? '#ffffff' : '#ff5a4a';

    drawSprite([
      /* legs */
      [dx + 5 + sw, dy + 15, 4, 5, deep],
      [dx + 11 - sw, dy + 15, 4, 5, deep],
      [dx + 4 + sw, dy + 19, 6, 2, dark],
      [dx + 10 - sw, dy + 19, 6, 2, dark],
      /* rear arm */
      [dx + bx, dy + 8 - sw, 3, 7, deep],
      [dx + bx, dy + 13 - sw, 3, 3, dark],
      /* torso */
      [dx + 5, dy + 7, 10, 9, steel],
      [dx + 5, dy + 7, 10, 1, lite],
      [dx + 12, dy + 8, 3, 8, deep],
      [dx + 5, dy + 11, 10, 1, dark],
      [dx + 8, dy + 12, 4, 3, lamp],
      [dx + 9, dy + 13, 2, 1, '#ffffff'],
      [dx + 6, dy + 9, 1, 1, lite],
      [dx + 13, dy + 9, 1, 1, lite],
      [dx + 6, dy + 15, 1, 1, lite],
      [dx + 13, dy + 15, 1, 1, lite],
      /* head */
      [dx + 5, dy + 2, 10, 5, steel],
      [dx + 5, dy + 2, 10, 1, lite],
      [dx + 9, dy + 0, 2, 2, deep],
      [dx + 9, dy - 1, 2, 1, warn],
      [dx + 6, dy + 4, 8, 2, dark],
      [dx + ex, dy + 4, 4, 2, eye],
      /* shield arm bridging the gap */
      [dx + ax, dy + 9, 3, 3, deep],
      /* shield, tapered to a point at the foot */
      [dx + sx, dy + 3, 4, 12, lite],
      [dx + sx + 1, dy + 15, 2, 3, lite],
      [dx + (f > 0 ? sx : sx + 3), dy + 3, 1, 12, deep],
      [dx + sx, dy + 9, 4, 4, warn],
      [dx + sx + 1, dy + 9, 1, 4, dark],
      [dx + sx + 3, dy + 9, 1, 4, dark],
      [dx + sx + 1, dy + 5, 2, 3, deep],
      [dx + sx + 1, dy + 6, 2, 1, steel],
      [dx + sx + 1, dy + 15, 2, 1, deep]
    ]);
  }

  /* ----------------------------------------------------- STORM BIRD
     BOSS, 36 x 26, artDy 0. Huge eagle seen head on, wings spread
     across the whole box in three stepped feather blocks a side.
     Big centred gold hooked beak so it reads as a bird of prey at
     any size, facing shown by the pupils. Lightning sparks along the
     wing tips and forks below the tail when it is raging. */
  function drawStormBird(e) {
    var dx = Math.round(e.x), dy = Math.round(e.y);
    var f = e.dir < 0 ? -1 : 1;
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var rage = e.hp <= Math.ceil(e.maxHp / 2);
    var flap = Math.round(Math.sin(e.animT * 0.13) * 3);
    var zap = Math.floor(e.animT / 4) % 3;
    var px = f > 0 ? 1 : 0;

    var wing = flash ? '#ffffff' : '#eef4ff';
    var vane = flash ? '#ffffff' : '#9fc4ea';
    var cool = flash ? '#e8ecf5' : '#5b8fd4';
    var gold = flash ? '#ffffff' : '#ffd24a';
    var gld2 = flash ? '#e8ecf5' : '#c98a17';
    var dark = flash ? '#9aa2b2' : '#1d2740';
    var bolt = rage ? '#fff3a8' : '#8ef0ff';

    var p = [
      /* left wing, outer to inner */
      [dx + 0, dy + 4 - flap, 5, 9, wing],
      [dx + 5, dy + 2 - flap, 5, 10, wing],
      [dx + 10, dy + 5 - flap, 5, 10, wing],
      [dx + 4, dy + 2 - flap, 1, 10, cool],
      [dx + 9, dy + 5 - flap, 1, 10, cool],
      [dx + 0, dy + 11 - flap, 5, 2, vane],
      [dx + 5, dy + 10 - flap, 5, 2, vane],
      [dx + 10, dy + 12 - flap, 5, 3, vane],
      [dx + 0, dy + 4 - flap, 5, 2, gold],
      [dx + 5, dy + 2 - flap, 5, 2, gold],
      /* right wing */
      [dx + 31, dy + 4 - flap, 5, 9, wing],
      [dx + 26, dy + 2 - flap, 5, 10, wing],
      [dx + 21, dy + 5 - flap, 5, 10, wing],
      [dx + 31, dy + 2 - flap, 1, 10, cool],
      [dx + 26, dy + 5 - flap, 1, 10, cool],
      [dx + 31, dy + 11 - flap, 5, 2, vane],
      [dx + 26, dy + 10 - flap, 5, 2, vane],
      [dx + 21, dy + 12 - flap, 5, 3, vane],
      [dx + 31, dy + 4 - flap, 5, 2, gold],
      [dx + 26, dy + 2 - flap, 5, 2, gold],
      /* tail */
      [dx + 14, dy + 19, 8, 5, wing],
      [dx + 15, dy + 22, 6, 3, vane],
      [dx + 17, dy + 24, 2, 2, cool],
      /* legs and talons */
      [dx + 13, dy + 19, 3, 4, gld2],
      [dx + 20, dy + 19, 3, 4, gld2],
      [dx + 12, dy + 22, 5, 2, gold],
      [dx + 19, dy + 22, 5, 2, gold],
      [dx + 12, dy + 23, 5, 1, gld2],
      [dx + 19, dy + 23, 5, 1, gld2],
      /* chest */
      [dx + 13, dy + 10, 10, 10, wing],
      [dx + 20, dy + 10, 3, 10, vane],
      [dx + 13, dy + 10, 3, 10, '#ffffff'],
      [dx + 14, dy + 13, 8, 2, gold],
      [dx + 14, dy + 15, 8, 1, gld2],
      [dx + 15, dy + 17, 6, 2, cool],
      /* head */
      [dx + 14, dy + 4, 8, 7, wing],
      [dx + 14, dy + 2, 8, 2, gold],
      [dx + 13, dy + 0, 2, 3, gold],
      [dx + 21, dy + 0, 2, 3, gold],
      [dx + 17, dy - 1, 2, 4, gold],
      [dx + 14, dy + 4, 8, 1, dark],
      [dx + 15, dy + 5, 3, 3, dark],
      [dx + 18, dy + 5, 3, 3, dark],
      [dx + 15, dy + 5, 3, 2, '#ffe14d'],
      [dx + 18, dy + 5, 3, 2, '#ffe14d'],
      [dx + 15 + px, dy + 5, 1, 2, dark],
      [dx + 19 + px, dy + 5, 1, 2, dark],
      /* beak */
      [dx + 16, dy + 8, 4, 3, gold],
      [dx + 17, dy + 10, 2, 2, gld2],
      [dx + 16, dy + 9, 4, 1, gld2]
    ];

    /* lightning forks off the wing tips */
    if (zap !== 2) {
      p.push([dx + 1, dy + 13 - flap + zap, 2, 1, bolt]);
      p.push([dx + 2, dy + 14 - flap + zap, 2, 1, bolt]);
      p.push([dx + 1, dy + 15 - flap + zap, 2, 1, bolt]);
      p.push([dx + 33, dy + 13 - flap + zap, 2, 1, bolt]);
      p.push([dx + 32, dy + 14 - flap + zap, 2, 1, bolt]);
      p.push([dx + 33, dy + 15 - flap + zap, 2, 1, bolt]);
    }
    if (rage && zap === 1) {
      p.push([dx + 16, dy + 25, 1, 2, bolt]);
      p.push([dx + 17, dy + 26, 2, 1, bolt]);
      p.push([dx + 8, dy + 16 - flap, 1, 2, bolt]);
      p.push([dx + 9, dy + 18 - flap, 1, 2, bolt]);
      p.push([dx + 27, dy + 16 - flap, 1, 2, bolt]);
      p.push([dx + 26, dy + 18 - flap, 1, 2, bolt]);
    }

    drawSprite(p);
  }

  /* --------------------------------------------------- CRYSTAL QUEEN
     BOSS, 28 x 30 box, art is 36 tall so artDy = 6. Tall violet
     crystal figure. Jagged crown of shards, a glowing pink core in
     the chest that pulses, and a robe that flares into crystal
     spikes at the hem. The head is inset a shade darker than the
     crown so the face never gets lost in the shards. */
  function drawCrystalQueen(e) {
    var dx = Math.round(e.x), dy = Math.round(e.y);
    var f = e.dir < 0 ? -1 : 1;
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var rage = e.hp <= Math.ceil(e.maxHp / 2);
    var pulse = Math.floor(e.animT / 6) % 2;
    var sway = Math.round(Math.sin(e.animT * 0.07));
    var px = f > 0 ? 1 : 0;

    var cry = flash ? '#ffffff' : '#a86fe0';
    var lite = flash ? '#ffffff' : '#d3aef5';
    var glint = flash ? '#ffffff' : '#f3e6ff';
    var deep = flash ? '#c9c2d6' : '#63308f';
    var dark = flash ? '#9a94a8' : '#33124f';
    var core = flash ? '#ffffff' : (rage ? '#ff5fa8' : '#ff8fd0');
    var eye = flash ? '#ffffff' : (rage ? '#ffe14d' : '#ffb0e2');

    var p = [
      /* robe hem, crystal spikes */
      [dx + 6, dy + 21, 16, 14, cry],
      [dx + 8, dy + 18, 12, 4, cry],
      [dx + 4, dy + 30, 20, 6, cry],
      [dx + 3, dy + 33, 22, 3, deep],
      [dx + 4, dy + 34, 4, 2, deep],
      [dx + 12, dy + 35, 4, 1, deep],
      [dx + 20, dy + 34, 4, 2, deep],
      [dx + 6, dy + 32, 16, 1, dark],
      /* robe facets */
      [dx + 6, dy + 21, 3, 14, lite],
      [dx + 19, dy + 21, 3, 14, deep],
      [dx + 11, dy + 23, 1, 12, dark],
      [dx + 16, dy + 23, 1, 12, dark],
      [dx + 13, dy + 25, 2, 10, lite],
      /* arms, one pixel clear of the robe */
      [dx + 1 + sway, dy + 14, 4, 11, deep],
      [dx + 23 - sway, dy + 14, 4, 11, deep],
      [dx + 1 + sway, dy + 14, 2, 11, cry],
      [dx + 25 - sway, dy + 14, 2, 11, cry],
      [dx + 0 + sway, dy + 24, 5, 5, lite],
      [dx + 23 - sway, dy + 24, 5, 5, lite],
      /* shoulders with angular pauldrons */
      [dx + 4, dy + 14, 20, 5, cry],
      [dx + 3, dy + 13, 6, 5, cry],
      [dx + 19, dy + 13, 6, 5, cry],
      [dx + 3, dy + 11, 3, 3, cry],
      [dx + 22, dy + 11, 3, 3, cry],
      [dx + 3, dy + 11, 1, 7, lite],
      [dx + 24, dy + 11, 1, 7, deep],
      [dx + 4, dy + 14, 4, 3, lite],
      [dx + 20, dy + 14, 4, 3, deep],
      /* chest core */
      [dx + 10, dy + 18, 8, 8, dark],
      [dx + 11, dy + 19, 6, 6, core],
      [dx + 12, dy + 20, 4, 4, '#ffffff'],
      [dx + 13, dy + 17, 2, 1, core],
      [dx + 13, dy + 26, 2, 1, core],
      [dx + 8, dy + 27, 12, 1, dark],
      /* neck */
      [dx + 12, dy + 12, 4, 3, deep],
      /* head, inset darker than the crown */
      [dx + 9, dy + 4, 10, 9, cry],
      [dx + 9, dy + 4, 10, 1, deep],
      [dx + 9, dy + 4, 2, 9, lite],
      [dx + 17, dy + 4, 2, 9, deep],
      [dx + 10, dy + 7, 3, 3, dark],
      [dx + 15, dy + 7, 3, 3, dark],
      [dx + 10 + px, dy + 7, 2, 2, eye],
      [dx + 15 + px, dy + 7, 2, 2, eye],
      [dx + 12, dy + 11, 4, 1, dark],
      /* jagged crown, uneven shards */
      [dx + 13, dy - 5, 2, 8, cry],
      [dx + 10, dy - 2, 2, 5, cry],
      [dx + 16, dy - 2, 2, 5, cry],
      [dx + 7, dy + 0, 2, 3, cry],
      [dx + 19, dy + 0, 2, 3, cry],
      [dx + 7, dy + 1, 14, 3, deep],
      [dx + 7, dy + 1, 14, 1, lite],
      [dx + 13, dy - 5, 1, 8, glint],
      [dx + 10, dy - 2, 1, 5, glint],
      [dx + 16, dy - 2, 1, 5, glint],
      [dx + 7, dy + 0, 1, 3, glint],
      [dx + 19, dy + 0, 1, 3, glint]
    ];

    if (pulse) {
      p.push([dx + 13, dy - 4, 2, 2, core]);
      p.push([dx + 2, dy + 27, 1, 2, core]);
      p.push([dx + 25, dy + 27, 1, 2, core]);
    }

    drawSprite(p);
  }

  /* ----------------------------------------------------- IRON TITAN
     BOSS, 32 x 30 box, art is 38 tall so artDy = 8. Giant riveted
     robot. The furnace in the chest glows through four vent bars and
     flickers. Arms are a darker steel than the torso and hang clear
     of it, and the legs have a dark split so they never read as one
     slab. Vents on the shoulders puff harder when it is raging. */
  function drawIronTitan(e) {
    var dx = Math.round(e.x), dy = Math.round(e.y);
    var f = e.dir < 0 ? -1 : 1;
    var flash = e.hurt > 0 && Math.floor(e.hurt / 2) % 2 === 0;
    var rage = e.hp <= Math.ceil(e.maxHp / 2);
    var sw = Math.round(Math.sin(e.animT * 0.08) * 1);
    var fire = Math.floor(e.animT / 4) % 3;
    var px = f > 0 ? 2 : 0;

    var steel = flash ? '#ffffff' : '#9aa4b3';
    var lite = flash ? '#ffffff' : '#cdd6e2';
    var deep = flash ? '#c9cfda' : '#606b7d';
    var dark = flash ? '#9aa2b2' : '#2c3341';
    var hot = flash ? '#ffffff' : (rage ? '#ffe14d' : '#ff8a1e');
    var hot2 = flash ? '#ffffff' : (rage ? '#ff8a1e' : '#c94a08');
    var eye = flash ? '#ffffff' : (rage ? '#ff4a4a' : '#ffc22e');

    var p = [
      /* legs */
      [dx + 5, dy + 27, 9, 11, deep],
      [dx + 18, dy + 27, 9, 11, deep],
      [dx + 5, dy + 27, 3, 11, steel],
      [dx + 18, dy + 27, 3, 11, steel],
      [dx + 15, dy + 27, 2, 9, dark],
      [dx + 3, dy + 35, 12, 3, dark],
      [dx + 17, dy + 35, 12, 3, dark],
      [dx + 3, dy + 35, 12, 1, steel],
      [dx + 17, dy + 35, 12, 1, steel],
      /* hips */
      [dx + 6, dy + 24, 20, 4, dark],
      [dx + 6, dy + 24, 20, 1, deep],
      /* arms, darker steel, clear of the torso */
      [dx + 0, dy + 12 + sw, 6, 12, dark],
      [dx + 26, dy + 12 - sw, 6, 12, dark],
      [dx + 0, dy + 12 + sw, 2, 12, deep],
      [dx + 30, dy + 12 - sw, 2, 12, deep],
      /* fists */
      [dx + 0, dy + 22 + sw, 7, 8, steel],
      [dx + 25, dy + 22 - sw, 7, 8, steel],
      [dx + 0, dy + 22 + sw, 7, 1, lite],
      [dx + 25, dy + 22 - sw, 7, 1, lite],
      [dx + 0, dy + 26 + sw, 7, 1, dark],
      [dx + 25, dy + 26 - sw, 7, 1, dark],
      [dx + 0, dy + 29 + sw, 7, 1, dark],
      [dx + 25, dy + 29 - sw, 7, 1, dark],
      /* torso */
      [dx + 6, dy + 10, 20, 15, steel],
      [dx + 6, dy + 10, 20, 1, lite],
      [dx + 20, dy + 11, 6, 14, deep],
      [dx + 6, dy + 11, 3, 14, lite],
      /* furnace */
      [dx + 10, dy + 13, 12, 9, dark],
      [dx + 11, dy + 14, 10, 7, hot2],
      [dx + 11, dy + 14, 2, 7, hot],
      [dx + 14, dy + 14, 2, 7, hot],
      [dx + 17, dy + 14, 2, 7, hot],
      [dx + 20 - fire, dy + 14, 1, 7, hot],
      [dx + 10, dy + 13, 12, 1, deep],
      [dx + 10, dy + 21, 12, 1, deep],
      /* rivets */
      [dx + 7, dy + 12, 2, 2, lite],
      [dx + 23, dy + 12, 2, 2, lite],
      [dx + 7, dy + 21, 2, 2, lite],
      [dx + 23, dy + 21, 2, 2, lite],
      /* shoulder stacks */
      [dx + 6, dy + 6, 5, 5, deep],
      [dx + 21, dy + 6, 5, 5, deep],
      [dx + 6, dy + 6, 5, 1, lite],
      [dx + 21, dy + 6, 5, 1, lite],
      /* head */
      [dx + 11, dy + 1, 10, 9, steel],
      [dx + 11, dy + 1, 10, 1, lite],
      [dx + 11, dy + 1, 2, 9, lite],
      [dx + 19, dy + 1, 2, 9, deep],
      [dx + 12, dy + 4, 8, 3, dark],
      [dx + 13 + px, dy + 4, 4, 3, eye],
      [dx + 13 + px, dy + 4, 4, 1, '#ffffff'],
      [dx + 12, dy + 8, 8, 1, dark],
      [dx + 13, dy - 1, 2, 2, deep],
      [dx + 17, dy - 1, 2, 2, deep]
    ];

    /* smoke and sparks from the shoulder stacks */
    if (fire !== 2) {
      p.push([dx + 7, dy + 3 - fire, 3, 2, hot2]);
      p.push([dx + 22, dy + 4 - fire, 3, 2, hot2]);
    }
    if (rage) {
      p.push([dx + 8, dy + 0 - fire, 2, 2, hot]);
      p.push([dx + 22, dy + 1 - fire, 2, 2, hot]);
    }

    drawSprite(p);
  }

  /* ---------------------------------------------------- WEAPON ICONS
     drawWeaponIcon(ctx, kind, x, y) draws a 12 x 12 icon at x,y.
     Used for the floating pickup and for the HUD slot.
     Signature colours: shotgun brown, rocket red, flame orange,
     laser cyan, boomerang yellow, bombs black with a red fuse spark. */
  function drawWeaponIcon(c, kind, x, y) {
    var p;
    if (kind === 'shotgun') {
      p = [
        [x + 0, y + 4, 9, 3, '#b9c4d1'],
        [x + 0, y + 4, 9, 1, '#e6edf5'],
        [x + 0, y + 3, 3, 2, '#6f7b8c'],
        [x + 0, y + 4, 2, 3, '#2f3745'],
        [x + 7, y + 5, 5, 3, '#9a5b28'],
        [x + 9, y + 7, 3, 4, '#7a4319'],
        [x + 7, y + 5, 5, 1, '#c98a4a'],
        [x + 4, y + 7, 2, 3, '#6f7b8c'],
        [x + 3, y + 7, 4, 1, '#2f3745']
      ];
    } else if (kind === 'rocket') {
      p = [
        [x + 4, y + 0, 4, 3, '#ff4a4a'],
        [x + 5, y - 1, 2, 2, '#ff8a6a'],
        [x + 4, y + 3, 4, 5, '#f2f5ff'],
        [x + 4, y + 4, 4, 2, '#ff4a4a'],
        [x + 4, y + 3, 1, 5, '#c3cee6'],
        [x + 1, y + 6, 3, 4, '#ff4a4a'],
        [x + 8, y + 6, 3, 4, '#ff4a4a'],
        [x + 4, y + 8, 4, 2, '#6f7b8c'],
        [x + 5, y + 10, 2, 2, '#ffc22e'],
        [x + 4, y + 11, 4, 1, '#ff8a1e']
      ];
    } else if (kind === 'flame') {
      p = [
        [x + 3, y + 3, 6, 9, '#ff8a1e'],
        [x + 2, y + 6, 8, 6, '#ff8a1e'],
        [x + 4, y + 0, 3, 4, '#ff5a1e'],
        [x + 6, y + 2, 3, 3, '#ff5a1e'],
        [x + 4, y + 5, 4, 7, '#ffc22e'],
        [x + 5, y + 8, 3, 4, '#fff3a8'],
        [x + 2, y + 8, 2, 3, '#ff5a1e'],
        [x + 8, y + 8, 2, 3, '#ff5a1e']
      ];
    } else if (kind === 'laser') {
      p = [
        [x + 0, y + 3, 6, 6, '#6f7b8c'],
        [x + 0, y + 3, 6, 1, '#c3ccd9'],
        [x + 0, y + 8, 6, 1, '#3a4250'],
        [x + 1, y + 5, 3, 2, '#5fe8ff'],
        [x + 5, y + 4, 3, 4, '#c3ccd9'],
        [x + 6, y + 5, 6, 2, '#5fe8ff'],
        [x + 6, y + 5, 6, 1, '#ffffff'],
        [x + 9, y + 3, 1, 6, '#8ef0ff'],
        [x + 11, y + 4, 1, 4, '#8ef0ff']
      ];
    } else if (kind === 'boomerang') {
      p = [
        [x + 0, y + 1, 3, 2, '#ffc22e'],
        [x + 1, y + 3, 3, 2, '#ffc22e'],
        [x + 3, y + 5, 3, 2, '#ffc22e'],
        [x + 5, y + 6, 4, 3, '#ffc22e'],
        [x + 8, y + 4, 3, 2, '#ffc22e'],
        [x + 9, y + 2, 3, 2, '#ffc22e'],
        [x + 10, y + 0, 2, 2, '#ffc22e'],
        [x + 0, y + 1, 3, 1, '#ffe98a'],
        [x + 10, y + 0, 2, 1, '#ffe98a'],
        [x + 5, y + 8, 4, 1, '#c98a17'],
        [x + 3, y + 5, 1, 1, '#c98a17'],
        [x + 9, y + 4, 1, 1, '#c98a17']
      ];
    } else {
      p = [
        [x + 3, y + 3, 5, 1, '#3a4250'],
        [x + 1, y + 4, 9, 7, '#161b26'],
        [x + 1, y + 4, 9, 1, '#3a4250'],
        [x + 2, y + 11, 7, 1, '#3a4250'],
        [x + 2, y + 5, 3, 3, '#4b5464'],
        [x + 3, y + 5, 2, 1, '#8b95a6'],
        [x + 6, y + 1, 2, 3, '#7a4319'],
        [x + 7, y + 0, 2, 2, '#9a5b28'],
        [x + 8, y + 0, 3, 3, '#ff8a1e'],
        [x + 9, y + 0, 2, 2, '#ffc22e'],
        [x + 9, y + 0, 1, 1, '#fff3a8']
      ];
    }
    drawSpriteOn(c, p);
  }

  /* ------------------------------------------------------- DOOR TILE
     Heavy locked door with a gold lock plate and a keyhole. When open
     the leaf swings back into the frame in perspective and you can
     see straight through the gap. */
  function drawDoorTile(c, x, y, TILE, pal, open) {
    var wood = '#7a4319';
    var wood2 = '#9a5b28';
    var woodD = '#4d2a10';
    var iron = '#8b95a6';
    var ironD = '#4b5464';
    var gold = '#ffc22e';
    var goldD = '#c98a17';
    var rockD = pal.rockDark || '#3a4250';
    var rockL = pal.rock || '#59637a';
    var i, h;

    /* stone frame, edges only, so an open door can stay see-through */
    c.fillStyle = rockD;
    c.fillRect(x, y, 2, TILE);
    c.fillRect(x + TILE - 2, y, 2, TILE);
    c.fillRect(x, y, TILE, 2);
    c.fillStyle = rockL;
    c.fillRect(x, y, 1, TILE);
    c.fillRect(x + TILE - 1, y, 1, TILE);
    c.fillRect(x, y, TILE, 1);
    c.fillStyle = '#05060d';
    c.fillRect(x + 2, y + 2, 1, TILE - 2);
    c.fillRect(x + TILE - 3, y + 2, 1, TILE - 2);
    c.fillRect(x + 2, y + 2, TILE - 4, 1);

    if (open) {
      /* nothing opaque in the gap, so the level behind shows through */
      c.fillStyle = 'rgba(6,8,16,0.45)';
      c.fillRect(x + 3, y + 3, TILE - 6, TILE - 3);
      c.fillStyle = 'rgba(120,160,220,0.14)';
      c.fillRect(x + 3, y + 3, TILE - 6, 3);
      /* swung leaf, tapering to fake the perspective */
      for (i = 0; i < 4; i++) {
        h = TILE - 4 - i * 2;
        c.fillStyle = '#05060d';
        c.fillRect(x + 3 + i, y + 3 + i, 1, h + 1);
        c.fillStyle = i < 2 ? wood2 : wood;
        c.fillRect(x + 3 + i, y + 3 + i, 1, h);
      }
      c.fillStyle = goldD;
      c.fillRect(x + 4, y + 7, 2, 3);
      /* lit threshold so the floor of the gap reads */
      c.fillStyle = rockL;
      c.fillRect(x + 3, y + TILE - 2, TILE - 6, 2);
      c.fillStyle = iron;
      c.fillRect(x + 3, y + TILE - 2, TILE - 6, 1);
      return;
    }

    /* planks */
    c.fillStyle = wood;
    c.fillRect(x + 3, y + 3, TILE - 6, TILE - 3);
    c.fillStyle = wood2;
    c.fillRect(x + 3, y + 3, 3, TILE - 3);
    c.fillRect(x + 9, y + 3, 2, TILE - 3);
    c.fillStyle = woodD;
    c.fillRect(x + 6, y + 3, 1, TILE - 3);
    c.fillRect(x + 11, y + 3, 1, TILE - 3);
    /* two thin iron bands, rivets on the ends */
    c.fillStyle = ironD;
    c.fillRect(x + 3, y + 4, TILE - 6, 2);
    c.fillRect(x + 3, y + TILE - 4, TILE - 6, 2);
    c.fillStyle = iron;
    c.fillRect(x + 3, y + 4, TILE - 6, 1);
    c.fillRect(x + 3, y + TILE - 4, TILE - 6, 1);
    c.fillStyle = '#c3ccd9';
    c.fillRect(x + 4, y + 4, 1, 1);
    c.fillRect(x + TILE - 5, y + 4, 1, 1);
    c.fillRect(x + 4, y + TILE - 4, 1, 1);
    c.fillRect(x + TILE - 5, y + TILE - 4, 1, 1);
    /* gold lock plate with a big keyhole */
    c.fillStyle = '#05060d';
    c.fillRect(x + 5, y + 7, 6, 6);
    c.fillStyle = goldD;
    c.fillRect(x + 5, y + 7, 6, 6);
    c.fillStyle = gold;
    c.fillRect(x + 5, y + 7, 6, 1);
    c.fillRect(x + 5, y + 7, 1, 6);
    c.fillStyle = '#05060d';
    c.fillRect(x + 6, y + 8, 4, 2);
    c.fillRect(x + 7, y + 10, 2, 2);
    c.fillStyle = '#ffe98a';
    c.fillRect(x + 6, y + 7, 1, 1);
  }

  /* ----------------------------------------------------- LADDER TILE
     Two rails and rungs. Tiles cleanly above and below itself. */
  function drawLadderTile(c, x, y, TILE, pal) {
    var railD = '#4d2a10';
    var rail = '#9a5b28';
    var railL = '#c98a4a';
    var rung = '#b9885a';
    c.fillStyle = '#05060d';
    c.fillRect(x + 1, y, 5, TILE);
    c.fillRect(x + TILE - 6, y, 5, TILE);
    c.fillRect(x + 2, y + 3, TILE - 4, 4);
    c.fillRect(x + 2, y + 11, TILE - 4, 4);
    c.fillStyle = railD;
    c.fillRect(x + 2, y, 3, TILE);
    c.fillRect(x + TILE - 5, y, 3, TILE);
    c.fillStyle = rail;
    c.fillRect(x + 2, y, 2, TILE);
    c.fillRect(x + TILE - 5, y, 2, TILE);
    c.fillStyle = railL;
    c.fillRect(x + 2, y, 1, TILE);
    c.fillRect(x + TILE - 5, y, 1, TILE);
    c.fillStyle = rung;
    c.fillRect(x + 3, y + 4, TILE - 6, 2);
    c.fillRect(x + 3, y + 12, TILE - 6, 2);
    c.fillStyle = railL;
    c.fillRect(x + 3, y + 4, TILE - 6, 1);
    c.fillRect(x + 3, y + 12, TILE - 6, 1);
  }

  /* -------------------------------------------------- BREAKABLE TILE
     Sits a shade paler than the solid rock next to it and is split by
     big cracks, so it reads as the weak block on sight. */
  function drawBreakableTile(c, x, y, TILE, pal) {
    var rock = pal.rock || '#59637a';
    var rockD = pal.rockDark || '#3a4250';
    c.fillStyle = rockD;
    c.fillRect(x, y, TILE, TILE);
    c.fillStyle = rock;
    c.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
    /* pale wash so it is clearly weaker than solid rock */
    c.fillStyle = 'rgba(255,255,255,0.20)';
    c.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
    /* loose blocks */
    c.fillStyle = 'rgba(255,255,255,0.16)';
    c.fillRect(x + 2, y + 2, 5, 4);
    c.fillRect(x + 9, y + 8, 5, 5);
    /* cracks */
    c.fillStyle = '#05060d';
    c.fillRect(x + 7, y + 1, 1, 5);
    c.fillRect(x + 6, y + 5, 3, 1);
    c.fillRect(x + 8, y + 6, 1, 3);
    c.fillRect(x + 1, y + 8, 7, 1);
    c.fillRect(x + 4, y + 9, 1, 6);
    c.fillRect(x + 8, y + 9, 1, 6);
    c.fillRect(x + 9, y + 3, 5, 1);
    c.fillRect(x + 12, y + 4, 1, 4);
    /* chipped corners */
    c.fillRect(x + 1, y + 1, 2, 1);
    c.fillRect(x + TILE - 3, y + TILE - 2, 2, 1);
    c.fillStyle = 'rgba(255,255,255,0.30)';
    c.fillRect(x + 2, y + 2, 4, 1);
    c.fillRect(x + 10, y + 9, 3, 1);
  }

  /* ------------------------------------------------------ GEM PICKUP
     12 x 12 cut jewel. Faceted, deep blue green, with a white star
     that ticks round the edges so it looks precious and nothing like
     a flat gold coin. t is a frame counter. */
  function drawGemPickup(c, x, y, t) {
    var bob = Math.round(Math.sin(t * 0.12) * 1);
    var tw = Math.floor(t / 6) % 4;
    var yy = y + bob;
    var p = [
      [x + 3, yy + 0, 6, 2, '#7ef2d8'],
      [x + 1, yy + 2, 10, 3, '#3fd7c0'],
      [x + 2, yy + 5, 8, 3, '#22b7a6'],
      [x + 3, yy + 8, 6, 2, '#149088'],
      [x + 5, yy + 10, 2, 1, '#0d6b68'],
      [x + 3, yy + 0, 2, 10, '#a9ffe9'],
      [x + 5, yy + 2, 2, 6, '#ffffff'],
      [x + 8, yy + 2, 1, 7, '#0d6b68'],
      [x + 1, yy + 2, 10, 1, '#d8fff4'],
      [x + 6, yy + 3, 1, 1, '#ffffff']
    ];
    if (tw === 0) { p.push([x + 10, yy + 0, 2, 1, '#ffffff']); p.push([x + 11, yy - 1, 1, 3, '#ffffff']); }
    if (tw === 1) { p.push([x + 0, yy + 8, 2, 1, '#ffffff']); p.push([x + 1, yy + 7, 1, 3, '#ffffff']); }
    if (tw === 2) { p.push([x + 5, yy - 2, 2, 1, '#ffffff']); p.push([x + 6, yy - 3, 1, 3, '#ffffff']); }
    if (tw === 3) { p.push([x + 10, yy + 9, 2, 1, '#ffffff']); p.push([x + 11, yy + 8, 1, 3, '#ffffff']); }
    drawSpriteOn(c, p);
  }

  /* ------------------------------------------------------ KEY PICKUP
     12 x 12 gold key that bobs. The bow has a real hole punched
     through it so it never reads as a solid blob. */
  function drawKeyPickup(c, x, y, t) {
    var bob = Math.round(Math.sin(t * 0.14) * 1);
    var shine = Math.floor(t / 8) % 3;
    var yy = y + bob;
    var gold = '#ffc22e';
    var goldL = '#ffe98a';
    var goldD = '#c98a17';
    var p = [
      /* bow */
      [x + 0, yy + 2, 6, 6, goldD],
      [x + 1, yy + 1, 4, 8, gold],
      [x + 0, yy + 3, 6, 4, gold],
      [x + 1, yy + 1, 2, 3, goldL],
      /* shaft */
      [x + 6, yy + 4, 6, 2, gold],
      [x + 6, yy + 4, 6, 1, goldL],
      /* teeth */
      [x + 8, yy + 6, 2, 3, goldD],
      [x + 11, yy + 6, 1, 2, goldD]
    ];
    /* punched hole in the bow */
    drawSpriteOn(c, p);
    c.fillStyle = '#05060d';
    c.fillRect(x + 2, yy + 3, 2, 4);
    c.fillRect(x + 1, yy + 4, 4, 2);
    if (shine === 0) { c.fillStyle = '#ffffff'; c.fillRect(x + 8, yy + 3, 2, 1); }
    if (shine === 1) { c.fillStyle = '#ffffff'; c.fillRect(x + 3, yy + 1, 1, 1); }
  }
  /* ==== NEW SPRITES END ==== */

  var ART = null;

  function drawEnemyArt(e) {
    if (!ART) {
      ART = {
        'Z': drawZombie, 'S': drawSkeleton, 'W': drawSnowman, 'V': drawBat,
        'U': drawMummy, 'C': drawScorpion, 'I': drawImp, 'G': drawBlob,
        'N': drawShadow, 'Y': drawGhost,
        'A': drawHarpy, 'E': drawCloudGolem,
        'L': drawSlime, 'O': drawCrystalCrab,
        'f': drawDrone, 'j': drawSentry,
        'K': drawSkullKing, 'J': drawFrostGiant, 'Q': drawMummyLord,
        'D': drawFireDragon, 'X': drawShadowMaster,
        '7': drawStormBird, '8': drawCrystalQueen, '9': drawIronTitan
      };
    }
    var fn = ART[e.char] || (e.kind === 'boss' ? drawSkullKing : drawZombie);
    var flash = e.hurt > 6 && (game.frame % 4 < 2);
    if (flash) { ctx.globalAlpha = ctx.globalAlpha * 0.5; }
    if (e.artDy) {
      ctx.save();
      ctx.translate(0, -e.artDy);
      fn(e);
      ctx.restore();
    } else {
      fn(e);
    }
    if (flash) { ctx.globalAlpha = ctx.globalAlpha * 2; }
    if (e.kind !== 'boss') { drawEnemyPips(e); }
    if (e.shieldT > 0) { drawBossShield(e); }
  }

  /* Little dots above a tough bad guy show how many hits are left. */
  function drawEnemyPips(e) {
    if (!e.maxHp || e.maxHp < 2 || e.hp >= e.maxHp) { return; }
    var n = e.maxHp;
    var w = n * 4 - 1;
    var x = Math.round(e.x + e.w / 2 - w / 2);
    var y = Math.round(e.y - e.artDy - 5);
    for (var i = 0; i < n; i++) {
      ctx.fillStyle = '#05060d';
      ctx.fillRect(x + i * 4 - 1, y - 1, 5, 4);
    }
    for (var j = 0; j < n; j++) {
      ctx.fillStyle = j < e.hp ? '#ff5a6e' : 'rgba(255,255,255,0.22)';
      ctx.fillRect(x + j * 4, y, 3, 2);
    }
  }

  /* The Crystal Queen's magic shield. Shots bounce off it. */
  function drawBossShield(e) {
    var cx = e.x + e.w / 2, cy = e.y + e.h / 2 - e.artDy;
    var r = Math.max(e.w, e.h) * 0.72 + Math.sin(game.frame * 0.14) * 1.6;
    ctx.save();
    ctx.globalAlpha = 0.30 + Math.sin(game.frame * 0.16) * 0.08;
    ctx.fillStyle = '#ff8ad8';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#ffd6f2';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.restore();
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
    ctx.translate(-Math.round(cam.x) + sx, -Math.round(cam.y) + sy);

    drawTiles();
    drawHint();
    drawFlag();
    drawCoins();
    drawPowerups();
    drawKeysGemsWeapons();

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.alive) { continue; }
      if (e.x - cam.x < -70 || e.x - cam.x > VIEW_W + 70) { continue; }
      if (e.y - cam.y < -80 || e.y - cam.y > VIEW_H + 80) { continue; }
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
    drawBlasts();
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
    get keys() { return keys; },
    get gems() { return gems; },
    get weaponBoxes() { return weaponBoxes; },
    get hint() { return hint; },
    get shurikens() { return shurikens; },
    hintTrail: hintTrail,
    worlds: WORLDS,
    weapons: WEAPONS,
    perWorld: LEVELS_PER_WORLD,
    jump: function () { jumpBuffer = 8; confirmEdge = true; },
    attack: function () { throwEdge = true; },
    /* Jump straight to a level. NINJA.goTo(5) is the first boss.
       You can also say NINJA.goTo(1, 2) for world 2, level 3. */
    goTo: function (a, b) {
      var n = (b === undefined) ? a : firstLevelOf(a) + b;
      n = clamp(n, 0, LEVELS.length - 1);
      unlockUpTo(n);
      startLevel(n);
    },
    giveWeapon: function (k) { takeWeapon(k); },
    unlockAll: function () { progress.max = LEVELS.length - 1; saveProgress(); },
    wipeSave: function () {
      progress = { max: 0, best: 0, gems: {} };
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

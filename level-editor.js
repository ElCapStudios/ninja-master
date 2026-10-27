(function () {
  'use strict';
  var data = window.NinjaLevelData, ninja = window.NINJA;
  var draft = data.template(), history = [], saved = '', brush = '#', panning = false;
  var cursor = { x: 2, y: 13 }, stroke = null;
  function el(id) { return document.getElementById(id); }
  var panel = el('level-editor'), grid = el('editor-grid'), ctx = grid.getContext('2d');
  var colors = { '.': '#142e3c', P: '#ff7770', F: '#ff7770', '=': '#d2bc7e', '|': '#d2bc7e',
    T: '#9ae078', '/': '#b1b8c5', o: '#ffe19a', g: '#7ad8c8', H: '#ff8b9b',
    Z: '#9ae078', '^': '#dddde8', '~': '#ff8a3c', k: '#ffe19a', '+': '#d2bc7e', 1: '#d8a05a', 4: '#6ff0ff' };

  function status(message, error) {
    el('editor-status').textContent = message;
    el('editor-status').setAttribute('data-error', String(!!error));
    if (error) { el('editor-status').scrollIntoView({ block: 'nearest' }); }
  }
  function remember() {
    history.push(data.copy(draft));
    if (history.length > 30) { history.shift(); }
  }
  function changed() {
    el('editor-warning').hidden = true;
    el('editor-undo').disabled = history.length === 0;
    el('editor-dirty').textContent = JSON.stringify(draft) === saved ? 'Saved in this slot' : 'Draft not saved';
    draw();
  }
  function sync() {
    el('editor-name').value = draft.name;
    el('editor-world').value = String(draft.world);
    changed();
  }
  function draw() {
    var pal = ninja.editorPalette(draft.world);
    ctx.fillStyle = pal.skyBot;
    ctx.fillRect(0, 0, grid.width, grid.height);
    ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var y = 0; y < data.height; y++) {
      for (var x = 0; x < data.width; x++) {
        var ch = draft.rows[y][x], px = x * 32, py = y * 32;
        if (ch === '#' || ch === '/') {
          ctx.fillStyle = pal.rock; ctx.fillRect(px, py, 32, 32);
          ctx.fillStyle = pal.rockTop; ctx.fillRect(px, py, 32, 5);
          if (ch === '/') { ctx.fillStyle = '#eef4ed'; ctx.fillText('/', px + 16, py + 18); }
        } else if (ch === '=') {
          ctx.fillStyle = pal.plank; ctx.fillRect(px, py + 4, 32, 12);
          ctx.fillStyle = pal.plankTop; ctx.fillRect(px, py + 4, 32, 4);
        } else if (ch === 'e') {
          ctx.save(); ctx.translate(px + 4, py); ctx.scale(2, 2);
          ninja.drawBarrel(0, 0, -1); ctx.restore();
        } else if (ch !== '.') {
          ctx.fillStyle = '#05060d'; ctx.fillRect(px + 2, py + 2, 28, 28);
          ctx.fillStyle = colors[ch]; ctx.fillText(ch, px + 16, py + 17);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1; ctx.strokeRect(px + 0.5, py + 0.5, 32, 32);
      }
    }
    ctx.strokeStyle = '#ffd93d'; ctx.lineWidth = 3;
    ctx.strokeRect(cursor.x * 32 + 2, cursor.y * 32 + 2, 28, 28);
    var tile = data.tiles.find(function (t) { return t[0] === draft.rows[cursor.y][cursor.x]; });
    grid.setAttribute('aria-label', 'Level grid. Row ' + (cursor.y + 1) + ', column ' + (cursor.x + 1) + ': ' + tile[1]);
  }
  function select(tile) {
    brush = tile;
    Array.from(el('editor-palette').children).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.tile === brush)); });
    el('editor-brush').textContent = 'Brush: ' + data.tiles.find(function (t) { return t[0] === tile; })[1];
  }
  function show(message) {
    stroke = null;
    panel.hidden = false;
    el('stage').hidden = true;
    document.body.classList.remove('playing');
    sync();
    updateSlotLabels();
    if (message) { status(message); }
    el('editor-test').focus();
  }
  function close() {
    stroke = null;
    panel.hidden = true;
    el('stage').hidden = false;
    ninja.closeEditor();
    el('btn-editor').focus();
  }
  function withStorage(action) {
    try { return action(window.localStorage); }
    catch (e) { return { error: 'Cannot access device storage. Keep this page open to keep your draft.' }; }
  }
  function play(allowWarning) {
    var checked = data.validate(draft, true);
    if (checked.error) { status(checked.error, true); return; }
    if (checked.warning && !allowWarning) {
      el('editor-warning').hidden = false;
      el('editor-warning-text').textContent = checked.warning + ' You can still test it.';
      status('Check the path to your flag before you play.');
      el('editor-anyway').focus();
      return;
    }
    var started = ninja.playCustom(draft);
    if (started.error) { status(started.error, true); return; }
    panel.hidden = true;
    el('stage').hidden = false;
    el('game').setAttribute('tabindex', '-1');
    el('game').focus();
  }
  function undo() {
    if (!history.length) { return; }
    draft = history.pop();
    sync();
    status('Undone. Your last draft is back.');
  }

  ninja.worlds.forEach(function (world, i) {
    var option = document.createElement('option');
    option.value = String(i); option.textContent = world.name;
    el('editor-world').appendChild(option);
  });
  data.tiles.forEach(function (tile) {
    var button = document.createElement('button'), mark = document.createElement('span');
    button.type = 'button'; button.dataset.tile = tile[0];
    button.setAttribute('aria-pressed', String(tile[0] === brush));
    mark.className = 'editor-tile-mark'; mark.textContent = tile[0];
    mark.setAttribute('aria-hidden', 'true');
    button.appendChild(mark); button.appendChild(document.createTextNode(tile[1]));
    button.addEventListener('click', function () { select(tile[0]); });
    el('editor-palette').appendChild(button);
  });
  el('btn-editor').addEventListener('click', function () {
    if (ninja.openEditor()) { show('Your first floor is ready. Add some coins, then Test level.'); }
  });
  el('editor-close').addEventListener('click', close);
  el('editor-test').addEventListener('click', function () { play(false); });
  el('editor-anyway').addEventListener('click', function () { play(true); });
  el('custom-edit').addEventListener('click', function () { ninja.returnToEditor(); });
  el('custom-retry').addEventListener('click', function () { ninja.restartCustom(); });
  el('editor-undo').addEventListener('click', undo);
  el('editor-new').addEventListener('click', function () {
    remember(); draft = data.template(); sync(); status('Fresh floor ready. Undo brings back your old draft.');
  });
  el('editor-name').addEventListener('change', function () {
    remember(); draft.name = this.value.trim() || 'My level'; sync(); status('Name changed. Save to keep it.');
  });
  el('editor-world').addEventListener('change', function () {
    remember(); draft.world = Number(this.value); changed(); status('World changed. Save to keep it.');
  });
  el('editor-pan').addEventListener('click', function () {
    panning = !panning; stroke = null;
    this.setAttribute('aria-pressed', String(panning));
    this.textContent = 'Move view: ' + (panning ? 'on' : 'off');
    grid.classList.toggle('editor-panning', panning);
    status(panning ? 'Drag the grid to move the view. Turn Move view off to paint.' : 'Ready to paint.');
  });
  function updateSlotLabels() {
    Array.from(el('editor-slot').options).forEach(function (option) {
      var result = withStorage(function (storage) { return data.read(storage, option.value); });
      option.textContent = 'Level ' + option.value + (result.value ? ': ' + result.value.name : '');
    });
  }
  el('editor-slot').addEventListener('change', function () {
    saved = ''; changed(); status('Slot selected. Save here, or Load slot. Your draft has not changed.');
  });
  el('editor-save').addEventListener('click', function () {
    var result = withStorage(function (storage) { return data.save(storage, el('editor-slot').value, draft); });
    if (result.error) { saved = ''; changed(); status(result.error, true); return; }
    saved = JSON.stringify(result.value);
    updateSlotLabels(); changed(); status('Saved to Level ' + el('editor-slot').value + ' on this device.');
  });
  el('editor-load').addEventListener('click', function () {
    var result = withStorage(function (storage) { return data.read(storage, el('editor-slot').value); });
    if (result.error) { status(result.error, true); return; }
    remember(); draft = result.value; saved = JSON.stringify(draft);
    sync(); status('Loaded Level ' + el('editor-slot').value + '. Undo brings back your old draft.');
  });
  function point(e) {
    var r = grid.getBoundingClientRect();
    return { x: Math.max(0, Math.min(23, Math.floor((e.clientX - r.left) * 24 / r.width))),
      y: Math.max(0, Math.min(16, Math.floor((e.clientY - r.top) * 17 / r.height))) };
  }
  function paintLine(a, b) {
    var steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
    for (var i = 0; i <= steps; i++) {
      data.paint(draft, Math.round(a.x + (b.x - a.x) * i / steps), Math.round(a.y + (b.y - a.y) * i / steps), brush);
    }
    cursor = b; changed();
  }
  grid.addEventListener('pointerdown', function (e) {
    if (panning || stroke || (e.button !== 0 && e.pointerType !== 'touch')) { return; }
    e.preventDefault(); grid.focus({ preventScroll: true });
    remember(); stroke = { id: e.pointerId, point: point(e) };
    grid.setPointerCapture(e.pointerId);
    paintLine(stroke.point, stroke.point); status('Draft changed. Save to keep it.');
  });
  grid.addEventListener('pointermove', function (e) {
    if (!stroke || e.pointerId !== stroke.id) { return; }
    var p = point(e); paintLine(stroke.point, p); stroke.point = p;
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (event) {
    grid.addEventListener(event, function (e) { if (stroke && e.pointerId === stroke.id) { stroke = null; } });
  });
  grid.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  grid.addEventListener('keydown', function (e) {
    var moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (moves[e.code]) {
      e.preventDefault();
      cursor.x = Math.max(0, Math.min(23, cursor.x + moves[e.code][0]));
      cursor.y = Math.max(0, Math.min(16, cursor.y + moves[e.code][1]));
      draw();
      var r = grid.getBoundingClientRect(), board = el('editor-board');
      var x = (cursor.x + 0.5) * r.width / 24;
      board.scrollLeft = Math.max(0, x - board.clientWidth / 2);
      var top = r.top + cursor.y * r.height / 17, bottom = top + r.height / 17;
      var limit = el('editor-heading').parentElement.getBoundingClientRect().bottom + 8;
      panel.scrollTop += top < limit ? top - limit : Math.max(0, bottom - window.innerHeight + 12);
    } else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Delete' || e.code === 'Backspace') {
      e.preventDefault();
      if (e.repeat) { return; }
      remember(); data.paint(draft, cursor.x, cursor.y, e.code === 'Delete' || e.code === 'Backspace' ? '.' : brush);
      changed(); status('Draft changed. Save to keep it.');
    }
  });
  panel.addEventListener('keydown', function (e) {
    if (e.code === 'Escape') { e.preventDefault(); close(); }
    else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && e.target.tagName !== 'INPUT') {
      e.preventDefault(); undo();
    }
  });
  window.addEventListener('beforeunload', function (e) {
    if (JSON.stringify(draft) !== JSON.stringify(data.template()) && JSON.stringify(draft) !== saved) {
      e.preventDefault(); e.returnValue = '';
    }
  });
  window.addEventListener('blur', function () { stroke = null; });
  window.NinjaLevelEditor = { show: show };
  sync();
})();

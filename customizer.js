(function () {
  'use strict';

  var SAVE_KEY = 'ninjaMasterLookV1';
  var defaults = { suit: 'midnight', headband: 'red', belt: 'red', headwear: 'none' };
  var suits = [
    { id: 'midnight', name: 'Midnight', color: '#3b4570', dark: '#2a3155', hood: '#4f5c8c' },
    { id: 'ocean', name: 'Ocean', color: '#3284ad', dark: '#225674', hood: '#5aa8cb' },
    { id: 'moss', name: 'Moss', color: '#52854a', dark: '#345b32', hood: '#7fa76a' },
    { id: 'plum', name: 'Plum', color: '#885796', dark: '#583964', hood: '#ae7cba' },
    { id: 'ember', name: 'Ember', color: '#b85a38', dark: '#7d3929', hood: '#dc8a60' },
    { id: 'ice', name: 'Ice', color: '#b4d5e0', dark: '#7393ad', hood: '#ddf2f4' }
  ];
  var trims = [
    { id: 'red', name: 'Red', color: '#e8483a', dark: '#b8352a' },
    { id: 'sky', name: 'Sky', color: '#5ad2ff', dark: '#2b90bd' },
    { id: 'leaf', name: 'Leaf', color: '#a8dd69', dark: '#66963c' },
    { id: 'sun', name: 'Sun', color: '#ffd93d', dark: '#b68c26' },
    { id: 'pink', name: 'Pink', color: '#f797ca', dark: '#b4548d' },
    { id: 'snow', name: 'Snow', color: '#f4f4ef', dark: '#a6b0bd' }
  ];
  var hats = [
    { id: 'none', name: 'None' },
    { id: 'sprout', name: 'Sprout' },
    { id: 'cap', name: 'Trail cap' },
    { id: 'crest', name: 'Star crest' },
    { id: 'cat-ears', name: 'Cat ears' },
    { id: 'horns', name: 'Horns' },
    { id: 'viking', name: 'Viking helmet' },
    { id: 'centurion', name: 'Centurion helmet' }
  ];
  var groups = { suit: suits, headband: trims, belt: trims, headwear: hats };
  var applied = copy(defaults), draft = copy(defaults);
  var issue = '';
  var hooks, dialog, button, status, preview;
  var radios = [];

  function copy(look) {
    return { suit: look.suit, headband: look.headband, belt: look.belt, headwear: look.headwear };
  }

  function choice(key, id) {
    return groups[key].find(function (item) { return item.id === id; });
  }

  function valid(look) {
    return look && look.v === 1 && Object.keys(groups).every(function (key) {
      return typeof look[key] === 'string' && choice(key, look[key]);
    });
  }

  function message(text, warning) {
    status.textContent = text;
    status.classList.toggle('customizer-warning', warning);
  }

  function markIssue() {
    button.textContent = issue ? 'NINJA !' : 'MY NINJA';
    button.setAttribute('aria-label', issue ? 'My ninja. ' + issue : 'Change your ninja look');
  }

  function load() {
    var raw;
    try { raw = localStorage.getItem(SAVE_KEY); }
    catch (err) {
      issue = 'This browser could not load your look. Choose a look, then try Apply look.';
      return;
    }
    if (raw === null) { return; }
    var saved;
    try { saved = JSON.parse(raw); }
    catch (err) {
      issue = 'Your saved look could not be read. Choose a look, then Apply look to replace it.';
      return;
    }
    if (!valid(saved)) {
      issue = 'Your saved look has unknown choices. Choose a look, then Apply look to replace it.';
      return;
    }
    applied = copy(saved);
  }

  function redraw() {
    var gold = hooks.isGold();
    radios.forEach(function (radio) {
      radio.checked = draft[radio.name] === radio.value;
      radio.disabled = gold && radio.name !== 'headwear';
    });
    document.getElementById('customizer-gold-note').textContent = gold ?
      'Gold Ninja is on. Its gold colours stay on, and coins still count double. Pick any headwear. Your colour choices stay saved.' :
      'All looks are free. They do not change your moves or power.';
    var description = (gold ? 'Gold Ninja suit and trim' :
      choice('suit', draft.suit).name + ' suit, ' + choice('headband', draft.headband).name +
      ' headband, ' + choice('belt', draft.belt).name + ' belt') +
      ', ' + choice('headwear', draft.headwear).name + ' headwear.';
    preview.setAttribute('aria-label', 'Preview: ' + description);
    var c = preview.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, preview.width, preview.height);
    hooks.draw(c, draft);
  }

  function open() {
    if (dialog.open) { return; }
    hooks.onOpen();
    draft = copy(applied);
    redraw();
    message(issue || 'Choose your look. Apply look keeps it on this browser.', !!issue);
    dialog.showModal();
  }

  function apply() {
    applied = copy(draft);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 1, suit: applied.suit, headband: applied.headband,
        belt: applied.belt, headwear: applied.headwear
      }));
      issue = '';
      message('Look applied and saved on this browser.', false);
    } catch (err) {
      issue = 'Look applied for this visit only. This browser could not save it. Try Apply look again.';
      message(issue, true);
    }
    markIssue();
  }

  function init(options) {
    hooks = options;
    dialog = document.getElementById('customizer');
    button = document.getElementById('btn-customizer');
    status = document.getElementById('customizer-status');
    preview = document.getElementById('customizer-preview');
    load();
    markIssue();
    Object.keys(groups).forEach(function (key) {
      var container = document.getElementById('customizer-' + key);
      groups[key].forEach(function (item) {
        var label = document.createElement('label');
        label.className = 'customizer-choice';
        var radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = key;
        radio.value = item.id;
        radio.addEventListener('change', function () {
          if (!radio.checked) { return; }
          draft[key] = radio.value;
          redraw();
          message(issue || 'Preview changed. Choose Apply look to keep it.', !!issue);
        });
        label.appendChild(radio);
        if (item.color) {
          var swatch = document.createElement('span');
          swatch.className = 'customizer-swatch';
          swatch.style.backgroundColor = item.color;
          swatch.setAttribute('aria-hidden', 'true');
          label.appendChild(swatch);
        }
        var name = document.createElement('span');
        name.textContent = item.name;
        label.appendChild(name);
        container.appendChild(label);
        radios.push(radio);
      });
    });
    button.addEventListener('click', open);
    document.getElementById('customizer-apply').addEventListener('click', apply);
    document.getElementById('customizer-default').addEventListener('click', function () {
      draft = copy(defaults);
      redraw();
      message(issue || 'Default look in preview. Choose Apply look to keep it.', !!issue);
    });
    document.getElementById('customizer-back').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); dialog.close(); });
    dialog.addEventListener('close', function () { hooks.onClose(); button.focus(); });
  }

  function palette(look) {
    var suit = choice('suit', look.suit);
    var band = choice('headband', look.headband);
    return { suit: suit.color, dark: suit.dark, hood: suit.hood,
      band: band.color, tail: band.dark, belt: choice('belt', look.belt).color };
  }

  function headwear(look, x, y, suit, dark, band) {
    if (look.headwear === 'sprout') {
      return [[x + 5, y - 4, 2, 5, '#66963c'], [x + 2, y - 5, 4, 2, '#a8dd69'],
        [x + 7, y - 6, 3, 2, '#7fd05f']];
    }
    if (look.headwear === 'cap') {
      return [[x + 2, y - 2, 8, 3, suit], [x + 2, y - 2, 2, 3, dark],
        [x, y + 1, 12, 1, band]];
    }
    if (look.headwear === 'crest') {
      return [[x + 5, y - 6, 2, 7, band], [x + 2, y - 3, 8, 2, band],
        [x + 4, y - 4, 4, 4, band], [x + 5, y - 3, 2, 2, '#ffffff']];
    }
    if (look.headwear === 'cat-ears') {
      return [[x + 1, y - 4, 1, 5, suit], [x + 2, y - 3, 1, 4, suit],
        [x + 3, y - 2, 2, 3, suit], [x + 10, y - 4, 1, 5, suit],
        [x + 9, y - 3, 1, 4, suit], [x + 7, y - 2, 2, 3, suit],
        [x + 2, y - 1, 2, 2, band], [x + 8, y - 1, 2, 2, band]];
    }
    if (look.headwear === 'horns') {
      return [[x + 1, y - 1, 3, 2, '#be9e72'], [x, y - 3, 2, 3, '#f4e3ba'],
        [x - 1, y - 5, 1, 3, '#f4e3ba'], [x + 8, y - 1, 3, 2, '#be9e72'],
        [x + 10, y - 3, 2, 3, '#f4e3ba'], [x + 12, y - 5, 1, 3, '#f4e3ba']];
    }
    if (look.headwear === 'viking') {
      return [[x + 2, y - 3, 8, 4, suit], [x + 1, y - 1, 10, 2, suit],
        [x + 2, y - 2, 2, 3, dark], [x + 1, y + 1, 10, 1, band],
        [x + 5, y - 3, 2, 5, band],
        [x, y - 2, 3, 2, '#be9e72'], [x - 2, y - 4, 3, 2, '#f4e3ba'],
        [x - 2, y - 6, 1, 3, '#f4e3ba'], [x + 9, y - 2, 3, 2, '#be9e72'],
        [x + 11, y - 4, 3, 2, '#f4e3ba'], [x + 13, y - 6, 1, 3, '#f4e3ba']];
    }
    if (look.headwear === 'centurion') {
      return [[x + 2, y - 2, 8, 4, suit], [x + 1, y + 1, 10, 1, band],
        [x, y + 2, 1, 4, suit], [x + 11, y + 2, 1, 4, suit],
        [x + 5, y - 4, 2, 5, dark], [x + 3, y - 8, 6, 3, band],
        [x + 2, y - 7, 2, 3, band], [x + 8, y - 7, 2, 3, band]];
    }
    return [];
  }

  window.NinjaLooks = {
    init: init, current: function () { return copy(applied); },
    isOpen: function () { return !!(dialog && dialog.open); },
    palette: palette, headwear: headwear
  };
})();

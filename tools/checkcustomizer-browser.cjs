'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
const output = process.env.BROWSER_CHECK_OUTPUT;
const save = { v: 4, max: 19, best: 700, gems: { 0: 7, 2: 3 }, coins: 230,
  spentGems: 4, buys: { ice: 1, heart: 2 }, medals: { 0: 5 } };
const lookKey = 'ninjaMasterLookV1';
const newHeadwear = {
  'cat-ears': 'Cat ears', horns: 'Horns', viking: 'Viking helmet', centurion: 'Centurion helmet'
};
const results = [];

async function frames(page, count = 2) {
  await page.evaluate(async count => {
    for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame);
  }, count);
}

async function open(page, touch = false) {
  const trigger = page.locator('#btn-customizer');
  if (touch) await trigger.tap();
  else await trigger.click();
  await page.locator('#customizer').waitFor({ state: 'visible' });
}

async function choose(page, key, value, touch = false) {
  const radio = page.locator('#customizer-' + key + ' input[value="' + value + '"]');
  if (touch) await radio.locator('..').tap();
  else await radio.check();
  assert.equal(await radio.isChecked(), true);
}

async function screenshot(page, name) {
  if (output) await page.screenshot({ path: path.join(output, name + '.png') });
}

async function checkPreview(page) {
  const preview = await page.locator('#customizer-preview').evaluate(el => {
    const { data, width, height } = el.getContext('2d').getImageData(0, 0, el.width, el.height);
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3]) {
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
    return { minX, minY, maxX, maxY, width, height };
  });
  assert.ok(preview.minX > 0 && preview.minY > 0 && preview.maxX < preview.width - 1 &&
    preview.maxY < preview.height - 1, 'preview must not crop headwear or feet: ' + JSON.stringify(preview));
}

async function checkNewHeadwear(page, engine, touch = false, gold = false) {
  const before = await page.evaluate(() => localStorage.getItem('ninjaMasterSaveV2'));
  const artwork = [];
  const gameArt = [];
  let previous = 'crest';
  for (const [id, name] of Object.entries(newHeadwear)) {
    if (!(await page.locator('#customizer').evaluate(el => el.open))) await open(page, touch);
    if (touch) await choose(page, 'headwear', id, true);
    if (!touch || page.viewportSize().width === 320) {
      await page.locator('#customizer-headwear input[value="' + previous + '"]').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#customizer-headwear input[value="' + id + '"]').isChecked(), true,
        'keyboard must select ' + name);
    }
    previous = id;
    assert.ok((await page.locator('#customizer-preview').getAttribute('aria-label')).includes(name));
    await checkPreview(page);
    artwork.push(await page.locator('#customizer-preview').evaluate(el => el.toDataURL()));
    if (touch) await page.locator('#customizer-apply').tap();
    else { await page.locator('#customizer-apply').focus(); await page.keyboard.press('Enter'); }
    assert.match(await page.locator('#customizer-status').textContent(), /applied and saved/);
    if (!touch) await screenshot(page, engine + '-' + (gold ? 'gold-' : '') + id);
    if (touch) await page.locator('#customizer-back').tap();
    else await page.keyboard.press('Escape');
    await page.reload(); await frames(page);
    assert.equal(await page.evaluate(() => NinjaLooks.current().headwear), id);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('ninjaMasterLookV1')).v), 1);
    assert.equal(await page.evaluate(() => localStorage.getItem('ninjaMasterSaveV2')), before);
    assert.equal(await page.evaluate(() => NINJA.owns('gold')), gold ? 1 : 0);
    if (!touch) {
      await page.evaluate(() => {
        NINJA.goTo(0);
        Object.assign(NINJA.player, { x: 120, y: 100, vx: 0, vy: 0, invuln: 0, drawScaleX: 1, drawScaleY: 1 });
      });
      for (const facing of [-1, 1]) {
        await page.evaluate(facing => { NINJA.player.facing = facing; }, facing);
        await frames(page);
        const sprite = await page.evaluate(() => {
          const c = document.getElementById('game').getContext('2d');
          const p = NINJA.player;
          const x = Math.round(p.x) - 1 - Math.round(NINJA.cam.x);
          const y = Math.round(p.y) - 1 - Math.round(NINJA.cam.y);
          const eyes = (p.facing > 0 ? [5, 8] : [2, 5]).map(offset =>
            Array.from(c.getImageData(x + offset, y + 4, 1, 1).data));
          const crop = document.createElement('canvas');
          crop.width = 28; crop.height = 32;
          crop.getContext('2d').putImageData(c.getImageData(x - 9, y - 11, 28, 32), 0, 0);
          return { eyes, image: crop.toDataURL(), w: p.w, h: p.h };
        });
        assert.deepEqual(sprite.eyes, [[255, 255, 255, 255], [255, 255, 255, 255]], name + ' must not hide either eye');
        assert.equal(sprite.w, 10); assert.equal(sprite.h, 15);
        gameArt.push({ name, facing, image: sprite.image });
      }
      await page.reload(); await frames(page);
    }
    if (gold) {
      await open(page, touch);
      assert.match(await page.locator('#customizer-preview').getAttribute('aria-label'), /Gold Ninja/);
      assert.equal(await page.locator('#customizer-suit input:disabled, #customizer-headband input:disabled, #customizer-belt input:disabled').count(), 18);
    }
  }
  assert.equal(new Set(artwork).size, 4, 'all four live previews must be distinct');
  if (!touch && output) {
    const gallery = await page.context().newPage();
    await gallery.setContent('<html lang="en"><title>Headwear at game size</title><body style="margin:0;background:#0c101e"><canvas id="sheet" width="800" height="360"></canvas></body></html>');
    await gallery.locator('#sheet').evaluate(async (canvas, sprites) => {
      const c = canvas.getContext('2d');
      c.imageSmoothingEnabled = false;
      c.fillStyle = '#0c101e'; c.fillRect(0, 0, canvas.width, canvas.height);
      c.font = 'bold 16px sans-serif'; c.fillStyle = '#ffd93d';
      c.fillText('Actual game pixels: native size and 4x zoom, facing both ways', 16, 24);
      for (let i = 0; i < sprites.length; i++) {
        const sprite = sprites[i];
        const image = new Image(); image.src = sprite.image; await image.decode();
        const x = 16 + Math.floor(i / 2) * 196, y = 44 + (i % 2) * 156;
        c.fillStyle = '#f4f4ef'; c.font = '14px sans-serif';
        c.fillText(sprite.name, x, y + 14);
        c.drawImage(image, x, y + 28);
        c.drawImage(image, x + 40, y + 20, 112, 128);
      }
    }, gameArt);
    await gallery.locator('#sheet').screenshot({ path: path.join(output, engine + '-' + (gold ? 'gold-' : '') + 'game-sprites.png') });
    await gallery.close();
  }
}

async function checkTargets(page, selector) {
  const boxes = await page.locator(selector).evaluateAll(elements => elements
    .filter(el => el.getClientRects().length).map(el => {
      const r = el.getBoundingClientRect();
      return { id: el.id || el.textContent.trim(), x: r.x, y: r.y, w: r.width, h: r.height };
    }));
  const viewport = page.viewportSize();
  for (const b of boxes) {
    assert.ok(b.w >= 44 && b.h >= 44, 'small target: ' + JSON.stringify(b));
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= viewport.width + 1 &&
      b.y + b.h <= viewport.height + 1, 'offscreen: ' + JSON.stringify(b));
    for (const other of boxes.filter(a => a.id !== b.id)) {
      assert.ok(!(b.x < other.x + other.w && b.x + b.w > other.x &&
        b.y < other.y + other.h && b.y + b.h > other.y), 'overlap: ' + b.id + ', ' + other.id);
    }
  }
}

async function tapMenu(page, action, index) {
  const point = await page.evaluate(({ action, index }) => {
    const h = NINJA.menuHits.find(h => h.act === action && (index === undefined || h.i === index));
    if (!h) throw Error('Missing canvas action: ' + action);
    const r = document.getElementById('game').getBoundingClientRect();
    return { x: r.left + (h.x + h.w / 2) * r.width / 384, y: r.top + (h.y + h.h / 2) * r.height / 272 };
  }, { action, index });
  await page.touchscreen.tap(point.x, point.y);
  await frames(page);
}

async function desktop(browser, engine) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  await page.evaluate(save => {
    localStorage.clear(); localStorage.setItem('ninjaMasterSaveV2', JSON.stringify(save));
  }, save);
  await page.reload(); await frames(page);
  assert.deepEqual(await page.evaluate(() => JSON.parse(JSON.stringify(NINJA.progress))),
    Object.fromEntries(Object.entries(save).filter(([k]) => k !== 'v')));
  const before = await page.evaluate(() => localStorage.getItem('ninjaMasterSaveV2'));
  await page.locator('#btn-customizer').focus(); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#customizer').evaluate(el => el.open), true);
  assert.equal(await page.locator('#customizer input:checked').count(), 4);
  await page.locator('#customizer-suit input[value="midnight"]').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#customizer-suit input[value="ocean"]').isChecked(), true);
  assert.equal(await page.evaluate(() => NINJA.game.mode), 'title', 'game must not consume arrow keys');
  const focus = await page.locator('#customizer-suit input[value="ocean"]').evaluate(el => {
    const style = getComputedStyle(el.parentElement);
    return { width: style.outlineWidth, style: style.outlineStyle };
  });
  assert.deepEqual(focus, { width: '3px', style: 'solid' });
  await choose(page, 'headband', 'sky'); await choose(page, 'belt', 'sun'); await choose(page, 'headwear', 'crest');
  assert.match(await page.locator('#customizer-preview').getAttribute('aria-label'), /Ocean.*Sky.*Sun.*Star crest/);
  await checkPreview(page);
  await page.locator('#customizer-apply').focus(); await page.keyboard.press('Space');
  assert.match(await page.locator('#customizer-status').textContent(), /applied and saved/);
  await screenshot(page, engine + '-desktop');
  assert.equal(await page.evaluate(() => localStorage.getItem('ninjaMasterSaveV2')), before);
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#customizer').evaluate(el =>
      el.contains(document.activeElement) || document.activeElement === document.body), true,
    'native modal must keep background controls out of the tab order');
  }
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#btn-customizer').evaluate(el => el === document.activeElement), true);
  assert.equal(await page.evaluate(() => NINJA.game.mode), 'title', 'Escape must not reach game');
  await page.reload(); await frames(page);
  assert.deepEqual(await page.evaluate(() => NinjaLooks.current()),
    { suit: 'ocean', headband: 'sky', belt: 'sun', headwear: 'crest' });
  await open(page); await choose(page, 'suit', 'ember'); await page.locator('#customizer-back').click();
  assert.equal(await page.evaluate(() => NinjaLooks.current().suit), 'ocean');
  await open(page); await page.locator('#customizer-default').click();
  await page.locator('#customizer-apply').click(); await page.reload(); await frames(page);
  assert.equal(await page.evaluate(() => NinjaLooks.current().suit), 'midnight');
  assert.equal(await page.evaluate(() => NinjaLooks.current().headwear), 'none');
  await checkNewHeadwear(page, engine);

  await page.evaluate(key => localStorage.setItem(key, '{bad'), lookKey);
  await page.reload(); await open(page);
  assert.match(await page.locator('#customizer-status').textContent(), /could not be read/);
  await page.locator('#customizer-apply').click();
  assert.equal(await page.locator('#btn-customizer').textContent(), 'MY NINJA');
  await page.locator('#customizer-back').click();
  await page.evaluate(() => {
    Storage.prototype.setItem = function () { throw new DOMException('Full', 'QuotaExceededError'); };
  });
  await open(page); await choose(page, 'headwear', 'sprout'); await page.locator('#customizer-apply').click();
  assert.match(await page.locator('#customizer-status').textContent(), /visit only.*could not save/);
  assert.equal(await page.evaluate(() => NinjaLooks.current().headwear), 'sprout');
  await page.reload(); await frames(page);
  await page.evaluate(() => {
    NINJA.progress.buys.gold = 1;
    localStorage.setItem('ninjaMasterSaveV2', JSON.stringify({ v: 4, ...NINJA.progress }));
  });
  await page.reload(); await open(page);
  assert.equal(await page.locator('#customizer-suit input:disabled, #customizer-headband input:disabled, #customizer-belt input:disabled').count(), 18);
  assert.match(await page.locator('#customizer-gold-note').textContent(), /coins still count double/);
  await choose(page, 'headwear', 'cap'); await page.locator('#customizer-apply').click();
  assert.match(await page.locator('#customizer-preview').getAttribute('aria-label'), /Gold Ninja.*Trail cap/);
  await checkNewHeadwear(page, engine, false, true);
  await page.locator('#customizer-back').click();
  for (let i = 0; i < 48; i++) {
    await page.evaluate(i => { NINJA.goTo(i); NINJA.player.invuln = 9999; }, i);
    await frames(page);
    assert.equal(await page.evaluate(() => NINJA.game.mode), 'play', 'level ' + i);
  }
  assert.deepEqual(errors, []);
  await context.close();
  results.push(engine + ': desktop keyboard, modal focus/return, named colours, all four new headwear IDs apply/reload with full distinct previews (normal and Gold Ninja), discard/reset, bad save, storage failure and all 48 levels pass.');
}

async function touch(browser, engine, viewport) {
  const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const errors = [];
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await frames(page);
  await checkTargets(page, '#topbar button, #topbar a');
  await open(page, true);
  await choose(page, 'suit', 'moss', true); await choose(page, 'headwear', 'sprout', true);
  await checkTargets(page, '.customizer-actions button');
  const labelSizes = await page.locator('.customizer-choice').evaluateAll(labels => labels.map(el => {
    const r = el.getBoundingClientRect(); return { w: r.width, h: r.height };
  }));
  assert.ok(labelSizes.every(r => r.w >= 44 && r.h >= 44), 'touch choices at least 44px');
  const clipped = await page.locator('.customizer-choice').evaluateAll(labels => labels.filter(label => {
    const r = label.getBoundingClientRect();
    return Array.from(label.children).some(child => {
      const c = child.getBoundingClientRect();
      return c.x < r.x || c.right > r.right || c.y < r.y || c.bottom > r.bottom;
    });
  }).map(label => label.textContent));
  assert.deepEqual(clipped, [], 'choice labels must not clip or overlap');
  assert.equal(await page.locator('#customizer').evaluate(el => el.scrollWidth <= el.clientWidth), true, 'no horizontal scroll');
  await screenshot(page, engine + '-touch-' + viewport.width);
  await page.locator('#customizer-apply').tap();
  assert.match(await page.locator('#customizer-status').textContent(), /applied and saved/);
  await page.locator('#customizer-back').tap();
  await page.reload(); await frames(page);
  assert.equal(await page.evaluate(() => NinjaLooks.current().headwear), 'sprout');
  await checkNewHeadwear(page, engine, true);
  const canvas = await page.locator('#game').boundingBox();
  await page.touchscreen.tap(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2); await frames(page);
  assert.equal(await page.evaluate(() => NINJA.game.mode), 'worlds');
  await tapMenu(page, 'world', 0); await tapMenu(page, 'play');
  await page.waitForFunction(() => NINJA.game.mode === 'play');
  await page.locator('#btn-pause').tap(); await page.waitForFunction(() => NINJA.game.mode === 'paused');
  await checkTargets(page, '#topbar button, #topbar a');
  await open(page, true);
  const frozen = await page.evaluate(() => JSON.stringify([NINJA.player, NINJA.enemies, NINJA.game.timer]));
  await choose(page, 'headwear', 'crest', true); await page.locator('#customizer-apply').tap();
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => JSON.stringify([NINJA.player, NINJA.enemies, NINJA.game.timer])), frozen);
  await page.locator('#customizer-back').tap();
  assert.equal(await page.evaluate(() => NINJA.game.mode), 'paused');
  await tapMenu(page, 'pause', 0); await page.waitForFunction(() => NINJA.game.mode === 'play');
  assert.equal(await page.evaluate(() => NINJA.input.jumpHeld), false);
  await checkTargets(page, '#pad button, #topbar button, #topbar a');
  await page.evaluate(() => {
    NINJA.goTo(2); NINJA.player.x = 15 * 16 - 11; NINJA.player.y = 17 * 16 - 15;
    NINJA.player.vy = 0; NINJA.player.facing = 1; NINJA.player.invuln = 9999;
  });
  await page.locator('#btn-dig').tap(); await frames(page, 4);
  assert.equal(await page.evaluate(() => NINJA.level.grid[16][15]), '.');
  await page.evaluate(() => { NINJA.goTo(0); NINJA.player.invuln = 9999; });
  await frames(page, 6);
  const x = await page.evaluate(() => NINJA.player.x);
  const right = await page.locator('#btn-right').boundingBox();
  await page.mouse.move(right.x + right.width / 2, right.y + right.height / 2);
  await page.mouse.down(); await frames(page, 8); await page.mouse.up();
  assert.ok(await page.evaluate(() => NINJA.player.x) > x, 'holding the move button must move the ninja');
  await page.locator('#btn-jump').tap(); await frames(page, 2);
  assert.ok(await page.evaluate(() => NINJA.player.vy) < 0, 'touch jump must lift the ninja');
  assert.deepEqual(errors, []);
  await context.close();
  results.push(engine + ': touch ' + viewport.width + 'x' + viewport.height +
    ', all four new headwear choices tap/apply/reload with full previews, ' +
    (viewport.width === 320 ? 'small-screen keyboard selection, ' : '') +
    'scroll, 44px targets, pause/customize/resume without input bleed, touch dig/jump and pointer-hold move pass.');
}

async function main() {
  if (output) fs.mkdirSync(output, { recursive: true });
  for (const engine of ['chromium', 'webkit']) {
    const browser = await playwright[engine].launch({ headless: true });
    try {
      await desktop(browser, engine);
      for (const viewport of [
        { width: 768, height: 1024 }, { width: 1024, height: 768 },
        { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }
      ]) await touch(browser, engine, viewport);
    } finally { await browser.close(); }
  }
  if (output) fs.writeFileSync(path.join(output, 'customizer-results.json'), JSON.stringify({ url, results }, null, 2) + '\n');
  console.log(results.join('\n'));
}

main().catch(error => { console.error(error); process.exitCode = 1; });

'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
const save = { v: 4, max: 19, best: 700, gems: { 0: 7 }, coins: 230,
  spentGems: 0, buys: { ice: 1 }, medals: { 0: 5 } };

async function frames(page) {
  await page.evaluate(async () => {
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
  });
}

async function use(page, id, touch) {
  if (touch) await page.locator('#' + id).tap();
  else {
    await page.locator('#' + id).focus();
    await page.keyboard.press('Enter');
  }
  await frames(page);
}

async function choose(page, group, id, touch) {
  const radio = page.locator('#customizer-' + group + ' input[value="' + id + '"]');
  if (touch) await radio.locator('..').tap();
  else { await radio.focus(); await page.keyboard.press('Space'); }
  assert.equal(await radio.isChecked(), true);
}

async function controls(page) {
  const boxes = await page.locator('#topbar button, #topbar a, #custom-playbar button').evaluateAll(nodes =>
    nodes.filter(el => el.getClientRects().length).map(el => {
      const r = el.getBoundingClientRect();
      return { id: el.id || el.textContent, x: r.x, y: r.y, w: r.width, h: r.height };
    }));
  const view = page.viewportSize();
  for (const a of boxes) {
    assert.ok(a.w >= 44 && a.h >= 44, 'small target ' + a.id);
    assert.ok(a.x >= 0 && a.y >= 0 && a.x + a.w <= view.width + 1 &&
      a.y + a.h <= view.height + 1, 'offscreen ' + a.id);
    for (const b of boxes.filter(b => b !== a)) {
      assert.ok(!(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h &&
        a.y + a.h > b.y), 'overlap ' + a.id + '/' + b.id);
    }
  }
}

async function run(browser, engine, viewport, gold) {
  const touch = viewport.width < 600;
  const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch });
  try {
    const seed = structuredClone(save);
    if (gold) seed.buys.gold = 1;
    await context.addInitScript(seed => {
      if (!localStorage.getItem('ninjaMasterSaveV2')) {
        localStorage.setItem('ninjaMasterSaveV2', JSON.stringify(seed));
      }
      window.campaignWrites = [];
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'ninjaMasterSaveV2') window.campaignWrites.push(value);
        return set.call(this, key, value);
      };
    }, seed);
    const errors = [], page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url); await frames(page);
    const initial = await page.evaluate(() => ({
      bytes: localStorage.getItem('ninjaMasterSaveV2'), memory: JSON.stringify(NINJA.progress)
    }));
    async function unchanged() {
      assert.deepEqual(await page.evaluate(() => ({
        bytes: localStorage.getItem('ninjaMasterSaveV2'), memory: JSON.stringify(NINJA.progress)
      })), initial, 'campaign bytes and memory stay unchanged');
      assert.deepEqual(await page.evaluate(() => campaignWrites), [], 'no campaign write attempts');
    }
    await controls(page);
    await use(page, 'btn-customizer', touch);
    if (!gold) await choose(page, 'suit', 'ocean', touch);
    else {
      assert.match(await page.locator('#customizer-gold-note').textContent(), /coins still count double/);
      assert.equal(await page.locator('#customizer-suit input:disabled').count(), 6);
    }
    await choose(page, 'headwear', 'cat-ears', touch);
    await use(page, 'customizer-apply', touch);
    await use(page, 'customizer-back', touch);
    await unchanged();
    await page.reload(); await frames(page);
    assert.equal(await page.evaluate(() => NinjaLooks.current().headwear), 'cat-ears');
    await use(page, 'btn-editor', touch);
    assert.equal(await page.evaluate(() => NINJA.game.mode), 'editor');
    await page.locator('#editor-name').fill('Same draft');
    await page.locator('#editor-name').press('Tab');
    await page.locator('#editor-palette button[data-tile="o"]').click();
    await page.locator('#editor-grid').focus();
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await use(page, 'editor-save', touch);
    const saved = await page.evaluate(() => localStorage.getItem('ninjaMasterLevelSlot1'));
    assert.equal(JSON.parse(saved).rows[13][4], 'o');
    // Keep an unsaved change too, so return-to-editor cannot just reload the slot.
    await page.locator('#editor-palette button[data-tile="g"]').click();
    await page.locator('#editor-grid').focus();
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Space');
    await use(page, 'editor-test', touch);
    await page.waitForFunction(() => NINJA.game.mode === 'play');
    assert.equal(await page.evaluate(() => NINJA.customPlaying), true);
    assert.equal(await page.evaluate(() => NINJA.level.name), 'Same draft');
    assert.equal(await page.evaluate(() => NINJA.gems.length), 1);
    await page.evaluate(() => {
      NINJA.player.x = 4 * 16; NINJA.player.y = 13 * 16 + 1;
      NINJA.player.vx = 0; NINJA.player.vy = 0;
    });
    await page.waitForFunction(() => NINJA.game.runCoins > 0);
    assert.equal(await page.evaluate(() => NINJA.game.runCoins), gold ? 2 : 1);
    await page.evaluate(() => { NINJA.level.grid[14][6] = '.'; });
    await use(page, 'custom-retry', touch);
    await page.waitForFunction(() => NINJA.game.mode === 'play');
    assert.equal(await page.evaluate(() => NINJA.level.grid[14][6]), '#');
    await use(page, 'btn-pause', touch);
    await page.waitForFunction(() => NINJA.game.mode === 'paused');
    await controls(page);
    assert.equal(await page.locator('#btn-customizer').isVisible(), true,
      'MY NINJA must stay available from paused custom play');
    const paused = await page.evaluate(() => JSON.stringify([NINJA.game, NINJA.player, NINJA.enemies, NINJA.hazards]));
    await use(page, 'btn-customizer', touch);
    for (const code of ['ArrowRight', 'KeyC', 'KeyX', 'KeyP']) await page.keyboard.press(code);
    await choose(page, 'headwear', 'centurion', touch);
    if (process.env.BROWSER_CHECK_OUTPUT) {
      await fs.mkdir(process.env.BROWSER_CHECK_OUTPUT, { recursive: true });
      await page.screenshot({ path: path.join(process.env.BROWSER_CHECK_OUTPUT,
        engine + '-' + viewport.width + (gold ? '-gold' : '') + '-paused-picker.png') });
    }
    await use(page, 'customizer-apply', touch);
    await use(page, 'customizer-back', touch);
    assert.equal(await page.evaluate(() => NINJA.game.mode), 'paused');
    assert.equal(await page.evaluate(() => JSON.stringify([NINJA.game, NINJA.player, NINJA.enemies, NINJA.hazards])), paused);
    assert.equal(await page.evaluate(() => Object.values(NINJA.input).every(v => v === false)), true);
    assert.equal(await page.evaluate(() => NinjaLooks.current().headwear), 'centurion');
    assert.equal(await page.evaluate(() => NINJA.owns('gold')), gold ? 1 : 0);
    await unchanged();
    await use(page, 'btn-pause', touch);
    await page.waitForFunction(() => NINJA.game.mode === 'play');
    assert.equal(await page.evaluate(() => NINJA.input.jumpHeld), false);
    await use(page, 'custom-edit', touch);
    assert.equal(await page.evaluate(() => NINJA.game.mode), 'editor');
    assert.equal(await page.locator('#editor-name').inputValue(), 'Same draft');
    assert.equal(await page.evaluate(() => localStorage.getItem('ninjaMasterLevelSlot1')), saved);
    await use(page, 'editor-save', touch);
    const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('ninjaMasterLevelSlot1')));
    assert.equal(draft.rows[13][4], 'o'); assert.equal(draft.rows[13][5], 'g');
    assert.equal(draft.name, 'Same draft'); assert.equal(draft.v, 1);
    await use(page, 'editor-close', touch);
    assert.equal(await page.evaluate(() => NINJA.game.mode), 'title');
    await unchanged();
    await page.reload(); await frames(page);
    assert.equal(await page.evaluate(() => NinjaLooks.current().headwear), 'centurion');
    await use(page, 'btn-editor', touch); await use(page, 'editor-load', touch);
    await use(page, 'editor-save', touch);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('ninjaMasterLevelSlot1'))), draft);
    await unchanged();
    assert.deepEqual(errors, []);
    console.log('PASS ' + engine + ' ' + viewport.width + 'x' + viewport.height + (gold ? ' Gold Ninja' : ' normal') +
      ': look persistence, editor test/retry, paused customizer, no input bleed, same draft, campaign bytes/memory.');
  } finally { await context.close(); }
}

async function main() {
  for (const engine of ['chromium', 'webkit']) {
    const browser = await playwright[engine].launch({ headless: true });
    try {
      for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
        for (const gold of [false, true]) await run(browser, engine, viewport, gold);
      }
    } finally { await browser.close(); }
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out = process.env.EDITOR_ARTIFACTS || fs.mkdtempSync(path.join(os.tmpdir(), 'ninja-editor-'));
fs.mkdirSync(out, { recursive: true });
const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
const save = { v: 4, max: 19, best: 700, gems: { 0: 7 }, coins: 230, spentGems: 0, buys: { ice: 1 }, medals: { 0: 5 } };
const results = [];

async function frames(page, count = 3) {
  await page.evaluate(async count => {
    for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame);
  }, count);
}
async function cell(page, x, y) {
  return page.evaluate(({ x, y }) => {
    const grid = document.getElementById('editor-grid'), board = document.getElementById('editor-board');
    const panel = document.getElementById('level-editor');
    board.scrollLeft = (x + 0.5) * grid.clientWidth / 24 - board.clientWidth / 2;
    let r = grid.getBoundingClientRect();
    const target = r.top + (y + 0.5) * r.height / 17;
    panel.scrollTop += target - innerHeight * 0.55;
    r = grid.getBoundingClientRect();
    return { x: r.left + (x + 0.5) * r.width / 24, y: r.top + (y + 0.5) * r.height / 17 };
  }, { x, y });
}
async function button(page, id, touch) {
  if (touch) await page.locator('#' + id).tap();
  else await page.locator('#' + id).click();
  await frames(page);
}
async function paint(page, tile, x, y, touch) {
  const b = page.locator('#editor-palette button').filter({ has: page.locator('[aria-hidden="true"]', { hasText: tile }) });
  const selector = page.locator('#editor-palette button').filter({ hasText: ({
    '.': 'Erase', '#': 'Earth', o: 'Coin', '=': 'Ledge', F: 'Flag', P: 'Start', '4': 'Laser'
  })[tile] });
  assert.equal(await b.count() > 0, true);
  if (touch) await selector.tap(); else await selector.click();
  const p = await cell(page, x, y);
  if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
  await frames(page);
}
async function saved(page, touch) {
  await button(page, 'editor-save', touch);
  assert.match(await page.locator('#editor-status').textContent(), /Saved to Level 1/);
  return page.evaluate(() => JSON.parse(localStorage.getItem('ninjaMasterLevelSlot1')));
}
async function pauseChoice(page, i, touch) {
  await button(page, 'btn-pause', touch);
  const point = await page.evaluate(i => {
    const h = NINJA.menuHits.find(h => h.act === 'pause' && h.i === i);
    if (!h) throw Error('Missing pause action');
    const r = document.getElementById('game').getBoundingClientRect();
    return { x: r.left + (h.x + h.w / 2) * r.width / 384, y: r.top + (h.y + h.h / 2) * r.height / 272 };
  }, i);
  if (touch) await page.touchscreen.tap(point.x, point.y); else await page.mouse.click(point.x, point.y);
  await frames(page);
}

async function run(engine) {
  const browser = await playwright[engine].launch({ headless: true });
  try {
    for (const viewport of [
      { width: 1280, height: 900 }, { width: 768, height: 1024 }, { width: 1024, height: 768 },
      { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }
    ]) {
      const touch = viewport.width !== 1280;
      const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
      await context.addInitScript(save => {
        if (!localStorage.getItem('ninjaMasterSaveV2')) localStorage.setItem('ninjaMasterSaveV2', JSON.stringify(save));
        window.campaignWrites = [];
        const write = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (key === 'ninjaMasterSaveV2') window.campaignWrites.push(value);
          return write.call(this, key, value);
        };
      }, save);
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(url); await frames(page);
      const campaign = await page.evaluate(() => localStorage.getItem('ninjaMasterSaveV2'));
      await button(page, 'btn-editor', touch);
      assert.equal(await page.evaluate(() => NINJA.game.mode), 'editor');
      assert.equal(await page.locator('#stage').isVisible(), false, 'game controls cannot take editor keyboard focus');
      await page.locator('#editor-name').fill('Moon path');
      await page.locator('#editor-world').selectOption('1');
      await paint(page, 'o', 4, 13, touch);
      let draft = await saved(page, touch);
      assert.equal(draft.rows[13][4], 'o'); assert.equal(draft.name, 'Moon path'); assert.equal(draft.world, 1);
      await paint(page, '.', 4, 13, touch);
      assert.equal((await saved(page, touch)).rows[13][4], '.');
      await button(page, 'editor-undo', touch);
      assert.equal((await saved(page, touch)).rows[13][4], 'o');
      await paint(page, '4', 7, 13, touch);
      await button(page, 'editor-test', touch);
      await page.waitForFunction(() => NINJA.game.mode === 'play');
      assert.equal(await page.evaluate(() => NINJA.customPlaying), true);
      assert.equal(await page.evaluate(() => NINJA.level.world), 1);
      assert.equal(await page.evaluate(() => NINJA.weaponBoxes[0].kind), 'laser');
      if (touch) {
        await button(page, 'btn-jump', true);
      } else {
        await page.keyboard.press('Space'); await frames(page);
      }
      assert.ok(await page.evaluate(() => NINJA.player.vy < 0));
      await page.evaluate(() => { NINJA.level.grid[14][6] = '.'; });
      await button(page, 'custom-retry', touch);
      await page.waitForFunction(() => NINJA.game.mode === 'play');
      assert.equal(await page.evaluate(() => NINJA.level.grid[14][6]), '#');
      const boxes = await page.evaluate(() => Array.from(document.querySelectorAll('#custom-playbar button, #topbar button, #pad button'))
        .filter(el => el.getClientRects().length).map(el => {
          const r = el.getBoundingClientRect(); return { id: el.id, x: r.x, y: r.y, w: r.width, h: r.height };
        }));
      for (const b of boxes) {
        assert.ok(b.w >= 44 && b.h >= 44, 'small target ' + b.id);
        assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= viewport.width + 1 && b.y + b.h <= viewport.height + 1, 'offscreen ' + b.id);
        for (const other of boxes.filter(o => o.id !== b.id)) {
          assert.ok(!(b.x < other.x + other.w && b.x + b.w > other.x && b.y < other.y + other.h && b.y + b.h > other.y), 'overlap ' + b.id + '/' + other.id);
        }
      }
      await page.screenshot({ path: path.join(out, engine + '-custom-' + viewport.width + '.png') });
      await pauseChoice(page, 0, touch);
      await page.waitForFunction(() => NINJA.game.mode === 'play');
      await pauseChoice(page, 1, touch);
      await page.waitForFunction(() => NINJA.game.mode === 'play');
      await pauseChoice(page, 2, touch);
      assert.equal(await page.evaluate(() => NINJA.game.mode), 'editor');
      draft = await saved(page, touch);
      assert.equal(draft.rows[13][7], '4', 'return keeps the unsaved draft, not dug test tiles');
      await page.reload(); await frames(page);
      await button(page, 'btn-editor', touch); await button(page, 'editor-load', touch);
      assert.equal(await page.locator('#editor-name').inputValue(), 'Moon path');
      assert.equal(await page.locator('#editor-world').inputValue(), '1');
      assert.deepEqual(await saved(page, touch), draft, 'real page reload and slot load');
      assert.equal(await page.evaluate(() => document.getElementById('level-editor').scrollWidth <= innerWidth), true, 'page has no horizontal overflow');
      const controls = await page.locator('#editor-palette button, #editor-test, #editor-close, #editor-save, #editor-load').evaluateAll(nodes =>
        nodes.map(el => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height }; }));
      assert.ok(controls.every(r => r.w >= 44 && r.h >= 44), 'editor control hit areas');
      assert.ok(await page.locator('#editor-grid').evaluate(el => el.clientWidth / 24 >= 24), 'paint cells at least 24px');
      if (engine === 'chromium' && viewport.width === 768) {
        await page.locator('#editor-palette button').filter({ hasText: 'Coin' }).tap();
        const a = await cell(page, 4, 11), b = await cell(page, 8, 11);
        const cdp = await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y, id: 1 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: b.x, y: b.y, id: 1 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await frames(page);
        assert.equal((await saved(page, true)).rows[11].slice(4, 9), 'ooooo', 'native touch drag paints every cell');
        await button(page, 'editor-undo', true);
        assert.equal((await saved(page, true)).rows[11].slice(4, 9), '.....', 'native touch stroke has one undo');
        await cdp.detach();
        results.push('chromium 768x1024: native touch drag paints a continuous stroke and one Undo removes it.');
      }
      if (touch && viewport.width < 576) {
        await button(page, 'editor-pan', true);
        assert.equal(await page.locator('#editor-grid').evaluate(el => getComputedStyle(el).touchAction), 'pan-x pan-y');
        if (engine === 'chromium') {
          const point = await cell(page, 8, 13);
          const before = await page.locator('#editor-board').evaluate(el => el.scrollLeft);
          const cdp = await context.newCDPSession(page);
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y, id: 1 }] });
          for (let distance = 20; distance <= 100; distance += 20) {
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x - distance, y: point.y, id: 1 }] });
          }
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await frames(page);
          assert.ok(await page.locator('#editor-board').evaluate(el => el.scrollLeft) > before, 'Move view scrolls by native touch');
          await cdp.detach();
        }
        await button(page, 'editor-pan', true);
      }
      await page.locator('#level-editor').evaluate(el => { el.scrollTop = 0; });
      await page.screenshot({ path: path.join(out, engine + '-editor-' + viewport.width + '.png') });

      if (!touch) {
        await page.locator('#editor-palette button').filter({ hasText: 'Coin' }).click();
        await cell(page, 2, 13); await page.locator('#editor-grid').focus();
        await page.keyboard.press('ArrowRight'); await page.keyboard.press('Space');
        assert.ok(await page.locator('#editor-grid').evaluate(el => {
          const r = el.getBoundingClientRect();
          return r.top + 14 * r.height / 17 <= innerHeight - 8;
        }), 'keyboard cursor stays in view while the grid scrolls');
        assert.equal((await saved(page, false)).rows[13][3], 'o', 'keyboard arrows move the grid cursor');
        await page.locator('#editor-grid').focus(); await page.keyboard.press('Delete');
        assert.equal((await saved(page, false)).rows[13][3], '.');
        await page.locator('#editor-grid').focus(); await page.keyboard.press('Control+z');
        assert.equal((await saved(page, false)).rows[13][3], 'o');
        await paint(page, '=', 5, 10, false);
        const a = await cell(page, 5, 10), b = await cell(page, 9, 10);
        await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 2 }); await page.mouse.up();
        assert.equal((await saved(page, false)).rows[10].slice(5, 10), '=====', 'fast drag fills gaps');
        await button(page, 'editor-undo', false);
        assert.equal((await saved(page, false)).rows[10].slice(5, 10), '=....', 'one stroke has one undo');
        await paint(page, '.', 2, 13, false); await button(page, 'editor-test', false);
        assert.match(await page.locator('#editor-status').textContent(), /one Start/);
        await button(page, 'editor-undo', false);
        await paint(page, '#', 10, 0, false);
        const bottom = await cell(page, 10, 13);
        await page.mouse.move(bottom.x, bottom.y); await page.mouse.down();
        for (let y = 12; y >= 0; y--) {
          const p = await cell(page, 10, y);
          await page.mouse.move(p.x, p.y); await frames(page, 1);
        }
        await page.mouse.up();
        await button(page, 'editor-test', false);
        assert.equal(await page.locator('#editor-warning').isVisible(), true);
        assert.match(await page.locator('#editor-warning-text').textContent(), /No clear path.*miss/);
        await button(page, 'editor-anyway', false); await page.waitForFunction(() => NINJA.game.mode === 'play');
        await button(page, 'custom-edit', false);
        await button(page, 'editor-undo', false); await button(page, 'editor-undo', false);
        await button(page, 'editor-test', false); await page.waitForFunction(() => NINJA.game.mode === 'play');
        await page.evaluate(() => {
          NINJA.player.x = NINJA.flag.x; NINJA.player.y = NINJA.flag.y + 32;
          NINJA.player.vx = 0; NINJA.player.vy = 0;
        });
        await page.waitForFunction(() => NINJA.game.mode === 'clear');
        await page.evaluate(() => { NINJA.game.timer = 1000; }); await frames(page, 5);
        assert.equal(await page.evaluate(() => NINJA.game.mode), 'clear');
        await page.keyboard.press('Space'); await page.waitForFunction(() => NINJA.game.mode === 'play');
        await page.evaluate(() => { NINJA.game.hearts = 1; NINJA.player.y = NINJA.level.pxH + 100; });
        await page.waitForFunction(() => NINJA.game.mode === 'gameover');
        await button(page, 'custom-retry', false); await page.waitForFunction(() => NINJA.game.mode === 'play');
        await button(page, 'custom-edit', false);
        const before = await saved(page, false);
        for (const bad of ['{', JSON.stringify({ v: 1, name: 'Bad', world: 99, rows: ['P.F'] }), 'x'.repeat(4097)]) {
          await page.evaluate(bad => localStorage.setItem('ninjaMasterLevelSlot1', bad), bad);
          await button(page, 'editor-load', false);
          assert.equal(await page.locator('#editor-status').getAttribute('data-error'), 'true');
          assert.deepEqual(await saved(page, false), before, 'bad slot cannot replace draft');
        }
        await page.evaluate(() => {
          const original = Storage.prototype.setItem;
          window.restoreStorage = () => { Storage.prototype.setItem = original; };
          Storage.prototype.setItem = function () { throw new DOMException('Full', 'QuotaExceededError'); };
        });
        await button(page, 'editor-save', false);
        assert.match(await page.locator('#editor-status').textContent(), /Not saved/);
        await page.evaluate(() => window.restoreStorage());
        await page.evaluate(() => {
          window.storageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
          Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Blocked', 'SecurityError'); } });
        });
        await button(page, 'editor-load', false);
        assert.match(await page.locator('#editor-status').textContent(), /Cannot access device storage/);
        await page.evaluate(() => Object.defineProperty(window, 'localStorage', window.storageDescriptor));
        results.push(engine + ': keyboard paint/erase, whole-stroke undo, start checks, no-path warning, real flag completion, death/retry, malformed/oversize storage, quota and storage access errors pass.');
      }
      await button(page, 'editor-close', touch);
      assert.equal(await page.evaluate(() => NINJA.game.mode), 'title');
      assert.equal(await page.evaluate(() => localStorage.getItem('ninjaMasterSaveV2')), campaign);
      assert.deepEqual(await page.evaluate(() => window.campaignWrites), []);
      assert.deepEqual(await page.evaluate(() => JSON.parse(JSON.stringify(NINJA.progress))),
        Object.fromEntries(Object.entries(save).filter(([key]) => key !== 'v')));
      assert.deepEqual(errors, []);
      results.push(engine + ' ' + viewport.width + 'x' + viewport.height + ': ' + (touch ? 'native touch' : 'desktop') +
        ' paint/erase, undo, theme, save/reload, test jump, retry and all pause choices pass. Campaign bytes and in-memory progress unchanged. Targets fit and do not overlap.');
      await context.close();
    }
  } finally { await browser.close(); }
}
(async function () {
  for (const engine of ['chromium', 'webkit']) await run(engine);
  fs.writeFileSync(path.join(out, 'editor-browser-results.json'), JSON.stringify({ url, results }, null, 2) + '\n');
  console.log(results.join('\n') + '\nArtifacts: ' + out);
})().catch(e => { console.error(e); process.exitCode = 1; });

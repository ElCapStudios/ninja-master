# Agent instructions

Ninja Master is a static browser game. `index.html` loads local JavaScript and
CSS. Campaign progress and level drafts stay in browser storage. Keep the game
self-contained and usable without AI. The current runtime has no AI provider,
server, or external API caller.

## Fast checks

Run these from the repository root:

```sh
node tools/checkgame.cjs
node tools/checklevels.cjs
node tools/checkeditor.cjs
```

These checks use Node.js built-ins and need no package install. The repository
has no package manifest, lockfile, or declared Node.js version. Do not add a
version claim without checking the supported environment.

For browser UI changes, run the matching check when Playwright with Chromium
and WebKit is already available:

```sh
node tools/checkcustomizer-browser.cjs
node tools/checkeditor-browser.cjs
node tools/checkintegration-browser.cjs
```

The browser checks open local files. See the README section "Editor and game
checks" for coverage and optional output settings. `tools/genlevels.cjs`
rewrites `levels.js`; run it only when intentionally regenerating campaign
levels, then run `node tools/checklevels.cjs`.

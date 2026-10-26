# Ninja Master

A platform game you can play in any web browser: phone, tablet, laptop.

**Play it here:** https://elcapstudios.github.io/ninja-master/

The first version of the game is still there: https://elcapstudios.github.io/ninja-master/v1/

## How to play

You are a ninja. Get to the red flag at the end of each level.

There are **8 worlds**. Each world has **6 levels**. That is **48 levels**.
The last level in each world is a **boss fight**.

### Keyboard

| Key | What it does |
| --- | --- |
| Arrow Left / Right, or A / D | Move. In a menu it moves the yellow box |
| Space, Up arrow, or W | Jump. Hold it to jump higher. It also climbs up a ladder |
| Down arrow, or S | Climb down a ladder. In a menu it moves down |
| Enter | In a menu it picks the thing. In a level it fires your weapon |
| X, J, K or Shift | Fire your weapon. In a menu it goes back |
| P or Escape | Pause or resume a level. Escape goes back in menus |
| C | Hold to dig. Hold Up or Down to aim above or below |
| H | On a maze level, turn the green arrows off and on |

### Touch screen

Big round buttons appear on the screen.

- Left side: **left**, **down** (the small blue one), **right**.
- Right side: **STAR** to fire, **JUMP** to jump.
- **DIG**, above STAR: hold to dig. Hold DOWN to dig below, or JUMP to dig above.

Hold JUMP to jump higher. Hold JUMP on a ladder to climb up. Hold the small
blue down button to climb down.

On a map, tap a world or level dot to choose it. Tap it again, or use
**EXPLORE** or **PLAY**, to enter it.

While you play, tapping anywhere on the game makes you jump.

Tap **PAUSE** or **MENU** at the top to pause. You can resume, restart the
level, or return to the map. The game also pauses when you leave its tab.
It waits for you to resume, so switching apps cannot cost you a heart.

## Make a level

Choose **MAKE LEVEL** at the top of the title or map screen.
You start with a safe floor, one Start and one Flag.
The editor uses the same tiles and world colors as the game.

1. Pick a tile, then tap or drag on the grid to paint. **Erase** removes tiles.
2. Choose a world and give your level a name.
3. Choose **Level 1**, **Level 2** or **Level 3**, then **Save draft**.
4. Choose **Test level**. Use the normal touch buttons or keyboard to play.
5. Choose **EDIT LEVEL** to return to the same draft. **TRY AGAIN** resets
   the test. Pause also has restart and **BACK TO EDITOR**.

The grid has **24 columns and 17 rows**. It does not resize.
**Start** and **Flag** move when you place them again, so each has one spot.
Put both on a floor or ladder, away from the top and side edges.
The editor has 18 tile tools. A test can have up to 3 gems, 16 zombies and
64 items in all, so it stays small for older tablets.

On a small phone, turn **Move view** on to scroll the grid, then turn it off
to paint. Each tile stays at least 24 pixels wide. **Undo** brings back the
last change or whole paint stroke. It keeps up to 30 changes, including a
loaded slot or **Fresh floor**.

With a keyboard, use Tab to focus the grid. Arrows move the yellow box.
Space or Enter paints. Delete or Backspace erases. Ctrl+Z (Command+Z on a Mac)
undoes. Tab also reaches the tile tools, settings and save buttons.
Escape returns to the game menu without losing the open draft.

Drafts stay in this browser on this device. Save before closing the page.
A saved draft can be unfinished. **Load slot** restores it after a page
reload. Check the save message: full or blocked storage cannot keep a draft.
Clearing browser data removes saved levels. There are no accounts, online
sharing or import/export tools.

Before a test, the editor checks the size, tile letters, theme, Start and
Flag. It uses the campaign checker's movement rules to look for a path.
**No clear path found** is a warning, not proof: the check can miss wall jumps
and digging. Add ledges or ladders, or choose **Test anyway**.

Test levels do not add campaign coins, gems, medals, shop items, best scores
or unlocked levels. Death, retry, completion and exit all stay in test mode.
Your campaign map choice and the `ninjaMasterSaveV2` save stay unchanged.
Custom slots use separate keys, `ninjaMasterLevelSlot1` through
`ninjaMasterLevelSlot3`. The old game in `/v1/` is unchanged.

## Dig your own route

Hold **C** or **DIG** to cut through earth and cracked walls. Digging has no
ammo cost. Most weapons chip earth too. Stars need two hits, while a laser
cuts through in one. Rockets and bombs make round holes.

Dark cracks mark earth you can dig. Small bright studs mark firm rock.
Thin ledges, springs, ladders, doors, level edges and boss floors stay firm.
In mazes, walls can open into nearby rooms, but the old ledges stay in place.
In running levels, you can cut shallow trenches in open ground. Firm steps
remain so you can jump back out. Low tunnels, hazards and hidden gems keep
their footing. Restarting a level puts all of its terrain back.

Ice and flame do not cut earth. Enemy shots do not change terrain.
Dust, stone chips and a short break sound show each block you remove.

## Stronger hits and clear warnings

Big hits stop the action for a few frames. A boss defeat holds it a little
longer. Pause still works during this stop.

A yellow **!** appears above an enemy before it fires, jumps or dives.
Boss shots, jumps, warps and rage attacks also have this short warning.
Walking into an enemy still hurts, so keep some space.

## Moves

| Move | How |
| --- | --- |
| Jump | Press jump. **Hold** it to go higher. A tap is a small hop |
| Wall jump | Jump at a wall, hold towards the wall, then press jump again. You can go up a whole shaft this way |
| Wall slide | Hold towards a wall while you fall. You slide down slowly |
| Climb | Stand on a ladder and press up or down |
| Squash | Land on an enemy head |
| Fire | Press the fire key. Some enemies need a lot of hits |

Held jumps hang a little longer near the top. Jump height stays within one
pixel of the old height. Small head clips at a block corner can move you
sideways by up to 4 pixels, so the jump keeps going.

A wall kick works up to 3 pixels from the wall while you fall and hold
towards it. As before, you can kick off the same wall again. Each wall
slide refills one air jump. You can climb a lone wall or a shaft.

The ninja stretches at take-off and squashes on landing. Hard landings
squash more. This changes only the picture, not the hitbox.

## The worlds

| # | World | Code | Enemies | Boss |
| --- | --- | --- | --- | --- |
| 1 | Green Woods | LEAF | Zombie, Skeleton | Skull King |
| 2 | Frost Peak | SNOW | Snowman, Bat | Frost Giant |
| 3 | Sand Tomb | SAND | Scorpion, Mummy | Mummy Lord |
| 4 | Fire Keep | LAVA | Imp, Lava Blob | Fire Dragon |
| 5 | Shadow Fort | DARK | Shadow Ninja, Ghost | Shadow Master |
| 6 | Sky Temple | WIND | Harpy, Golem | Storm Bird |
| 7 | Deep Cave | GEMS | Crab, Slime | Crystal Queen |
| 8 | Iron Works | IRON | Sentry, Drone | Iron Titan |

## Weapons

You start with **ninja stars**. You never run out of them.

Walk into a **weapon box** to swap to a new weapon. You keep it until the ammo
runs out, then you go back to ninja stars. This works like Broforce: you take
what you find and you use it.

| Weapon | Damage | Ammo | What it does |
| --- | --- | --- | --- |
| Ninja Star | 1 | never runs out | Your normal weapon |
| Shotgun | 1 | 14 | Fires 3 pellets in a spread. Very strong close up |
| Rocket | 4 | 6 | Big blast. Cuts a hole in earth and cracked blocks |
| Flame | 1 | 60 | A fast stream of fire. It burns **through** a whole line of enemies. Short range, about 6 tiles |
| Laser | 2 | 16 | Goes straight through enemies and soft earth |
| Boomerang | 2 | 12 | Flies out and comes back. It hits twice, once each way |
| Bombs | 3 | 10 | Falls in an arc. Cuts a hole in earth and cracked blocks |
| Ice Gun | 1 | 14 | **Buy it in the shop.** Turns an enemy into a block of ice. Stand on the block to get up high |

The weapon you hold is shown at the top left, with the ammo left.

### The Ice Gun

The Ice Gun is not in the game until you buy it in the shop. After that, ice
gun boxes show up in 14 places across the game.

- Shoot an enemy and it freezes into a **block of ice**.
- The block is solid on **top**. Jump on it to reach high places.
- A frozen enemy cannot move and cannot hurt you.
- It thaws after a few seconds. The block flashes just before it wakes up.
- Hit a frozen enemy with any other weapon and the block shatters.
- A **boss cannot be frozen**. It only slows down for a moment.
- The shot is weak, only 1 damage. It is for holding enemies still and for
  climbing, not for winning fights.

## The shop

Beat a level and the coins you picked up go into your **bank**. Now you can
spend them.

Go to **WORLD MAP**, then **SHOP**.

| Thing | Cost | What it does |
| --- | --- | --- |
| Heart Up | 60 coins | Start every level with 1 more heart. You can buy it 3 times |
| Second Wind | 120 coins | Once in a level, when your hearts run out, you come back with 2 hearts |
| Lucky Start | 150 coins | Begin every level holding a big weapon instead of ninja stars |
| Ice Gun | 6 gems | A new gun. See above |
| Gem Radar | 4 gems | Arrows at the edge of the screen point at gems you have not found |
| Gold Ninja | 10 gems | Your ninja wears a gold suit, and every coin you pick up is worth **two** |

Two things to know:

- Coins go in the bank when you **finish** a level. If you die, you lose that
  run's coins. Play the level again to get them again.
- Gems are spent, but the game still remembers you **found** them. Your gem
  count on the level screen never goes down.

## Medals

Every level has 3 medals. There are 144 in the whole game.

| Medal | How to get it |
| --- | --- |
| Red: **NO HIT** | Finish the level without losing a single heart |
| Green: **ALL GEMS** | Find all 3 gems in that level |
| Gold: **ALL COINS** | Pick up every coin in that level |

The dots at the bottom of each box on the level screen show the medals you
have. A grey dot means you have not got that one yet. The shop screen shows
your total.

## Enemies

Every enemy needs **more than one hit**. Small dots above its head show how
many hits it has left.

| Enemy | Hits | What it does |
| --- | --- | --- |
| Zombie | 2 | Walks slowly |
| Skeleton | 3 | Walks and throws bones |
| Snowman | 3 | Slow. Throws snowballs |
| Bat | 2 | Flies at you |
| Mummy | 4 | Very slow but tough |
| Scorpion | 2 | Runs fast |
| Imp | 2 | Hops at you |
| Lava Blob | 3 | Stays in one place and jumps straight up |
| Shadow Ninja | 3 | Fast. Throws darts |
| Ghost | 2 | Floats through walls |
| Harpy | 3 | Waits up high, then dives at you |
| Golem | 5 | Big, slow and very tough |
| Slime | 3 | Hops. When you beat it, it **splits into two** small ones |
| Crab | 4 | You can only hurt it by landing on its **head** |
| Drone | 3 | Floats through walls and fires bolts |
| Sentry | 4 | Carries a shield. Shots bounce off the front. Hit it from **behind**, or jump on it |

## Picking a level

From the title screen you go to **WORLD MAP**. Eight regions sit along a
linked sea route. Each has its own landmark, from woods and frozen peaks to
temples and iron towers. Cleared regions turn green. Pick a world to see its
six-stop trail. The ninja walks to the dot you choose. Each dot shows your
medals, and the panel shows its gems. Boss lairs mark the end of each trail.

- A level with a **lock** on it is not open yet.
- Finish a level and the next one opens.
- Beat a boss and the next **world** opens.
- A small green square means you already finished that level.
- The dots at the bottom of a box are your **medals** for that level.
- The **SHOP** button is on the world screen, next to I HAVE A CODE.

On the world screen the **left and right arrows** move over the 8 worlds, then
onto **I HAVE A CODE**, then onto **SHOP**. **SPACE** picks whichever one is
lit up. So every button works with a keyboard, and every button works with a
tap. Nothing on this screen needs a mouse or a finger only.

The game **remembers** what you have opened. It saves it in the browser, so it
is still there tomorrow. It saves on that device only.

### Codes

Each world has a 4 letter code. You see it on the level screen for that world,
and again when you beat a boss. The codes are in the world table above.

`BOSS` opens **every** level.

To use a code: title screen, then **I HAVE A CODE**. Type the 4 letters and
press Space, or tap the + and - boxes and then tap **GO**.

This is how you carry your place to another device, like from a laptop to a
phone.

## Rules

- You start with 5 hearts. You can get up to 8.
- Spikes and lava take a heart. You come back at the last **safe** spot, not at
  the start.
- An enemy takes a heart if it touches you.
- Coins give you points, **and** they are money. See the shop.
- The flag gives you 25 points.
- You get 1 heart back at the end of every level.
- When your hearts run out you can try the **same** level again with full
  hearts. You never lose your place.

## Things to find

| Thing | What it is |
| --- | --- |
| **Gem** | 3 hidden gems in every level. 144 in the whole game. Once you find one it is yours for ever, even if you die. Gems are also money in the shop |
| **Coin** | Points, and money. They go in the bank when you **finish** the level |
| **Key** | Opens the locked door in the same level |
| **Fake wall** | A block of rock you can **walk straight through**. There is always something behind it |
| **Cracked block** | Only a Rocket, a Laser or a Bomb can smash it |

The level screen shows how many gems you found in each world.

## Levels with layers

From world 1 onwards the levels are not a straight line. Many of them are
**mazes** with rooms above and below each other, joined by ladders and shafts.

If you take the wrong way you have to **go back** and try the other way. That
is meant to happen. It is not a bug.

Wall jumping is the way out of most deep shafts. Jump at one wall, then the
other, then back again.

Every jump in a maze is a jump you can make. The ledges are at least 4 tiles
wide, they are never more than 4 rows above the floor, and there is always a
free space at each side so you can get back off. No enemy stands on a tiny
ledge, and no enemy stands next to spikes or lava.

### The arrows show you the way

Maze levels are big, so the game helps you. Small arrows float in the air and
point the way you need to go.

- **Yellow arrows** point at the **key**. Get the key first.
- **Green arrows** point at the **flag**. That is the finish.

You only see the next few arrows, not the whole way. So you still have to do
the jumping and the fighting yourself. The arrows never point into spikes,
lava or a wall, and they never show you a secret room.

Press **H** to turn the arrows off if you want a harder game.

The arrows only appear on maze levels. Run levels and boss levels do not have
them, because you cannot get lost there.

## Power ups

Power ups are in boxes. Walk into a box to take it.

| Box | Name | What it does |
| --- | --- | --- |
| Pink heart | Heart | Gives you 1 heart back |
| Pink heart with a plus | Max Up | Gives you 1 more heart for ever, up to 8 |
| Yellow star | Star | For 8 seconds enemies die when you touch them |
| Blue boot | Jump Boots | For 14 seconds you jump higher and get a triple jump |
| Green cross | Rapid Stars | For 14 seconds you fire much faster |

Star power does **not** save you from spikes, lava or holes. Only from enemies.

The star is the strongest power up, so it sits in the **middle** of a level.
Not at the start, and not next to the flag where it would be no use.

**There is no star on a boss level.** With a star you could just run at the
boss and win, and that is no fun. On a boss level you get **Rapid Stars**
instead. It helps you, but you still have to dodge.

The small bars at the top right show how much time is left on each power up.

## Springs

A yellow spring on the ground throws you very high. Higher than any jump.

## The bosses

Boss levels have no flag. To finish one you must beat the boss.

Every boss has a green bar at the top. When the bar drops to half the boss goes
into **PHASE 2**. The bar glows red and says so.

In phase 2 the boss:

- turns red and moves faster
- attacks more often
- fires a **ring of 8 shots** all around itself, again and again

Keep moving in phase 2. Standing still is how you lose.

| Boss | Hits | What it does |
| --- | --- | --- |
| Skull King | 10 | Walks, jumps and spits bones |
| Frost Giant | 12 | Jumps high and slams. The slam sends ice along the ground. Jump over it |
| Mummy Lord | 12 | Throws wraps and calls small mummies to help |
| Fire Dragon | 11 | Flies. Drops fire, then swoops past you |
| Shadow Master | 13 | Vanishes and comes back somewhere else. You cannot hit it while it is see-through |
| Storm Bird | 13 | Flies in circles above you and drops feather blades. Then it dives at your own height. That is when you hit it |
| Crystal Queen | 14 | Puts up a magic shield. While it is up your shots bounce off, so **jump on her head** |
| Iron Titan | 16 | Slow and very tough. Fires bolts and stamps the ground |

Jump on a boss head, or hit it with your weapon.

Every boss arena has hearts and a weapon. There is **no star** on a boss level,
so you have to fight it properly.

## Make your own levels

`levels.js` is made by a helper program. Do not edit it by hand.

Open `tools/genlevels.cjs`. Levels are built out of **chunks**: small pieces
like `coin-arc`, `spike-step`, `spring-pit` or `flyer-hole`. A level is a list
of chunks joined together.

Run it:

```powershell
node tools\genlevels.cjs
```

It checks every rule for you. If a level is broken it tells you which tile is
wrong and does not save.

Then check the finished file:

```powershell
node tools\checklevels.cjs
```

This reads `levels.js` back, checks the rules again, and plays every level with
a robot that can run, jump, wall jump and climb. All 48 must pass. It also
reports any spot you could fall into and not get out of.

It also checks full excavation and three fixed partial blast patterns in
every level. The flag, keys and gems must still be in reach, with no trapped
spots. `terrain.js` holds the same protection rules used by the game.

Check the game controls, saves and combat too:

```sh
node tools/checkgame.cjs
node tools/checklevels.cjs
```

These need only Node.js. There is no build step and no package to install.

The game checks also cover corner nudges, held-jump gravity and height,
3-pixel wall reach, one-wall and shaft climbs, sprite-only stretch and
squash, and the keyboard and touch hints on the start screen.

To check the new movement and hints against the old game:

```sh
GAME_SOURCE_REF=24481a3 node tools/checkgame.cjs
```

The old 15 checks and the wall-climb guards must pass on that old source.
The new feature checks must fail. Both level solvers keep the old wall-jump
model and conservative jump ranges: held jumps gain less than one pixel
of height.

### The letters in a level

| Letter | Meaning |
| --- | --- |
| `.` | empty air |
| `#` | ground. Earth can break; protected rock stays solid |
| `%` | fake wall. Looks like rock. You walk through it |
| `=` | thin platform |
| `^` | spikes |
| `~` | lava |
| `\|` | ladder |
| `/` | cracked block. Digging or a weapon can smash it unless it is protected |
| `+` | locked door |
| `k` | key |
| `T` | spring |
| `o` | coin |
| `g` | hidden gem |
| `P` | where the ninja starts |
| `F` | the flag (the finish) |

Power ups:

| Letter | Power up |
| --- | --- |
| `H` | heart |
| `M` | max up |
| `*` | star |
| `B` | jump boots |
| `R` | rapid fire |

Weapon boxes:

| Letter | Weapon |
| --- | --- |
| `1` | Shotgun |
| `2` | Rocket |
| `3` | Flame |
| `4` | Laser |
| `5` | Boomerang |
| `6` | Bombs |
| `7` | Ice Gun. A **bonus** box, not the level's weapon. It only shows up in the game once you buy the Ice Gun in the shop |

Every level must have at least one box from `1` to `6`, because those are free.
A `7` box is always extra on top of that, so a player who has not bought the
Ice Gun is never left with no weapon. Boss levels never get a `7`, because a
boss cannot be frozen. Both `tools/genlevels.cjs` and `tools/checklevels.cjs`
enforce all three of these rules.

Enemies:

| Letter | Enemy |
| --- | --- |
| `Z` | Zombie |
| `S` | Skeleton |
| `W` | Snowman |
| `V` | Bat |
| `U` | Mummy |
| `C` | Scorpion |
| `I` | Imp |
| `G` | Lava Blob |
| `N` | Shadow Ninja |
| `Y` | Ghost |
| `A` | Harpy |
| `E` | Golem |
| `L` | Slime |
| `O` | Crab |
| `f` | Drone |
| `j` | Sentry |

Bosses:

| Letter | Boss |
| --- | --- |
| `K` | Skull King |
| `J` | Frost Giant |
| `Q` | Mummy Lord |
| `D` | Fire Dragon |
| `X` | Shadow Master |
| `b` | Storm Bird |
| `8` | Crystal Queen |
| `9` | Iron Titan |

Careful: every letter must be used **once** in the whole game. `7` is the Ice
Gun, so the Storm Bird uses `b`. `I` is the Imp, so the Ice Gun could not use
`I`. Before you add a new letter, check it is not already an enemy, a boss, a
power up, a weapon or a tile.

### Rules for a level that works

1. Every row in a level must have the same number of letters.
2. Each level needs exactly one `P`. It needs one `F`, or one boss letter.
3. Make lava and holes 3 tiles wide or less. One held jump goes about 4 tiles.
4. Keep spikes and enemies 3 tiles away from the edge of a hole.
5. Do not put a platform right above spikes or an enemy.
6. Do not put a platform above lava or a hole.
7. A spring needs 7 empty rows above it.
8. A star `*` goes between 35% and 65% of the way along the level. A **boss
   level never has a star**. It gets a rapid fire `R` instead.
9. A locked door `+` needs its key `k` on the side you start from.
10. Every level needs exactly 3 gems `g`.
11. On a maze level, keep a ledge at least 4 tiles wide, keep the drop to it
    4 rows or less, and leave a free column each side so you can always get
    back off it.
12. Do not put an enemy on a ledge narrower than 5 tiles, and keep every
    enemy at least 2 tiles away from spikes and lava.
13. Every weapon box must sit on solid ground, and the robot must be able to
    reach it.

`node tools\genlevels.cjs` builds `levels.js` and checks all of these.
`node tools\checklevels.cjs` checks them again. Its movement rules are shared
with the local editor in `level-rules.js`; the generator keeps its own model.
Never edit `levels.js` by hand.

### Editor and game checks

Run these from the project folder. They need only Node.js:

```sh
node tools/checkgame.cjs
node tools/checklevels.cjs
node tools/checkeditor.cjs
```

The editor check covers paint, erase, saved data, limits and storage errors.
It also compares the shared movement rules with the independent generator on
every campaign tile. The game check covers custom rewards, death, replay,
pause, exit and returning to campaign play.

For browser checks, use an installed Playwright package with its Chromium
and WebKit browsers:

```sh
node tools/checkeditor-browser.cjs
```

If Playwright is installed outside this folder, set `PLAYWRIGHT_MODULE` to
its module path. Set `EDITOR_ARTIFACTS` to choose where screenshots and the
result JSON go. The check runs desktop and five touch screen sizes in both
browsers, using `file://index.html`. Playwright is a test tool, not a game
dependency.

## Handy tricks for testing

Open the browser console (F12) and try:

```js
NINJA.goTo(5)              // jump to level 6, the first boss
NINJA.goTo(3, 2)           // world 4, level 3
NINJA.unlockAll()          // open every level
NINJA.wipeSave()           // forget everything and start again
NINJA.giveWeapon('rocket') // hand yourself a weapon
NINJA.giveWeapon('ice')    // the ice gun
NINJA.game.score = 100
NINJA.player.starT = 600   // star power for 10 seconds
NINJA.hint                 // the maze arrow state
NINJA.hintTrail()          // the tiles the arrows point along

NINJA.giveCoins(500)       // money for the shop
NINJA.coinsLeft()          // money you can spend
NINJA.gemsLeft()           // gems you can spend
NINJA.buy('heart')         // buy a shop thing. ids: heart wind lucky ice radar gold
NINJA.owns('ice')          // how many you have bought
NINJA.openShop()           // go to the shop screen
NINJA.freeze(0, 330)       // freeze enemy number 0
NINJA.medalsOf(0)          // the 3 medal bits for level 1
NINJA.totalMedals()        // medals out of 144
NINJA.boss.hp = 5          // hurt the boss to see PHASE 2
NINJA.cam                  // where the camera is
NINJA.menuHits             // every tap box on the menu you are looking at
NINJA.menu                 // menu.wsel is the cursor on the world screen
```

To see the game loop run at full speed in a headless browser you must replace
`requestAnimationFrame` with `setTimeout`. A headless browser only draws about
2 frames a second, so every timing test is wrong without it.

## Run it on your own computer

Open `index.html` directly in a browser. The game and editor also work from
a small local web server:

```powershell
cd C:\Users\erinels\ninja-master
python -m http.server 8000
```

Then open http://localhost:8000 in a browser.

## What is in each file

| File | What it does |
| --- | --- |
| `index.html` | The page, and the touch buttons |
| `style.css` | How everything looks and where the buttons sit |
| `game.js` | The game: moving, jumping, enemies, weapons, bosses, menus, drawing |
| `terrain.js` | Shared rules for earth, firm ledges and safe digging |
| `level-editor.js`, `level-editor.css` | The touch and keyboard level editor |
| `level-data.js` | Bounded custom maps, validation and three local save slots |
| `level-rules.js` | Conservative movement model shared by the editor and checker |
| `levels.js` | The level maps. Made by the helper, do not edit |
| `tools/genlevels.cjs` | Builds `levels.js` out of chunks and checks the rules |
| `tools/checklevels.cjs` | Reads `levels.js` back and plays every level with a robot |
| `tools/checkgame.cjs` | Checks game behavior and campaign save safety |
| `tools/checkeditor.cjs` | Checks custom maps and compares both movement models |
| `tools/checkeditor-browser.cjs` | Checks the editor in Chromium and WebKit |
| `v1/` | The first version of the game, kept exactly as it was |

## Versions

**V1** was 5 worlds, 25 levels, ninja stars only. It is kept at `v1/` and it
still works. It has its own saved progress, so playing V1 does not touch V2.

**V2** is this game: 8 worlds, 48 levels, 16 enemies, 8 bosses, 8 weapons,
wall jumps, ladders, mazes, keys, doors, hidden gems and secret rooms. It also
has a shop, medals and boss phase two.

### V2 updates

- The **flame** now burns through a whole line of enemies and reaches about
  6 tiles, so you do not have to stand on top of an enemy to use it.
- The **boomerang** hits twice per throw, once each way. Before, it hurt an
  enemy every single frame while it touched them, which made bosses too easy.
- **Maze levels have arrows** that point at the key, then the flag. Press
  **H** to hide them.
- **Maze levels are fairer**: wider ledges, shorter drops, no enemy on a tiny
  ledge, no enemy next to spikes or lava.
- **No star on a boss level.** You get rapid fire instead.

### V3 updates

- **Coins are money now.** Finish a level and its coins go in your bank. Die
  and you lose that run's coins. Play the level again to get them again.
- **A shop.** From WORLD MAP, go to **SHOP**. Six things to buy with coins
  and gems: Heart Up, Second Wind, Lucky Start, Ice Gun, Gem Radar and
  Gold Ninja.
- **Gems are money too**, but the game still remembers you found them. Your
  gem count never goes down.
- **Medals.** 3 per level, 144 in the game: NO HIT, ALL GEMS, ALL COINS. You
  see them as dots on the level screen.
- **Boss PHASE 2.** At half health a boss now fires a ring of 8 shots all
  around itself, again and again, on top of everything else it does.
- **The Ice Gun.** A new weapon you buy with gems. It freezes an enemy into a
  block of ice you can stand on. Bosses cannot be frozen.
- **Fixed: hit dots never showed.** Every enemy takes more than one hit, but
  the little dots that show how many hits are left were drawing at a broken
  position, so you never saw them. Now you do.
- **Fixed: the Storm Bird had no letter.** The Ice Gun took `7`, which was
  already the Storm Bird. The Storm Bird now uses `b`.
- **Fixed: 7 levels had no weapon.** Adding the Ice Gun to the level maker made
  it replace the normal weapon box in 7 levels, and Level 1 was one of them. A
  new player would have found no weapon at all. Ice boxes are now a **bonus**
  on top of the normal box, never instead of it, and never on a boss level.
- **Fixed: you could not stomp a small slime.** The two small slimes a big
  slime splits into were missing one setting, so the new ice code treated them
  as blocks of ice. You stood on thin air and could not squash them.
- **Fixed: the shop needed a finger.** The SHOP button could only be tapped.
  Now the arrow keys move onto it and SPACE opens it.

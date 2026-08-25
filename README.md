# Ninja Master

A platform game you can play in any web browser: phone, tablet, laptop.

**Play it here:** https://erinels.github.io/ninja-master/

## How to play

You are a ninja. Get to the red flag at the end of each level.

There are **5 worlds**. Each world has **5 levels**. That is **25 levels**.
The last level in each world is a **boss fight**.

### Keyboard

| Key | What it does |
| --- | --- |
| Arrow Left / Right, or A / D | Move. In a menu it moves the yellow box |
| Space, Up arrow, or W | Jump. In a menu it picks the thing |
| Enter | In a menu it picks the thing. In a level it throws a star |
| X, J, or Shift | Throw a ninja star. In a menu it goes back |
| Escape | Go back. In a level it takes you to the level select |

### Touch screen

Big round buttons appear on the screen. Left and right on one side, JUMP and
STAR on the other side.

In a menu you can just **tap the box you want**.

While you play, tapping anywhere on the game makes you jump.

Tap **MENU** at the top to leave a level and pick a different one.

## The worlds

| # | World | Enemies | Boss |
| --- | --- | --- | --- |
| 1 | Green Woods | Zombie, Skeleton | Skull King |
| 2 | Frost Peak | Snowman, Bat | Frost Giant |
| 3 | Sand Tomb | Mummy, Scorpion | Mummy Lord |
| 4 | Fire Keep | Imp, Lava Blob | Fire Dragon |
| 5 | Shadow Fort | Shadow Ninja, Ghost | Shadow Master |

## Picking a level

From the title screen you go to **PICK A WORLD**. Then you pick a level.

- A level with a **lock** on it is not open yet.
- Finish a level and the next one opens.
- Beat a boss and the next **world** opens.
- A small green square means you already finished that level.

The game **remembers** what you have opened. It saves it in the browser, so it
is still there tomorrow. It saves on that device only.

### Codes

Each world has a 4 letter code. You see it on the level screen for that world,
and again when you beat a boss.

| World | Code |
| --- | --- |
| Green Woods | LEAF |
| Frost Peak | SNOW |
| Sand Tomb | SAND |
| Fire Keep | LAVA |
| Shadow Fort | DARK |
| Every level | BOSS |

To use a code: title screen, then **I HAVE A CODE**. Type the 4 letters and
press Space, or tap the + and - boxes and then tap **GO**.

This is how you carry your place to another device, like from a laptop to a
phone.

## Rules

- You start each level with 5 hearts.
- Spikes and lava take a heart. You come back at the last safe spot, not at
  the start.
- An enemy takes a heart if it touches you.
- Jump on top of an enemy to squash it.
- A ninja star takes 1 hit point off an enemy. Small ones have 1 or 2.
- Coins give you points. The flag gives you 25 points.
- You get 1 heart back at the end of every level.
- When your hearts run out you can try the same level again.

## Power ups

Power ups are in boxes. Walk into a box to take it.

| Box | Name | What it does |
| --- | --- | --- |
| Pink heart | Heart | Gives you 1 heart back |
| Pink heart with a plus | Max Up | Gives you 1 more heart for ever, up to 8 |
| Yellow star | Star | For 8 seconds enemies die when you touch them |
| Blue boot | Jump Boots | For 14 seconds you jump higher and get a triple jump |
| Green cross | Rapid Stars | For 14 seconds you throw ninja stars much faster |

Star power does **not** save you from spikes, lava or holes. Only from enemies.

The star is the strongest power up, so it sits in the **middle** of a level.
Not at the start, and not next to the flag where it would be no use.

The small bars at the top right show how much time is left on each power up.

## Springs

A yellow spring on the ground throws you very high. Higher than any jump.
Springs are in Frost Peak and after.

## The bosses

Boss levels have no flag. To finish one you must beat the boss.

Every boss has a green bar at the top. When the bar drops to half the boss
gets **angry**: it turns red, moves faster and attacks more.

| Boss | Hearts | What it does |
| --- | --- | --- |
| Skull King | 10 | Walks, jumps and spits bones |
| Frost Giant | 12 | Jumps high and slams. The slam sends ice along the ground. Jump over it |
| Mummy Lord | 12 | Throws wraps and calls small mummies to help |
| Fire Dragon | 11 | Flies. Drops fire, then swoops past you |
| Shadow Master | 13 | Vanishes and comes back somewhere else. You cannot hit it while it is see-through |

Jump on a boss head, or hit it with ninja stars. Both take 1 hit point.

Every boss arena has hearts and a power up. Use them.

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

This reads `levels.js` back, checks the rules again, and plays every level
with a simple robot that only runs right and jumps. All 25 must pass.

### The letters in a level

| Letter | Meaning |
| --- | --- |
| `.` | empty air |
| `#` | solid ground |
| `=` | platform |
| `^` | spikes |
| `~` | lava |
| `T` | spring |
| `o` | coin |
| `P` | where the ninja starts |
| `F` | the flag (the finish) |
| `H` | heart power up |
| `M` | max up power up |
| `*` | star power up |
| `B` | jump boots power up |
| `R` | rapid stars power up |

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

Bosses:

| Letter | Boss |
| --- | --- |
| `K` | Skull King |
| `J` | Frost Giant |
| `Q` | Mummy Lord |
| `D` | Fire Dragon |
| `X` | Shadow Master |

### Rules for a level that works

1. Every row in a level must have the same number of letters. There are 17 rows.
2. Each level needs exactly one `P`. It needs one `F`, or one boss letter.
3. Make lava and holes 3 tiles wide or less. One jump goes about 4 tiles.
4. Keep spikes and enemies 3 tiles away from the edge of a hole.
5. Do not put a platform right above spikes or an enemy.
6. Do not put a platform above lava or a hole.
7. A spring needs 7 empty rows above it.
8. A star `*` goes between 35% and 65% of the way along the level.

## Handy tricks for testing

Open the browser console (F12) and try:

```js
NINJA.goTo(4)          // jump to level 5, the first boss
NINJA.goTo(3, 2)       // world 4, level 3
NINJA.unlockAll()      // open every level
NINJA.wipeSave()       // forget everything and start again
NINJA.game.score = 100
NINJA.player.starT = 600   // star power for 10 seconds
```

## Run it on your own computer

You need a small web server, because browsers block local files.

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
| `game.js` | The game: moving, jumping, enemies, power ups, bosses, menus, drawing |
| `levels.js` | The level maps. Made by the helper, do not edit |
| `tools/genlevels.cjs` | Builds `levels.js` out of chunks and checks the rules |
| `tools/checklevels.cjs` | Reads `levels.js` back and plays every level with a robot |

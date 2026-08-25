# Ninja Master

A platform game you can play in any web browser: phone, tablet, laptop.

**Play it here:** https://erinels.github.io/ninja-master/

## How to play

You are a ninja. Get to the red flag at the end of each level.

Watch out for spikes, lava, zombies and skeletons.

### Keyboard

| Key | What it does |
| --- | --- |
| Arrow Left / Right, or A / D | Move |
| Space, Up arrow, or W | Jump (press again in the air for a double jump) |
| X, J, or Shift | Throw a ninja star |

### Touch screen

Big round buttons appear on the screen. Left and right on one side, JUMP and
STAR on the other side.

Tapping anywhere on the game also makes you jump.

## Rules

- You have 5 hearts.
- Spikes and lava take a heart. You come back at the last safe spot, not at the start.
- Zombies and skeletons take a heart if they touch you.
- Jump on top of an enemy to squash it.
- A ninja star kills a zombie in 1 hit and a skeleton in 2 hits.
- Coins give you points. The flag gives you 25 points.
- When your hearts run out you can try the same level again.

## Make your own levels

Open `levels.js`. Each level is a picture made of letters:

| Letter | Meaning |
| --- | --- |
| `.` | empty air |
| `#` | solid ground |
| `=` | platform |
| `^` | spikes |
| `~` | lava |
| `o` | coin |
| `P` | where the ninja starts |
| `F` | the flag (the finish) |
| `Z` | zombie |
| `S` | skeleton |

Rules for editing:

1. Every row in a level must have the same number of letters.
2. Each level needs exactly one `P` and one `F`.
3. Make lava and holes 3 tiles wide or less. One jump goes about 4 tiles.
4. Keep spikes and enemies 3 tiles away from the edge of a hole. If not,
   you land on them at the end of a jump.
5. Do not put a platform right above spikes or an enemy. You bump your head
   on the platform and drop back onto the danger.
6. Save the file and refresh the page in the browser.

### The easy way to build levels

`levels.js` is also made by a small helper. Open `tools/genlevels.cjs`.
Near the top there is a list called `specs`. You give it numbers, not pictures:

```js
{
  name: 'First Steps',
  width: 80,
  ground: [[0, 19], [22, 49], [52, 79]],   // where the floor is
  lava: [[20, 21], [50, 51]],              // where the lava is
  plat11: [[8, 11]],                       // low platforms
  plat9: [[29, 32]],                       // high platforms
  coins10: [9, 10],                        // coins over the low platforms
  coins8: [30, 31],                        // coins over the high platforms
  row13: [[3, 'P'], [25, '^'], [35, 'Z'], [76, 'F']]
}
```

Then run it:

```powershell
node tools\genlevels.cjs
```

It checks the 3 rules above for you. If you break one, it tells you which
tile is wrong and does not save. If everything is fine it writes `levels.js`.

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
| `game.js` | The game: moving, jumping, enemies, drawing |
| `levels.js` | The level maps |
| `tools/genlevels.cjs` | Builds `levels.js` and checks your levels are possible |

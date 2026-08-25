// Builds the level maps for Ninja Master and writes levels.js
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'levels.js');

const H = 17;

function makeLevel(spec) {
  const W = spec.width;
  const rows = [];
  for (let r = 0; r < H; r++) rows.push(new Array(W).fill('.'));
  const used = {};

  const put = (r, x, c, strict) => {
    if (r < 0 || r >= H || x < 0 || x >= W) {
      throw new Error(spec.name + ': "' + c + '" at row ' + r + ' col ' + x + ' is off the map');
    }
    if (strict && used[r + ':' + x]) {
      throw new Error(spec.name + ': two things share row ' + r + ' col ' + x);
    }
    used[r + ':' + x] = true;
    rows[r][x] = c;
  };
  const fill = (r0, r1, x0, x1, c) => {
    for (let r = r0; r <= r1; r++) for (let x = x0; x <= x1; x++) put(r, x, c, false);
  };

  (spec.ground || []).forEach(([a, b]) => fill(14, 16, a, b, '#'));
  (spec.lava || []).forEach(([a, b]) => fill(14, 16, a, b, '~'));
  (spec.plat11 || []).forEach(([a, b]) => fill(11, 11, a, b, '='));
  (spec.plat9 || []).forEach(([a, b]) => fill(9, 9, a, b, '='));
  (spec.coins10 || []).forEach((x) => put(10, x, 'o', true));
  (spec.coins8 || []).forEach((x) => put(8, x, 'o', true));
  (spec.row13 || []).forEach(([x, c]) => put(13, x, c, true));
  (spec.extras || []).forEach(([r, x, c]) => put(r, x, c, true));

  return rows.map((r) => r.join(''));
}

// Rules that keep every level possible to finish:
//   1. Lava and holes are 3 tiles wide or less. One jump goes about 4 tiles.
//   2. Spikes and enemies stay 3 tiles away from the edge of a hole.
//      If not, the ninja lands on them at the end of a jump.
//   3. No platform sits above spikes or an enemy. If one did, the ninja
//      would bump its head on the platform and drop back onto the danger.
//   4. No platform sits above lava or a hole, or the ninja bumps its head
//      in the middle of a long jump.
const specs = [
  {
    name: 'First Steps',
    width: 80,
    ground: [[0, 19], [22, 49], [52, 79]],
    lava: [[20, 21], [50, 51]],
    plat11: [[8, 11], [44, 47], [66, 69]],
    plat9: [[34, 37], [72, 75]],
    coins10: [9, 10, 45, 46, 67, 68],
    coins8: [35, 36, 73, 74],
    row13: [[3, 'P'], [12, 'o'], [14, 'o'], [26, 'o'], [27, 'o'], [30, '^'], [31, '^'],
            [40, 'Z'], [60, 'S'], [70, 'o'], [76, 'F']],
    extras: [[10, 47, 'B'], [13, 55, 'H']]
  },
  {
    name: 'Bone Yard',
    width: 96,
    ground: [[0, 14], [18, 34], [38, 44], [48, 62], [66, 72], [76, 95]],
    lava: [[15, 17], [35, 37], [63, 65]],
    plat11: [[19, 22], [59, 62], [84, 87]],
    plat9: [[31, 34], [76, 79]],
    coins10: [20, 21, 60, 61, 85, 86],
    coins8: [32, 33, 77, 78],
    row13: [[2, 'P'], [8, 'Z'], [22, 'o'], [23, 'o'], [26, '^'], [27, '^'],
            [41, 'S'], [52, 'Z'], [56, '^'], [69, 'S'], [80, 'o'], [82, 'o'], [92, 'F']],
    extras: [[10, 62, 'R'], [13, 51, 'H'], [8, 79, 'B']]
  },
  {
    name: 'Lava Castle',
    width: 110,
    ground: [[0, 11], [15, 28], [32, 45], [49, 62], [66, 79], [83, 109]],
    lava: [[12, 14], [29, 31], [46, 48], [63, 65], [80, 82]],
    plat11: [[6, 9], [32, 35], [58, 61], [86, 89]],
    plat9: [[32, 35], [59, 62], [87, 90]],
    coins10: [7, 8, 33, 34, 59, 60, 87, 88],
    coins8: [33, 34, 60, 61, 88, 89],
    row13: [[2, 'P'], [20, 'Z'], [24, '^'], [25, '^'], [38, 'S'], [42, '^'],
            [55, 'Z'], [72, 'S'], [76, '^'], [100, 'o'], [102, 'o'], [104, 'o'], [106, 'F']],
    extras: [[8, 35, 'M'], [8, 90, '*'], [13, 96, 'H']]
  },
  {
    name: 'Spike Bridge',
    width: 104,
    ground: [[0, 15], [19, 34], [38, 53], [57, 72], [76, 103]],
    lava: [],
    plat11: [[19, 22], [57, 60], [80, 83]],
    plat9: [[29, 32], [88, 91]],
    coins10: [20, 21, 58, 59, 81, 82],
    coins8: [30, 31, 89, 90],
    row13: [[2, 'P'], [6, '^'], [7, '^'], [11, 'Z'], [25, 'o'], [26, 'o'],
            [41, '^'], [42, '^'], [46, 'S'], [50, '^'], [64, '^'], [65, '^'],
            [69, 'Z'], [95, 'S'], [100, 'F']],
    extras: [[10, 22, 'B'], [8, 32, 'R'], [13, 33, 'H']]
  },
  {
    name: 'Ghost Town',
    width: 108,
    ground: [[0, 13], [17, 29], [33, 46], [50, 63], [67, 80], [84, 107]],
    lava: [[30, 32], [64, 66]],
    plat11: [[17, 20], [50, 53], [96, 99]],
    plat9: [[39, 42], [88, 91]],
    coins10: [18, 19, 51, 52, 97, 98],
    coins8: [40, 41, 89, 90],
    row13: [[2, 'P'], [5, 'Z'], [9, 'Z'], [24, 'S'], [27, 'o'], [36, 'Z'],
            [44, 'o'], [56, 'Z'], [60, 'S'], [73, 'Z'], [76, '^'], [86, 'o'],
            [104, 'F']],
    extras: [[13, 34, 'H'], [10, 99, '*'], [8, 91, 'M']]
  },
  {
    name: 'Sky Temple',
    width: 112,
    ground: [[0, 12], [16, 28], [32, 44], [48, 60], [64, 76], [80, 92], [96, 111]],
    lava: [[13, 15], [45, 47], [77, 79]],
    plat11: [[19, 22], [51, 54], [83, 86], [99, 102]],
    plat9: [[35, 38], [67, 70], [104, 107]],
    coins10: [20, 21, 52, 53, 84, 85, 100, 101],
    coins8: [36, 37, 68, 69, 105, 106],
    row13: [[2, 'P'], [5, '^'], [6, '^'], [9, 'Z'], [22, 'o'], [25, 'S'],
            [38, 'o'], [41, 'Z'], [54, 'o'], [57, '^'], [70, 'o'], [73, 'S'],
            [86, 'o'], [89, 'Z'], [109, 'F']],
    extras: [[10, 22, 'R'], [8, 38, 'B'], [10, 102, '*'], [8, 107, 'H']]
  },
  {
    name: 'Skull King',
    width: 64,
    boss: true,
    ground: [[0, 63]],
    lava: [],
    plat11: [[12, 15], [46, 49]],
    plat9: [],
    coins10: [13, 14, 47, 48],
    coins8: [],
    row13: [[3, 'P'], [52, 'K']],
    extras: [[13, 26, 'H'], [13, 36, '*'], [10, 15, 'R'], [10, 49, 'H']]
  }
];

const DANGER = ['^', 'Z', 'S'];

function checkSpec(spec) {
  const solidAt = (x) => (spec.ground || []).some(([a, b]) => x >= a && x <= b);
  const clearAround = (x, pad) => {
    for (let i = x - pad; i <= x + pad; i++) {
      if (i < 0 || i >= spec.width) continue;
      if (!solidAt(i)) return false;
    }
    return true;
  };

  const blocked = [];
  (spec.row13 || []).forEach(([x, c]) => {
    if (!solidAt(x)) throw new Error(spec.name + ': "' + c + '" at ' + x + ' has no floor');
    const danger = DANGER.indexOf(c) >= 0;
    if (!clearAround(x, danger ? 3 : 2)) {
      throw new Error(spec.name + ': "' + c + '" at ' + x + ' is too near a pit edge');
    }
    if (danger) for (let i = x - 2; i <= x + 2; i++) blocked.push(i);
  });

  (spec.extras || []).forEach(([r, x, c]) => {
    if (r === 13 && !solidAt(x)) {
      throw new Error(spec.name + ': "' + c + '" at ' + x + ' has no floor');
    }
    if (r === 10 && !(spec.plat11 || []).some(([a, b]) => x >= a && x <= b)) {
      throw new Error(spec.name + ': "' + c + '" at ' + x + ' has no platform under it');
    }
    if (r === 8 && !(spec.plat9 || []).some(([a, b]) => x >= a && x <= b)) {
      throw new Error(spec.name + ': "' + c + '" at ' + x + ' has no platform under it');
    }
  });

  const plats = (spec.plat11 || []).concat(spec.plat9 || []);
  plats.forEach(([a, b]) => {
    for (let x = a; x <= b; x++) {
      if (blocked.indexOf(x) >= 0) {
        throw new Error(spec.name + ': platform at ' + x + ' sits above danger');
      }
      if (!solidAt(x)) {
        throw new Error(spec.name + ': platform at ' + x + ' sits above lava or a hole');
      }
    }
  });

  const gaps = [];
  let run = 0;
  for (let x = 0; x < spec.width; x++) {
    if (solidAt(x)) { if (run) { gaps.push(run); run = 0; } } else { run++; }
  }
  if (run) gaps.push(run);
  const worst = gaps.length ? Math.max.apply(null, gaps) : 0;
  if (worst > 3) throw new Error(spec.name + ': a gap is ' + worst + ' tiles wide (max 3)');

  const chars = (spec.row13 || []).map(([, c]) => c);
  if (spec.boss) {
    if (chars.indexOf('K') < 0) throw new Error(spec.name + ': a boss level needs a K');
  } else if (chars.indexOf('F') < 0) {
    throw new Error(spec.name + ': no flag (F) to finish on');
  }
  if (chars.indexOf('P') < 0) throw new Error(spec.name + ': no start (P)');

  return worst;
}

let out = `// Level maps for Ninja Master.
// Each level is a grid of characters. You can edit these to build your own levels!
//   .  empty air        #  solid ground      =  platform
//   ^  spikes (ouch)    ~  lava (ouch)       o  coin
//   P  where the ninja starts                F  the flag (finish)
//   Z  zombie           S  skeleton          K  the Skull King boss
// Power ups you can pick up:
//   H  one heart back                        M  one more heart for ever
//   *  star power, enemies die if you touch them
//   B  jump boots, higher jumps and a triple jump
//   R  rapid stars, throw ninja stars much faster
// Every row in a level must have the same number of characters.
//
// Four rules to keep a level possible:
//   1. Make lava and holes 3 tiles wide or less. One jump goes about 4 tiles.
//   2. Keep spikes and enemies 3 tiles away from the edge of a hole.
//   3. Do not put a platform right above spikes or an enemy.
//   4. Do not put a platform above lava or a hole.

const LEVELS = [
`;

specs.forEach((spec, i) => {
  const worst = checkSpec(spec);
  const rows = makeLevel(spec);
  rows.forEach((r) => {
    if (r.length !== spec.width) throw new Error('bad row width in ' + spec.name);
  });
  const joined = rows.map((r) => "    '" + r + "'").join(',\n');
  out += `  {\n    name: '${spec.name}',\n    rows: [\n${joined}\n    ]\n  }${i < specs.length - 1 ? ',' : ''}\n`;
  console.log(spec.name, spec.width + 'x' + H, 'widest gap', worst);
});

out += '];\n';

fs.writeFileSync(OUT, out);
console.log('wrote', OUT);

// Builds the level maps for Ninja Master and writes levels.js
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'levels.js');

const H = 17;

function makeLevel(spec) {
  const W = spec.width;
  const rows = [];
  for (let r = 0; r < H; r++) rows.push(new Array(W).fill('.'));

  const put = (r, x, c) => {
    if (r < 0 || r >= H || x < 0 || x >= W) throw new Error('out of range ' + r + ',' + x);
    rows[r][x] = c;
  };
  const fill = (r0, r1, x0, x1, c) => {
    for (let r = r0; r <= r1; r++) for (let x = x0; x <= x1; x++) put(r, x, c);
  };

  (spec.ground || []).forEach(([a, b]) => fill(14, 16, a, b, '#'));
  (spec.lava || []).forEach(([a, b]) => fill(14, 16, a, b, '~'));
  (spec.plat11 || []).forEach(([a, b]) => fill(11, 11, a, b, '='));
  (spec.plat9 || []).forEach(([a, b]) => fill(9, 9, a, b, '='));
  (spec.coins10 || []).forEach((x) => put(10, x, 'o'));
  (spec.coins8 || []).forEach((x) => put(8, x, 'o'));
  (spec.row13 || []).forEach(([x, c]) => put(13, x, c));

  return rows.map((r) => r.join(''));
}

// Rules that keep every level possible to finish:
//   1. Lava and holes are 3 tiles wide or less. One jump goes about 4 tiles.
//   2. Spikes and enemies stay 3 tiles away from the edge of a hole.
//      If not, the ninja lands on them at the end of a jump.
//   3. No platform sits above spikes or an enemy. If one did, the ninja
//      would bump its head on the platform and drop back onto the danger.
const specs = [
  {
    name: 'First Steps',
    width: 80,
    ground: [[0, 19], [22, 49], [52, 79]],
    lava: [[20, 21], [50, 51]],
    plat11: [[8, 11], [42, 45], [66, 69]],
    plat9: [[29, 32], [72, 75]],
    coins10: [9, 10, 43, 44, 67, 68],
    coins8: [30, 31, 73, 74],
    row13: [[3, 'P'], [12, 'o'], [14, 'o'], [25, '^'], [26, '^'], [35, 'Z'],
            [40, 'o'], [41, 'o'], [60, 'S'], [69, 'o'], [76, 'F']]
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
            [41, 'S'], [52, 'Z'], [56, '^'], [69, 'S'], [80, 'o'], [82, 'o'], [92, 'F']]
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
            [55, 'Z'], [72, 'S'], [76, '^'], [100, 'o'], [102, 'o'], [104, 'o'], [106, 'F']]
  }
];

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
    const danger = (c === '^' || c === 'Z' || c === 'S');
    if (!clearAround(x, danger ? 3 : 2)) {
      throw new Error(spec.name + ': "' + c + '" at ' + x + ' is too near a pit edge');
    }
    if (danger) for (let i = x - 2; i <= x + 2; i++) blocked.push(i);
  });

  const plats = (spec.plat11 || []).concat(spec.plat9 || []);
  plats.forEach(([a, b]) => {
    for (let x = a; x <= b; x++) {
      if (blocked.indexOf(x) >= 0) {
        throw new Error(spec.name + ': platform at ' + x + ' sits above danger');
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
  return worst;
}

let out = `// Level maps for Ninja Master.
// Each level is a grid of characters. You can edit these to build your own levels!
//   .  empty air        #  solid ground      =  platform
//   ^  spikes (ouch)    ~  lava (ouch)       o  coin
//   P  where the ninja starts                F  the flag (finish)
//   Z  zombie           S  skeleton
// Every row in a level must have the same number of characters.
//
// Three rules to keep a level possible:
//   1. Make lava and holes 3 tiles wide or less. One jump goes about 4 tiles.
//   2. Keep spikes and enemies 3 tiles away from the edge of a hole.
//   3. Do not put a platform right above spikes or an enemy.

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

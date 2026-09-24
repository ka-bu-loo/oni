import fs from 'node:fs';
const html = JSON.parse(fs.readFileSync('wiki-cache/Food_(Resource).json')).parse.text['*'];
const foods = [];
for (const row of html.split('<tr>')) {
  const name = row.match(/<img alt="([^"]+)"/),
    kcal = row.match(/<td>\s*([\d,]+) kcal per kg/),
    quality = row.match(/<td data-sort-value="(-?\d+)">/);
  if (!name || !kcal || !quality) continue;
  let n = name[1]
    .replace('Resource Mushroom Quiche', 'Mushroom Quiche')
    .replace('Resource Souffle Pancakes', 'Soufflé Pancakes')
    .replace('Surf N Turf', "Surf'n'Turf");
  const pack = row.split('</th>')[1] || '';
  foods.push({
    name: n,
    kcal: Number(kcal[1].replaceAll(',', '')),
    q: +quality[1],
    dlc: pack.includes('The Aquatic Planet Pack')
      ? 'Aquatic'
      : pack.includes('The Prehistoric Planet Pack')
        ? 'Prehistoric'
        : pack.includes('The Frosty Planet Pack')
          ? 'Frosty'
          : pack.includes('Spaced Out')
            ? 'Spaced Out'
            : 'Base',
  });
}
fs.writeFileSync(
  'foods.js',
  '// Snapshot of the wiki food table, audited September 2026.\nexport const foods = ' +
    JSON.stringify(foods, null, 2) +
    ';\n',
);
console.log(foods.length, foods.map((x) => x.name).join(', '));

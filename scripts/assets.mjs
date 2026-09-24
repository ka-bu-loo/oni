import fs from 'node:fs';
import { foods, plants, critters, recipes, foraged, asset, wiki, choices } from '../catalog.js';
import { diets } from '../diets.js';
const names = new Set([
  ...foods.map((f) => f.name),
  ...Object.keys(plants),
  ...Object.values(plants).map((p) => p.name),
  ...Object.keys(critters),
  ...Object.values(foraged),
  'Mimillet',
  'Nori',
  'Tublia',
  'Bonbon Tree',
  'Sweetle',
  'Delecta Vole',
  'Regolith',
  'Brine',
  'Sulfur',
  'Snow',
  'Water',
]);
for (const name of [
  'Frosty Planet Logo',
  'Aquatic Planet Logo',
  'Prehistoric Logo',
  'Spaced Out Logo',
  'Liquid Chlorine',
  'Coquina',
])
  names.add(name);
for (const p of Object.values(plants)) for (const [n] of p.inputs) names.add(n);
for (const c of Object.values(critters)) for (const [n] of c.diet) names.add(n.replace('@', ''));
for (const options of Object.values(diets))
  for (const [name] of options) names.add(name.replace('@', ''));
for (const [name, r] of Object.entries(recipes)) {
  names.add(name);
  names.add(r.station);
  for (const [n] of r.inputs) if (!n.startsWith('$')) names.add(n);
}
for (const list of Object.values(choices)) for (const n of list) names.add(n);
const images = new Map(
  fs.existsSync('asset-manifest.json')
    ? JSON.parse(fs.readFileSync('asset-manifest.json'))
        .filter((x) => x.url)
        .map((x) => [x.name, x.url])
    : [],
);
for (const file of fs.existsSync('wiki-cache') ? fs.readdirSync('wiki-cache') : []) {
  const d = JSON.parse(fs.readFileSync(`wiki-cache/${file}`));
  const html = d.parse?.text?.['*'] || '';
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const alt = m[0].match(/\balt="([^"]*)"/),
      src = m[0].match(/\bsrc="([^"]+)"/);
    if (!alt || !src) continue;
    const name = alt[1]
      .replace(/\.png$/, '')
      .replace(/^Resource /, '')
      .replace('Souffle Pancakes', 'Soufflé Pancakes')
      .replace('Surf N Turf', "Surf'n'Turf");
    let url = src[1].replace('/images/thumb/', '/images/').replace(/\.png\/[^?]+/, '.png');
    if (url.startsWith('/images/') && /\.png(?:\?|$)/.test(url))
      images.set(name, new URL(url, 'https://oxygennotincluded.wiki.gg').href);
  }
}
if (images.has('Lumber')) images.set('Wood', images.get('Lumber'));
if (images.has('Mealwood Seed')) images.set('Seeds', images.get('Mealwood Seed'));
for (const name of ['Cobalt', 'Cobalt Ore'])
  if (images.has(`${name} (Spaced Out)`)) images.set(name, images.get(`${name} (Spaced Out)`));
const valid = (file) =>
  fs.existsSync(file) &&
  fs
    .readFileSync(file)
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
const list = [...names]
  .sort()
  .map((name) => ({
    name,
    path: asset(name),
    page: wiki(name),
    url: images.get(name) || null,
    present: valid(asset(name)),
  }));
if (process.argv.includes('--download'))
  for (const item of list.filter((x) => !x.present && x.url)) {
    try {
      const response = await fetch(item.url);
      if (response.status === 429 || response.status === 403) {
        console.log(`HTTP ${response.status}; stopped. Retry later or download manually.`);
        break;
      }
      if (!response.ok) {
        console.log(`${item.name}: ${response.status}`);
        continue;
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        console.log(`${item.name}: not PNG, skipped`);
        continue;
      }
      fs.writeFileSync(item.path, bytes);
      item.present = true;
      console.log('Saved ' + item.path);
      await new Promise((r) => setTimeout(r, 6500));
    } catch (error) {
      console.log(error.message);
      break;
    }
  }
fs.writeFileSync('asset-manifest.json', JSON.stringify(list, null, 2) + '\n');
fs.writeFileSync(
  'asset-status.js',
  'export const availableAssets = new Set(' +
    JSON.stringify(list.filter((x) => x.present).map((x) => x.path)) +
    ');\n',
);
const missing = list.filter((x) => !x.present);
const row = (x) =>
  `| ${x.name} | \`${x.path}\` | [Wiki page](${x.page})${x.url ? ` · [Original PNG](${x.url})` : ''} |`;
fs.writeFileSync(
  'ASSETS.md',
  `# Image download checklist\n\n${list.length} required images; ${missing.length} still missing. Generated from the actual catalog, not a guessed wishlist.\n\n## Where to save\n\nSave every image in C:\\Users\\joe\\VscodeProjects\\oni_tool\\assets using the exact filename below. All images live together; no extra subfolders.\n\n## How to download manually\n\n1. Open the Original PNG link, when available. Otherwise open the wiki page and click the item's icon (the infobox image, not a screenshot or DLC logo).\n2. On the file page, choose **Original file** or the full-resolution image.\n3. Right-click the full image, choose **Save image as**, and save it with the exact lowercase filename listed below, keeping .png. Do not save the webpage or rename a WebP/HTML file to PNG.\n4. Keep transparency and the original dimensions. Do not crop or upscale.\n5. After adding files, run \`node scripts/assets.mjs\` to refresh the app's image inventory, then reload the preview.\n\nThe optional \`node scripts/assets.mjs --download\` downloads only missing, known original URLs, one at a time with 6.5-second spacing. It caches successful downloads and stops on 403/429. It does not rotate proxies or bypass access controls.\n\n## Still needed (${missing.length})\n\n| Image | Save as | Download |\n|---|---|---|\n${missing.map(row).join('\n')}\n\n## Already present (${list.length - missing.length})\n\nThese do not need downloading again.\n\n| Image | Saved as | Source |\n|---|---|---|\n${list
    .filter((x) => x.present)
    .map(row)
    .join(
      '\n',
    )}\n\n## Attribution\n\nGame artwork belongs to Klei Entertainment. Source: Oxygen Not Included Wiki, wiki.gg. Check each file page for its licence before redistribution. Wiki text/data attribution: CC BY-NC-SA 4.0 unless otherwise noted. This is an unofficial fan tool.\n`,
);
console.log(`${list.length} images, ${missing.length} missing; ASSETS.md updated.`);

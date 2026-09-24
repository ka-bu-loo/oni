import fs from 'node:fs';
import { availableAssets } from '../asset-status.js';
const manifest = JSON.parse(fs.readFileSync('asset-manifest.json'));
// Do not publish a partial image library or an HTML error page saved as a PNG.
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
for (const path of availableAssets) {
  if (!manifest.some((item) => item.present && item.path === path))
    throw new Error(`Image missing from deployment manifest: ${path}`);
  if (!fs.readFileSync(path).subarray(0, 8).equals(pngSignature))
    throw new Error(`Invalid PNG image: ${path}`);
}
const files = [
  'index.html',
  'index.css',
  'material.css',
  'tree-view.js',
  'modifiers.js',
  'diets.js',
  'bonus-guide.js',
  'main.js',
  'catalog.js',
  'calculator.js',
  'planning.js',
  'foods.js',
  'asset-status.js',
  'asset-manifest.json',
];
const target = '_site/food-calculator';
// Build into a fresh, narrowly scoped output folder; never publish workspace files.
fs.rmSync('_site', { recursive: true, force: true });
fs.mkdirSync(`${target}/assets`, { recursive: true });
for (const file of files) fs.copyFileSync(file, `${target}/${file}`);
fs.copyFileSync('hub.html', '_site/index.html');
for (const item of manifest.filter((x) => x.present))
  fs.copyFileSync(item.path, `${target}/${item.path}`);
console.log(
  `Built static site: ${files.length} files, ${manifest.filter((x) => x.present).length} images.`,
);

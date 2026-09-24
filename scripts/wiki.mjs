import fs from 'node:fs';
const dir = 'wiki-cache';
fs.mkdirSync(dir, { recursive: true });
for (const title of process.argv.slice(2)) {
  const file = `${dir}/${title.replaceAll(' ', '_').replaceAll('/', '_')}.json`;
  if (fs.existsSync(file)) {
    console.log(`cached ${title}`);
    continue;
  }
  const url =
    'https://oxygennotincluded.wiki.gg/api.php?' +
    new URLSearchParams({
      action: 'parse',
      page: title,
      prop: 'text|wikitext|images',
      format: 'json',
    });
  const response = await fetch(url);
  if (!response.ok) {
    console.log(`${title}: HTTP ${response.status}; stopped to respect server limits`);
    break;
  }
  const data = await response.json();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`${title}: saved`);
  await new Promise((r) => setTimeout(r, 6500));
}

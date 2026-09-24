import fs from 'node:fs';
const files=['index.html','index.css','material.css','tree-view.js','modifiers.js','diets.js','main.js','catalog.js','calculator.js','foods.js','asset-status.js','asset-manifest.json'];
const target='_site/food-calculator';
// Build into a fresh, narrowly scoped output folder; never publish workspace files.
fs.rmSync('_site',{recursive:true,force:true});
fs.mkdirSync(`${target}/assets`,{recursive:true});
for(const file of files)fs.copyFileSync(file,`${target}/${file}`);
fs.copyFileSync('hub.html','_site/index.html');
const manifest=JSON.parse(fs.readFileSync('asset-manifest.json'));
for(const item of manifest.filter(x=>x.present))fs.copyFileSync(item.path,`${target}/${item.path}`);
console.log(`Built static site: ${files.length} files, ${manifest.filter(x=>x.present).length} images.`);
